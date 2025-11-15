'use client';

/**
 * 3D Graph component using Plotly.js for interactive 3D visualization
 */

import { useEffect, useMemo, useRef } from 'react';
import type { Config, Data, Layout } from 'plotly.js-dist-min';
import PlotlyChart, { type PlotlyChartHandle } from '@/components/PlotlyChart';
import { mathEngine } from '@/lib/mathEngine';
import { useAppStore } from '@/lib/store';
import { graph3DStyles } from '@/theme/styles';
import { useTheme } from '@/theme/ThemeProvider';

type Graph3DProps = {
  isActive?: boolean;
};

export default function Graph3D({ isActive = true }: Graph3DProps) {
  const { equations, graphSettings } = useAppStore();
  const {
    xMin,
    xMax,
    yMin,
    yMax,
    zMin = -10,
    zMax = 10,
    scrollZoom,
    editable,
    exportEnabled,
    exportFormat,
    animationEnabled,
    animationDuration,
  } = graphSettings;
  const { theme } = useTheme();

  const containerStyle = graph3DStyles.container;
  const emptyTextStyle = graph3DStyles.emptyState;

  const dataRevision = useMemo(
    () =>
      equations
        .map((eq) => `${eq.id}:${eq.visible ? 1 : 0}:${eq.mode}:${eq.expression}`)
        .join("|"),
    [equations]
  );

  const data: Data[] = equations
    .filter((eq) => eq.visible && eq.mode === '3d')
    .map((equation) => {
      try {
        const { x, y, z } = mathEngine.generate3DPoints(
          equation.expression,
          [xMin, xMax],
          [yMin, yMax],
          20 // Reduced resolution for better performance
        );

        const trace: Data = {
          type: 'surface',
          x,
          y,
          z,
          colorscale: [
            [0, equation.color + '40'],
            [1, equation.color],
          ],
          showscale: false,
          name: equation.expression,
          hovertemplate: 'x: %{x:.2f}<br>y: %{y:.2f}<br>z: %{z:.2f}<extra></extra>',
        };

        return trace;
      } catch (error) {
        console.error('Error generating 3D plot:', error);
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const layout: Partial<Layout> = useMemo(() => ({
    autosize: true,
    datarevision: dataRevision,
    scene: {
      xaxis: {
        range: [xMin, xMax],
        title: { text: 'X' },
      },
      yaxis: {
        range: [yMin, yMax],
        title: { text: 'Y' },
      },
      zaxis: {
        range: [zMin, zMax],
        title: { text: 'Z' },
      },
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.5 },
      },
    },
    margin: { l: 0, r: 0, t: 0, b: 0 },
    paper_bgcolor: theme.canvas ?? 'rgba(0,0,0,0)',
    plot_bgcolor: theme.plotBackground ?? 'rgba(0,0,0,0)',
    transition: animationEnabled
      ? { duration: animationDuration, easing: 'cubic-in-out' }
      : undefined,
  }), [
    animationDuration,
    animationEnabled,
    dataRevision,
    theme.canvas,
    theme.plotBackground,
    xMax,
    xMin,
    yMax,
    yMin,
    zMax,
    zMin,
  ]);

  const config: Partial<Config> = useMemo(
    () => ({
      responsive: true,
      displaylogo: false,
      scrollZoom,
      editable,
      doubleClick: 'reset',
      modeBarButtonsToRemove: exportEnabled ? [] : ['toImage'],
      toImageButtonOptions: exportEnabled
        ? {
            format: exportFormat,
            filename: 'grapher-plot-3d',
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

  if (data.length === 0) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-lg shadow-lg border"
        style={containerStyle}
      >
        <p style={emptyTextStyle}>Add a 3D equation to visualize</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg shadow-lg border" style={containerStyle}>
      <PlotlyChart
        ref={plotRef}
        data={data}
        layout={layout}
        config={config}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
