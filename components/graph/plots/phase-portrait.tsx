"use client";

import { memo, useMemo } from "react";
import { Plot, Point, type vec } from "mafs";

import { rk4, ceCompile } from "@/lib/math";
import { useGraphStore } from "@/stores";

interface PhasePortraitProps {
  dxExpr: string;
  dyExpr: string;
  color: string;
}

/**
 * Phase portrait for a 2D autonomous system: dx/dt = f(x,y), dy/dt = g(x,y).
 * Renders a vector field plus solution trajectories from grid seed points.
 */
export const PhasePortrait = memo(function PhasePortrait({
  dxExpr,
  dyExpr,
  color,
}: PhasePortraitProps) {
  const viewport = useGraphStore((s) => s.viewport);

  const fns = useMemo(() => {
    const fx = ceCompile(dxExpr);
    const fy = ceCompile(dyExpr);
    if (!fx || !fy) return null;
    return { fx, fy };
  }, [dxExpr, dyExpr]);

  // Compute trajectories from grid seed points
  const trajectories = useMemo(() => {
    if (!fns) return [];
    const { fx, fy } = fns;

    const systemFn = (_t: number, state: number[]): number[] => {
      const [x, y] = state;
      const dxVal = fx({ x, y });
      const dyVal = fy({ x, y });
      return [
        typeof dxVal === "number" && isFinite(dxVal) ? dxVal : 0,
        typeof dyVal === "number" && isFinite(dyVal) ? dyVal : 0,
      ];
    };

    const step = (viewport.xMax - viewport.xMin) / 4;
    const result: vec.Vector2[][] = [];

    for (let sx = viewport.xMin; sx <= viewport.xMax; sx += step) {
      for (let sy = viewport.yMin; sy <= viewport.yMax; sy += step) {
        const sol = rk4(systemFn, [0, 10], [sx, sy], 200);
        const pts: vec.Vector2[] = [];
        for (let i = 0; i < sol.t.length; i++) {
          const [x, y] = sol.y[i];
          if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 1e4 || Math.abs(y) > 1e4) break;
          pts.push([x, y]);
        }
        if (pts.length > 2) result.push(pts);
      }
    }

    return result;
  }, [fns, viewport]);

  if (!fns) return null;

  return (
    <>
      {/* Vector field */}
      <Plot.VectorField
        xy={([x, y]: vec.Vector2) => {
          const dx = fns.fx({ x, y });
          const dy = fns.fy({ x, y });
          const dxn = typeof dx === "number" && isFinite(dx) ? dx : 0;
          const dyn = typeof dy === "number" && isFinite(dy) ? dy : 0;
          const mag = Math.sqrt(dxn * dxn + dyn * dyn);
          if (mag < 1e-12) return [0, 0];
          const scale = 0.5 * Math.min(1, mag) / mag;
          return [dxn * scale, dyn * scale];
        }}
        step={1}
        color={color}
      />

      {/* Trajectories */}
      {trajectories.map((pts, ti) => (
        <Plot.Parametric
          key={ti}
          t={[0, pts.length - 1]}
          xy={(t) => {
            const i = Math.min(Math.floor(t), pts.length - 2);
            const frac = t - i;
            const [x1, y1] = pts[i];
            const [x2, y2] = pts[i + 1];
            return [x1 + frac * (x2 - x1), y1 + frac * (y2 - y1)];
          }}
          color={color}
          weight={1.5}
          opacity={0.6}
        />
      ))}

      {/* Origin equilibrium marker */}
      <Point x={0} y={0} color={color} />
    </>
  );
});
