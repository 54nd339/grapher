"use client";

import { Keyboard } from "lucide-react";

import { IconButton } from "@/components/ui";

interface MathKeyboardToggleProps {
  visible: boolean;
  onToggle: () => void;
}

/**
 * Toggles the MathLive virtual keyboard visibility.
 * The hook (useMathKeyboard) handles MathLive API calls and
 * state sync -- this component is purely presentational.
 */
export function MathKeyboardToggle({
  visible,
  onToggle,
}: MathKeyboardToggleProps) {
  return (
    <IconButton
      label={visible ? "Hide math keyboard" : "Show math keyboard"}
      onClick={onToggle}
      className={visible ? "text-accent" : ""}
      data-math-kb-toggle="true"
    >
      <Keyboard size={18} strokeWidth={1.5} />
    </IconButton>
  );
}
