"use client";

import { memo, useMemo } from "react";
import { Plot, Polygon, type vec } from "mafs";

import { latexToExpr, getCE } from "@/lib/latex";
import { ceCompileFromLatex, type EvalFn, safeEval, simpsonIntegrate } from "@/lib/math";
import { useCompiledFn, useCompiledFromLatex, useSliderScope } from "@/hooks";
import type { Expression } from "@/types";

export const CalculusPlot = memo(function CalculusPlot({ expression }: { expression: Expression }) {
  const raw = latexToExpr(expression.latex);

  // 4-arg format: int(body, var, lower, upper)
  const intMatch4 = raw.match(/^int\((.+),\s*(\w+),\s*([^,]+),\s*([^)]+)\)$/);
  if (intMatch4) {
    const [, body, integVar, lowerStr, upperStr] = intMatch4;
    const lowerNum = Number(lowerStr.trim());
    const upperNum = Number(upperStr.trim());
    const hasVarBound = !isFinite(lowerNum) || !isFinite(upperNum);

    if (hasVarBound) {
      return (
        <VariableBoundIntegralPlot
          body={body}
          integVar={integVar}
          lowerExpr={lowerStr.trim()}
          upperExpr={upperStr.trim()}
          color={expression.color}
        />
      );
    }

    return (
      <IntegralPlot body={body} lower={lowerNum} upper={upperNum} color={expression.color} />
    );
  }

  // Legacy 3-arg format: int(body, lower, upper)
  const intMatch3 = raw.match(/^int\((.+),\s*([^,]+),\s*([^)]+)\)$/);
  if (intMatch3) {
    return (
      <IntegralPlot
        body={intMatch3[1]}
        lower={Number(intMatch3[2])}
        upper={Number(intMatch3[3])}
        color={expression.color}
      />
    );
  }

  // Detect derivative: diff(expr, x) or derivative(expr)
  const diffMatch = raw.match(/^(?:diff|derivative)\((.+?)(?:,\s*\w+)?\)$/);
  if (diffMatch) {
    return <DerivativePlot body={diffMatch[1]} color={expression.color} />;
  }

  // Leibniz derivative that the plain-text parser couldn't match
  return <LeibnizPlot latex={expression.latex} color={expression.color} />;
}, expressionEqual);

function DerivativePlot({ body, color }: { body: string; color: string }) {
  const scope = useSliderScope();

  const { origFn, derivFn } = useMemo(() => {
    try {
      const ce = getCE();
      const parsed = ce.parse(body, { strict: false });
      const dExpr = ce.box(["D", parsed.json, "x"]).evaluate();

      const origResult = ceCompileFromLatex(parsed.latex);
      const derivResult = dExpr ? ceCompileFromLatex(dExpr.latex) : null;
      return { origFn: origResult, derivFn: derivResult };
    } catch {
      return { origFn: null as EvalFn | null, derivFn: null as EvalFn | null };
    }
  }, [body]);

  if (!origFn || !derivFn) return null;

  return (
    <>
      <Plot.OfX
        y={(x) => safeEval(origFn, { ...scope, x })}
        color={color}
      />
      <Plot.OfX
        y={(x) => safeEval(derivFn, { ...scope, x })}
        color={color}
        style="dashed"
        opacity={0.7}
      />
    </>
  );
}

function LeibnizPlot({ latex, color }: { latex: string; color: string }) {
  const normalizedLatex = useMemo(
    () => latex
      .replace(/\\dfrac/g, "\\frac")
      .replace(/\\tfrac/g, "\\frac")
      .replace(/\\mathrm\{d\}/g, "d")
      .replace(/d_upright/g, "d"),
    [latex],
  );
  const normalizedCompiled = useCompiledFromLatex(normalizedLatex);
  const fallbackCompiled = useCompiledFromLatex(latex);
  const compiled = normalizedCompiled ?? fallbackCompiled;
  const scope = useSliderScope();
  if (!compiled) return null;
  return (
    <Plot.OfX
      y={(x) => safeEval(compiled, { ...scope, x })}
      color={color}
    />
  );
}

function IntegralPlot({
  body,
  lower,
  upper,
  color,
}: {
  body: string;
  lower: number;
  upper: number;
  color: string;
}) {
  const fromLatex = useCompiledFromLatex(body);
  const fromPlain = useCompiledFn(body, !fromLatex);
  const compiled = fromLatex ?? fromPlain;
  const scope = useSliderScope();

  const regions = useMemo(() => {
    if (!compiled || !isFinite(lower) || !isFinite(upper)) return [];
    const steps = 100;
    const dx = (upper - lower) / steps;
    const result: { points: vec.Vector2[]; positive: boolean }[] = [];
    let current: vec.Vector2[] = [[lower, 0]];
    let lastY = 0;

    for (let i = 0; i <= steps; i++) {
      const x = lower + i * dx;
      const y = safeEval(compiled, { ...scope, x });
      const yv = isNaN(y) ? 0 : y;

      if (i > 0 && lastY * yv < 0) {
        const crossX = x - dx * (lastY / (lastY - yv));
        current.push([crossX, 0]);
        result.push({ points: [...current, [crossX, 0]], positive: lastY >= 0 });
        current = [[crossX, 0]];
      }

      current.push([x, yv]);
      lastY = yv;
    }

    current.push([upper, 0]);
    result.push({ points: current, positive: lastY >= 0 });
    return result;
  }, [compiled, lower, upper, scope]);

  if (regions.length === 0) return null;

  return (
    <>
      <Plot.OfX
        y={(x) => safeEval(compiled!, { ...scope, x })}
        color={color}
      />
      {regions.map((region, i) => (
        <Polygon
          key={i}
          points={region.points}
          color={color}
          fillOpacity={region.positive ? 0.2 : 0.1}
        />
      ))}
    </>
  );
}

function VariableBoundIntegralPlot({
  body,
  integVar,
  lowerExpr,
  upperExpr,
  color,
}: {
  body: string;
  integVar: string;
  lowerExpr: string;
  upperExpr: string;
  color: string;
}) {
  const bodyFromLatex = useCompiledFromLatex(body);
  const bodyFromPlain = useCompiledFn(body, !bodyFromLatex);
  const bodyCompiled = bodyFromLatex ?? bodyFromPlain;

  const lowerFromLatex = useCompiledFromLatex(lowerExpr);
  const lowerFromPlain = useCompiledFn(lowerExpr, !lowerFromLatex);
  const lowerCompiled = lowerFromLatex ?? lowerFromPlain;

  const upperFromLatex = useCompiledFromLatex(upperExpr);
  const upperFromPlain = useCompiledFn(upperExpr, !upperFromLatex);
  const upperCompiled = upperFromLatex ?? upperFromPlain;
  const scope = useSliderScope();

  if (!bodyCompiled) return null;

  return (
    <Plot.OfX
      y={(x) => {
        const lo = lowerCompiled ? safeEval(lowerCompiled, { ...scope, x }) : NaN;
        const hi = upperCompiled ? safeEval(upperCompiled, { ...scope, x }) : NaN;
        if (isNaN(lo) || isNaN(hi)) return NaN;
        return simpsonIntegrate(bodyCompiled, integVar, lo, hi, scope);
      }}
      color={color}
    />
  );
}

function expressionEqual(a: { expression: Expression }, b: { expression: Expression }) {
  return (
    a.expression.id === b.expression.id &&
    a.expression.latex === b.expression.latex &&
    a.expression.color === b.expression.color &&
    a.expression.visible === b.expression.visible
  );
}
