import type { Data } from "plotly.js-dist-min";
import { mathEngine } from "@/lib/mathEngine";

const EXPLICIT_SAMPLES = 600;
const PARAMETRIC_SAMPLES = 360;
const POLAR_SAMPLES = 360;
const IMPLICIT_RESOLUTION = 96;

export type ExplicitTraceOptions = {
  expression: string;
  color: string;
  name: string;
  xMin: number;
  xMax: number;
};

export type ImplicitTraceOptions = {
  expression: string;
  color: string;
  name: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type ParametricTraceOptions = {
  expression: string;
  color: string;
  name: string;
};

export type PolarTraceOptions = {
  expression: string;
  color: string;
  name: string;
};

export const buildExplicitTrace = ({
  expression,
  color,
  name,
  xMin,
  xMax,
}: ExplicitTraceOptions): Data => {
  const step = (xMax - xMin) / EXPLICIT_SAMPLES;
  const x: number[] = [];
  const y: (number | null)[] = [];

  for (let i = 0; i <= EXPLICIT_SAMPLES; i++) {
    const xv = xMin + i * step;
    try {
      const result = mathEngine.evaluate(expression, { x: xv });
      x.push(xv);
      y.push(Number.isFinite(result) ? (result as number) : null);
    } catch {
      x.push(xv);
      y.push(null);
    }
  }

  return {
    type: "scatter",
    mode: "lines",
    line: { color, width: 2.5 },
    x,
    y,
    name,
  } satisfies Data;
};

export const buildImplicitTrace = ({
  expression,
  color,
  name,
  xMin,
  xMax,
  yMin,
  yMax,
}: ImplicitTraceOptions): Data | null => {
  const resolution = Math.max(
    32,
    Math.min(
      IMPLICIT_RESOLUTION,
      Math.floor(Math.max(xMax - xMin, yMax - yMin))
    )
  );
  const xs: number[] = [];
  const ys: number[] = [];

  const grid: number[][] = new Array(resolution + 1)
    .fill(0)
    .map(() => new Array(resolution + 1).fill(NaN));

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const xv = xMin + (i / resolution) * (xMax - xMin);
      const yv = yMin + (j / resolution) * (yMax - yMin);
      try {
        const value = mathEngine.evaluate(expression, { x: xv, y: yv });
        grid[i][j] = Number.isFinite(value) ? (value as number) : NaN;
      } catch {
        grid[i][j] = NaN;
      }
    }
  }

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const x0 = xMin + (i / resolution) * (xMax - xMin);
      const y0 = yMin + (j / resolution) * (yMax - yMin);
      const x1 = xMin + ((i + 1) / resolution) * (xMax - xMin);
      const y1 = yMin + ((j + 1) / resolution) * (yMax - yMin);

      const v00 = grid[i][j];
      const v10 = grid[i + 1][j];
      const v01 = grid[i][j + 1];
      const v11 = grid[i + 1][j + 1];

      if ([v00, v10, v01, v11].some((v) => Number.isNaN(v))) continue;

      const crossesZero = (a: number, b: number) => a * b <= 0 && a !== b;

      if (crossesZero(v00, v10)) {
        const t = Math.abs(v00) / (Math.abs(v00) + Math.abs(v10));
        xs.push(x0 + t * (x1 - x0));
        ys.push(y0);
      }
      if (crossesZero(v01, v11)) {
        const t = Math.abs(v01) / (Math.abs(v01) + Math.abs(v11));
        xs.push(x0 + t * (x1 - x0));
        ys.push(y1);
      }
      if (crossesZero(v00, v01)) {
        const t = Math.abs(v00) / (Math.abs(v00) + Math.abs(v01));
        xs.push(x0);
        ys.push(y0 + t * (y1 - y0));
      }
      if (crossesZero(v10, v11)) {
        const t = Math.abs(v10) / (Math.abs(v10) + Math.abs(v11));
        xs.push(x1);
        ys.push(y0 + t * (y1 - y0));
      }
    }
  }

  if (xs.length === 0) return null;
  const maxPoints = 2000;
  const stride = xs.length > maxPoints ? Math.ceil(xs.length / maxPoints) : 1;

  return {
    type: "scattergl",
    mode: "markers",
    marker: { color, size: 4, opacity: 0.85 },
    x: xs.filter((_, idx) => idx % stride === 0),
    y: ys.filter((_, idx) => idx % stride === 0),
    name,
  } satisfies Data;
};

export const buildParametricTrace = ({
  expression,
  color,
  name,
}: ParametricTraceOptions): Data | null => {
  const parts = expression.split(",");
  let xExpr = "";
  let yExpr = "";

  for (const part of parts) {
    const [lhs, rhs] = part.split("=").map((section) => section.trim());
    if (!lhs || !rhs) continue;
    if (lhs.toLowerCase().startsWith("x")) xExpr = rhs;
    if (lhs.toLowerCase().startsWith("y")) yExpr = rhs;
  }

  if (!xExpr || !yExpr) return null;

  const tMin = -2 * Math.PI;
  const tMax = 2 * Math.PI;
  const step = (tMax - tMin) / PARAMETRIC_SAMPLES;
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i <= PARAMETRIC_SAMPLES; i++) {
    const t = tMin + i * step;
    try {
      const xv = mathEngine.evaluate(xExpr, { t });
      const yv = mathEngine.evaluate(yExpr, { t });
      if (Number.isFinite(xv) && Number.isFinite(yv)) {
        x.push(xv as number);
        y.push(yv as number);
      } else {
        x.push(NaN);
        y.push(NaN);
      }
    } catch {
      x.push(NaN);
      y.push(NaN);
    }
  }

  return {
    type: "scatter",
    mode: "lines",
    line: { color, width: 2 },
    x,
    y,
    name,
  } satisfies Data;
};

export const buildPolarTrace = ({
  expression,
  color,
  name,
}: PolarTraceOptions): Data | null => {
  const [, rExprRaw] = expression.split("=");
  const rExpr = (rExprRaw || "").trim();
  if (!rExpr) return null;

  const thetaMin = 0;
  const thetaMax = 2 * Math.PI;
  const step = (thetaMax - thetaMin) / POLAR_SAMPLES;
  const x: number[] = [];
  const y: number[] = [];

  for (let i = 0; i <= POLAR_SAMPLES; i++) {
    const theta = thetaMin + i * step;
    try {
      const r = mathEngine.evaluate(rExpr, { theta });
      if (Number.isFinite(r)) {
        const radius = r as number;
        x.push(radius * Math.cos(theta));
        y.push(radius * Math.sin(theta));
      } else {
        x.push(NaN);
        y.push(NaN);
      }
    } catch {
      x.push(NaN);
      y.push(NaN);
    }
  }

  return {
    type: "scatter",
    mode: "lines",
    line: { color, width: 2 },
    x,
    y,
    name,
  } satisfies Data;
};
