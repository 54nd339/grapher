import { cross, dot, evaluate, norm } from "mathjs";

import { formatNumber, isTopLevelArithmetic, toPlain } from "./mathjs-format";

function parseVec(s: string): number[] {
  const value = evaluate(s.trim()) as unknown;
  const plain = toPlain(value);
  if (!Array.isArray(plain)) throw new Error("Expected a vector");
  return plain.map((entry) => {
    if (typeof entry !== "number" || !Number.isFinite(entry)) throw new Error("Vector entries must be finite numbers");
    return entry;
  });
}

function formatVec(v: number[]): string {
  return `[${v.map((x) => formatNumber(x)).join(", ")}]`;
}

function formatMathjsValue(value: unknown): string {
  const plain = toPlain(value);
  if (typeof plain === "number") return formatNumber(plain);
  if (Array.isArray(plain)) {
    const vector = plain.map((entry) => {
      if (typeof entry !== "number" || !Number.isFinite(entry)) throw new Error("Vector entries must be finite numbers");
      return entry;
    });
    return formatVec(vector);
  }
  return String(plain);
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
