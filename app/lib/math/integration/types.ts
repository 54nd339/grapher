import type { IntegralOptions } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type NerdamerInstance = any | undefined;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ManualIntegration = {
  expression: string;
};

export type IntegrationContext = {
  nerdamerInstance: NerdamerInstance;
  expression: string;
  variable: string;
};

export type SymbolicIntegrationResult = {
  ok: boolean;
  result?: string;
  latex?: string;
  method?: "symbolic" | "numerical" | "rules" | "nerdamer";
  error?: string;
  discontinuities?: number[];
  domainIssues?: string[];
  undefinedIssues?: string[];
  piecewiseLatex?: string;
};

export const describeIntegralFailure = (
  expression: string,
  variable: string,
  options: IntegralOptions
): string => {
  const variant = options.variant ?? (options.bounds ? "definite" : "indefinite");
  const suffix = variant === "definite" && options.bounds
    ? ` on [${options.bounds[0]}, ${options.bounds[1]}]`
    : "";
  return `Could not determine a symbolic integral for ${expression} d${variable}${suffix}`;
};
