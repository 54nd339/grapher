"use client";

import * as Checkbox from "@radix-ui/react-checkbox";
import * as Popover from "@radix-ui/react-popover";
import { Check, Settings } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { useGraphStore } from "@/stores";

export function GraphSettings() {
  const [open, setOpen] = useState(false);

  const {
    gridVisible,
    axisLabelsVisible,
    snapToGrid,
    tangentLineEnabled,
    analysisOverlayEnabled,
    interactionOverlayEnabled,
    curvatureOverlayEnabled,
    polarGrid,
    toggleGrid,
    toggleAxisLabels,
    toggleSnapToGrid,
    toggleTangentLine,
    toggleAnalysisOverlay,
    toggleInteractionOverlay,
    toggleCurvatureOverlay,
    togglePolarGrid,
  } = useGraphStore(
    useShallow((s) => ({
      gridVisible: s.gridVisible,
      axisLabelsVisible: s.axisLabelsVisible,
      snapToGrid: s.snapToGrid,
      tangentLineEnabled: s.tangentLineEnabled,
      analysisOverlayEnabled: s.analysisOverlayEnabled,
      interactionOverlayEnabled: s.interactionOverlayEnabled,
      curvatureOverlayEnabled: s.curvatureOverlayEnabled,
      polarGrid: s.polarGrid,
      toggleGrid: s.toggleGrid,
      toggleAxisLabels: s.toggleAxisLabels,
      toggleSnapToGrid: s.toggleSnapToGrid,
      toggleTangentLine: s.toggleTangentLine,
      toggleAnalysisOverlay: s.toggleAnalysisOverlay,
      toggleInteractionOverlay: s.toggleInteractionOverlay,
      toggleCurvatureOverlay: s.toggleCurvatureOverlay,
      togglePolarGrid: s.togglePolarGrid,
    })),
  );

  const items = [
    { label: "Grid", checked: gridVisible, onChange: toggleGrid },
    { label: "Axis labels", checked: axisLabelsVisible, onChange: toggleAxisLabels },
    { label: "Snap to grid", checked: snapToGrid, onChange: toggleSnapToGrid },
    { label: "Tangent line", checked: tangentLineEnabled, onChange: toggleTangentLine },
    { label: "Analysis overlay", checked: analysisOverlayEnabled, onChange: toggleAnalysisOverlay },
    { label: "Interaction overlay", checked: interactionOverlayEnabled, onChange: toggleInteractionOverlay },
    { label: "Curvature overlay", checked: curvatureOverlayEnabled, onChange: toggleCurvatureOverlay },
    { label: "Polar grid", checked: polarGrid, onChange: togglePolarGrid },
  ] as const;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted shadow-sm backdrop-blur transition-colors hover:text-foreground"
          aria-label="Graph settings"
          title="Graph settings"
        >
          <Settings size={16} strokeWidth={1.5} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content sideOffset={4} align="end" className="z-50 w-48 rounded-lg border border-border bg-background p-3 shadow-lg">
          <h3 className="mb-2 text-xs font-semibold text-foreground">Settings</h3>
          {items.map((item) => (
            <label key={item.label} className="flex items-center justify-between py-1 text-xs text-foreground/80">
              {item.label}
              <Checkbox.Root
                checked={item.checked}
                onCheckedChange={() => item.onChange()}
                className="flex h-3.5 w-3.5 items-center justify-center rounded border border-border bg-background text-accent"
              >
                <Checkbox.Indicator>
                  <Check size={10} strokeWidth={2.5} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </label>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
