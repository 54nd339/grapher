import { IntegrationContext, SymbolicIntegrationResult } from './types';
import { normalizeExpression } from './utils';
import { attemptManualRules, analyzeDomain, integratePiecewise, integrateSpecial, tryImplicitDerivative } from './analysis';
import { fullSimplify } from './simplify';
// Custom piecewise LaTeX builder
const buildPiecewiseLatex = (piecewiseExpr: string): string => {
  if (!piecewiseExpr.startsWith('piecewise(')) return '';
  const inner = piecewiseExpr.slice(10, -1);
  const parts = inner.split(/,(?=(?:[^()]*\([^()]*\))*[^()]*$)/);
  const rows: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const expr = parts[i];
    const cond = parts[i + 1] ?? '';
    rows.push(`${expr} & ${cond}`);
  }
  return `\\begin{cases} ${rows.join(' \\ ')} \\end{cases}`;
};

export const integrateSymbolically = ({
  nerdamerInstance,
  expression,
  variable,
}: IntegrationContext): SymbolicIntegrationResult => {
  const normalized = normalizeExpression(expression, nerdamerInstance);

  // Undefined / NaN quick check
  const undefinedIssues: string[] = [];
  if (/undefined/.test(normalized)) undefinedIssues.push('Expression contains undefined token');
  if (/NaN/.test(normalized)) undefinedIssues.push('Expression contains NaN token');
  if (undefinedIssues.length) {
    return { ok: false, error: 'Integrand invalid', undefinedIssues };
  }

  // Implicit derivative pattern
  const implicit = tryImplicitDerivative(normalized, variable);
  if (implicit) {
    const { simplified, latex } = fullSimplify(implicit, nerdamerInstance);
    const { discontinuities, issues } = analyzeDomain(simplified, variable);
    return { ok: true, result: simplified, method: 'symbolic', discontinuities, domainIssues: issues, latex };
  }

  const piecewise = integratePiecewise(normalized, variable, nerdamerInstance, (expr) =>
    integrateSymbolically({ nerdamerInstance, expression: expr, variable })
  );
  if (piecewise) {
    const { simplified, latex } = fullSimplify(piecewise, nerdamerInstance);
    const { discontinuities, issues } = analyzeDomain(simplified, variable);
    const piecewiseLatex = buildPiecewiseLatex(piecewise);
    return { ok: true, result: simplified, method: 'symbolic', discontinuities, domainIssues: issues, latex, piecewiseLatex };
  }

  const manual = attemptManualRules(normalized, variable, nerdamerInstance);
  if (manual) return manual;

  if (!nerdamerInstance) return { ok: false, error: 'Symbolic engine unavailable. Try again on the client side.' };

  const special = integrateSpecial(normalized, variable);
  if (special) {
    const { simplified, latex } = fullSimplify(special, nerdamerInstance);
    const { discontinuities, issues } = analyzeDomain(simplified, variable);
    return { ok: true, result: simplified, method: 'symbolic', discontinuities, domainIssues: issues, latex };
  }

  try {
    const integral = nerdamerInstance.integrate(expression, variable);
    const { simplified: simp, latex } = fullSimplify(integral.toString(), nerdamerInstance);
    const { discontinuities, issues } = analyzeDomain(simp, variable);
    return { ok: true, result: simp, method: 'nerdamer', discontinuities, domainIssues: issues, latex };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
};

export * from './types';
