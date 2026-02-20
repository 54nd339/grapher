import { latexToExpr } from "@/lib/latex";

import {
  ceCompile,
  ceCompileFromLatex,
  ceCompileFromLatexWithFuncs,
  type EvalFn,
} from "./ce-compile";

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

export function compileExpressionLatex(
  latex: string,
  opts: {
    mode?: ExpressionMode;
    allowUserFunctions?: boolean;
  } = {},
): EvalFn | null {
  const mode = opts.mode ?? "auto";
  const allowUserFunctions = opts.allowUserFunctions ?? true;

  if (allowUserFunctions) {
    const fnWithFuncs = ceCompileFromLatexWithFuncs(latex);
    if (fnWithFuncs) return fnWithFuncs;
  }

  const plain = toPlainExpression(latex, mode);
  return ceCompileFromLatex(plain) ?? ceCompile(plain);
}

export function getSliderSymbolFromLatex(latex: string): string | null {
  const plain = toPlainExpression(latex, "none");
  const match = plain.match(/^([a-wA-W])\b/);
  return match ? match[1] : null;
}
