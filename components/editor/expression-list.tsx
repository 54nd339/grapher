"use client";

import { useId } from "react";
import { PenLine, FolderPlus, Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useExpressionStore } from "@/stores";

import { ExpressionRow } from "./expression-row";
import { FolderRow } from "./folder-row";
import { PointsRow } from "./points-row";
import { SliderRow } from "./slider-row";

function ExpressionItem({ expression }: { expression: import("@/types").Expression }) {
  if (expression.kind === "slider") return <SliderRow expression={expression} />;
  if (expression.kind === "points") return <PointsRow expression={expression} />;
  return <ExpressionRow expression={expression} />;
}

export function ExpressionList() {
  const dndId = useId();
  const { expressions, folders, add, reorder, addFolder } = useExpressionStore(
    useShallow((s) => ({
      expressions: s.expressions,
      folders: s.folders,
      add: s.add,
      reorder: s.reorder,
      addFolder: s.addFolder,
    })),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (expressions.length === 0 && folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <PenLine size={24} className="text-muted" strokeWidth={1.5} />
        <p className="text-sm text-muted">Add an expression to get started</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => add()}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted/60 transition-colors hover:text-muted"
          >
            <Plus size={12} strokeWidth={1.5} />
            Add expression
          </button>
          <button
            onClick={addFolder}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted/60 transition-colors hover:text-muted"
          >
            <FolderPlus size={12} strokeWidth={1.5} />
            Add folder
          </button>
        </div>
      </div>
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = expressions.findIndex((e) => e.id === active.id);
    const toIndex = expressions.findIndex((e) => e.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorder(fromIndex, toIndex);
    }
  }

  // Ungrouped expressions (no folderId)
  const ungrouped = expressions.filter((e) => !e.folderId);

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={expressions.map((e) => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-1">
          {/* Folders with their expressions */}
          {folders.map((folder) => {
            const children = expressions.filter((e) => e.folderId === folder.id);
            return (
              <FolderRow key={folder.id} folder={folder}>
                {children.map((expr) => (
                  <ExpressionItem key={expr.id} expression={expr} />
                ))}
              </FolderRow>
            );
          })}

          {/* Ungrouped expressions */}
          {ungrouped.map((expr) => (
            <ExpressionItem key={expr.id} expression={expr} />
          ))}

          {/* Quick-add buttons */}
          <div className="mt-1 flex items-center justify-center gap-3">
            <button
              onClick={() => add()}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted/60 transition-colors hover:text-muted"
            >
              <Plus size={12} strokeWidth={1.5} />
              Add expression
            </button>
            <button
              onClick={addFolder}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted/60 transition-colors hover:text-muted"
            >
              <FolderPlus size={12} strokeWidth={1.5} />
              Add folder
            </button>
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}
