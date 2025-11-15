import type { CalculationResult } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type NerdamerInstance = any | undefined;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const solveEquations = (
  nerdamerInstance: NerdamerInstance,
  equations: string,
  variables: string
): CalculationResult => {
  try {
    if (!nerdamerInstance) {
      return {
        mode: "solve",
        input: equations,
        result: "Nerdamer not loaded",
        error: "Nerdamer not available",
      };
    }

    const solutions = nerdamerInstance.solveEquations(equations, variables);
    const result = solutions.toString();

    return {
      mode: "solve",
      input: equations,
      result,
    };
  } catch (error) {
    return {
      mode: "solve",
      input: equations,
      result: "",
      error: (error as Error).message,
    };
  }
};
