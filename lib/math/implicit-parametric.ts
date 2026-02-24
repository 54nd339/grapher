export type ImplicitParametricForm =
  | { kind: "line-x"; x: number }
  | { kind: "line-y"; y: number }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; a: number; b: number }
  | { kind: "hyperbola-x"; cx: number; cy: number; a: number; b: number }
  | { kind: "hyperbola-y"; cx: number; cy: number; a: number; b: number }
  | { kind: "parabola-x2"; h: number; k: number; c: number }
  | { kind: "parabola-y2"; h: number; k: number; c: number };

function parseNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseSigned(value: string): number | null {
  if (!/^[+-]\d*\.?\d+$/.test(value)) return null;
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

const POW2 = String.raw`\^\(?2\)?`;

export function tryParametrizeImplicit(expr: string): ImplicitParametricForm | null {
  // Normalize: remove spacing and explicit multiplication signs
  const normalized = expr.replace(/\s+/g, "").replace(/\*/g, "");

  const xEq = normalized.match(/^x=([+-]?\d*\.?\d+)$/) ?? normalized.match(/^([+-]?\d*\.?\d+)=x$/);
  if (xEq?.[1]) {
    const x = parseNumber(xEq[1]);
    if (x !== null) return { kind: "line-x", x };
  }

  const yEq = normalized.match(/^y=([+-]?\d*\.?\d+)$/) ?? normalized.match(/^([+-]?\d*\.?\d+)=y$/);
  if (yEq?.[1]) {
    const y = parseNumber(yEq[1]);
    if (y !== null) return { kind: "line-y", y };
  }

  // Helper for R^2 which could be a number or just a digit
  const POW2 = String.raw`(?:\^\(?2\)?|\*\*2)`;
  const compact = normalized;

  const simpleCircle = compact.match(/^x\^\(?2\)?\+y\^\(?2\)?=([+-]?\d*\.?\d+)$/)
    ?? compact.match(/^([+-]?\d*\.?\d+)=x\^\(?2\)?\+y\^\(?2\)?$/)
    ?? compact.match(/^x\^\(?2\)?\+y\^\(?2\)?-([+-]?\d*\.?\d+)=0$/);
  if (simpleCircle?.[1]) {
    const rhs = parseRadiusSquared(simpleCircle[1]);
    if (rhs !== null) {
      return { kind: "circle", cx: 0, cy: 0, r: Math.sqrt(rhs) };
    }
  }

  const shiftedCircle = compact.match(/^\(x([+-]\d*\.?\d+)\)\^\(?2\)?\+\(y([+-]\d*\.?\d+)\)\^\(?2\)?=([+-]?\d*\.?\d+)$/)
    ?? compact.match(/^([+-]?\d*\.?\d+)=\(x([+-]\d*\.?\d+)\)\^\(?2\)?\+\(y([+-]\d*\.?\d+)\)\^\(?2\)?$/);
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

  const ellipseShifted = compact.match(new RegExp(
    String.raw`^\(x([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)\+\(y([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)=1$`
  ));
  if (ellipseShifted) {
    const cx = parseCircleCenterOffset(ellipseShifted[1]);
    const cy = parseCircleCenterOffset(ellipseShifted[3]);
    const a2 = parseRadiusSquared(ellipseShifted[2]);
    const b2 = parseRadiusSquared(ellipseShifted[4]);
    if (cx !== null && cy !== null && a2 !== null && b2 !== null) {
      return { kind: "ellipse", cx, cy, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const ellipseOrigin = compact.match(new RegExp(
    String.raw`^x${POW2}\/([+-]?\d*\.?\d+)\+y${POW2}\/([+-]?\d*\.?\d+)=1$`
  )) ?? compact.match(new RegExp(
    String.raw`^x${POW2}\/([+-]?\d*\.?\d+)\+y${POW2}\/([+-]?\d*\.?\d+)-1=0$`
  ));
  if (ellipseOrigin) {
    const a2 = parseRadiusSquared(ellipseOrigin[1]);
    const b2 = parseRadiusSquared(ellipseOrigin[2]);
    if (a2 !== null && b2 !== null) {
      return { kind: "ellipse", cx: 0, cy: 0, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const hyperbolaXShifted = compact.match(new RegExp(
    String.raw`^\(x([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)-\(y([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)=1$`
  ));
  if (hyperbolaXShifted) {
    const cx = parseCircleCenterOffset(hyperbolaXShifted[1]);
    const cy = parseCircleCenterOffset(hyperbolaXShifted[3]);
    const a2 = parseRadiusSquared(hyperbolaXShifted[2]);
    const b2 = parseRadiusSquared(hyperbolaXShifted[4]);
    if (cx !== null && cy !== null && a2 !== null && b2 !== null) {
      return { kind: "hyperbola-x", cx, cy, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const hyperbolaYShifted = compact.match(new RegExp(
    String.raw`^\(y([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)-\(x([+-]\d*\.?\d+)\)${POW2}\/([+-]?\d*\.?\d+)=1$`
  ));
  if (hyperbolaYShifted) {
    const cy = parseCircleCenterOffset(hyperbolaYShifted[1]);
    const cx = parseCircleCenterOffset(hyperbolaYShifted[3]);
    const a2 = parseRadiusSquared(hyperbolaYShifted[2]);
    const b2 = parseRadiusSquared(hyperbolaYShifted[4]);
    if (cx !== null && cy !== null && a2 !== null && b2 !== null) {
      return { kind: "hyperbola-y", cx, cy, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const hyperbolaXOrigin = compact.match(new RegExp(
    String.raw`^x${POW2}\/([+-]?\d*\.?\d+)-y${POW2}\/([+-]?\d*\.?\d+)=1$`
  )) ?? compact.match(new RegExp(
    String.raw`^x${POW2}\/([+-]?\d*\.?\d+)-y${POW2}\/([+-]?\d*\.?\d+)-1=0$`
  ));
  if (hyperbolaXOrigin) {
    const a2 = parseRadiusSquared(hyperbolaXOrigin[1]);
    const b2 = parseRadiusSquared(hyperbolaXOrigin[2]);
    if (a2 !== null && b2 !== null) {
      return { kind: "hyperbola-x", cx: 0, cy: 0, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const hyperbolaYOrigin = compact.match(new RegExp(
    String.raw`^y${POW2}\/([+-]?\d*\.?\d+)-x${POW2}\/([+-]?\d*\.?\d+)=1$`
  )) ?? compact.match(new RegExp(
    String.raw`^y${POW2}\/([+-]?\d*\.?\d+)-x${POW2}\/([+-]?\d*\.?\d+)-1=0$`
  ));
  if (hyperbolaYOrigin) {
    const a2 = parseRadiusSquared(hyperbolaYOrigin[1]);
    const b2 = parseRadiusSquared(hyperbolaYOrigin[2]);
    if (a2 !== null && b2 !== null) {
      return { kind: "hyperbola-y", cx: 0, cy: 0, a: Math.sqrt(a2), b: Math.sqrt(b2) };
    }
  }

  const parabolaX2Shifted = compact.match(new RegExp(
    String.raw`^\(x([+-]\d*\.?\d+)\)${POW2}=([+-]?\d*\.?\d+)\(y([+-]\d*\.?\d+)\)$`
  ));
  if (parabolaX2Shifted) {
    const h = parseCircleCenterOffset(parabolaX2Shifted[1]);
    const k = parseCircleCenterOffset(parabolaX2Shifted[3]);
    const c = parseNumber(parabolaX2Shifted[2]);
    if (h !== null && k !== null && c !== null && Math.abs(c) > 1e-12) {
      return { kind: "parabola-x2", h, k, c };
    }
  }

  const parabolaY2Shifted = compact.match(new RegExp(
    String.raw`^\(y([+-]\d*\.?\d+)\)${POW2}=([+-]?\d*\.?\d+)\(x([+-]\d*\.?\d+)\)$`
  ));
  if (parabolaY2Shifted) {
    const k = parseCircleCenterOffset(parabolaY2Shifted[1]);
    const h = parseCircleCenterOffset(parabolaY2Shifted[3]);
    const c = parseNumber(parabolaY2Shifted[2]);
    if (h !== null && k !== null && c !== null && Math.abs(c) > 1e-12) {
      return { kind: "parabola-y2", h, k, c };
    }
  }

  const parabolaX2Origin = compact.match(new RegExp(
    String.raw`^x${POW2}=([+-]?\d*\.?\d+)y$`
  )) ?? compact.match(new RegExp(
    String.raw`^y=([+-]?\d*\.?\d+)x${POW2}$`
  ));
  if (parabolaX2Origin) {
    const c = parseNumber(parabolaX2Origin[1]);
    if (c !== null && Math.abs(c) > 1e-12) {
      const pC = compact.startsWith("y=") ? 1 / c : c;
      return { kind: "parabola-x2", h: 0, k: 0, c: pC };
    }
  }

  const parabolaY2Origin = compact.match(new RegExp(
    String.raw`^y${POW2}=([+-]?\d*\.?\d+)x$`
  )) ?? compact.match(new RegExp(
    String.raw`^x=([+-]?\d*\.?\d+)y${POW2}$`
  ));
  if (parabolaY2Origin) {
    const c = parseNumber(parabolaY2Origin[1]);
    if (c !== null && Math.abs(c) > 1e-12) {
      const pC = compact.startsWith("x=") ? 1 / c : c;
      return { kind: "parabola-y2", h: 0, k: 0, c: pC };
    }
  }

  return null;
}