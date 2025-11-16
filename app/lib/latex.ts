import type { CalculationResult, Point } from "@/types";
import { formatNumber } from "@/lib/utils";

const escapeLatexText = (value: string): string =>
  value
    .replace(/\\/g, "\\textbackslash ")
    .replace(/([{}%#&_])/g, "\\$1");

export const expressionToLatex = (expression: string): string => {
  if (!expression) return "";

  return expression.replace(/\*/g, " \\cdot ");
};

const matrixToLatex = (matrix: number[][]): string => {
  if (!matrix.length) {
    return "\\begin{bmatrix}\\end{bmatrix}";
  }

  const rows = matrix
    .map((row) => row.map((val) => formatNumber(val, 4)).join(" & "))
    .join(" \\ ");

  return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
};

const vectorToLatex = (vector: number[]): string => {
  if (!vector.length) {
    return "\\begin{bmatrix}\\end{bmatrix}";
  }

  const entries = vector.map((val) => formatNumber(val, 4)).join(" \\ ");
  return `\\begin{bmatrix} ${entries} \\end{bmatrix}`;
};

const pointToLatex = (point: Point): string => {
  const values = [point.x, point.y, point.z].filter((val) => val !== undefined);
  return `\\left(${values
    .map((val) => formatNumber(val ?? 0, 4))
    .join(", ")}\\right)`;
};

const textToLatex = (value: string): string => `\\text{${escapeLatexText(value)}}`;

export const ensureLatexExponentSyntax = (value: string): string => {
  let result = "";
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (char === "^" && value[i + 1] === "(") {
      result += "^{";
      i += 2;
      let depth = 1;
      let inner = "";
      while (i < value.length && depth > 0) {
        const current = value[i];
        if (current === "(") {
          depth += 1;
        } else if (current === ")") {
          depth -= 1;
          if (depth === 0) {
            break;
          }
        }
        if (depth > 0) {
          inner += current;
        }
        i += 1;
      }
      result += inner + "}";
      continue;
    }
    result += char;
  }
  return result;
};

const LATEX_OPERATOR_MAP: Record<string, string> = {
  "\\cdot": "*",
  "\\times": "*",
  "\\div": "/",
  "\\pm": "+-",
  "\\pi": "pi",
  "\\theta": "theta",
  "\\tau": "tau",
};

const LATEX_FUNCTIONS = [
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "log",
  "ln",
  "exp",
  "arcsin",
  "arccos",
  "arctan",
];

const isBalancedBraces = (value: string): boolean => {
  let depth = 0;
  for (const char of value) {
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
};

type BraceGroup = {
  content: string;
  nextIndex: number;
};

const readBraceGroup = (value: string, start: number): BraceGroup | null => {
  if (value[start] !== "{") return null;
  let depth = 0;
  let content = "";
  for (let i = start; i < value.length; i += 1) {
    const char = value[i];
    if (char === "{") {
      depth += 1;
      if (depth === 1) continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return { content, nextIndex: i + 1 };
      }
    }
    if (depth >= 1) {
      content += char;
    }
  }
  return null;
};

const replaceFractions = (
  value: string
): { output: string; error?: string } => {
  let i = 0;
  let output = "";
  while (i < value.length) {
    if (value.startsWith("\\frac", i)) {
      i += 5;
      while (value[i] === " ") i += 1;
      const numeratorGroup = readBraceGroup(value, i);
      if (!numeratorGroup) {
        return { output: value, error: "Missing numerator group for \\frac" };
      }
      i = numeratorGroup.nextIndex;
      while (value[i] === " ") i += 1;
      const denominatorGroup = readBraceGroup(value, i);
      if (!denominatorGroup) {
        return { output: value, error: "Missing denominator group for \\frac" };
      }
      i = denominatorGroup.nextIndex;
      output += `(${numeratorGroup.content})/(${denominatorGroup.content})`;
      continue;
    }
    output += value[i];
    i += 1;
  }
  return { output };
};

const replaceSquareRoots = (
  value: string
): { output: string; error?: string } => {
  let result = "";
  for (let i = 0; i < value.length; i += 1) {
    if (value.startsWith("\\sqrt", i)) {
      i += 5;
      while (value[i] === " ") i += 1;
      const radicand = readBraceGroup(value, i);
      if (!radicand) {
        return { output: value, error: "Missing radicand for \\sqrt" };
      }
      i = radicand.nextIndex - 1;
      result += `sqrt(${radicand.content})`;
    } else {
      result += value[i];
    }
  }
  return { output: result };
};

const stripLatexDecorators = (value: string): string =>
  value
    .replace(/\\left|\\right/g, "")
    .replace(/\\!/g, "")
    .replace(/\\,/g, "")
    .replace(/~/g, "")
    .replace(/\\phantom\{[^}]+\}/g, "")
    .replace(/\s+/g, " ");

const replaceExponentGroups = (value: string): string =>
  value.replace(/\^\{([^}]*)\}/g, (_, group) => `^(${group})`);

export const expressionToEditableLatex = (expression: string): string =>
  ensureLatexExponentSyntax(expressionToLatex(expression));

// High-level LaTeX constructs -> nerdamer-style function calls
// Handles derivatives, integrals, sums and products in a single pass.
const normalizeHighLevelLatex = (latex: string): string => {
  let value = latex;

  // Derivative: \frac{d}{dx} f(x) -> diff(f(x), x)
  value = value.replace(/\\frac\{d\}\{d([a-zA-Z])\}\s*([^]+)$/g, (_m, v: string, body: string) => {
    const variable = v.trim();
    const inner = body.trim();
    return `diff(${inner}, ${variable})`;
  });

  // Integrals with bounds: \int_{a}^{b} f(x) \\; dx -> integrate(f(x), x, a, b)
  value = value.replace(/\\int_\{([^}]*)\}\^\{([^}]*)\}\s*([^]*?)d([a-zA-Z])/g, (_m, a: string, b: string, body: string, v: string) => {
    const lower = a.trim();
    const upper = b.trim();
    const variable = v.trim();
    const inner = body.trim().replace(/\\,/g, " ").replace(/\\;|\\,/g, " ");
    return `integrate(${inner}, ${variable}, ${lower}, ${upper})`;
  });

  // Indefinite integrals: \int f(x) \\; dx -> integrate(f(x), x)
  value = value.replace(/\\int\s*([^]*?)d([a-zA-Z])/g, (_m, body: string, v: string) => {
    const variable = v.trim();
    const inner = body.trim().replace(/\\;|\\,/g, " ");
    return `integrate(${inner}, ${variable})`;
  });

  // Summation: \sum_{i=a}^{b} f(i) -> sum(f(i), i, a, b)
  value = value.replace(/\\sum_\{([^=]+)=([^}]*)\}\^\{([^}]*)\}\s*([^]+)/g, (_m, idx: string, from: string, to: string, body: string) => {
    const index = idx.trim();
    const lower = from.trim();
    const upper = to.trim();
    const inner = body.trim();
    return `sum(${inner}, ${index}, ${lower}, ${upper})`;
  });

  // Product: \prod_{i=a}^{b} f(i) -> prod(f(i), i, a, b)
  value = value.replace(/\\prod_\{([^=]+)=([^}]*)\}\^\{([^}]*)\}\s*([^]+)/g, (_m, idx: string, from: string, to: string, body: string) => {
    const index = idx.trim();
    const lower = from.trim();
    const upper = to.trim();
    const inner = body.trim();
    return `prod(${inner}, ${index}, ${lower}, ${upper})`;
  });

  return value;
};

export const latexToExpression = (
  latex: string
): { expression: string; error?: string } => {
  const trimmed = latex.trim();
  if (!trimmed) {
    return { expression: "" };
  }

  if (!isBalancedBraces(trimmed)) {
    return { expression: "", error: "Unbalanced braces in LaTeX expression" };
  }

  const highLevelNormalized = normalizeHighLevelLatex(trimmed);
  const sanitizedBase = stripLatexDecorators(highLevelNormalized);
  const { output: fractionReplaced, error: fracError } = replaceFractions(sanitizedBase);
  if (fracError) {
    return { expression: "", error: fracError };
  }

  const { output: sqrtReplaced, error: sqrtError } = replaceSquareRoots(fractionReplaced);
  if (sqrtError) {
    return { expression: "", error: sqrtError };
  }

  let expression = replaceExponentGroups(sqrtReplaced);

  for (const [command, replacement] of Object.entries(LATEX_OPERATOR_MAP)) {
    const regex = new RegExp(command, "g");
    expression = expression.replace(regex, replacement);
  }

  for (const fn of LATEX_FUNCTIONS) {
    const regex = new RegExp(`\\\\${fn}`, "g");
    expression = expression.replace(regex, fn);
  }

  expression = expression
    .replace(/\\/g, "")
    .replace(/\{/g, "(")
    .replace(/\}/g, ")")
    .replace(/\s+/g, "")
    .replace(/\|/g, "|");

  const invalidPattern = /[^0-9a-zA-Z+\-*/^().,_=|]/;
  if (invalidPattern.test(expression)) {
    return {
      expression: "",
      error: "Unsupported LaTeX tokens detected. Please simplify the expression.",
    };
  }

  return { expression };
};

// Reuse the same high-level normalization for plain-text "standard" input.
// This lets users type things like "d/dx x^2" or "int_0^1 x^2 dx" in
// the standard mode and get diff()/integrate()/sum()/prod() forms.
export const normalizeHighLevelExpression = (raw: string): string => {
  let value = raw.trim();

  if (!value) return value;

  // Derivative patterns:
  // 1) d/dx x^2
  value = value.replace(/^d\s*\/\s*d([a-zA-Z])\s+(.+)$/i, (_m, v: string, body: string) => {
    const variable = v.trim();
    const inner = body.trim();
    return `diff(${inner}, ${variable})`;
  });

  // Integrals:
  // 2) int_0^1 x^2 dx
  value = value.replace(/^int_([^\^]+)\^([^\s]+)\s+(.+)d([a-zA-Z])$/i, (_m, a: string, b: string, body: string, v: string) => {
    const lower = a.trim();
    const upper = b.trim();
    const variable = v.trim();
    const inner = body.trim();
    return `integrate(${inner}, ${variable}, ${lower}, ${upper})`;
  });

  // 3) int x^2 dx (indefinite)
  value = value.replace(/^int\s+(.+)d([a-zA-Z])$/i, (_m, body: string, v: string) => {
    const variable = v.trim();
    const inner = body.trim();
    return `integrate(${inner}, ${variable})`;
  });

  // Summation:
  // 4) sum_{i=1}^n i
  value = value.replace(/^sum_\{?([^=]+)=([^}\^]+)\}?\^\{?([^}]+)\}?\s+(.+)$/i,
    (_m, idx: string, from: string, to: string, body: string) => {
      const index = idx.trim();
      const lower = from.trim();
      const upper = to.trim();
      const inner = body.trim();
      return `sum(${inner}, ${index}, ${lower}, ${upper})`;
    }
  );

  // Product:
  // 5) prod_{k=1}^n k
  value = value.replace(/^prod_\{?([^=]+)=([^}\^]+)\}?\^\{?([^}]+)\}?\s+(.+)$/i,
    (_m, idx: string, from: string, to: string, body: string) => {
      const index = idx.trim();
      const lower = from.trim();
      const upper = to.trim();
      const inner = body.trim();
      return `prod(${inner}, ${index}, ${lower}, ${upper})`;
    }
  );

  return value;
};

export const resultValueToLatex = (
  value: CalculationResult["result"]
): string => {
  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      return matrixToLatex(value as number[][]);
    }
    return vectorToLatex(value as number[]);
  }

  if (value && typeof value === "object" && "x" in value && "y" in value) {
    return pointToLatex(value as Point);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return textToLatex(" ");

    const plainTextPattern = /^[0-9a-zA-Z+\-*/^().,=|\s{}]+$/;
    if (!plainTextPattern.test(trimmed)) {
      return textToLatex(trimmed);
    }
    return ensureLatexExponentSyntax(trimmed);
  }

  return textToLatex("N/A");
};
