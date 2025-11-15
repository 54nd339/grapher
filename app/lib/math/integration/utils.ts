import { NerdamerInstance } from './types';

export const NUMBER_PATTERN = "-?\\d+(?:\\.\\d+)?";

export const isNumeric = (value: string): boolean =>
  new RegExp(`^${NUMBER_PATTERN}$`).test(value);

export const stripOuterParentheses = (value: string): string => {
  let result = value;
  while (
    result.length > 1 &&
    result.startsWith("(") &&
    result.endsWith(")") &&
    isBalanced(result.substring(1, result.length - 1))
  ) {
    result = result.substring(1, result.length - 1);
  }
  return result;
};

export const isBalanced = (value: string): boolean => {
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    else if (char === ")") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
};

export const formatNumber = (value: number): string => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return value.toString();
  const rounded = Math.abs(value) < 1e-10 ? 0 : value;
  if (Number.isInteger(rounded)) return rounded.toString();
  return parseFloat(rounded.toFixed(6)).toString();
};

export const needsParentheses = (value: string): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith("-")) return true;
  for (const char of trimmed) {
    if (char === "+" || char === "-") return true;
  }
  return false;
};

export const applyCoefficient = (expr: string, coefficient: number): string => {
  const formatted = formatNumber(coefficient);
  if (formatted === "1") return expr;
  if (formatted === "-1") return `-${expr}`;
  return needsParentheses(expr)
    ? `${formatted}*(${expr})`
    : `${formatted}*${expr}`;
};

export const splitTopLevelTerms = (expression: string): string[] => {
  const terms: string[] = [];
  let buffer = "";
  let depth = 0;

  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;

    if (depth === 0 && i > 0 && (char === "+" || char === "-")) {
      terms.push(buffer);
      buffer = char;
      continue;
    }

    buffer += char;
  }

  if (buffer) terms.push(buffer);
  return terms.map((term, index) =>
    index === 0 ? term : term.replace(/^([+-])/, " $1 ")
  );
};

export const joinTerms = (terms: string[]): string => {
  return terms
    .map((term, index) => {
      const trimmed = term.trim();
      if (index === 0) return trimmed;
      if (trimmed.startsWith("-")) return `- ${trimmed.slice(1)}`;
      return `+ ${trimmed}`;
    })
    .join(" ");
};

export const parseLinear = (
  inner: string,
  variable: string
): { factor: number; expression: string } | null => {
  const cleaned = stripOuterParentheses(inner.replace(/\s+/g, ""));

  if (cleaned === variable) {
    return { factor: 1, expression: variable };
  }

  const directMatch = cleaned.match(
    new RegExp(`^(${NUMBER_PATTERN})\\*${variable}$`)
  );
  if (directMatch) {
    return { factor: parseFloat(directMatch[1]), expression: `${directMatch[1]}*${variable}` };
  }

  const swappedMatch = cleaned.match(
    new RegExp(`^${variable}\\*(${NUMBER_PATTERN})$`)
  );
  if (swappedMatch) {
    return { factor: parseFloat(swappedMatch[1]), expression: `${variable}*${swappedMatch[1]}` };
  }

  const offsetMatch = cleaned.match(
    new RegExp(`^(${NUMBER_PATTERN})\\*${variable}([+-]${NUMBER_PATTERN})$`)
  );
  if (offsetMatch) {
    return {
      factor: parseFloat(offsetMatch[1]),
      expression: `${offsetMatch[1]}*${variable}${offsetMatch[2]}`,
    };
  }

  const unitOffset = cleaned.match(
    new RegExp(`^${variable}([+-]${NUMBER_PATTERN})$`)
  );
  if (unitOffset) {
    return { factor: 1, expression: `${variable}${unitOffset[1]}` };
  }

  return null;
};

export const normalizeExpression = (
  expression: string,
  nerdamerInstance: NerdamerInstance
): string => {
  const cleaned = expression.replace(/\s+/g, "").replace(/\*\*/g, "^");
  if (!nerdamerInstance) return cleaned;

  try {
    const normalized = nerdamerInstance(cleaned);
    if (normalized.expand) {
      return normalized.expand().toString();
    }
    return normalized.toString();
  } catch {
    return cleaned;
  }
};

export const parseMaybeFraction = (value: string): number | null => {
  if (isNumeric(value)) return parseFloat(value);
  const parts = value.split("/");
  if (parts.length === 2 && isNumeric(parts[0]) && isNumeric(parts[1])) {
    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }
  return null;
};

export const tidySymbolicString = (value: string): string => {
  return value
    .replace(/\*\*/g, "^")
    .replace(/\s+/g, "")
    .replace(/\+\-/g, "-")
    .replace(/--/g, "+");
};
