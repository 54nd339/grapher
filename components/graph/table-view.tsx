"use client";

import { useMemo, useState, useEffect } from "react";
import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Dropdown } from "@/components/ui";
import { latexToExpr } from "@/lib/latex";
import { compileExpressionLatex, getSliderSymbolFromLatex, toPlainExpression, safeEval } from "@/lib/math";
import { useExpressionStore, useUIStore } from "@/stores";

export function TableView() {
  const { tableOpen, toggleTable } = useUIStore(
    useShallow((s) => ({ tableOpen: s.tableOpen, toggleTable: s.toggleTable })),
  );
  const { expressions, activeId, setActive } = useExpressionStore(
    useShallow((s) => ({ expressions: s.expressions, activeId: s.activeId, setActive: s.setActive })),
  );

  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [step, setStep] = useState(1);

  const plottableExpressions = useMemo(
    () =>
      expressions.filter(
        (e) =>
          e.latex &&
          e.kind !== "slider" &&
          e.kind !== "points" &&
          e.kind !== "implicit" &&
          e.kind !== "parametric" &&
          e.kind !== "polar" &&
          e.kind !== "differential" &&
          e.kind !== "inequality",
      ),
    [expressions],
  );

  useEffect(() => {
    if (!tableOpen || plottableExpressions.length === 0) return;
    const hasActivePlottable = plottableExpressions.some((e) => e.id === activeId);
    if (!hasActivePlottable) {
      setActive(plottableExpressions[0].id);
    }
  }, [tableOpen, plottableExpressions, activeId, setActive]);

  const activeExpr = expressions.find((e) => e.id === activeId);

  const activeExprLabel = useMemo(() => {
    if (!activeExpr) return "Select expression";
    const plain = toPlainExpression(activeExpr.latex, "none");
    return activeExpr.label?.trim() || plain || "Expression";
  }, [activeExpr]);

  const rows = useMemo(() => {
    if (!activeExpr || !activeExpr.latex || activeExpr.kind === "slider")
      return [];

    try {
      const fn = compileExpressionLatex(activeExpr.latex, {
        mode: "graph-2d",
        allowUserFunctions: true,
      });
      if (!fn) return [];

      const scope: Record<string, number> = {};
      for (const e of expressions) {
        if (e.kind === "slider" && e.sliderConfig) {
          const symbol = getSliderSymbolFromLatex(e.latex);
          if (symbol) scope[symbol] = e.sliderConfig.value;
        }
      }

      const safeStep = Math.max(step, 0.01);
      const result: { x: number; y: number | null }[] = [];
      let finiteCount = 0;
      for (let x = xMin; x <= xMax + safeStep * 0.5; x += safeStep) {
        const roundedX = Math.round(x * 1e6) / 1e6;
        try {
          const y = safeEval(fn, { ...scope, x: roundedX });
          const finiteY = typeof y === "number" && isFinite(y) ? y : null;
          if (finiteY !== null) finiteCount += 1;
          result.push({
            x: roundedX,
            y: finiteY,
          });
        } catch {
          result.push({ x: roundedX, y: null });
        }
      }
      return finiteCount > 0 ? result : [];
    } catch {
      return [];
    }
  }, [activeExpr, expressions, xMin, xMax, step]);

  if (!tableOpen) return null;

  return (
    <div className="absolute right-0 top-0 z-20 flex h-full w-full max-w-56 flex-col border-l border-border bg-background/95 backdrop-blur sm:w-56">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-foreground">
          Table of Values
        </span>
        <button
          onClick={toggleTable}
          className="text-muted hover:text-foreground"
          aria-label="Close table"
        >
          <X size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Range configuration */}
      <div className="flex items-center gap-1 border-b border-border/50 px-3 py-1.5">
        <label className="text-[10px] text-muted">x:</label>
        <input
          type="number"
          value={xMin}
          onChange={(e) => setXMin(Number(e.target.value))}
          className="w-12 rounded border border-border bg-transparent px-1 py-0.5 text-[10px] text-foreground"
        />
        <span className="text-[10px] text-muted">to</span>
        <input
          type="number"
          value={xMax}
          onChange={(e) => setXMax(Number(e.target.value))}
          className="w-12 rounded border border-border bg-transparent px-1 py-0.5 text-[10px] text-foreground"
        />
        <span className="text-[10px] text-muted">Δ</span>
        <input
          type="number"
          value={step}
          min={0.01}
          step={0.1}
          onChange={(e) => setStep(Number(e.target.value))}
          className="w-10 rounded border border-border bg-transparent px-1 py-0.5 text-[10px] text-foreground"
        />
      </div>

      <div className="border-b border-border/50 px-3 py-1.5">
        <div className="flex items-center gap-1">
          <label className="shrink-0 text-[10px] text-muted">expr:</label>
          <Dropdown
            value={activeExpr?.id ?? ""}
            options={plottableExpressions.map((expr, index) => {
              const plain = latexToExpr(expr.latex).trim();
              const optionLabel = expr.label?.trim() || plain || `Expression ${index + 1}`;
              return { value: expr.id, label: optionLabel };
            })}
            onChange={setActive}
            ariaLabel="Select expression"
            className="min-w-0 flex-1"
          />
          {plottableExpressions.length === 0 && (
            <span className="truncate text-[10px] text-muted">{activeExprLabel}</span>
          )}
        </div>
      </div>

      {!activeExpr || plottableExpressions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted">
          Select an expression to view its table
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4 text-center text-xs text-muted">
          Cannot evaluate expression
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="sticky top-0 bg-background px-3 py-1.5 text-left font-medium">
                  x
                </th>
                <th className="sticky top-0 bg-background px-3 py-1.5 text-right font-medium">
                  f(x)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const prevY = i > 0 ? rows[i - 1].y : null;
                const signChange =
                  row.y !== null &&
                  prevY !== null &&
                  ((row.y >= 0 && prevY < 0) || (row.y < 0 && prevY >= 0));
                return (
                  <tr
                    key={row.x}
                    className={`border-b border-border/50 ${signChange ? "bg-accent/10" : ""
                      }`}
                  >
                    <td className="px-3 py-1 text-foreground">{row.x}</td>
                    <td className="px-3 py-1 text-right text-foreground/80">
                      {row.y !== null ? row.y.toFixed(4) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
