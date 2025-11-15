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
  getPlot: () => PlotlyHTMLElement | null;
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
    const hasRenderedRef = useRef(false);
    const [plotElement, setPlotElement] = useState<PlotlyHTMLElement | null>(null);

    // Initialize mount state and reset render flag on mount
    useEffect(() => {
      isMountedRef.current = true;
      hasRenderedRef.current = false;
      setPlotElement(null);
      return () => {
        isMountedRef.current = false;
        hasRenderedRef.current = false;
      };
    }, []);

    const scheduleRender = useCallback(() => {
      renderQueueRef.current = renderQueueRef.current
        .catch((error) => {
          console.error("Plotly render queue error", error);
        })
        .then(async () => {
          if (!containerRef.current || !isMountedRef.current) return;
          
          // Wait for container to have dimensions
          const checkDimensions = () => {
            if (!containerRef.current) return false;
            const rect = containerRef.current.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
          };

          // Poll for dimensions with a timeout
          let attempts = 0;
          const maxAttempts = 50; // 500ms max wait
          while (!checkDimensions() && attempts < maxAttempts && isMountedRef.current) {
            await new Promise(resolve => setTimeout(resolve, 10));
            attempts++;
          }

          if (!isMountedRef.current || !containerRef.current) return;
          if (!checkDimensions()) {
            console.warn("PlotlyChart: Container has no dimensions, skipping render");
            return;
          }

          const Plotly = await loadPlotly();
          if (!isMountedRef.current || !containerRef.current) return;
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
            hasRenderedRef.current = true;
          }
        })
        .catch((error) => {
          console.error("Plotly render error", error);
        });
    }, [data, layout, config]);

    useEffect(() => {
      // Use requestAnimationFrame to ensure DOM is ready
      // Double RAF to ensure layout is complete after mount/mode switch
      let rafId1: number;
      let rafId2: number;
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => {
          if (isMountedRef.current && containerRef.current) {
            scheduleRender();
          }
        });
      });
      return () => {
        cancelAnimationFrame(rafId1);
        if (rafId2) cancelAnimationFrame(rafId2);
      };
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
          if (!isMountedRef.current || !containerRef.current) return;
          // If plot hasn't rendered yet, trigger a render instead
          if (!plotElement || !hasRenderedRef.current) {
            scheduleRender();
            return;
          }
          // Otherwise, resize the existing plot
          if (plotlyModuleRef.current && containerRef.current) {
            plotlyModuleRef.current.Plots.resize(containerRef.current);
          }
        },
        getPlot: () => plotElement,
      }),
      [plotElement, scheduleRender]
    );

    useEffect(() => {
      if (typeof ResizeObserver === "undefined" || !containerRef.current) return;
      const observer = new ResizeObserver((entries) => {
        if (!containerRef.current || !isMountedRef.current) return;
        const entry = entries[0];
        if (entry) {
          const { width, height } = entry.contentRect;
          // If we have dimensions and no plot element yet, trigger a render
          if (width > 0 && height > 0 && !plotElement && !hasRenderedRef.current) {
            scheduleRender();
          }
          // If we have a plot, resize it
          else if (plotlyModuleRef.current && containerRef.current && plotElement && width > 0 && height > 0) {
            plotlyModuleRef.current.Plots.resize(containerRef.current);
          }
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, [plotElement, scheduleRender]);

    useEffect(() => {
      const container = containerRef.current;
      return () => {
        // Purge Plotly instance on unmount
        if (plotlyModuleRef.current && container) {
          try {
            plotlyModuleRef.current.purge(container);
          } catch (error) {
            // Ignore purge errors during cleanup
            console.warn("PlotlyChart: Error during purge", error);
          }
        }
      };
    }, []);

    return (
      <div 
        ref={containerRef} 
        className={className} 
        style={{
          ...style,
          minHeight: '300px',
          touchAction: 'pan-x pan-y pinch-zoom',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }} 
      />
    );
  }
);

PlotlyChart.displayName = "PlotlyChart";

export default PlotlyChart;
