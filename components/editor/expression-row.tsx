"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { useState, useMemo } from "react";
import { Eye, EyeOff, Trash2, Copy, AlertCircle, GripVertical, MoreHorizontal } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useShallow } from "zustand/react/shallow";

import { latexToExpr } from "@/lib/latex";
import { tryParse } from "@/lib/math";
import { useExpressionStore } from "@/stores";
import { useUpdateExpression, useDuplicateExpression, useRemoveExpression } from "@/hooks";
import type { Expression } from "@/types";

import { ColorPicker } from "./color-picker";
import { MathField } from "./math-field";

interface ExpressionRowProps {
  expression: Expression;
}

export function ExpressionRow({ expression }: ExpressionRowProps) {
  const { activeId, setActive, update } = useExpressionStore(
    useShallow((s) => ({ activeId: s.activeId, setActive: s.setActive, update: s.update })),
  );
  const updateWithDetection = useUpdateExpression();
  const duplicate = useDuplicateExpression();
  const remove = useRemoveExpression();

  const isActive = activeId === expression.id;

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

  const [colorOpen, setColorOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [labelEditing, setLabelEditing] = useState(false);

  /* ── Parse error detection ─────────────────────────── */
  const parseResult = useMemo(() => {
    if (!expression.latex) return { valid: true };
    const plain = latexToExpr(expression.latex);
    const cleaned = plain.replace(/^y\s*=\s*/, "");
    return tryParse(cleaned);
  }, [expression.latex]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col gap-0.5 rounded-lg p-1.5 transition-colors ${isActive ? "bg-foreground/5" : "hover:bg-foreground/[0.02]"
        }`}
      onClick={() => setActive(expression.id)}
    >
      <div className="flex items-center gap-0.5">
        {/* Drag handle */}
        <button
          className="shrink-0 cursor-grab touch-none text-muted/40 hover:text-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} strokeWidth={1.5} />
        </button>

        {/* Color accent bar */}
        <Popover.Root open={colorOpen} onOpenChange={setColorOpen}>
          <Popover.Trigger asChild>
            <button
              className="h-8 w-1 shrink-0 rounded-full transition-transform hover:scale-x-150"
              style={{ backgroundColor: expression.color }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Change color"
            />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              side="right"
              align="start"
              sideOffset={8}
              className="z-50 rounded-lg border border-border bg-background p-1 shadow-lg"
            >
              <ColorPicker
                value={expression.color}
                onChange={(color) => {
                  update(expression.id, { color });
                  setColorOpen(false);
                }}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {/* Math input */}
        <div className="min-w-0 flex-1">
          <MathField
            value={expression.latex}
            onChange={(latex) => updateWithDetection(expression.id, latex)}
            placeholder="Enter expression..."
            autoFocus={isActive && expression.latex.trim() === ""}
            className="w-full bg-transparent px-1 text-sm text-foreground outline-none"
          />
        </div>

        {/* Parse error indicator */}
        {!parseResult.valid && (
          <div className="shrink-0" title={parseResult.error}>
            <AlertCircle size={14} className="text-red-500" />
          </div>
        )}

        {/* More menu */}
        <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
              aria-label="Expression options"
            >
              <MoreHorizontal size={14} strokeWidth={1.5} />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" sideOffset={4} className="z-50 w-36 overflow-hidden rounded-lg border border-border bg-background py-1 shadow-lg">
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  update(expression.id, { visible: !expression.visible });
                  setMenuOpen(false);
                }}
                className="flex cursor-default items-center gap-2 px-3 py-1.5 text-xs text-foreground outline-none transition-colors data-[highlighted]:bg-foreground/5"
              >
                {expression.visible ? (
                  <EyeOff size={13} strokeWidth={1.5} />
                ) : (
                  <Eye size={13} strokeWidth={1.5} />
                )}
                {expression.visible ? "Hide" : "Show"}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  duplicate(expression.id);
                  setMenuOpen(false);
                }}
                className="flex cursor-default items-center gap-2 px-3 py-1.5 text-xs text-foreground outline-none transition-colors data-[highlighted]:bg-foreground/5"
              >
                <Copy size={13} strokeWidth={1.5} />
                Duplicate
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={(e) => {
                  e.preventDefault();
                  remove(expression.id);
                  setMenuOpen(false);
                }}
                className="flex cursor-default items-center gap-2 px-3 py-1.5 text-xs text-red-500 outline-none transition-colors data-[highlighted]:bg-red-500/5"
              >
                <Trash2 size={13} strokeWidth={1.5} />
                Delete
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Label -- inline edit shown when active */}
      {isActive && (
        <div className="ml-5 flex items-center gap-1">
          {labelEditing ? (
            <input
              autoFocus
              type="text"
              value={expression.label ?? ""}
              placeholder="Add label..."
              onChange={(e) => update(expression.id, { label: e.target.value })}
              onBlur={() => setLabelEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && setLabelEditing(false)}
              className="w-full rounded border border-border bg-transparent px-1 py-0.5 text-xs text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              className="text-xs text-muted/60 hover:text-muted"
              onClick={(e) => {
                e.stopPropagation();
                setLabelEditing(true);
              }}
            >
              {expression.label || "Add label..."}
            </button>
          )}
        </div>
      )}

      {/* Parameter range -- shown for parametric/polar when active */}
      {isActive && (expression.kind === "parametric" || expression.kind === "polar") && (
        <div className="ml-5 flex items-center gap-2 text-xs text-muted">
          <span>{expression.kind === "polar" ? "θ:" : "t:"}</span>
          <input
            type="number"
            value={expression.paramRange?.[0] ?? 0}
            step={0.1}
            onChange={(e) =>
              update(expression.id, {
                paramRange: [Number(e.target.value), expression.paramRange?.[1] ?? 2 * Math.PI],
              })
            }
            className="w-14 rounded border border-border bg-transparent px-1 py-0.5 text-foreground"
            onClick={(e) => e.stopPropagation()}
          />
          <span>to</span>
          <input
            type="number"
            value={expression.paramRange?.[1] ?? +(2 * Math.PI).toFixed(4)}
            step={0.1}
            onChange={(e) =>
              update(expression.id, {
                paramRange: [expression.paramRange?.[0] ?? 0, Number(e.target.value)],
              })
            }
            className="w-14 rounded border border-border bg-transparent px-1 py-0.5 text-foreground"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
