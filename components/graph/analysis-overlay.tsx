"use client";

import { useState, useEffect } from "react";
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

  const [data, setData] = useState<{
    zeros: { x: number }[];
    minima: { x: number; y: number }[];
    maxima: { x: number; y: number }[];
  }>({ zeros: [], minima: [], maxima: [] });

  useEffect(() => {
    if (
      expression.kind === "slider" ||
      expression.kind === "implicit" ||
      expression.kind === "parametric" ||
      expression.kind === "polar" ||
      expression.kind === "differential"
    ) {
      setData({ zeros: [], minima: [], maxima: [] });
      return;
    }

    const compiled = compileExpressionLatex(expression.latex, {
      mode: "graph-2d",
      allowUserFunctions: true,
    });
    if (!compiled) {
      setData({ zeros: [], minima: [], maxima: [] });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [zeros, extrema] = await Promise.all([
          findZeros(expression.latex, true, viewport.xMin, viewport.xMax, scope),
          findExtrema(expression.latex, true, viewport.xMin, viewport.xMax, scope),
        ]);

        if (cancelled) return;

        setData({
          zeros: zeros.map((x) => ({ x })),
          minima: extrema.minima.map((x) => ({
            x,
            y: compiled({ ...scope, x }) as number,
          })),
          maxima: extrema.maxima.map((x) => ({
            x,
            y: compiled({ ...scope, x }) as number,
          })),
        });
      } catch {
        if (!cancelled) setData({ zeros: [], minima: [], maxima: [] });
      }
    })();

    return () => { cancelled = true; };
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

  const [points, setPoints] = useState<Array<[number, number]>>([]);

  useEffect(() => {
    const algebraicExprs = expressions.filter(
      (e) =>
        e.visible &&
        e.latex &&
        (e.kind === "algebraic" || e.kind === "trigonometric" || e.kind === "calculus" || e.kind === "series"),
    );
    if (algebraicExprs.length < 2) {
      setPoints([]);
      return;
    }

    const compiled = algebraicExprs.map((e) =>
      compileExpressionLatex(e.latex, {
        mode: "graph-2d",
        allowUserFunctions: true,
      }),
    );

    let cancelled = false;

    (async () => {
      try {
        const result: Array<[number, number]> = [];
        for (let i = 0; i < compiled.length; i++) {
          for (let j = i + 1; j < compiled.length; j++) {
            if (!compiled[i] || !compiled[j]) continue;
            const pts = await findIntersections(
              algebraicExprs[i].latex,
              algebraicExprs[j].latex,
              viewport.xMin,
              viewport.xMax,
              scope,
            );
            result.push(...pts);
          }
        }
        if (!cancelled) setPoints(result);
      } catch {
        if (!cancelled) setPoints([]);
      }
    })();

    return () => { cancelled = true; };
  }, [expressions, scope, viewport]);

  return (
    <>
      {points.map(([x, y], i) => (
        <Point key={`int${i}`} x={x} y={y} color="var(--foreground)" />
      ))}
    </>
  );
}
