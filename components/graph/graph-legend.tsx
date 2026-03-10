"use client";

import { useState } from "react";
import { List } from "lucide-react";

import { latexToExpr } from "@/lib/latex";
import { useExpressionStore } from "@/stores";

export function GraphLegend() {
  const expressions = useExpressionStore((s) => s.expressions);
  const [open, setOpen] = useState(false);

  const visible = expressions.filter(
    (e) => e.visible && e.latex && e.kind !== "slider",
  );

  if (visible.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 z-10">
      {open ? (
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-background/90 p-2 shadow-sm backdrop-blur">
          <button
            className="mb-1 self-end text-xs text-muted hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Hide
          </button>
          {visible.map((expr) => {
            const display =
              expr.label ||
              latexToExpr(expr.latex).slice(0, 24) ||
              expr.kind;
            return (
              <div key={expr.id} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: expr.color }}
                />
                <span className="truncate text-xs text-foreground/80">
                  {display}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 text-muted shadow-sm backdrop-blur transition-colors hover:text-foreground"
          aria-label="Show legend"
          title="Show legend"
        >
          <List size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
