import type { SolverCategory } from "@/types";

import { toPlainExpression } from "./expression-resolution";

const MATRIX_COMMANDS = ["det", "inv", "eigs", "transpose", "trace", "rank"] as const;

function recoverMatrixExprFromLatex(latex: string, expr: string): string {
  if (!expr.startsWith("*[[")) return expr;

  const matrixMatch = expr.match(/\[\[.*\]\]/);
  if (!matrixMatch) return expr;

  const lowerLatex = latex.toLowerCase();
  const op = MATRIX_COMMANDS.find((cmd) =>
    lowerLatex.includes(cmd) || lowerLatex.includes(`\\${cmd}`) || lowerLatex.includes(`operatorname{${cmd}}`)
  );

  if (!op) return expr;
  return `${op}(${matrixMatch[0]})`;
}

export function normalizeSolverInput(category: SolverCategory, latex: string): string {
  const expr = toPlainExpression(latex, "none");

  if (category === "matrices") {
    return recoverMatrixExprFromLatex(latex, expr);
  }

  return expr;
}
