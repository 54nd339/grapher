"use client";

import { useMemo } from "react";
import { Point, Plot, Text, Line } from "mafs";

import { compileExpressionLatex, safeEval, curvature, arcLength } from "@/lib/math";
import { useGraphStore } from "@/stores";
import type { Expression } from "@/types";

interface CurvatureOverlayProps {
  expression: Expression;
  scope: Record<string, number>;
  hoverX: number | null;
}

/**
 * Shows curvature info and osculating circle at hover point.
 * Also displays arc length in the viewport range.
 */
export function CurvatureOverlay({ expression, scope, hoverX }: CurvatureOverlayProps) {
  const viewport = useGraphStore((s) => s.viewport);

  const fn = useMemo(() => {
    if (
      expression.kind === "slider" ||
      expression.kind === "implicit" ||
      expression.kind === "points" ||
      expression.kind === "parametric" ||
      expression.kind === "polar"
    )
      return null;

    return compileExpressionLatex(expression.latex, { mode: "graph-2d" });
  }, [expression]);

  const arcLen = useMemo(() => {
    if (!fn) return null;
    const len = arcLength(fn, viewport.xMin, viewport.xMax, scope);
    return isFinite(len) ? len : null;
  }, [fn, viewport.xMin, viewport.xMax, scope]);

  const curveData = useMemo(() => {
    if (!fn || hoverX == null) return null;

    const y = safeEval(fn, { ...scope, x: hoverX });
    if (isNaN(y)) return null;

    const k = curvature(fn, hoverX, scope);
    if (isNaN(k) || Math.abs(k) < 1e-10) return null;

    const radius = 1 / Math.abs(k);
    if (radius > 100) return null;

    // Compute center of osculating circle
    const h = 1e-5;
    const yp = safeEval(fn, { ...scope, x: hoverX + h });
    const ym = safeEval(fn, { ...scope, x: hoverX - h });
    const fp = (yp - ym) / (2 * h);
    const denom = 1 + fp * fp;
    const nx = -fp / Math.sqrt(denom);
    const ny = 1 / Math.sqrt(denom);
    const sign = k > 0 ? 1 : -1;

    return {
      y,
      k,
      radius,
      cx: hoverX + sign * nx * radius,
      cy: y + sign * ny * radius,
    };
  }, [fn, hoverX, scope]);

  if (!fn) return null;

  return (
    <>
      {/* Arc length display */}
      {arcLen !== null && (
        <Text
          x={viewport.xMax - (viewport.xMax - viewport.xMin) * 0.02}
          y={viewport.yMax - (viewport.yMax - viewport.yMin) * 0.05}
          attach="ne"
          size={10}
          color={expression.color}
        >
          L ≈ {arcLen.toFixed(3)}
        </Text>
      )}

      {/* Osculating circle at hover point */}
      {curveData && (
        <>
          <Point x={curveData.cx} y={curveData.cy} color={expression.color} opacity={0.4} />
          <Plot.Parametric
            t={[0, 2 * Math.PI]}
            xy={(t) => [
              curveData.cx + curveData.radius * Math.cos(t),
              curveData.cy + curveData.radius * Math.sin(t),
            ]}
            color={expression.color}
            opacity={0.3}
            style="dashed"
            weight={1}
          />
          <Line.Segment
            point1={[hoverX!, curveData.y]}
            point2={[curveData.cx, curveData.cy]}
            color={expression.color}
            opacity={0.2}
            style="dashed"
          />
          <Text
            x={hoverX!}
            y={curveData.y}
            attach="sw"
            attachDistance={16}
            size={10}
            color={expression.color}
          >
            κ={curveData.k.toFixed(4)}, R={curveData.radius.toFixed(3)}
          </Text>
        </>
      )}
    </>
  );
}
