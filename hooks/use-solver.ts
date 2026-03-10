"use client";

import { useCallback } from "react";
import { toast } from "sonner";

import { normalizeSolverInput, solve } from "@/lib/math";
import { useSolverStore } from "@/stores";

/**
 * Hook that dispatches solver requests by category.
 * Converts LaTeX input to expression before solving.
 */
export function useSolve() {
  const setResult = useSolverStore((s) => s.setResult);
  const setLoading = useSolverStore((s) => s.setLoading);

  const executeSolve = useCallback(
    async (category: Parameters<typeof solve>[0], latex: string) => {
      try {
        setLoading(true);
        const expr = normalizeSolverInput(category, latex);
        const result = await solve(category, expr);
        setResult(result);
        if (result.error) {
          toast.error("Solver could not compute a result.", {
            description: "Review the details in the solver panel and adjust your input.",
          });
        }
      } catch (error) {
        setLoading(false);
        const description =
          error instanceof Error ? error.message : "An unexpected error occurred while solving.";
        toast.error("Solver request failed.", {
          description,
        });
      }
    },
    [setResult, setLoading]
  );

  return executeSolve;
}
