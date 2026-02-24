import type { EvalFn } from "./ce-compile";
import { safeEval } from "./ce-compile";


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

/**
 * Compute the slope dy/dx = -fx/fy for an implicit curve f(x,y)=0.
 */
export function implicitTangentSlope(
  fn: EvalFn,
  x: number,
  y: number,
  scope: Record<string, number>,
): number {
  const h = 1e-6;
  const f_plus_x = safeEval(fn, { ...scope, x: x + h, y });
  const f_minus_x = safeEval(fn, { ...scope, x: x - h, y });
  const fx = (f_plus_x - f_minus_x) / (2 * h);

  const f_plus_y = safeEval(fn, { ...scope, x, y: y + h });
  const f_minus_y = safeEval(fn, { ...scope, x, y: y - h });
  const fy = (f_plus_y - f_minus_y) / (2 * h);

  if (Math.abs(fy) < 1e-12) return Infinity;
  return -fx / fy;
}

/**
 * Compute curvature for an implicit curve f(x,y)=0.
 * κ = |fxx*fy^2 - 2*fxy*fx*fy + fyy*fx^2| / (fx^2 + fy^2)^(3/2)
 */
export function implicitCurvature(
  fn: EvalFn,
  x: number,
  y: number,
  scope: Record<string, number>,
): number {
  const h = 1e-4;
  const f = (x0: number, y0: number) => safeEval(fn, { ...scope, x: x0, y: y0 });

  const fx = (f(x + h, y) - f(x - h, y)) / (2 * h);
  const fy = (f(x, y + h) - f(x, y - h)) / (2 * h);

  const fxx = (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h);
  const fyy = (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h);
  const fxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);

  const num = Math.abs(fxx * fy * fy - 2 * fxy * fx * fy + fyy * fx * fx);
  const den = Math.pow(fx * fx + fy * fy, 1.5);

  if (den < 1e-15) return 0;
  return num / den;
}

/**
 * Compute the radius and center of the osculating circle for an implicit curve.
 */
export function implicitOsculatingCircle(
  fn: EvalFn,
  x: number,
  y: number,
  scope: Record<string, number>,
): { cx: number; cy: number; radius: number } | null {
  const k = implicitCurvature(fn, x, y, scope);
  if (isNaN(k) || Math.abs(k) < 1e-10) return null;

  const radius = 1 / k;
  if (radius > 1e4) return null;

  const h = 1e-4;
  const fx = (safeEval(fn, { ...scope, x: x + h, y }) - safeEval(fn, { ...scope, x: x - h, y })) / (2 * h);
  const fy = (safeEval(fn, { ...scope, x, y: y + h }) - safeEval(fn, { ...scope, x, y: y - h })) / (2 * h);

  const fxx = (safeEval(fn, { ...scope, x: x + h, y }) - 2 * safeEval(fn, { ...scope, x, y }) + safeEval(fn, { ...scope, x: x - h, y })) / (h * h);
  const fyy = (safeEval(fn, { ...scope, x, y: y + h }) - 2 * safeEval(fn, { ...scope, x, y }) + safeEval(fn, { ...scope, x, y: y - h })) / (h * h);
  const fxy = (safeEval(fn, { ...scope, x: x + h, y: y + h }) - safeEval(fn, { ...scope, x: x + h, y: y - h }) - safeEval(fn, { ...scope, x: x - h, y: y + h }) + safeEval(fn, { ...scope, x: x - h, y: y - h })) / (4 * h * h);

  const denom = fxx * fy * fy - 2 * fxy * fx * fy + fyy * fx * fx;
  if (Math.abs(denom) < 1e-15) return null;

  const factor = (fx * fx + fy * fy) / denom;
  return {
    cx: x - factor * fx,
    cy: y - factor * fy,
    radius: Math.abs(factor) * Math.sqrt(fx * fx + fy * fy)
  };
}


