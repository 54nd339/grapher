"use client";

import { latexToExpr } from "@/lib/latex";
import type { Expression } from "@/types";

import { AlgebraicPlot, PiecewisePlot } from "./algebraic-plot";
import { CalculusPlot } from "./calculus-plot";
import { ImplicitPlot } from "./implicit-plot";
import { InequalityPlot } from "./inequality-plot";
import { ParametricPlot, PolarPlot } from "./parametric-plot";
import { PointsPlot } from "./points-plot";
import { SeriesPlot } from "./series-plot";
import { SlopeFieldPlot } from "./slope-field-plot";
import { StatsPlot } from "./stats-plot";

function isLeibnizDerivativeLatex(latex: string): boolean {
  return /\\frac\{(?:\\mathrm\{d\}|d)\^?\{?\d*\}?\}\{(?:\\mathrm\{d\}|d)\s*[a-zA-Z]\^?\{?\d*\}?\}/.test(latex)
    || /d_upright/.test(latex);
}

/** Routes an expression to its appropriate plot component based on kind */
export function ExpressionPlot({ expression }: { expression: Expression }) {
  if (!expression.latex) return null;

  switch (expression.kind) {
    case "parametric":
      return <ParametricPlot expression={expression} />;
    case "polar":
      return <PolarPlot expression={expression} />;
    case "differential":
      if (isLeibnizDerivativeLatex(expression.latex)) {
        return <CalculusPlot expression={expression} />;
      }
      return <SlopeFieldPlot expression={expression} />;
    case "calculus":
      return <CalculusPlot expression={expression} />;
    case "series":
      return <SeriesPlot expression={expression} />;
    case "inequality":
      return <InequalityPlot expression={expression} />;
    case "points":
      return (
        <>
          <PointsPlot expression={expression} />
          {expression.points && expression.points.length >= 3 && (
            <StatsPlot expression={expression} />
          )}
        </>
      );
    case "implicit":
      return <ImplicitPlot expression={expression} />;
    case "slider":
      return null;
    case "trigonometric":
    case "algebraic":
    default: {
      if (isLeibnizDerivativeLatex(expression.latex)) {
        return <CalculusPlot expression={expression} />;
      }
      const raw = latexToExpr(expression.latex).replace(/^y\s*=\s*/, "");
      if (raw.includes("{") && raw.includes(",")) {
        return <PiecewisePlot expression={expression} />;
      }
      return <AlgebraicPlot expression={expression} />;
    }
  }
}
