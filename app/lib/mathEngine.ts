/**
 * Core mathematical computation engine using nerdamer
 * Handles parsing, evaluation, and symbolic mathematics
 */

import type { 
  CalculationResult, 
  MatrixOperation, 
  VectorOperation,
  DerivativeOptions,
  IntegralOptions 
} from '../types';

// Dynamic import for nerdamer to avoid SSR issues
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
let nerdamer: any;
if (typeof window !== 'undefined') {
  nerdamer = require('nerdamer/all.min');
}
/* eslint-enable @typescript-eslint/no-require-imports */
/* eslint-enable @typescript-eslint/no-explicit-any */

export class MathEngine {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private expressionCache: Map<string, any> = new Map();
  /* eslint-enable @typescript-eslint/no-explicit-any */
  private cacheSize = 100; // Limit cache size to prevent memory issues

  /**
   * Evaluate a mathematical expression with caching
   */
  evaluate(expression: string, scope: Record<string, number> = {}): number {
    try {
      if (!nerdamer) {
        // Fallback for SSR
        return eval(expression.replace(/\^/g, '**'));
      }
      
      // Create cache key from expression
      const cacheKey = expression;
      
      // Get or create compiled expression
      let expr = this.expressionCache.get(cacheKey);
      if (!expr) {
        expr = nerdamer(expression);
        
        // Manage cache size
        if (this.expressionCache.size >= this.cacheSize) {
          const firstKey = this.expressionCache.keys().next().value;
          if (firstKey) {
            this.expressionCache.delete(firstKey);
          }
        }
        
        this.expressionCache.set(cacheKey, expr);
      }
      
      // Evaluate with scope
      const scopeStr: Record<string, string> = {};
      Object.keys(scope).forEach(key => {
        scopeStr[key] = String(scope[key]);
      });
      
      const result = expr.evaluate(scopeStr);
      return parseFloat(result.text());
    } catch (error) {
      throw new Error(`Evaluation error: ${(error as Error).message}`);
    }
  }

  /**
   * Clear expression cache
   */
  clearCache(): void {
    this.expressionCache.clear();
  }

  /**
   * Calculate derivative (symbolic)
   */
  derivative(expression: string, variable: string = 'x', options: DerivativeOptions = { order: 1, symbolic: true }): CalculationResult {
    try {
      if (!nerdamer) {
        return {
          mode: 'derivative',
          input: expression,
          result: 'Nerdamer not loaded',
          error: 'Nerdamer not available'
        };
      }

      let expr = nerdamer(expression);
      
      for (let i = 0; i < options.order; i++) {
        expr = nerdamer.diff(expr.toString(), variable);
      }
      
      const result = expr.toString();
      
      if (options.point !== undefined) {
        const value = parseFloat(expr.evaluate({ [variable]: options.point }).toString());
        return {
          mode: 'derivative',
          input: expression,
          result: value
        };
      }
      
      return {
        mode: 'derivative',
        input: expression,
        result
      };
    } catch (error) {
      return {
        mode: 'derivative',
        input: expression,
        result: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Calculate definite integral
   */
  integral(expression: string, variable: string = 'x', options: IntegralOptions): CalculationResult {
    try {
      const [a, b] = options.bounds;
      
      if (!nerdamer) {
        return {
          mode: 'integral',
          input: expression,
          result: 'Nerdamer not loaded',
          error: 'Nerdamer not available'
        };
      }

      // Try symbolic integration
      try {
        const indefinite = nerdamer.integrate(expression, variable);
        const F_b = parseFloat(indefinite.evaluate({ [variable]: b }).toString());
        const F_a = parseFloat(indefinite.evaluate({ [variable]: a }).toString());
        const result = F_b - F_a;
        
        return {
          mode: 'integral',
          input: expression,
          result
        };
      } catch {
        // Fall back to numerical integration
        const f = (x: number) => this.evaluate(expression, { [variable]: x });
        const result = this.simpsonRule(f, a, b, 1000);
        
        return {
          mode: 'integral',
          input: expression,
          result
        };
      }
    } catch (error) {
      return {
        mode: 'integral',
        input: expression,
        result: 0,
        error: (error as Error).message
      };
    }
  }

  /**
   * Simpson's rule for numerical integration
   */
  private simpsonRule(f: (x: number) => number, a: number, b: number, n: number): number {
    if (n % 2 !== 0) n++; // Ensure n is even
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += f(x) * (i % 2 === 0 ? 2 : 4);
    }
    
    return (h / 3) * sum;
  }

  /**
   * Matrix operations
   */
  matrixOperation(operation: MatrixOperation): CalculationResult {
    try {
      const { type, matrices } = operation;
      let result: number | number[] | number[][];
      
      switch (type) {
        case 'add':
          result = this.matrixAdd(matrices[0], matrices[1]);
          break;
        case 'subtract':
          result = this.matrixSubtract(matrices[0], matrices[1]);
          break;
        case 'multiply':
          result = this.matrixMultiply(matrices[0], matrices[1]);
          break;
        case 'inverse':
          result = this.matrixInverse(matrices[0]);
          break;
        case 'determinant':
          result = this.matrixDeterminant(matrices[0]);
          break;
        case 'transpose':
          result = this.matrixTranspose(matrices[0]);
          break;
        case 'eigenvalues':
          result = this.matrixEigenvalues(matrices[0]);
          break;
        default:
          throw new Error(`Unknown operation: ${type}`);
      }
      
      return {
        mode: 'matrix',
        input: type,
        result
      };
    } catch (error) {
      return {
        mode: 'matrix',
        input: operation.type,
        result: [],
        error: (error as Error).message
      };
    }
  }

  private matrixAdd(a: number[][], b: number[][]): number[][] {
    return a.map((row, i) => row.map((val, j) => val + b[i][j]));
  }

  private matrixSubtract(a: number[][], b: number[][]): number[][] {
    return a.map((row, i) => row.map((val, j) => val - b[i][j]));
  }

  private matrixMultiply(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < a.length; i++) {
      result[i] = [];
      for (let j = 0; j < b[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < a[0].length; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private matrixTranspose(a: number[][]): number[][] {
    return a[0].map((_, i) => a.map(row => row[i]));
  }

  private matrixDeterminant(matrix: number[][]): number {
    const n = matrix.length;
    
    if (n === 1) return matrix[0][0];
    if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
    
    let det = 0;
    for (let j = 0; j < n; j++) {
      const minor = matrix.slice(1).map(row => 
        row.filter((_, colIdx) => colIdx !== j)
      );
      det += (j % 2 === 0 ? 1 : -1) * matrix[0][j] * this.matrixDeterminant(minor);
    }
    return det;
  }

  private matrixInverse(matrix: number[][]): number[][] {
    const n = matrix.length;
    const det = this.matrixDeterminant(matrix);
    
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is singular');
    }
    
    if (n === 2) {
      return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
      ];
    }
    
    // For larger matrices, use adjugate method
    const adj = this.matrixAdjugate(matrix);
    return adj.map(row => row.map(val => val / det));
  }

  private matrixAdjugate(matrix: number[][]): number[][] {
    const n = matrix.length;
    const adj: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      adj[i] = [];
      for (let j = 0; j < n; j++) {
        const minor = matrix
          .filter((_, rowIdx) => rowIdx !== i)
          .map(row => row.filter((_, colIdx) => colIdx !== j));
        adj[i][j] = ((i + j) % 2 === 0 ? 1 : -1) * this.matrixDeterminant(minor);
      }
    }
    
    return this.matrixTranspose(adj);
  }

  private matrixEigenvalues(matrix: number[][]): number[] {
    // Simplified eigenvalue calculation for 2x2 matrices
    if (matrix.length === 2) {
      const a = matrix[0][0];
      const b = matrix[0][1];
      const c = matrix[1][0];
      const d = matrix[1][1];
      
      const trace = a + d;
      const det = a * d - b * c;
      const discriminant = trace * trace - 4 * det;
      
      if (discriminant >= 0) {
        const sqrt = Math.sqrt(discriminant);
        return [(trace + sqrt) / 2, (trace - sqrt) / 2];
      } else {
        return [trace / 2]; // Return real part only
      }
    }
    
    throw new Error('Eigenvalues calculation only supported for 2x2 matrices');
  }

  /**
   * Vector operations
   */
  vectorOperation(operation: VectorOperation): CalculationResult {
    try {
      const { type, vectors } = operation;
      let result: number | number[];
      
      switch (type) {
        case 'add':
          result = vectors[0].map((v, i) => v + vectors[1][i]);
          break;
        case 'subtract':
          result = vectors[0].map((v, i) => v - vectors[1][i]);
          break;
        case 'dot':
          result = vectors[0].reduce((sum, v, i) => sum + v * vectors[1][i], 0);
          break;
        case 'cross':
          if (vectors[0].length !== 3 || vectors[1].length !== 3) {
            throw new Error('Cross product only defined for 3D vectors');
          }
          result = [
            vectors[0][1] * vectors[1][2] - vectors[0][2] * vectors[1][1],
            vectors[0][2] * vectors[1][0] - vectors[0][0] * vectors[1][2],
            vectors[0][0] * vectors[1][1] - vectors[0][1] * vectors[1][0]
          ];
          break;
        case 'magnitude':
          result = Math.sqrt(vectors[0].reduce((sum, v) => sum + v * v, 0));
          break;
        case 'normalize':
          const mag = Math.sqrt(vectors[0].reduce((sum, v) => sum + v * v, 0));
          result = vectors[0].map(v => v / mag);
          break;
        case 'projection':
          const dotProd = vectors[0].reduce((sum, v, i) => sum + v * vectors[1][i], 0);
          const magBSq = vectors[1].reduce((sum, v) => sum + v * v, 0);
          result = vectors[1].map(v => v * dotProd / magBSq);
          break;
        default:
          throw new Error(`Unknown operation: ${type}`);
      }
      
      return {
        mode: 'vector',
        input: type,
        result
      };
    } catch (error) {
      return {
        mode: 'vector',
        input: operation.type,
        result: [],
        error: (error as Error).message
      };
    }
  }

  /**
   * Solve equation(s)
   */
  solve(equations: string, variables: string): CalculationResult {
    try {
      if (!nerdamer) {
        return {
          mode: 'solve',
          input: equations,
          result: 'Nerdamer not loaded',
          error: 'Nerdamer not available'
        };
      }

      const solutions = nerdamer.solveEquations(equations, variables);
      const result = solutions.toString();
      
      return {
        mode: 'solve',
        input: equations,
        result
      };
    } catch (error) {
      return {
        mode: 'solve',
        input: equations,
        result: '',
        error: (error as Error).message
      };
    }
  }

  /**
   * Generate points for 2D graphing
   */
  generate2DPoints(expression: string, xMin: number, xMax: number, numPoints: number = 1000): { x: number[]; y: number[] } {
    const x: number[] = [];
    const y: number[] = [];
    const step = (xMax - xMin) / numPoints;
    
    for (let i = 0; i <= numPoints; i++) {
      const xVal = xMin + i * step;
      try {
        const yVal = this.evaluate(expression, { x: xVal });
        if (isFinite(yVal)) {
          x.push(xVal);
          y.push(yVal);
        }
      } catch {
        // Skip invalid points
      }
    }
    
    return { x, y };
  }

  /**
   * Generate points for 3D graphing
   */
  generate3DPoints(
    expression: string, 
    xRange: [number, number], 
    yRange: [number, number], 
    resolution: number = 25
  ): { x: number[][]; y: number[][]; z: number[][] } {
    const x: number[][] = [];
    const y: number[][] = [];
    const z: number[][] = [];
    
    const xStep = (xRange[1] - xRange[0]) / resolution;
    const yStep = (yRange[1] - yRange[0]) / resolution;
    
    for (let i = 0; i <= resolution; i++) {
      const xRow: number[] = [];
      const yRow: number[] = [];
      const zRow: number[] = [];
      
      for (let j = 0; j <= resolution; j++) {
        const xVal = xRange[0] + i * xStep;
        const yVal = yRange[0] + j * yStep;
        
        try {
          const zVal = this.evaluate(expression, { x: xVal, y: yVal });
          if (isFinite(zVal)) {
            xRow.push(xVal);
            yRow.push(yVal);
            zRow.push(zVal);
          } else {
            xRow.push(xVal);
            yRow.push(yVal);
            zRow.push(0);
          }
        } catch {
          xRow.push(xVal);
          yRow.push(yVal);
          zRow.push(0);
        }
      }
      
      x.push(xRow);
      y.push(yRow);
      z.push(zRow);
    }
    
    return { x, y, z };
  }
}

// Singleton instance
export const mathEngine = new MathEngine();
