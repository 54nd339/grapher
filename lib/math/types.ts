export interface PlotPoint {
  x: number;
  y: number;
}

export interface ODEInitialCondition {
  t0: number;
  y0: number | number[];
  tEnd: number;
}

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
