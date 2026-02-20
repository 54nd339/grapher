"use client";

import { useEffect } from "react";

import { GRAPH_COLORS } from "@/lib/constants";
import { useExpressionStore } from "@/stores";
import type { Expression } from "@/types";

/**
 * Decodes a shared expression URL on mount (?e=<base64>) and hydrates
 * the expression store. Cleans the URL afterwards to prevent re-hydration.
 */
export function useShareLink() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("e");
    if (!encoded) return;
    try {
      const parsed = JSON.parse(atob(encoded)) as Record<string, unknown>[];
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const hydrated = parsed.map((item, i) => ({
        id: `shared-${i}`,
        latex: (item.latex as string) ?? "",
        kind: (item.kind as string) ?? "algebraic",
        color: (item.color as string) ?? GRAPH_COLORS[i % GRAPH_COLORS.length],
        visible: true,
        ...(item.sliderConfig ? { sliderConfig: item.sliderConfig } : {}),
        ...(item.label ? { label: item.label as string } : {}),
        ...(item.paramRange ? { paramRange: item.paramRange } : {}),
        ...(item.points ? { points: item.points } : {}),
        ...(item.folderId ? { folderId: item.folderId as string } : {}),
        ...(item.regressionType
          ? { regressionType: item.regressionType as string }
          : {}),
      })) as Expression[];
      useExpressionStore.getState().hydrate(hydrated);
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      // malformed share URL should not crash the app
    }
  }, []);
}
