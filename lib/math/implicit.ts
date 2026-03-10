import * as rx from "@/lib/math/regex";
import type { PathRing } from "@/workers/math.worker";
import { getMathWorker } from "@/workers/math-api";

export type ImplicitParametricForm =
  | { kind: "line-x"; x: number }
  | { kind: "line-y"; y: number }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; a: number; b: number }
  | { kind: "hyperbola-x"; cx: number; cy: number; a: number; b: number }
  | { kind: "hyperbola-y"; cx: number; cy: number; a: number; b: number }
  | { kind: "parabola-x2"; h: number; k: number; c: number }
  | { kind: "parabola-y2"; h: number; k: number; c: number };

const cache = new Map<string, PathRing[]>();
const MAX_CACHE_ENTRIES = 16;

/**
 * Marching-squares algorithm for implicit curves F(x,y) = 0.
 * Returns line segments that approximate the zero-level contour.
 *
 * Grid evaluation happens on the main thread (requires ceCompile),
 * then the grid is sent to a web worker where the `marching-squares`
 * library extracts the contour lines.
 *
 * When `precompiledFn` is provided, it is used directly instead of
 * compiling `expr` through ceCompile.
 */
export async function marchingSquares(
  expr: string,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  gridSize = 100,
): Promise<PathRing[]> {
  const key = `${expr}|${xMin}|${xMax}|${yMin}|${yMax}|${gridSize}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const worker = getMathWorker();
    const segments = await worker.marchingSquares(
      expr,
      {},
      xMin,
      xMax,
      yMin,
      yMax,
      gridSize
    );

    if (cache.size >= MAX_CACHE_ENTRIES) {
      const first = cache.keys().next().value!;
      cache.delete(first);
    }
    cache.set(key, segments);
    return segments;
  } catch {
    return [];
  }
}

function parseNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseSigned(value: string): number | null {
  if (!rx.REGEX_IMPLICIT_SIGNED_NUM.test(value)) return null;
  return parseNumber(value);
}

function parseCircleCenterOffset(offset: string): number | null {
  const signed = parseSigned(offset);
  if (signed === null) return null;
  return -signed;
}

function parseRadiusSquared(value: string): number | null {
  const n = parseNumber(value);
  if (n === null || n <= 0) return null;
  return n;
}

export function tryParametrizeImplicit(expr: string): ImplicitParametricForm | null {
  // Normalize: remove spacing and explicit multiplication signs
  const normalized = expr.replace(/\s+/g, "").replace(/\*/g, "");

  const xEq = normalized.match(rx.REGEX_IMPLICIT_X_EQ_1) ?? normalized.match(rx.REGEX_IMPLICIT_X_EQ_2);
  if (xEq?.[1]) {
    const x = parseNumber(xEq[1]);
    if (x !== null) return { kind: "line-x", x };
  }

  const yEq = normalized.match(rx.REGEX_IMPLICIT_Y_EQ_1) ?? normalized.match(rx.REGEX_IMPLICIT_Y_EQ_2);
  if (yEq?.[1]) {
    const y = parseNumber(yEq[1]);
    if (y !== null) return { kind: "line-y", y };
  }

  const compact = normalized;

  const simpleCircle = compact.match(rx.REGEX_IMPLICIT_SIMPLE_CIRCLE_1)
    ?? compact.match(rx.REGEX_IMPLICIT_SIMPLE_CIRCLE_2)
    ?? compact.match(rx.REGEX_IMPLICIT_SIMPLE_CIRCLE_3);
  if (simpleCircle?.[1]) {
    const rhs = parseRadiusSquared(simpleCircle[1]);
    if (rhs !== null) {
      return { kind: "circle", cx: 0, cy: 0, r: Math.sqrt(rhs) };
    }
  }

  const shiftedCircle = compact.match(rx.REGEX_IMPLICIT_SHIFTED_CIRCLE_1)
    ?? compact.match(rx.REGEX_IMPLICIT_SHIFTED_CIRCLE_2);
  if (shiftedCircle) {
    const lhsFirst = shiftedCircle[1]?.startsWith("+") || shiftedCircle[1]?.startsWith("-");
    const xOffset = lhsFirst ? shiftedCircle[1] : shiftedCircle[2];
    const yOffset = lhsFirst ? shiftedCircle[2] : shiftedCircle[3];
    const radiusSq = lhsFirst ? shiftedCircle[3] : shiftedCircle[1];

    const cx = parseCircleCenterOffset(xOffset);
    const cy = parseCircleCenterOffset(yOffset);
    const rhs = parseRadiusSquared(radiusSq);

    if (cx !== null && cy !== null && rhs !== null) {
      return { kind: "circle", cx, cy, r: Math.sqrt(rhs) };
    }
  }

  const ellipseShifted = compact.match(rx.REGEX_IMPLICIT_ELLIPSE_SHIFTED);
  if (ellipseShifted) {
    const cx = parseCircleCenterOffset(ellipseShifted[1]);
    const cy = parseCircleCenterOffset(ellipseShifted[3]);
    const a2 = parseRadiusSquared(ellipseShifted[2]);
    const b2 = parseRadiusSquared(ellipseShifted[4]);
    if (cx !== null && cy !== null && a2 !== null && b2 !== null) {
      return { kind: "ellipse", cx, cy, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const ellipseOrigin = compact.match(rx.REGEX_IMPLICIT_ELLIPSE_ORIGIN_1)
    ?? compact.match(rx.REGEX_IMPLICIT_ELLIPSE_ORIGIN_2);
  if (ellipseOrigin) {
    const a2 = parseRadiusSquared(ellipseOrigin[1]);
    const b2 = parseRadiusSquared(ellipseOrigin[2]);
    if (a2 !== null && b2 !== null) {
      return { kind: "ellipse", cx: 0, cy: 0, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const hyperbolaXShifted = compact.match(rx.REGEX_IMPLICIT_HYPERBOLA_X_SHIFTED);
  if (hyperbolaXShifted) {
    const cx = parseCircleCenterOffset(hyperbolaXShifted[1]);
    const cy = parseCircleCenterOffset(hyperbolaXShifted[3]);
    const a2 = parseRadiusSquared(hyperbolaXShifted[2]);
    const b2 = parseRadiusSquared(hyperbolaXShifted[4]);
    if (cx !== null && cy !== null && a2 !== null && b2 !== null) {
      return { kind: "hyperbola-x", cx, cy, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const hyperbolaYShifted = compact.match(rx.REGEX_IMPLICIT_HYPERBOLA_Y_SHIFTED);
  if (hyperbolaYShifted) {
    const cy = parseCircleCenterOffset(hyperbolaYShifted[1]);
    const cx = parseCircleCenterOffset(hyperbolaYShifted[3]);
    const a2 = parseRadiusSquared(hyperbolaYShifted[2]);
    const b2 = parseRadiusSquared(hyperbolaYShifted[4]);
    if (cx !== null && cy !== null && a2 !== null && b2 !== null) {
      return { kind: "hyperbola-y", cx, cy, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const hyperbolaXOrigin = compact.match(rx.REGEX_IMPLICIT_HYPERBOLA_X_ORIGIN_1)
    ?? compact.match(rx.REGEX_IMPLICIT_HYPERBOLA_X_ORIGIN_2);
  if (hyperbolaXOrigin) {
    const a2 = parseRadiusSquared(hyperbolaXOrigin[1]);
    const b2 = parseRadiusSquared(hyperbolaXOrigin[2]);
    if (a2 !== null && b2 !== null) {
      return { kind: "hyperbola-x", cx: 0, cy: 0, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const hyperbolaYOrigin = compact.match(rx.REGEX_IMPLICIT_HYPERBOLA_Y_ORIGIN_1)
    ?? compact.match(rx.REGEX_IMPLICIT_HYPERBOLA_Y_ORIGIN_2);
  if (hyperbolaYOrigin) {
    const a2 = parseRadiusSquared(hyperbolaYOrigin[1]);
    const b2 = parseRadiusSquared(hyperbolaYOrigin[2]);
    if (a2 !== null && b2 !== null) {
      return { kind: "hyperbola-y", cx: 0, cy: 0, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const parabolaX2Shifted = compact.match(rx.REGEX_IMPLICIT_PARABOLA_X2_SHIFTED);
  if (parabolaX2Shifted) {
    const h = parseCircleCenterOffset(parabolaX2Shifted[1]);
    const k = parseCircleCenterOffset(parabolaX2Shifted[3]);
    const c = parseNumber(parabolaX2Shifted[2]);
    if (h !== null && k !== null && c !== null && Math.abs(c) > 1e-12) {
      return { kind: "parabola-x2", h, k, c };
    }
  }

  const parabolaY2Shifted = compact.match(rx.REGEX_IMPLICIT_PARABOLA_Y2_SHIFTED);
  if (parabolaY2Shifted) {
    const k = parseCircleCenterOffset(parabolaY2Shifted[1]);
    const h = parseCircleCenterOffset(parabolaY2Shifted[3]);
    const c = parseNumber(parabolaY2Shifted[2]);
    if (h !== null && k !== null && c !== null && Math.abs(c) > 1e-12) {
      return { kind: "parabola-y2", h, k, c };
    }
  }

  const parabolaX2Origin = compact.match(rx.REGEX_IMPLICIT_PARABOLA_X2_ORIGIN_1)
    ?? compact.match(rx.REGEX_IMPLICIT_PARABOLA_X2_ORIGIN_2);
  if (parabolaX2Origin) {
    const c = parseNumber(parabolaX2Origin[1]);
    if (c !== null && Math.abs(c) > 1e-12) {
      const pC = compact.startsWith("y=") ? 1 / c : c;
      return { kind: "parabola-x2", h: 0, k: 0, c: pC };
    }
  }

  const parabolaY2Origin = compact.match(rx.REGEX_IMPLICIT_PARABOLA_Y2_ORIGIN_1)
    ?? compact.match(rx.REGEX_IMPLICIT_PARABOLA_Y2_ORIGIN_2);
  if (parabolaY2Origin) {
    const c = parseNumber(parabolaY2Origin[1]);
    if (c !== null && Math.abs(c) > 1e-12) {
      const pC = compact.startsWith("x=") ? 1 / c : c;
      return { kind: "parabola-y2", h: 0, k: 0, c: pC };
    }
  }

  return null;
}
