"use client";

import { useMemo } from "react";
import type { MathKeyboardMode } from "@/types";
import { buildCalcKeys, buildCommonKeys, buildMiscKeys, buildTrigKeys } from "@/lib/mathKeyboardKeys";

/**
 * Builds keyboard sections based on the current mode
 */
export function useKeyboardSections(mode: MathKeyboardMode) {
  const sections = useMemo(() => {
    const commonKeys = buildCommonKeys(mode);
    const trigKeys = buildTrigKeys(mode);
    const calcKeys = buildCalcKeys(mode);
    const miscKeys = buildMiscKeys(mode);

    return [
      { title: "Common", keys: commonKeys },
      { title: "Trig / Log", keys: trigKeys },
      { title: "Calculus", keys: calcKeys },
      { title: "Structure", keys: miscKeys },
    ];
  }, [mode]);

  return sections;
}

