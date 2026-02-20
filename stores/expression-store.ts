import { temporal } from "zundo";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { GRAPH_COLORS } from "@/lib/constants";
import type { Expression, ExpressionKind, Folder } from "@/types";

interface ExpressionState {
  expressions: Expression[];
  folders: Folder[];
  activeId: string | null;
  add: (folderId?: string) => void;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Pick<Expression, "latex" | "kind" | "color" | "visible" | "label" | "sliderConfig" | "folderId" | "points" | "paramRange" | "regressionType">>) => void;
  setActive: (id: string | null) => void;
  duplicate: (id: string) => void;
  hydrate: (expressions: Expression[]) => void;
  updateSliderValue: (id: string, value: number) => void;
  reorder: (fromIndex: number, toIndex: number) => void;
  addFolder: () => void;
  toggleFolder: (id: string) => void;
  removeFolder: (id: string) => void;
}

let counter = 0;

function nextExpressionId(existingIds: Set<string>): string {
  let id = `expr-${counter + 1}`;
  while (existingIds.has(id)) {
    counter += 1;
    id = `expr-${counter + 1}`;
  }
  counter += 1;
  return id;
}

function ensureUniqueExpressionIds(expressions: Expression[]): Expression[] {
  const used = new Set<string>();
  return expressions.map((expression, index) => {
    if (!used.has(expression.id)) {
      used.add(expression.id);
      return expression;
    }

    const id = nextExpressionId(used);
    used.add(id);
    return {
      ...expression,
      id,
      color: expression.color ?? GRAPH_COLORS[index % GRAPH_COLORS.length],
    };
  });
}

function createExpression(index: number, existingIds: Set<string>): Expression {
  const id = nextExpressionId(existingIds);
  existingIds.add(id);
  return {
    id,
    latex: "",
    kind: "algebraic" as ExpressionKind,
    color: GRAPH_COLORS[index % GRAPH_COLORS.length],
    visible: true,
  };
}

let folderCounter = 0;

export const useExpressionStore = create<ExpressionState>()(
  temporal(
    persist(
      (set) => ({
        expressions: [createExpression(0, new Set())],
        folders: [],
        activeId: null,

        add: (folderId) =>
          set((s) => {
            const expr = createExpression(
              s.expressions.length,
              new Set(s.expressions.map((e) => e.id)),
            );
            if (folderId) expr.folderId = folderId;
            return { expressions: [...s.expressions, expr], activeId: expr.id };
          }),

        remove: (id) =>
          set((s) => ({
            expressions: s.expressions.filter((e) => e.id !== id),
            activeId: s.activeId === id ? null : s.activeId,
          })),

        update: (id, patch) =>
          set((s) => ({
            expressions: s.expressions.map((e) =>
              e.id === id ? { ...e, ...patch } : e
            ),
          })),

        setActive: (id) => set({ activeId: id }),

        duplicate: (id) =>
          set((s) => {
            const source = s.expressions.find((e) => e.id === id);
            if (!source) return s;
            const existingIds = new Set(s.expressions.map((e) => e.id));
            const nextId = nextExpressionId(existingIds);
            const copy: Expression = {
              ...source,
              id: nextId,
              color: GRAPH_COLORS[s.expressions.length % GRAPH_COLORS.length],
            };
            return { expressions: [...s.expressions, copy] };
          }),

        hydrate: (expressions) => {
          const normalized = ensureUniqueExpressionIds(expressions);
          const maxId = normalized.reduce((max, e) => {
            const n = parseInt(e.id.replace("expr-", ""), 10);
            return Number.isNaN(n) ? max : Math.max(max, n);
          }, 0);
          if (maxId >= counter) counter = maxId;
          set({ expressions: normalized, activeId: null });
        },

        updateSliderValue: (id, value) =>
          set((s) => ({
            expressions: s.expressions.map((e) =>
              e.id === id && e.sliderConfig
                ? { ...e, sliderConfig: { ...e.sliderConfig, value } }
                : e
            ),
          })),

        reorder: (fromIndex, toIndex) =>
          set((s) => {
            const items = [...s.expressions];
            const [moved] = items.splice(fromIndex, 1);
            items.splice(toIndex, 0, moved);
            return { expressions: items };
          }),

        addFolder: () =>
          set((s) => ({
            folders: [
              ...s.folders,
              {
                id: `folder-${++folderCounter}`,
                name: `Folder ${s.folders.length + 1}`,
                collapsed: false,
              },
            ],
          })),

        toggleFolder: (id) =>
          set((s) => ({
            folders: s.folders.map((f) =>
              f.id === id ? { ...f, collapsed: !f.collapsed } : f,
            ),
          })),

        removeFolder: (id) =>
          set((s) => ({
            folders: s.folders.filter((f) => f.id !== id),
            expressions: s.expressions.map((e) =>
              e.folderId === id ? { ...e, folderId: undefined } : e,
            ),
          })),
      }),
      {
        name: "grapher-expressions",
        partialize: (state) => ({
          expressions: state.expressions,
          folders: state.folders,
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) return;

          const normalized = ensureUniqueExpressionIds(state.expressions);
          if (normalized.some((e, i) => e.id !== state.expressions[i]?.id)) {
            useExpressionStore.setState({ expressions: normalized });
          }

          // counter resets to 1 on module load but persisted IDs may be higher
          const maxId = normalized.reduce((max, e) => {
            const n = parseInt(e.id.replace("expr-", ""), 10);
            return Number.isNaN(n) ? max : Math.max(max, n);
          }, 0);
          if (maxId >= counter) counter = maxId;

          const maxFolder = state.folders.reduce((max, f) => {
            const n = parseInt(f.id.replace("folder-", ""), 10);
            return Number.isNaN(n) ? max : Math.max(max, n);
          }, 0);
          if (maxFolder >= folderCounter) folderCounter = maxFolder;

          // persist rehydration triggers a state update that temporal captures
          // as an undoable action. Clear it so first Ctrl+Z doesn't undo hydration.
          useExpressionStore.temporal.getState().clear();
        },
      },
    ),
    {
      // Only track expression/folder mutations for undo -- ignore activeId
      partialize: (state) => ({
        expressions: state.expressions,
        folders: state.folders,
      }),
      limit: 50,
    },
  ),
);
