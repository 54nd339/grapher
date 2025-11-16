"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

interface UseKeyboardDragOptions {
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

interface UseKeyboardDragResult {
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void;
}

/**
 * Handles drag functionality for the keyboard
 */
export function useKeyboardDrag({
  position,
  onPositionChange,
}: UseKeyboardDragOptions): UseKeyboardDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; clientX: number; clientY: number } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as React.MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : (e as React.MouseEvent).clientY;
      setIsDragging(true);
      dragStartRef.current = { x: position.x, y: position.y, clientX, clientY };
    },
    [position.x, position.y]
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = clientX - dragStartRef.current.clientX;
      const dy = clientY - dragStartRef.current.clientY;
      // Invert y because the element uses bottom positioning
      onPositionChange({
        x: dragStartRef.current.x + dx,
        y: dragStartRef.current.y - dy,
      });
    },
    [isDragging, onPositionChange]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  // Attach global event listeners for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0]?.clientX ?? 0 : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0]?.clientY ?? 0 : (e as MouseEvent).clientY;
      handleDragMove(clientX, clientY);
    };

    const handleUp = () => {
      handleDragEnd();
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
  }, [isDragging, handleDragMove, handleDragEnd]);

  return { isDragging, handleDragStart };
}

