"use client";

import { memo, useMemo } from "react";
import { Plot, type vec } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { safeEval, rk4, rearrangeImplicitODE, secondOrderToSystem, ceCompile, ceCompileFromLatex } from "@/lib/math";
import { useGraphStore } from "@/stores";
import { useCompiledFromLatex, useSliderScope } from "@/hooks";
import type { Expression } from "@/types";

export const SlopeFieldPlot = memo(function SlopeFieldPlot({ expression }: { expression: Expression }) {
  const raw = latexToExpr(expression.latex);
  const scope = useSliderScope();
  const viewport = useGraphStore((s) => s.viewport);

  // Determine the ODE type and compile the RHS
  const odeData = useMemo(() => {
    // Second-order: y'' = f(x, y, y')
    const secondOrderMatch = raw.match(/^(?:y''|d\^?2y\/dx\^?2)\s*=\s*(.+)$/);
    if (secondOrderMatch) {
      const systemFn = secondOrderToSystem(secondOrderMatch[1].trim());
      return systemFn ? { type: "second-order" as const, systemFn } : null;
    }

    // Explicit first-order: y' = f(x,y) or dy/dx = f(x,y)
    const explicitMatch = raw.match(/^(dy\/dx|y')\s*=\s*(.+)$/);
    if (explicitMatch) {
      const rhs = explicitMatch[2].trim();
      // Primary: compile from LaTeX; Fallback: plain text
      const fn = ceCompileFromLatex(rhs) ?? ceCompile(rhs);
      return fn ? { type: "first-order" as const, fn } : null;
    }

    // Implicit first-order: F(x, y, y') = 0
    if (/y'/.test(raw)) {
      const result = rearrangeImplicitODE(raw);
      return result ? { type: "first-order" as const, fn: result.rhsFn } : null;
    }

    return null;
  }, [raw]);

  // First-order explicit: extract RHS LaTeX for slope field rendering
  const explicitRhsLatex = useMemo(() => {
    const match = expression.latex.match(/=\s*(.+)$/);
    return match ? match[1].trim() : "";
  }, [expression.latex]);
  const compiledExplicit = useCompiledFromLatex(explicitRhsLatex);

  // Use either the explicit compiled fn or the rearranged implicit fn
  const slopeFn = odeData?.type === "first-order" ? odeData.fn : compiledExplicit;

  // Solution curve(s) via RK4
  const solutionPts = useMemo(() => {
    if (!odeData) return [];

    if (odeData.type === "second-order") {
      // y'' system: state = [y, y'], initial = [y(0)=1, y'(0)=0]
      const fwd = rk4(odeData.systemFn, [0, viewport.xMax + 2], [1, 0], 400);
      const bwd = rk4(odeData.systemFn, [0, viewport.xMin - 2], [1, 0], 400);

      const pts: vec.Vector2[] = [];
      for (let i = bwd.t.length - 1; i > 0; i--) {
        const y = bwd.y[i][0];
        if (!isFinite(y) || Math.abs(y) > 1e6) continue;
        pts.push([bwd.t[i], y]);
      }
      for (let i = 0; i < fwd.t.length; i++) {
        const y = fwd.y[i][0];
        if (!isFinite(y) || Math.abs(y) > 1e6) break;
        pts.push([fwd.t[i], y]);
      }
      return pts;
    }

    // First-order ODE
    const fn = odeData.fn;
    const odeFn = (_t: number, yArr: number[]): number[] => {
      const val = safeEval(fn, { ...scope, x: _t, y: yArr[0] });
      return [isNaN(val) ? 0 : val];
    };

    const fwd = rk4(odeFn, [0, viewport.xMax + 2], [1], 400);
    const bwd = rk4(odeFn, [0, viewport.xMin - 2], [1], 400);

    const pts: vec.Vector2[] = [];
    for (let i = bwd.t.length - 1; i > 0; i--) {
      const y = bwd.y[i][0];
      if (!isFinite(y) || Math.abs(y) > 1e6) continue;
      pts.push([bwd.t[i], y]);
    }
    for (let i = 0; i < fwd.t.length; i++) {
      const y = fwd.y[i][0];
      if (!isFinite(y) || Math.abs(y) > 1e6) break;
      pts.push([fwd.t[i], y]);
    }
    return pts;
  }, [odeData, scope, viewport.xMin, viewport.xMax]);

  if (!slopeFn && odeData?.type !== "second-order") return null;

  return (
    <>
      {/* Slope field (only for first-order ODEs) */}
      {slopeFn && (
        <Plot.VectorField
          xy={([x, y]: vec.Vector2) => {
            const slope = safeEval(slopeFn, { ...scope, x, y });
            if (isNaN(slope)) return [0, 0];
            const len = 0.5;
            const angle = Math.atan(slope);
            return [len * Math.cos(angle), len * Math.sin(angle)];
          }}
          step={1}
          color={expression.color}
        />
      )}
      {solutionPts.length > 1 && (
        <Plot.Parametric
          t={[0, solutionPts.length - 1]}
          xy={(t) => {
            const i = Math.min(Math.floor(t), solutionPts.length - 2);
            const frac = t - i;
            const [x1, y1] = solutionPts[i];
            const [x2, y2] = solutionPts[i + 1];
            return [x1 + frac * (x2 - x1), y1 + frac * (y2 - y1)];
          }}
          color={expression.color}
          weight={3}
        />
      )}
    </>
  );
}, expressionEqual);

function expressionEqual(a: { expression: Expression }, b: { expression: Expression }) {
  return (
    a.expression.id === b.expression.id &&
    a.expression.latex === b.expression.latex &&
    a.expression.color === b.expression.color &&
    a.expression.visible === b.expression.visible
  );
}
