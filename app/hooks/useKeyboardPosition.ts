"use client";

import { useEffect, useState } from "react";
import { KEYBOARD_POSITION_STORAGE_KEY } from "@/lib/mathKeyboardConfig";

/**
 * Manages keyboard position state and persistence
 */
export function useKeyboardPosition() {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load position from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEYBOARD_POSITION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { x: number; y: number };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Persist position to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(KEYBOARD_POSITION_STORAGE_KEY, JSON.stringify(position));
    } catch {
      // ignore storage errors
    }
  }, [position]);

  return { position, setPosition };
}

