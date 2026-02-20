/**
 * Parse optional domain restriction from expression.
 * Supports "x^2 {x > 0}" syntax -- returns NaN outside the domain.
 */
export function parseDomainRestriction(expr: string): {
  fn: string;
  condition: ((x: number) => boolean) | null;
} {
  const match = expr.match(/^(.+?)\s*\{(.+)\}\s*$/);
  if (!match) return { fn: expr, condition: null };

  const fn = match[1].trim();
  const cond = match[2].trim();

  // Parse compound condition like "a < x < b"
  const rangeMatch = cond.match(
    /^(-?\d+(?:\.\d+)?)\s*(<|<=)\s*x\s*(<|<=)\s*(-?\d+(?:\.\d+)?)$/,
  );
  if (rangeMatch) {
    const lo = Number(rangeMatch[1]);
    const loStrict = rangeMatch[2] === "<";
    const hiStrict = rangeMatch[3] === "<";
    const hi = Number(rangeMatch[4]);
    return {
      fn,
      condition: (x) =>
        (loStrict ? x > lo : x >= lo) && (hiStrict ? x < hi : x <= hi),
    };
  }

  // Parse simple condition like "x > 0", "x <= 5"
  const simpleMatch = cond.match(/^x\s*(>=?|<=?|!=)\s*(-?\d+(?:\.\d+)?)$/);
  if (simpleMatch) {
    const op = simpleMatch[1];
    const val = Number(simpleMatch[2]);
    return {
      fn,
      condition: (x) => {
        switch (op) {
          case ">": return x > val;
          case ">=": return x >= val;
          case "<": return x < val;
          case "<=": return x <= val;
          case "!=": return x !== val;
          default: return true;
        }
      },
    };
  }

  return { fn, condition: null };
}
