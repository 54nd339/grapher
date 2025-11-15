import { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { mathEngine } from '@/lib/mathEngine';
import type { PlotlyChartHandle } from '@/components/PlotlyChart';

// Easing functions
const easingFns: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeInOut: (t) => t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t,
  quadIn: (t) => t*t,
  quadOut: (t) => t*(2 - t),
  cubicInOut: (t) => t < 0.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
};

interface UseParametricAnimationOptions {
  plotHandleRef: React.RefObject<PlotlyChartHandle | null>;
  isActive: boolean;
}

// Parse parametric expression like "x=cos(t), y=sin(t)"
const parseParametric = (expression: string): { xExpr: string; yExpr: string } | null => {
  const parts = expression.split(',');
  let xExpr = '';
  let yExpr = '';
  for (const part of parts) {
    const [lhs, rhs] = part.split('=').map(s => s.trim());
    if (!lhs || !rhs) continue;
    if (lhs.toLowerCase().startsWith('x')) xExpr = rhs;
    if (lhs.toLowerCase().startsWith('y')) yExpr = rhs;
  }
  if (!xExpr || !yExpr) return null;
  return { xExpr, yExpr };
};

export function useParametricAnimation({ plotHandleRef, isActive }: UseParametricAnimationOptions) {
  const { equations, updateEquation, graphSettings } = useAppStore();
  const frameRef = useRef<number>(0);
  const lastTsRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;
    const animated = equations.filter(eq => eq.visible && eq.mode === 'parametric' && eq.animation?.enabled);
    if (animated.length === 0) return;

    const runFrame = (ts: number) => {
      if (!plotHandleRef.current?.getPlot) { frameRef.current = requestAnimationFrame(runFrame); return; }
      const plot = plotHandleRef.current.getPlot();
      if (!plot) { frameRef.current = requestAnimationFrame(runFrame); return; }
      const dt = lastTsRef.current ? (ts - lastTsRef.current)/1000 : 0; // seconds
      lastTsRef.current = ts;
      animated.forEach(eq => {
        const cfg = eq.animation!;
        if (cfg.playing === false) return; // skip if paused
        if (cfg.scrubbing) return; // skip auto advance while user scrubs
        const minFrame = cfg.minFrameMs ?? 16; // default ~60fps
        if (ts - (cfg.lastFrameTs ?? 0) < minFrame) return;
        const easing = easingFns[cfg.easing] || easingFns.linear;
        const speed = (cfg.speed || 1) * (graphSettings.animationPlaybackSpeed || 1);
        const nextTBase = (cfg.lastT ?? cfg.tStart) + dt * speed;
        let wrappedT = nextTBase;
        const tSpan = cfg.tEnd - cfg.tStart;
        if (nextTBase > cfg.tEnd) {
          if (cfg.loop) {
            wrappedT = cfg.tStart + ((nextTBase - cfg.tStart) % tSpan);
          } else {
            wrappedT = cfg.tEnd;
          }
        }
        const progress = (wrappedT - cfg.tStart) / tSpan;
        const easedProgress = Math.min(1, Math.max(0, easing(progress)));
        const displayT = cfg.tStart + easedProgress * tSpan;
        const parsed = parseParametric(eq.expression);
        if (!parsed) return;
        try {
          const xVal = mathEngine.evaluate(parsed.xExpr, { t: displayT });
          const yVal = mathEngine.evaluate(parsed.yExpr, { t: displayT });
          if (Number.isFinite(xVal) && Number.isFinite(yVal)) {
            const traceIndex = (plot.data as Array<{ name?: string }>).findIndex(d => d.name === eq.expression);
            if (traceIndex >= 0) {
              const plotlyGlobal = (window as unknown as { Plotly?: { extendTraces?: (el: unknown, update: { x: number[][]; y: number[][] }, idx: number[], maxPoints?: number) => void } }).Plotly;
              if (plotlyGlobal?.extendTraces) {
                plotlyGlobal.extendTraces(plot, { x: [[xVal]], y: [[yVal]] }, [traceIndex], cfg.resolution || 1000);
              }
            }
          }
          updateEquation(eq.id, { animation: { ...cfg, lastT: wrappedT, lastFrameTs: ts } });
        } catch {
          // ignore eval errors per frame
        }
      });
      frameRef.current = requestAnimationFrame(runFrame);
    };
    frameRef.current = requestAnimationFrame(runFrame);
    return () => { cancelAnimationFrame(frameRef.current); lastTsRef.current = 0; };
  }, [equations, graphSettings.animationPlaybackSpeed, isActive, plotHandleRef, updateEquation]);
}
