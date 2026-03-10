"use client";

import { ExpressionList } from "@/components/editor";

export function Sidebar() {
  return (
    <aside className="flex h-full flex-col bg-surface/50" role="region" aria-label="Expression editor">
      <div className="flex-1 overflow-y-auto p-2">
        <ExpressionList />
      </div>
    </aside>
  );
}
