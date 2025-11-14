'use client';

/**
 * 2D Graph component using Mafs for high-performance rendering
 */

import { Mafs, Coordinates, Plot, Point } from 'mafs';
import { useAppStore } from '../lib/store';
import { mathEngine } from '../lib/mathEngine';
import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import 'mafs/core.css';
import '../../app/styles/graph.css';

// Plot item types
type PlotExplicit = { id: string; color: string; isImplicit: false; fn: (x: number) => number };
type PlotImplicit = { id: string; color: string; isImplicit: true; expression: string };
type PlotParametric = { id: string; color: string; isImplicit: false; isParametric: true; expression: string };
type PlotPolar = { id: string; color: string; isImplicit: false; isPolar: true; expression: string };
type PlotItem = PlotExplicit | PlotImplicit | PlotParametric | PlotPolar;

export default function Graph2D() {
  const { equations, graphSettings, updateGraphSettings } = useAppStore();
  const { xMin, xMax, yMin, yMax, gridEnabled } = graphSettings;
  const containerRef = useRef<HTMLDivElement>(null);
  const isZoomingRef = useRef(false);
  const [hoverCoords, setHoverCoords] = useState<{ x: number; y: number; eq: string } | null>(null);
  const hoverThrottleRef = useRef<number>(0);
  // Bump this to force Mafs to reset view when needed
  const [viewKey, setViewKey] = useState(0);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current?.contains(e.target as Node)) return;
    
    e.preventDefault();
    
    // Debounce rapid zoom events
    if (isZoomingRef.current) return;
    isZoomingRef.current = true;
    
    setTimeout(() => {
      isZoomingRef.current = false;
    }, 50);

    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87; // Zoom out or in
    
    // Get mouse position relative to container
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = 1 - (e.clientY - rect.top) / rect.height; // Invert Y
    
    // Calculate current mouse position in graph coordinates
    const graphMouseX = xMin + mouseX * (xMax - xMin);
    const graphMouseY = yMin + mouseY * (yMax - yMin);
    
    // Calculate new ranges
    const newXRange = (xMax - xMin) * zoomFactor;
    const newYRange = (yMax - yMin) * zoomFactor;
    
    // Keep mouse position fixed while zooming
    const newXMin = graphMouseX - mouseX * newXRange;
    const newXMax = graphMouseX + (1 - mouseX) * newXRange;
    const newYMin = graphMouseY - mouseY * newYRange;
    const newYMax = graphMouseY + (1 - mouseY) * newYRange;
    
    // Limit maximum zoom out to prevent performance issues
    const maxRange = 10000;
    if (newXMax - newXMin > maxRange || newYMax - newYMin > maxRange) {
      return;
    }
    
    // Limit minimum zoom in
    const minRange = 0.01;
    if (newXMax - newXMin < minRange || newYMax - newYMin < minRange) {
      return;
    }
    
    updateGraphSettings({
      xMin: newXMin,
      xMax: newXMax,
      yMin: newYMin,
      yMax: newYMax,
    });
  }, [xMin, xMax, yMin, yMax, updateGraphSettings]);

  // Attach wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Track mouse movement for coordinates display - only when hovering over a curve
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current?.contains(e.target as Node)) return;
    
    // Throttle to every 50ms for performance
    const now = Date.now();
    if (now - hoverThrottleRef.current < 50) return;
    hoverThrottleRef.current = now;
    
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = 1 - (e.clientY - rect.top) / rect.height;
    
    const graphX = xMin + mouseX * (xMax - xMin);
    const graphY = yMin + mouseY * (yMax - yMin);
    
    // Check if mouse is near any curve
    let nearestCurve: { distance: number; eq: string; x: number; y: number } | null = null;
    const threshold = (xMax - xMin) * 0.015; // 1.5% of x range
    
    // Allowed 2D modes
    const allowed2DModes = new Set(['2d', 'implicit', 'parametric', 'polar']);

    // Check explicit equations (y = f(x))
    for (const eq of equations.filter(e => e.visible && allowed2DModes.has(e.mode) && !e.expression.includes('=') && e.mode !== 'parametric' && e.mode !== 'polar')) {
      try {
        const yVal = mathEngine.evaluate(eq.expression, { x: graphX });
        if (isFinite(yVal)) {
          const distance = Math.abs(graphY - yVal);
          if (distance < threshold) {
            if (!nearestCurve || distance < nearestCurve.distance) {
              nearestCurve = { distance, eq: eq.expression, x: graphX, y: yVal };
            }
          }
        }
      } catch {
        // Skip
      }
    }
    
    // Check implicit equations - sample nearby points
    for (const eq of equations.filter(e => e.visible && allowed2DModes.has(e.mode) && e.expression.includes('='))) {
      try {
        const [left, right] = eq.expression.split('=');
        const implicitExpr = `(${left})-(${right || '0'})`;
        
        // Check current point and nearby points for zero crossing
        const checkPoints = [
          [graphX, graphY],
          [graphX + threshold * 0.5, graphY],
          [graphX - threshold * 0.5, graphY],
          [graphX, graphY + threshold * 0.5],
          [graphX, graphY - threshold * 0.5],
        ];
        
        for (const [px, py] of checkPoints) {
          const val = mathEngine.evaluate(implicitExpr, { x: px, y: py });
          const absVal = Math.abs(val);
          
          if (absVal < threshold * 3) {
            if (!nearestCurve || absVal < nearestCurve.distance) {
              nearestCurve = { distance: absVal, eq: eq.expression, x: px, y: py };
            }
          }
        }
      } catch {
        // Skip
      }
    }

    // Check parametric curves by sampling t range sparsely
    for (const eq of equations.filter(e => e.visible && e.mode === 'parametric')) {
      try {
        // Expect formats like: "x = <expr>, y = <expr>" (order may vary)
        const parts = eq.expression.split(',');
        let xExpr = '';
        let yExpr = '';
        for (const p of parts) {
          const [lhs, rhs] = p.split('=').map(s => s.trim());
          if (!lhs || !rhs) continue;
          if (lhs.toLowerCase().startsWith('x')) xExpr = rhs;
          if (lhs.toLowerCase().startsWith('y')) yExpr = rhs;
        }
        if (!xExpr || !yExpr) continue;

  const tMin = -2 * Math.PI;
  const tMax = 2 * Math.PI;
  const samples = 72; // coarse for hover
        const tStep = (tMax - tMin) / samples;
        for (let i = 0; i <= samples; i++) {
          const t = tMin + i * tStep;
          const px = mathEngine.evaluate(xExpr, { t });
          const py = mathEngine.evaluate(yExpr, { t });
          if (!isFinite(px) || !isFinite(py)) continue;
          const dx = graphX - px;
          const dy = graphY - py;
          const dist = Math.hypot(dx, dy);
          if (dist < threshold) {
            if (!nearestCurve || dist < nearestCurve.distance) {
              nearestCurve = { distance: dist, eq: eq.expression, x: px, y: py };
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // Check polar curves by sampling theta
    for (const eq of equations.filter(e => e.visible && e.mode === 'polar')) {
      try {
        // Expect format: "r = <expr>"
        const [, rExprRaw] = eq.expression.split('=');
        const rExpr = (rExprRaw || '').trim();
        if (!rExpr) continue;
  const thMin = 0;
  const thMax = 2 * Math.PI;
  const samples = 72;
        const thStep = (thMax - thMin) / samples;
        for (let i = 0; i <= samples; i++) {
          const theta = thMin + i * thStep;
          const r = mathEngine.evaluate(rExpr, { theta });
          if (!isFinite(r)) continue;
          const px = r * Math.cos(theta);
          const py = r * Math.sin(theta);
          const dx = graphX - px;
          const dy = graphY - py;
          const dist = Math.hypot(dx, dy);
          if (dist < threshold) {
            if (!nearestCurve || dist < nearestCurve.distance) {
              nearestCurve = { distance: dist, eq: eq.expression, x: px, y: py };
            }
          }
        }
      } catch {
        // ignore
      }
    }
    
    if (nearestCurve) {
      setHoverCoords({ x: nearestCurve.x, y: nearestCurve.y, eq: nearestCurve.eq });
    } else {
      setHoverCoords(null);
    }
  }, [xMin, xMax, yMin, yMax, equations]);

  const handleMouseLeave = useCallback(() => {
    setHoverCoords(null);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  // Calculate dynamic grid spacing based on zoom level (memoized)
  const { xSpacing, ySpacing } = useMemo(() => {
    const getGridSpacing = (range: number): number => {
      if (range <= 5) return 0.5;
      if (range <= 10) return 1;
      if (range <= 20) return 2;
      if (range <= 50) return 5;
      if (range <= 100) return 10;
      if (range <= 200) return 20;
      if (range <= 500) return 50;
      if (range <= 1000) return 100;
      if (range <= 5000) return 500;
      return 1000;
    };

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    
    return {
      xSpacing: getGridSpacing(xRange),
      ySpacing: getGridSpacing(yRange),
    };
  }, [xMin, xMax, yMin, yMax]);

  // Custom label formatter for cleaner axis labels (memoized)
  const formatLabel = useCallback((n: number): string => {
    // Check if it's close to a multiple of π
    const piRatio = n / Math.PI;
    const roundedRatio = Math.round(piRatio * 4) / 4; // Round to nearest 1/4
    
    if (Math.abs(piRatio - roundedRatio) < 0.01) {
      if (roundedRatio === 0) return '0';
      if (roundedRatio === 1) return 'π';
      if (roundedRatio === -1) return '-π';
      if (roundedRatio === 0.5) return 'π/2';
      if (roundedRatio === -0.5) return '-π/2';
      if (Math.abs(roundedRatio) < 1) {
        const num = Math.round(roundedRatio * 4);
        const denom = 4;
        return `${num}π/${denom}`;
      }
      const simplified = roundedRatio;
      if (Number.isInteger(simplified)) {
        return `${simplified}π`;
      }
    }
    
    // For regular numbers, show up to 2 decimal places
    if (Math.abs(n) < 0.01 && n !== 0) return n.toExponential(1);
    if (Number.isInteger(n)) return n.toString();
    return n.toFixed(Math.abs(n) < 1 ? 2 : 1);
  }, []);

  // Memoize plot functions to prevent recreation on every render
  const plotFunctions: PlotItem[] = useMemo(() => {
    const allowed2DModes = new Set(['2d', 'implicit', 'parametric', 'polar']);
    const items = equations
      .filter((eq) => eq.visible && allowed2DModes.has(eq.mode))
      .map((equation) => {
        // Check if it's an implicit equation (contains = sign)
        if (equation.mode === 'implicit' || (equation.mode === '2d' && equation.expression.includes('='))) {
          // For implicit equations like x^2+y^2=25, we need to handle them differently
          // Split by = and rearrange to f(x,y) = 0 form
          const [left, right] = equation.expression.split('=');
          const implicitExpr = `${left}-(${right || '0'})`;
          
          const item: PlotImplicit = {
            id: equation.id,
            fn: null,
            color: equation.color,
            isImplicit: true,
            expression: implicitExpr,
          } as unknown as PlotImplicit; // fn will be unused for implicit
          return item;
        }
        
        // Regular explicit function y = f(x)
        if (equation.mode === '2d') {
          const fn = (x: number) => {
            try {
              return mathEngine.evaluate(equation.expression, { x });
            } catch {
              return NaN;
            }
          };
          const item: PlotExplicit = {
            id: equation.id,
            fn,
            color: equation.color,
            isImplicit: false,
          };
          return item;
        }

        // Tag parametric
        if (equation.mode === 'parametric') {
          const item: PlotParametric = {
            id: equation.id,
            color: equation.color,
            isImplicit: false,
            isParametric: true,
            expression: equation.expression,
          };
          return item;
        }

        // Tag polar
        if (equation.mode === 'polar') {
          const item: PlotPolar = {
            id: equation.id,
            color: equation.color,
            isImplicit: false,
            isPolar: true,
            expression: equation.expression,
          };
          return item;
        }

        return null;
      });
    return (items.filter(Boolean) as PlotItem[]);
  }, [equations]);

  // Separate explicit and implicit plots
  const { explicitPlots, implicitPlots, parametricPlots, polarPlots } = useMemo(() => {
    const plots = plotFunctions;
    return {
      explicitPlots: plots.filter((p): p is PlotExplicit => !p.isImplicit && !(p as any).isParametric && !(p as any).isPolar),
      implicitPlots: plots.filter((p): p is PlotImplicit => p.isImplicit),
      parametricPlots: plots.filter((p): p is PlotParametric => (p as any).isParametric),
      polarPlots: plots.filter((p): p is PlotPolar => (p as any).isPolar),
    };
  }, [plotFunctions]);

  // Reset view to origin
  const handleResetView = useCallback(() => {
    updateGraphSettings({
      xMin: -10,
      xMax: 10,
      yMin: -10,
      yMax: 10,
    });
    // Force Mafs to pick new viewBox immediately
    setViewKey((k) => k + 1);
  }, [updateGraphSettings]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-xl shadow-2xl p-4 border border-gray-200 dark:border-gray-700 overflow-hidden custom-scrollbar relative"
    >
      {/* Reset View Button */}
      <button
        onClick={handleResetView}
        className="absolute top-6 left-6 z-20 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:scale-105 cursor-pointer"
        title="Reset view to origin (0,0)"
        style={{ pointerEvents: 'auto' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reset View
      </button>

      {/* Coordinates Display - Only when hovering over a curve */}
      {hoverCoords && (
        <div 
          className="absolute top-6 right-6 bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 font-mono text-sm"
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-sans">{hoverCoords.eq}</div>
          <div>
            <span className="text-blue-600 dark:text-blue-400">x: {hoverCoords.x.toFixed(3)}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-purple-600 dark:text-purple-400">y: {hoverCoords.y.toFixed(3)}</span>
          </div>
        </div>
      )}

      <Mafs
        key={viewKey}
        viewBox={{
          x: [xMin, xMax],
          y: [yMin, yMax],
        }}
        preserveAspectRatio={false}
        pan
        zoom
      >
        <Coordinates.Cartesian
          xAxis={{
            lines: gridEnabled ? xSpacing : false,
            labels: formatLabel,
          }}
          yAxis={{
            lines: gridEnabled ? ySpacing : false,
            labels: formatLabel,
          }}
        />

        {/* Explicit plots (y = f(x)) */}
        {explicitPlots.map(({ id, fn, color }) => (
          <Plot.OfX
            key={id}
            y={fn!}
            color={color}
            style="solid"
            weight={2.5}
            minSamplingDepth={8}
            maxSamplingDepth={15}
          />
        ))}

        {/* Implicit plots (f(x,y) = 0) */}
        {implicitPlots.map(({ id, color, expression }) => {
          // Use marching squares algorithm for better implicit plotting
          // Adapt resolution a bit to current zoom to avoid overdraw when zoomed out
          const base = 64;
          const span = Math.max(xMax - xMin, yMax - yMin);
          const resolution = Math.min(96, Math.max(32, Math.floor(base * (20 / Math.max(5, Math.log10(span + 10))))));
          const points: [number, number][] = [];
          
          // Sample the function on a grid
          const grid: number[][] = [];
          for (let i = 0; i <= resolution; i++) {
            grid[i] = [];
            for (let j = 0; j <= resolution; j++) {
              const x = xMin + (i / resolution) * (xMax - xMin);
              const y = yMin + (j / resolution) * (yMax - yMin);
              
              try {
                const val = mathEngine.evaluate(expression!, { x, y });
                grid[i][j] = isFinite(val) ? val : NaN;
              } catch {
                grid[i][j] = NaN;
              }
            }
          }
          
          // Find zero crossings (marching squares)
          for (let i = 0; i < resolution; i++) {
            for (let j = 0; j < resolution; j++) {
              const x0 = xMin + (i / resolution) * (xMax - xMin);
              const y0 = yMin + (j / resolution) * (yMax - yMin);
              const x1 = xMin + ((i + 1) / resolution) * (xMax - xMin);
              const y1 = yMin + ((j + 1) / resolution) * (yMax - yMin);
              
              const v00 = grid[i]?.[j];
              const v10 = grid[i + 1]?.[j];
              const v01 = grid[i]?.[j + 1];
              const v11 = grid[i + 1]?.[j + 1];
              
              if (v00 === undefined || v10 === undefined || v01 === undefined || v11 === undefined) continue;
              if (isNaN(v00) || isNaN(v10) || isNaN(v01) || isNaN(v11)) continue;
              
              // Check for sign changes (zero crossing)
              // Horizontal edges
              if (v00 * v10 <= 0 && v00 !== v10) {
                const t = Math.abs(v00) / (Math.abs(v00) + Math.abs(v10));
                points.push([x0 + t * (x1 - x0), y0]);
              }
              if (v01 * v11 <= 0 && v01 !== v11) {
                const t = Math.abs(v01) / (Math.abs(v01) + Math.abs(v11));
                points.push([x0 + t * (x1 - x0), y1]);
              }
              
              // Vertical edges
              if (v00 * v01 <= 0 && v00 !== v01) {
                const t = Math.abs(v00) / (Math.abs(v00) + Math.abs(v01));
                points.push([x0, y0 + t * (y1 - y0)]);
              }
              if (v10 * v11 <= 0 && v10 !== v11) {
                const t = Math.abs(v10) / (Math.abs(v10) + Math.abs(v11));
                points.push([x1, y0 + t * (y1 - y0)]);
              }
            }
          }
          
          // Downsample to reduce DOM nodes if too many points
          const maxPoints = 1500;
          const step = points.length > maxPoints ? Math.ceil(points.length / maxPoints) : 1;
          const ds = step === 1 ? points : points.filter((_, i) => i % step === 0);
          return ds.map((point, idx) => (
            <Point key={`${id}-${idx}`} x={point[0]} y={point[1]} color={color} />
          ));
        })}

        {/* Parametric plots: x = f(t), y = g(t) */}
        {parametricPlots.map(({ id, color, expression }) => {
          try {
            const parts = (expression as string).split(',');
            let xExpr = '';
            let yExpr = '';
            for (const p of parts) {
              const [lhs, rhs] = p.split('=').map(s => s.trim());
              if (!lhs || !rhs) continue;
              if (lhs.toLowerCase().startsWith('x')) xExpr = rhs;
              if (lhs.toLowerCase().startsWith('y')) yExpr = rhs;
            }
            if (!xExpr || !yExpr) return null;
            const fx = (t: number) => {
              try { return mathEngine.evaluate(xExpr, { t }); } catch { return NaN; }
            };
            const fy = (t: number) => {
              try { return mathEngine.evaluate(yExpr, { t }); } catch { return NaN; }
            };
            return (
              <Plot.Parametric
                key={id}
                t={[ -2 * Math.PI, 2 * Math.PI ]}
                xy={(t) => [fx(t), fy(t)]}
                color={color}
                weight={2}
                minSamplingDepth={6}
                maxSamplingDepth={10}
              />
            );
          } catch {
            return null;
          }
        })}

        {/* Polar plots: r = f(theta) rendered via Parametric mapping */}
        {polarPlots.map(({ id, color, expression }) => {
          try {
            const [, rExprRaw] = (expression as string).split('=');
            const rExpr = (rExprRaw || '').trim();
            if (!rExpr) return null;
            const fx = (theta: number) => {
              try { const r = mathEngine.evaluate(rExpr, { theta }); return r * Math.cos(theta); } catch { return NaN; }
            };
            const fy = (theta: number) => {
              try { const r = mathEngine.evaluate(rExpr, { theta }); return r * Math.sin(theta); } catch { return NaN; }
            };
            return (
              <Plot.Parametric
                key={id}
                t={[0, 2 * Math.PI]}
                xy={(theta) => [fx(theta), fy(theta)]}
                color={color}
                weight={2}
                minSamplingDepth={6}
                maxSamplingDepth={10}
              />
            );
          } catch {
            return null;
          }
        })}
      </Mafs>
      
      {equations.filter(eq => eq.visible).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-gray-400 dark:text-gray-600 text-lg">
            Add an equation to start graphing
          </p>
        </div>
      )}
    </div>
  );
}
