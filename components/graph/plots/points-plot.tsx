"use client";

import { memo, useMemo } from "react";
import { Plot, Point } from "mafs";

import { computeRegression } from "@/lib/math";
import type { Expression, RegressionType } from "@/types";

export const PointsPlot = memo(function PointsPlot({ expression }: { expression: Expression }) {
  const pts = expression.points;
  if (!pts || pts.length === 0) return null;

  return (
    <>
      {pts.map(([x, y], i) => (
        <Point key={i} x={x} y={y} color={expression.color} />
      ))}
      {expression.regressionType && pts.length >= 2 && (
        <RegressionCurve points={pts} type={expression.regressionType} color={expression.color} />
      )}
    </>
  );
}, pointsEqual);

function RegressionCurve({
  points,
  type,
  color,
}: {
  points: [number, number][];
  type: RegressionType;
  color: string;
}) {
  const result = useMemo(() => computeRegression(points, type), [points, type]);

  if (!result) return null;

  return (
    <Plot.OfX
      y={(x) => {
        try {
          return result.evaluate(x);
        } catch {
          return NaN;
        }
      }}
      color={color}
      style="dashed"
      opacity={0.7}
    />
  );
}

function pointsEqual(a: { expression: Expression }, b: { expression: Expression }) {
  return (
    a.expression.id === b.expression.id &&
    a.expression.color === b.expression.color &&
    a.expression.visible === b.expression.visible &&
    a.expression.regressionType === b.expression.regressionType &&
    a.expression.points === b.expression.points
  );
}
