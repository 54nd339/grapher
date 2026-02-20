/**
 * CE-powered expression compilation for hot-loop evaluation (JS)
 * and GPU-accelerated rendering (GLSL).
 *
 * LRU cache prevents repeated parsing during slider animations
 * and re-renders. Bounded to 64 entries to cap memory.
 */

import { compile as ceCompileExpr } from "@cortex-js/compute-engine";

import { getCE, normalizeLatexInput } from "@/lib/latex";
import { expandFunctionRefs, getRegistryVersion, parseFuncDef } from "@/lib/math/function-registry";

export type EvalFn = (scope: Record<string, number>) => number;

export interface GLSLResult {
  code: string;
  preamble: string;
}

const MAX_CACHE = 64;
const jsCache = new Map<string, EvalFn | null>();
const latexJsCache = new Map<string, EvalFn | null>();

function lruGet<T>(cache: Map<string, T>, key: string): { hit: boolean; value: T | undefined } {
  if (!cache.has(key)) return { hit: false, value: undefined };
  const value = cache.get(key)!;
  // Move to end to mark as recently used
  cache.delete(key);
  cache.set(key, value);
  return { hit: true, value };
}

function lruSet<T>(cache: Map<string, T>, key: string, value: T, max = MAX_CACHE): void {
  if (cache.size >= max) {
    cache.delete(cache.keys().next().value!);
  }
  cache.set(key, value);
}

/**
 * Compile a plain expression string into a fast JS evaluation function.
 * Accepts the plain-text format produced by `latexToExpr()`.
 * Uses canonical form (not raw) to avoid Delimiter parse nodes that
 * the compiler cannot handle (e.g. `x^(2)` → Delimiter wrapping the exponent).
 * Returns null on parse/compile failure.
 */
export function ceCompile(expr: string): EvalFn | null {
  if (!expr.trim()) return null;
  const cached = lruGet(jsCache, expr);
  if (cached.hit) return cached.value ?? null;
  try {
    const boxed = getCE().parse(expr, { strict: false });
    const result = ceCompileExpr(boxed, { to: "javascript" });
    if (!result.success || !result.run) {
      lruSet(jsCache, expr, null);
      return null;
    }
    const fn = wrapRun(result.run);
    lruSet(jsCache, expr, fn);
    return fn;
  } catch {
    lruSet(jsCache, expr, null);
    return null;
  }
}

/**
 * Compile safely, returning null on failure.
 */
export function safeCompile(expr: string): EvalFn | null {
  return ceCompile(expr);
}

// Matches higher-order Leibniz notation CE can't parse directly:
//   \frac{d^{n}}{dx^{n}}  or  \frac{\mathrm{d}^{n}}{\mathrm{d}x^{n}}
const LEIBNIZ_RE =
  /^\\frac\{(?:\\mathrm\{d\}|d)\^?\{?(\d+)?\}?\}\{(?:\\mathrm\{d\}|d)\s*(\w)\^?\{?\d*\}?\}(.+)$/;

function wrapRun(run: (scope: Record<string, number>) => unknown): EvalFn {
  return (scope) => {
    try {
      const r = run(scope);
      return typeof r === "number" ? r : (r as { re: number }).re ?? NaN;
    } catch {
      // CE-compiled code may reference internal symbols (e.g. "Nothing")
      // that don't exist in the JS scope — treat as evaluation failure.
      return NaN;
    }
  };
}

/**
 * Compile LaTeX directly to a JS evaluation function.
 * CE's LaTeX parser handles \log_{10}, \sqrt[3]{x}, etc. correctly
 * without the lossy plain-text round-trip.
 *
 * For higher-order Leibniz derivatives (\frac{d^n}{dx^n}),
 * applies CE's symbolic D function iteratively since CE only
 * auto-detects first-order d/dx.
 */
export function ceCompileFromLatex(latex: string): EvalFn | null {
  if (!latex.trim()) return null;
  const cached = lruGet(latexJsCache, latex);
  if (cached.hit) return cached.value ?? null;
  try {
    const ce = getCE();
    const normalizedLatex = normalizeLatexInput(latex);
    if (!ce || typeof ce.parse !== "function" || typeof ce.box !== "function") {
      lruSet(latexJsCache, latex, null);
      return null;
    }

    // Handle higher-order Leibniz derivatives that CE misparses
    const leibniz = LEIBNIZ_RE.exec(normalizedLatex);
    if (leibniz) {
      const order = leibniz[1] ? parseInt(leibniz[1], 10) : 1;
      const diffVar = leibniz[2];
      const bodyLatex = leibniz[3].trim();
      const parsedBody = ce.parse(bodyLatex, { strict: false });
      if (!parsedBody || typeof parsedBody !== "object" || !("json" in parsedBody)) {
        lruSet(latexJsCache, latex, null);
        return null;
      }
      let expr = ce.box(parsedBody.json as Parameters<typeof ce.box>[0]);
      for (let i = 0; i < order; i++) {
        expr = ce.box(["D", expr, diffVar]).evaluate();
      }
      const result = ceCompileExpr(expr, { to: "javascript" });
      if (!result.success || !result.run) {
        lruSet(latexJsCache, latex, null);
        return null;
      }
      const fn = wrapRun(result.run);
      lruSet(latexJsCache, latex, fn);
      return fn;
    }

    const parsed = ce.parse(normalizedLatex, { strict: false });
    if (!parsed || typeof parsed !== "object" || !("json" in parsed)) {
      lruSet(latexJsCache, latex, null);
      return null;
    }
    const boxed = ce.box(parsed.json as Parameters<typeof ce.box>[0]);
    const json = boxed.json;

    // Strip y= or z= prefix
    if (Array.isArray(json) && json[0] === "Equal" && json.length >= 3) {
      const lhs = json[1];
      if (lhs === "y" || lhs === "z") {
        const rhsJson = json[2] as Parameters<typeof ce.box>[0] | undefined;
        if (rhsJson === undefined) {
          lruSet(latexJsCache, latex, null);
          return null;
        }
        const rhs = ce.box(rhsJson);
        const result = ceCompileExpr(rhs, { to: "javascript" });
        if (!result.success || !result.run) {
          lruSet(latexJsCache, latex, null);
          return null;
        }
        const fn = wrapRun(result.run);
        lruSet(latexJsCache, latex, fn);
        return fn;
      }
    }

    const result = ceCompileExpr(boxed, { to: "javascript" });
    if (!result.success || !result.run) {
      lruSet(latexJsCache, latex, null);
      return null;
    }
    const fn = wrapRun(result.run);
    lruSet(latexJsCache, latex, fn);
    return fn;
  } catch {
    lruSet(latexJsCache, latex, null);
    return null;
  }
}

/**
 * Compile an implicit equation LaTeX to a JS evaluator of F(x,y,z)=0 form.
 * If the input is an equation A=B, compiles (A-B). Otherwise compiles as-is.
 */
export function ceCompileImplicitFromLatex(latex: string): EvalFn | null {
  if (!latex.trim()) return null;
  try {
    const ce = getCE();
    const normalizedLatex = normalizeLatexInput(latex);
    const parsed = ce.parse(normalizedLatex, { strict: false });
    if (!parsed || typeof parsed !== "object" || !("json" in parsed)) {
      return null;
    }

    type BoxArg = Parameters<typeof ce.box>[0];
    let boxed = ce.box(parsed.json as BoxArg);
    const json = boxed.json;

    if (Array.isArray(json) && json[0] === "Equal" && json.length >= 3) {
      const lhs = json[1] as BoxArg | undefined;
      const rhs = json[2] as BoxArg | undefined;
      if (lhs !== undefined && rhs !== undefined) {
        boxed = ce.box(["Subtract", lhs, rhs] as BoxArg);
      }
    }

    const result = ceCompileExpr(boxed, { to: "javascript" });
    if (!result.success || !result.run) return null;
    return wrapRun(result.run);
  } catch {
    return null;
  }
}

/**
 * Compile LaTeX directly to GLSL, bypassing the plain-text intermediate.
 * CE's LaTeX parser correctly handles functions like \log_{10},
 * \sqrt[3]{x}, etc. that the plain-text parser mangles into
 * individual variable names.
 */
export function ceCompileGLSLFromLatex(latex: string): GLSLResult | null {
  if (!latex.trim()) return null;
  try {
    const boxed = getCE().parse(normalizeLatexInput(latex));
    const json = boxed.json;
    // Reject equations/booleans that produce non-float GLSL (e.g. x == a)
    if (Array.isArray(json) && (json[0] === "Equal" || json[0] === "Less" ||
      json[0] === "Greater" || json[0] === "LessEqual" || json[0] === "GreaterEqual")) {
      return null;
    }
    const result = ceCompileExpr(boxed, { to: "glsl" });
    if (!result.success || !result.code) return null;
    return { code: result.code, preamble: result.preamble ?? "" };
  } catch {
    return null;
  }
}

/**
 * Compile LaTeX with user-defined function expansion.
 * Handles both:
 *  - Definitions: f(x) = x^2+2x → compiles just the RHS
 *  - References:  f(x)+3 → expands f(x) to (x^2+2x), then compiles
 *
 * Not LRU-cached by LaTeX string alone because the result depends on
 * the current function registry state. Uses a version-gated cache instead.
 */
const funcCache = new Map<string, EvalFn | null>();
let lastRegVer = -1;

export function ceCompileFromLatexWithFuncs(latex: string): EvalFn | null {
  if (!latex.trim()) return null;

  const ver = getRegistryVersion();
  if (ver !== lastRegVer) {
    funcCache.clear();
    lastRegVer = ver;
  }
  if (funcCache.has(latex)) return funcCache.get(latex) ?? null;

  try {
    const ce = getCE();
    const normalizedLatex = normalizeLatexInput(latex);
    const boxed = ce.parse(normalizedLatex);
    let json: unknown = boxed.json;

    // Function definition: f(x) = expr → compile just the RHS.
    // Delegates to parseFuncDef which handles all CE parse variants
    // (InvisibleOperator, direct call head, Apply).
    if (Array.isArray(json) && json[0] === "Equal") {
      const def = parseFuncDef(latex);
      if (def) {
        json = def.bodyJson;
      } else {
        const lhs = json[1];
        if (lhs === "y" || lhs === "z") {
          json = json[2];
        }
      }
    }

    // Expand function references (no-op when registry is empty)
    json = expandFunctionRefs(json);

    type BoxArg = Parameters<typeof ce.box>[0];
    const toCompile = ce.box(json as BoxArg);
    const result = ceCompileExpr(toCompile, { to: "javascript" });
    if (!result.success || !result.run) {
      funcCache.set(latex, null);
      return null;
    }
    const fn = wrapRun(result.run);
    funcCache.set(latex, fn);
    return fn;
  } catch {
    funcCache.set(latex, null);
    return null;
  }
}
