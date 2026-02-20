export const GRAPH_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
] as const;

export const DEFAULT_VIEWPORT = {
  xMin: -10,
  xMax: 10,
  yMin: -7,
  yMax: 7,
} as const;

export const SOLVER_TABS = [
  { id: "algebra", label: "Algebra" },
  { id: "calculus", label: "Calculus" },
  { id: "trigonometry", label: "Trig" },
  { id: "matrices", label: "Matrices" },
  { id: "vectors", label: "Vectors" },
  { id: "ode", label: "ODE" },
  { id: "statistics", label: "Stats" },
] as const;

export const PLOT_SAMPLE_COUNT = 500;
export const PLOT_3D_GRID_SIZE = 50;
export const GPU_GRID_SIZE = 200;
export const IMPLICIT_MC_RESOLUTION = 180;
export const IMPLICIT_VIEW_MIN = -5;
export const IMPLICIT_VIEW_MAX = 5;
export const IMPLICIT_MAX_POLYGONS = 80000;
export const IMPLICIT_TIME_BUDGET_MS = 3600;

export const APP_NAME = "Grapher";
export const APP_DESCRIPTION =
  "Interactive 2D/3D graphing calculator with equation solver, LaTeX input, and virtual math keyboard.";
export const APP_URL = "https://graph.sandeepswain.dev";
