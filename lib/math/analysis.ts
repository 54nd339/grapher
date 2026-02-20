import { getMathWorker } from "@/workers/math-api";

/**
 * Pre-sample a compiled function at uniformly-spaced x-values.
 * Returns typed arrays suitable for transferring to the worker.
 */
/**
 * Find zeros of a compiled function via worker-based sign-change detection.
 */
export async function findZeros(
  exprStr: string,
  isLatex: boolean,
  xMin: number,
  xMax: number,
  scope: Record<string, number> = {},
  samples = 200,
): Promise<number[]> {
  const worker = getMathWorker();
  return worker.findZeros(exprStr, isLatex, xMin, xMax, scope, samples);
}

/**
 * Find local extrema via worker-based derivative sign-change detection.
 */
export async function findExtrema(
  exprStr: string,
  isLatex: boolean,
  xMin: number,
  xMax: number,
  scope: Record<string, number> = {},
  samples = 200,
): Promise<{ minima: number[]; maxima: number[] }> {
  const worker = getMathWorker();
  return worker.findExtrema(exprStr, isLatex, xMin, xMax, scope, samples);
}

/**
 * Find intersection points between two compiled functions via worker.
 */
export async function findIntersections(
  exprAStr: string,
  exprBStr: string,
  xMin: number,
  xMax: number,
  scope: Record<string, number> = {},
  samples = 200,
  limit = 20,
): Promise<Array<[number, number]>> {
  const worker = getMathWorker();
  return worker.findIntersections(exprAStr, exprBStr, xMin, xMax, scope, samples, limit);
}

/**
 * Compile an expression string safely, returning null on failure.
 */
export { safeCompile } from "./ce-compile";
