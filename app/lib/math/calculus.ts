import type {
  CalculationResult,
  DerivativeOptions,
  IntegralOptions,
} from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type NerdamerInstance = any | undefined;
/* eslint-enable @typescript-eslint/no-explicit-any */
type EvaluateFn = (expression: string, scope?: Record<string, number>) => number;

export const calculateDerivative = (
  nerdamerInstance: NerdamerInstance,
  expression: string,
  variable: string = "x",
  options: DerivativeOptions = { order: 1, symbolic: true }
): CalculationResult => {
  try {
    if (!nerdamerInstance) {
      return {
        mode: "derivative",
        input: expression,
        result: "Nerdamer not loaded",
        error: "Nerdamer not available",
      };
    }

    let expr = nerdamerInstance(expression);

    for (let i = 0; i < options.order; i++) {
      expr = nerdamerInstance.diff(expr.toString(), variable);
    }

    const result = expr.toString();

    if (options.point !== undefined) {
      const value = parseFloat(
        expr.evaluate({ [variable]: options.point }).toString()
      );
      return {
        mode: "derivative",
        input: expression,
        result: value,
      };
    }

    return {
      mode: "derivative",
      input: expression,
      result,
    };
  } catch (error) {
    return {
      mode: "derivative",
      input: expression,
      result: 0,
      error: (error as Error).message,
    };
  }
};

export const calculateIntegral = (
  nerdamerInstance: NerdamerInstance,
  evaluateFn: EvaluateFn,
  expression: string,
  variable: string = "x",
  options: IntegralOptions
): CalculationResult => {
  try {
    if (!nerdamerInstance) {
      return {
        mode: "integral",
        input: expression,
        result: "Nerdamer not loaded",
        error: "Nerdamer not available",
      };
    }

    const variant = options.variant ?? (options.bounds ? "definite" : "indefinite");

    if (variant === "indefinite" || !options.bounds) {
      try {
        const indefinite = nerdamerInstance.integrate(expression, variable);
        const result = `${indefinite.toString()} + C`;

        return {
          mode: "integral",
          input: expression,
          result,
        };
      } catch (error) {
        return {
          mode: "integral",
          input: expression,
          result: "",
          error: (error as Error).message,
        };
      }
    }

    const [a, b] = options.bounds;

    if (a === undefined || b === undefined) {
      return {
        mode: "integral",
        input: expression,
        result: 0,
        error: "Bounds are required for definite integrals",
      };
    }

    try {
      const indefinite = nerdamerInstance.integrate(expression, variable);
      const F_b = parseFloat(
        indefinite.evaluate({ [variable]: b }).toString()
      );
      const F_a = parseFloat(
        indefinite.evaluate({ [variable]: a }).toString()
      );
      const result = F_b - F_a;

      return {
        mode: "integral",
        input: expression,
        result,
      };
    } catch {
      const f = (x: number) => evaluateFn(expression, { [variable]: x });
      const result = simpsonRule(f, a, b, 1000);

      return {
        mode: "integral",
        input: expression,
        result,
      };
    }
  } catch (error) {
    return {
      mode: "integral",
      input: expression,
      result: 0,
      error: (error as Error).message,
    };
  }
};

const simpsonRule = (
  f: (x: number) => number,
  a: number,
  b: number,
  n: number
): number => {
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  let sum = f(a) + f(b);

  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += f(x) * (i % 2 === 0 ? 2 : 4);
  }

  return (h / 3) * sum;
};
