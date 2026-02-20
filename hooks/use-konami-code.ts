"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useExpressionStore } from "@/stores";

const KONAMI_SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a",
] as const;

const EASTER_EGG_EXPRESSIONS = [
  {
    latex: String.raw`\left(x^{2}+y^{2}-1\right)^{3}-x^{2}y^{3}=0`,
    color: "#e11d48",
    kind: "implicit" as const,
  },
  {
    latex: String.raw`\sin\left(10\left(x^{2}+y^{2}\right)\right)=\cos\left(10xy\right)`,
    color: "#8b5cf6",
    kind: "implicit" as const,
  },
  {
    latex: String.raw`(x^2 + \frac{9}{4}y^2 + z^2 - 1)^3 - x^2 z^3 - \frac{9}{80}y^2 z^3 = 0`,
    color: "#ef4444",
    kind: "implicit" as const,
  },
];

/**
 * Listens for the Konami code (↑↑↓↓←→←→BA) and injects
 * a set of visually interesting math expressions as a reward.
 */
export function useKonamiCode() {
  const bufferRef = useRef<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const buffer = bufferRef.current;
      buffer.push(e.key);

      // Keep only the last N keys where N = sequence length
      if (buffer.length > KONAMI_SEQUENCE.length) {
        buffer.shift();
      }

      if (buffer.length < KONAMI_SEQUENCE.length) return;

      const match = KONAMI_SEQUENCE.every((key, i) => buffer[i] === key);
      if (!match) return;

      // Reset buffer so it doesn't fire repeatedly
      bufferRef.current = [];

      const { add, update } = useExpressionStore.getState();

      for (const preset of EASTER_EGG_EXPRESSIONS) {
        add();
        const latest = useExpressionStore.getState().expressions;
        const newExpr = latest[latest.length - 1];
        if (newExpr) {
          update(newExpr.id, {
            latex: preset.latex,
            color: preset.color,
            kind: preset.kind,
          });
        }
      }

      toast.success("🎮 Konami Code activated!", {
        description: "Enjoy some math art ✨",
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
