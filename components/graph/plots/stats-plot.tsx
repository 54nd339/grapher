"use client";

import { memo, useMemo } from "react";
import { Polygon, Point, Text, Line } from "mafs";

import { histogram, descriptiveStats, convexHull } from "@/lib/math";
import type { Expression } from "@/types";

/**
 * Renders statistical visualizations for point-type expressions.
 * Includes: scatter plot, histogram bins, mean/median lines, convex hull.
 */
export const StatsPlot = memo(function StatsPlot({
  expression,
}: {
  expression: Expression;
}) {
  const points = useMemo(() => expression.points ?? [], [expression.points]);

  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const xStats = useMemo(() => descriptiveStats(xs), [xs]);
  const yStats = useMemo(() => descriptiveStats(ys), [ys]);

  const hull = useMemo(() => convexHull(points), [points]);

  const bins = useMemo(() => histogram(xs, Math.min(10, Math.ceil(xs.length / 2))), [xs]);

  if (points.length < 2) return null;

  return (
    <>
      {/* Convex hull outline */}
      {hull.length >= 3 && (
        <Polygon
          points={hull}
          color={expression.color}
          fillOpacity={0.05}
          strokeOpacity={0.3}
        />
      )}

      {/* Scatter points */}
      {points.map(([x, y], i) => (
        <Point key={i} x={x} y={y} color={expression.color} />
      ))}

      {/* Mean crosshair */}
      <Line.Segment
        point1={[xStats.mean, yStats.min - 0.5]}
        point2={[xStats.mean, yStats.max + 0.5]}
        color={expression.color}
        opacity={0.3}
        style="dashed"
      />
      <Line.Segment
        point1={[xStats.min - 0.5, yStats.mean]}
        point2={[xStats.max + 0.5, yStats.mean]}
        color={expression.color}
        opacity={0.3}
        style="dashed"
      />

      {/* Mean label */}
      <Text
        x={xStats.mean}
        y={yStats.max + 0.8}
        size={10}
        color={expression.color}
        attach="n"
      >
        x̄={xStats.mean.toFixed(2)}
      </Text>

      {/* Histogram bars along x-axis */}
      {bins.map((bin, i) => {
        if (bin.count === 0) return null;
        const barHeight = bin.count * 0.3;
        return (
          <Polygon
            key={`bin-${i}`}
            points={[
              [bin.lo, 0],
              [bin.hi, 0],
              [bin.hi, -barHeight],
              [bin.lo, -barHeight],
            ]}
            color={expression.color}
            fillOpacity={0.15}
            strokeOpacity={0.3}
          />
        );
      })}
    </>
  );
});
