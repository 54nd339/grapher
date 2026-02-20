"use client";

import { useMemo } from "react";
import { Point, Text } from "mafs";

import { compileExpressionLatex, safeEval } from "@/lib/math";
import { useGraphStore } from "@/stores";
import type { Expression } from "@/types";

export interface TraceHit {
  mathX: number;
  mathY: number;
  color: string;
}

export function useCurveTrace(
  expressions: Expression[],
  traceX: number,
  traceY: number,
  scope: Record<string, number>,
): TraceHit | null {
  const viewport = useGraphStore((s) => s.viewport);

  const points = useMemo(() => {
    const result: { y: number; color: string }[] = [];
    for (const expr of expressions) {
      if (
        expr.kind === "slider" ||
        expr.kind === "implicit" ||
        expr.kind === "parametric" ||
        expr.kind === "polar" ||
        expr.kind === "differential" ||
        expr.kind === "calculus" ||
        expr.kind === "series" ||
        expr.kind === "inequality" ||
        expr.kind === "points"
      )
        continue;
      const fn = compileExpressionLatex(expr.latex, {
        mode: "graph-2d",
        allowUserFunctions: true,
      });
      if (!fn) continue;
      const y = safeEval(fn, { ...scope, x: traceX });
      if (!isNaN(y)) {
        result.push({ y, color: expr.color });
      }
    }
    return result;
  }, [expressions, traceX, scope]);

  return useMemo(() => {
    if (points.length === 0) return null;

    if (expressions.length === 1) {
      return { mathX: traceX, mathY: points[0].y, color: points[0].color };
    }

    const yScale = viewport.yMax - viewport.yMin || 1;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dy = (points[i].y - traceY) / yScale;
      const dist = Math.abs(dy);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    if (bestDist >= 0.08) return null;
    return { mathX: traceX, mathY: points[best].y, color: points[best].color };
  }, [points, traceY, traceX, viewport, expressions.length]);
}

export function CurveTraceDot({
  hit,
  showLabel = true,
}: {
  hit: TraceHit;
  showLabel?: boolean;
}) {
  const xStr = Math.abs(hit.mathX) < 1e-10 ? "0" : hit.mathX.toFixed(2);
  const yStr = Math.abs(hit.mathY) < 1e-10 ? "0" : hit.mathY.toFixed(2);
  return (
    <>
      <Point x={hit.mathX} y={hit.mathY} color={hit.color} />
      {showLabel && (
        <Text x={hit.mathX} y={hit.mathY} attach="ne" attachDistance={14} size={12} color={hit.color}>
          ({xStr}, {yStr})
        </Text>
      )}
    </>
  );
}
