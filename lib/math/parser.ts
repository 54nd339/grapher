import { getCE } from "@/lib/latex";
import type { ExpressionKind } from "@/types";

import * as rx from "./regex";

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
  if (rx.REGEX_SLIDER.test(trimmed)) {
    return "slider";
  }

  if (rx.REGEX_POINTS.test(trimmed)) {
    return "points";
  }

  // Inequality: includes both axis inequalities and general forms like x^2+y^2<4
  if (rx.REGEX_INEQUALITY.test(trimmed) && !rx.REGEX_INEQUALITY_STRICT.test(trimmed)) {
    return "inequality";
  }

  // Second-order differential: y'', d²y/dx², etc.
  if (rx.REGEX_DIFFERENTIAL_SECOND_ORDER.test(trimmed)) {
    return "differential";
  }

  // First-order differential: dy/dx, y', or \frac{dy}{dx} notation
  if (rx.REGEX_DIFFERENTIAL_FIRST_ORDER.test(trimmed)) {
    return "differential";
  }

  // Calculus: derivative/diff functions or integral notation
  if (rx.REGEX_CALCULUS.test(trimmed)) {
    return "calculus";
  }

  // Series: sum or product notation (LaTeX or functional)
  if (rx.REGEX_SERIES.test(trimmed)) {
    return "series";
  }

  // Parametric: contains x(t)/y(t), or comma-separated pair that references t
  if (rx.REGEX_PARAMETRIC_T_FUNC.test(trimmed) || (rx.REGEX_PARAMETRIC_COMMA.test(trimmed) && rx.REGEX_PARAMETRIC_T_VAR.test(trimmed))) {
    return "parametric";
  }

  // Polar: must start with r= or r(theta) -- not just any expression with theta
  // Prevents false positive on "y = sin(theta)" which should be algebraic
  if (rx.REGEX_POLAR.test(trimmed)) {
    return "polar";
  }

  // Implicit: equation not in y=f(x) form.
  // Catches both multi-variable curves (x²+y²=1) and vertical lines (x=4).
  if (rx.REGEX_EQUALITY.test(trimmed) && !rx.REGEX_Y_EQUALS.test(trimmed)) {
    const lhs = trimmed.split("=")[0];
    if (
      (rx.REGEX_VARIABLE_XY.test(lhs) && rx.REGEX_VARIABLE_X.test(trimmed) && rx.REGEX_VARIABLE_Y.test(trimmed)) ||
      rx.REGEX_ONLY_X.test(lhs)
    ) {
      return "implicit";
    }
  }

  // Trigonometric: primary trig function as the main operation
  // Matches both "y = sin(x)" and bare "sin(x)" without y= prefix
  if (rx.REGEX_TRIG_FUNCS.test(trimmed)) {
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
  if (rx.REGEX_CUSTOM_RENDER_FUNCS.test(expr)) {
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

/**
 * Checks if a LaTeX string is a Leibniz derivative.
 * Matches `\frac`, `\dfrac`, `\tfrac` and handles MathLive's `\mathrm{d}` or `d_upright`.
 */
export function isLeibnizDerivativeLatex(latex: string): boolean {
  return rx.REGEX_LEIBNIZ_LATEX.test(latex) || rx.REGEX_D_UPRIGHT.test(latex);
}
