/**
 * Core type definitions for the mathematical graphing application
 */

export type GraphMode = '2d' | '3d' | 'parametric' | 'polar' | 'implicit';

export type CalculationMode = 
  | 'derivative' 
  | 'integral' 
  | 'limit' 
  | 'matrix' 
  | 'vector' 
  | 'solve';

export interface Equation {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  mode: GraphMode;
  domain?: {
    x?: [number, number];
    y?: [number, number];
    z?: [number, number];
  };
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface GraphSettings {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin?: number;
  zMax?: number;
  gridEnabled: boolean;
  axesEnabled: boolean;
  labelsEnabled: boolean;
  backgroundColor: string;
  gridColor: string;
  axesColor: string;
}

export interface CalculationInput {
  mode: CalculationMode;
  expression: string;
  variable?: string;
  bounds?: [number, number];
  point?: number;
}

export interface CalculationResult {
  mode: CalculationMode;
  input: string;
  result: string | number | number[] | number[][] | Point;
  steps?: string[];
  graph?: unknown;
  error?: string;
}

export interface MatrixOperation {
  type: 'add' | 'subtract' | 'multiply' | 'inverse' | 'determinant' | 'transpose' | 'eigenvalues';
  matrices: number[][][];
}

export interface VectorOperation {
  type: 'add' | 'subtract' | 'dot' | 'cross' | 'magnitude' | 'normalize' | 'projection';
  vectors: number[][];
}

export interface DerivativeOptions {
  order: number;
  point?: number;
  symbolic: boolean;
}

export interface IntegralOptions {
  bounds: [number, number];
  method: 'simpson' | 'trapezoidal' | 'analytical';
}

export interface AppState {
  equations: Equation[];
  graphSettings: GraphSettings;
  selectedMode: GraphMode;
  calculationMode: CalculationMode | null;
  results: CalculationResult[];
}
