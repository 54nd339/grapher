/* ── 3D implicit surface helpers ──────────────────────── */

import { getMathWorker } from "@/workers/math-api";


/**
 * Sample a 3D scalar field F(x,y,z) over a uniform grid.
 * Used by marching cubes to build an implicit surface for F(x,y,z)=0.
 *
 * Runs the $O(N^3)$ evaluation inside a web worker to preserve UI threads.
 */
export async function sampleImplicitField(
  latex: string,
  scope: Record<string, number>,
  resolution: number,
  signal?: AbortSignal,
): Promise<{ field: Float32Array; timedOut: boolean } | null> {
  if (typeof window === "undefined") return null;
  if (signal?.aborted) return null;

  const worker = getMathWorker();
  const result = await worker.sampleImplicitField(latex, scope, resolution);

  return result;
}
