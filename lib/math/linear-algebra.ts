import { cross, det, dot, eigs, evaluate, inv, norm, trace, transpose } from "mathjs";
import { ceCompile } from "./ce-compile";
import { formatNumber, isTopLevelArithmetic, toPlain } from "./mathjs-format";
import * as rx from "@/lib/math/regex";

// --- Types ---
type MatrixLike = number[][];
type VectorLike = number[];

// --- Formatting Helpers ---
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

// --- Parsers ---
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

function parseVec(s: string): number[] {
  const value = evaluate(s.trim()) as unknown;
  const plain = toPlain(value);
  if (!Array.isArray(plain)) throw new Error("Expected a vector");
  return plain.map((entry) => {
    if (typeof entry !== "number" || !Number.isFinite(entry)) throw new Error("Vector entries must be finite numbers");
    return entry;
  });
}

// --- Matrix & Vector Ops ---

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

export async function vectorCross(a: string, b: string): Promise<string> {
  try {
    const va = parseVec(a);
    const vb = parseVec(b);
    if (va.length !== 3 || vb.length !== 3) throw new Error("Cross product requires 3D vectors");
    return formatMathjsValue(cross(va, vb));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function vectorDot(a: string, b: string): Promise<string> {
  try {
    const va = parseVec(a);
    const vb = parseVec(b);
    if (va.length !== vb.length) throw new Error("Vectors must have equal length");
    return formatMathjsValue(dot(va, vb));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function vectorNorm(v: string): Promise<string> {
  try {
    const vec = parseVec(v);
    return formatMathjsValue(norm(vec));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function vectorArithmetic(expr: string): Promise<string | null> {
  try {
    const compact = expr.replace(/\s+/g, "");
    if (!isTopLevelArithmetic(compact)) return null;
    return formatMathjsValue(evaluate(compact));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

export async function vectorEvaluate(expr: string): Promise<string> {
  try {
    return formatMathjsValue(evaluate(expr));
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

// --- Systems of Equations ---

/**
 * Solve a system of linear equations.
 * Input format: "x + 2y = 5, 3x - y = 1"
 * Uses Cramer's rule for 2x2 and Gaussian elimination for larger systems.
 */
export function solveLinearSystem(
  input: string,
): { solution: Record<string, number>; steps: string[] } | null {
  try {
    const equations = input.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    if (equations.length < 2) return null;

    // Extract variables from the equations
    const vars = new Set<string>();
    for (const eq of equations) {
      const matches = eq.match(rx.REGEX_SYSTEMS_VARS);
      if (matches) matches.forEach((v) => vars.add(v.toLowerCase()));
    }
    // Remove common function names
    vars.delete("s"); vars.delete("i"); vars.delete("n");
    const varList = Array.from(vars).sort();

    if (varList.length > 4) return null;
    if (equations.length !== varList.length) return null;

    // Parse into Ax = b by evaluating g(x) = lhs - rhs.
    const n = varList.length;
    const A: number[][] = [];
    const b: number[] = [];
    const steps: string[] = [`System of ${equations.length} equations in ${n} unknowns: ${varList.join(", ")}`];

    for (const eq of equations) {
      const [lhsStr, rhsStr] = eq.split("=").map((s) => s.trim());
      if (!rhsStr) return null;

      const compiled = ceCompile(`(${lhsStr}) - (${rhsStr})`);
      if (!compiled) return null;

      const zeroScope: Record<string, number> = {};
      for (const v of varList) zeroScope[v] = 0;

      const base = compiled(zeroScope);
      if (!isFinite(base)) return null;

      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        const scope: Record<string, number> = { ...zeroScope, [varList[j]]: 1 };
        const sample = compiled(scope);
        if (!isFinite(sample)) return null;
        row.push(sample - base);
      }

      A.push(row);
      b.push(-base);
    }

    // Gaussian elimination
    const augmented = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      let maxRow = col;
      for (let row = col + 1; row < augmented.length; row++) {
        if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
          maxRow = row;
        }
      }
      [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

      const pivot = augmented[col][col];
      if (Math.abs(pivot) < 1e-12) continue;

      for (let row = 0; row < augmented.length; row++) {
        if (row === col) continue;
        const factor = augmented[row][col] / pivot;
        for (let j = col; j <= n; j++) {
          augmented[row][j] -= factor * augmented[col][j];
        }
      }
    }

    // Extract solution
    const solution: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-12) return null;
      const val = augmented[i][n] / pivot;
      solution[varList[i]] = Math.round(val * 1e8) / 1e8;
      steps.push(`${varList[i]} = ${solution[varList[i]]}`);
    }

    return { solution, steps };
  } catch {
    return null;
  }
}
