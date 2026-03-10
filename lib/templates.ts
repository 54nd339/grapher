import type { ExpressionKind } from "@/types";

export interface ExpressionTemplate {
  name: string;
  latex: string;
  kind: ExpressionKind;
  category: string;
}

export const EXPRESSION_TEMPLATES: ExpressionTemplate[] = [
  // Algebraic
  { name: "Parabola", latex: "y=x^{2}", kind: "algebraic", category: "Algebraic" },
  { name: "Cubic", latex: "y=x^{3}-3x", kind: "algebraic", category: "Algebraic" },
  { name: "Absolute value", latex: "y=\\left|x\\right|", kind: "algebraic", category: "Algebraic" },
  { name: "Square root", latex: "y=\\sqrt{x}", kind: "algebraic", category: "Algebraic" },
  { name: "Reciprocal", latex: "y=\\frac{1}{x}", kind: "algebraic", category: "Algebraic" },

  // Trigonometric
  { name: "Sine wave", latex: "y=\\sin(x)", kind: "trigonometric", category: "Trigonometric" },
  { name: "Cosine wave", latex: "y=\\cos(x)", kind: "trigonometric", category: "Trigonometric" },
  { name: "Tangent", latex: "y=\\tan(x)", kind: "trigonometric", category: "Trigonometric" },
  { name: "Damped sine", latex: "y=e^{-0.2x}\\sin(x)", kind: "trigonometric", category: "Trigonometric" },

  // Parametric
  { name: "Circle", latex: "\\cos(t),\\sin(t)", kind: "parametric", category: "Parametric" },
  { name: "Ellipse", latex: "3\\cos(t),2\\sin(t)", kind: "parametric", category: "Parametric" },
  { name: "Lissajous", latex: "\\sin(3t),\\sin(2t)", kind: "parametric", category: "Parametric" },
  { name: "Spiral", latex: "t\\cos(t),t\\sin(t)", kind: "parametric", category: "Parametric" },

  // Polar
  { name: "Rose curve", latex: "r=\\cos(3\\theta)", kind: "polar", category: "Polar" },
  { name: "Cardioid", latex: "r=1+\\cos(\\theta)", kind: "polar", category: "Polar" },
  { name: "Archimedes spiral", latex: "r=\\theta", kind: "polar", category: "Polar" },
  { name: "Lemniscate", latex: "r=\\sqrt{\\cos(2\\theta)}", kind: "polar", category: "Polar" },

  // Implicit
  { name: "Unit circle", latex: "x^{2}+y^{2}=1", kind: "implicit", category: "Implicit" },
  { name: "Hyperbola", latex: "x^{2}-y^{2}=1", kind: "implicit", category: "Implicit" },
  { name: "Folium of Descartes", latex: "x^{3}+y^{3}=3xy", kind: "implicit", category: "Implicit" },

  // Differential
  { name: "Exponential growth", latex: "y'=y", kind: "differential", category: "Differential" },
  { name: "Logistic", latex: "y'=y(1-y)", kind: "differential", category: "Differential" },
  { name: "Circle ODE (implicit)", latex: "x+yy'=0", kind: "differential", category: "Differential" },
  { name: "Harmonic oscillator", latex: "y''=-y", kind: "differential", category: "Differential" },

  // Inequality
  { name: "Upper half-plane", latex: "y>0", kind: "inequality", category: "Inequality" },
  { name: "Disk region", latex: "x^{2}+y^{2}<4", kind: "inequality", category: "Inequality" },

  // Series
  { name: "Geometric series", latex: "\\sum_{n=0}^{10}x^{n}", kind: "series", category: "Series" },

  // 3D
  { name: "Paraboloid", latex: "z=x^{2}+y^{2}", kind: "algebraic", category: "3D" },
  { name: "Saddle", latex: "z=x^{2}-y^{2}", kind: "algebraic", category: "3D" },
  { name: "Ripple", latex: "z=\\sin(x^{2}+y^{2})", kind: "trigonometric", category: "3D" },
];
