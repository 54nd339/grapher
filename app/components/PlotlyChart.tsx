"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type {
  Config,
  Data,
  Layout,
  PlotRelayoutEvent,
  PlotlyHTMLElement,
} from "plotly.js-dist-min";

type PlotlyModule = typeof import("plotly.js-dist-min");

const loadPlotly = (() => {
  let plotlyPromise: Promise<PlotlyModule> | null = null;
  return () => {
    if (!plotlyPromise) {
      plotlyPromise = import("plotly.js-dist-min").then((mod) => mod);
    }
    return plotlyPromise;
  };
})();

export type PlotlyChartHandle = {
  resize: () => void;
};

export type PlotlyChartProps = {
  data: Data[];
  layout: Partial<Layout>;
  config?: Partial<Config>;
  className?: string;
  style?: React.CSSProperties;
  onRelayout?: (event: PlotRelayoutEvent, plot: PlotlyHTMLElement) => void;
};

const PlotlyChart = forwardRef<PlotlyChartHandle, PlotlyChartProps>(
  ({ data, layout, config, className, style, onRelayout }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const plotlyModuleRef = useRef<PlotlyModule | null>(null);
    const renderQueueRef = useRef<Promise<void>>(Promise.resolve());
    const isMountedRef = useRef(true);
    const [plotElement, setPlotElement] = useState<PlotlyHTMLElement | null>(null);

    useEffect(() => {
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    const scheduleRender = useCallback(() => {
      renderQueueRef.current = renderQueueRef.current
        .catch((error) => {
          console.error("Plotly render queue error", error);
        })
        .then(async () => {
          if (!containerRef.current || !isMountedRef.current) return;
          const Plotly = await loadPlotly();
          if (!isMountedRef.current) return;
          plotlyModuleRef.current = Plotly;
          const plot = await Plotly.react(
            containerRef.current,
            data,
            layout,
            {
              displaylogo: false,
              responsive: true,
              ...config,
            }
          );
          if (isMountedRef.current) {
            setPlotElement(plot);
          }
        })
        .catch((error) => {
          console.error("Plotly render error", error);
        });
    }, [data, layout, config]);

    useEffect(() => {
      scheduleRender();
    }, [scheduleRender]);

    useEffect(() => {
      if (!plotlyModuleRef.current || !plotElement) return;
      if (!onRelayout) return;

      const currentPlot = plotElement;
      const handler = (event: PlotRelayoutEvent) => onRelayout(event, currentPlot);

      currentPlot.on("plotly_relayout", handler);
      return () => {
        currentPlot.removeAllListeners("plotly_relayout");
      };
    }, [plotElement, onRelayout]);

    useImperativeHandle(
      ref,
      () => ({
        resize: () => {
          if (plotlyModuleRef.current && containerRef.current) {
            plotlyModuleRef.current.Plots.resize(containerRef.current);
          }
        },
      }),
      []
    );

    useEffect(() => {
      if (typeof ResizeObserver === "undefined" || !containerRef.current) return;
      const observer = new ResizeObserver(() => {
        if (plotlyModuleRef.current && containerRef.current) {
          plotlyModuleRef.current.Plots.resize(containerRef.current);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      return () => {
        if (plotlyModuleRef.current && container) {
          plotlyModuleRef.current.purge(container);
        }
      };
    }, []);

    return <div ref={containerRef} className={className} style={style} />;
  }
);

PlotlyChart.displayName = "PlotlyChart";

export default PlotlyChart;
