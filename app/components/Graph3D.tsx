'use client';

/**
 * 3D Graph component using Plotly.js for interactive 3D visualization
 */

import dynamic from 'next/dynamic';
import { useAppStore } from '../lib/store';
import { mathEngine } from '../lib/mathEngine';
import type { PlotParams } from 'react-plotly.js';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false }) as React.ComponentType<PlotParams>;

export default function Graph3D() {
  const { equations, graphSettings } = useAppStore();
  const { xMin, xMax, yMin, yMax, zMin = -10, zMax = 10 } = graphSettings;

  const data = equations
    .filter((eq) => eq.visible && eq.mode === '3d')
    .map((equation) => {
      try {
        const { x, y, z } = mathEngine.generate3DPoints(
          equation.expression,
          [xMin, xMax],
          [yMin, yMax],
          20 // Reduced resolution for better performance
        );

        return {
          type: 'surface' as const,
          x,
          y,
          z,
          colorscale: [
            [0, equation.color + '40'],
            [1, equation.color],
          ] as [number, string][],
          showscale: false,
          name: equation.expression,
          hovertemplate: 'x: %{x:.2f}<br>y: %{y:.2f}<br>z: %{z:.2f}<extra></extra>',
        };
      } catch (error) {
        console.error('Error generating 3D plot:', error);
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const layout: Partial<PlotParams['layout']> = {
    autosize: true,
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
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
  };

  const config: Partial<PlotParams['config']> = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['toImage' as never],
  };

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900 rounded-lg shadow-lg">
        <p className="text-gray-500">Add a 3D equation to visualize</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <Plot
        data={data}
        layout={layout}
        config={config}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  );
}
