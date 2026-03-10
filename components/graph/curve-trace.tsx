"use client";

import { useMemo } from "react";
import { Point, Text } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { compileExpressionLatex, safeEval,tryParametrizeImplicit } from "@/lib/math";
import { useGraphStore } from "@/stores";
import type { Expression } from "@/types";

export interface TraceHit {
  mathX: number;
  mathY: number;
  color: string;
  expression: Expression;
}

type CompiledEntry =
  | { kind: "fn"; fn: (scope: Record<string, number>) => number; color: string; expression: Expression }
  | { kind: "implicit"; param: ReturnType<typeof tryParametrizeImplicit>; color: string; expression: Expression }
  | null;

/**
 * Builds a per-expression evaluator.
 */
function buildEvaluator(expr: Expression): CompiledEntry {
  if (expr.kind === "slider" || expr.kind === "points" || expr.kind === "inequality") return null;

  // Implicit curves: parametric tracing (circle, line-x, line-y)
  if (expr.kind === "implicit") {
    const plain = latexToExpr(expr.latex);
    const param = tryParametrizeImplicit(plain);
    return { kind: "implicit", param, color: expr.color, expression: expr };
  }

  const fn = compileExpressionLatex(expr.latex, {
    mode: "graph-2d",
    allowUserFunctions: true,
  });
  return fn ? { kind: "fn", fn: (scope) => safeEval(fn, scope), color: expr.color, expression: expr } : null;
}

export function useCurveTrace(
  expressions: Expression[],
  traceX: number,
  traceY: number,
  scope: Record<string, number>,
): TraceHit | null {
  const viewport = useGraphStore((s) => s.viewport);

  const compiled = useMemo(
    () => expressions.map(buildEvaluator),
    [expressions],
  );

  const points = useMemo(() => {
    const result: { x: number; y: number; color: string; expression: Expression }[] = [];
    compiled.forEach((c) => {
      if (!c) return;
      if (c.kind === "implicit" && c.param) {
        const { param } = c;
        if (param.kind === "circle") {
          const angle = Math.atan2(traceY - param.cy, traceX - param.cx);
          result.push({
            x: param.cx + param.r * Math.cos(angle),
            y: param.cy + param.r * Math.sin(angle),
            color: c.color,
            expression: c.expression,
          });
        } else if (param.kind === "line-x") {
          result.push({ x: param.x, y: traceY, color: c.color, expression: c.expression });
        } else if (param.kind === "line-y") {
          result.push({ x: traceX, y: param.y, color: c.color, expression: c.expression });
        }
      } else if (c.kind === "fn") {
        const y = c.fn({ ...scope, x: traceX });
        if (!isNaN(y) && isFinite(y)) {
          result.push({ x: traceX, y, color: c.color, expression: c.expression });
        }
      }
    });
    return result;
  }, [compiled, traceX, traceY, scope]);

  return useMemo(() => {
    if (points.length === 0) return null;

    if (expressions.length === 1 && points.length === 1) {
      return {
        mathX: points[0].x,
        mathY: points[0].y,
        color: points[0].color,
        expression: points[0].expression,
      };
    }

    const xScale = viewport.xMax - viewport.xMin || 1;
    const yScale = viewport.yMax - viewport.yMin || 1;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dx = (points[i].x - traceX) / xScale;
      const dy = (points[i].y - traceY) / yScale;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (bestDist >= 0.15) return null;
    return {
      mathX: points[best].x,
      mathY: points[best].y,
      color: points[best].color,
      expression: points[best].expression,
    };
  }, [points, traceY, traceX, viewport, expressions.length]);
}

export function CurveTraceDot({
  hit,
  showLabel = true,
}: {
  hit: TraceHit;
  showLabel?: boolean;
}) {
  if (isNaN(hit.mathX) || isNaN(hit.mathY)) return null;

  const xStr = Math.abs(hit.mathX) < 1e-10 ? "0" : hit.mathX.toFixed(2);
  const yStr = Math.abs(hit.mathY) < 1e-10 ? "0" : hit.mathY.toFixed(2);
  return (
    <>
      <Point x={hit.mathX} y={hit.mathY} color={hit.color} />
      {showLabel && (
        <Text
          x={hit.mathX}
          y={hit.mathY}
          attach="ne"
          attachDistance={14}
          size={12}
          color={hit.color}
        >
          ({xStr}, {yStr})
        </Text>
      )}
    </>
  );
}
