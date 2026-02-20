import type { EvalFn } from "./ce-compile";

/**
 * Safely evaluate a compiled function, returning NaN on error or non-finite result.
 * This pattern was duplicated ~12 times across plot components.
 */
export function safeEval(
  fn: EvalFn,
  scope: Record<string, number>,
): number {
  try {
    const r = fn(scope);
    return typeof r === "number" && isFinite(r) ? r : NaN;
  } catch {
    return NaN;
  }
}
