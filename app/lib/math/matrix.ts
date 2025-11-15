import type { CalculationResult, MatrixOperation } from "@/types";

export const performMatrixOperation = (
  operation: MatrixOperation
): CalculationResult => {
  try {
    const { type, matrices } = operation;
    let result: number | number[] | number[][];

    switch (type) {
      case "add":
        result = matrixAdd(matrices[0], matrices[1]);
        break;
      case "subtract":
        result = matrixSubtract(matrices[0], matrices[1]);
        break;
      case "multiply":
        result = matrixMultiply(matrices[0], matrices[1]);
        break;
      case "inverse":
        result = matrixInverse(matrices[0]);
        break;
      case "determinant":
        result = matrixDeterminant(matrices[0]);
        break;
      case "transpose":
        result = matrixTranspose(matrices[0]);
        break;
      case "eigenvalues":
        result = matrixEigenvalues(matrices[0]);
        break;
      default:
        throw new Error(`Unknown operation: ${type}`);
    }

    return {
      mode: "matrix",
      input: type,
      result,
    };
  } catch (error) {
    return {
      mode: "matrix",
      input: operation.type,
      result: [],
      error: (error as Error).message,
    };
  }
};

const matrixAdd = (a: number[][], b: number[][]): number[][] =>
  a.map((row, i) => row.map((val, j) => val + b[i][j]));

const matrixSubtract = (a: number[][], b: number[][]): number[][] =>
  a.map((row, i) => row.map((val, j) => val - b[i][j]));

const matrixMultiply = (a: number[][], b: number[][]): number[][] => {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
};

const matrixTranspose = (a: number[][]): number[][] =>
  a[0].map((_, i) => a.map((row) => row[i]));

const matrixDeterminant = (matrix: number[][]): number => {
  const n = matrix.length;

  if (n === 1) return matrix[0][0];
  if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

  let det = 0;
  for (let j = 0; j < n; j++) {
    const minor = matrix
      .slice(1)
      .map((row) => row.filter((_, colIdx) => colIdx !== j));
    det += (j % 2 === 0 ? 1 : -1) * matrix[0][j] * matrixDeterminant(minor);
  }
  return det;
};

const matrixInverse = (matrix: number[][]): number[][] => {
  const n = matrix.length;
  const det = matrixDeterminant(matrix);

  if (Math.abs(det) < 1e-10) {
    throw new Error("Matrix is singular");
  }

  if (n === 2) {
    return [
      [matrix[1][1] / det, -matrix[0][1] / det],
      [-matrix[1][0] / det, matrix[0][0] / det],
    ];
  }

  const adj = matrixAdjugate(matrix);
  return adj.map((row) => row.map((val) => val / det));
};

const matrixAdjugate = (matrix: number[][]): number[][] => {
  const n = matrix.length;
  const adj: number[][] = [];

  for (let i = 0; i < n; i++) {
    adj[i] = [];
    for (let j = 0; j < n; j++) {
      const minor = matrix
        .filter((_, rowIdx) => rowIdx !== i)
        .map((row) => row.filter((_, colIdx) => colIdx !== j));
      adj[i][j] = ((i + j) % 2 === 0 ? 1 : -1) * matrixDeterminant(minor);
    }
  }

  return matrixTranspose(adj);
};

const matrixEigenvalues = (matrix: number[][]): number[] => {
  if (matrix.length === 2) {
    const a = matrix[0][0];
    const b = matrix[0][1];
    const c = matrix[1][0];
    const d = matrix[1][1];

    const trace = a + d;
    const det = a * d - b * c;
    const discriminant = trace * trace - 4 * det;

    if (discriminant >= 0) {
      const sqrt = Math.sqrt(discriminant);
      return [(trace + sqrt) / 2, (trace - sqrt) / 2];
    }

    return [trace / 2];
  }

  throw new Error("Eigenvalues calculation only supported for 2x2 matrices");
};
