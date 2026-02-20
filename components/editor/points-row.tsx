"use client";

import { useMemo } from "react";
import { Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useShallow } from "zustand/react/shallow";

import { Dropdown, IconButton } from "@/components/ui";
import { computeRegression, type RegressionResult } from "@/lib/math";
import { useExpressionStore } from "@/stores";
import type { Expression, RegressionType } from "@/types";

interface PointsRowProps {
  expression: Expression;
}

export function PointsRow({ expression }: PointsRowProps) {
  const { activeId, setActive, update, remove } = useExpressionStore(
    useShallow((s) => ({
      activeId: s.activeId,
      setActive: s.setActive,
      update: s.update,
      remove: s.remove,
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = activeId === expression.id;
  const points = useMemo(() => expression.points ?? [], [expression.points]);

  const regressionType = expression.regressionType ?? null;
  const regression: RegressionResult | null = useMemo(() => {
    if (!regressionType || points.length < 2) return null;
    return computeRegression(points, regressionType);
  }, [points, regressionType]);

  function updatePoint(index: number, axis: 0 | 1, value: number) {
    const updated = points.map((p, i) =>
      i === index
        ? (axis === 0 ? [value, p[1]] : [p[0], value]) as [number, number]
        : p,
    );
    update(expression.id, { points: updated });
  }

  function addPoint() {
    update(expression.id, { points: [...points, [0, 0]] });
  }

  function removePoint(index: number) {
    update(expression.id, { points: points.filter((_, i) => i !== index) });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col gap-1 rounded-lg p-1.5 transition-colors ${isActive ? "bg-foreground/5" : "hover:bg-foreground/[0.02]"
        }`}
      onClick={() => setActive(expression.id)}
    >
      <div className="flex items-center gap-2">
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
        <span className="text-xs font-medium text-foreground/80">
          Points ({points.length})
        </span>
        <div className="flex-1" />
        <div className={`flex items-center gap-0.5 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          <IconButton
            label={expression.visible ? "Hide" : "Show"}
            onClick={(e) => {
              e.stopPropagation();
              update(expression.id, { visible: !expression.visible });
            }}
          >
            {expression.visible ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
          </IconButton>
          <IconButton
            label="Delete"
            onClick={(e) => {
              e.stopPropagation();
              remove(expression.id);
            }}
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>

      {isActive && (
        <div className="ml-5 flex flex-col gap-0.5">
          <div className="flex gap-2 text-[10px] text-muted">
            <span className="w-16">x</span>
            <span className="w-16">y</span>
          </div>
          {points.map(([x, y], i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="number"
                value={x}
                onChange={(e) => updatePoint(i, 0, Number(e.target.value))}
                className="w-16 rounded border border-border bg-transparent px-1 py-0.5 text-xs text-foreground"
                onClick={(e) => e.stopPropagation()}
              />
              <input
                type="number"
                value={y}
                onChange={(e) => updatePoint(i, 1, Number(e.target.value))}
                className="w-16 rounded border border-border bg-transparent px-1 py-0.5 text-xs text-foreground"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePoint(i);
                }}
                className="text-muted/40 hover:text-red-500"
                aria-label={`Remove point ${i + 1}`}
              >
                <Trash2 size={10} strokeWidth={1.5} />
              </button>
            </div>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addPoint();
            }}
            className="mt-0.5 flex items-center gap-1 text-[10px] text-muted/60 hover:text-muted"
          >
            <Plus size={10} strokeWidth={1.5} />
            Add point
          </button>

          {/* Regression selector */}
          {points.length >= 2 && (
            <div className="mt-1 flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-muted">Fit:</label>
                <Dropdown
                  value={regressionType ?? "none"}
                  onChange={(val) => {
                    update(expression.id, {
                      regressionType: val === "none" ? undefined : (val as RegressionType),
                    });
                  }}
                  ariaLabel="Select regression fit"
                  className="text-[10px]"
                  options={[
                    { value: "none", label: "None" },
                    { value: "linear", label: "Linear" },
                    { value: "quadratic", label: "Quadratic" },
                    { value: "exponential", label: "Exponential" },
                  ]}
                />
              </div>
              {regression && (
                <div className="text-[10px] text-muted">
                  <span>{regression.equation}</span>
                  <span className="ml-1 text-muted/60">(R² = {regression.r2.toFixed(4)})</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
