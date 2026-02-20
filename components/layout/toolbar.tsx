"use client";

import { useState, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  HelpCircle,
  Share2,
  Check,
  Calculator,
  Download,
  Upload,
  PanelLeft,
} from "lucide-react";
import { toast } from "sonner";

import { IconButton, ThemeToggle } from "@/components/ui";
import { useGraphStore, useSolverStore, useUIStore, useExpressionStore } from "@/stores";
import type { Expression, GraphMode } from "@/types";

export function Toolbar() {
  const { mode, threeDSupported, setMode } = useGraphStore(
    useShallow((s) => ({ mode: s.mode, threeDSupported: s.threeDSupported, setMode: s.setMode })),
  );
  const toggleSolver = useSolverStore((s) => s.toggleVisible);
  const { setShortcutsOpen, toggleSidebar, sidebarCollapsed } = useUIStore(
    useShallow((s) => ({
      setShortcutsOpen: s.setShortcutsOverlayOpen,
      toggleSidebar: s.toggleSidebar,
      sidebarCollapsed: s.sidebarCollapsed,
    })),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const expressions = useExpressionStore.getState().expressions;
    const data = expressions.map((e) => ({
      latex: e.latex,
      color: e.color,
      kind: e.kind,
      ...(e.sliderConfig ? { sliderConfig: e.sliderConfig } : {}),
      ...(e.label ? { label: e.label } : {}),
    }));
    const encoded = btoa(JSON.stringify(data));
    const url = `${window.location.origin}${window.location.pathname}?e=${encoded}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy share link.", {
        description: "Clipboard access may be blocked in this browser context.",
      });
    }
  }, []);

  const handleExport = useCallback(() => {
    try {
      const expressions = useExpressionStore.getState().expressions;
      const json = JSON.stringify({ version: 1, expressions }, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "grapher-workspace.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Workspace exported.");
    } catch {
      toast.error("Failed to export workspace.");
    }
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          const exprs: Expression[] = data.expressions ?? data;
          if (Array.isArray(exprs) && exprs.length > 0) {
            useExpressionStore.getState().hydrate(exprs);
            toast.success("Workspace imported.", {
              description: `${exprs.length} expression${exprs.length === 1 ? "" : "s"} loaded.`,
            });
            return;
          }
          toast.warning("Imported file has no expressions.", {
            description: "Please choose a valid Grapher workspace JSON file.",
          });
        } catch {
          toast.error("Invalid workspace file.", {
            description: "The selected file is not valid JSON.",
          });
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read import file.");
      };
      reader.readAsText(file);
      // Reset input so the same file can be re-imported
      e.target.value = "";
    },
    [],
  );

  const modes: GraphMode[] = threeDSupported ? ["2d", "3d"] : ["2d"];

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
      {/* Left: Logo + sidebar toggle */}
      <div className="flex items-center gap-2">
        <span className="text-base font-semibold tracking-tight text-foreground">
          Grapher
        </span>
        <IconButton
          label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          onClick={toggleSidebar}
          className="inline-flex"
        >
          <PanelLeft size={18} strokeWidth={1.5} />
        </IconButton>
      </div>

      {/* Center: Mode pill */}
      <div className="flex items-center rounded-lg bg-surface p-0.5" role="group" aria-label="Graph mode">
        {modes.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`rounded-md px-3 py-1 text-xs font-medium uppercase transition-colors ${mode === m
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
              }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <IconButton label="Toggle solver" onClick={toggleSolver}>
          <Calculator size={18} strokeWidth={1.5} />
        </IconButton>

        {/* Export/Import/Help — hidden on small screens */}
        <div className="hidden items-center gap-1 sm:flex">
          <IconButton label="Export workspace" onClick={handleExport}>
            <Download size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton label="Import workspace" onClick={handleImport}>
            <Upload size={18} strokeWidth={1.5} />
          </IconButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          <IconButton
            label="Keyboard shortcuts"
            onClick={() => setShortcutsOpen(true)}
          >
            <HelpCircle size={18} strokeWidth={1.5} />
          </IconButton>
        </div>

        <ThemeToggle />
        <IconButton
          label={copied ? "Copied!" : "Share"}
          onClick={handleShare}
        >
          {copied ? (
            <Check size={18} strokeWidth={1.5} className="text-green-500" />
          ) : (
            <Share2 size={18} strokeWidth={1.5} />
          )}
        </IconButton>
        <span aria-live="polite" className="sr-only">
          {copied ? "Link copied to clipboard" : ""}
        </span>
      </div>
    </header>
  );
}
