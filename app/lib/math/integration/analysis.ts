import { parseLinear, tidySymbolicString } from './utils';
import { NerdamerInstance, SymbolicIntegrationResult } from './types';
import { integrateByRules } from './rules';

// Domain & discontinuities
export const analyzeDomain = (expr: string, variable: string): { discontinuities: number[]; issues: string[] } => {
  const NUMBER_PATTERN = "-?\\d+(?:\\.\\d+)?";
  const discontinuities: number[] = [];
  const issues: string[] = [];
  const divisionPattern = new RegExp(`/(-?${NUMBER_PATTERN})?\\*?${variable}([+-]${NUMBER_PATTERN})?`, 'g');
  let match: RegExpExecArray | null;
  while ((match = divisionPattern.exec(expr)) !== null) {
    const aRaw = match[1];
    const bRaw = match[2];
    const a = aRaw ? parseFloat(aRaw) : 1;
    const b = bRaw ? parseFloat(bRaw) : 0;
    if (a !== 0) discontinuities.push(-b / a);
  }
  const logPattern = /(ln|log)\(([^()]+)\)/g;
  while ((match = logPattern.exec(expr)) !== null) {
    const inner = match[2];
    if (inner.includes(variable)) {
      const linear = parseLinear(inner, variable);
      issues.push(linear ? `ln/log argument > 0 ⇒ ${inner} > 0` : `Check positivity of ${inner}`);
    }
  }
  const sqrtPattern = /sqrt\(([^()]+)\)/g;
  while ((match = sqrtPattern.exec(expr)) !== null) {
    const inner = match[1];
    if (inner.includes(variable)) issues.push(`sqrt argument ≥ 0 ⇒ ${inner} ≥ 0`);
  }
  return { discontinuities, issues };
};

// Additional rational discontinuity detection using nerdamer factoring if available.
export const analyzeRational = (expr: string, variable: string, nerdamerInstance: NerdamerInstance): number[] => {
  if (!nerdamerInstance) return [];
  const discontinuities: number[] = [];
  // Find denominators by splitting on '/'
  const fractionParts = expr.split('/').slice(1); // skip first numerator segment
  for (const part of fractionParts) {
    // heuristic: denominator ends at next + or - at top level
    const candidate = part.split(/(?=[+-])/)[0];
    if (!candidate.includes(variable)) continue;
    try {
      const eq = nerdamerInstance(candidate);
      const poly = eq.expand ? eq.expand() : eq;
      if (poly.solve) {
        const sols = poly.solve(variable);
        const list = Array.isArray(sols) ? sols : [sols];
        for (const s of list) {
          const valStr = s.toString ? s.toString() : String(s);
          const num = parseFloat(valStr);
          if (!Number.isNaN(num) && Number.isFinite(num)) discontinuities.push(num);
        }
      }
    } catch {
      // ignore parse failures
    }
  }
  return discontinuities;
};

// Special functions
export const integrateSpecial = (expression: string, variable: string): string | null => {
  if (expression === `erf(${variable})`) {
    return `${variable}*erf(${variable})+exp(-${variable}^2)/sqrt(pi)`;
  }
  // Integral of exp(-x^2) -> (sqrt(pi)/2)*erf(x)
  if (expression === `exp(-${variable}^2)`) {
    return `sqrt(pi)/2*erf(${variable})`;
  }
  // Integral of 1/x -> ln|x| handled by power rule exponent -1
  // Fresnel integrals placeholders (non-elementary): return symbolic tag
  if (expression === `sin(${variable}^2)`) {
    return `FresnelS(${variable})`; // placeholder
  }
  if (expression === `cos(${variable}^2)`) {
    return `FresnelC(${variable})`; // placeholder
  }
  // Exponential integral Ei(a*x) primitive approximation placeholder
  if (/^exp\(${variable}\)\/${variable}$/.test(expression)) {
    return `Ei(${variable})`; // ∫ e^x / x dx = Ei(x)
  }
  // Gamma-type: x^(a-1)*exp(-x) -> Gamma(a) (indefinite is incomplete gamma). Provide placeholder.
  const gammaMatch = expression.match(new RegExp(`^${variable}\\^(?:([\"']?)([a-zA-Z0-9_]+)\\1-1)\\*exp\(-${variable}\)$`));
  if (gammaMatch) {
    return `Gamma(${gammaMatch[2]})`; // placeholder for ∫ x^{a-1} e^{-x} dx
  }
  return null;
};

// Implicit derivative patterns: diff(f(x),x) or d/dx(f(x)) integrate to f(x)
export const tryImplicitDerivative = (expression: string, variable: string): string | null => {
  const diffPattern = new RegExp(`^diff\((.+),${variable}\)$`);
  const dOverDxPattern = new RegExp(`^d/d${variable}\((.+)\)$`);
  const diffMatch = expression.match(diffPattern);
  if (diffMatch) return diffMatch[1];
  const dMatch = expression.match(dOverDxPattern);
  if (dMatch) return dMatch[1];
  return null;
};

// Piecewise support with callback to avoid circular dependency
export const integratePiecewise = (
  expression: string,
  variable: string,
  nerdamerInstance: NerdamerInstance,
  integrateCallback: (expr: string) => SymbolicIntegrationResult
): string | null => {
  if (!expression.startsWith('piecewise(') || !expression.endsWith(')')) return null;
  const inner = expression.slice(10, -1);
  const parts = inner.split(/,(?=(?:[^()]*\([^()]*\))*[^()]*$)/);
  if (parts.length % 2 !== 0) return null;
  const integrated: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const expr = parts[i];
    const cond = parts[i + 1];
    const sub = integrateCallback(expr);
    if (!sub.ok || !sub.result) return null;
    integrated.push(sub.result, cond);
  }
  return `piecewise(${integrated.join(',')})`;
};

export const attemptManualRules = (
  normalized: string,
  variable: string,
  nerdamerInstance: NerdamerInstance
): SymbolicIntegrationResult | null => {
  const manual = integrateByRules(normalized, variable);
  if (!manual) return null;
  const simplified = nerdamerInstance ? nerdamerInstance(manual.expression).simplify?.().toString() : manual.expression;
  const { discontinuities, issues } = analyzeDomain(simplified, variable);
  const rationalExtra = analyzeRational(simplified, variable, nerdamerInstance);
  const allDiscontinuities = [...new Set([...discontinuities, ...rationalExtra])];
  return {
    ok: true,
    result: tidySymbolicString(simplified),
    method: 'rules',
    discontinuities: allDiscontinuities,
    domainIssues: issues,
    latex: nerdamerInstance ? nerdamerInstance(simplified).toTeX?.() : undefined,
  };
};
