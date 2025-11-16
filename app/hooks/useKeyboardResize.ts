"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";
import { clampKeyboardSize } from "@/lib/mathKeyboardUtils";
import { MIN_KEYBOARD_HEIGHT, MIN_KEYBOARD_WIDTH } from "@/lib/mathKeyboardConfig";

interface UseKeyboardResizeOptions {
  size: { width: number; height: number };
  onSizeChange: (size: { width: number; height: number }) => void;
}

interface UseKeyboardResizeResult {
  isResizing: boolean;
  handleResizeStart: (
    edge: "right" | "bottom" | "corner",
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => void;
}

/**
 * Handles resize functionality for the keyboard
 */
export function useKeyboardResize({
  size,
  onSizeChange,
}: UseKeyboardResizeOptions): UseKeyboardResizeResult {
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<
    { width: number; height: number; clientX: number; clientY: number; edge: "right" | "bottom" | "corner" } | null
  >(null);

  const handleResizeStart = useCallback(
    (
      edge: "right" | "bottom" | "corner",
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    ) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
      setIsResizing(true);
      resizeStartRef.current = { width: size.width, height: size.height, clientX, clientY, edge };
      e.stopPropagation();
      e.preventDefault();
    },
    [size.height, size.width]
  );

  const handleResizeMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isResizing || !resizeStartRef.current) return;
      const dx = clientX - resizeStartRef.current.clientX;
      const dy = clientY - resizeStartRef.current.clientY;

      let nextWidth = resizeStartRef.current.width;
      let nextHeight = resizeStartRef.current.height;

      if (resizeStartRef.current.edge === "right" || resizeStartRef.current.edge === "corner") {
        nextWidth = resizeStartRef.current.width + dx;
      }
      if (resizeStartRef.current.edge === "bottom" || resizeStartRef.current.edge === "corner") {
        nextHeight = resizeStartRef.current.height + dy;
      }

      onSizeChange(clampKeyboardSize(nextWidth, nextHeight, MIN_KEYBOARD_WIDTH, MIN_KEYBOARD_HEIGHT));
    },
    [isResizing, onSizeChange]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    resizeStartRef.current = null;
  }, []);

  // Attach global event listeners for resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;
      handleResizeMove(clientX, clientY);
    };

    const handleUp = () => {
      handleResizeEnd();
    };

    window.addEventListener("mousemove", handleMove as EventListener);
    window.addEventListener("touchmove", handleMove as EventListener, { passive: false });
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove as EventListener);
      window.removeEventListener("touchmove", handleMove as EventListener);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return { isResizing, handleResizeStart };
}

