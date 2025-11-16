import type { MathKeyboardKeyDef } from "@/types";

/**
 * Builds the common mathematical symbols keys
 */
export function buildCommonKeys(mode: "expression" | "latex"): MathKeyboardKeyDef[] {
  return [
    { label: "π", insert: mode === "latex" ? "\\pi" : "pi", aria: "pi" },
    { label: "e", insert: "e", aria: "Euler's number" },
    { label: "∞", insert: mode === "latex" ? "\\infty" : "inf", aria: "infinity" },
    { label: "±", insert: mode === "latex" ? "\\pm" : "+-", aria: "plus minus" },
    { label: "√", insert: mode === "latex" ? "\\sqrt{}" : "sqrt()", aria: "square root" },
  ];
}

/**
 * Builds the trigonometric and logarithmic function keys
 */
export function buildTrigKeys(mode: "expression" | "latex"): MathKeyboardKeyDef[] {
  return [
    { label: "sin", insert: mode === "latex" ? "\\sin" : "sin", aria: "sine" },
    { label: "cos", insert: mode === "latex" ? "\\cos" : "cos", aria: "cosine" },
    { label: "tan", insert: mode === "latex" ? "\\tan" : "tan", aria: "tangent" },
    { label: "ln", insert: mode === "latex" ? "\\ln" : "ln", aria: "natural log" },
    { label: "log", insert: mode === "latex" ? "\\log" : "log", aria: "log" },
  ];
}

/**
 * Builds the calculus operation keys
 */
export function buildCalcKeys(mode: "expression" | "latex"): MathKeyboardKeyDef[] {
  return [
    {
      label: "d/dx",
      insert: mode === "latex" ? "\\frac{d}{dx} " : "d/dx ",
      aria: "derivative",
    },
    {
      label: "∫",
      insert: mode === "latex" ? "\\int " : "int ",
      aria: "integral",
    },
    {
      label: "∫ a→b",
      insert: mode === "latex" ? "\\int_{a}^{b} " : "int_a^b ",
      aria: "definite integral",
    },
    {
      label: "Σ",
      insert: mode === "latex" ? "\\sum_{i=1}^{n} " : "sum_{i=1}^n ",
      aria: "summation",
    },
    {
      label: "Π",
      insert: mode === "latex" ? "\\prod_{k=1}^{n} " : "prod_{k=1}^n ",
      aria: "product",
    },
  ];
}

/**
 * Builds the miscellaneous structure keys
 */
export function buildMiscKeys(mode: "expression" | "latex"): MathKeyboardKeyDef[] {
  return [
    { label: "(", insert: "(", aria: "left parenthesis" },
    { label: ")", insert: ")", aria: "right parenthesis" },
    { label: "^", insert: mode === "latex" ? "^{}" : "^", aria: "power" },
    { label: ",", insert: ",", aria: "comma" },
    { label: "|x|", insert: mode === "latex" ? "|x|" : "abs(x)", aria: "absolute value" },
  ];
}

