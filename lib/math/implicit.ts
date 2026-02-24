import type { PathRing } from "@/workers/math.worker";
import { getMathWorker } from "@/workers/math-api";

const cache = new Map<string, PathRing[]>();
const MAX_CACHE_ENTRIES = 16;

/**
 * Marching-squares algorithm for implicit curves F(x,y) = 0.
 * Returns line segments that approximate the zero-level contour.
 *
 * Grid evaluation happens on the main thread (requires ceCompile),
 * then the grid is sent to a web worker where the `marching-squares`
 * library extracts the contour lines.
 *
 * When `precompiledFn` is provided, it is used directly instead of
 * compiling `expr` through ceCompile.
 */
export async function marchingSquares(
  expr: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridSize = 100,
): Promise<PathRing[]> {
  const key = `${expr}|${xMin}|${xMax}|${yMin}|${yMax}|${gridSize}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const worker = getMathWorker();
    const segments = await worker.marchingSquares(
      expr,
      {},
      xMin,
      xMax,
      yMin,
      yMax,
      gridSize
    );

    if (cache.size >= MAX_CACHE_ENTRIES) {
      const first = cache.keys().next().value!;
      cache.delete(first);
    }
    cache.set(key, segments);
    return segments;
  } catch {
    return [];
  }
}
