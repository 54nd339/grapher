"use client";

import { useMemo } from "react";

import { latexToExpr } from "@/lib/latex";
import { ceCompile, ceCompileFromLatex, ceCompileFromLatexWithFuncs, type EvalFn, rebuildRegistry } from "@/lib/math";
import { useExpressionStore } from "@/stores";

export function useCompiledFn(expr: string, enabled = true): EvalFn | null {
  return useMemo(() => (enabled ? ceCompile(expr) : null), [enabled, expr]);
}

/** Compile directly from LaTeX — handles \log_{10}, \sqrt[3]{x}, Leibniz d/dx */
export function useCompiledFromLatex(latex: string, enabled = true): EvalFn | null {
  return useMemo(() => (enabled ? ceCompileFromLatex(latex) : null), [enabled, latex]);
}

/**
 * Compile LaTeX with user-defined function expansion.
 * Rebuilds the function registry from all expressions so that
 * references like f(x)+3 resolve to the definition of f.
 */
export function useCompiledWithFuncs(latex: string, enabled = true): EvalFn | null {
  const expressions = useExpressionStore((s) => s.expressions);

  // derive a stable key from just the function-definition LaTeX strings
  // so non-definition edits don't invalidate the expensive recompilation
  const funcDefsKey = useMemo(() => {
    const keys: string[] = [];
    for (const e of expressions) {
      if (e.latex && /^[a-hj-wA-HJ-W]\s*(?:\\left|\\mleft)?\s*\(/.test(e.latex.trim())) {
        keys.push(e.latex);
      }
    }
    return keys.join("\0");
  }, [expressions]);

  return useMemo(() => {
    if (!enabled) return null;
    rebuildRegistry(expressions);
    return ceCompileFromLatexWithFuncs(latex);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- funcDefsKey is a derived stable proxy
  }, [enabled, latex, funcDefsKey]);
}

/**
 * Collect all slider expressions into a scope map.
 * Allows expressions like "y = a * sin(x)" to pick up "a" from a slider.
 */
export function useSliderScope(): Record<string, number> {
  const expressions = useExpressionStore((s) => s.expressions);
  return useMemo(() => {
    const scope: Record<string, number> = {};
    for (const e of expressions) {
      if (e.kind === "slider" && e.sliderConfig) {
        const match = latexToExpr(e.latex).trim().match(/^([a-wA-W])/);
        if (match) scope[match[1]] = e.sliderConfig.value;
      }
    }
    return scope;
  }, [expressions]);
}
