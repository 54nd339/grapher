"use client";

import { useMemo } from "react";
import { Plot, Point, Text } from "mafs";

import { compileExpressionLatex, safeEval } from "@/lib/math";
import { useGraphStore } from "@/stores";
import type { Expression } from "@/types";

interface TangentLineProps {
  expression: Expression;
  x: number;
  scope: Record<string, number>;
}

/**
 * Renders a tangent line at point x on the curve, showing slope info.
 */
export function TangentLine({ expression, x, scope }: TangentLineProps) {
  const viewport = useGraphStore((s) => s.viewport);

  const data = useMemo(() => {
    if (
      expression.kind === "slider" ||
      expression.kind === "implicit" ||
      expression.kind === "parametric" ||
      expression.kind === "polar" ||
      expression.kind === "differential" ||
      expression.kind === "points"
    )
      return null;

    const fn = compileExpressionLatex(expression.latex, {
      mode: "graph-2d",
      allowUserFunctions: true,
    });
    if (!fn) return null;

    const y = safeEval(fn, { ...scope, x });
    if (isNaN(y)) return null;

    // Numerical derivative via central difference
    const h = 1e-6;
    const yPlus = safeEval(fn, { ...scope, x: x + h });
    const yMinus = safeEval(fn, { ...scope, x: x - h });
    const slope = (yPlus - yMinus) / (2 * h);
    if (isNaN(slope)) return null;

    return { y, slope };
  }, [expression, x, scope]);

  if (!data) return null;

  const { y, slope } = data;
  const xRange = viewport.xMax - viewport.xMin;
  const lineLen = xRange * 0.3;

  return (
    <>
      <Point x={x} y={y} color={expression.color} />
      <Plot.Parametric
        t={[-lineLen / 2, lineLen / 2]}
        xy={(t) => [x + t, y + slope * t]}
        color={expression.color}
        style="dashed"
        opacity={0.6}
        weight={1.5}
      />
      <Text x={x} y={y} attach="se" attachDistance={18} size={11} color={expression.color}>
        slope: {Math.abs(slope) < 1e-10 ? "0" : slope.toFixed(3)}
      </Text>
    </>
  );
}
