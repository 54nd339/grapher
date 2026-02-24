/**
 * centralized regular expressions used for math parsing and expression detection.
 */

// -----------------------------------------------------------------------------
// Pattern Detection (used in parser.ts)
// -----------------------------------------------------------------------------

export const REGEX_SLIDER = /^[a-wA-W]\s*=\s*-?\d+(\.\d+)?$/;
export const REGEX_POINTS = /^\s*\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)\s*(,\s*\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)\s*)*$/;
export const REGEX_INEQUALITY = /<=|>=|<|>/;
export const REGEX_INEQUALITY_STRICT = /!=/; // Helper to exclude != from inequality
export const REGEX_DIFFERENTIAL_SECOND_ORDER = /y''|d\^?2y\/dx\^?2|\\frac\{d\^?\{?2\}?y\}\{dx\^?\{?2\}?\}/;
export const REGEX_DIFFERENTIAL_FIRST_ORDER = /dy\/dx|y'|\\frac\{dy\}\{dx\}/;
export const REGEX_CALCULUS = /\bderivative\(|\bdiff\(|\\int|^int\(/;
export const REGEX_SERIES = /\\sum|\\Sigma|\bsum\(|\\prod|\bprod\(/;
export const REGEX_PARAMETRIC_T_FUNC = /\(t\)/;
export const REGEX_PARAMETRIC_COMMA = /^[^=]*,[^=]*$/;
export const REGEX_PARAMETRIC_T_VAR = /\bt\b/;
export const REGEX_POLAR = /^r\s*[=(]/;
export const REGEX_EQUALITY = /=/;
export const REGEX_Y_EQUALS = /^y\s*=/;
export const REGEX_VARIABLE_XY = /[xy]/;
export const REGEX_VARIABLE_X = /x/;
export const REGEX_VARIABLE_Y = /y/;
export const REGEX_ONLY_X = /^\s*x\s*$/;
export const REGEX_TRIG_FUNCS = /\b(sin|cos|tan|csc|sec|cot|asin|acos|atan|sinh|cosh|tanh)\b/;
export const REGEX_CUSTOM_RENDER_FUNCS = /^(int|sum|prod|diff|derivative|abs|nthRoot)\(/;

// -----------------------------------------------------------------------------
// Leibniz Derivatives
// -----------------------------------------------------------------------------

export const REGEX_LEIBNIZ_LATEX = /(?:\\frac|\\dfrac|\\tfrac)\{(?:\\mathrm\{d\}|d)\^?\{?\d*\}?\}\{(?:\\mathrm\{d\}|d)\s*[a-zA-Z]\^?\{?\d*\}?\}/;
export const REGEX_D_UPRIGHT = /d_upright/;
export const REGEX_LATEX_PREFIX = /^(?:[a-zA-Z]\s*(?:\\left|\\mleft)?\s*\(\s*[a-zA-Z]\s*(?:\\right|\\mright)?\s*\)|[a-zA-Z])\s*=\s*/;

// -----------------------------------------------------------------------------
// Compilation & Resolution
// -----------------------------------------------------------------------------

export const REGEX_LEIBNIZ_CE = /^\\frac\{(?:\\mathrm\{d\}|d)\^?\{?(\d+)?\}?\}\{(?:\\mathrm\{d\}|d)\s*(\w)\^?\{?\d*\}?\}(.+)$/;
export const REGEX_PLAIN_IDENTIFIER = /^([a-wA-W])\b/;

// -----------------------------------------------------------------------------
// LaTeX Converter
// -----------------------------------------------------------------------------

export const REGEX_MATHRM_D = /\\mathrm\{d\}/g;
export const REGEX_D_UPRIGHT_GLOBAL = /d_upright/g;
export const REGEX_DFRAC = /\\dfrac/g;
export const REGEX_TFRAC = /\\tfrac/g;
export const REGEX_LATEX_BOUND_VAR = /^([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*(.+)$/;
export const REGEX_SUM_NO_INDEX = /^\\sum_\{?([^{}]+)\}?\^\{?([^{}]+)\}?\s*(.+)$/;
export const REGEX_PROD_NO_INDEX = /^\\prod_\{?([^{}]+)\}?\^\{?([^{}]+)\}?\s*(.+)$/;
export const REGEX_WORD_BOUNDARY = /[a-zA-Z0-9_\\]/;
export const REGEX_SQRT_PREFIX_P = /^sqrt\s*\(/;
export const REGEX_FRAC_MANGLED = /\\frac\s*([A-Za-z0-9])\s*([A-Za-z0-9])/g;
export const REGEX_NEQ = /\\neq/g;
export const REGEX_ABS_PAREN = /\\abs\s*\(/g;
export const REGEX_ABS_BRACE = /\\abs\{([^{}]+)\}/g;

// -----------------------------------------------------------------------------
// Solver Regexes
// -----------------------------------------------------------------------------

export const REGEX_SOLVER_TAYLOR = /^taylor\((.+),\s*(\w+),\s*([^,]+),\s*(\d+)\)$/;
export const REGEX_SOLVER_LIMIT = /^lim\((.+),\s*(\w+),\s*([^)]+)\)$/;
export const REGEX_SOLVER_DIFF = /^(?:diff|derivative)\((.+?)(?:,\s*(\w+))?\)$/;

export const REGEX_SOLVER_INT_4 = /^int\((.+),\s*([a-zA-Z]),\s*([^,]+),\s*([^)]+)\)$/;
export const REGEX_SOLVER_INT_3 = /^int\((.+),\s*([^,]+),\s*([^)]+)\)$/;
export const REGEX_SOLVER_INT_2 = /^int\((.+),\s*([a-zA-Z])\)$/;
export const REGEX_SOLVER_INT_1 = /^int\((.+)\)$/;
export const REGEX_SOLVER_INTEGRATE_PAREN = /^integrate\s*\((.+)\)$/;
export const REGEX_SOLVER_INTEGRATE_BARE = /^integrate\s+(.+)$/;

export const REGEX_SOLVER_MATRIX_LITERAL_MANGLED = /^\*\[\[.+\]\]$/;
export const REGEX_SOLVER_OP_MATRIX_VECTOR = /^([a-zA-Z][a-zA-Z*]*)\*(.+)$/;

export const REGEX_SOLVER_MATRIX_DET = /^det\((.+)\)$/i;
export const REGEX_SOLVER_MATRIX_INV = /^inv\((.+)\)$/i;
export const REGEX_SOLVER_MATRIX_EIGS = /^eigs\((.+)\)$/i;
export const REGEX_SOLVER_MATRIX_TRANSPOSE = /^transpose\((.+)\)$/i;
export const REGEX_SOLVER_MATRIX_TRACE = /^trace\((.+)\)$/i;
export const REGEX_SOLVER_MATRIX_RANK = /^rank\((.+)\)$/i;

export const REGEX_SOLVER_VECTOR_CROSS = /^cross\((.+)\)$/i;
export const REGEX_SOLVER_VECTOR_DOT = /^dot\((.+)\)$/i;
export const REGEX_SOLVER_VECTOR_NORM = /^norm\((.+)\)$/i;

// -----------------------------------------------------------------------------
// Implicit & Parametric Parsing Regexes
// -----------------------------------------------------------------------------

export const REGEX_IMPLICIT_SIGNED_NUM = /^[+-]\d*\.?\d+$/;

export const REGEX_IMPLICIT_X_EQ_1 = /^x=([+-]?\d*\.?\d+)$/;
export const REGEX_IMPLICIT_X_EQ_2 = /^([+-]?\d*\.?\d+)=x$/;
export const REGEX_IMPLICIT_Y_EQ_1 = /^y=([+-]?\d*\.?\d+)$/;
export const REGEX_IMPLICIT_Y_EQ_2 = /^([+-]?\d*\.?\d+)=y$/;

export const REGEX_IMPLICIT_SIMPLE_CIRCLE_1 = /^x\^\(?2\)?\+y\^\(?2\)?=([+-]?\d*\.?\d+)$/;
export const REGEX_IMPLICIT_SIMPLE_CIRCLE_2 = /^([+-]?\d*\.?\d+)=x\^\(?2\)?\+y\^\(?2\)?$/;
export const REGEX_IMPLICIT_SIMPLE_CIRCLE_3 = /^x\^\(?2\)?\+y\^\(?2\)?-([+-]?\d*\.?\d+)=0$/;

export const REGEX_IMPLICIT_SHIFTED_CIRCLE_1 = /^\(x([+-]\d*\.?\d+)\)\^\(?2\)?\+\(y([+-]\d*\.?\d+)\)\^\(?2\)?=([+-]?\d*\.?\d+)$/;
export const REGEX_IMPLICIT_SHIFTED_CIRCLE_2 = /^([+-]?\d*\.?\d+)=\(x([+-]\d*\.?\d+)\)\^\(?2\)?\+\(y([+-]\d*\.?\d+)\)\^\(?2\)?$/;

const POW2 = String.raw`(?:\^\(?2\)?|\*\*2)`;

export const REGEX_IMPLICIT_ELLIPSE_SHIFTED = new RegExp(
  String.raw`^\(x([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)\+\(y([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)=1$`
);
export const REGEX_IMPLICIT_ELLIPSE_ORIGIN_1 = new RegExp(
  String.raw`^x${POW2}\/([+-]?\d*\.?\d+)\+y${POW2}\/([+-]?\d*\.?\d+)=1$`
);
export const REGEX_IMPLICIT_ELLIPSE_ORIGIN_2 = new RegExp(
  String.raw`^x${POW2}\/([+-]?\d*\.?\d+)\+y${POW2}\/([+-]?\d*\.?\d+)-1=0$`
);

export const REGEX_IMPLICIT_HYPERBOLA_X_SHIFTED = new RegExp(
  String.raw`^\(x([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)-\(y([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)=1$`
);
export const REGEX_IMPLICIT_HYPERBOLA_Y_SHIFTED = new RegExp(
  String.raw`^\(y([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)-\(x([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)=1$`
);
export const REGEX_IMPLICIT_HYPERBOLA_X_ORIGIN_1 = new RegExp(
  String.raw`^x${POW2}\/([+-]?\d*\.?\d+)-y${POW2}\/([+-]?\d*\.?\d+)=1$`
);
export const REGEX_IMPLICIT_HYPERBOLA_X_ORIGIN_2 = new RegExp(
  String.raw`^x${POW2}\/([+-]?\d*\.?\d+)-y${POW2}\/([+-]?\d*\.?\d+)-1=0$`
);
export const REGEX_IMPLICIT_HYPERBOLA_Y_ORIGIN_1 = new RegExp(
  String.raw`^y${POW2}\/([+-]?\d*\.?\d+)-x${POW2}\/([+-]?\d*\.?\d+)=1$`
);
export const REGEX_IMPLICIT_HYPERBOLA_Y_ORIGIN_2 = new RegExp(
  String.raw`^y${POW2}\/([+-]?\d*\.?\d+)-x${POW2}\/([+-]?\d*\.?\d+)-1=0$`
);

export const REGEX_IMPLICIT_PARABOLA_X2_SHIFTED = new RegExp(
  String.raw`^\(x([+-]\d*\.?\d+)\)${POW2}=([+-]?\d*\.?\d+)\(y([+-]\d*\.?\d+)\)$`
);
export const REGEX_IMPLICIT_PARABOLA_Y2_SHIFTED = new RegExp(
  String.raw`^\(y([+-]\d*\.?\d+)\)${POW2}=([+-]?\d*\.?\d+)\(x([+-]\d*\.?\d+)\)$`
);
export const REGEX_IMPLICIT_PARABOLA_X2_ORIGIN_1 = new RegExp(
  String.raw`^x${POW2}=([+-]?\d*\.?\d+)y$`
);
export const REGEX_IMPLICIT_PARABOLA_X2_ORIGIN_2 = new RegExp(
  String.raw`^y=([+-]?\d*\.?\d+)x${POW2}$`
);
export const REGEX_IMPLICIT_PARABOLA_Y2_ORIGIN_1 = new RegExp(
  String.raw`^y${POW2}=([+-]?\d*\.?\d+)x$`
);
export const REGEX_IMPLICIT_PARABOLA_Y2_ORIGIN_2 = new RegExp(
  String.raw`^x=([+-]?\d*\.?\d+)y${POW2}$`
);

// -----------------------------------------------------------------------------
// Domain Parser Regexes
// -----------------------------------------------------------------------------

export const REGEX_DOMAIN_SPLIT = /^(.+?)\s*\{(.+)\}\s*$/;
export const REGEX_DOMAIN_SIMPLE_CONDITION = /^x\s*(>=?|<=?|!=)\s*(-?\d+(?:\.\d+)?)$/;
export const REGEX_DOMAIN_COMPOUND_CONDITION = /^(-?\d+(?:\.\d+)?)\s*(<|<=)\s*x\s*(<|<=)\s*(-?\d+(?:\.\d+)?)$/;

// -----------------------------------------------------------------------------
// System Solving Regexes
// -----------------------------------------------------------------------------

export const REGEX_SYSTEMS_VARS = /[a-z]/gi;

// -----------------------------------------------------------------------------
// Component Regexes
// -----------------------------------------------------------------------------

export const REGEX_PLOT_NON_Y_FUNC_DEF = /^[a-hj-wA-HJ-W]\s*\([^)]*\)\s*=/;
export const REGEX_PLOT_FUNC_CALL = /\b[a-hj-wA-HJ-W]\s*\(/;

export const REGEX_3D_IMPLICIT = /=/;
export const REGEX_3D_HAS_Z = /z/;
export const REGEX_3D_EXPLICIT_Z = /^z\s*=/;

// -----------------------------------------------------------------------------
// ODE Regexes
// -----------------------------------------------------------------------------

export const REGEX_ODE_PRIME_NORMALIZE_1 = /[\u2032\u2019\u02BC]/g;
export const REGEX_ODE_PRIME_NORMALIZE_2 = /\\prime/g;
export const REGEX_ODE_RHS_MATCH = /^(?:\(dy\)\s*\/\s*\(dx\)|\(d\s*\*?\s*y\)\s*\/\s*\(d\s*\*?\s*x\)|dy\s*\/\s*dx|diff\(y(?:,\s*x)?\)|y')\s*=\s*(.+)$/;

export const REGEX_ODE_SECOND_ORDER = /^(?:y''|d\^?2y\/dx\^?2)\s*=\s*(.+)$/;
export const REGEX_ODE_FIRST_ORDER = /^(dy\/dx|y')\s*=\s*(.+)$/;
export const REGEX_ODE_IMPLICIT = /y'/;

// -----------------------------------------------------------------------------
// Core Plotting & Editor Regexes
// -----------------------------------------------------------------------------

export const REGEX_FUNC_NAME = /^[a-hj-wA-HJ-W]$/;
export const REGEX_FUNC_DEF_PREFIX = /^[a-hj-wA-HJ-W]\s*(?:\\left|\\mleft)?\s*\(/;

export const REGEX_LATEX_LEFT = /\\left/g;
export const REGEX_LATEX_RIGHT = /\\right/g;
export const REGEX_WHITESPACE = /\s+/g;

export const REGEX_POINT_PAIRS_FULL = /^\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)(,\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\))*$/;
export const REGEX_POINT_PAIR_MATCH = /\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/g;
export const REGEX_POINT_PAIR_MATCH_LOOSE = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;

export const REGEX_LEIBNIZ_LATEX_LOOSE = /\\frac\{(?:\\mathrm\{d\}|d)\^?\{?\d*\}?\}\{(?:\\mathrm\{d\}|d)/;
export const REGEX_CALCULUS_EXPR = /(d_upright|\\mathrm\{d\}|\bdy\/dx\b|\bd\^?\{?2\}?\s*y\s*\/\s*dx\^?\{?2\}?)/;

export const REGEX_SLIDER_MATCH = /^([a-wA-W])\s*=\s*(-?\d+(?:\.\d+)?)$/;
export const REGEX_SLIDER_VAR = /^([a-wA-W])/;
export const REGEX_RHS_ONLY = /=\s*(.+)$/;
export const REGEX_Y_EQ_PREFIX = /^y\s*=\s*/;

export const REGEX_SERIES_SUM = /^sum\((.+),\s*(\w+),\s*([^,]+),\s*([^)]+)\)$/;
export const REGEX_SERIES_PROD = /^prod\((.+),\s*(\w+),\s*([^,]+),\s*([^)]+)\)$/;

export const REGEX_POLAR_R_PREFIX_1 = /^r\s*=\s*/;
export const REGEX_POLAR_R_PREFIX_2 = /^\\s*r\\s*=\\s*/;

export const REGEX_INEQ_CIRCLE_INSIDE = /^x\^\(2\)\s*\+\s*y\^\(2\)\s*(<=|<)\s*(-?\d+(?:\.\d+)?)$/;
export const REGEX_INEQ_CIRCLE_OUTSIDE = /^x\^\(2\)\s*\+\s*y\^\(2\)\s*(>=|>)\s*(-?\d+(?:\.\d+)?)$/;
export const REGEX_INEQ_X_AXIS = /^x\s*(>=?|<=?)\s*(.+)$/;
export const REGEX_INEQ_Y_AXIS = /^y\s*(>=?|<=?)\s*(.+)$/;

export const REGEX_ALGEBRAIC_FUNC_DEF_FULL = /^\s*[a-hj-wA-HJ-W]\s*(?:\\left|\\mleft)?\(.*\)\s*=\s*(.+)$/;
export const REGEX_ALGEBRAIC_FUNC_DEF_PREFIX = /^[a-hj-wA-HJ-W]\s*\([^)]*\)\s*=\s*/;
