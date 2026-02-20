"use client";

import { memo } from "react";
import { Plot } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { evaluateSeriesPartialSum, evaluateSeriesPartialProd, safeEval } from "@/lib/math";
import { useCompiledFn, useCompiledFromLatex, useSliderScope } from "@/hooks";
import type { Expression } from "@/types";

function normalizeBound(bound: string): string {
  const trimmed = bound.trim();
  return trimmed.includes("=") ? trimmed.split("=").pop()!.trim() : trimmed;
}

export const SeriesPlot = memo(function SeriesPlot({ expression }: { expression: Expression }) {
  const raw = latexToExpr(expression.latex);
  const scope = useSliderScope();

  const sumMatch = raw.match(/^sum\((.+),\s*(\w+),\s*([^,]+),\s*([^)]+)\)$/);
  if (sumMatch) {
    return (
      <SumPlot
        body={sumMatch[1]}
        variable={sumMatch[2]}
        lowerStr={sumMatch[3]}
        upperStr={sumMatch[4]}
        scope={scope}
        color={expression.color}
      />
    );
  }

  const prodMatch = raw.match(/^prod\((.+),\s*(\w+),\s*([^,]+),\s*([^)]+)\)$/);
  if (prodMatch) {
    return (
      <ProdPlot
        body={prodMatch[1]}
        variable={prodMatch[2]}
        lowerStr={prodMatch[3]}
        upperStr={prodMatch[4]}
        scope={scope}
        color={expression.color}
      />
    );
  }

  return null;
}, expressionEqual);

function SumPlot({
  body,
  variable,
  lowerStr,
  upperStr,
  scope,
  color,
}: {
  body: string;
  variable: string;
  lowerStr: string;
  upperStr: string;
  scope: Record<string, number>;
  color: string;
}) {
  const lowerExpr = normalizeBound(lowerStr);
  const upperExpr = normalizeBound(upperStr);

  const lowerNum = Number(lowerExpr);
  const upperNum = Number(upperExpr);
  const lowerVar = !isFinite(lowerNum);
  const upperVar = !isFinite(upperNum);
  const lowerFromLatex = useCompiledFromLatex(lowerVar ? lowerExpr : "");
  const lowerFromPlain = useCompiledFn(lowerVar ? lowerExpr : "", !lowerFromLatex);
  const lowerCompiled = lowerFromLatex ?? lowerFromPlain;

  const upperFromLatex = useCompiledFromLatex(upperVar ? upperExpr : "");
  const upperFromPlain = useCompiledFn(upperVar ? upperExpr : "", !upperFromLatex);
  const upperCompiled = upperFromLatex ?? upperFromPlain;

  return (
    <Plot.OfX
      y={(x) => {
        try {
          const lo = lowerVar
            ? Math.floor(lowerCompiled ? safeEval(lowerCompiled, { ...scope, x }) : NaN)
            : lowerNum;
          const hi = upperVar
            ? Math.floor(upperCompiled ? safeEval(upperCompiled, { ...scope, x }) : NaN)
            : upperNum;
          if (!isFinite(lo) || !isFinite(hi) || hi - lo > 1000) return NaN;
          const result = evaluateSeriesPartialSum(body, variable, lo, hi, { ...scope, x });
          if (!isFinite(result) || Math.abs(result) > 1e6) return NaN;
          return result;
        } catch {
          return NaN;
        }
      }}
      color={color}
    />
  );
}

function ProdPlot({
  body,
  variable,
  lowerStr,
  upperStr,
  scope,
  color,
}: {
  body: string;
  variable: string;
  lowerStr: string;
  upperStr: string;
  scope: Record<string, number>;
  color: string;
}) {
  const lowerExpr = normalizeBound(lowerStr);
  const upperExpr = normalizeBound(upperStr);

  const lowerNum = Number(lowerExpr);
  const upperNum = Number(upperExpr);
  const lowerVar = !isFinite(lowerNum);
  const upperVar = !isFinite(upperNum);
  const lowerFromLatex = useCompiledFromLatex(lowerVar ? lowerExpr : "");
  const lowerFromPlain = useCompiledFn(lowerVar ? lowerExpr : "", !lowerFromLatex);
  const lowerCompiled = lowerFromLatex ?? lowerFromPlain;

  const upperFromLatex = useCompiledFromLatex(upperVar ? upperExpr : "");
  const upperFromPlain = useCompiledFn(upperVar ? upperExpr : "", !upperFromLatex);
  const upperCompiled = upperFromLatex ?? upperFromPlain;

  return (
    <Plot.OfX
      y={(x) => {
        try {
          const lo = lowerVar
            ? Math.floor(lowerCompiled ? safeEval(lowerCompiled, { ...scope, x }) : NaN)
            : lowerNum;
          const hi = upperVar
            ? Math.floor(upperCompiled ? safeEval(upperCompiled, { ...scope, x }) : NaN)
            : upperNum;
          if (!isFinite(lo) || !isFinite(hi) || hi - lo > 1000) return NaN;
          const result = evaluateSeriesPartialProd(body, variable, lo, hi, { ...scope, x });
          if (!isFinite(result) || Math.abs(result) > 1e6) return NaN;
          return result;
        } catch {
          return NaN;
        }
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
