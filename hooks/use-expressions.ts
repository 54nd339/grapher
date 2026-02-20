"use client";

import { useCallback } from "react";

import { latexToExpr } from "@/lib/latex";
import { detectExpressionKind } from "@/lib/math";
import { useExpressionStore } from "@/stores";

function parsePointPairsFromLatex(latex: string): [number, number][] {
  const normalized = latex
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\s+/g, "");

  const fullPattern = /^\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)(,\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\))*$/;
  if (!fullPattern.test(normalized)) return [];

  const pairs: [number, number][] = [];
  const regex = /\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/g;
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
      if (kind === "algebraic" && /\\frac\{(?:\\mathrm\{d\}|d)\^?\{?\d*\}?\}\{(?:\\mathrm\{d\}|d)/.test(latex)) {
        kind = "calculus";
      }

      if (
        kind === "algebraic" &&
        /(d_upright|\\mathrm\{d\}|\bdy\/dx\b|\bd\^?\{?2\}?\s*y\s*\/\s*dx\^?\{?2\}?)/.test(expr)
      ) {
        kind = "calculus";
      }

      if (kind === "slider") {
        const match = expr.trim().match(/^([a-wA-W])\s*=\s*(-?\d+(?:\.\d+)?)$/);
        const value = match ? Number(match[2]) : 0;
        update(id, {
          latex,
          kind,
          sliderConfig: { min: -10, max: 10, step: 0.1, value, animating: false },
        });
      } else if (kind === "points") {
        const pairs: [number, number][] = [];
        const regex = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
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
