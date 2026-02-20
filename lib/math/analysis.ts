import type { EvalFn } from "./ce-compile";
import { safeEval } from "./safe-eval";

/**
 * Find zeros of a compiled function via sign-change bisection.
 * Simple, dependency-free root finding that works for most continuous functions.
 */
export function findZeros(
  fn: EvalFn,
  xMin: number,
  xMax: number,
  scope: Record<string, number> = {},
  samples = 200,
): number[] {
  const zeros: number[] = [];
  const dx = (xMax - xMin) / samples;

  let prevY = safeEval(fn, { ...scope, x: xMin });

  for (let i = 1; i <= samples; i++) {
    const x = xMin + i * dx;
    const y = safeEval(fn, { ...scope, x });

    if (isNaN(y) || isNaN(prevY)) {
      prevY = y;
      continue;
    }

    if (prevY * y < 0) {
      let lo = x - dx;
      let hi = x;
      for (let j = 0; j < 40; j++) {
        const mid = (lo + hi) / 2;
        const midY = safeEval(fn, { ...scope, x: mid });
        if (isNaN(midY)) break;
        if (midY * safeEval(fn, { ...scope, x: lo }) < 0) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      zeros.push((lo + hi) / 2);
    } else if (Math.abs(y) < 1e-10) {
      zeros.push(x);
    }

    prevY = y;
  }

  return zeros;
}

/**
 * Find local extrema by detecting sign changes in numerical derivative.
 * Returns { minima, maxima } arrays of x-values.
 */
export function findExtrema(
  fn: EvalFn,
  xMin: number,
  xMax: number,
  scope: Record<string, number> = {},
  samples = 200,
): { minima: number[]; maxima: number[] } {
  const minima: number[] = [];
  const maxima: number[] = [];
  const dx = (xMax - xMin) / samples;
  const h = dx * 0.01;

  let prevDeriv = NaN;

  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * dx;
    const yPlus = safeEval(fn, { ...scope, x: x + h });
    const yMinus = safeEval(fn, { ...scope, x: x - h });
    const deriv = (yPlus - yMinus) / (2 * h);

    if (!isNaN(prevDeriv) && !isNaN(deriv) && prevDeriv * deriv < 0) {
      let lo = x - dx;
      let hi = x;
      for (let j = 0; j < 30; j++) {
        const mid = (lo + hi) / 2;
        const midPlus = safeEval(fn, { ...scope, x: mid + h });
        const midMinus = safeEval(fn, { ...scope, x: mid - h });
        const midDeriv = (midPlus - midMinus) / (2 * h);
        const loPlus = safeEval(fn, { ...scope, x: lo + h });
        const loMinus = safeEval(fn, { ...scope, x: lo - h });
        const loDeriv = (loPlus - loMinus) / (2 * h);
        if (midDeriv * loDeriv < 0) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      const xExt = (lo + hi) / 2;
      if (prevDeriv > 0 && deriv < 0) {
        maxima.push(xExt);
      } else {
        minima.push(xExt);
      }
    }

    prevDeriv = deriv;
  }

  return { minima, maxima };
}

/**
 * Find intersection points between two compiled functions.
 * Uses sign-change bisection on f(x) - g(x).
 */
export function findIntersections(
  fnA: EvalFn,
  fnB: EvalFn,
  xMin: number,
  xMax: number,
  scope: Record<string, number> = {},
  samples = 200,
  limit = 20,
): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const dx = (xMax - xMin) / samples;

  function diff(x: number) {
    return (
      safeEval(fnA, { ...scope, x }) -
      safeEval(fnB, { ...scope, x })
    );
  }

  let prevD = diff(xMin);

  for (let i = 1; i <= samples && points.length < limit; i++) {
    const x = xMin + i * dx;
    const d = diff(x);

    if (isNaN(d) || isNaN(prevD)) {
      prevD = d;
      continue;
    }

    if (prevD * d < 0) {
      let lo = x - dx;
      let hi = x;
      for (let j = 0; j < 40; j++) {
        const mid = (lo + hi) / 2;
        const midD = diff(mid);
        if (isNaN(midD)) break;
        if (midD * diff(lo) < 0) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      const xInt = (lo + hi) / 2;
      const yInt = safeEval(fnA, { ...scope, x: xInt });
      if (!isNaN(yInt)) {
        points.push([xInt, yInt]);
      }
    }

    prevD = d;
  }

  return points;
}

/**
 * Compile an expression string safely, returning null on failure.
 */
export { safeCompile } from "./ce-compile";
