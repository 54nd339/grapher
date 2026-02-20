/**
 * Statistical computation utilities for histograms, distributions, and descriptive stats.
 */

import Papa from "papaparse";
import {
  max,
  mean,
  median,
  min,
  quantileSorted,
  standardDeviation,
  variance,
} from "simple-statistics";

export interface DescriptiveStats {
  mean: number;
  median: number;
  stddev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  count: number;
}

export function descriptiveStats(data: number[]): DescriptiveStats {
  if (data.length === 0) {
    return { mean: 0, median: 0, stddev: 0, variance: 0, min: 0, max: 0, q1: 0, q3: 0, count: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);

  return {
    mean: mean(sorted),
    median: median(sorted),
    stddev: standardDeviation(sorted),
    variance: variance(sorted),
    min: min(sorted),
    max: max(sorted),
    q1: quantileSorted(sorted, 0.25),
    q3: quantileSorted(sorted, 0.75),
    count: sorted.length,
  };
}

export interface HistogramBin {
  lo: number;
  hi: number;
  count: number;
}

export function histogram(data: number[], bins = 10): HistogramBin[] {
  if (data.length === 0) return [];
  const lo = min(data);
  const hi = max(data);
  const step = (hi - lo || 1) / bins;
  const buckets = Array.from({ length: bins }, (_, index) => ({
    lo: lo + index * step,
    hi: lo + (index + 1) * step,
    count: 0,
  }));

  for (const value of data) {
    const bucketIndex = Math.min(Math.floor((value - lo) / step), bins - 1);
    buckets[bucketIndex].count += 1;
  }

  return buckets;
}

/**
 * Convex hull of 2D points using Graham scan.
 */
export function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return [...points];

  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  function cross(o: [number, number], a: [number, number], b: [number, number]): number {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

/**
 * Parse a CSV/TSV string into an array of [x, y] pairs.
 */
export function parseCSV(text: string): [number, number][] {
  const parsed = Papa.parse<string[]>(text, {
    delimiter: "",
    dynamicTyping: false,
    skipEmptyLines: "greedy",
  });

  const points: [number, number][] = [];

  for (const row of parsed.data) {
    if (!Array.isArray(row) || row.length === 0) continue;

    let parts = row;
    if (row.length === 1 && typeof row[0] === "string") {
      parts = row[0].split(/[,\t;]+/).map((segment) => segment.trim());
    }

    if (parts.length < 2) continue;

    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (isFinite(x) && isFinite(y)) {
      points.push([x, y]);
    }
  }

  return points;
}

