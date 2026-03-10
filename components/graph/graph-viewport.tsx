"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Table2, X } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { is3DSupported } from "@/lib/graph";
import { useGraphStore, useUIStore } from "@/stores";

import { TableView } from "./table-view";

const Graph2D = dynamic(
  () => import("./graph-2d").then((m) => ({ default: m.Graph2D })),
  {
    ssr: false,
    loading: () => <GraphPlaceholder />,
  },
);

const Graph3D = dynamic(
  () => import("./graph-3d").then((m) => ({ default: m.Graph3D })),
  {
    ssr: false,
    loading: () => <GraphPlaceholder />,
  },
);

const FractalOverlay = dynamic(
  () => import("./fractal-overlay").then((m) => ({ default: m.FractalOverlay })),
  { ssr: false },
);

function GraphPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  );
}

export function GraphViewport() {
  const { mode, setMode, threeDSupported, setThreeDSupported } = useGraphStore(
    useShallow((s) => ({
      mode: s.mode,
      setMode: s.setMode,
      threeDSupported: s.threeDSupported,
      setThreeDSupported: s.setThreeDSupported,
    })),
  );
  const { tableOpen, toggleTable, fractalMode, setFractalMode } = useUIStore(
    useShallow((s) => ({
      tableOpen: s.tableOpen,
      toggleTable: s.toggleTable,
      fractalMode: s.fractalMode,
      setFractalMode: s.setFractalMode,
    })),
  );

  const [size, setSize] = useState({ width: 0, height: 0 });
  const unsupportedWarnedRef = useRef(false);
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const supported = is3DSupported();
    setThreeDSupported(supported);
    if (!supported) {
      setMode("2d");
      if (!unsupportedWarnedRef.current) {
        toast.warning("3D mode is unavailable.", {
          description: "WebGL is not supported or hardware acceleration is disabled.",
        });
        unsupportedWarnedRef.current = true;
      }
    }
  }, [setMode, setThreeDSupported]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background" role="region" aria-label="Graph viewport">
      {fractalMode !== "off" ? (
        <>
          <FractalOverlay
            type={fractalMode}
            width={size.width}
            height={size.height}
          />
          <button
            onClick={() => setFractalMode("off")}
            className="absolute left-3 top-3 z-20 flex h-8 items-center gap-1.5 rounded-lg bg-background/80 px-2.5 text-xs text-muted shadow-sm backdrop-blur hover:text-foreground"
            aria-label="Close fractal explorer"
          >
            <X size={14} /> Close {fractalMode === "mandelbrot" ? "Mandelbrot" : "Julia"}
          </button>
        </>
      ) : mode === "2d" || !threeDSupported ? (
        <Graph2D />
      ) : (
        <Graph3D />
      )}

      {/* Table toggle button */}
      {mode === "2d" && !tableOpen && fractalMode === "off" && (
        <button
          onClick={toggleTable}
          className="absolute right-3 bottom-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted shadow-sm backdrop-blur transition-colors hover:text-foreground"
          aria-label="Show table of values"
          title="Table of values"
        >
          <Table2 size={16} strokeWidth={1.5} />
        </button>
      )}

      <TableView />
    </div>
  );
}
