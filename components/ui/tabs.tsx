"use client";

import * as RadixTabs from "@radix-ui/react-tabs";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: readonly Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <RadixTabs.Root value={activeId} onValueChange={onChange}>
      <RadixTabs.List className="scrollbar-none flex gap-1 overflow-x-auto rounded-lg bg-surface p-1" aria-label="Tabs">
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
