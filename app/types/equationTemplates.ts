import type { GraphMode } from "./index";

/**
 * Equation template categories
 */
export type TemplateCategory =
  | "algebra"
  | "trigonometry"
  | "calculus"
  | "differential-equations"
  | "physics"
  | "parametric"
  | "polar"
  | "implicit"
  | "series"
  | "custom";

/**
 * Tags for template search and filtering
 */
export type TemplateTag =
  | "polynomial"
  | "exponential"
  | "logarithmic"
  | "trigonometric"
  | "hyperbolic"
  | "rational"
  | "piecewise"
  | "parametric"
  | "polar"
  | "implicit"
  | "differential"
  | "integral"
  | "series"
  | "fourier"
  | "motion"
  | "wave"
  | "geometry"
  | "advanced";

/**
 * Equation template definition
 */
export interface EquationTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: TemplateTag[];
  expression: string;
  latex: string;
  mode: GraphMode;
  variables?: Record<string, { default: number; description: string; min?: number; max?: number }>;
  domain?: {
    x?: [number, number];
    y?: [number, number];
    z?: [number, number];
  };
  examples?: string[];
  notes?: string;
  isCustom?: boolean;
  createdAt?: number;
}

/**
 * Template library configuration
 */
export interface TemplateLibraryConfig {
  customTemplates: EquationTemplate[];
  favorites: string[];
}

