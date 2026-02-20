"use client";

import { X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Tabs, IconButton } from "@/components/ui";
import { SOLVER_TABS } from "@/lib/constants";
import { useSolverStore } from "@/stores";
import type { SolverCategory } from "@/types";

import { SolutionDisplay } from "./solution-display";
import { SolverInput } from "./solver-input";

export function SolverPanel() {
  const { visible, setVisible, activeTab, setActiveTab, result, loading } = useSolverStore(
    useShallow((s) => ({
      visible: s.visible,
      setVisible: s.setVisible,
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      result: s.result,
      loading: s.loading,
    })),
  );

  return (
    <div
      className={`absolute bottom-0 right-0 z-50 m-2 flex w-full max-w-96 flex-col rounded-xl border border-border bg-background shadow-xl transition-all duration-200 ease-out sm:m-4 ${visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
        }`}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between border-b border-border p-3">
        <h2 className="text-sm font-semibold text-foreground">
          Equation Solver
        </h2>
        <IconButton label="Close solver" onClick={() => setVisible(false)}>
          <X size={16} strokeWidth={1.5} />
        </IconButton>
      </div>

      <div className="border-b border-border p-2">
        <Tabs
          tabs={SOLVER_TABS}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as SolverCategory)}
        />
      </div>

      <div className="border-b border-border p-3">
        <SolverInput />
      </div>

      <div className="p-3">
        <SolutionDisplay result={result} loading={loading} category={activeTab} />
      </div>
    </div>
  );
}
