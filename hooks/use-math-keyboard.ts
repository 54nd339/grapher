"use client";

import { useState, useCallback, useEffect } from "react";

type MathVirtualKeyboard = {
  visible: boolean;
  show: () => void;
  hide: () => void;
  addEventListener: (event: string, cb: () => void) => void;
  removeEventListener: (event: string, cb: () => void) => void;
};

function getKbd(): MathVirtualKeyboard | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as Record<string, unknown>)
    .mathVirtualKeyboard as MathVirtualKeyboard | null;
}

/**
 * Manages MathLive virtual keyboard visibility.
 * Syncs with MathLive's global state via geometrychange events
 * so both the toggle button and Ctrl+/ shortcut stay consistent.
 */
export function useMathKeyboard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const kbd = getKbd();
    if (!kbd) return;

    const sync = () => setVisible(kbd.visible);
    kbd.addEventListener("geometrychange", sync);
    return () => kbd.removeEventListener("geometrychange", sync);
  }, []);

  const toggle = useCallback(() => {
    const kbd = getKbd();
    if (!kbd) return;
    if (kbd.visible) {
      kbd.hide();
    } else {
      kbd.show();
    }
  }, []);

  const show = useCallback(() => getKbd()?.show(), []);
  const hide = useCallback(() => getKbd()?.hide(), []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const keyboard = getKbd();
      if (!keyboard?.visible) return;

      const path = event.composedPath();
      const clickedInsideMathUi = path.some((entry) => {
        if (!(entry instanceof Element)) return false;
        if (entry.matches("math-field")) return true;
        if (entry.matches("math-virtual-keyboard")) return true;
        if (entry.classList.contains("ML__keyboard")) return true;
        if (entry.closest('[data-math-kb-toggle="true"]')) return true;
        return false;
      });

      if (!clickedInsideMathUi) {
        keyboard.hide();
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return { visible, toggle, show, hide } as const;
}
