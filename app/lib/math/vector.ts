import type { CalculationResult, VectorOperation } from "@/types";

export const performVectorOperation = (
  operation: VectorOperation
): CalculationResult => {
  try {
    const { type, vectors } = operation;
    let result: number | number[];

    switch (type) {
      case "add":
        result = vectors[0].map((v, i) => v + vectors[1][i]);
        break;
      case "subtract":
        result = vectors[0].map((v, i) => v - vectors[1][i]);
        break;
      case "dot":
        result = vectors[0].reduce((sum, v, i) => sum + v * vectors[1][i], 0);
        break;
      case "cross":
        if (vectors[0].length !== 3 || vectors[1].length !== 3) {
          throw new Error("Cross product only defined for 3D vectors");
        }
        result = [
          vectors[0][1] * vectors[1][2] - vectors[0][2] * vectors[1][1],
          vectors[0][2] * vectors[1][0] - vectors[0][0] * vectors[1][2],
          vectors[0][0] * vectors[1][1] - vectors[0][1] * vectors[1][0],
        ];
        break;
      case "magnitude":
        result = Math.sqrt(vectors[0].reduce((sum, v) => sum + v * v, 0));
        break;
      case "normalize":
        result = normalizeVector(vectors[0]);
        break;
      case "projection":
        result = projectVector(vectors[0], vectors[1]);
        break;
      default:
        throw new Error(`Unknown operation: ${type}`);
    }

    return {
      mode: "vector",
      input: type,
      result,
    };
  } catch (error) {
    return {
      mode: "vector",
      input: operation.type,
      result: [],
      error: (error as Error).message,
    };
  }
};

const normalizeVector = (vector: number[]): number[] => {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) {
    throw new Error("Cannot normalize zero vector");
  }
  return vector.map((v) => v / magnitude);
};

const projectVector = (a: number[], b: number[]): number[] => {
  const dotProd = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magBSq = b.reduce((sum, v) => sum + v * v, 0);
  if (magBSq === 0) {
    throw new Error("Cannot project onto zero vector");
  }
  return b.map((v) => (v * dotProd) / magBSq);
};
