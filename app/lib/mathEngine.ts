import type {
  CalculationResult,
  MatrixOperation,
  VectorOperation,
  DerivativeOptions,
  IntegralOptions,
} from "@/types";

import {
  calculateDerivative,
  calculateIntegral,
  generate2DPoints as build2DPoints,
  generate3DPoints as build3DPoints,
  performMatrixOperation,
  getNerdamer,
  solveEquations,
  performVectorOperation,
} from "./math";

export class MathEngine {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private expressionCache: Map<string, any> = new Map();
  /* eslint-enable @typescript-eslint/no-explicit-any */
  private cacheSize = 100;

  evaluate(expression: string, scope: Record<string, number> = {}): number {
    try {
      const nerdamerInstance = getNerdamer();
      if (!nerdamerInstance) {
        return eval(expression.replace(/\^/g, "**"));
      }

      const cacheKey = expression;
      let expr = this.expressionCache.get(cacheKey);
      if (!expr) {
        expr = nerdamerInstance(expression);

        if (this.expressionCache.size >= this.cacheSize) {
          const firstKey = this.expressionCache.keys().next().value;
          if (firstKey) {
            this.expressionCache.delete(firstKey);
          }
        }

        this.expressionCache.set(cacheKey, expr);
      }

      const scopeStr: Record<string, string> = {};
      Object.keys(scope).forEach((key) => {
        scopeStr[key] = String(scope[key]);
      });

      const result = expr.evaluate(scopeStr);
      return parseFloat(result.text());
    } catch (error) {
      throw new Error(`Evaluation error: ${(error as Error).message}`);
    }
  }

  clearCache(): void {
    this.expressionCache.clear();
  }

  derivative(
    expression: string,
    variable: string = "x",
    options: DerivativeOptions = { order: 1, symbolic: true }
  ): CalculationResult {
    return calculateDerivative(getNerdamer(), expression, variable, options);
  }

  integral(
    expression: string,
    variable: string = "x",
    options: IntegralOptions
  ): CalculationResult {
    return calculateIntegral(
      getNerdamer(),
      this.evaluate.bind(this),
      expression,
      variable,
      options
    );
  }

  matrixOperation(operation: MatrixOperation): CalculationResult {
    return performMatrixOperation(operation);
  }

  vectorOperation(operation: VectorOperation): CalculationResult {
    return performVectorOperation(operation);
  }

  solve(equations: string, variables: string): CalculationResult {
    return solveEquations(getNerdamer(), equations, variables);
  }

  generate2DPoints(
    expression: string,
    xMin: number,
    xMax: number,
    numPoints: number = 1000
  ): { x: number[]; y: number[] } {
    return build2DPoints(this.evaluate.bind(this), expression, xMin, xMax, numPoints);
  }

  generate3DPoints(
    expression: string,
    xRange: [number, number],
    yRange: [number, number],
    resolution: number = 25
  ): { x: number[][]; y: number[][]; z: number[][] } {
    return build3DPoints(
      this.evaluate.bind(this),
      expression,
      xRange,
      yRange,
      resolution
    );
  }
}

export const mathEngine = new MathEngine();
