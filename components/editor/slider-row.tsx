"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Play, Pause, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useShallow } from "zustand/react/shallow";

import { IconButton } from "@/components/ui";
import { useExpressionStore } from "@/stores";
import type { Expression } from "@/types";

interface SliderRowProps {
  expression: Expression;
}

/**
 * Snap a value to the nearest step boundary within [min, max].
 */
function snapToStep(value: number, min: number, step: number): number {
  if (step <= 0) return value;
  return min + Math.round((value - min) / step) * step;
}

/**
 * Determine display precision from step size.
 */
function stepDecimals(step: number): number {
  if (step >= 1) return 0;
  return Math.max(0, Math.ceil(-Math.log10(step)));
}

export function SliderRow({ expression }: SliderRowProps) {
  const { update, updateSliderValue, remove, setActive, activeId } = useExpressionStore(
    useShallow((s) => ({
      update: s.update,
      updateSliderValue: s.updateSliderValue,
      remove: s.remove,
      setActive: s.setActive,
      activeId: s.activeId,
    })),
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: expression.id });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = expression.sliderConfig;
  const isActive = activeId === expression.id;
  const rafRef = useRef<number>(0);

  const varName = expression.latex
    ? expression.latex.trim().match(/^([a-wA-W])/)?.[1] ?? "a"
    : "a";

  const [editingValue, setEditingValue] = useState(false);
  const [valueInput, setValueInput] = useState("");

  const handleValueChange = useCallback(
    (value: number) => {
      updateSliderValue(expression.id, value);
    },
    [expression.id, updateSliderValue],
  );

  const handleValueCommit = useCallback(() => {
    if (!config) return;
    const num = Number(valueInput);
    if (isFinite(num)) {
      const clamped = Math.max(config.min, Math.min(config.max, num));
      const snapped = snapToStep(clamped, config.min, config.step);
      updateSliderValue(expression.id, snapped);
    }
    setEditingValue(false);
  }, [config, valueInput, expression.id, updateSliderValue]);

  const toggleAnimation = useCallback(() => {
    if (!config) return;
    update(expression.id, {
      sliderConfig: { ...config, animating: !config.animating },
    });
  }, [expression.id, config, update]);

  useEffect(() => {
    if (!config?.animating) return;

    let lastTime = 0;
    const animate = (time: number) => {
      if (lastTime === 0) lastTime = time;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const current = useExpressionStore.getState().expressions.find(
        (e) => e.id === expression.id,
      );
      if (!current?.sliderConfig?.animating) return;

      const sc = current.sliderConfig;
      let next = sc.value + sc.step * dt * 10;
      if (next > sc.max) next = sc.min;

      updateSliderValue(expression.id, next);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [config?.animating, expression.id, updateSliderValue]);

  if (!config) return null;

  const decimals = stepDecimals(config.step);
  const displayValue = config.value.toFixed(decimals);

  return (
    <div
      ref={setNodeRef}
      style={sortableStyle}
      className={`group flex flex-col gap-1 rounded-lg p-1.5 transition-colors ${isActive ? "bg-foreground/5" : "hover:bg-foreground/[0.02]"
        }`}
      onClick={() => setActive(expression.id)}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <button
          className="shrink-0 cursor-grab touch-none text-muted/40 hover:text-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} strokeWidth={1.5} />
        </button>

        <div
          className="h-6 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: expression.color }}
        />

        {/* Editable value display */}
        {editingValue ? (
          <input
            autoFocus
            type="number"
            value={valueInput}
            step={config.step}
            onChange={(e) => setValueInput(e.target.value)}
            onBlur={handleValueCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleValueCommit();
              if (e.key === "Escape") setEditingValue(false);
            }}
            className="w-20 rounded border border-border bg-transparent px-1 py-0.5 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-accent/50"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            className="min-w-[2rem] text-left text-sm font-medium text-foreground hover:text-accent"
            onClick={(e) => {
              e.stopPropagation();
              setValueInput(displayValue);
              setEditingValue(true);
            }}
            title="Click to edit value"
          >
            {varName} = {displayValue}
          </button>
        )}

        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={config.value}
          onChange={(e) => handleValueChange(Number(e.target.value))}
          className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-accent"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${varName} slider`}
          aria-valuemin={config.min}
          aria-valuemax={config.max}
          aria-valuenow={config.value}
        />

        <div
          className={`flex shrink-0 items-center gap-0.5 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
        >
          <IconButton label={config.animating ? "Pause" : "Play"} onClick={(e) => {
            e.stopPropagation();
            toggleAnimation();
          }}>
            {config.animating ? (
              <Pause size={14} strokeWidth={1.5} />
            ) : (
              <Play size={14} strokeWidth={1.5} />
            )}
          </IconButton>
          <IconButton
            label={expression.visible ? "Hide" : "Show"}
            onClick={(e) => {
              e.stopPropagation();
              update(expression.id, { visible: !expression.visible });
            }}
          >
            {expression.visible ? (
              <Eye size={14} strokeWidth={1.5} />
            ) : (
              <EyeOff size={14} strokeWidth={1.5} />
            )}
          </IconButton>
          <IconButton label="Delete" onClick={(e) => {
            e.stopPropagation();
            remove(expression.id);
          }}>
            <Trash2 size={14} strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>

      {isActive && (
        <div className="ml-3 flex items-center gap-2 text-xs text-muted">
          <label className="flex items-center gap-1">
            min
            <input
              type="number"
              value={config.min}
              onChange={(e) =>
                update(expression.id, {
                  sliderConfig: { ...config, min: Number(e.target.value) },
                })
              }
              className="w-14 rounded border border-border bg-transparent px-1 py-0.5 text-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          </label>
          <label className="flex items-center gap-1">
            max
            <input
              type="number"
              value={config.max}
              onChange={(e) =>
                update(expression.id, {
                  sliderConfig: { ...config, max: Number(e.target.value) },
                })
              }
              className="w-14 rounded border border-border bg-transparent px-1 py-0.5 text-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          </label>
          <label className="flex items-center gap-1">
            step
            <input
              type="number"
              value={config.step}
              step={0.01}
              onChange={(e) => {
                const newStep = Number(e.target.value);
                if (newStep > 0) {
                  const snapped = snapToStep(config.value, config.min, newStep);
                  update(expression.id, {
                    sliderConfig: { ...config, step: newStep, value: snapped },
                  });
                }
              }}
              className="w-14 rounded border border-border bg-transparent px-1 py-0.5 text-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          </label>
        </div>
      )}
    </div>
  );
}
