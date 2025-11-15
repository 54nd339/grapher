import type { IntegralOptions } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type NerdamerInstance = any | undefined;
/* eslint-enable @typescript-eslint/no-explicit-any */

type ManualIntegration = {
  expression: string;
  steps: string[];
};

type IntegrationContext = {
  nerdamerInstance: NerdamerInstance;
  expression: string;
  variable: string;
};

export type SymbolicIntegrationResult = {
  ok: boolean;
  result?: string;
  method?: "rules" | "nerdamer";
  steps?: string[];
  error?: string;
};

const NUMBER_PATTERN = "-?\\d+(?:\\.\\d+)?";

const isNumeric = (value: string): boolean =>
  new RegExp(`^${NUMBER_PATTERN}$`).test(value);

const stripOuterParentheses = (value: string): string => {
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

const isBalanced = (value: string): boolean => {
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

const formatNumber = (value: number): string => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return value.toString();
  const rounded = Math.abs(value) < 1e-10 ? 0 : value;
  if (Number.isInteger(rounded)) return rounded.toString();
  return parseFloat(rounded.toFixed(6)).toString();
};

const needsParentheses = (value: string): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith("-")) return true;
  for (const char of trimmed) {
    if (char === "+" || char === "-") return true;
  }
  return false;
};

const applyCoefficient = (expr: string, coefficient: number): string => {
  const formatted = formatNumber(coefficient);
  if (formatted === "1") return expr;
  if (formatted === "-1") return `-${expr}`;
  return needsParentheses(expr)
    ? `${formatted}*(${expr})`
    : `${formatted}*${expr}`;
};

const splitTopLevelTerms = (expression: string): string[] => {
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

const joinTerms = (terms: string[]): string => {
  return terms
    .map((term, index) => {
      const trimmed = term.trim();
      if (index === 0) return trimmed;
      if (trimmed.startsWith("-")) return `- ${trimmed.slice(1)}`;
      return `+ ${trimmed}`;
    })
    .join(" ");
};

const parseLinear = (
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

const integratePower = (
  expression: string,
  variable: string,
  coefficient: number
): ManualIntegration | null => {
  const powerMatch = expression.match(
    new RegExp(`^${variable}\\^(${NUMBER_PATTERN})$`)
  );

  if (powerMatch) {
    const exponent = parseFloat(powerMatch[1]);
    if (exponent === -1) {
      const base = `ln(|${variable}|)`;
      return {
        expression: applyCoefficient(base, coefficient),
        steps: ["Applied logarithmic rule (∫ x^-1 dx = ln|x|)"]
      };
    }

    const nextExponent = exponent + 1;
    const factor = coefficient / nextExponent;
    const base = `${variable}^${formatNumber(nextExponent)}`;

    return {
      expression: applyCoefficient(base, factor),
      steps: ["Applied power rule"],
    };
  }

  if (expression === variable) {
    const base = `${variable}^2`;
    return {
      expression: applyCoefficient(base, coefficient / 2),
      steps: ["Applied power rule (n = 1)"]
    };
  }

  return null;
};

const integrateExponential = (
  expression: string,
  variable: string,
  coefficient: number
): ManualIntegration | null => {
  const expMatch = expression.match(/^exp\((.+)\)$/i);
  if (expMatch) {
    const linear = parseLinear(expMatch[1], variable);
    if (linear) {
      const factor = coefficient / linear.factor;
      const base = `exp(${linear.expression})`;
      return {
        expression: applyCoefficient(base, factor),
        steps: ["Applied exponential rule"],
      };
    }
  }

  const ePowerMatch = expression.match(/^e\^\((.+)\)$/i);
  if (ePowerMatch) {
    const linear = parseLinear(ePowerMatch[1], variable);
    if (linear) {
      const factor = coefficient / linear.factor;
      const base = `e^(${linear.expression})`;
      return {
        expression: applyCoefficient(base, factor),
        steps: ["Applied exponential rule"],
      };
    }
  }

  const basePowMatch = expression.match(
    new RegExp(`^(\d+(?:\.\d+)?)\^\((.+)\)$`)
  );

  if (basePowMatch) {
    const base = parseFloat(basePowMatch[1]);
    const linear = parseLinear(basePowMatch[2], variable);
    if (linear && base > 0 && base !== 1) {
      const factor = coefficient / (linear.factor * Math.log(base));
      const result = `${base}^(${linear.expression})`;
      return {
        expression: applyCoefficient(result, factor),
        steps: ["Applied a^u rule"],
      };
    }
  }

  return null;
};

const integrateTrig = (
  expression: string,
  variable: string,
  coefficient: number
): ManualIntegration | null => {
  const trigMatch = expression.match(/^(sin|cos|tan|cot)\((.+)\)$/i);
  if (trigMatch) {
    const fn = trigMatch[1].toLowerCase();
    const inner = trigMatch[2];
    const linear = parseLinear(inner, variable);
    if (!linear) return null;

    switch (fn) {
      case "sin": {
        const base = `cos(${linear.expression})`;
        return {
          expression: applyCoefficient(base, -(coefficient / linear.factor)),
          steps: ["∫ sin(u) du = -cos(u)"]
        };
      }
      case "cos": {
        const base = `sin(${linear.expression})`;
        return {
          expression: applyCoefficient(base, coefficient / linear.factor),
          steps: ["∫ cos(u) du = sin(u)"]
        };
      }
      case "tan": {
        const base = `ln(|cos(${linear.expression})|)`;
        return {
          expression: applyCoefficient(base, -(coefficient / linear.factor)),
          steps: ["∫ tan(u) du = -ln|cos(u)|"],
        };
      }
      case "cot": {
        const base = `ln(|sin(${linear.expression})|)`;
        return {
          expression: applyCoefficient(base, coefficient / linear.factor),
          steps: ["∫ cot(u) du = ln|sin(u)|"],
        };
      }
      default:
        return null;
    }
  }

  const powerMatch = expression.match(/^(sec|csc)\((.+)\)\^(2)$/i);
  if (powerMatch) {
    const fn = powerMatch[1].toLowerCase();
    const inner = powerMatch[2];
    const linear = parseLinear(inner, variable);
    if (!linear) return null;

    if (fn === "sec") {
      const base = `tan(${linear.expression})`;
      return {
        expression: applyCoefficient(base, coefficient / linear.factor),
        steps: ["∫ sec^2(u) du = tan(u)"]
      };
    }

    const base = `-cot(${linear.expression})`;
    return {
      expression: applyCoefficient(base, coefficient / linear.factor),
      steps: ["∫ csc^2(u) du = -cot(u)"]
    };
  }

  const productMatch = expression.match(/^(sec|csc)\((.+)\)\*?(tan|cot)\((.+)\)$/i);
  if (productMatch) {
    const first = productMatch[1].toLowerCase();
    const second = productMatch[3].toLowerCase();
    const innerA = productMatch[2];
    const innerB = productMatch[4];
    if (innerA !== innerB) return null;
    const linear = parseLinear(innerA, variable);
    if (!linear) return null;

    if (first === "sec" && second === "tan") {
      const base = `sec(${linear.expression})`;
      return {
        expression: applyCoefficient(base, coefficient / linear.factor),
        steps: ["∫ sec(u)tan(u) du = sec(u)"]
      };
    }

    if (first === "csc" && second === "cot") {
      const base = `-csc(${linear.expression})`;
      return {
        expression: applyCoefficient(base, coefficient / linear.factor),
        steps: ["∫ csc(u)cot(u) du = -csc(u)"]
      };
    }
  }

  return null;
};

const integrateLog = (
  expression: string,
  variable: string,
  coefficient: number
): ManualIntegration | null => {
  const logMatch = expression.match(/^(ln|log)\((.+)\)$/i);
  if (!logMatch) return null;

  const inner = logMatch[2];
  const linear = parseLinear(inner, variable);
  if (!linear) return null;

  const factor = coefficient / linear.factor;
  const base = `${inner}*(ln(${inner}) - 1)`;
  return {
    expression: applyCoefficient(base, factor),
    steps: ["Integrated ln(ax+b) via substitution"],
  };
};

const integrateInverseTrig = (
  expression: string,
  variable: string,
  coefficient: number
): ManualIntegration | null => {
  const arcsinMatch = expression.match(/^1\/sqrt\(1-(.+)\^2\)$/i);
  if (arcsinMatch) {
    const inner = arcsinMatch[1];
    const linear = parseLinear(inner, variable);
    if (!linear) return null;

    const base = `arcsin(${inner})`;
    return {
      expression: applyCoefficient(base, coefficient / linear.factor),
      steps: ["∫ 1/sqrt(1-u^2) du = arcsin(u)"]
    };
  }

  const arctanMatch = expression.match(/^1\/(1\+(.+)\^2)$/i);
  if (arctanMatch) {
    const inner = arctanMatch[1];
    const linear = parseLinear(inner, variable);
    if (!linear) return null;

    const base = `arctan(${inner})`;
    return {
      expression: applyCoefficient(base, coefficient / linear.factor),
      steps: ["∫ 1/(1+u^2) du = arctan(u)"]
    };
  }

  return null;
};

const normalizeExpression = (
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

const parseMaybeFraction = (value: string): number | null => {
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

const integrateTerm = (
  rawTerm: string,
  variable: string
): ManualIntegration | null => {
  let term = rawTerm.replace(/\s+/g, "");
  if (!term) return null;

  if (isNumeric(term)) {
    const value = parseFloat(term);
    return {
      expression: applyCoefficient(variable, value),
      steps: ["Integrated constant term"],
    };
  }

  let coefficient = 1;
  if (term.startsWith("-")) {
    coefficient = -1;
    term = term.slice(1);
  } else if (term.startsWith("+")) {
    term = term.slice(1);
  }

  term = stripOuterParentheses(term);

  const starIndex = term.indexOf("*");
  if (starIndex > 0) {
    const candidate = stripOuterParentheses(term.slice(0, starIndex));
    const parsed = parseMaybeFraction(candidate);
    if (parsed !== null) {
      coefficient *= parsed;
      term = term.slice(starIndex + 1);
    }
  } else {
    const fractionMatch = term.match(new RegExp(`^(.+)\/(${NUMBER_PATTERN})$`));
    if (fractionMatch) {
      const denom = parseFloat(fractionMatch[2]);
      if (denom !== 0) {
        coefficient /= denom;
        term = stripOuterParentheses(fractionMatch[1]);
      }
    }
  }

  const powerResult = integratePower(term, variable, coefficient);
  if (powerResult) return powerResult;

  const expResult = integrateExponential(term, variable, coefficient);
  if (expResult) return expResult;

  const trigResult = integrateTrig(term, variable, coefficient);
  if (trigResult) return trigResult;

  const logResult = integrateLog(term, variable, coefficient);
  if (logResult) return logResult;

  const inverseTrigResult = integrateInverseTrig(term, variable, coefficient);
  if (inverseTrigResult) return inverseTrigResult;

  return null;
};

const integrateByRules = (
  normalizedExpression: string,
  variable: string
): ManualIntegration | null => {
  const terms = splitTopLevelTerms(normalizedExpression);
  if (terms.length === 1) {
    return integrateTerm(terms[0], variable);
  }

  const integratedTerms: string[] = [];
  const steps: string[] = [];

  for (const term of terms) {
    const result = integrateTerm(term, variable);
    if (!result) return null;
    integratedTerms.push(result.expression);
    steps.push(...result.steps);
  }

  return {
    expression: joinTerms(integratedTerms),
    steps,
  };
};

const tidySymbolicString = (value: string): string => {
  return value
    .replace(/\*\*/g, "^")
    .replace(/\s+/g, "")
    .replace(/\+\-/g, "-")
    .replace(/--/g, "+");
};

export const integrateSymbolically = ({
  nerdamerInstance,
  expression,
  variable,
}: IntegrationContext): SymbolicIntegrationResult => {
  const normalized = normalizeExpression(expression, nerdamerInstance);
  const manual = integrateByRules(normalized, variable);

  if (manual) {
    return {
      ok: true,
      result: manual.expression,
      method: "rules",
      steps: manual.steps,
    };
  }

  if (!nerdamerInstance) {
    return {
      ok: false,
      error: "Symbolic engine unavailable. Try again on the client side.",
    };
  }

  try {
    const integral = nerdamerInstance.integrate(expression, variable);
    const simplified = nerdamerInstance(integral);
    const resultString = tidySymbolicString(
      simplified.toString ? simplified.toString() : String(simplified)
    );

    return {
      ok: true,
      result: resultString,
      method: "nerdamer",
      steps: ["Evaluated using Nerdamer symbolic integration"],
    };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message,
    };
  }
};

export const describeIntegralFailure = (
  expression: string,
  variable: string,
  options: IntegralOptions
): string => {
  const variant = options.variant ?? (options.bounds ? "definite" : "indefinite");
  const suffix = variant === "definite" && options.bounds
    ? ` on [${options.bounds[0]}, ${options.bounds[1]}]`
    : "";
  return `Could not determine a symbolic integral for ${expression} d${variable}${suffix}`;
};
