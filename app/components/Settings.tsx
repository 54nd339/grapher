'use client';

/**
 * Settings panel for graph configuration
 */

import { useAppStore } from '../lib/store';
import type { GraphMode } from '../types';

export default function Settings() {
  const { graphSettings, updateGraphSettings, selectedMode, setSelectedMode } = useAppStore();

  const modes: { value: GraphMode; label: string }[] = [
    { value: '2d', label: '2D Graph' },
    { value: '3d', label: '3D Graph' },
    { value: 'parametric', label: 'Parametric' },
    { value: 'polar', label: 'Polar' },
    { value: 'implicit', label: 'Implicit' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>

      {/* Graph Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Graph Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setSelectedMode(mode.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                       ${selectedMode === mode.value
                         ? 'bg-blue-600 text-white'
                         : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                       }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* X Axis Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          X-Axis Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              value={graphSettings.xMin}
              onChange={(e) => updateGraphSettings({ xMin: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Min"
            />
          </div>
          <div>
            <input
              type="number"
              value={graphSettings.xMax}
              onChange={(e) => updateGraphSettings({ xMax: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Y Axis Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Y-Axis Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              value={graphSettings.yMin}
              onChange={(e) => updateGraphSettings({ yMin: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Min"
            />
          </div>
          <div>
            <input
              type="number"
              value={graphSettings.yMax}
              onChange={(e) => updateGraphSettings({ yMax: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Z Axis Range (for 3D) */}
      {selectedMode === '3d' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Z-Axis Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={graphSettings.zMin}
                onChange={(e) => updateGraphSettings({ zMin: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Min"
              />
            </div>
            <div>
              <input
                type="number"
                value={graphSettings.zMax}
                onChange={(e) => updateGraphSettings({ zMax: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Max"
              />
            </div>
          </div>
        </div>
      )}

      {/* Display Options */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Display Options
        </label>
        
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={graphSettings.gridEnabled}
            onChange={(e) => updateGraphSettings({ gridEnabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Grid</span>
        </label>
      </div>
    </div>
  );
}
