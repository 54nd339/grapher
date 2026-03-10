"use client";

import { useMemo } from "react";
import { Plot, Point, Text } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { compileExpressionLatex, implicitTangentSlope,safeEval, tryParametrizeImplicit } from "@/lib/math";
import { useGraphStore } from "@/stores";

import type { TraceHit } from "./curve-trace";

interface TangentLineProps {
  hit: TraceHit;
  scope: Record<string, number>;
}

/**
 * Renders a tangent line at the trace hit point, showing slope info.
 */
export function TangentLine({ hit, scope }: TangentLineProps) {
  const viewport = useGraphStore((s) => s.viewport);
  const { expression, mathX: x, mathY: y } = hit;

  const data = useMemo(() => {
    if (
      expression.kind === "slider" ||
      expression.kind === "points" ||
      expression.kind === "differential"
    )
      return null;

    if (expression.kind === "implicit") {
      const plain = latexToExpr(expression.latex);
      const param = tryParametrizeImplicit(plain);

      if (param?.kind === "circle") {
        const dx = x - param.cx;
        const dy = y - param.cy;
        if (Math.abs(dy) < 1e-12) return { y, slope: Infinity };
        return { y, slope: -dx / dy };
      }

      const fn = compileExpressionLatex(expression.latex, { mode: "graph-2d" });
      if (!fn) return null;
      const slope = implicitTangentSlope(fn, x, y, scope);
      return { y, slope };
    }

    const fn = compileExpressionLatex(expression.latex, {
      mode: "graph-2d",
      allowUserFunctions: true,
    });
    if (!fn) return null;

    const yVal = safeEval(fn, { ...scope, x });
    if (isNaN(yVal)) return null;

    // Numerical derivative via central difference
    const h = 1e-6;
    const yPlus = safeEval(fn, { ...scope, x: x + h });
    const yMinus = safeEval(fn, { ...scope, x: x - h });
    const slope = (yPlus - yMinus) / (2 * h);
    if (isNaN(slope)) return null;

    return { y: yVal, slope };
  }, [expression, x, y, scope]);

  if (!data) return null;

  const { slope } = data;
  const xRange = viewport.xMax - viewport.xMin;
  const lineLen = xRange * 0.3;

  return (
    <>
      <Point x={x} y={data.y} color={expression.color} />
      {isFinite(slope) ? (
        <Plot.Parametric
          t={[-lineLen / 2, lineLen / 2]}
          xy={(t) => [x + t, data.y + slope * t]}
          color={expression.color}
          style="dashed"
          opacity={0.6}
          weight={1.5}
        />
      ) : (
        <Plot.Parametric
          t={[-lineLen / 2, lineLen / 2]}
          xy={(t) => [x, data.y + t]}
          color={expression.color}
          style="dashed"
          opacity={0.6}
          weight={1.5}
        />
      )}
      <Text x={x} y={data.y} attach="se" attachDistance={18} size={11} color={expression.color}>
        slope: {Math.abs(slope) < 1e-10 ? "0" : isFinite(slope) ? slope.toFixed(3) : "∞"}
      </Text>
    </>
  );
}

