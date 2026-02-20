import type { EvalFn } from "./ce-compile";
import { safeEval } from "./safe-eval";

/**
 * Numerical integration via composite Simpson's rule.
 * Evaluates `compiled` over `integVar` from a to b.
 */
export function simpsonIntegrate(
  compiled: EvalFn,
  integVar: string,
  a: number,
  b: number,
  scope: Record<string, number>,
  n = 50,
): number {
  if (a === b) return 0;
  if (!isFinite(a) || !isFinite(b)) return NaN;
  const h = (b - a) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const t = a + i * h;
    const y = safeEval(compiled, { ...scope, [integVar]: t });
    const yv = isNaN(y) ? 0 : y;
    if (i === 0 || i === n) sum += yv;
    else if (i % 2 === 1) sum += 4 * yv;
    else sum += 2 * yv;
  }
  return (h / 3) * sum;
}
