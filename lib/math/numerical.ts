import { getMathWorker } from "@/workers/math-api";

/**
 * Numerical integration via composite Simpson's rule.
 * The string expression is passed to the worker which evaluates and sums.
 */
export async function simpsonIntegrate(
  exprStr: string,
  isLatex: boolean,
  integVar: string,
  a: number,
  b: number,
  scope: Record<string, number>,
  n = 50,
): Promise<number> {
  if (a === b) return 0;
  if (!isFinite(a) || !isFinite(b)) return NaN;

  const worker = getMathWorker();
  return worker.simpsonIntegrate(exprStr, isLatex, integVar, a, b, scope, n);
}
