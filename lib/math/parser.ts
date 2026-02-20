import { getCE } from "@/lib/latex";
import type { ExpressionKind } from "@/types";

/**
 * Detect expression kind by inspecting variable usage and structure.
 * Avoids forcing users to pick a mode -- auto-detection keeps the UI zen.
 *
 * Ordered as a priority chain with early returns -- more specific
 * patterns (differential, parametric) are checked before generic ones
 * (trig, algebraic) to avoid false positives.
 */
export function detectExpressionKind(expr: string): ExpressionKind {
  const trimmed = expr.trim();
  if (!trimmed) return "algebraic";

  // Slider: single letter = numeric literal (e.g. "a = 3", "b = -1.5")
  if (/^[a-wA-W]\s*=\s*-?\d+(\.\d+)?$/.test(trimmed)) {
    return "slider";
  }

  if (/^\s*\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)\s*(,\s*\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)\s*)*$/.test(trimmed)) {
    return "points";
  }

  // Inequality: includes both axis inequalities and general forms like x^2+y^2<4
  if (/<=|>=|<|>/.test(trimmed) && !/!=/.test(trimmed)) {
    return "inequality";
  }

  // Second-order differential: y'', d²y/dx², etc.
  if (/y''|d\^?2y\/dx\^?2|\\frac\{d\^?\{?2\}?y\}\{dx\^?\{?2\}?\}/.test(trimmed)) {
    return "differential";
  }

  // First-order differential: dy/dx, y', or \frac{dy}{dx} notation
  if (/dy\/dx|y'|\\frac\{dy\}\{dx\}/.test(trimmed)) {
    return "differential";
  }

  // Calculus: derivative/diff functions or integral notation
  if (/\bderivative\(|\bdiff\(|\\int|^int\(/.test(trimmed)) {
    return "calculus";
  }

  // Series: sum or product notation (LaTeX or functional)
  if (/\\sum|\\Sigma|\bsum\(|\\prod|\bprod\(/.test(trimmed)) {
    return "series";
  }

  // Parametric: contains x(t)/y(t), or comma-separated pair that references t
  if (/\(t\)/.test(trimmed) || (/^[^=]*,[^=]*$/.test(trimmed) && /\bt\b/.test(trimmed))) {
    return "parametric";
  }

  // Polar: must start with r= or r(theta) -- not just any expression with theta
  // Prevents false positive on "y = sin(theta)" which should be algebraic
  if (/^r\s*[=(]/.test(trimmed)) {
    return "polar";
  }

  // Implicit: equation not in y=f(x) form.
  // Catches both multi-variable curves (x²+y²=1) and vertical lines (x=4).
  if (/=/.test(trimmed) && !/^y\s*=/.test(trimmed)) {
    const lhs = trimmed.split("=")[0];
    if (
      (/[xy]/.test(lhs) && /x/.test(trimmed) && /y/.test(trimmed)) ||
      /^\s*x\s*$/.test(lhs)
    ) {
      return "implicit";
    }
  }

  // Trigonometric: primary trig function as the main operation
  // Matches both "y = sin(x)" and bare "sin(x)" without y= prefix
  const trigFns = /\b(sin|cos|tan|csc|sec|cot|asin|acos|atan|sinh|cosh|tanh)\b/;
  if (trigFns.test(trimmed)) {
    return "trigonometric";
  }

  return "algebraic";
}

/**
 * Validate whether an expression can be parsed.
 * Used by ExpressionRow to show inline error indicators
 * without throwing or disrupting the render cycle.
 */
export function tryParse(expr: string): { valid: boolean; error?: string } {
  if (!expr.trim()) return { valid: true };
  // Skip validation for expressions handled by custom graph renderers
  if (/^(int|sum|prod|diff|derivative|abs|nthRoot)\(/.test(expr)) {
    return { valid: true };
  }
  try {
    const boxed = getCE().parse(expr, { strict: false });
    const json = boxed.json;
    // CE wraps unparseable input in Error nodes
    if (Array.isArray(json) && json[0] === "Error") {
      return { valid: false, error: "Invalid expression" };
    }
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : "Invalid expression",
    };
  }
}
