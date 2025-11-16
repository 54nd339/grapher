import { MIN_KEYBOARD_WIDTH, MIN_KEYBOARD_HEIGHT } from "./mathKeyboardConfig";

/**
 * Clamps keyboard size to ensure it meets minimum dimensions
 */
export function clampKeyboardSize(
  width: number,
  height: number,
  minWidth = MIN_KEYBOARD_WIDTH,
  minHeight = MIN_KEYBOARD_HEIGHT
): { width: number; height: number } {
  return {
    width: Math.max(minWidth, width),
    height: Math.max(minHeight, height),
  };
}
