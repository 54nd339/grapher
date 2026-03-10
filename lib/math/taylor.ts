import { getCE } from "@/lib/latex";

/**
 * Compute the Taylor/Maclaurin series expansion of an expression.
 * Returns coefficients and a LaTeX representation.
 */
export function taylorExpansion(
  exprStr: string,
  variable: string,
  center: number,
  order: number,
): { coefficients: number[]; latex: string; evaluate: (x: number) => number } | null {
  try {
    const ce = getCE();
    const parsed = ce.parse(exprStr, { strict: false });

    const coefficients: number[] = [];
    let currentExpr = parsed;

    for (let n = 0; n <= order; n++) {
      // Evaluate n-th derivative at center
      const atCenter = currentExpr.subs({ [variable]: center });
      const val = atCenter.value;
      const numVal = typeof val === "number" ? val : NaN;

      let factorial = 1;
      for (let k = 2; k <= n; k++) factorial *= k;

      coefficients.push(isFinite(numVal) ? numVal / factorial : 0);

      // Differentiate for next iteration
      if (n < order) {
        currentExpr = ce.box(["D", currentExpr.json, variable]).evaluate();
      }
    }

    // Build LaTeX representation
    const terms: string[] = [];
    for (let n = 0; n <= order; n++) {
      const c = coefficients[n];
      if (Math.abs(c) < 1e-12) continue;
      const cStr = Math.abs(c) === 1 && n > 0 ? (c < 0 ? "-" : "") : c.toFixed(4);
      if (n === 0) {
        terms.push(cStr);
      } else if (center === 0) {
        terms.push(`${cStr}x${n > 1 ? `^{${n}}` : ""}`);
      } else {
        terms.push(`${cStr}(x-${center})${n > 1 ? `^{${n}}` : ""}`);
      }
    }

    const latex = terms.join(" + ").replace(/\+ -/g, "- ") || "0";

    return {
      coefficients,
      latex,
      evaluate: (x: number) => {
        let sum = 0;
        let power = 1;
        for (let n = 0; n <= order; n++) {
          sum += coefficients[n] * power;
          power *= x - center;
        }
        return sum;
      },
    };
  } catch {
    return null;
  }
}

/**
 * Compute the limit of an expression as variable approaches a value.
 * Uses numerical approximation from both sides.
 */
export function numericalLimit(
  exprStr: string,
  variable: string,
  approach: number,
): { value: number; leftLimit: number; rightLimit: number } | null {
  try {
    const ce = getCE();
    const parsed = ce.parse(exprStr, { strict: false });

    const eps = [1e-3, 1e-5, 1e-7, 1e-9];

    // Right-hand limit
    const rightVals: number[] = [];
    for (const e of eps) {
      const val = parsed.subs({ [variable]: approach + e }).value;
      if (typeof val === "number" && isFinite(val)) rightVals.push(val);
    }

    // Left-hand limit
    const leftVals: number[] = [];
    for (const e of eps) {
      const val = parsed.subs({ [variable]: approach - e }).value;
      if (typeof val === "number" && isFinite(val)) leftVals.push(val);
    }

    const rightLimit = rightVals.length > 0 ? rightVals[rightVals.length - 1] : NaN;
    const leftLimit = leftVals.length > 0 ? leftVals[leftVals.length - 1] : NaN;

    const value =
      isFinite(rightLimit) && isFinite(leftLimit) && Math.abs(rightLimit - leftLimit) < 1e-4
        ? (rightLimit + leftLimit) / 2
        : NaN;

    return { value, leftLimit, rightLimit };
  } catch {
    return null;
  }
}
