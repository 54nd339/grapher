import { ceCompile, type EvalFn } from "./ce-compile";
import { rearrangeImplicitODE } from "./ode-rearrange";
import type { PlotPoint, ODEInitialCondition } from "./types";

export async function integrateWithOdex(
  f: (t: number, y: number[]) => number[],
  tSpan: [number, number],
  y0: number[],
  steps = 500,
): Promise<{ t: number[]; y: number[][] }> {
  try {
    const odexModule = await import("odex");
    const SolverCtor = (odexModule as unknown as {
      Solver: new (
        f: (x: number, y: number[]) => number[],
        n: number,
        options?: { absoluteTolerance?: number; relativeTolerance?: number }
      ) => { integrate: (x0: number, y0: number[]) => (x: number) => number[] };
    }).Solver;

    const solver = new SolverCtor(
      (x: number, y: number[]) => f(x, y),
      y0.length,
      { absoluteTolerance: 1e-8, relativeTolerance: 1e-8 },
    );

    const [t0, tEnd] = tSpan;
    const solution = solver.integrate(t0, y0);
    const ts: number[] = [];
    const ys: number[][] = [];

    for (let index = 0; index <= steps; index++) {
      const t = t0 + ((tEnd - t0) * index) / steps;
      const y = solution(t).map((value) => (isFinite(value) ? value : 0));
      ts.push(t);
      ys.push(y);
    }

    return { t: ts, y: ys };
  } catch {
    return rk4(f, tSpan, y0, steps);
  }
}

/**
 * Classic 4th-order Runge-Kutta integrator.
 * Standalone numerical integrator -- no external dependency needed.
 */
export function rk4(
  f: (t: number, y: number[]) => number[],
  tSpan: [number, number],
  y0: number[],
  steps = 500,
): { t: number[]; y: number[][] } {
  const [t0, tEnd] = tSpan;
  const h = (tEnd - t0) / steps;
  const dim = y0.length;
  const ts: number[] = [t0];
  const ys: number[][] = [y0.slice()];

  let t = t0;
  let y = y0.slice();

  for (let i = 0; i < steps; i++) {
    const k1 = f(t, y);
    const k2 = f(t + h / 2, y.map((v, d) => v + (h / 2) * k1[d]));
    const k3 = f(t + h / 2, y.map((v, d) => v + (h / 2) * k2[d]));
    const k4 = f(t + h, y.map((v, d) => v + h * k3[d]));

    y = y.map((v, d) => v + (h / 6) * (k1[d] + 2 * k2[d] + 2 * k3[d] + k4[d]));
    t = t0 + (i + 1) * h;

    for (let d = 0; d < dim; d++) {
      if (!isFinite(y[d])) y[d] = 0;
    }

    ts.push(t);
    ys.push(y.slice());
  }

  return { t: ts, y: ys };
}

/**
 * Solve an ODE numerically and return plottable points.
 */
export async function solveODEPlot(
  fn: (t: number, y: number[]) => number[],
  initial: ODEInitialCondition,
  steps = 200,
): Promise<PlotPoint[]> {
  try {
    const result = await integrateWithOdex(
      fn,
      [initial.t0, initial.tEnd],
      Array.isArray(initial.y0) ? initial.y0 : [initial.y0],
    );

    const points: PlotPoint[] = [];
    const sampleInterval = Math.max(1, Math.floor(result.t.length / steps));
    for (let i = 0; i < result.t.length; i += sampleInterval) {
      points.push({ x: result.t[i], y: result.y[i][0] });
    }

    return points;
  } catch {
    return [];
  }
}

/**
 * Solve an ODE from a string expression for the solver panel.
 * Parses "dy/dx = f(x,y)" or "y' = f(x,y)", runs RK4,
 * and returns a human-readable text result with solution points.
 */
export async function solveODEText(
  input: string,
): Promise<{ output: string; steps: string[] }> {
  const formatNum = (value: number): string => {
    if (Math.abs(value) < 1e-10) return "0";
    if (Math.abs(value - Math.round(value)) < 1e-10) return String(Math.round(value));
    return String(Number(value.toFixed(6)));
  };

  const detectLinearAffineRhs = (compiled: EvalFn): { a: number; b: number; c: number } | null => {
    const sample = (x: number, y: number): number | null => {
      const v = compiled({ x, y });
      return typeof v === "number" && isFinite(v) ? v : null;
    };

    const c = sample(0, 0);
    const fx10 = sample(1, 0);
    const fy01 = sample(0, 1);
    if (c === null || fx10 === null || fy01 === null) return null;

    const b = fx10 - c;
    const a = fy01 - c;
    const tol = 1e-6;
    const checkpoints: Array<[number, number]> = [
      [2, 3],
      [-1, 2],
      [0.5, -1.5],
    ];

    for (const [x, y] of checkpoints) {
      const actual = sample(x, y);
      if (actual === null) return null;
      const expected = a * y + b * x + c;
      if (Math.abs(actual - expected) > tol) return null;
    }

    return { a, b, c };
  };

  const linearGeneralSolution = (coeffs: { a: number; b: number; c: number }): string => {
    const { a, b, c } = coeffs;
    if (Math.abs(a) < 1e-10) {
      const halfB = b / 2;
      return `y = ${formatNum(halfB)}x^2 + ${formatNum(c)}x + C`;
    }

    const p = b / a;
    const q = b / (a * a) + c / a;
    return `y + ${formatNum(p)}x + ${formatNum(q)} = C*e^(${formatNum(a)}x)`;
  };

  const normalizedInput = input
    .replace(/[\u2032\u2019\u02BC]/g, "'")
    .replace(/\\prime/g, "'")
    .trim();

  const rhsMatch = normalizedInput.match(
    /^(?:\(dy\)\s*\/\s*\(dx\)|\(d\s*\*?\s*y\)\s*\/\s*\(d\s*\*?\s*x\)|dy\s*\/\s*dx|diff\(y(?:,\s*x)?\)|y')\s*=\s*(.+)$/
  );

  let rhs: string;
  let fn: EvalFn | null;
  let implicitForm = false;

  if (rhsMatch) {
    rhs = rhsMatch[1].trim();
    fn = ceCompile(rhs);
    if (!fn) throw new Error(`Cannot compile expression: ${rhs}`);
  } else {
    // handle implicit ODE forms like "yy' + x = 0" by rearranging to y' = -F/G
    if (!normalizedInput.includes("y'")) {
      throw new Error("Expected form: dy/dx = f(x,y), y' = f(x,y), or an implicit ODE containing y'");
    }
    const rearranged = rearrangeImplicitODE(normalizedInput);
    if (!rearranged) {
      throw new Error("Cannot rearrange implicit ODE. Try writing it as y' = f(x,y)");
    }
    rhs = rearranged.rhs;
    fn = rearranged.rhsFn;
    implicitForm = true;
  }

  const t0 = 0;
  const y0 = 1;
  const tEnd = 10;

  const odeFn = (t: number, yArr: number[]): number[] => {
    const val = fn({ x: t, y: yArr[0] });
    return [typeof val === "number" && isFinite(val) ? val : 0];
  };

  const symbolicCoeffs = detectLinearAffineRhs(fn);
  if (symbolicCoeffs) {
    const equation = linearGeneralSolution(symbolicCoeffs);
    return {
      output: equation,
      steps: [
        `Given: ${implicitForm ? input : `dy/dx = ${rhs}`}`,
        ...(implicitForm ? [`Rearranged to: dy/dx = ${rhs}`] : []),
        "Detected first-order linear ODE: y' = a*y + b*x + c",
        `General solution: ${equation}`,
      ],
    };
  }

  const result = await integrateWithOdex(odeFn, [t0, tEnd], [y0]);

  const sampleCount = 5;
  const interval = Math.max(1, Math.floor(result.t.length / sampleCount));
  const samples: string[] = [];
  for (let i = 0; i < result.t.length; i += interval) {
    const t = result.t[i].toFixed(2);
    const yVal = result.y[i][0].toFixed(4);
    samples.push(`y(${t}) = ${yVal}`);
  }

  const lastT = result.t[result.t.length - 1].toFixed(2);
  const lastY = result.y[result.y.length - 1][0].toFixed(4);

  return {
    output: `y(${lastT}) = ${lastY}`,
    steps: [
      `Given: ${implicitForm ? input : `dy/dx = ${rhs}`}`,
      ...(implicitForm ? [`Rearranged to: dy/dx = ${rhs}`] : []),
      `Initial condition: y(${t0}) = ${y0}`,
      `Numerical solution (RK4) on [${t0}, ${tEnd}]:`,
      ...samples,
    ],
  };
}
