"use client";

import { useState, useEffect } from "react";
import { Line, Plot } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { marchingSquares, tryParametrizeImplicit } from "@/lib/math";
import { useGraphStore } from "@/stores";
import type { Expression } from "@/types";
import type { PathRing } from "@/workers/math.worker";

export function ImplicitPlot({ expression }: { expression: Expression }) {
  const viewport = useGraphStore((s) => s.viewport);

  const [rings, setRings] = useState<PathRing[]>([]);

  const plainExpr = latexToExpr(expression.latex);
  const parametricForm = tryParametrizeImplicit(plainExpr);

  const implicitExpr = (() => {
    const [lhs, rhs = "0"] = plainExpr.split("=");
    if (!lhs) return null;
    return `(${lhs})-(${rhs})`;
  })();

  const gridSize = (() => {
    const xSpan = Math.abs(viewport.xMax - viewport.xMin);
    const ySpan = Math.abs(viewport.yMax - viewport.yMin);
    const maxSpan = Math.max(xSpan, ySpan);
    if (maxSpan <= 8) return 1000; // Ultra high-res when zoomed in
    if (maxSpan <= 20) return 800; // High-res
    if (maxSpan <= 50) return 600; // Medium
    return 300; // Fallback for very wide zooms
  })();

  useEffect(() => {
    if (parametricForm || !implicitExpr) {
      setRings([]);
      return;
    }
    let cancelled = false;
    marchingSquares(
      implicitExpr,
      viewport.xMin,
      viewport.xMax,
      viewport.yMin,
      viewport.yMax,
      gridSize,
    ).then((result) => {
      if (!cancelled) setRings(result);
    });
    return () => { cancelled = true; };
  }, [
    gridSize,
    parametricForm,
    implicitExpr,
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

      {rings.map((ring, index) => (
        <Plot.Parametric
          key={`${expression.id}-${index}`}
          t={[0, ring.length - 1]}
          xy={(t) => {
            const i = Math.min(Math.floor(t), ring.length - 2);
            const frac = t - i;
            const [x1, y1] = ring[i];
            const [x2, y2] = ring[i + 1];
            return [x1 + frac * (x2 - x1), y1 + frac * (y2 - y1)];
          }}
          color={expression.color}
          weight={expression.kind === "inequality" ? 0 : 2}
        />
      ))}
    </>
  );
}