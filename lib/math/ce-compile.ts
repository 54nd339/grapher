/**
 * CE-powered expression compilation for hot-loop evaluation (JS)
 * and GPU-accelerated rendering (GLSL).
 *
 * LRU cache prevents repeated parsing during slider animations
 * and re-renders. Bounded to 64 entries to cap memory.
 */

import { compile as ceCompileExpr, type Expression } from "@cortex-js/compute-engine";

import { getCE, normalizeLatexInput } from "@/lib/latex";
import { expandFunctionRefs, getRegistryVersion, parseFuncDef } from "@/lib/math/function-registry";
import { extractIntegrals, syncSimpsonIntegrate } from "@/lib/math/ce-compile-integrate";

export type EvalFn = (scope: Record<string, number>) => number;

export interface GLSLResult {
  code: string;
  preamble: string;
}

/* ── LRU helpers ─────────────────────────────────────── */

const MAX_CACHE = 64;
const jsCache = new Map<string, EvalFn | null>();
const latexJsCache = new Map<string, EvalFn | null>();

function lruGet<T>(cache: Map<string, T>, key: string): T | undefined {
  if (!cache.has(key)) return undefined;
  const value = cache.get(key)!;
  cache.delete(key);
  cache.set(key, value);
  return value;
}

function lruSet<T>(cache: Map<string, T>, key: string, value: T, max = MAX_CACHE): void {
  if (cache.size >= max) cache.delete(cache.keys().next().value!);
  cache.set(key, value);
}

/* ── Core compilation ────────────────────────────────── */

/**
 * Wraps a CE `run` function to always return a finite number.
 * CE can return complex objects or throw on missing symbols.
 */
function wrapRun(run: (scope: Record<string, number>) => unknown): EvalFn {
  return (scope) => {
    try {
      const r = run(scope);
      return typeof r === "number" ? r : (r as { re: number }).re ?? NaN;
    } catch {
      return NaN;
    }
  };
}

/**
 * Compiles a CE expression, transparently extracting any `Integrate` nodes
 * and wiring them up as synchronous Simpson's-rule evaluators at runtime.
 * This is the single compilation entry-point — every public function below
 * delegates here after parsing/normalizing.
 */
function compileWithIntegrals(boxed: Expression): EvalFn | null {
  const ce = getCE();
  const { expr: rewritten, integrals } = extractIntegrals(boxed, ce);

  const mainResult = ceCompileExpr(rewritten, { to: "javascript" });
  if (!mainResult.success || !mainResult.run) return null;
  const mainRun = wrapRun(mainResult.run);

  // Fast path: no integrals found, return the compiled function directly
  if (integrals.length === 0) return mainRun;

  const compiled = integrals.map((int) => {
    const ir = ceCompileExpr(int.integrand, { to: "javascript" });
    const lr = ceCompileExpr(int.lower, { to: "javascript" });
    const ur = ceCompileExpr(int.upper, { to: "javascript" });
    return {
      id: int.id,
      variable: int.variable,
      integrand: ir.success && ir.run ? wrapRun(ir.run) : () => NaN,
      lower: lr.success && lr.run ? wrapRun(lr.run) : () => NaN,
      upper: ur.success && ur.run ? wrapRun(ur.run) : () => NaN,
    };
  });

  return (scope: Record<string, number>) => {
    for (const int of compiled) {
      scope[int.id] = syncSimpsonIntegrate(
        int.integrand, int.variable,
        int.lower(scope), int.upper(scope),
        scope,
      );
    }
    const result = mainRun(scope);
    // Clean up injected placeholder keys
    for (const int of compiled) delete scope[int.id];
    return result;
  };
}

/**
 * Shared helper: try to compile, cache the result either way.
 * Eliminates the repetitive try/catch + lruSet pattern.
 */
function cachedCompile(
  cache: Map<string, EvalFn | null>,
  key: string,
  buildExpr: () => Expression | null,
): EvalFn | null {
  const cached = lruGet(cache, key);
  if (cached !== undefined) return cached;
  try {
    const expr = buildExpr();
    const fn = expr ? compileWithIntegrals(expr) : null;
    lruSet(cache, key, fn);
    return fn;
  } catch {
    lruSet(cache, key, null);
    return null;
  }
}

/* ── Public API ──────────────────────────────────────── */

/**
 * Compile a plain-text expression string (from `latexToExpr()`).
 */
export function ceCompile(expr: string): EvalFn | null {
  if (!expr.trim()) return null;
  return cachedCompile(jsCache, expr, () =>
    getCE().parse(expr, { strict: false }),
  );
}

/** @deprecated Alias kept for call-sites that haven't migrated. */
export const safeCompile = ceCompile;

// Matches higher-order Leibniz notation CE can't parse directly
const LEIBNIZ_RE =
  /^\\frac\{(?:\\mathrm\{d\}|d)\^?\{?(\d+)?\}?\}\{(?:\\mathrm\{d\}|d)\s*(\w)\^?\{?\d*\}?\}(.+)$/;

/**
 * Compile LaTeX directly to a JS evaluation function.
 * Handles `y=`/`z=` prefix stripping and higher-order Leibniz derivatives.
 */
export function ceCompileFromLatex(latex: string): EvalFn | null {
  if (!latex.trim()) return null;
  return cachedCompile(latexJsCache, latex, () => {
    const ce = getCE();
    const normalized = normalizeLatexInput(latex);
    if (!ce?.parse || !ce.box) return null;

    // Strip "y=" or "f(x)=" prefix from LaTeX before regex matching,
    // otherwise the ^ anchor in LEIBNIZ_RE fails.
    const withoutPrefix = normalized.replace(/^(?:[a-zA-Z]\s*(?:\\left|\\mleft)?\s*\(\s*[a-zA-Z]\s*(?:\\right|\\mright)?\s*\)|[a-zA-Z])\s*=\s*/, "");

    // Higher-order Leibniz: d^n/dx^n f(x)
    const leibniz = LEIBNIZ_RE.exec(withoutPrefix);
    if (leibniz) {
      const order = leibniz[1] ? parseInt(leibniz[1], 10) : 1;
      const diffVar = leibniz[2];
      const body = ce.parse(leibniz[3].trim(), { strict: false });
      if (!body?.json) return null;
      type BoxArg = Parameters<typeof ce.box>[0];
      let expr = ce.box(body.json as BoxArg);
      for (let i = 0; i < order; i++) {
        expr = ce.box(["D", expr, diffVar]).evaluate();
      }
      return expr;
    }

    const parsed = ce.parse(normalized, { strict: false });
    if (!parsed?.json) return null;
    type BoxArg = Parameters<typeof ce.box>[0];
    const boxed = ce.box(parsed.json as BoxArg);
    const json = boxed.json;

    // Strip y= or z= prefix so the RHS compiles as a numeric evaluator
    if (Array.isArray(json) && json[0] === "Equal" && json.length >= 3) {
      const lhs = json[1];
      if ((lhs === "y" || lhs === "z") && json[2] !== undefined) {
        return ce.box(json[2] as BoxArg);
      }
    }

    return boxed;
  });
}

/**
 * Compile an implicit equation LaTeX to a JS evaluator of F(x,y,z)=0 form.
 * If the input is an equation A=B, compiles (A-B). Otherwise compiles as-is.
 */
export function ceCompileImplicitFromLatex(latex: string): EvalFn | null {
  if (!latex.trim()) return null;
  try {
    const ce = getCE();
    const parsed = ce.parse(normalizeLatexInput(latex), { strict: false });
    if (!parsed?.json) return null;

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

    return compileWithIntegrals(boxed);
  } catch {
    return null;
  }
}

/**
 * Compile LaTeX directly to GLSL for GPU-accelerated rendering.
 */
export function ceCompileGLSLFromLatex(latex: string): GLSLResult | null {
  if (!latex.trim()) return null;
  try {
    const boxed = getCE().parse(normalizeLatexInput(latex));
    const json = boxed.json;
    if (Array.isArray(json) && ["Equal", "Less", "Greater", "LessEqual", "GreaterEqual"].includes(json[0] as string)) {
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
 * Uses a version-gated cache that invalidates when the function registry changes.
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

  return cachedCompile(funcCache, latex, () => {
    const ce = getCE();
    const boxed = ce.parse(normalizeLatexInput(latex));
    let json: unknown = boxed.json;

    // Function definition: f(x) = expr → compile just the RHS
    if (Array.isArray(json) && json[0] === "Equal") {
      const def = parseFuncDef(latex);
      if (def) {
        json = def.bodyJson;
      } else {
        const lhs = json[1];
        if (lhs === "y" || lhs === "z") json = json[2];
      }
    }

    json = expandFunctionRefs(json);
    type BoxArg = Parameters<typeof ce.box>[0];
    return ce.box(json as BoxArg);
  });
}
