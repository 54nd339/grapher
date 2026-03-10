"use client";

import { useCallback } from "react";

import { latexToExpr } from "@/lib/latex";
import { detectExpressionKind } from "@/lib/math";
import * as rx from "@/lib/math/regex";
import { useExpressionStore } from "@/stores";

function parsePointPairsFromLatex(latex: string): [number, number][] {
  const normalized = latex
    .replace(rx.REGEX_LATEX_LEFT, "")
    .replace(rx.REGEX_LATEX_RIGHT, "")
    .replace(rx.REGEX_WHITESPACE, "");

  const fullPattern = rx.REGEX_POINT_PAIRS_FULL;
  if (!fullPattern.test(normalized)) return [];

  const pairs: [number, number][] = [];
  const regex = rx.REGEX_POINT_PAIR_MATCH;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(normalized)) !== null) {
    pairs.push([Number(match[1]), Number(match[2])]);
  }
  return pairs;
}

/**
 * Hook for expression management.
 * Bridges the expression store with parsing logic.
 */
export function useRemoveExpression() {
  const remove = useExpressionStore((s) => s.remove);
  return remove;
}

export function useUpdateExpression() {
  const update = useExpressionStore((s) => s.update);

  const updateWithDetection = useCallback(
    (id: string, latex: string) => {
      const latexPointPairs = parsePointPairsFromLatex(latex);
      if (latexPointPairs.length > 0) {
        update(id, { latex, kind: "points", points: latexPointPairs });
        return;
      }

      const expr = latexToExpr(latex);
      let kind = detectExpressionKind(expr);

      // Detect Leibniz derivatives in LaTeX that the plain-text detector misses
      if (kind === "algebraic" && rx.REGEX_LEIBNIZ_LATEX_LOOSE.test(latex)) {
        kind = "calculus";
      }

      if (
        kind === "algebraic" &&
        rx.REGEX_CALCULUS_EXPR.test(expr)
      ) {
        kind = "calculus";
      }

      if (kind === "slider") {
        const match = expr.trim().match(rx.REGEX_SLIDER_MATCH);
        const value = match ? Number(match[2]) : 0;
        update(id, {
          latex,
          kind,
          sliderConfig: { min: -10, max: 10, step: 0.1, value, animating: false },
        });
      } else if (kind === "points") {
        const pairs: [number, number][] = [];
        const regex = rx.REGEX_POINT_PAIR_MATCH_LOOSE;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(expr)) !== null) {
          pairs.push([Number(m[1]), Number(m[2])]);
        }
        update(id, { latex, kind, points: pairs });
      } else {
        update(id, { latex, kind });
      }
    },
    [update],
  );

  return updateWithDetection;
}

export function useDuplicateExpression() {
  const duplicate = useExpressionStore((s) => s.duplicate);
  return duplicate;
}
