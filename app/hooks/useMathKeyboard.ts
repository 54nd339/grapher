"use client";

import { useCallback, useState } from "react";
import type { MathKeyboardKeyDef, UseMathKeyboardOptions, UseMathKeyboardResult } from "@/types";
import { DEFAULT_KEYBOARD_SIZE } from "@/lib/mathKeyboardConfig";
import { useKeyboardPosition } from "./useKeyboardPosition";
import { useKeyboardDrag } from "./useKeyboardDrag";
import { useKeyboardResize } from "./useKeyboardResize";
import { useKeyboardSections } from "./useKeyboardSections";

/**
 * Main hook that orchestrates all keyboard functionality
 */
export function useMathKeyboard({ mode, onInsert }: UseMathKeyboardOptions): UseMathKeyboardResult {
  const [visible, setVisible] = useState(true);
  const [size, setSize] = useState<{ width: number; height: number }>(DEFAULT_KEYBOARD_SIZE);

  const { position, setPosition } = useKeyboardPosition();
  const sections = useKeyboardSections(mode);
  const { handleDragStart } = useKeyboardDrag({
    position,
    onPositionChange: setPosition,
  });
  const { handleResizeStart } = useKeyboardResize({
    size,
    onSizeChange: setSize,
  });

  const toggleVisible = useCallback(() => {
    setVisible((v) => !v);
  }, []);

  const handleKeyClick = useCallback(
    (k: MathKeyboardKeyDef) => {
      onInsert(k.insert);
    },
    [onInsert]
  );

  return {
    visible,
    toggleVisible,
    position,
    size,
    handleDragStart,
    handleResizeStart,
    sections,
    handleKeyClick,
  };
}
