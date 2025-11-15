import type { ThemeTokens } from "@/types";

export type ThemeTokenName = keyof ThemeTokens | string;

export const themeVar = (token: ThemeTokenName, fallback?: string) =>
  fallback ? `var(--theme-${String(token)}, ${fallback})` : `var(--theme-${String(token)})`;
