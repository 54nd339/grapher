import { det, eigs, evaluate, inv, trace, transpose } from "mathjs";

import { formatNumber, isTopLevelArithmetic, toPlain } from "./mathjs-format";

type MatrixLike = number[][];
type VectorLike = number[];

function formatVector(v: VectorLike): string {
  return `[${v.map((x) => formatNumber(x)).join(", ")}]`;
}

function formatMatrix(m: MatrixLike): string {
  return `[${m.map((row) => `[${row.map((v) => formatNumber(v)).join(", ")}]`).join(", ")}]`;
}

function formatComplex(value: unknown): string {
  if (!value || typeof value !== "object") return String(value);
  const maybe = value as { re?: unknown; im?: unknown };
  if (typeof maybe.re !== "number" || typeof maybe.im !== "number") return String(value);
  const re = formatNumber(maybe.re);
  const imAbs = formatNumber(Math.abs(maybe.im));
  const sign = maybe.im >= 0 ? "+" : "-";
  return `${re} ${sign} ${imAbs}i`;
}

function asMatrix(value: unknown): MatrixLike {
  const plain = toPlain(value);
  if (!Array.isArray(plain) || plain.length === 0 || !Array.isArray(plain[0])) {
    throw new Error("Matrix must be a non-empty 2D numeric array");
  }
  return (plain as unknown[]).map((row) => {
    if (!Array.isArray(row)) throw new Error("Matrix rows must be arrays");
    return row.map((cell) => {
      if (typeof cell !== "number" || !Number.isFinite(cell)) {
        throw new Error("Matrix entries must be finite numbers");
      }
      return cell;
    });
  });
}

function matrixRankFallback(matrix: MatrixLike): number {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const work = matrix.map((row) => [...row]);
  const eps = 1e-10;
  let rank = 0;
  let pivotRow = 0;

  for (let col = 0; col < cols && pivotRow < rows; col++) {
    let bestRow = pivotRow;
    for (let r = pivotRow + 1; r < rows; r++) {
      if (Math.abs(work[r][col]) > Math.abs(work[bestRow][col])) bestRow = r;
    }
    if (Math.abs(work[bestRow][col]) < eps) continue;

    if (bestRow !== pivotRow) {
      const temp = work[pivotRow];
      work[pivotRow] = work[bestRow];
      work[bestRow] = temp;
    }

    const pivot = work[pivotRow][col];
    for (let c = col; c < cols; c++) work[pivotRow][c] /= pivot;

    for (let r = 0; r < rows; r++) {
      if (r === pivotRow) continue;
      const factor = work[r][col];
      if (Math.abs(factor) < eps) continue;
      for (let c = col; c < cols; c++) {
        work[r][c] -= factor * work[pivotRow][c];
      }
    }

    rank++;
    pivotRow++;
  }

  return rank;
}

function formatMathjsValue(value: unknown): string {
  const plain = toPlain(value);

  if (typeof plain === "number") return formatNumber(plain);
  if (Array.isArray(plain)) {
    if (plain.length === 0) return "[]";
    if (Array.isArray(plain[0])) return formatMatrix(asMatrix(plain));
    const vector = (plain as unknown[]).map((v) => {
      if (typeof v !== "number" || !Number.isFinite(v)) throw new Error("Vector entries must be finite numbers");
      return v;
    });
    return formatVector(vector);
  }

  return formatComplex(plain);
}

export async function matrixDeterminant(matrixExpr: string): Promise<string> {
  try {
    const matrix = asMatrix(evaluate(matrixExpr));
    return formatMathjsValue(det(matrix));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function matrixInverse(matrixExpr: string): Promise<string> {
  try {
    const matrix = asMatrix(evaluate(matrixExpr));
    return formatMathjsValue(inv(matrix));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function matrixEigenvalues(matrixExpr: string): Promise<string> {
  try {
    const matrix = asMatrix(evaluate(matrixExpr));
    const result = eigs(matrix);
    return formatMathjsValue(result.values);
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function matrixTranspose(matrixExpr: string): Promise<string> {
  try {
    const matrix = asMatrix(evaluate(matrixExpr));
    return formatMathjsValue(transpose(matrix));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function matrixTrace(matrixExpr: string): Promise<string> {
  try {
    const matrix = asMatrix(evaluate(matrixExpr));
    return formatMathjsValue(trace(matrix));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function matrixRank(matrixExpr: string): Promise<string> {
  try {
    const matrix = asMatrix(evaluate(matrixExpr));
    return formatNumber(matrixRankFallback(matrix));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function matrixArithmetic(expr: string): Promise<string | null> {
  try {
    const compact = expr.replace(/\s+/g, "");
    if (!isTopLevelArithmetic(compact)) return null;
    return formatMathjsValue(evaluate(compact));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function matrixEvaluate(expr: string): Promise<string> {
  try {
    return formatMathjsValue(evaluate(expr));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}
