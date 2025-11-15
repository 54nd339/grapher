import type { ThemeOption, ThemeTokens } from "@/types";
import { auroraTheme } from "./aurora";
import { darkTheme } from "./dark";
import { forestTheme } from "./forest";
import { lightTheme } from "./light";
import { midnightTheme } from "./midnight";
import { neonTheme } from "./neon";
import { pastelTheme } from "./pastel";
import { solarizedDarkTheme } from "./solarizedDark";
import { solarizedLightTheme } from "./solarizedLight";
import { sunsetTheme } from "./sunset";

const DEFAULT_EQUATION_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#6366f1",
] as const;

const isValidColor = (color?: string): color is string =>
  typeof color === "string" && color.trim().length > 0;

const buildEquationPalette = (tokens: ThemeTokens) => {
  if (Array.isArray(tokens.equationPalette) && tokens.equationPalette.length > 0) {
    return [...tokens.equationPalette];
  }

  const orderedSources = [
    tokens.primary,
    tokens.primaryHover,
    tokens.secondary,
    tokens.secondaryHover,
    tokens.primaryGlow,
  ];

  const palette: string[] = [];
  const seen = new Set<string>();

  for (const color of orderedSources) {
    if (!isValidColor(color)) continue;
    const normalized = color.trim();
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    palette.push(normalized);
  }

  if (palette.length) {
    return palette;
  }

  return [...DEFAULT_EQUATION_COLORS];
};

export const themeOptions = [
  darkTheme,
  lightTheme,
  solarizedDarkTheme,
  solarizedLightTheme,
  neonTheme,
  midnightTheme,
  forestTheme,
  sunsetTheme,
  auroraTheme,
  pastelTheme,
] as const satisfies readonly ThemeOption[];

export type ResolvedThemeName = (typeof themeOptions)[number]["name"];

const realNameList = themeOptions.map((theme) => theme.name) as ResolvedThemeName[];

const THEME_NAME_LIST = ["system", ...realNameList] as const;

const themeTokens = themeOptions.reduce<Record<ResolvedThemeName, ThemeTokens>>(
  (acc, option) => {
    acc[option.name] = {
      ...option.tokens,
      equationPalette: buildEquationPalette(option.tokens),
    } satisfies ThemeTokens;
    return acc;
  },
  {} as Record<ResolvedThemeName, ThemeTokens>
);

const displayNameMap = themeOptions.reduce<Record<ResolvedThemeName, string>>(
  (acc, option) => {
    acc[option.name] = option.label;
    return acc;
  },
  {} as Record<ResolvedThemeName, string>
);

export type ThemeName = (typeof THEME_NAME_LIST)[number];

export const themes = {
  options: themeOptions,
  tokens: themeTokens,
  names: THEME_NAME_LIST,
  realNames: realNameList,
  displayNames: {
    system: "System (Auto)",
    ...displayNameMap,
  } as Record<ThemeName, string>,
  defaultRealTheme:
    (realNameList.includes("dark") ? "dark" : realNameList[0]) as ResolvedThemeName,
};
