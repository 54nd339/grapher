"use client";

import { useMemo } from "react";
import { Point } from "mafs";

import { compileExpressionLatex, findZeros, findExtrema, findIntersections } from "@/lib/math";
import { useGraphStore } from "@/stores";
import type { Expression } from "@/types";

export function AnalysisOverlay({
  expression,
  scope,
}: {
  expression: Expression;
  scope: Record<string, number>;
}) {
  const viewport = useGraphStore((s) => s.viewport);

  const data = useMemo(() => {
    if (
      expression.kind === "slider" ||
      expression.kind === "implicit" ||
      expression.kind === "parametric" ||
      expression.kind === "polar" ||
      expression.kind === "differential"
    )
      return { zeros: [] as { x: number }[], minima: [] as { x: number; y: number }[], maxima: [] as { x: number; y: number }[] };

    const compiled = compileExpressionLatex(expression.latex, {
      mode: "graph-2d",
      allowUserFunctions: true,
    });
    if (!compiled) return { zeros: [], minima: [], maxima: [] };

    try {
      const zeros = findZeros(compiled, viewport.xMin, viewport.xMax, scope);
      const { minima, maxima } = findExtrema(
        compiled,
        viewport.xMin,
        viewport.xMax,
        scope,
      );
      return {
        zeros: zeros.map((x) => ({ x })),
        minima: minima.map((x) => ({
          x,
          y: compiled({ ...scope, x }) as number,
        })),
        maxima: maxima.map((x) => ({
          x,
          y: compiled({ ...scope, x }) as number,
        })),
      };
    } catch {
      return { zeros: [], minima: [], maxima: [] };
    }
  }, [expression, scope, viewport]);

  return (
    <>
      {data.zeros.map((p, i) => (
        <Point key={`z${i}`} x={p.x} y={0} color="var(--foreground)" />
      ))}
      {data.maxima.map((p, i) => (
        <Point key={`max${i}`} x={p.x} y={p.y} color={expression.color} />
      ))}
      {data.minima.map((p, i) => (
        <Point key={`min${i}`} x={p.x} y={p.y} color={expression.color} />
      ))}
    </>
  );
}

export function IntersectionOverlay({
  expressions,
  scope,
}: {
  expressions: Expression[];
  scope: Record<string, number>;
}) {
  const viewport = useGraphStore((s) => s.viewport);

  const points = useMemo(() => {
    const algebraicExprs = expressions.filter(
      (e) =>
        e.visible &&
        e.latex &&
        (e.kind === "algebraic" || e.kind === "trigonometric" || e.kind === "calculus" || e.kind === "series"),
    );
    if (algebraicExprs.length < 2) return [];

    const compiled = algebraicExprs.map((e) => {
      return compileExpressionLatex(e.latex, {
        mode: "graph-2d",
        allowUserFunctions: true,
      });
    });

    const result: Array<[number, number]> = [];
    for (let i = 0; i < compiled.length; i++) {
      for (let j = i + 1; j < compiled.length; j++) {
        if (!compiled[i] || !compiled[j]) continue;
        const pts = findIntersections(
          compiled[i]!,
          compiled[j]!,
          viewport.xMin,
          viewport.xMax,
          scope,
        );
        result.push(...pts);
      }
    }
    return result;
  }, [expressions, scope, viewport]);

  return (
    <>
      {points.map(([x, y], i) => (
        <Point key={`int${i}`} x={x} y={y} color="var(--foreground)" />
      ))}
    </>
  );
}
