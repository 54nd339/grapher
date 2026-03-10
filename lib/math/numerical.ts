import { getMathWorker } from "@/workers/math-api";

import { ceCompile } from "./ce-compile";

/**
 * Numerical integration via composite Simpson's rule.
 * The string expression is passed to the worker which evaluates and sums.
 */
export async function simpsonIntegrate(
  exprStr: string,
  isLatex: boolean,
  integVar: string,
  a: number,
  b: number,
  scope: Record<string, number>,
  n = 50,
): Promise<number> {
  if (a === b) return 0;
  if (!isFinite(a) || !isFinite(b)) return NaN;

  const worker = getMathWorker();
  return worker.simpsonIntegrate(exprStr, isLatex, integVar, a, b, scope, n);
}

/**
 * Evaluate a series partial sum: sum(body, variable, lower, upper).
 * Returns the numerical sum by looping the index variable from lower to upper.
 */
const MAX_SERIES_ITERATIONS = 10000;

export function evaluateSeriesPartialSum(
  body: string,
  variable: string,
  lower: number,
  upper: number,
  scope: Record<string, number> = {}
): number {
  try {
    if (upper - lower > MAX_SERIES_ITERATIONS) return NaN;
    const fn = ceCompile(body);
    if (!fn) return NaN;
    let total = 0;
    for (let k = lower; k <= upper; k++) {
      const val = fn({ ...scope, [variable]: k });
      if (typeof val === "number" && isFinite(val)) {
        total += val;
      }
    }
    return total;
  } catch {
    return NaN;
  }
}

/**
 * Evaluate a partial product: prod(body, variable, lower, upper).
 * Returns the numerical product by looping the index variable.
 */
export function evaluateSeriesPartialProd(
  body: string,
  variable: string,
  lower: number,
  upper: number,
  scope: Record<string, number> = {}
): number {
  try {
    if (upper - lower > MAX_SERIES_ITERATIONS) return NaN;
    const fn = ceCompile(body);
    if (!fn) return NaN;
    let total = 1;
    for (let k = lower; k <= upper; k++) {
      const val = fn({ ...scope, [variable]: k });
      if (typeof val === "number" && isFinite(val)) {
        total *= val;
      } else {
        return NaN;
      }
    }
    return total;
  } catch {
    return NaN;
  }
}
