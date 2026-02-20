/**
 * Bidirectional conversion between LaTeX strings and plain expressions.
 *
 * latexToExpr: LaTeX → plain text (for kind detection + legacy rendering code)
 * exprToLatex: plain text → LaTeX (for solver output display, delegates to CE)
 *
 * NOTE: For evaluation / compilation, prefer ceCompileFromLatex() which
 * parses LaTeX directly via CE — no lossy plain-text round-trip.
 */

import { ComputeEngine, type MathJsonExpression } from "@cortex-js/compute-engine";

let _ce: ComputeEngine | null = null;
export function getCE(): ComputeEngine {
  if (!_ce) _ce = new ComputeEngine();
  return _ce;
}

/* ── Symbol / function lookup tables ───────────────────── */

const SYMBOL_MAP: Record<string, string> = {
  Pi: "pi", ExponentialE: "e", ImaginaryUnit: "i", Nothing: "",
  True: "true", False: "false",
  PositiveInfinity: "Infinity", NegativeInfinity: "-Infinity", ComplexInfinity: "Infinity",
};

const FN_MAP: Record<string, string> = {
  Sin: "sin", Cos: "cos", Tan: "tan", Sec: "sec", Csc: "csc", Cot: "cot",
  Sinh: "sinh", Cosh: "cosh", Tanh: "tanh",
  Arcsin: "asin", Arccos: "acos", Arctan: "atan",
  Arcsinh: "asinh", Arccosh: "acosh", Arctanh: "atanh",
  Sqrt: "sqrt", Exp: "exp", Abs: "abs",
  Ceil: "ceil", Floor: "floor", Round: "round", Sign: "sign",
  Factorial: "factorial", GCD: "gcd", LCM: "lcm",
  Determinant: "det", Trace: "trace", Transpose: "transpose", Inverse: "inv",
};

const INVERSE_TRIG: Record<string, string> = {
  Sin: "asin", Cos: "acos", Tan: "atan", Sec: "asec", Csc: "acsc", Cot: "acot",
  Sinh: "asinh", Cosh: "acosh", Tanh: "atanh",
};

/* ── Helpers ───────────────────────────────────────────── */

const ADDITIVE = new Set(["Add", "Subtract", "Negate"]);

function isAdditive(j: MathJsonExpression) {
  return Array.isArray(j) && typeof j[0] === "string" && ADDITIVE.has(j[0]);
}

function isCompound(j: MathJsonExpression) {
  if (!Array.isArray(j) || typeof j[0] !== "string") return false;
  const op = j[0];
  return ADDITIVE.has(op) || op === "Multiply" || op === "InvisibleOperator" || op === "Divide";
}

function wrap(j: MathJsonExpression) {
  const s = jsonToExpr(j);
  return isAdditive(j) ? `(${s})` : s;
}

function bounds(b: MathJsonExpression): MathJsonExpression[] | null {
  if (!Array.isArray(b) || typeof b[0] !== "string") return null;
  return (b[0] === "Triple" || b[0] === "Tuple" || b[0] === "Limits") ? b.slice(1) as MathJsonExpression[] : null;
}

function functionHeadToExpr(head: MathJsonExpression): string | null {
  if (typeof head === "string") return jsonToExpr(head);
  if (Array.isArray(head) && head[0] === "Power") {
    const base = jsonToExpr(head[1] as MathJsonExpression);
    const exponent = jsonToExpr(head[2] as MathJsonExpression);
    return `${base}^${exponent}`;
  }
  return null;
}

/* ── MathJSON → plain text ─────────────────────────────── */

function jsonToExpr(json: MathJsonExpression): string {
  // Primitives
  if (typeof json === "number") return Object.is(json, -0) ? "0" : String(json);
  if (typeof json === "string") return SYMBOL_MAP[json] ?? json;

  // Boxed values: { num, sym, str, fn }
  if (typeof json === "object" && !Array.isArray(json)) {
    if ("num" in json) {
      const n = (json as { num: string }).num;
      if (n === "+Infinity") return "Infinity";
      if (n === "-Infinity") return "-Infinity";
      if (n === "NaN") return "NaN";
      return n;
    }
    if ("sym" in json) return SYMBOL_MAP[(json as { sym: string }).sym] ?? (json as { sym: string }).sym;
    if ("str" in json) return (json as { str: string }).str;
    if ("fn" in json) return jsonToExpr((json as { fn: MathJsonExpression[] }).fn as unknown as MathJsonExpression);
    return "";
  }

  if (!Array.isArray(json) || json.length === 0) return "";
  const [head, ...args] = json as [string, ...MathJsonExpression[]];
  if (typeof head !== "string") return "";

  // Arithmetic
  if (head === "Add") {
    if (!args.length) return "0";
    const parts = [jsonToExpr(args[0])];
    for (let i = 1; i < args.length; i++) {
      const a = args[i];
      if (Array.isArray(a) && a[0] === "Negate" && a.length === 2)
        parts.push(` - ${wrap(a[1] as MathJsonExpression)}`);
      else parts.push(` + ${jsonToExpr(a)}`);
    }
    return parts.join("");
  }
  if (head === "Subtract") return args.length === 1 ? `-(${jsonToExpr(args[0])})` : `${jsonToExpr(args[0])} - ${wrap(args[1])}`;
  if (head === "Negate") { const s = jsonToExpr(args[0]); return isAdditive(args[0]) ? `-(${s})` : `-${s}`; }
  if (head === "Multiply" || head === "InvisibleOperator") {
    if (
      args.length >= 2 &&
      Array.isArray(args[1]) &&
      args[1][0] === "Delimiter"
    ) {
      const fnName = functionHeadToExpr(args[0]);
      if (!fnName) {
        return args.map(a => isAdditive(a) ? `(${jsonToExpr(a)})` : jsonToExpr(a)).join(" * ");
      }
      const fnArg = jsonToExpr((args[1][1] ?? "") as MathJsonExpression);
      if (args.length === 2) return `${fnName}(${fnArg})`;
      const rest = args
        .slice(2)
        .map((a) => (isAdditive(a) ? `(${jsonToExpr(a)})` : jsonToExpr(a)))
        .join(" * ");
      return `${fnName}(${fnArg}) * ${rest}`;
    }
    return args.map(a => isAdditive(a) ? `(${jsonToExpr(a)})` : jsonToExpr(a)).join(" * ");
  }
  if (head === "Divide" || head === "Rational") return `(${jsonToExpr(args[0])}) / (${jsonToExpr(args[1])})`;
  if (head === "Power") { const b = jsonToExpr(args[0]); const e = jsonToExpr(args[1]); return isCompound(args[0]) ? `(${b})^(${e})` : `${b}^(${e})`; }

  // Mapped functions (trig, sqrt, etc.)
  if (head in FN_MAP) return `${FN_MAP[head]}(${args.map(a => jsonToExpr(a)).join(", ")})`;

  // Special functions
  if (head === "Ln") return `log(${jsonToExpr(args[0])})`;
  if (head === "Log") return args.length >= 2 ? `log(${jsonToExpr(args[0])}, ${jsonToExpr(args[1])})` : `log10(${jsonToExpr(args[0])})`;
  if (head === "Lb") return `log(${jsonToExpr(args[0])}, 2)`;
  if (head === "Root") return `nthRoot(${jsonToExpr(args[0])}, ${jsonToExpr(args[1])})`;

  // Inverse trig: \cos^{-1}(x)
  if (head === "Apply") {
    if (Array.isArray(args[0]) && args[0][0] === "InverseFunction") {
      const fn = String(args[0][1]);
      return `${INVERSE_TRIG[fn] ?? `a${fn.toLowerCase()}`}(${args.slice(1).map(a => jsonToExpr(a)).join(", ")})`;
    }
    return `${jsonToExpr(args[0])}(${args.slice(1).map(a => jsonToExpr(a)).join(", ")})`;
  }

  // Calculus
  if (head === "D") return args.length >= 2 ? `diff(${jsonToExpr(args[0])}, ${jsonToExpr(args[1])})` : `diff(${jsonToExpr(args[0])})`;
  if (head === "Integrate") {
    const body = jsonToExpr(args[0]);
    const b = args.length >= 2 ? bounds(args[1]) : null;
    if (b && b.length >= 3) return `int(${body}, ${jsonToExpr(b[0])}, ${jsonToExpr(b[1])}, ${jsonToExpr(b[2])})`;
    return args.length >= 2 ? `int(${body}, ${jsonToExpr(args[1])})` : `int(${body})`;
  }
  if (head === "Sum") {
    const body = jsonToExpr(args[0]);
    const b = args.length >= 2 ? bounds(args[1]) : null;
    if (b && b.length >= 3) return `sum(${body}, ${jsonToExpr(b[0])}, ${jsonToExpr(b[1])}, ${jsonToExpr(b[2])})`;
    return `sum(${body}, n, 0, 10)`;
  }
  if (head === "Product") {
    const body = jsonToExpr(args[0]);
    const b = args.length >= 2 ? bounds(args[1]) : null;
    if (b && b.length >= 3) return `prod(${body}, ${jsonToExpr(b[0])}, ${jsonToExpr(b[1])}, ${jsonToExpr(b[2])})`;
    return `prod(${body}, n, 1, 10)`;
  }

  // Comparisons
  if (head === "Equal") return `${jsonToExpr(args[0])} = ${jsonToExpr(args[1])}`;
  if (head === "Greater") return `${jsonToExpr(args[0])} > ${jsonToExpr(args[1])}`;
  if (head === "Less") return `${jsonToExpr(args[0])} < ${jsonToExpr(args[1])}`;
  if (head === "GreaterEqual") return `${jsonToExpr(args[0])} >= ${jsonToExpr(args[1])}`;
  if (head === "LessEqual") return `${jsonToExpr(args[0])} <= ${jsonToExpr(args[1])}`;
  if (head === "NotEqual") return `${jsonToExpr(args[0])} != ${jsonToExpr(args[1])}`;

  // Structures
  if (head === "List") return `[${args.map(a => jsonToExpr(a)).join(", ")}]`;
  if (head === "Matrix") return args.length > 0 ? jsonToExpr(args[0]) : "[]";

  // Piecewise / Which
  if (head === "Which") {
    const pairs: string[] = [];
    for (let i = 0; i < args.length; i += 2) {
      const val = i + 1 < args.length ? jsonToExpr(args[i + 1]) : "";
      pairs.push(`${val} {${jsonToExpr(args[i])}}`);
    }
    return pairs.join(", ");
  }
  if (head === "Piecewise") {
    return args.map(a => {
      if (Array.isArray(a) && typeof a[0] === "string" && ["Pair", "Tuple", "Triple"].includes(a[0])) {
        const [, expr, cond] = a as [string, MathJsonExpression, MathJsonExpression?];
        return cond !== undefined ? `${jsonToExpr(expr)} {${jsonToExpr(cond)}}` : jsonToExpr(expr);
      }
      return jsonToExpr(a);
    }).join(", ");
  }

  // Decorations
  if (head === "Prime") return jsonToExpr(args[0]) + "'".repeat(typeof args[1] === "number" ? args[1] : 1);
  if (head === "Subscript") return jsonToExpr(args[0]);

  // Containers / metadata — pass through or ignore
  if (head === "Delimiter" || head === "Hold") return args.length > 0 ? jsonToExpr(args[0]) : "";
  if (head === "Sequence" || head === "Pair" || head === "Triple" || head === "Tuple" || head === "Limits")
    return args.map(a => jsonToExpr(a)).join(", ");
  if (head === "Error" || head === "LatexString") return "";
  if (head === "Complex") return `complex(${jsonToExpr(args[0])}, ${jsonToExpr(args[1])})`;
  if (head === "InverseFunction") return args.length > 0 ? jsonToExpr(args[0]) : "";

  // Fallback: generic function call
  return `${head}(${args.map(a => jsonToExpr(a)).join(", ")})`;
}

/* ── Public API ────────────────────────────────────────── */

function normalizePlainSqrt(input: string): string {
  let index = 0;
  let output = "";

  while (index < input.length) {
    const tail = input.slice(index);
    const match = /^sqrt\s*\(/.exec(tail);
    const prevChar = index > 0 ? input[index - 1] : "";
    const isWordBoundary = !/[a-zA-Z0-9_\\]/.test(prevChar);

    if (!match || !isWordBoundary) {
      output += input[index];
      index++;
      continue;
    }

    const openParenIndex = index + match[0].lastIndexOf("(");
    let depth = 1;
    let cursor = openParenIndex + 1;
    while (cursor < input.length && depth > 0) {
      const ch = input[cursor];
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      cursor++;
    }

    if (depth !== 0) {
      output += input[index];
      index++;
      continue;
    }

    const inner = input.slice(openParenIndex + 1, cursor - 1);
    output += `\\sqrt{${normalizePlainSqrt(inner)}}`;
    index = cursor;
  }

  return output;
}

/**
 * Normalize user-entered LaTeX-ish text into CE-friendly LaTeX.
 */
export function normalizeLatexInput(latex: string): string {
  return normalizePlainSqrt(
    latex
      .replace(/\\dfrac/g, "\\frac")
      .replace(/\\tfrac/g, "\\frac")
      .replace(/\\frac\s*([A-Za-z0-9])\s*([A-Za-z0-9])/g, "\\frac{$1}{$2}")
      .replace(/\\neq/g, "\\ne")
      .replace(/\\abs\s*\(/g, "abs(")
      .replace(/\\abs\{([^{}]+)\}/g, "abs($1)"),
  );
}

export function latexToExpr(latex: string): string {
  if (!latex.trim()) return "";
  const normalized = normalizeLatexInput(latex).trim();

  // CE drops bounds for forms like \sum_2^{100} n (without explicit index variable).
  // Preserve bounds via direct LaTeX fallback before CE parse.
  const sumNoIndex = normalized.match(/^\\sum_\{?([^{}]+)\}?\^\{?([^{}]+)\}?\s*(.+)$/);
  if (sumNoIndex) {
    const [, lower, upper, body] = sumNoIndex;
    return `sum(${body.trim()}, n, ${lower.trim()}, ${upper.trim()})`;
  }

  const prodNoIndex = normalized.match(/^\\prod_\{?([^{}]+)\}?\^\{?([^{}]+)\}?\s*(.+)$/);
  if (prodNoIndex) {
    const [, lower, upper, body] = prodNoIndex;
    return `prod(${body.trim()}, n, ${lower.trim()}, ${upper.trim()})`;
  }

  try {
    const expr = getCE().parse(normalized, { form: "raw" });
    return jsonToExpr(expr.json);
  } catch {
    return "";
  }
}

/**
 * Convert a plain expression to LaTeX for display.
 */
export function exprToLatex(expr: string): string {
  if (!expr.trim()) return expr;
  try {
    return getCE().parse(expr, { strict: false }).latex;
  } catch {
    return expr;
  }
}
