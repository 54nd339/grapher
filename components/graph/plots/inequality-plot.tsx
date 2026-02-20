"use client";

import { memo, useMemo } from "react";
import { Plot, Polygon, type vec } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { ceCompileFromLatex, safeCompile, safeEval } from "@/lib/math";
import { useGraphStore } from "@/stores";
import { useSliderScope } from "@/hooks";
import type { Expression } from "@/types";

export const InequalityPlot = memo(function InequalityPlot({ expression }: { expression: Expression }) {
  const raw = latexToExpr(expression.latex);
  const scope = useSliderScope();
  const viewport = useGraphStore((s) => s.viewport);

  const circleIneq = useMemo(() => {
    const inside = raw.match(/^x\^\(2\)\s*\+\s*y\^\(2\)\s*(<=|<)\s*(-?\d+(?:\.\d+)?)$/);
    if (inside) {
      const op = inside[1];
      const rhs = Number(inside[2]);
      if (!isFinite(rhs) || rhs < 0) return null;
      const upper = (x: number) => Math.sqrt(Math.max(0, rhs - x * x));
      const lower = (x: number) => -Math.sqrt(Math.max(0, rhs - x * x));
      return { mode: "inside" as const, strict: op === "<", upper, lower };
    }

    const outside = raw.match(/^x\^\(2\)\s*\+\s*y\^\(2\)\s*(>=|>)\s*(-?\d+(?:\.\d+)?)$/);
    if (outside) {
      const op = outside[1];
      const rhs = Number(outside[2]);
      if (!isFinite(rhs) || rhs < 0) return null;
      const upper = (x: number) => Math.sqrt(Math.max(0, rhs - x * x));
      const lower = (x: number) => -Math.sqrt(Math.max(0, rhs - x * x));
      return { mode: "outside" as const, strict: op === ">", upper, lower };
    }

    return null;
  }, [raw]);

  const parsed = useMemo(() => {
    // x-axis inequality: x > expr, x < expr, etc.
    const xMatch = raw.match(/^x\s*(>=?|<=?)\s*(.+)$/);
    if (xMatch) {
      const op = xMatch[1];
      const rhs = xMatch[2];
      const compiled = ceCompileFromLatex(rhs) ?? safeCompile(rhs);
      if (!compiled) return null;
      const strict = op === ">" || op === "<";
      const right = op === ">" || op === ">=";
      return { axis: "x" as const, compiled, strict, right };
    }

    // y-axis inequality: y > f(x), y < f(x), etc.
    const yMatch = raw.match(/^y\s*(>=?|<=?)\s*(.+)$/);
    if (yMatch) {
      const op = yMatch[1];
      const rhs = yMatch[2];
      const compiled = ceCompileFromLatex(rhs) ?? safeCompile(rhs);
      if (!compiled) return null;
      const strict = op === ">" || op === "<";
      const above = op === ">" || op === ">=";
      return { axis: "y" as const, compiled, strict, above };
    }

    return null;
  }, [raw]);

  if (circleIneq) {
    const common = { color: expression.color };
    if (circleIneq.mode === "inside") {
      return (
        <Plot.Inequality
          y={circleIneq.strict
            ? { "<": circleIneq.upper, ">": circleIneq.lower }
            : { "<=": circleIneq.upper, ">=": circleIneq.lower }}
          {...common}
        />
      );
    }

    return (
      <>
        <Plot.Inequality y={circleIneq.strict ? { ">": circleIneq.upper } : { ">=": circleIneq.upper }} {...common} />
        <Plot.Inequality y={circleIneq.strict ? { "<": circleIneq.lower } : { "<=": circleIneq.lower }} {...common} />
      </>
    );
  }

  if (!parsed) return null;

  if (parsed.axis === "x") {
    const { compiled, strict, right } = parsed;
    const boundary = safeEval(compiled, { ...scope });
    if (isNaN(boundary)) return null;

    const xBound = right ? viewport.xMax + 5 : viewport.xMin - 5;
    const pts: vec.Vector2[] = [
      [boundary, viewport.yMin - 5],
      [boundary, viewport.yMax + 5],
      [xBound, viewport.yMax + 5],
      [xBound, viewport.yMin - 5],
    ];

    return (
      <>
        <Plot.Parametric
          t={[viewport.yMin - 5, viewport.yMax + 5]}
          xy={(t) => [boundary, t]}
          color={expression.color}
          style={strict ? "dashed" : undefined}
        />
        <Polygon points={pts} color={expression.color} fillOpacity={0.12} />
      </>
    );
  }

  const { compiled, strict, above } = parsed;
  const boundaryFn = (x: number) => safeEval(compiled, { ...scope, x });

  const steps = 120;
  const dx = (viewport.xMax - viewport.xMin) / steps;
  const pts: vec.Vector2[] = [];
  const yBound = above ? viewport.yMax + 5 : viewport.yMin - 5;

  pts.push([viewport.xMin, yBound]);
  for (let i = 0; i <= steps; i++) {
    const x = viewport.xMin + i * dx;
    const y = boundaryFn(x);
    if (!isNaN(y)) pts.push([x, y]);
  }
  pts.push([viewport.xMax, yBound]);

  return (
    <>
      <Plot.OfX y={boundaryFn} color={expression.color} style={strict ? "dashed" : undefined} />
      <Polygon points={pts} color={expression.color} fillOpacity={0.12} />
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
