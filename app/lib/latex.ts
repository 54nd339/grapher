import type { CalculationResult, Point } from "@/types";
import { formatNumber } from "@/lib/utils";

const escapeLatexText = (value: string): string =>
  value
    .replace(/\\/g, "\\textbackslash ")
    .replace(/([{}%#&_])/g, "\\$1");

export const expressionToLatex = (expression: string): string => {
  if (!expression) return "";

  return expression.replace(/\*/g, " \\cdot ");
};

const matrixToLatex = (matrix: number[][]): string => {
  if (!matrix.length) {
    return "\\begin{bmatrix}\\end{bmatrix}";
  }

  const rows = matrix
    .map((row) => row.map((val) => formatNumber(val, 4)).join(" & "))
    .join(" \\ ");

  return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
};

const vectorToLatex = (vector: number[]): string => {
  if (!vector.length) {
    return "\\begin{bmatrix}\\end{bmatrix}";
  }

  const entries = vector.map((val) => formatNumber(val, 4)).join(" \\ ");
  return `\\begin{bmatrix} ${entries} \\end{bmatrix}`;
};

const pointToLatex = (point: Point): string => {
  const values = [point.x, point.y, point.z].filter((val) => val !== undefined);
  return `\\left(${values
    .map((val) => formatNumber(val ?? 0, 4))
    .join(", ")}\\right)`;
};

const textToLatex = (value: string): string => `\\text{${escapeLatexText(value)}}`;

export const resultValueToLatex = (
  value: CalculationResult["result"]
): string => {
  if (typeof value === "number") {
    return formatNumber(value);
  }

  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      return matrixToLatex(value as number[][]);
    }
    return vectorToLatex(value as number[]);
  }

  if (value && typeof value === "object" && "x" in value && "y" in value) {
    return pointToLatex(value as Point);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return textToLatex(" ");

    const plainTextPattern = /^[0-9a-zA-Z+\-*/^().,=\s]+$/;
    return plainTextPattern.test(trimmed) ? trimmed : textToLatex(trimmed);
  }

  return textToLatex("N/A");
};
