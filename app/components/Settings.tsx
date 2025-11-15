'use client';

import { useAppStore } from '@/lib/store';
import { settingsStyles } from '@/theme/styles';
import type { GraphMode } from '@/types';

export default function Settings() {
  const { graphSettings, updateGraphSettings, selectedMode, setSelectedMode } = useAppStore();

  const modes: { value: GraphMode; label: string }[] = [
    { value: '2d', label: '2D Graph' },
    { value: '3d', label: '3D Graph' },
    { value: 'parametric', label: 'Parametric' },
    { value: 'polar', label: 'Polar' },
    { value: 'implicit', label: 'Implicit' },
  ];

  const panelStyle = settingsStyles.panel;
  const headingStyle = settingsStyles.heading;
  const labelStyle = settingsStyles.label;
  const inputStyle = settingsStyles.input;
  const buttonStyles = settingsStyles.button;
  const checkboxStyle = settingsStyles.checkbox;

  return (
    <div className="rounded-lg shadow-lg p-6 space-y-4 border" style={panelStyle}>
      <h2 className="text-xl font-bold" style={headingStyle}>Settings</h2>

      {/* Graph Mode */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>
          Graph Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setSelectedMode(mode.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium glow-button transition-all ${
                selectedMode === mode.value ? 'shadow-sm' : 'hover:opacity-80'
              }`}
              data-active={selectedMode === mode.value}
              style={selectedMode === mode.value ? buttonStyles.active : buttonStyles.inactive}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* X Axis Range */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>
          X-Axis Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              value={graphSettings.xMin}
              onChange={(e) => updateGraphSettings({ xMin: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              style={inputStyle}
              placeholder="Min"
            />
          </div>
          <div>
            <input
              type="number"
              value={graphSettings.xMax}
              onChange={(e) => updateGraphSettings({ xMax: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              style={inputStyle}
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Y Axis Range */}
      <div>
        <label className="block text-sm font-medium mb-2" style={labelStyle}>
          Y-Axis Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="number"
              value={graphSettings.yMin}
              onChange={(e) => updateGraphSettings({ yMin: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              style={inputStyle}
              placeholder="Min"
            />
          </div>
          <div>
            <input
              type="number"
              value={graphSettings.yMax}
              onChange={(e) => updateGraphSettings({ yMax: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              style={inputStyle}
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Z Axis Range (for 3D) */}
      {selectedMode === '3d' && (
        <div>
          <label className="block text-sm font-medium mb-2" style={labelStyle}>
            Z-Axis Range
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="number"
                value={graphSettings.zMin}
                onChange={(e) => updateGraphSettings({ zMin: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                style={inputStyle}
                placeholder="Min"
              />
            </div>
            <div>
              <input
                type="number"
                value={graphSettings.zMax}
                onChange={(e) => updateGraphSettings({ zMax: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                style={inputStyle}
                placeholder="Max"
              />
            </div>
          </div>
        </div>
      )}

      {/* Display Options */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={labelStyle}>
          Display Options
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={graphSettings.gridEnabled}
            onChange={(e) => updateGraphSettings({ gridEnabled: e.target.checked })}
            className="w-4 h-4 rounded"
            style={checkboxStyle}
          />
          <span className="text-sm" style={labelStyle}>Show Grid</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={graphSettings.axesEnabled}
            onChange={(e) => updateGraphSettings({ axesEnabled: e.target.checked })}
            className="w-4 h-4 rounded"
            style={checkboxStyle}
          />
          <span className="text-sm" style={labelStyle}>Show Axes</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={graphSettings.labelsEnabled}
            onChange={(e) => updateGraphSettings({ labelsEnabled: e.target.checked })}
            className="w-4 h-4 rounded"
            style={checkboxStyle}
          />
          <span className="text-sm" style={labelStyle}>Show Axis Labels</span>
        </label>
      </div>

      {/* Interaction & Toolbar */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={labelStyle}>
          Interaction & Toolbar
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={graphSettings.scrollZoom}
            onChange={(e) => updateGraphSettings({ scrollZoom: e.target.checked })}
            className="w-4 h-4 rounded"
            style={checkboxStyle}
          />
          <span className="text-sm" style={labelStyle}>Enable Scroll Zoom</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={graphSettings.editable}
            onChange={(e) => updateGraphSettings({ editable: e.target.checked })}
            className="w-4 h-4 rounded"
            style={checkboxStyle}
          />
          <span className="text-sm" style={labelStyle}>Editable Mode</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={graphSettings.exportEnabled}
            onChange={(e) => updateGraphSettings({ exportEnabled: e.target.checked })}
            className="w-4 h-4 rounded"
            style={checkboxStyle}
          />
          <span className="text-sm" style={labelStyle}>Show Export Button</span>
        </label>

        {graphSettings.exportEnabled && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={labelStyle}>
                Export Format
              </label>
              <select
                value={graphSettings.exportFormat}
                onChange={(e) => updateGraphSettings({ exportFormat: e.target.value as typeof graphSettings.exportFormat })}
                className="w-full px-3 py-2 border rounded-lg"
                style={inputStyle}
              >
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Animation */}
      <div className="space-y-3">
        <label className="block text-sm font-medium" style={labelStyle}>
          Animation
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={graphSettings.animationEnabled}
            onChange={(e) => updateGraphSettings({ animationEnabled: e.target.checked })}
            className="w-4 h-4 rounded"
            style={checkboxStyle}
          />
          <span className="text-sm" style={labelStyle}>Smooth transitions</span>
        </label>

        {graphSettings.animationEnabled && (
          <div>
            <label className="block text-xs font-medium mb-1" style={labelStyle}>
              Animation duration (ms)
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={graphSettings.animationDuration}
              onChange={(e) => updateGraphSettings({ animationDuration: Math.max(0, parseInt(e.target.value, 10) || 0) })}
              className="w-full px-3 py-2 border rounded-lg"
              style={inputStyle}
              placeholder="400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
