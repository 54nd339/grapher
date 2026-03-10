import { linearRegression as ssLinearRegression, linearRegressionLine, rSquared } from "simple-statistics";

export type RegressionType = "linear" | "quadratic" | "exponential";

export interface RegressionResult {
  type: RegressionType;
  coefficients: number[];
  equation: string;
  r2: number;
  evaluate: (x: number) => number;
}

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Least-squares linear regression: y = ax + b */
function linearRegression(pts: [number, number][]): RegressionResult {
  const model = ssLinearRegression(pts);
  const a = model.m;
  const b = model.b;
  const line = linearRegressionLine(model);
  const r2 = rSquared(pts, line);

  return {
    type: "linear",
    coefficients: [a, b],
    equation: `y = ${a.toFixed(4)}x + ${b.toFixed(4)}`,
    r2,
    evaluate: (x) => a * x + b,
  };
}

/** Least-squares quadratic regression: y = ax^2 + bx + c (normal equations) */
function quadraticRegression(pts: [number, number][]): RegressionResult {
  const n = pts.length;
  const s0 = n;
  let s1 = 0, s2 = 0, s3 = 0, s4 = 0;
  let t0 = 0, t1 = 0, t2 = 0;

  for (const [x, y] of pts) {
    s1 += x; s2 += x ** 2; s3 += x ** 3; s4 += x ** 4;
    t0 += y; t1 += x * y; t2 += x ** 2 * y;
  }

  // Solve 3x3 system via Cramer's rule
  const D = s0 * (s2 * s4 - s3 * s3) - s1 * (s1 * s4 - s2 * s3) + s2 * (s1 * s3 - s2 * s2);
  if (Math.abs(D) < 1e-15) return linearRegression(pts) as RegressionResult;

  const c = (t0 * (s2 * s4 - s3 * s3) - s1 * (t1 * s4 - t2 * s3) + s2 * (t1 * s3 - t2 * s2)) / D;
  const b = (s0 * (t1 * s4 - t2 * s3) - t0 * (s1 * s4 - s2 * s3) + s2 * (s1 * t2 - s2 * t1)) / D;
  const a = (s0 * (s2 * t2 - s3 * t1) - s1 * (s1 * t2 - s2 * t1) + t0 * (s1 * s3 - s2 * s2)) / D;

  const my = mean(pts.map(([, y]) => y));
  const ssRes = pts.reduce((s, [x, y]) => s + (y - (a * x ** 2 + b * x + c)) ** 2, 0);
  const ssTot = pts.reduce((s, [, y]) => s + (y - my) ** 2, 0);
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 1;

  return {
    type: "quadratic",
    coefficients: [a, b, c],
    equation: `y = ${a.toFixed(4)}x² + ${b.toFixed(4)}x + ${c.toFixed(4)}`,
    r2,
    evaluate: (x) => a * x ** 2 + b * x + c,
  };
}

/** Exponential regression: y = a*e^(bx) via log-linearization */
function exponentialRegression(pts: [number, number][]): RegressionResult {
  // Filter out non-positive y values (can't take log)
  const valid = pts.filter(([, y]) => y > 0);
  if (valid.length < 2) {
    return { type: "exponential", coefficients: [0, 0], equation: "N/A", r2: 0, evaluate: () => NaN };
  }

  const logPts: [number, number][] = valid.map(([x, y]) => [x, Math.log(y)]);
  const lin = linearRegression(logPts);
  const a = Math.exp(lin.coefficients[1]);
  const b = lin.coefficients[0];

  const my = mean(pts.map(([, y]) => y));
  const ssRes = pts.reduce((s, [x, y]) => s + (y - a * Math.exp(b * x)) ** 2, 0);
  const ssTot = pts.reduce((s, [, y]) => s + (y - my) ** 2, 0);
  const r2 = ssTot !== 0 ? 1 - ssRes / ssTot : 1;

  return {
    type: "exponential",
    coefficients: [a, b],
    equation: `y = ${a.toFixed(4)}e^(${b.toFixed(4)}x)`,
    r2,
    evaluate: (x) => a * Math.exp(b * x),
  };
}

export function computeRegression(
  pts: [number, number][],
  type: RegressionType,
): RegressionResult | null {
  if (pts.length < 2) return null;
  switch (type) {
    case "linear": return linearRegression(pts);
    case "quadratic": return quadraticRegression(pts);
    case "exponential": return exponentialRegression(pts);
  }
}
