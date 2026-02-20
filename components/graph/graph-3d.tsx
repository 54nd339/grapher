"use client";

import { Component, useMemo, useRef, useCallback, useEffect, useState, type ReactNode } from "react";
import { RotateCcw, Grid3X3, Download, AlertTriangle } from "lucide-react";
import { OrbitControls, Grid } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useTheme } from "next-themes";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { getSliderSymbolFromLatex, toPlainExpression } from "@/lib/math";
import { useExpressionStore, useGraphStore } from "@/stores";

import { AxisLabels, Curve3D, GPUSurface, ImplicitMarchingCubes3D, ScreenshotHelper } from "./graph-3d-renderers";
import { GraphLegend } from "./graph-legend";

class WebGLErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background p-8 text-center">
          <AlertTriangle size={32} className="text-muted" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">
            3D rendering unavailable
          </p>
          <p className="max-w-xs text-xs text-muted">
            WebGL could not be initialized. Try enabling hardware acceleration
            in your browser settings, or switch to 2D mode.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function useSliderScope(): Record<string, number> {
  const expressions = useExpressionStore((s) => s.expressions);
  return useMemo(() => {
    const scope: Record<string, number> = {};
    for (const e of expressions) {
      if (e.kind === "slider" && e.sliderConfig) {
        const symbol = getSliderSymbolFromLatex(e.latex);
        if (symbol) scope[symbol] = e.sliderConfig.value;
      }
    }
    return scope;
  }, [expressions]);
}


/* ── Main Graph3D component ─────────────────────────── */

export function Graph3D() {
  const expressions = useExpressionStore((s) => s.expressions);
  const wireframe = useGraphStore((s) => s.wireframe);
  const toggleWireframe = useGraphStore((s) => s.toggleWireframe);
  const { resolvedTheme } = useTheme();
  const scope = useSliderScope();

  const bgColor = resolvedTheme === "dark" ? "#09090b" : "#ffffff";
  const labelColor = resolvedTheme === "dark" ? "#a1a1aa" : "#71717a";

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const screenshotRef = useRef<(() => void) | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setCanvasReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleResetCamera = useCallback(() => {
    controlsRef.current?.reset();
  }, []);

  const handleExport = useCallback(() => {
    screenshotRef.current?.();
  }, []);

  const visible = useMemo(() => {
    return expressions.filter((expression) => {
      if (!expression.visible || !expression.latex) return false;
      const plain = toPlainExpression(expression.latex, "none");

      if (expression.kind === "parametric") {
        return plain.split(",").length >= 3;
      }

      if (
        expression.kind === "slider" ||
        expression.kind === "points" ||
        expression.kind === "inequality" ||
        expression.kind === "differential" ||
        expression.kind === "calculus" ||
        expression.kind === "series" ||
        expression.kind === "polar"
      ) {
        return false;
      }

      if (expression.kind === "implicit") {
        return /=/.test(plain) && /z/.test(plain);
      }

      // 3D viewport currently supports explicit surfaces z = f(x, y)
      // (or bare expressions treated as z = expr) and 3D parametric curves.
      // Avoid compiling general equations here since it is expensive and can freeze.
      if (/=/.test(plain)) {
        return /^z\s*=/.test(plain);
      }

      return false;
    });
  }, [expressions]);

  const hasVisibleExpressions = useMemo(
    () => expressions.some((expression) => expression.visible && expression.latex.trim().length > 0),
    [expressions],
  );

  return (
    <div className="relative h-full w-full">
      <WebGLErrorBoundary>
        {canvasReady ? (
          <Canvas
            camera={{ position: [8, 6, 8], fov: 50 }}
            dpr={[1, 1.5]}
            gl={{ preserveDrawingBuffer: false, antialias: false, powerPreference: "high-performance" }}
            className="h-full w-full"
          >
            <color attach="background" args={[bgColor]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} />
            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.05}
            />
            <Grid
              args={[20, 20]}
              position={[0, -0.01, 0]}
              cellSize={1}
              cellColor={resolvedTheme === "dark" ? "#27272a" : "#e4e4e7"}
              sectionSize={5}
              sectionColor={resolvedTheme === "dark" ? "#3f3f46" : "#a1a1aa"}
              fadeDistance={30}
              infiniteGrid
            />
            <AxisLabels color={labelColor} />
            <ScreenshotHelper triggerRef={screenshotRef} />

            {visible.map((expr) =>
              expr.kind === "parametric" ? (
                <Curve3D key={expr.id} latex={expr.latex} color={expr.color} scope={scope} />
              ) : expr.kind === "implicit" ? (
                <ImplicitMarchingCubes3D
                  key={expr.id}
                  expressionId={expr.id}
                  latex={expr.latex}
                  color={expr.color}
                  wireframe={wireframe}
                  scope={scope}
                />
              ) : (
                <GPUSurface
                  key={expr.id}
                  expressionId={expr.id}
                  latex={expr.latex}
                  wireframe={wireframe}
                  scope={scope}
                />
              ),
            )}
          </Canvas>
        ) : (
          <div className="h-full w-full bg-background" />
        )}
      </WebGLErrorBoundary>

      <GraphLegend />

      {visible.length === 0 && hasVisibleExpressions && (
        <div className="pointer-events-none absolute left-3 bottom-3 rounded-lg bg-background/80 px-2.5 py-1.5 text-xs text-muted backdrop-blur">
          No 3D-plottable expression. Use <span className="text-foreground">z = f(x,y)</span> or
          <span className="text-foreground"> x(t), y(t), z(t)</span>.
        </div>
      )}

      {/* Overlay buttons */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button
          onClick={handleResetCamera}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted shadow-sm backdrop-blur transition-colors hover:text-foreground"
          title="Reset camera"
          aria-label="Reset camera"
        >
          <RotateCcw size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={toggleWireframe}
          className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur transition-colors ${wireframe
            ? "bg-accent/20 text-foreground"
            : "bg-background/80 text-muted hover:text-foreground"
            }`}
          title="Toggle wireframe"
          aria-label="Toggle wireframe"
          aria-pressed={wireframe}
        >
          <Grid3X3 size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={handleExport}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted shadow-sm backdrop-blur transition-colors hover:text-foreground"
          title="Export PNG"
          aria-label="Export PNG"
        >
          <Download size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
