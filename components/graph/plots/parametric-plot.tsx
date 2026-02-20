"use client";

import { memo, useMemo } from "react";
import { Plot } from "mafs";

import { latexToExpr } from "@/lib/latex";
import { ceCompileFromLatex, safeEval } from "@/lib/math";
import { useCompiledFn, useSliderScope } from "@/hooks";
import type { Expression } from "@/types";

/**
 * Split parametric LaTeX `\left(X(t),Y(t)\right)` into [xLatex, yLatex].
 * Handles nested braces/parens by tracking depth so we split on the
 * correct comma.
 */
function splitParametricLatex(latex: string): [string, string] | null {
  // Strip outer \left( ... \right) or ( ... )
  const stripped = latex
    .replace(/^\\left\s*\(/, "")
    .replace(/\\right\s*\)$/, "")
    .replace(/^\\mleft\s*\(/, "")
    .replace(/\\mright\s*\)$/, "")
    .replace(/^\(/, "")
    .replace(/\)$/, "");

  let depth = 0;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === "{" || ch === "(") depth++;
    else if (ch === "}" || ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      return [stripped.slice(0, i).trim(), stripped.slice(i + 1).trim()];
    }
  }
  return null;
}

export const ParametricPlot = memo(function ParametricPlot({ expression }: { expression: Expression }) {
  const raw = latexToExpr(expression.latex);
  const parts = raw.split(",").map((s) => s.trim());
  const scope = useSliderScope();
  const [tMin, tMax] = expression.paramRange ?? [0, 2 * Math.PI];

  // Primary: compile directly from LaTeX subexpressions
  const latexParts = useMemo(() => splitParametricLatex(expression.latex), [expression.latex]);
  const xFromLatex = useMemo(
    () => (latexParts ? ceCompileFromLatex(latexParts[0]) : null),
    [latexParts],
  );
  const yFromLatex = useMemo(
    () => (latexParts ? ceCompileFromLatex(latexParts[1]) : null),
    [latexParts],
  );

  // Fallback: compile from plain text
  const xFromPlain = useCompiledFn(parts[0] || "", !xFromLatex);
  const yFromPlain = useCompiledFn(parts[1] || "", !yFromLatex);

  const xCompiled = xFromLatex ?? xFromPlain;
  const yCompiled = yFromLatex ?? yFromPlain;

  if (!xCompiled || !yCompiled) return null;

  return (
    <Plot.Parametric
      t={[tMin, tMax]}
      xy={(t) => {
        const x = safeEval(xCompiled, { ...scope, t });
        const y = safeEval(yCompiled, { ...scope, t });
        return [isNaN(x) ? 0 : x, isNaN(y) ? 0 : y];
      }}
      color={expression.color}
    />
  );
}, expressionEqual);

export const PolarPlot = memo(function PolarPlot({ expression }: { expression: Expression }) {
  const fn = latexToExpr(expression.latex).replace(/^r\s*=\s*/, "");
  const scope = useSliderScope();
  const [tMin, tMax] = expression.paramRange ?? [0, 2 * Math.PI];

  // Primary: compile RHS directly from LaTeX (strip r= prefix)
  const polarLatex = useMemo(
    () => expression.latex.replace(/^\\s*r\\s*=\\s*/, "").replace(/^r\s*=\s*/, ""),
    [expression.latex],
  );
  const fromLatex = useMemo(
    () => ceCompileFromLatex(polarLatex),
    [polarLatex],
  );

  // Fallback: compile from plain text
  const fromPlain = useCompiledFn(fn, !fromLatex);
  const compiled = fromLatex ?? fromPlain;

  if (!compiled) return null;

  return (
    <Plot.Parametric
      t={[tMin, tMax]}
      xy={(t) => {
        const r = safeEval(compiled, { ...scope, theta: t });
        const rv = isNaN(r) ? 0 : r;
        return [rv * Math.cos(t), rv * Math.sin(t)];
      }}
      color={expression.color}
    />
  );
}, expressionEqual);

function expressionEqual(a: { expression: Expression }, b: { expression: Expression }) {
  return (
    a.expression.id === b.expression.id &&
    a.expression.latex === b.expression.latex &&
    a.expression.color === b.expression.color &&
    a.expression.visible === b.expression.visible &&
    a.expression.paramRange?.[0] === b.expression.paramRange?.[0] &&
    a.expression.paramRange?.[1] === b.expression.paramRange?.[1]
  );
}

