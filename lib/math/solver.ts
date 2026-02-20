import { exprToLatex, getCE } from "@/lib/latex";
import {
  ceCompile,
  descriptiveStats,
  findZeros,
  matrixDeterminant,
  matrixEigenvalues,
  matrixArithmetic,
  matrixEvaluate,
  matrixInverse,
  matrixRank,
  matrixTrace,
  matrixTranspose,
  numericalLimit,
  solveLinearSystem,
  solveODEText,
  taylorExpansion,
  vectorArithmetic,
  vectorCross,
  vectorDot,
  vectorEvaluate,
  vectorNorm,
  simpsonIntegrate,
} from "@/lib/math";
import type { SolverResult, SolverCategory } from "@/types";

/* ── Error hint messages per category ────────────────── */

const ERROR_HINTS: Record<SolverCategory, string> = {
  algebra:
    "Could not solve. Try an equation like x^2 - 4 = 0 or a system like x + y = 5, 2x - y = 1",
  calculus:
    "Try: diff(x^3), int(x^2, 0, 5), taylor(sin(x), x, 0, 5), or lim(sin(x)/x, x, 0)",
  trigonometry:
    "Try a trig equation like sin(x) = 0.5",
  matrices:
    "Enter matrix operations like det([[1,2],[3,4]]), inv([[1,2],[3,4]]), transpose([[1,2],[3,4]]), trace([[1,2],[3,4]]), rank([[1,2],[3,4]]), or arithmetic like [[1,2],[3,4]]+[[5,6],[7,8]]",
  vectors:
    "Enter vector operations like cross([1,2,3],[4,5,6]), dot([1,2],[3,4]), norm([3,4]), or arithmetic like [1,2]+[3,4]",
  ode: "Enter an ODE like dy/dx = x + y",
  statistics: "Enter a data set like: 1, 2, 3, 4, 5",
};

function errorResult(
  category: SolverCategory,
  input: string,
  rawError: unknown
): SolverResult {
  const msg = rawError instanceof Error ? rawError.message : String(rawError);
  return {
    input,
    output: `${ERROR_HINTS[category]}\n\nDetail: ${msg}`,
    error: true,
  };
}

function formatOutput(input: string, output: string, steps?: string[]): SolverResult {
  return {
    input,
    output,
    outputLatex: exprToLatex(output),
    steps,
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function formatAsPiMultiple(radians: number): { text: string; latex: string } {
  const ratio = radians / Math.PI;
  const nearestInt = Math.round(ratio);

  if (Math.abs(ratio - nearestInt) < 1e-6) {
    if (nearestInt === 0) return { text: "0", latex: "0" };
    if (nearestInt === 1) return { text: "π", latex: "\\pi" };
    return {
      text: `${nearestInt}π`,
      latex: `${nearestInt}\\pi`,
    };
  }

  let bestNumerator = 0;
  let bestDenominator = 1;
  let bestError = Number.POSITIVE_INFINITY;

  for (let denominator = 1; denominator <= 24; denominator++) {
    const numerator = Math.round(ratio * denominator);
    const err = Math.abs(ratio - numerator / denominator);
    if (err < bestError) {
      bestError = err;
      bestNumerator = numerator;
      bestDenominator = denominator;
    }
  }

  if (bestError > 1e-3) {
    const fixed = radians.toFixed(6);
    return { text: fixed, latex: fixed };
  }

  const divisor = gcd(bestNumerator, bestDenominator);
  const numerator = bestNumerator / divisor;
  const denominator = bestDenominator / divisor;

  if (numerator === 0) return { text: "0", latex: "0" };

  if (denominator === 1) {
    if (numerator === 1) return { text: "π", latex: "\\pi" };
    return {
      text: `${numerator}π`,
      latex: `${numerator}\\pi`,
    };
  }

  if (numerator === 1) {
    return {
      text: `π/${denominator}`,
      latex: `\\frac{\\pi}{${denominator}}`,
    };
  }

  return {
    text: `${numerator}π/${denominator}`,
    latex: `\\frac{${numerator}\\pi}{${denominator}}`,
  };
}

/* ── Algebra / Trigonometry ──────────────────────────── */

async function solveAlgebra(input: string): Promise<SolverResult> {
  // System of equations: detect comma/semicolon-separated equations with multiple variables
  if ((input.includes(",") || input.includes(";")) && input.includes("=")) {
    const result = solveLinearSystem(input);
    if (result) {
      const output = Object.entries(result.solution)
        .map(([k, v]) => `${k} = ${v}`)
        .join(", ");
      return { input, output, outputLatex: output, steps: result.steps };
    }
  }

  try {
    const ce = getCE();
    // Normalise: if no "=", assume "= 0"
    const eqStr = input.includes("=") ? input : `${input} = 0`;
    const expr = ce.parse(eqStr, { strict: false });
    const solutions = expr.solve("x") as { latex: string }[] | null;

    if (!solutions || solutions.length === 0) {
      throw new Error("No solutions found");
    }

    const solStrings = solutions.map((s: { latex: string }) => s.latex);
    const output = solStrings.join(", ");
    const steps = [
      `Given: ${input}`,
      `Solve for x`,
      ...solStrings.map((s: string, i: number) => `x${solutions.length > 1 ? `_${i + 1}` : ""} = ${s}`),
    ];
    return {
      input,
      output,
      outputLatex: output,
      steps,
    };
  } catch (e) {
    return errorResult("algebra", input, e);
  }
}

async function solveTrigonometry(input: string): Promise<SolverResult> {
  const symbolic = await solveAlgebra(input);
  if (!symbolic.error) return symbolic;

  const eqStr = input.includes("=") ? input : `${input} = 0`;
  const [lhs, rhs] = eqStr.split("=").map((s) => s.trim());
  if (!lhs || rhs === undefined) {
    return errorResult("trigonometry", input, new Error("Invalid equation format"));
  }

  const exprStr = `(${lhs}) - (${rhs})`;
  const fn = ceCompile(exprStr);
  if (!fn) {
    return errorResult("trigonometry", input, new Error("Cannot compile trigonometric expression"));
  }

  const rawRoots = await findZeros(exprStr, false, 0, 2 * Math.PI, {}, 600);
  const roots = rawRoots
    .filter((x: number) => isFinite(x))
    .map((x: number) => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
    .sort((a: number, b: number) => a - b)
    .filter((x: number, i: number, arr: number[]) => i === 0 || Math.abs(x - arr[i - 1]) > 1e-4);

  if (roots.length === 0) {
    return errorResult("trigonometry", input, new Error("No solutions found"));
  }

  const principal = roots.map(formatAsPiMultiple);
  const principalText = principal.map((r) => r.text).join(", ");
  const principalLatex = principal.map((r) => r.latex).join(", ");
  const output = roots.length === 1
    ? `x = ${principal[0].text} + 2πk`
    : `x = ${principalText} (mod 2π)`;
  const outputLatex = roots.length === 1
    ? `x = ${principal[0].latex} + 2\\pi k`
    : `x = ${principalLatex} \\pmod{2\\pi}`;

  return {
    input,
    output,
    outputLatex,
    steps: [
      `Given: ${input}`,
      "Symbolic solve returned no closed-form result",
      "Applied numerical root finding on [0, 2π)",
      `Principal root(s): ${principalText}`,
      "General solution repeats every 2π",
    ],
  };
}

/* ── Calculus ────────────────────────────────────────── */

// 4-arg definite integral: int(body, variable, lower, upper)
const INT_4_ARG = /^int\((.+),\s*([a-zA-Z]),\s*([^,]+),\s*([^)]+)\)$/;
// 3-arg definite integral (no explicit variable, assume x): int(body, lower, upper)
const INT_3_ARG = /^int\((.+),\s*([^,]+),\s*([^)]+)\)$/;
// 2-arg indefinite: int(body, variable)
const INT_2_ARG = /^int\((.+),\s*([a-zA-Z])\)$/;
// 1-arg indefinite (assume x): int(body)
const INT_1_ARG = /^int\((.+)\)$/;
// integrate(...) form
const INTEGRATE_PAREN = /^integrate\s*\((.+)\)$/;
const INTEGRATE_BARE = /^integrate\s+(.+)$/;

/**
 * Numerical definite integral via worker-based composite Simpson's rule.
 * Falls back when CE can't evaluate the integral symbolically.
 */
async function numericalIntegrate(
  exprStr: string,
  variable: string,
  a: number,
  b: number,
): Promise<number | null> {
  const fn = ceCompile(exprStr);
  if (!fn) return null;

  try {
    return await simpsonIntegrate(exprStr, false, variable, a, b, {}, 1000);
  } catch {
    return null;
  }
}

/** Definite integral: try CE symbolic first, fall back to numerical. */
async function solveIntegral(
  input: string,
  body: string,
  variable: string,
  lower: number,
  upper: number,
): Promise<SolverResult> {
  const ce = getCE();

  // Attempt symbolic integration via CE
  try {
    const parsed = ce.parse(body, { strict: false });
    const integral = ce.box(["Integrate", parsed.json, variable]).evaluate();
    const latex = integral.latex;
    // CE returns the integral unevaluated when it can't solve it — detect that
    const looksUnevaluated = latex.includes("\\int");
    if (!looksUnevaluated) {
      // Evaluate F(upper) - F(lower) by compiling the antiderivative
      const antideriv = ceCompile(latex);
      if (antideriv) {
        const val = antideriv({ [variable]: upper }) - antideriv({ [variable]: lower });
        if (isFinite(val)) {
          return {
            input,
            output: val.toFixed(6),
            outputLatex: `${latex}\\Big|_{${lower}}^{${upper}} = ${val.toFixed(6)}`,
            steps: [
              `Given: f(${variable}) = ${body}`,
              `Integrate with respect to ${variable}`,
              `F(${variable}) = ${latex}`,
              `F(${upper}) - F(${lower}) = ${val.toFixed(6)}`,
            ],
          };
        }
      }
    }
  } catch { /* fall through to numerical */ }

  // Numerical fallback (Simpson's rule via worker)
  const numResult = await numericalIntegrate(body, variable, lower, upper);
  if (numResult !== null && isFinite(numResult)) {
    return {
      input,
      output: numResult.toFixed(6),
      outputLatex: `\\int_{${lower}}^{${upper}} \\approx ${numResult.toFixed(6)}`,
      steps: [
        `Given: f(${variable}) = ${body}`,
        `Definite integral from ${lower} to ${upper}`,
        `Numerical result (Simpson's rule): ${numResult.toFixed(6)}`,
      ],
    };
  }

  return errorResult("calculus", input, new Error("Cannot evaluate integral"));
}

/** Indefinite integral: try CE symbolic. */
async function solveIndefiniteIntegral(
  input: string,
  body: string,
  variable: string,
): Promise<SolverResult> {
  try {
    const ce = getCE();
    const parsed = ce.parse(body, { strict: false });
    const integral = ce.box(["Integrate", parsed.json, variable]).evaluate();
    const output = integral.latex;
    const looksUnevaluated = output.includes("\\int");
    if (looksUnevaluated) {
      return errorResult("calculus", input, new Error("Cannot compute symbolic antiderivative. Try a definite integral with bounds."));
    }
    const steps = [
      `Given: f(${variable}) = ${body}`,
      `Integrate with respect to ${variable}`,
      `F(${variable}) = ${output} + C`,
    ];
    return { input, output: `${output} + C`, outputLatex: `${output} + C`, steps };
  } catch (e) {
    return errorResult("calculus", input, e);
  }
}

async function solveCalculus(input: string): Promise<SolverResult> {
  const ce = getCE();

  // Taylor series: taylor(expr, x, center, order)
  const taylorMatch = input.match(/^taylor\((.+),\s*(\w+),\s*([^,]+),\s*(\d+)\)$/);
  if (taylorMatch) {
    const [, expr, variable, centerStr, orderStr] = taylorMatch;
    const center = Number(centerStr);
    const order = Number(orderStr);
    const result = taylorExpansion(expr, variable, center, Math.min(order, 10));
    if (!result) return errorResult("calculus", input, new Error("Cannot compute Taylor expansion"));
    return {
      input,
      output: result.latex,
      outputLatex: result.latex,
      steps: [
        `Given: f(${variable}) = ${expr}`,
        `Taylor expansion around ${variable} = ${center}, order ${order}`,
        `T(${variable}) = ${result.latex}`,
      ],
    };
  }

  // Limit: lim(expr, x, value)
  const limMatch = input.match(/^lim\((.+),\s*(\w+),\s*([^)]+)\)$/);
  if (limMatch) {
    const [, expr, variable, valueStr] = limMatch;
    const approach = Number(valueStr);
    if (!isFinite(approach)) return errorResult("calculus", input, new Error("Limit value must be finite"));
    const result = numericalLimit(expr, variable, approach);
    if (!result) return errorResult("calculus", input, new Error("Cannot compute limit"));
    const valueDisplay = isFinite(result.value) ? result.value.toFixed(6) : "DNE";
    return {
      input,
      output: valueDisplay,
      outputLatex: valueDisplay,
      steps: [
        `Given: f(${variable}) = ${expr}`,
        `Compute limit as ${variable} → ${approach}`,
        `Left limit: ${isFinite(result.leftLimit) ? result.leftLimit.toFixed(6) : "DNE"}`,
        `Right limit: ${isFinite(result.rightLimit) ? result.rightLimit.toFixed(6) : "DNE"}`,
        `Limit = ${valueDisplay}`,
      ],
    };
  }

  // ── Integration ───────────────────────────────────
  // Try 4-arg definite integral first (most specific)
  const m4 = input.match(INT_4_ARG);
  if (m4) {
    const [, body, variable, lowerStr, upperStr] = m4;
    return solveIntegral(input, body, variable, Number(lowerStr), Number(upperStr));
  }

  // 2-arg indefinite with explicit variable
  const m2 = input.match(INT_2_ARG);
  if (m2) {
    const [, body, variable] = m2;
    return solveIndefiniteIntegral(input, body, variable);
  }

  // 3-arg (no explicit variable — body might contain commas so match last)
  const m3 = input.match(INT_3_ARG);
  if (m3) {
    const [, body, lowerStr, upperStr] = m3;
    return solveIntegral(input, body, "x", Number(lowerStr), Number(upperStr));
  }

  // 1-arg / integrate forms
  const m1 = input.match(INT_1_ARG) ?? input.match(INTEGRATE_PAREN) ?? input.match(INTEGRATE_BARE);
  if (m1) {
    return solveIndefiniteIntegral(input, m1[1], "x");
  }

  // ── Differentiation ───────────────────────────────
  const diffMatch = input.match(/^(?:diff|derivative)\((.+?)(?:,\s*(\w+))?\)$/);
  if (diffMatch) {
    const exprStr = diffMatch[1];
    const variable = diffMatch[2] || "x";
    try {
      const parsed = ce.parse(exprStr, { strict: false });
      const result = ce.box(["D", parsed.json, variable]).evaluate();
      const output = result.latex;
      const steps = [
        `Given: f(${variable}) = ${exprStr}`,
        `Differentiate with respect to ${variable}`,
        `f'(${variable}) = ${output}`,
      ];
      return { input, output, outputLatex: output, steps };
    } catch (e) {
      return errorResult("calculus", input, e);
    }
  }

  // Default: differentiate the raw expression
  try {
    const parsed = ce.parse(input, { strict: false });
    const result = ce.box(["D", parsed.json, "x"]).evaluate();
    const output = result.latex;
    const steps = [
      `Given: f(x) = ${input}`,
      `Differentiate with respect to x`,
      `f'(x) = ${output}`,
    ];
    return { input, output, outputLatex: output, steps };
  } catch (e) {
    return errorResult("calculus", input, e);
  }
}

/* ── ODE ─────────────────────────────────────────────── */

async function solveODE(input: string): Promise<SolverResult> {
  try {
    const result = await solveODEText(input);
    return formatOutput(input, result.output, result.steps);
  } catch (e) {
    return errorResult("ode", input, e);
  }
}

/* ── Matrices ────────────────────────────────────────── */

const MATRIX_OPS = ["det", "inv", "eigs", "transpose", "trace", "rank"] as const;
const MATRIX_OP_SET = new Set<string>(MATRIX_OPS);

function stripWrappingParens(value: string): string {
  if (value.length >= 2 && value.startsWith("(") && value.endsWith(")")) {
    return value.slice(1, -1);
  }
  return value;
}

function normalizeMatrixInput(rawInput: string): { normalized: string; unknownOperation: string | null } {
  const compact = rawInput.trim().replace(/\s+/g, "");

  if (/^\*\[\[.+\]\]$/.test(compact)) {
    return { normalized: compact, unknownOperation: "<missing>" };
  }

  const opMatrixMatch = compact.match(/^([a-zA-Z][a-zA-Z*]*)\*(.+)$/);
  if (!opMatrixMatch) {
    return { normalized: compact, unknownOperation: null };
  }

  const op = opMatrixMatch[1].replace(/\*/g, "").toLowerCase();
  const arg = stripWrappingParens(opMatrixMatch[2]);

  if (MATRIX_OP_SET.has(op)) {
    return { normalized: `${op}(${arg})`, unknownOperation: null };
  }

  if (arg.startsWith("[[")) {
    return { normalized: compact, unknownOperation: op };
  }

  return { normalized: compact, unknownOperation: null };
}

async function solveMatrix(input: string): Promise<SolverResult> {
  try {
    const { normalized, unknownOperation } = normalizeMatrixInput(input);

    if (unknownOperation) {
      if (unknownOperation === "<missing>") {
        throw new Error(
          `Missing matrix operation before matrix literal. Supported operations: ${MATRIX_OPS.join(", ")}`
        );
      }
      throw new Error(
        `Unsupported matrix operation: ${unknownOperation}. Supported operations: ${MATRIX_OPS.join(", ")}`
      );
    }

    const detMatch = normalized.match(/^det\((.+)\)$/i);
    if (detMatch) {
      const output = await matrixDeterminant(detMatch[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: A = ${detMatch[1]}`,
        `Compute determinant`,
        `det(A) = ${output}`,
      ]);
    }

    const invMatch = normalized.match(/^inv\((.+)\)$/i);
    if (invMatch) {
      const output = await matrixInverse(invMatch[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: A = ${invMatch[1]}`,
        `Compute inverse`,
        `A^(-1) = ${output}`,
      ]);
    }

    const eigsMatch = normalized.match(/^eigs\((.+)\)$/i);
    if (eigsMatch) {
      const output = await matrixEigenvalues(eigsMatch[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: A = ${eigsMatch[1]}`,
        `Compute eigenvalues`,
        `Eigenvalues: ${output}`,
      ]);
    }

    const transposeMatch = normalized.match(/^transpose\((.+)\)$/i);
    if (transposeMatch) {
      const output = await matrixTranspose(transposeMatch[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: A = ${transposeMatch[1]}`,
        "Compute transpose",
        `A^T = ${output}`,
      ]);
    }

    const traceMatch = normalized.match(/^trace\((.+)\)$/i);
    if (traceMatch) {
      const output = await matrixTrace(traceMatch[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: A = ${traceMatch[1]}`,
        "Compute trace",
        `tr(A) = ${output}`,
      ]);
    }

    const rankMatch = normalized.match(/^rank\((.+)\)$/i);
    if (rankMatch) {
      const output = await matrixRank(rankMatch[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: A = ${rankMatch[1]}`,
        "Compute rank",
        `rank(A) = ${output}`,
      ]);
    }

    const arithmetic = await matrixArithmetic(normalized);
    if (arithmetic !== null) {
      if (arithmetic.startsWith("Error:")) throw new Error(arithmetic);
      return formatOutput(input, arithmetic, [
        `Given: ${normalized}`,
        "Evaluate matrix arithmetic",
        `Result: ${arithmetic}`,
      ]);
    }

    const output = await matrixEvaluate(normalized);
    if (output.startsWith("Error:")) throw new Error(output);
    return formatOutput(input, output);
  } catch (e) {
    return errorResult("matrices", input, e);
  }
}

/* ── Vectors ─────────────────────────────────────────── */

function splitTwoArgs(argsStr: string): [string, string] | null {
  let depth = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      return [argsStr.slice(0, i).trim(), argsStr.slice(i + 1).trim()];
    }
  }
  return null;
}

const VECTOR_OPS = ["cross", "dot", "norm"] as const;
const VECTOR_OP_SET = new Set<string>(VECTOR_OPS);

function normalizeVectorInput(rawInput: string): { normalized: string; unknownOperation: string | null } {
  const compact = rawInput.trim().replace(/\s+/g, "");

  const opVectorMatch = compact.match(/^([a-zA-Z][a-zA-Z*]*)\*(.+)$/);
  if (!opVectorMatch) {
    return { normalized: compact, unknownOperation: null };
  }

  const op = opVectorMatch[1].replace(/\*/g, "").toLowerCase();
  const arg = stripWrappingParens(opVectorMatch[2]);

  if (VECTOR_OP_SET.has(op)) {
    return { normalized: `${op}(${arg})`, unknownOperation: null };
  }

  if (arg.startsWith("[")) {
    return { normalized: compact, unknownOperation: op };
  }

  return { normalized: compact, unknownOperation: null };
}

async function solveVector(input: string): Promise<SolverResult> {
  try {
    const { normalized, unknownOperation } = normalizeVectorInput(input);

    if (unknownOperation) {
      throw new Error(
        `Unsupported vector operation: ${unknownOperation}. Supported operations: ${VECTOR_OPS.join(", ")}`
      );
    }

    const crossMatch = normalized.match(/^cross\((.+)\)$/i);
    if (crossMatch) {
      const args = splitTwoArgs(crossMatch[1]);
      if (!args) throw new Error("Expected two vector arguments");
      const output = await vectorCross(args[0], args[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: a = ${args[0]}, b = ${args[1]}`,
        `Compute cross product a x b`,
        `Result: ${output}`,
      ]);
    }

    const dotMatch = normalized.match(/^dot\((.+)\)$/i);
    if (dotMatch) {
      const args = splitTwoArgs(dotMatch[1]);
      if (!args) throw new Error("Expected two vector arguments");
      const output = await vectorDot(args[0], args[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: a = ${args[0]}, b = ${args[1]}`,
        `Compute dot product a . b`,
        `Result: ${output}`,
      ]);
    }

    const normMatch = normalized.match(/^norm\((.+)\)$/i);
    if (normMatch) {
      const output = await vectorNorm(normMatch[1]);
      if (output.startsWith("Error:")) throw new Error(output);
      return formatOutput(input, output, [
        `Given: v = ${normMatch[1]}`,
        `Compute Euclidean norm ||v||`,
        `Result: ${output}`,
      ]);
    }

    const arithmetic = await vectorArithmetic(normalized);
    if (arithmetic !== null) {
      if (arithmetic.startsWith("Error:")) throw new Error(arithmetic);
      return formatOutput(input, arithmetic, [
        `Given: ${normalized}`,
        "Evaluate vector arithmetic",
        `Result: ${arithmetic}`,
      ]);
    }

    const output = await vectorEvaluate(normalized);
    if (output.startsWith("Error:")) throw new Error(output);
    return formatOutput(input, output);
  } catch (e) {
    return errorResult("vectors", input, e);
  }
}

/* ── Statistics ──────────────────────────────────────── */

async function solveStatistics(input: string): Promise<SolverResult> {
  try {
    const values = input
      .split(/[,;\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => isFinite(n));

    if (values.length === 0) throw new Error("No valid numbers found");

    const stats = descriptiveStats(values);
    const output = `Mean: ${stats.mean.toFixed(4)}, Median: ${stats.median.toFixed(4)}, StdDev: ${stats.stddev.toFixed(4)}`;
    return formatOutput(input, output, [
      `Data: [${values.join(", ")}]  (n = ${stats.count})`,
      `Mean: ${stats.mean.toFixed(4)}`,
      `Median: ${stats.median.toFixed(4)}`,
      `Standard Deviation: ${stats.stddev.toFixed(4)}`,
      `Variance: ${stats.variance.toFixed(4)}`,
      `Min: ${stats.min}, Max: ${stats.max}`,
      `Q1: ${stats.q1.toFixed(4)}, Q3: ${stats.q3.toFixed(4)}`,
      `IQR: ${(stats.q3 - stats.q1).toFixed(4)}`,
    ]);
  } catch (e) {
    return errorResult("statistics", input, e);
  }
}

/* ── Main dispatch ───────────────────────────────────── */

export async function solve(
  category: SolverCategory,
  input: string
): Promise<SolverResult> {
  switch (category) {
    case "algebra":
      return solveAlgebra(input);
    case "trigonometry":
      return solveTrigonometry(input);
    case "calculus":
      return solveCalculus(input);
    case "ode":
      return solveODE(input);
    case "matrices":
      return solveMatrix(input);
    case "vectors":
      return solveVector(input);
    case "statistics":
      return solveStatistics(input);
    default:
      return { input, output: "Unsupported category", error: true };
  }
}
