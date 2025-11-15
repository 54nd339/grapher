
export type CalculatorThemeStyles = typeof import('@/theme/styles').calculatorStyles;

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
  animation?: {
    enabled: boolean;
    tStart: number;
    tEnd: number;
    speed: number; // units of t per second before easing
    loop: boolean;
    easing: 'linear' | 'easeInOut' | 'quadIn' | 'quadOut' | 'cubicInOut';
    resolution?: number; // max points
    lastT?: number; // internal tracking
    playing?: boolean; // playback state
    scrubbing?: boolean; // user actively scrubbing timeline
    minFrameMs?: number; // performance throttle
    lastFrameTs?: number; // internal frame timestamp
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
  scrollZoom: boolean;
  editable: boolean;
  exportEnabled: boolean;
  exportFormat: 'png' | 'svg' | 'jpeg' | 'webp';
  animationEnabled: boolean;
  animationDuration: number;
  animationPlaybackSpeed?: number; // global multiplier
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
  latex?: string;
  method?: string;
  numericApprox?: number;
  discontinuities?: number[];
  domainIssues?: string[];
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

export type IntegralVariant = 'definite' | 'indefinite';

export interface IntegralOptions {
  variant: IntegralVariant;
  bounds?: [number, number];
  method?: 'simpson' | 'trapezoidal' | 'analytical';
}

export interface AppState {
  equations: Equation[];
  graphSettings: GraphSettings;
  selectedMode: GraphMode;
  calculationMode: CalculationMode | null;
  results: CalculationResult[];
}

export type ThemeValue = string | string[] | undefined;

export type ThemeTokens = {
  background?: string;
  surface?: string;
  surfaceAlt?: string;
  text?: string;
  textMuted?: string;
  textOnAccent?: string;
  primary?: string;
  primaryGlow?: string;
  primaryHover?: string;
  secondary?: string;
  secondaryHover?: string;
  border?: string;
  borderMuted?: string;
  borderStrong?: string;
  gradientPrimaryStart?: string;
  gradientPrimaryEnd?: string;
  gradientHoverStart?: string;
  gradientHoverEnd?: string;
  scrollbarTrack?: string;
  scrollbarThumb?: string;
  scrollbarThumbHover?: string;
  scrollbarGlow?: string;
  grid?: string;
  gridStrong?: string;
  axis?: string;
  axisHighlight?: string;
  axisBase?: string;
  canvas?: string;
  overlay?: string;
  plotBackground?: string;
  transparent?: string;
  equationPalette?: string[];
  accentRed?: string;
  accentBlue?: string;
  accentGreen?: string;
  accentAmber?: string;
  accentViolet?: string;
  accentPink?: string;
  accentCyan?: string;
  accentOrange?: string;
  accentTeal?: string;
  accentIndigo?: string;
  colorScheme?: 'light' | 'dark';
  [additional: string]: ThemeValue;
};

export type ThemeOption<Name extends string = string> = {
  name: Name;
  label: string;
  tokens: ThemeTokens;
};
