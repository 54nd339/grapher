/**
 * Compute a "nice" step size for axis ticks.
 * Picks from {1, 2, 5} × 10^n to avoid awkward tick spacing.
 */
export function niceStep(range: number, maxTicks: number): number {
  if (range <= 0 || !isFinite(range)) return 1;
  const rough = range / maxTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const r = rough / mag;
  if (r <= 1.5) return mag;
  if (r <= 3) return 2 * mag;
  if (r <= 7) return 5 * mag;
  return 10 * mag;
}
