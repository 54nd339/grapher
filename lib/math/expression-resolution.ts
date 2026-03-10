/**
 * Unified expression compilation pipeline.
 *
 * This is the **single entry-point** for turning a LaTeX string into a
 * numeric evaluation function `(scope) → number`. All consumers (plots,
 * curve trace, analysis, solver) should go through this module.
 *
 * The pipeline:
 *  1. CE direct LaTeX compile (handles algebraic, trig, integrals, Leibniz d/dx)
 *  2. Plain-text round-trip fallback for legacy edge-cases
 *  3. Pattern-based strategies for Sum, Product expressions
 *     (CE can parse these but can't compile them to JS evaluators)
 */

import { latexToExpr, normalizeLatexInput } from "@/lib/latex";

import {
  ceCompile,
  ceCompileFromLatex,
  ceCompileFromLatexWithFuncs,
  type EvalFn,
} from "./ce-compile";
import { safeEval } from "./ce-compile";
import { isLeibnizDerivativeLatex } from "./parser";
import * as rx from "./regex";

export type ExpressionMode = "none" | "graph-2d" | "graph-3d" | "auto";

function stripLeadingDefinition(expr: string, mode: ExpressionMode): string {
  let out = expr.trim();

  if (mode === "graph-2d" || mode === "auto") {
    out = out
      .replace(/^y\s*=\s*/, "")
      .replace(/^[a-zA-Z][a-zA-Z0-9_]*\s*\(\s*x\s*\)\s*=\s*/, "");
  }

  if (mode === "graph-3d" || mode === "auto") {
    out = out.replace(/^z\s*=\s*/, "");
  }

  return out.trim();
}

export function toPlainExpression(latex: string, mode: ExpressionMode = "none"): string {
  const plain = latexToExpr(latex).trim();
  return stripLeadingDefinition(plain, mode);
}

/* ── Pattern-based evaluator strategies ────────────────── */

const MAX_SERIES_ITERATIONS = 10000;

function normalizeBound(bound: string): string {
  const t = bound.trim();
  return t.includes("=") ? t.split("=").pop()!.trim() : t;
}

/**
 * Try to compile a sum/prod plain-text expression into an evaluator.
 * sum(body, var, lo, hi) or prod(body, var, lo, hi)
 */
function tryCompileSeries(
  raw: string,
  mode: "sum" | "prod",
): EvalFn | null {
  const re = mode === "sum"
    ? /^sum\((.+),\s*(\w+),\s*([^,]+),\s*([^)]+)\)$/
    : /^prod\((.+),\s*(\w+),\s*([^,]+),\s*([^)]+)\)$/;
  const m = raw.match(re);
  if (!m) return null;

  const [, body, variable, loStr, hiStr] = m;
  const loExpr = normalizeBound(loStr);
  const hiExpr = normalizeBound(hiStr);
  const loNum = Number(loExpr);
  const hiNum = Number(hiExpr);
  const loIsVar = !isFinite(loNum);
  const hiIsVar = !isFinite(hiNum);
  const loFn = loIsVar ? (ceCompileFromLatex(loExpr) ?? ceCompile(loExpr)) : null;
  const hiFn = hiIsVar ? (ceCompileFromLatex(hiExpr) ?? ceCompile(hiExpr)) : null;

  // Pre-compile the body once
  const bodyFn = ceCompile(body);
  if (!bodyFn) return null;

  const accumulate = mode === "sum"
    ? (total: number, val: number) => total + val
    : (total: number, val: number) => total * val;
  const identity = mode === "sum" ? 0 : 1;

  return (scope: Record<string, number>) => {
    const lo = loIsVar ? Math.floor(loFn ? safeEval(loFn, scope) : NaN) : loNum;
    const hi = hiIsVar ? Math.floor(hiFn ? safeEval(hiFn, scope) : NaN) : hiNum;
    if (!isFinite(lo) || !isFinite(hi) || hi - lo > MAX_SERIES_ITERATIONS) return NaN;

    let total = identity;
    for (let k = lo; k <= hi; k++) {
      const val = bodyFn({ ...scope, [variable]: k });
      if (typeof val !== "number" || !isFinite(val)) {
        return mode === "prod" ? NaN : total;
      }
      total = accumulate(total, val);
    }
    return total;
  };
}

/* ── Main entry-point ──────────────────────────────────── */

/**
 * Compile a LaTeX expression string into a fast JS evaluation function.
 * Handles all expression types: algebraic, trig, integrals, Leibniz
 * derivatives, sums, and products — in a single call.
 */
export function compileExpressionLatex(
  latex: string,
  opts: {
    mode?: ExpressionMode;
    allowUserFunctions?: boolean;
  } = {},
): EvalFn | null {
  const mode = opts.mode ?? "auto";
  const allowUserFunctions = opts.allowUserFunctions ?? true;
  // 0. Leibniz derivatives MUST go through ceCompileFromLatex which has
  //    the LEIBNIZ_RE handler. ceCompileFromLatexWithFuncs would let CE
  //    misparse d^n/dx^n as variable multiplication, returning a wrong result.
  const normalized = normalizeLatexInput(latex).trim();
  const withoutPrefix = normalized.replace(rx.REGEX_LATEX_PREFIX, "").trim();
  const isLeibniz = isLeibnizDerivativeLatex(withoutPrefix);

  if (isLeibniz) {
    const fn = ceCompileFromLatex(latex);
    if (fn) return fn;
  }

  // 1. Try CE direct LaTeX compilation (with user function expansion)
  if (allowUserFunctions) {
    const fn = ceCompileFromLatexWithFuncs(latex);
    if (fn) return fn;
  }

  // 2. Try raw LaTeX compilation
  const fnLatex = ceCompileFromLatex(latex);
  if (fnLatex) return fnLatex;

  // 3. Plain-text round-trip for patterns CE can't compile to JS
  const plain = toPlainExpression(latex, mode);

  // 3a. Sum/Product — CE parses these but can't compile them to JS evaluators
  const sumFn = tryCompileSeries(plain, "sum");
  if (sumFn) return sumFn;
  const prodFn = tryCompileSeries(plain, "prod");
  if (prodFn) return prodFn;

  // 3b. Generic plain-text compilation
  return ceCompileFromLatex(plain) ?? ceCompile(plain);
}

export function getSliderSymbolFromLatex(latex: string): string | null {
  const plain = toPlainExpression(latex, "none");
  const match = plain.match(rx.REGEX_PLAIN_IDENTIFIER);
  return match ? match[1] : null;
}
