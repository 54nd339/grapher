import { create } from "zustand";

import type { GraphMode, ViewportBounds } from "@/types";

interface GraphState {
  mode: GraphMode;
  threeDSupported: boolean;
  viewport: ViewportBounds;
  wireframe: boolean;
  gridVisible: boolean;
  axisLabelsVisible: boolean;
  snapToGrid: boolean;
  tangentLineEnabled: boolean;
  analysisOverlayEnabled: boolean;
  interactionOverlayEnabled: boolean;
  curvatureOverlayEnabled: boolean;
  logScaleX: boolean;
  logScaleY: boolean;
  polarGrid: boolean;
  setMode: (mode: GraphMode) => void;
  setThreeDSupported: (supported: boolean) => void;
  setViewport: (viewport: ViewportBounds) => void;
  resetViewport: () => void;
  toggleWireframe: () => void;
  toggleGrid: () => void;
  toggleAxisLabels: () => void;
  toggleSnapToGrid: () => void;
  toggleTangentLine: () => void;
  toggleAnalysisOverlay: () => void;
  toggleInteractionOverlay: () => void;
  toggleCurvatureOverlay: () => void;
  toggleLogScaleX: () => void;
  toggleLogScaleY: () => void;
  togglePolarGrid: () => void;
}

const DEFAULT_VIEWPORT: ViewportBounds = {
  xMin: -10,
  xMax: 10,
  yMin: -7,
  yMax: 7,
};

export const useGraphStore = create<GraphState>((set) => ({
  mode: "2d",
  threeDSupported: true,
  viewport: DEFAULT_VIEWPORT,
  wireframe: false,
  gridVisible: true,
  axisLabelsVisible: true,
  snapToGrid: false,
  tangentLineEnabled: false,
  analysisOverlayEnabled: false,
  interactionOverlayEnabled: false,
  curvatureOverlayEnabled: false,
  logScaleX: false,
  logScaleY: false,
  polarGrid: false,

  setMode: (mode) => set((s) => ({ mode: s.threeDSupported ? mode : "2d" })),
  setThreeDSupported: (supported) =>
    set((s) => ({
      threeDSupported: supported,
      mode: supported ? s.mode : "2d",
    })),
  setViewport: (viewport) =>
    set((s) => {
      const v = s.viewport;
      if (
        v.xMin === viewport.xMin &&
        v.xMax === viewport.xMax &&
        v.yMin === viewport.yMin &&
        v.yMax === viewport.yMax
      )
        return s;
      return { viewport };
    }),
  resetViewport: () => set({ viewport: DEFAULT_VIEWPORT }),
  toggleWireframe: () => set((s) => ({ wireframe: !s.wireframe })),
  toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
  toggleAxisLabels: () => set((s) => ({ axisLabelsVisible: !s.axisLabelsVisible })),
  toggleSnapToGrid: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleTangentLine: () => set((s) => ({ tangentLineEnabled: !s.tangentLineEnabled })),
  toggleAnalysisOverlay: () => set((s) => ({ analysisOverlayEnabled: !s.analysisOverlayEnabled })),
  toggleInteractionOverlay: () => set((s) => ({ interactionOverlayEnabled: !s.interactionOverlayEnabled })),
  toggleCurvatureOverlay: () => set((s) => ({ curvatureOverlayEnabled: !s.curvatureOverlayEnabled })),
  toggleLogScaleX: () => set((s) => ({ logScaleX: !s.logScaleX })),
  toggleLogScaleY: () => set((s) => ({ logScaleY: !s.logScaleY })),
  togglePolarGrid: () => set((s) => ({ polarGrid: !s.polarGrid })),
}));

