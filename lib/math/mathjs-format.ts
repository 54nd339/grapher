import { parse } from "mathjs";

/**
 * Shared formatting helpers for mathjs-based matrix and vector operations.
 */

export function toPlain(value: unknown): unknown {
  if (value && typeof value === "object" && "toArray" in value && typeof (value as { toArray: () => unknown }).toArray === "function") {
    return (value as { toArray: () => unknown }).toArray();
  }
  return value;
}

export function formatNumber(value: number): string {
  return String(Number.isInteger(value) ? value : Number(value.toFixed(6)));
}

export function isTopLevelArithmetic(expr: string): boolean {
  try {
    const node = parse(expr) as unknown as { isOperatorNode?: boolean; op?: string };
    return Boolean(node.isOperatorNode && (node.op === "+" || node.op === "-" || node.op === "*" || node.op === "/"));
  } catch {
    return false;
  }
}
