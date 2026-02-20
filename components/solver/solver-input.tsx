"use client";

import { useShallow } from "zustand/react/shallow";

import { MathField } from "@/components/editor";
import { Button } from "@/components/ui";
import { useSolverStore } from "@/stores";
import { useSolve } from "@/hooks";
import type { SolverCategory } from "@/types";

const PLACEHOLDER_HINTS: Record<SolverCategory, string> = {
  algebra: "x^2 - 4 = 0",
  calculus: "x^3 + 2x",
  trigonometry: "sin(x) = 0.5",
  matrices: "det([[1,2],[3,4]])",
  vectors: "cross([1,2,3], [4,5,6])",
  ode: "dy/dx = x + y",
  statistics: "1, 2, 3, 4, 5, 6",
};

export function SolverInput() {
  const { input, setInput, activeTab, loading } = useSolverStore(
    useShallow((s) => ({ input: s.input, setInput: s.setInput, activeTab: s.activeTab, loading: s.loading })),
  );
  const executeSolve = useSolve();

  return (
    <div className="flex flex-col gap-2">
      <MathField
        value={input}
        onChange={setInput}
        placeholder={PLACEHOLDER_HINTS[activeTab]}
        virtualKeyboardMode="off"
        className="w-full rounded-md border-none bg-transparent px-1 text-base text-foreground outline-none"
      />
      <Button
        variant="primary"
        size="sm"
        onClick={() => executeSolve(activeTab, input)}
        disabled={!input || loading}
      >
        {loading ? "Solving..." : "Solve"}
      </Button>
    </div>
  );
}
