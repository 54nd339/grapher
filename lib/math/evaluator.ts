import { ceCompile } from "./ce-compile";

/**
 * Evaluate a series partial sum: sum(body, variable, lower, upper).
 * Returns the numerical sum by looping the index variable from lower to upper.
 *
 * Symbolic summation is fragile -- numerical loop is more robust
 * and supports arbitrary body expressions.
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
