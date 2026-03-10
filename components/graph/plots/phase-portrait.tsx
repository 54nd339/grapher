"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { Plot, Point, type vec } from "mafs";

import { ceCompile } from "@/lib/math";
import { useGraphStore } from "@/stores";
import { getMathWorker } from "@/workers/math-api";

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
  const [trajectories, setTrajectories] = useState<vec.Vector2[][]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const step = (viewport.xMax - viewport.xMin) / 4;
        const worker = getMathWorker();
        const pts = await worker.solveSystemODEPlot(
          dxExpr,
          dyExpr,
          viewport.xMin,
          viewport.xMax,
          viewport.yMin,
          viewport.yMax,
          step,
          step
        );
        if (!cancelled) {
          setTrajectories(pts as vec.Vector2[][]);
        }
      } catch {
        if (!cancelled) setTrajectories([]);
      }
    })();

    return () => { cancelled = true; };
  }, [dxExpr, dyExpr, viewport.xMin, viewport.xMax, viewport.yMin, viewport.yMax]);

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
