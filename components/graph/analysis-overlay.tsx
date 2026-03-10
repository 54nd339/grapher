"use client";

import { useState, useEffect, Fragment } from "react";
import { Point, Text } from "mafs";

import { compileExpressionLatex, findZeros, findExtrema, findIntersections, tryParametrizeImplicit } from "@/lib/math";
import { latexToExpr } from "@/lib/latex";
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
      expression.kind === "parametric" ||
      expression.kind === "polar"
    ) {
      setData({ zeros: [], minima: [], maxima: [] });
      return;
    }

    if (expression.kind === "implicit") {
      const plain = latexToExpr(expression.latex);
      const param = tryParametrizeImplicit(plain);

      let cancelled = false;

      (async () => {
        try {
          const zeros = await findIntersections(expression.latex, "0", viewport.xMin, viewport.xMax, scope);
          if (cancelled) return;

          if (param?.kind === "circle") {
            const { cx, cy, r } = param;
            setData({
              zeros: zeros.map(([x]) => ({ x })),
              minima: [{ x: cx, y: cy - r }],
              maxima: [{ x: cx, y: cy + r }],
            });
          } else {
            setData({
              zeros: zeros.map(([x]) => ({ x })),
              minima: [],
              maxima: [],
            });
          }
        } catch {
          if (!cancelled) setData({ zeros: [], minima: [], maxima: [] });
        }
      })();

      return () => { cancelled = true; };
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

  const formatCoord = (n: number) => (Math.abs(n) < 1e-10 ? "0" : n.toFixed(2));

  return (
    <>
      {data.zeros.map((p, i) => (
        <Fragment key={`z${i}`}>
          <Point x={p.x} y={0} color="var(--foreground)" />
          <Text x={p.x} y={0} attach="nw" attachDistance={14} size={12} color="var(--foreground)">
            ({formatCoord(p.x)}, 0)
          </Text>
        </Fragment>
      ))}
      {data.maxima.map((p, i) => (
        <Fragment key={`max${i}`}>
          <Point x={p.x} y={p.y} color={expression.color} />
          <Text x={p.x} y={p.y} attach="s" attachDistance={14} size={12} color={expression.color}>
            ({formatCoord(p.x)}, {formatCoord(p.y)})
          </Text>
        </Fragment>
      ))}
      {data.minima.map((p, i) => (
        <Fragment key={`min${i}`}>
          <Point x={p.x} y={p.y} color={expression.color} />
          <Text x={p.x} y={p.y} attach="n" attachDistance={14} size={12} color={expression.color}>
            ({formatCoord(p.x)}, {formatCoord(p.y)})
          </Text>
        </Fragment>
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
    const relevantExprs = expressions.filter(
      (e) =>
        e.visible &&
        e.latex &&
        (e.kind === "algebraic" ||
          e.kind === "trigonometric" ||
          e.kind === "calculus" ||
          e.kind === "series" ||
          e.kind === "differential" ||
          e.kind === "implicit"),
    );
    if (relevantExprs.length < 2) {
      setPoints([]);
      return;
    }

    const compiled = relevantExprs.map((e) =>
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
              relevantExprs[i].latex,
              relevantExprs[j].latex,
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
