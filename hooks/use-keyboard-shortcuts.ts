"use client";

import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

import { useExpressionStore, useGraphStore, useSolverStore, useUIStore } from "@/stores";

/**
 * Global keyboard shortcut handler.
 * Registered once at the app shell level to avoid duplicate listeners.
 */
export function useKeyboardShortcuts() {
  const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable ||
      target.tagName === "MATH-FIELD"
    );
  };

  useHotkeys(
    "mod+z",
    (e) => {
      e.preventDefault();
      useExpressionStore.temporal.getState().undo();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "mod+shift+z",
    (e) => {
      e.preventDefault();
      useExpressionStore.temporal.getState().redo();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "mod+k",
    (e) => {
      e.preventDefault();
      useUIStore.getState().toggleCommandPalette();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "mod+enter",
    (e) => {
      e.preventDefault();
      useExpressionStore.getState().add();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "mod+shift+s",
    (e) => {
      e.preventDefault();
      useSolverStore.getState().toggleVisible();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "mod+shift+2",
    (e) => {
      e.preventDefault();
      useGraphStore.getState().setMode("2d");
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "mod+shift+3",
    (e) => {
      e.preventDefault();
      const state = useGraphStore.getState();
      if (!state.threeDSupported) {
        toast.warning("3D mode is not supported on this device/browser.");
        return;
      }
      state.setMode("3d");
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "mod+/",
    (e) => {
      e.preventDefault();
      const kbd = (window as unknown as Record<string, unknown>).mathVirtualKeyboard as
        | { visible: boolean; show: () => void; hide: () => void }
        | undefined;
      if (!kbd) {
        toast.warning("Math keyboard is not available yet.");
        return;
      }
      if (kbd.visible) {
        kbd.hide();
      } else {
        kbd.show();
      }
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "mod+d",
    (e) => {
      e.preventDefault();
      const { activeId, duplicate } = useExpressionStore.getState();
      if (activeId) duplicate(activeId);
    },
    { enableOnFormTags: true }
  );

  useHotkeys("backspace", (e) => {
    if (isEditableTarget(e.target)) return;
    const { activeId, expressions, remove } = useExpressionStore.getState();
    if (!activeId) return;
    const active = expressions.find((ex) => ex.id === activeId);
    if (active && active.latex === "") {
      e.preventDefault();
      remove(activeId);
    }
  });

  useHotkeys("shift+/", (e) => {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
    useUIStore.getState().setShortcutsOverlayOpen(true);
  });
}
