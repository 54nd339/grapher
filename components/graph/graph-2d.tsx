"use client";

import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Mafs, Coordinates, usePaneContext, useTransformContext } from "mafs";
import { useShallow } from "zustand/react/shallow";

import { niceStep } from "@/lib/graph";
import { useExpressionStore, useGraphStore } from "@/stores";
import { useSliderScope } from "@/hooks";

import { AnalysisOverlay, IntersectionOverlay } from "./analysis-overlay";
import { CurvatureOverlay } from "./curvature-overlay";
import { useCurveTrace, CurveTraceDot } from "./curve-trace";
import { GraphLegend } from "./graph-legend";
import { GraphSettings } from "./graph-settings";
import { ExpressionPlot } from "./plots/expression-plot";
import { PolarGridOverlay } from "./polar-grid-overlay";
import { TangentLine } from "./tangent-line";

/* ── Syncs Mafs internal pan/zoom state back to graph-store ── */

function ViewportSync({
  onRangeChange,
}: {
  onRangeChange?: (viewport: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  }) => void;
}) {
  const { xPaneRange, yPaneRange } = usePaneContext();
  const setViewport = useGraphStore((s) => s.setViewport);

  const nextViewport = useMemo(
    () => ({
      xMin: xPaneRange[0],
      xMax: xPaneRange[1],
      yMin: yPaneRange[0],
      yMax: yPaneRange[1],
    }),
    [xPaneRange, yPaneRange],
  );

  onRangeChange?.(nextViewport);

  useEffect(() => {
    setViewport(nextViewport);
  }, [nextViewport, setViewport]);

  return null;
}

function TransformSync({
  onTransformChange,
}: {
  onTransformChange?: (transform: [number, number, number, number, number, number]) => void;
}) {
  const { viewTransform } = useTransformContext();

  useEffect(() => {
    onTransformChange?.(viewTransform);
  }, [onTransformChange, viewTransform]);

  return null;
}

/* ── Adaptive grid with built-in Mafs labels ──────────── */

function DynamicGrid() {
  const { xPaneRange, yPaneRange } = usePaneContext();
  const { gridVisible, axisLabelsVisible } = useGraphStore(
    useShallow((s) => ({ gridVisible: s.gridVisible, axisLabelsVisible: s.axisLabelsVisible })),
  );
  const xStep = niceStep(xPaneRange[1] - xPaneRange[0], 10);
  const yStep = niceStep(yPaneRange[1] - yPaneRange[0], 10);

  if (!gridVisible) return null;

  return (
    <Coordinates.Cartesian
      xAxis={{
        lines: xStep,
        subdivisions: 4,
        labels: axisLabelsVisible ? (x) => formatTick(x) : false,
      }}
      yAxis={{
        lines: yStep,
        subdivisions: 4,
        labels: axisLabelsVisible ? (y) => formatTick(y) : false,
      }}
    />
  );
}

function formatTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10000 || (abs > 0 && abs < 0.001)) return value.toExponential(1);
  return Number(value.toFixed(3)).toString();
}

/* ── Main Graph2D component ──────────────────────────── */

export function Graph2D() {
  const expressions = useExpressionStore((s) => s.expressions);
  const {
    viewport,
    resetViewport,
    analysisOverlayEnabled,
    interactionOverlayEnabled,
    curvatureOverlayEnabled,
  } = useGraphStore(
    useShallow((s) => ({
      viewport: s.viewport,
      resetViewport: s.resetViewport,
      analysisOverlayEnabled: s.analysisOverlayEnabled,
      interactionOverlayEnabled: s.interactionOverlayEnabled,
      curvatureOverlayEnabled: s.curvatureOverlayEnabled,
    })),
  );

  const [mafsKey, setMafsKey] = useState(0);
  const initialViewport = useRef(viewport);
  const paneViewportRef = useRef(viewport);
  const viewTransformRef = useRef<[number, number, number, number, number, number] | null>(null);

  const viewBox = {
    x: [initialViewport.current.xMin, initialViewport.current.xMax] as [number, number],
    y: [initialViewport.current.yMin, initialViewport.current.yMax] as [number, number],
  };

  const handleReset = useCallback(() => {
    resetViewport();
    initialViewport.current = useGraphStore.getState().viewport;
    setMafsKey((k) => k + 1);
  }, [resetViewport]);

  const activeId = useExpressionStore((s) => s.activeId);
  const snapToGrid = useGraphStore((s) => s.snapToGrid);
  const [tracePoint, setTracePoint] = useState<{ x: number; y: number } | null>(null);
  const [cursorPixel, setCursorPixel] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleExportSvg = useCallback(() => {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(clone);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grapher-2d.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const containerRect = el.getBoundingClientRect();
      const svg = el.querySelector("svg");
      const viewTransform = viewTransformRef.current;
      if (!svg || !viewTransform) return;

      const svgRect = svg.getBoundingClientRect();
      if (
        e.clientX < svgRect.left ||
        e.clientX > svgRect.right ||
        e.clientY < svgRect.top ||
        e.clientY > svgRect.bottom
      ) {
        setTracePoint(null);
        setCursorPixel(null);
        return;
      }

      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const local = point.matrixTransform(ctm.inverse());

      const [a, c, tx, b, d, ty] = viewTransform;
      const inverse = new DOMMatrix([a, b, c, d, tx, ty]).inverse();
      const mathPoint = new DOMPoint(local.x, local.y).matrixTransform(inverse);
      const pane = paneViewportRef.current;
      const mathXRaw = mathPoint.x;
      const mathYRaw = mathPoint.y;

      if (
        !isFinite(mathXRaw) ||
        !isFinite(mathYRaw)
      ) {
        setTracePoint(null);
        setCursorPixel(null);
        return;
      }

      const xStep = niceStep(pane.xMax - pane.xMin, 10);
      const yStep = niceStep(pane.yMax - pane.yMin, 10);
      const mathX = snapToGrid ? Math.round(mathXRaw / xStep) * xStep : mathXRaw;
      const mathY = snapToGrid ? Math.round(mathYRaw / yStep) * yStep : mathYRaw;
      setTracePoint({ x: mathX, y: mathY });
      setCursorPixel({
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
      });
    },
    [snapToGrid],
  );

  const handleMouseLeave = useCallback(() => {
    setTracePoint(null);
    setCursorPixel(null);
  }, []);

  const visibleExpressions = useMemo(() => {
    const seen = new Set<string>();
    return expressions.filter((e) => {
      if (!e.visible || !e.latex || e.kind === "slider") return false;
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }, [expressions]);

  const pointExpressions = useMemo(
    () => visibleExpressions.filter((e) => e.kind === "points"),
    [visibleExpressions],
  );

  const nonPointExpressions = useMemo(
    () => visibleExpressions.filter((e) => e.kind !== "points"),
    [visibleExpressions],
  );

  const scope = useSliderScope();
  const activeExpr = expressions.find((e) => e.id === activeId);
  const traceExpressions =
    activeExpr && activeExpr.visible && activeExpr.latex
      ? [activeExpr]
      : [];

  const traceHit = useCurveTrace(
    traceExpressions,
    tracePoint?.x ?? 0,
    tracePoint?.y ?? 0,
    scope,
  );
  const activeHit = tracePoint ? traceHit : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Mafs
        key={mafsKey}
        viewBox={viewBox}
        preserveAspectRatio={false}
        pan
        zoom={{ min: 1e-5, max: 1e5 }}
        height={containerSize.height || 500}
      >
        <ViewportSync
          onRangeChange={(nextViewport) => {
            paneViewportRef.current = nextViewport;
          }}
        />
        <TransformSync
          onTransformChange={(nextTransform) => {
            viewTransformRef.current = nextTransform;
          }}
        />
        <DynamicGrid />
        {nonPointExpressions.map((expr) => (
          <ExpressionPlot key={expr.id} expression={expr} />
        ))}
        {pointExpressions.map((expr) => (
          <ExpressionPlot key={expr.id} expression={expr} />
        ))}

        {activeHit && <CurveTraceDot hit={activeHit} showLabel={false} />}

        {/* Tangent line at hover point for active expression */}
        {activeExpr && activeExpr.visible && tracePoint && useGraphStore.getState().tangentLineEnabled && (
          <TangentLine expression={activeExpr} x={tracePoint.x} scope={scope} />
        )}

        {analysisOverlayEnabled && activeExpr && activeExpr.visible && activeExpr.latex && (
          <AnalysisOverlay expression={activeExpr} scope={scope} />
        )}

        {interactionOverlayEnabled && (
          <IntersectionOverlay expressions={visibleExpressions} scope={scope} />
        )}

        {curvatureOverlayEnabled && activeExpr && activeExpr.visible && activeExpr.latex && (
          <CurvatureOverlay
            expression={activeExpr}
            scope={scope}
            hoverX={activeHit?.mathX ?? null}
          />
        )}

      </Mafs>

      {tracePoint && cursorPixel && (
        <div
          className="pointer-events-none absolute z-20 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-foreground shadow-sm backdrop-blur"
          style={{
            left: cursorPixel.x + 10,
            top: cursorPixel.y - 18,
          }}
        >
          ({formatTick(tracePoint.x)}, {formatTick(tracePoint.y)})
        </div>
      )}

      <GraphLegend />

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleReset}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted shadow-sm backdrop-blur transition-colors hover:text-foreground"
          aria-label="Reset view"
          title="Reset view"
        >
          <RotateCcw size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={handleExportSvg}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted shadow-sm backdrop-blur transition-colors hover:text-foreground"
          aria-label="Export SVG"
          title="Export SVG"
        >
          <Download size={16} strokeWidth={1.5} />
        </button>
        <GraphSettings />
      </div>

      <PolarGridOverlay width={containerSize.width} height={containerSize.height} />
    </div>
  );
}
