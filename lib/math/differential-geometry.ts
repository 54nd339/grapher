import type { EvalFn } from "./ce-compile";
import { safeEval } from "./safe-eval";

/**
 * Compute the arc length of f(x) over [a, b] using Simpson's rule on sqrt(1 + f'(x)^2).
 */
export function arcLength(
  fn: EvalFn,
  a: number,
  b: number,
  scope: Record<string, number>,
  n = 200,
): number {
  if (!isFinite(a) || !isFinite(b) || a >= b) return 0;
  const h = (b - a) / n;
  const H = 1e-6;

  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = a + i * h;
    const yp = safeEval(fn, { ...scope, x: x + H });
    const ym = safeEval(fn, { ...scope, x: x - H });
    const deriv = (yp - ym) / (2 * H);
    const integrand = Math.sqrt(1 + deriv * deriv);

    if (i === 0 || i === n) sum += integrand;
    else if (i % 2 === 1) sum += 4 * integrand;
    else sum += 2 * integrand;
  }
  return (h / 3) * sum;
}

/**
 * Compute the signed curvature κ(x) = f''(x) / (1 + f'(x)^2)^(3/2).
 */
export function curvature(
  fn: EvalFn,
  x: number,
  scope: Record<string, number>,
): number {
  const h = 1e-5;
  const ym = safeEval(fn, { ...scope, x: x - h });
  const y0 = safeEval(fn, { ...scope, x });
  const yp = safeEval(fn, { ...scope, x: x + h });

  if (isNaN(ym) || isNaN(y0) || isNaN(yp)) return NaN;

  const fp = (yp - ym) / (2 * h);
  const fpp = (yp - 2 * y0 + ym) / (h * h);

  const denom = Math.pow(1 + fp * fp, 1.5);
  if (denom < 1e-15) return 0;
  return fpp / denom;
}

/**
 * Compute the radius and center of the osculating circle at x.
 */
export function osculatingCircle(
  fn: EvalFn,
  x: number,
  scope: Record<string, number>,
): { cx: number; cy: number; radius: number } | null {
  const y = safeEval(fn, { ...scope, x });
  const k = curvature(fn, x, scope);

  if (isNaN(y) || isNaN(k) || Math.abs(k) < 1e-10) return null;

  const radius = 1 / Math.abs(k);
  if (radius > 1e4) return null;

  const h = 1e-5;
  const yp = safeEval(fn, { ...scope, x: x + h });
  const ym = safeEval(fn, { ...scope, x: x - h });
  const fp = (yp - ym) / (2 * h);

  const denom = 1 + fp * fp;
  const sign = k > 0 ? 1 : -1;
  const cx = x - (fp * radius) / Math.sqrt(denom);
  const cy = y + sign * radius / Math.sqrt(denom);

  return { cx, cy, radius };
}

