import { ceCompile } from "./ce-compile";
import type { LineSegment } from "./types";

type EvalFn = (scope: Record<string, number>) => number;

const cache = new Map<string, LineSegment[]>();
const MAX_CACHE_ENTRIES = 16;

/**
 * Marching-squares algorithm for implicit curves F(x,y) = 0.
 * Returns line segments that approximate the zero-level contour.
 *
 * When `precompiledFn` is provided, it is used directly instead of
 * compiling `expr` through ceCompile. This avoids the lossy
 * LaTeX → plain-text round-trip for complex expressions.
 */
export function marchingSquares(
  expr: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridSize = 100,
  precompiledFn?: EvalFn | null,
): LineSegment[] {
  const key = `${expr}|${xMin}|${xMax}|${yMin}|${yMax}|${gridSize}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const fn = precompiledFn ?? ceCompile(expr);
    if (!fn) return [];
    const dx = (xMax - xMin) / gridSize;
    const dy = (yMax - yMin) / gridSize;
    const segments: LineSegment[] = [];

    const grid: number[][] = [];
    for (let i = 0; i <= gridSize; i++) {
      grid[i] = [];
      for (let j = 0; j <= gridSize; j++) {
        const x = xMin + i * dx;
        const y = yMin + j * dy;
        const v = fn({ x, y });
        // Treat NaN/Infinity as positive to avoid contour artifacts
        grid[i][j] = typeof v === "number" && isFinite(v) ? v : 1;
      }
    }

    // Guard against division by zero: return midpoint when va === vb
    const lerp = (a: number, b: number, va: number, vb: number) => {
      const denom = vb - va;
      if (Math.abs(denom) < 1e-15) return (a + b) / 2;
      return a + ((0 - va) / denom) * (b - a);
    };

    // Walk cells and extract contour segments via lookup
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = xMin + i * dx;
        const y = yMin + j * dy;

        const bl = grid[i][j];
        const br = grid[i + 1][j];
        const tr = grid[i + 1][j + 1];
        const tl = grid[i][j + 1];

        // Classify corners by sign (4-bit index)
        const config =
          (bl > 0 ? 8 : 0) |
          (br > 0 ? 4 : 0) |
          (tr > 0 ? 2 : 0) |
          (tl > 0 ? 1 : 0);

        if (config === 0 || config === 15) continue;

        // Edge midpoints where contour crosses
        const bx = lerp(x, x + dx, bl, br);
        const by = y;
        const rx = x + dx;
        const ry = lerp(y, y + dy, br, tr);
        const tx = lerp(x, x + dx, tl, tr);
        const ty = y + dy;
        const lx = x;
        const ly = lerp(y, y + dy, bl, tl);

        const seg = (x1: number, y1: number, x2: number, y2: number): LineSegment => ({ x1, y1, x2, y2 });

        // Asymptotic decider for saddle cells (config 5 and 10)
        const center = (bl + br + tr + tl) / 4;

        let cellSegments: LineSegment[];
        switch (config) {
          case 1: cellSegments = [seg(lx, ly, tx, ty)]; break;
          case 2: cellSegments = [seg(tx, ty, rx, ry)]; break;
          case 3: cellSegments = [seg(lx, ly, rx, ry)]; break;
          case 4: cellSegments = [seg(bx, by, rx, ry)]; break;
          case 5:
            cellSegments = center > 0
              ? [seg(lx, ly, tx, ty), seg(bx, by, rx, ry)]
              : [seg(lx, ly, bx, by), seg(tx, ty, rx, ry)];
            break;
          case 6: cellSegments = [seg(bx, by, tx, ty)]; break;
          case 7: cellSegments = [seg(lx, ly, bx, by)]; break;
          case 8: cellSegments = [seg(lx, ly, bx, by)]; break;
          case 9: cellSegments = [seg(bx, by, tx, ty)]; break;
          case 10:
            cellSegments = center > 0
              ? [seg(lx, ly, bx, by), seg(tx, ty, rx, ry)]
              : [seg(lx, ly, tx, ty), seg(bx, by, rx, ry)];
            break;
          case 11: cellSegments = [seg(bx, by, rx, ry)]; break;
          case 12: cellSegments = [seg(lx, ly, rx, ry)]; break;
          case 13: cellSegments = [seg(tx, ty, rx, ry)]; break;
          case 14: cellSegments = [seg(lx, ly, tx, ty)]; break;
          default: continue;
        }

        segments.push(...cellSegments);
      }
    }

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
