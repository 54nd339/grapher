"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Panel, Group, Separator, type PanelImperativeHandle } from "react-resizable-panels";
import { useShallow } from "zustand/react/shallow";

import { MathKeyboardToggle } from "@/components/editor";
import { GraphViewport } from "@/components/graph";
import { Toolbar, Sidebar, MobileSheet, ShortcutsOverlay } from "@/components/layout";
import { SolverPanel } from "@/components/solver";
import { CommandPalette } from "@/components/ui";
import { buildCommands } from "@/lib/commands";
import { useExpressionStore, useGraphStore, useSolverStore, useUIStore } from "@/stores";
import { useMathKeyboard, useKeyboardShortcuts, useKonamiCode, useShareLink } from "@/hooks";
import type { ExpressionKind } from "@/types";

const DataImportModal = dynamic(
  () => import("@/components/editor").then((m) => m.DataImportModal),
  { ssr: false },
);

export default function Home() {
  useKeyboardShortcuts();
  useKonamiCode();
  useShareLink();

  const { visible: kbVisible, toggle: kbToggle } = useMathKeyboard();
  const { setTheme, resolvedTheme } = useTheme();

  const addExpression = useExpressionStore((s) => s.add);
  const setGraphMode = useGraphStore((s) => s.setMode);
  const toggleSolver = useSolverStore((s) => s.toggleVisible);
  const {
    toggleSidebar,
    sidebarCollapsed,
    setSidebarCollapsed,
    dataImportOpen,
    setDataImportOpen,
    setFractalMode,
  } = useUIStore(
    useShallow((s) => ({
      toggleSidebar: s.toggleSidebar,
      sidebarCollapsed: s.sidebarCollapsed,
      setSidebarCollapsed: s.setSidebarCollapsed,
      dataImportOpen: s.dataImportOpen,
      setDataImportOpen: s.setDataImportOpen,
      setFractalMode: s.setFractalMode,
    })),
  );
  const { toggleTangentLine, togglePolarGrid } = useGraphStore(
    useShallow((s) => ({
      toggleTangentLine: s.toggleTangentLine,
      togglePolarGrid: s.togglePolarGrid,
    })),
  );
  const sidebarPanelRef = useRef<PanelImperativeHandle>(null);

  useEffect(() => {
    const panel = sidebarPanelRef.current;
    if (!panel) return;
    if (sidebarCollapsed) panel.collapse();
    else panel.expand();
  }, [sidebarCollapsed]);

  const addTemplate = useCallback((latex: string, kind: string) => {
    addExpression();
    const exprs = useExpressionStore.getState().expressions;
    const last = exprs[exprs.length - 1];
    if (last) {
      useExpressionStore.getState().update(last.id, { latex, kind: kind as ExpressionKind });
    }
  }, [addExpression]);

  const commands = useMemo(
    () =>
      buildCommands({
        addExpression,
        setGraphMode,
        toggleSolver,
        toggleTheme: () =>
          setTheme(resolvedTheme === "dark" ? "light" : "dark"),
        toggleSidebar,
        addTemplate,
        openDataImport: () => setDataImportOpen(true),
        setFractalMode,
        toggleTangentLine,
        togglePolarGrid,
      }),
    [addExpression, setGraphMode, toggleSolver, setTheme, resolvedTheme, toggleSidebar, addTemplate, setDataImportOpen, setFractalMode, toggleTangentLine, togglePolarGrid]
  );

  return (
    <div id="main-content" className="flex h-dvh flex-col overflow-hidden bg-background">
      <Toolbar />

      <div className="relative flex-1 overflow-hidden">
        {/* Desktop/tablet: resizable panels */}
        <div className="hidden h-full md:block">
          <Group orientation="horizontal">
            <Panel
              panelRef={sidebarPanelRef}
              defaultSize="22%"
              minSize="15%"
              maxSize="40%"
              collapsible
              collapsedSize="0%"
              onResize={(size) => {
                const collapsed = size.asPercentage === 0;
                if (collapsed !== sidebarCollapsed) setSidebarCollapsed(collapsed);
              }}
            >
              <Sidebar />
            </Panel>

            <Separator className="w-px bg-border hover:w-1 hover:bg-accent/30 transition-all" />

            <Panel defaultSize="78%">
              <GraphViewport />
            </Panel>
          </Group>
        </div>

        {/* Mobile: stacked layout with expandable bottom sheet */}
        <div className="flex h-full flex-col md:hidden">
          <div className="flex-1">
            <GraphViewport />
          </div>
          {!sidebarCollapsed && (
            <MobileSheet>
              <Sidebar />
            </MobileSheet>
          )}
        </div>

        {/* Solver drawer overlays the graph */}
        <SolverPanel />
      </div>

      {/* Math keyboard toggle -- fixed bottom-right */}
      <div className="fixed bottom-4 right-4 z-20 md:bottom-6 md:right-6">
        <MathKeyboardToggle visible={kbVisible} onToggle={kbToggle} />
      </div>

      {/* Overlays */}
      <CommandPalette commands={commands} />
      <ShortcutsOverlay />
      {dataImportOpen && <DataImportModal onClose={() => setDataImportOpen(false)} />}
    </div>
  );
}
