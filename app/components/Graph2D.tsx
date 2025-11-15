"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  Config,
  Data,
  Layout,
  LayoutAxis,
  PlotRelayoutEvent,
  PlotlyHTMLElement,
} from "plotly.js-dist-min";
import PlotlyChart, { type PlotlyChartHandle } from "@/components/PlotlyChart";
import { useAppStore } from "@/lib/store";
import { graph2DStyles } from "@/theme/styles";
import { useTheme } from "@/theme/ThemeProvider";
import type { GraphSettings } from "@/types";
import {
  buildExplicitTrace,
  buildImplicitTrace,
  buildParametricTrace,
  buildPolarTrace,
} from "@/lib/traceBuilders";

const ALLOWED_2D_MODES = new Set(["2d", "implicit", "parametric", "polar"]);

type Graph2DProps = {
  isActive?: boolean;
};

export default function Graph2D({ isActive = true }: Graph2DProps) {
  const { equations, graphSettings, updateGraphSettings } = useAppStore();
  const {
    xMin,
    xMax,
    yMin,
    yMax,
    gridEnabled,
    axesEnabled,
    labelsEnabled,
    scrollZoom,
    editable,
    exportEnabled,
    exportFormat,
    animationEnabled,
    animationDuration,
  } = graphSettings;
  const { theme } = useTheme();

  const dataRevision = useMemo(
    () =>
      equations
        .map((eq) => `${eq.id}:${eq.visible ? 1 : 0}:${eq.mode}:${eq.expression}`)
        .join("|"),
    [equations]
  );

  const visibleEquations = useMemo(
    () => equations.filter((eq) => eq.visible && ALLOWED_2D_MODES.has(eq.mode)),
    [equations]
  );

  const plotData = useMemo<Data[]>(() => {
    const traces: Data[] = [];

    for (const equation of visibleEquations) {
      const { expression, color } = equation;

      if (equation.mode === "parametric") {
        const trace = buildParametricTrace({ expression, color, name: expression });
        if (trace) traces.push(trace);
        continue;
      }

      if (equation.mode === "polar") {
        const trace = buildPolarTrace({ expression, color, name: expression });
        if (trace) traces.push(trace);
        continue;
      }

      if (equation.mode === "implicit" || expression.includes("=")) {
        const [left, right] = expression.split("=");
        const implicitExpr = `${left || "0"}-(${right || "0"})`;
        const trace = buildImplicitTrace({
          expression: implicitExpr,
          color,
          name: expression,
          xMin,
          xMax,
          yMin,
          yMax,
        });
        if (trace) traces.push(trace);
        continue;
      }

      traces.push(
        buildExplicitTrace({
          expression,
          color,
          name: expression,
          xMin,
          xMax,
        })
      );
    }

    return traces;
  }, [visibleEquations, xMax, xMin, yMax, yMin]);

  const plotLayout = useMemo<Partial<Layout>>(() => {
    const axisColor = theme.axis ?? theme.text ?? "#94a3b8";
    const gridColor = gridEnabled
      ? theme.grid ?? "rgba(148,163,184,0.4)"
      : "transparent";
    const zeroLine = axesEnabled ? theme.axisHighlight ?? axisColor : "transparent";
    const background = theme.plotBackground ?? theme.surface ?? "transparent";
    const paper = theme.surface ?? "transparent";

    return {
      autosize: true,
      dragmode: "pan",
      hovermode: "closest",
      margin: { l: 60, r: 30, t: 30, b: 50 },
      datarevision: dataRevision,
      paper_bgcolor: paper,
      plot_bgcolor: background,
      xaxis: {
        range: [xMin, xMax],
        showgrid: gridEnabled,
        gridcolor: gridColor,
        zeroline: axesEnabled,
        zerolinecolor: zeroLine,
        linecolor: axesEnabled ? axisColor : "transparent",
        mirror: axesEnabled,
        ticks: labelsEnabled ? "outside" : "",
        showticklabels: labelsEnabled,
        tickfont: { color: axisColor },
        title: { text: "X", font: { color: axisColor } },
      },
      yaxis: {
        range: [yMin, yMax],
        showgrid: gridEnabled,
        gridcolor: gridColor,
        zeroline: axesEnabled,
        zerolinecolor: zeroLine,
        linecolor: axesEnabled ? axisColor : "transparent",
        mirror: axesEnabled,
        ticks: labelsEnabled ? "outside" : "",
        showticklabels: labelsEnabled,
        tickfont: { color: axisColor },
        title: { text: "Y", font: { color: axisColor } },
      },
      showlegend: false,
      transition: animationEnabled
        ? { duration: animationDuration, easing: "cubic-in-out" }
        : undefined,
    } satisfies Partial<Layout>;
  }, [
    animationDuration,
    animationEnabled,
    axesEnabled,
    dataRevision,
    gridEnabled,
    labelsEnabled,
    theme,
    xMax,
    xMin,
    yMax,
    yMin,
  ]);

  const plotConfig = useMemo<Partial<Config>>(
    () => ({
      responsive: true,
      displaylogo: false,
      scrollZoom,
      editable,
      doubleClick: "reset",
      modeBarButtonsToRemove: exportEnabled ? [] : ["toImage"],
      toImageButtonOptions: exportEnabled
        ? {
            format: exportFormat,
            filename: "grapher-plot",
          }
        : undefined,
    }),
    [editable, exportEnabled, exportFormat, scrollZoom]
  );

  const plotRef = useRef<PlotlyChartHandle | null>(null);

  useEffect(() => {
    if (isActive) {
      plotRef.current?.resize();
    }
  }, [isActive]);

  const handleRelayout = useCallback(
    (event: PlotRelayoutEvent, plot: PlotlyHTMLElement) => {
      const next: Partial<GraphSettings> = {};
      const layout = plot.layout as Layout;

      const readRange = (axisKey: "xaxis" | "yaxis") => {
        const min = event[`${axisKey}.range[0]` as keyof PlotRelayoutEvent];
        const max = event[`${axisKey}.range[1]` as keyof PlotRelayoutEvent];
        if (typeof min === "number" && typeof max === "number" && min < max) {
          return [min, max] as const;
        }

        const axis = (layout?.[axisKey] ?? {}) as Partial<LayoutAxis>;
        const range = Array.isArray(axis.range) ? axis.range : undefined;
        const [rangeMin, rangeMax] = (range ?? []) as [number?, number?];
        if (
          typeof rangeMin === "number" &&
          typeof rangeMax === "number" &&
          rangeMin < rangeMax
        ) {
          return [rangeMin, rangeMax] as const;
        }

        return null;
      };

      const xRange = readRange("xaxis");
      if (xRange) {
        next.xMin = xRange[0];
        next.xMax = xRange[1];
      }

      const yRange = readRange("yaxis");
      if (yRange) {
        next.yMin = yRange[0];
        next.yMax = yRange[1];
      }

      if (Object.keys(next).length > 0) {
        updateGraphSettings(next);
      }
    },
    [updateGraphSettings]
  );

  return (
    <div
      className="w-full h-full rounded-xl shadow-2xl p-4 border overflow-hidden custom-scrollbar relative"
      style={graph2DStyles.container}
    >
      <PlotlyChart
        ref={plotRef}
        data={plotData}
        layout={plotLayout}
        config={plotConfig}
        className="w-full h-full"
        onRelayout={handleRelayout}
      />

      {visibleEquations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-lg" style={graph2DStyles.emptyState}>
            Add an equation to start graphing
          </p>
        </div>
      )}
    </div>
  );
}
