import { ManualIntegration } from './types';
import { applyCoefficient, formatNumber, parseLinear, parseMaybeFraction, splitTopLevelTerms, joinTerms, stripOuterParentheses, isNumeric } from './utils';

export const integratePower = (
  expression: string,
  variable: string,
  coefficient: number
): ManualIntegration | null => {
  const NUMBER_PATTERN = "-?\\d+(?:\\.\\d+)?";
  const powerMatch = expression.match(
    new RegExp(`^${variable}\\^(${NUMBER_PATTERN})$`)
  );

  if (powerMatch) {
    const exponent = parseFloat(powerMatch[1]);
    if (exponent === -1) {
      const base = `ln(|${variable}|)`;
      return { expression: applyCoefficient(base, coefficient) };
    }

    const nextExponent = exponent + 1;
    const factor = coefficient / nextExponent;
    const base = `${variable}^${formatNumber(nextExponent)}`;
    return { expression: applyCoefficient(base, factor) };
  }

  if (expression === variable) {
    const base = `${variable}^2`;
    return { expression: applyCoefficient(base, coefficient / 2) };
  }

  return null;
};

export const integrateExponential = (
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
      return { expression: applyCoefficient(base, factor) };
    }
  }

  const ePowerMatch = expression.match(/^e\^\((.+)\)$/i);
  if (ePowerMatch) {
    const linear = parseLinear(ePowerMatch[1], variable);
    if (linear) {
      const factor = coefficient / linear.factor;
      const base = `e^(${linear.expression})`;
      return { expression: applyCoefficient(base, factor) };
    }
  }

  const basePowMatch = expression.match(
    new RegExp(`^(\\d+(?:\\.\\d+)?)\\^\((.+)\)$`)
  );

  if (basePowMatch) {
    const base = parseFloat(basePowMatch[1]);
    const linear = parseLinear(basePowMatch[2], variable);
    if (linear && base > 0 && base !== 1) {
      const factor = coefficient / (linear.factor * Math.log(base));
      const result = `${base}^(${linear.expression})`;
      return { expression: applyCoefficient(result, factor) };
    }
  }

  return null;
};

export const integrateTrig = (
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
      case 'sin': return { expression: applyCoefficient(`cos(${linear.expression})`, -(coefficient / linear.factor)) };
      case 'cos': return { expression: applyCoefficient(`sin(${linear.expression})`, coefficient / linear.factor) };
      case 'tan': return { expression: applyCoefficient(`ln(|cos(${linear.expression})|)`, -(coefficient / linear.factor)) };
      case 'cot': return { expression: applyCoefficient(`ln(|sin(${linear.expression})|)`, coefficient / linear.factor) };
      default: return null;
    }
  }

  const powerMatch = expression.match(/^(sec|csc)\((.+)\)\^(2)$/i);
  if (powerMatch) {
    const fn = powerMatch[1].toLowerCase();
    const inner = powerMatch[2];
    const linear = parseLinear(inner, variable);
    if (!linear) return null;

    if (fn === 'sec') {
      return { expression: applyCoefficient(`tan(${linear.expression})`, coefficient / linear.factor) };
    }
    return { expression: applyCoefficient(`-cot(${linear.expression})`, coefficient / linear.factor) };
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

    if (first === 'sec' && second === 'tan') {
      return { expression: applyCoefficient(`sec(${linear.expression})`, coefficient / linear.factor) };
    }
    if (first === 'csc' && second === 'cot') {
      return { expression: applyCoefficient(`-csc(${linear.expression})`, coefficient / linear.factor) };
    }
  }

  return null;
};

export const integrateLog = (
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
  return { expression: applyCoefficient(base, factor) };
};

export const integrateInverseTrig = (
  expression: string,
  variable: string,
  coefficient: number
): ManualIntegration | null => {
  const arcsinMatch = expression.match(/^1\/sqrt\(1-(.+)\^2\)$/i);
  if (arcsinMatch) {
    const inner = arcsinMatch[1];
    const linear = parseLinear(inner, variable);
    if (!linear) return null;
    return { expression: applyCoefficient(`arcsin(${inner})`, coefficient / linear.factor) };
  }
  const arctanMatch = expression.match(/^1\/(1\+(.+)\^2)$/i);
  if (arctanMatch) {
    const inner = arctanMatch[1];
    const linear = parseLinear(inner, variable);
    if (!linear) return null;
    return { expression: applyCoefficient(`arctan(${inner})`, coefficient / linear.factor) };
  }
  return null;
};

export const integrateTerm = (
  rawTerm: string,
  variable: string
): ManualIntegration | null => {
  let term = rawTerm.replace(/\s+/g, "");
  if (!term) return null;

  if (isNumeric(term)) {
    const value = parseFloat(term);
    return { expression: applyCoefficient(variable, value) };
  }

  let coefficient = 1;
  if (term.startsWith('-')) { coefficient = -1; term = term.slice(1); }
  else if (term.startsWith('+')) { term = term.slice(1); }

  term = stripOuterParentheses(term);

  const starIndex = term.indexOf('*');
  if (starIndex > 0) {
    const candidate = stripOuterParentheses(term.slice(0, starIndex));
    const parsed = parseMaybeFraction(candidate);
    if (parsed !== null) {
      coefficient *= parsed; term = term.slice(starIndex + 1);
    }
  } else {
    const NUMBER_PATTERN = "-?\\d+(?:\\.\\d+)?";
    const fractionMatch = term.match(new RegExp(`^(.+)\\/(${NUMBER_PATTERN})$`));
    if (fractionMatch) {
      const denom = parseFloat(fractionMatch[2]);
      if (denom !== 0) { coefficient /= denom; term = stripOuterParentheses(fractionMatch[1]); }
    }
  }

  return integratePower(term, variable, coefficient) ||
    integrateExponential(term, variable, coefficient) ||
    integrateTrig(term, variable, coefficient) ||
    integrateLog(term, variable, coefficient) ||
    integrateInverseTrig(term, variable, coefficient) ||
    null;
};

export const integrateByRules = (
  normalizedExpression: string,
  variable: string
): ManualIntegration | null => {
  const terms = splitTopLevelTerms(normalizedExpression);
  if (terms.length === 1) return integrateTerm(terms[0], variable);
  const integratedTerms: string[] = [];
  for (const term of terms) {
    const result = integrateTerm(term, variable);
    if (!result) return null;
    integratedTerms.push(result.expression);
  }
  return { expression: joinTerms(integratedTerms) };
};
