/**
 * Math Web Worker — runs heavy numerical computation off the main thread.
 *
 * We compile the expressions inside the worker using `ceCompileFromLatex`
 * / `ceCompile` which allows us to run O(n^2) and O(n^3) evaluation loops
 * here instead of dragging down the main thread.
 */

import * as Comlink from "comlink";
import { isoLines } from "marching-squares";

import { ceCompile, ceCompileFromLatex, ceCompileImplicitFromLatex } from "@/lib/math/ce-compile";
import { safeEval } from "@/lib/math/safe-eval";
import { rk4, integrateWithOdex } from "@/lib/math/ode";
import { secondOrderToSystem, rearrangeImplicitODE } from "@/lib/math/ode-rearrange";
import { IMPLICIT_VIEW_MIN, IMPLICIT_VIEW_MAX, IMPLICIT_TIME_BUDGET_MS } from "@/lib/constants";
import type { PlotPoint } from "@/lib/math/types";

/* ── types (mirrored from lib/math/types.ts) ────────── */

export type PathRing = [number, number][];

/* ── API exposed to the main thread ─────────────────── */

const api = {
  /* ── Marching Squares ─────────────────────────────── */

  /**
   * Evaluate a 2D scalar field and run marching-squares to extract zero-level contours.
   */
  marchingSquares(
    latex: string,
    scope: Record<string, number>,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    gridSize = 100
  ): PathRing[] {
    const fn = ceCompileImplicitFromLatex(latex);
    if (!fn) return [];

    const dx = (xMax - xMin) / gridSize;
    const dy = (yMax - yMin) / gridSize;

    // Evaluate the scalar field
    const grid: number[][] = [];
    for (let j = 0; j <= gridSize; j++) {
      const row: number[] = [];
      const y = yMin + j * dy;
      scope.y = y;
      for (let i = 0; i <= gridSize; i++) {
        scope.x = xMin + i * dx;
        const v = fn(scope);
        row.push(typeof v === "number" && isFinite(v) ? v : 1);
      }
      grid.push(row);
    }

    const rings = isoLines(grid, [0])?.[0] ?? [];
    const paths: PathRing[] = [];

    for (const ring of rings) {
      if (!Array.isArray(ring) || ring.length < 2) continue;
      // map the grid coordinates exact output to viewport projection coordinates
      const path: PathRing = ring.map(([c, r]) => [
        xMin + c * dx,
        yMin + r * dy
      ]);
      paths.push(path);
    }
    return paths;
  },

  /* ── Analysis helpers ─────────────────────────────── */

  findZeros(
    exprOrLatex: string,
    isLatex: boolean,
    xMin: number,
    xMax: number,
    scope: Record<string, number>,
    samples = 200,
  ): number[] {
    const fn = isLatex ? ceCompileFromLatex(exprOrLatex) : ceCompile(exprOrLatex);
    if (!fn) return [];

    const dx = (xMax - xMin) / samples;
    const zeros: number[] = [];
    let prevY = safeEval(fn, { ...scope, x: xMin });

    for (let i = 1; i <= samples; i++) {
      const x = xMin + i * dx;
      const y = safeEval(fn, { ...scope, x });
      if (isNaN(y) || isNaN(prevY)) {
        prevY = y;
        continue;
      }

      if (prevY * y < 0) {
        const t = prevY / (prevY - y);
        zeros.push((xMin + (i - 1) * dx) + t * dx);
      } else if (Math.abs(y) < 1e-10) {
        zeros.push(x);
      }
      prevY = y;
    }
    return zeros;
  },

  findExtrema(
    exprOrLatex: string,
    isLatex: boolean,
    xMin: number,
    xMax: number,
    scope: Record<string, number>,
    samples = 200,
  ): { minima: number[]; maxima: number[] } {
    const fn = isLatex ? ceCompileFromLatex(exprOrLatex) : ceCompile(exprOrLatex);
    const minima: number[] = [];
    const maxima: number[] = [];
    if (!fn) return { minima, maxima };

    const dx = (xMax - xMin) / samples;
    let prevDeriv = NaN;
    let y0 = safeEval(fn, { ...scope, x: xMin });
    let y1 = safeEval(fn, { ...scope, x: xMin + dx });

    for (let i = 1; i < samples; i++) {
      const x2 = xMin + (i + 1) * dx;
      const y2 = safeEval(fn, { ...scope, x: x2 });

      const deriv = (y2 - y0) / (2 * dx);

      if (!isNaN(prevDeriv) && !isNaN(deriv) && prevDeriv * deriv < 0) {
        const t = prevDeriv / (prevDeriv - deriv);
        const xExt = (xMin + (i - 1) * dx) + t * dx;
        if (prevDeriv > 0 && deriv < 0) maxima.push(xExt);
        else minima.push(xExt);
      }

      prevDeriv = deriv;
      y0 = y1;
      y1 = y2;
    }

    return { minima, maxima };
  },

  findIntersections(
    latexA: string,
    latexB: string,
    xMin: number,
    xMax: number,
    scope: Record<string, number>,
    samples = 200,
    limit = 20,
  ): Array<[number, number]> {
    const fnA = ceCompileFromLatex(latexA);
    const fnB = ceCompileFromLatex(latexB);
    if (!fnA || !fnB) return [];

    const dx = (xMax - xMin) / samples;
    const points: Array<[number, number]> = [];
    let prevY_A = safeEval(fnA, { ...scope, x: xMin });
    let prevY_B = safeEval(fnB, { ...scope, x: xMin });

    for (let i = 1; i <= samples && points.length < limit; i++) {
      const x = xMin + i * dx;
      const yA = safeEval(fnA, { ...scope, x });
      const yB = safeEval(fnB, { ...scope, x });

      const d0 = prevY_A - prevY_B;
      const d1 = yA - yB;

      if (!isNaN(d0) && !isNaN(d1) && d0 * d1 < 0) {
        const t = d0 / (d0 - d1);
        const interX = (xMin + (i - 1) * dx) + t * dx;
        const interY = prevY_A + t * (yA - prevY_A);
        if (!isNaN(interY)) points.push([interX, interY]);
      }

      prevY_A = yA;
      prevY_B = yB;
    }

    return points;
  },

  /* ── Numerical integration ────────────────────────── */

  simpsonIntegrate(
    exprStr: string,
    isLatex: boolean,
    integVar: string,
    a: number,
    b: number,
    scope: Record<string, number>,
    n = 1000,
  ): number {
    if (a === b) return 0;
    const fn = isLatex ? ceCompileFromLatex(exprStr) : ceCompile(exprStr);
    if (!fn) return NaN;

    const h = (b - a) / n;
    let sum = 0;
    for (let i = 0; i <= n; i++) {
      const tVal = a + i * h;
      const y = safeEval(fn, { ...scope, [integVar]: tVal });
      const yNum = isNaN(y) ? 0 : y;
      if (i === 0 || i === n) sum += yNum;
      else if (i % 2 === 1) sum += 4 * yNum;
      else sum += 2 * yNum;
    }
    return (h / 3) * sum;
  },

  computeArcLength(
    exprStr: string,
    isLatex: boolean,
    a: number,
    b: number,
    scope: Record<string, number>,
    n = 200,
  ): number {
    if (!isFinite(a) || !isFinite(b) || a >= b) return 0;
    const fn = isLatex ? ceCompileFromLatex(exprStr) : ceCompile(exprStr);
    if (!fn) return 0;

    const h = (b - a) / n;
    const H = 1e-6;

    let sum = 0;
    for (let i = 0; i <= n; i++) {
      const x = a + i * h;
      const yp = safeEval(fn, { ...scope, x: x + H });
      const ym = safeEval(fn, { ...scope, x: x - H });
      const deriv = (yp - ym) / (2 * H);
      const integrand = Math.sqrt(1 + deriv * deriv);

      if (i === 0 || i === n) sum += integrand;
      else if (i % 2 === 1) sum += 4 * integrand;
      else sum += 2 * integrand;
    }
    return (h / 3) * sum;
  },

  /* ── 3-D implicit field sampling ──────────────────── */

  sampleImplicitField(
    latex: string,
    scope: Record<string, number>,
    resolution: number,
  ): { field: Float32Array; timedOut: boolean } | null {
    const fn = ceCompileImplicitFromLatex(latex);
    if (!fn) return null;

    const N = resolution;
    const step = (IMPLICIT_VIEW_MAX - IMPLICIT_VIEW_MIN) / (N - 1);
    const field = new Float32Array(N * N * N);
    const evalScope = { ...scope, x: 0, y: 0, z: 0 };
    const startedAt = performance.now();

    // Three.js natively places its vertical axis as Y and depth as Z. 
    // Standard mathematical expressions use Z as the vertical component.
    // So we evaluate `Math.z` against `iy` and `Math.y` against `iz`.
    for (let iz = 0; iz < N; iz++) {
      evalScope.y = IMPLICIT_VIEW_MIN + iz * step;
      for (let iy = 0; iy < N; iy++) {
        evalScope.z = IMPLICIT_VIEW_MIN + iy * step;
        for (let ix = 0; ix < N; ix++) {
          evalScope.x = IMPLICIT_VIEW_MIN + ix * step;
          const raw = fn(evalScope);
          const i = ix + iy * N + iz * N * N;
          field[i] = typeof raw === "number" && isFinite(raw) ? raw : Number.NaN;
        }
      }
      if (performance.now() - startedAt > IMPLICIT_TIME_BUDGET_MS) {
        return { field, timedOut: true };
      }
    }

    return { field, timedOut: false };
  },

  /* ── ODE RK4 / Odex Solving ───────────────────────── */

  async solveODEPlot(
    expr: string,
    isLatex: boolean,
    tSpan: [number, number],
    y0: number[],
    scope: Record<string, number>,
    steps = 400,
    useOdex = false
  ): Promise<PlotPoint[]> {
    const fn = isLatex ? ceCompileFromLatex(expr) : ceCompile(expr);
    if (!fn) return [];

    const odeFn = (_t: number, yArr: number[]): number[] => {
      const val = safeEval(fn, { ...scope, x: _t, y: yArr[0] });
      return [isNaN(val) ? 0 : val];
    };

    let result: { t: number[]; y: number[][] };
    if (useOdex) {
      result = await integrateWithOdex(odeFn, tSpan, y0, steps);
    } else {
      result = rk4(odeFn, tSpan, y0, steps);
    }

    const points: PlotPoint[] = [];
    for (let i = 0; i < result.t.length; i++) {
      const yVal = result.y[i][0];
      if (!isFinite(yVal) || Math.abs(yVal) > 1e6) {
        if (useOdex) continue; else break;
      }
      points.push({ x: result.t[i], y: yVal });
    }
    return points;
  },

  computeSlopeFieldSolution(
    expr: string,
    type: "first-order" | "second-order" | "implicit",
    isLatex: boolean,
    xMin: number,
    xMax: number,
    scope: Record<string, number>,
  ): [number, number][] {
    let odeFn: (t: number, state: number[]) => number[];
    let y0: number[];

    if (type === "second-order") {
      const sysFn = secondOrderToSystem(expr);
      if (!sysFn) return [];
      odeFn = sysFn;
      y0 = [1, 0];
    } else if (type === "implicit") {
      const result = rearrangeImplicitODE(expr);
      if (!result) return [];
      const fn = result.rhsFn;
      odeFn = (_t: number, yArr: number[]) => {
        const val = safeEval(fn, { ...scope, x: _t, y: yArr[0] });
        return [isNaN(val) ? 0 : val];
      };
      y0 = [1];
    } else {
      const fn = isLatex ? ceCompileFromLatex(expr) : ceCompile(expr);
      if (!fn) return [];
      odeFn = (_t: number, yArr: number[]) => {
        const val = safeEval(fn, { ...scope, x: _t, y: yArr[0] });
        return [isNaN(val) ? 0 : val];
      };
      y0 = [1];
    }

    const fwd = rk4(odeFn, [0, xMax + 2], y0, 400);
    const bwd = rk4(odeFn, [0, xMin - 2], y0, 400);

    const pts: [number, number][] = [];
    for (let i = bwd.t.length - 1; i > 0; i--) {
      const y = bwd.y[i][0];
      if (!isFinite(y) || Math.abs(y) > 1e6) continue;
      pts.push([bwd.t[i], y]);
    }
    for (let i = 0; i < fwd.t.length; i++) {
      const y = fwd.y[i][0];
      if (!isFinite(y) || Math.abs(y) > 1e6) break;
      pts.push([fwd.t[i], y]);
    }
    return pts;
  },

  solveSystemODEPlot(
    dxExpr: string,
    dyExpr: string,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    stepX: number,
    stepY: number
  ): [number, number][][] {
    const fx = ceCompile(dxExpr);
    const fy = ceCompile(dyExpr);
    if (!fx || !fy) return [];

    const systemFn = (_t: number, state: number[]): number[] => {
      const [x, y] = state;
      const dxVal = safeEval(fx, { x, y });
      const dyVal = safeEval(fy, { x, y });
      return [
        isNaN(dxVal) ? 0 : dxVal,
        isNaN(dyVal) ? 0 : dyVal,
      ];
    };

    const result: [number, number][][] = [];

    for (let sx = xMin; sx <= xMax; sx += stepX) {
      for (let sy = yMin; sy <= yMax; sy += stepY) {
        const sol = rk4(systemFn, [0, 10], [sx, sy], 200);
        const pts: [number, number][] = [];
        for (let i = 0; i < sol.t.length; i++) {
          const [x, y] = sol.y[i];
          if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 1e4 || Math.abs(y) > 1e4) break;
          pts.push([x, y]);
        }
        if (pts.length > 2) result.push(pts);
      }
    }

    return result;
  }
};

export type MathWorkerAPI = typeof api;

Comlink.expose(api);
