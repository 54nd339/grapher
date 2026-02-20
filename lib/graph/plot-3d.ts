import { PLOT_3D_GRID_SIZE } from "@/lib/constants";
import { compileExpressionLatex, toPlainExpression } from "@/lib/math";

export interface SurfaceData {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  width: number;
  height: number;
}

export interface CurveData {
  positions: Float32Array;
}

/** Map a normalised 0→1 value to an RGB triple via HSL (blue 240° → red 0°). */
function heightToRGB(t: number): [number, number, number] {
  const hue = (1 - t) * 240;
  const s = 0.75;
  const l = 0.55;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [r + m, g + m, b + m];
}

/**
 * Generate a 3D surface mesh for z=f(x,y) over the given bounds.
 * Includes per-vertex colour mapped from z-height (blue→red).
 */
export function generateSurfaceData(
  latex: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridSize: number = PLOT_3D_GRID_SIZE,
  scope: Record<string, number> = {},
): SurfaceData | null {
  const expr = toPlainExpression(latex, "auto");
  if (!expr) return null;

  try {
    const fn = compileExpressionLatex(latex, { mode: "auto" });
    if (!fn) return null;
    const dx = (xMax - xMin) / gridSize;
    const dy = (yMax - yMin) / gridSize;
    const vertexCount = (gridSize + 1) * (gridSize + 1);
    const positions = new Float32Array(vertexCount * 3);
    const indices: number[] = [];

    let zMin = Infinity;
    let zMax = -Infinity;

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = xMin + i * dx;
        const y = yMin + j * dy;
        let z: number;

        try {
          z = fn({ ...scope, x, y });
          if (typeof z !== "number" || !isFinite(z)) z = 0;
        } catch {
          z = 0;
        }

        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;

        const idx = (i * (gridSize + 1) + j) * 3;
        positions[idx] = x;
        positions[idx + 1] = z;
        positions[idx + 2] = y;
      }
    }

    // Build per-vertex colours based on normalised z-height
    const colors = new Float32Array(vertexCount * 3);
    const zRange = zMax - zMin || 1;
    for (let v = 0; v < vertexCount; v++) {
      const z = positions[v * 3 + 1];
      const t = (z - zMin) / zRange;
      const [r, g, b] = heightToRGB(t);
      colors[v * 3] = r;
      colors[v * 3 + 1] = g;
      colors[v * 3 + 2] = b;
    }

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const a = i * (gridSize + 1) + j;
        const b = a + 1;
        const c = (i + 1) * (gridSize + 1) + j;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    return {
      positions,
      colors,
      indices: new Uint32Array(indices),
      width: gridSize + 1,
      height: gridSize + 1,
    };
  } catch {
    return null;
  }
}

/**
 * Generate a 3D parametric curve from comma-separated x(t), y(t), z(t).
 * Returns a flat Float32Array of [x,y,z,...] positions for a Line.
 */
export function generateCurveData(
  latex: string,
  tMin = 0,
  tMax = 2 * Math.PI,
  samples = 500,
  extraScope: Record<string, number> = {},
): CurveData | null {
  const raw = toPlainExpression(latex, "none");
  const parts = raw.split(",").map((s) => s.trim());
  if (parts.length < 3) return null;

  try {
    const fns = parts.map((p) => compileExpressionLatex(p, { mode: "none" }));
    if (fns.some((f) => !f)) return null;
    const [fx, fy, fz] = fns as [(s: Record<string, number>) => number, (s: Record<string, number>) => number, (s: Record<string, number>) => number];
    const positions = new Float32Array(samples * 3);
    const dt = (tMax - tMin) / (samples - 1);

    for (let i = 0; i < samples; i++) {
      const t = tMin + i * dt;
      const scope = { ...extraScope, t };
      let x: number, y: number, z: number;
      try {
        x = fx(scope);
        y = fy(scope);
        z = fz(scope);
        if (!isFinite(x)) x = 0;
        if (!isFinite(y)) y = 0;
        if (!isFinite(z)) z = 0;
      } catch {
        x = y = z = 0;
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = z; // Three.js Y-up convention
      positions[i * 3 + 2] = y;
    }

    return { positions };
  } catch {
    return null;
  }
}
