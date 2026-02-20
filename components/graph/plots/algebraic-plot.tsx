"use client";

import { memo, useMemo } from "react";
import { Plot } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { parseDomainRestriction, safeEval, safeCompile } from "@/lib/math";
import { useCompiledFn, useCompiledFromLatex, useCompiledWithFuncs, useSliderScope } from "@/hooks";
import type { Expression } from "@/types";

export const AlgebraicPlot = memo(function AlgebraicPlot({ expression }: { expression: Expression }) {
  const latexForCompile = useMemo(() => {
    const match = expression.latex.match(/^\s*[a-hj-wA-HJ-W]\s*(?:\\left|\\mleft)?\(.*\)\s*=\s*(.+)$/);
    return match ? match[1].trim() : expression.latex;
  }, [expression.latex]);

  const rawExpr = useMemo(() => latexToExpr(expression.latex), [expression.latex]);
  const raw = useMemo(() => {
    if (/^[a-hj-wA-HJ-W]\s*\([^)]*\)\s*=/.test(rawExpr)) {
      return rawExpr.replace(/^[a-hj-wA-HJ-W]\s*\([^)]*\)\s*=\s*/, "");
    }
    return rawExpr.replace(/^y\s*=\s*/, "");
  }, [rawExpr]);
  const { fn, condition } = useMemo(() => parseDomainRestriction(raw), [raw]);
  const hasUserFunctionCall = useMemo(
    () => /\b[a-hj-wA-HJ-W]\s*\(/.test(raw),
    [raw],
  );
  const fromFuncs = useCompiledWithFuncs(latexForCompile, hasUserFunctionCall);
  const fromLatex = useCompiledFromLatex(latexForCompile, !hasUserFunctionCall);
  const fromPlain = useCompiledFn(fn, !hasUserFunctionCall);
  const compiled = hasUserFunctionCall
    ? (fromFuncs ?? fromLatex ?? fromPlain)
    : (fromLatex ?? fromPlain ?? fromFuncs);
  const scope = useSliderScope();

  if (!compiled) return null;

  return (
    <Plot.OfX
      y={(x) => {
        if (condition && !condition(x)) return NaN;
        return safeEval(compiled, { ...scope, x });
      }}
      color={expression.color}
    />
  );
}, expressionEqual);

export const PiecewisePlot = memo(function PiecewisePlot({ expression }: { expression: Expression }) {
  const raw = latexToExpr(expression.latex).replace(/^y\s*=\s*/, "");
  const scope = useSliderScope();

  const segments = useMemo(() => {
    return raw.split(",").map((seg) => seg.trim()).filter(Boolean).map((seg) => {
      const { fn, condition } = parseDomainRestriction(seg);
      const compiled = safeCompile(fn);
      return { compiled, condition };
    });
  }, [raw]);

  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.compiled) return null;
        const { compiled, condition } = seg;
        return (
          <Plot.OfX
            key={i}
            y={(x) => {
              if (condition && !condition(x)) return NaN;
              return safeEval(compiled, { ...scope, x });
            }}
            color={expression.color}
          />
        );
      })}
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
