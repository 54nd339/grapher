import type { Expression, IComputeEngine } from "@cortex-js/compute-engine";

export interface ExtractedIntegral {
  id: string;
  integrand: Expression;
  variable: string;
  lower: Expression;
  upper: Expression;
}

type BoxArg = Parameters<IComputeEngine["box"]>[0];

/**
 * CE wraps complex integrands in ["Function", ["Block", body], var].
 * The Function node can't be compiled as a numeric evaluator, so we
 * unwrap it to extract the raw body expression.
 */
function unwrapIntegrand(json: unknown): { body: unknown; variable: string } {
  if (
    Array.isArray(json) &&
    json[0] === "Function" &&
    json.length >= 3
  ) {
    const innerBody = Array.isArray(json[1]) && json[1][0] === "Block"
      ? json[1][1]
      : json[1];
    const variable = typeof json[2] === "string" ? json[2] : "t";
    return { body: innerBody, variable };
  }
  return { body: json, variable: "t" };
}

/**
 * Recursively walks the CE AST, replacing every `Integrate` node with a
 * placeholder symbol (`__int_N`).  Collects each integral's unwrapped
 * integrand, variable, and symbolic lower/upper bounds so the caller can
 * compile and evaluate them independently.
 *
 * Handles both simple (`"t"`) and wrapped (`["Function",["Block",…],var]`)
 * integrands, as well as arbitrary symbolic bounds (`sin(x)`, `x^2`, …).
 */
export function extractIntegrals(
  expr: Expression,
  ce: IComputeEngine,
  countObj = { count: 0 }
): { expr: Expression; integrals: ExtractedIntegral[] } {
  const json = expr.json;
  const integrals: ExtractedIntegral[] = [];

  if (!Array.isArray(json)) return { expr, integrals };

  const head = json[0];

  if (head === "Integrate" && json.length >= 3) {
    const { body, variable: fnVar } = unwrapIntegrand(json[1]);

    const inner = extractIntegrals(ce.box(body as BoxArg), ce, countObj);
    integrals.push(...inner.integrals);

    // CE stores definite limits as ["Limits", var, lo, hi]
    const limitsIdx = json.findIndex(
      (arg, i) => i >= 2 && Array.isArray(arg) && arg[0] === "Limits"
    );

    let variable = fnVar;
    let lo: BoxArg = 0;
    let hi: BoxArg = 1;

    if (limitsIdx !== -1) {
      const lim = json[limitsIdx] as unknown[];
      if (typeof lim[1] === "string") variable = lim[1];
      lo = (lim[2] ?? 0) as BoxArg;
      hi = (lim[3] ?? 1) as BoxArg;
    } else {
      const varIdx = json.findIndex((a, i) => i >= 2 && typeof a === "string");
      if (varIdx !== -1) variable = json[varIdx] as string;
    }

    // Bounds can themselves contain integrals (nested)
    const lowerRes = extractIntegrals(ce.box(lo), ce, countObj);
    integrals.push(...lowerRes.integrals);
    const upperRes = extractIntegrals(ce.box(hi), ce, countObj);
    integrals.push(...upperRes.integrals);

    const id = `__int_${countObj.count++}`;
    integrals.push({
      id,
      integrand: inner.expr,
      variable,
      lower: lowerRes.expr,
      upper: upperRes.expr,
    });

    return { expr: ce.box(id), integrals };
  }

  // Generic: recurse into children (skip head at index 0)
  const rewritten = json.map((child, i) => {
    if (i === 0) return child;
    if (typeof child === "object" || Array.isArray(child)) {
      const res = extractIntegrals(ce.box(child as BoxArg), ce, countObj);
      integrals.push(...res.integrals);
      return res.expr.json;
    }
    return child;
  });

  return { expr: ce.box(rewritten as unknown as BoxArg), integrals };
}

/**
 * Synchronous composite Simpson's 1/3 rule optimised for the hot-path.
 * Uses a single mutable scope object to avoid 200× object allocations
 * per evaluation (significant at 60 fps with multiple integrals).
 */
export function syncSimpsonIntegrate(
  evalFn: (scope: Record<string, number>) => number,
  integVar: string,
  a: number,
  b: number,
  scope: Record<string, number>,
  n = 200
): number {
  if (a === b) return 0;
  if (!isFinite(a) || !isFinite(b)) return NaN;

  // Save the original value so we can restore after integration
  const saved = scope[integVar];
  const h = (b - a) / n;
  let sum = 0;

  for (let i = 0; i <= n; i++) {
    scope[integVar] = a + i * h;
    const y = evalFn(scope);
    const yv = isNaN(y) ? 0 : y;

    if (i === 0 || i === n) sum += yv;
    else if (i & 1) sum += 4 * yv;
    else sum += 2 * yv;
  }

  // Restore original scope state
  if (saved !== undefined) scope[integVar] = saved;
  else delete scope[integVar];

  return (h / 3) * sum;
}
