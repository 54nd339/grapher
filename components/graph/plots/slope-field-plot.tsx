"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Plot, type vec } from "mafs";

import { useCompiledFromLatex, useSliderScope } from "@/hooks";
import { latexToExpr } from "@/lib/latex";
import { ceCompile, ceCompileFromLatex, safeEval } from "@/lib/math";
import * as rx from "@/lib/math/regex";
import { useGraphStore } from "@/stores";
import type { Expression } from "@/types";
import { getMathWorker } from "@/workers/math-api";

export const SlopeFieldPlot = memo(function SlopeFieldPlot({ expression }: { expression: Expression }) {
  const raw = latexToExpr(expression.latex);
  const scope = useSliderScope();
  const viewport = useGraphStore((s) => s.viewport);

  // Determine the ODE type and compile the RHS
  const odeData = useMemo(() => parseOdeData(raw), [raw]);

  // First-order explicit: extract RHS LaTeX for slope field rendering
  const explicitRhsLatex = useMemo(() => {
    const match = expression.latex.match(rx.REGEX_RHS_ONLY);
    return match ? match[1].trim() : "";
  }, [expression.latex]);
  const compiledExplicit = useCompiledFromLatex(explicitRhsLatex);

  // Use either the explicit compiled fn or the rearranged implicit fn
  const slopeFn = odeData?.type === "first-order" ? odeData.fn : compiledExplicit;

  // Solution curve(s) via worker RK4
  const [solutionPts, setSolutionPts] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!odeData) return;
    let cancelled = false;

    (async () => {
      try {
        const worker = getMathWorker();
        const pts = await worker.computeSlopeFieldSolution(
          odeData.rawExpr,
          odeData.type,
          !odeData.isImplicit, // isLatex = false for implicit since we send pre-parsed raw text
          viewport.xMin,
          viewport.xMax,
          scope
        );
        if (!cancelled) setSolutionPts(pts);
      } catch {
        if (!cancelled) setSolutionPts([]);
      }
    })();

    return () => { cancelled = true; };
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

function parseOdeData(raw: string) {
  // Second-order: y'' = f(x, y, y')
  const secondOrderMatch = raw.match(rx.REGEX_ODE_SECOND_ORDER);
  if (secondOrderMatch) {
    const rhs = secondOrderMatch[1].trim();
    return { type: "second-order" as const, rawExpr: rhs, isImplicit: false, fn: null };
  }

  // Explicit first-order: y' = f(x,y) or dy/dx = f(x,y)
  const explicitMatch = raw.match(rx.REGEX_ODE_FIRST_ORDER);
  if (explicitMatch) {
    const rhs = explicitMatch[2].trim();
    const fn = ceCompileFromLatex(rhs) ?? ceCompile(rhs);
    return fn ? { type: "first-order" as const, rawExpr: rhs, isImplicit: false, fn } : null;
  }

  // Implicit first-order: F(x, y, y') = 0
  if (rx.REGEX_ODE_IMPLICIT.test(raw)) {
    return { type: "implicit" as const, rawExpr: raw, isImplicit: true, fn: null };
  }

  return null;
}

function expressionEqual(a: { expression: Expression }, b: { expression: Expression }) {
  return (
    a.expression.id === b.expression.id &&
    a.expression.latex === b.expression.latex &&
    a.expression.color === b.expression.color &&
    a.expression.visible === b.expression.visible
  );
}
