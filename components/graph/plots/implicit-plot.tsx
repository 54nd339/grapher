"use client";

import { useMemo } from "react";
import { Line, Plot } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { ceCompileImplicitFromLatex, marchingSquares, tryParametrizeImplicit } from "@/lib/math";
import { useGraphStore } from "@/stores";
import type { Expression } from "@/types";

export function ImplicitPlot({ expression }: { expression: Expression }) {
  const viewport = useGraphStore((s) => s.viewport);

  const plainExpr = useMemo(() => latexToExpr(expression.latex), [expression.latex]);

  const parametricForm = useMemo(
    () => tryParametrizeImplicit(plainExpr),
    [plainExpr],
  );

  const implicitExpr = useMemo(() => {
    const [lhs, rhs = "0"] = plainExpr.split("=");
    if (!lhs) return null;
    return `(${lhs})-(${rhs})`;
  }, [plainExpr]);

  // Compile directly from LaTeX to avoid the lossy plain-text round-trip
  // that can mangle complex expressions like (x²+y²−1)³−x²y³=0
  const compiledFn = useMemo(
    () => ceCompileImplicitFromLatex(expression.latex),
    [expression.latex],
  );

  const gridSize = useMemo(() => {
    const xSpan = Math.abs(viewport.xMax - viewport.xMin);
    const ySpan = Math.abs(viewport.yMax - viewport.yMin);
    const maxSpan = Math.max(xSpan, ySpan);
    if (maxSpan <= 8) return 240;
    if (maxSpan <= 20) return 190;
    if (maxSpan <= 50) return 150;
    return 120;
  }, [viewport.xMax, viewport.xMin, viewport.yMax, viewport.yMin]);

  const segments = useMemo(() => {
    if (parametricForm) return [];
    if (!implicitExpr) return [];
    return marchingSquares(
      implicitExpr,
      viewport.xMin,
      viewport.xMax,
      viewport.yMin,
      viewport.yMax,
      gridSize,
      compiledFn,
    );
  }, [
    gridSize,
    parametricForm,
    implicitExpr,
    compiledFn,
    viewport.xMax,
    viewport.xMin,
    viewport.yMax,
    viewport.yMin,
  ]);

  return (
    <>
      {parametricForm?.kind === "line-x" && (
        <Line.Segment
          point1={[parametricForm.x, viewport.yMin]}
          point2={[parametricForm.x, viewport.yMax]}
          color={expression.color}
        />
      )}

      {parametricForm?.kind === "line-y" && (
        <Line.Segment
          point1={[viewport.xMin, parametricForm.y]}
          point2={[viewport.xMax, parametricForm.y]}
          color={expression.color}
        />
      )}

      {parametricForm?.kind === "circle" && (
        <Plot.Parametric
          t={[0, 2 * Math.PI]}
          xy={(t) => [
            parametricForm.cx + parametricForm.r * Math.cos(t),
            parametricForm.cy + parametricForm.r * Math.sin(t),
          ]}
          color={expression.color}
        />
      )}

      {parametricForm?.kind === "ellipse" && (
        <Plot.Parametric
          t={[0, 2 * Math.PI]}
          xy={(t) => [
            parametricForm.cx + parametricForm.a * Math.cos(t),
            parametricForm.cy + parametricForm.b * Math.sin(t),
          ]}
          color={expression.color}
        />
      )}

      {parametricForm?.kind === "hyperbola-x" && (
        <>
          <Plot.Parametric
            t={[-3, 3]}
            xy={(t) => [
              parametricForm.cx + parametricForm.a * Math.cosh(t),
              parametricForm.cy + parametricForm.b * Math.sinh(t),
            ]}
            color={expression.color}
          />
          <Plot.Parametric
            t={[-3, 3]}
            xy={(t) => [
              parametricForm.cx - parametricForm.a * Math.cosh(t),
              parametricForm.cy + parametricForm.b * Math.sinh(t),
            ]}
            color={expression.color}
          />
        </>
      )}

      {parametricForm?.kind === "hyperbola-y" && (
        <>
          <Plot.Parametric
            t={[-3, 3]}
            xy={(t) => [
              parametricForm.cx + parametricForm.b * Math.sinh(t),
              parametricForm.cy + parametricForm.a * Math.cosh(t),
            ]}
            color={expression.color}
          />
          <Plot.Parametric
            t={[-3, 3]}
            xy={(t) => [
              parametricForm.cx + parametricForm.b * Math.sinh(t),
              parametricForm.cy - parametricForm.a * Math.cosh(t),
            ]}
            color={expression.color}
          />
        </>
      )}

      {parametricForm?.kind === "parabola-x2" && (
        <Plot.Parametric
          t={[viewport.xMin - parametricForm.h, viewport.xMax - parametricForm.h]}
          xy={(t) => [
            parametricForm.h + t,
            parametricForm.k + (t * t) / parametricForm.c,
          ]}
          color={expression.color}
        />
      )}

      {parametricForm?.kind === "parabola-y2" && (
        <Plot.Parametric
          t={[viewport.yMin - parametricForm.k, viewport.yMax - parametricForm.k]}
          xy={(t) => [
            parametricForm.h + (t * t) / parametricForm.c,
            parametricForm.k + t,
          ]}
          color={expression.color}
        />
      )}

      {segments.map((segment, index) => (
        <Line.Segment
          key={`${expression.id}-${index}`}
          point1={[segment.x1, segment.y1]}
          point2={[segment.x2, segment.y2]}
          color={expression.color}
        />
      ))}
    </>
  );
}