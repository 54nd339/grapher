import { ceCompile, type EvalFn } from "./ce-compile";

/**
 * Attempt to rearrange an implicit ODE to explicit form y' = f(x,y).
 *
 * Users may write "x + yy' = 0" instead of "y' = -x/y".
 * This tries to algebraically isolate y' by treating the expression
 * as linear in y': F(x,y) + G(x,y)*y' = 0 → y' = -F/G
 *
 * Strategy: evaluate the expression at y'=0 to get F, then at y'=1 to get F+G,
 * derive G = (F+G) - F. If G != 0, y' = -F/G.
 */
export function rearrangeImplicitODE(
  expr: string,
): { rhs: string; rhsFn: EvalFn } | null {
  // Remove " = 0" or "= 0" suffix
  const cleaned = expr.replace(/\s*=\s*0\s*$/, "").trim();
  if (!cleaned) return null;

  // Replace y' with a single-letter placeholder that CE's LaTeX parser
  // handles as a plain variable (underscores are parsed as subscripts).
  const PLACEHOLDER = "W";
  const withPlaceholder = cleaned.replace(/y'/g, PLACEHOLDER);

  const compiled = ceCompile(withPlaceholder);
  if (!compiled) return null;

  // Test at a few (x,y) points to verify the rearrangement works
  const testPoints: [number, number][] = [[1, 1], [2, 3], [-1, 2]];

  for (const [tx, ty] of testPoints) {
    const f0 = compiled({ x: tx, y: ty, [PLACEHOLDER]: 0 });
    const f1 = compiled({ x: tx, y: ty, [PLACEHOLDER]: 1 });
    if (typeof f0 !== "number" || typeof f1 !== "number") return null;
    if (!isFinite(f0) || !isFinite(f1)) continue;
    const g = f1 - f0;
    // If G is effectively zero at all test points, can't isolate y'
    if (Math.abs(g) < 1e-12) continue;

    // Build the rearranged function: y' = -F(x,y) / G(x,y)
    const rhsFn: EvalFn = (scope) => {
      const fVal = compiled({ ...scope, [PLACEHOLDER]: 0 });
      const gVal = compiled({ ...scope, [PLACEHOLDER]: 1 }) - fVal;
      if (typeof fVal !== "number" || !isFinite(fVal)) return NaN;
      if (typeof gVal !== "number" || !isFinite(gVal) || Math.abs(gVal) < 1e-15) return NaN;
      return -fVal / gVal;
    };

    return { rhs: `-((${cleaned.replace(/y'/g, "0")}) / (coefficient))`, rhsFn };
  }

  return null;
}

/**
 * Convert a second-order ODE y'' = f(x, y, y') into a system of first-order ODEs.
 * Returns a function suitable for the vector RK4 integrator: [y, y'] → [y', y'']
 */
export function secondOrderToSystem(
  rhsExpr: string,
): ((t: number, state: number[]) => number[]) | null {
  const compiled = ceCompile(rhsExpr);
  if (!compiled) return null;

  return (t: number, state: number[]) => {
    const [y, yp] = state;
    const val = compiled({ x: t, y, yp });
    const ypp = typeof val === "number" && isFinite(val) ? val : 0;
    return [yp, ypp];
  };
}
