type EvaluateFn = (expression: string, scope?: Record<string, number>) => number;

export const generate2DPoints = (
  evaluateFn: EvaluateFn,
  expression: string,
  xMin: number,
  xMax: number,
  numPoints: number = 1000
): { x: number[]; y: number[] } => {
  const x: number[] = [];
  const y: number[] = [];
  const step = (xMax - xMin) / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const xVal = xMin + i * step;
    try {
      const yVal = evaluateFn(expression, { x: xVal });
      if (isFinite(yVal)) {
        x.push(xVal);
        y.push(yVal);
      }
    } catch {
      // Skip invalid points
    }
  }

  return { x, y };
};

export const generate3DPoints = (
  evaluateFn: EvaluateFn,
  expression: string,
  xRange: [number, number],
  yRange: [number, number],
  resolution: number = 25
): { x: number[][]; y: number[][]; z: number[][] } => {
  const x: number[][] = [];
  const y: number[][] = [];
  const z: number[][] = [];

  const xStep = (xRange[1] - xRange[0]) / resolution;
  const yStep = (yRange[1] - yRange[0]) / resolution;

  for (let i = 0; i <= resolution; i++) {
    const xRow: number[] = [];
    const yRow: number[] = [];
    const zRow: number[] = [];

    for (let j = 0; j <= resolution; j++) {
      const xVal = xRange[0] + i * xStep;
      const yVal = yRange[0] + j * yStep;

      try {
        const zVal = evaluateFn(expression, { x: xVal, y: yVal });
        if (isFinite(zVal)) {
          xRow.push(xVal);
          yRow.push(yVal);
          zRow.push(zVal);
        } else {
          xRow.push(xVal);
          yRow.push(yVal);
          zRow.push(0);
        }
      } catch {
        xRow.push(xVal);
        yRow.push(yVal);
        zRow.push(0);
      }
    }

    x.push(xRow);
    y.push(yRow);
    z.push(zRow);
  }

  return { x, y, z };
};
