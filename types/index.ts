/* ── Expression types ─────────────────────────────────── */

export type ExpressionKind =
  | "algebraic"
  | "polar"
  | "parametric"
  | "implicit"
  | "differential"
  | "calculus"
  | "series"
  | "trigonometric"
  | "slider"
  | "inequality"
  | "points";

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  value: number;
  animating: boolean;
}

export interface Folder {
  id: string;
  name: string;
  collapsed: boolean;
}

export type RegressionType = "linear" | "quadratic" | "exponential";

export interface Expression {
  id: string;
  latex: string;
  kind: ExpressionKind;
  color: string;
  visible: boolean;
  label?: string;
  sliderConfig?: SliderConfig;
  folderId?: string;
  points?: [number, number][];
  paramRange?: [number, number];
  regressionType?: RegressionType;
}

/* ── Graph types ─────────────────────────────────────── */

export type GraphMode = "2d" | "3d";

export interface ViewportBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/* ── Solver types ────────────────────────────────────── */

export type SolverCategory =
  | "algebra"
  | "calculus"
  | "trigonometry"
  | "matrices"
  | "vectors"
  | "ode"
  | "statistics";

export interface SolverResult {
  input: string;
  output: string;
  outputLatex?: string;
  steps?: string[];
  error?: boolean;
}

/* ── UI types ────────────────────────────────────────── */

export interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
}

/* ── MathLive JSX declaration ────────────────────────── */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React.JSX {
    interface IntrinsicElements {
      "math-field": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          value?: string;
          "virtual-keyboard-mode"?: "manual" | "onfocus" | "off";
          "read-only"?: boolean;
          placeholder?: string;
        },
        HTMLElement
      >;
    }
  }

}
