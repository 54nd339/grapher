/* ── 3D implicit surface helpers ──────────────────────── */

import {
  IMPLICIT_VIEW_MIN,
  IMPLICIT_VIEW_MAX,
  IMPLICIT_TIME_BUDGET_MS,
} from "@/lib/constants";


/**
 * Sample a 3D scalar field F(x,y,z) over a uniform grid.
 * Used by marching cubes to build an implicit surface for F(x,y,z)=0.
 *
 * Returns the sampled field buffer and whether sampling timed out.
 */
export async function sampleImplicitField(
  fn: (scope: Record<string, number>) => number,
  scope: Record<string, number>,
  resolution: number,
  signal?: AbortSignal,
): Promise<{ field: Float32Array; timedOut: boolean } | null> {
  if (typeof window === "undefined") return null;
  if (signal?.aborted) return null;
  const N = resolution;
  const step = (IMPLICIT_VIEW_MAX - IMPLICIT_VIEW_MIN) / (N - 1);
  const field = new Float32Array(N * N * N);
  const evalScope: Record<string, number> = { ...scope, x: 0, y: 0, z: 0 };
  const startedAt = performance.now();
  const nodeIndex = (ix: number, iy: number, iz: number) => ix + iy * N + iz * N * N;

  for (let ix = 0; ix < N; ix++) {
    if (signal?.aborted) return null;
    const x = IMPLICIT_VIEW_MIN + ix * step;
    evalScope.x = x;
    for (let iy = 0; iy < N; iy++) {
      const mathZ = IMPLICIT_VIEW_MIN + iy * step;
      evalScope.z = mathZ;
      for (let iz = 0; iz < N; iz++) {
        const mathY = IMPLICIT_VIEW_MIN + iz * step;
        evalScope.y = mathY;
        const raw = fn(evalScope);
        field[nodeIndex(ix, iy, iz)] =
          typeof raw === "number" && isFinite(raw) ? raw : Number.NaN;
      }
    }
    if (performance.now() - startedAt > IMPLICIT_TIME_BUDGET_MS) {
      return { field, timedOut: true };
    }
  }

  return { field, timedOut: false };
}
