"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface MathFieldProps {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  className?: string;
  virtualKeyboardMode?: "manual" | "onfocus" | "off";
  autoFocus?: boolean;
}

const DEFAULT_CLASS = "w-full rounded-md border-none bg-transparent px-1 text-sm text-foreground outline-none";

// Singleton: ensures fontsDirectory is set before any <math-field> is created.
let mathLiveReady: Promise<void> | null = null;
export function ensureMathLive(): Promise<void> {
  if (!mathLiveReady) {
    mathLiveReady = import("mathlive").then(async (ml) => {
      ml.MathfieldElement.fontsDirectory = "/fonts/mathlive";
      ml.MathfieldElement.soundsDirectory = null;

      const isLargeScreen = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
      (ml.MathfieldElement as unknown as { virtualKeyboardMode?: "manual" | "onfocus" | "off" }).virtualKeyboardMode = isLargeScreen ? "manual" : "onfocus";
      if (typeof window !== "undefined") {
        const win = window as unknown as {
          mathVirtualKeyboardPolicy?: "manual" | "auto";
          mathVirtualKeyboard?: { policy?: "manual" | "auto" };
        };
        win.mathVirtualKeyboardPolicy = isLargeScreen ? "manual" : "auto";
        if (win.mathVirtualKeyboard) {
          win.mathVirtualKeyboard.policy = isLargeScreen ? "manual" : "auto";
        }
      }
      await customElements.whenDefined("math-field");
    });
  }
  return mathLiveReady;
}

export function MathField({
  value,
  onChange,
  placeholder,
  className,
  virtualKeyboardMode = "manual",
  autoFocus = false,
}: MathFieldProps) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  // Prevents setting .value while MathLive is processing a keystroke
  const userEditing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    ensureMathLive().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // override MathLive inline shortcuts to prevent "in" → ∈ (breaks "inv", "int")
  // and add solver function names so they render as \operatorname{...} instead of
  // being treated as implicit multiplication of individual variables.
  useEffect(() => {
    if (!ready) return;
    const el = ref.current as HTMLElement & {
      inlineShortcuts: Record<string, string>;
      menuItems: Array<{ id?: string }>;
    } | null;
    if (!el) return;
    const isLargeScreen = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
    (el as unknown as { virtualKeyboardMode?: string }).virtualKeyboardMode = isLargeScreen ? "manual" : "onfocus";
    (el as unknown as { virtualKeyboardToggle?: string }).virtualKeyboardToggle = isLargeScreen ? "hidden" : "manual";

    const defaults = { ...el.inlineShortcuts };
    delete defaults["in"];
    el.inlineShortcuts = {
      ...defaults,
      "inv": "\\operatorname{inv}",
      "det": "\\det",
      "cross": "\\operatorname{cross}",
      "dot": "\\operatorname{dot}",
      "norm": "\\operatorname{norm}",
      "eigs": "\\operatorname{eigs}",
    };

    // Flatten Insert submenu to top-level so items are one click away
    const insertItem = el.menuItems.find((item) => item.id === "insert") as
      { submenu?: Array<{ id?: string }> } | undefined;
    el.menuItems = insertItem?.submenu ?? [];
  }, [ready, virtualKeyboardMode]);

  const handleInput = useCallback(
    (e: Event) => {
      const target = e.currentTarget as HTMLElement & { value: string; hasFocus?: () => boolean };

      // MathLive manual keyboard broadcasts inputs to all instances sometimes.
      // Ignore input events if this math-field does not currently have focus.
      if (typeof target.hasFocus === "function" && !target.hasFocus()) return;

      userEditing.current = true;
      onChange(target.value);
      requestAnimationFrame(() => { userEditing.current = false; });
    },
    [onChange],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("input", handleInput);
    return () => el.removeEventListener("input", handleInput);
  }, [handleInput, ready]);

  useEffect(() => {
    if (!ready || userEditing.current) return;
    const el = ref.current;
    if (!el) return;
    if ((el as unknown as { value: string }).value !== value) {
      (el as unknown as { value: string }).value = value;
    }
  }, [value, ready]);

  useEffect(() => {
    if (!ready || !autoFocus) return;
    const el = ref.current;
    if (!el) return;
    const frameId = requestAnimationFrame(() => {
      if (ref.current !== el || !el.isConnected) return;
      try {
        el.focus();
      } catch {
        // MathLive can throw during teardown while expression row type switches.
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, [ready, autoFocus]);

  // Render placeholder until mathlive is loaded to avoid font race condition.
  if (!ready) {
    return (
      <div className={`${className ?? DEFAULT_CLASS} min-h-6`}>
        <span className="text-muted/40">{placeholder}</span>
      </div>
    );
  }

  return (
    <math-field
      ref={ref}
      math-virtual-keyboard-policy={virtualKeyboardMode}
      placeholder={placeholder}
      className={className ?? DEFAULT_CLASS}
    />
  );
}
