"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { themes, type ResolvedThemeName, type ThemeName } from "./presets";
import type { ThemeTokens } from "@/types";

type ThemeContextValue = {
  themeName: ThemeName;
  resolvedTheme: ResolvedThemeName;
  theme: ThemeTokens;
  setTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyThemeVariables = (tokens: ThemeTokens, resolvedTheme: ResolvedThemeName) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  Object.entries(tokens).forEach(([token, value]) => {
    if (typeof value === "undefined") {
      root.style.removeProperty(`--theme-${token}`);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => {
        root.style.setProperty(`--theme-${token}-${index}`, entry);
      });
      root.style.setProperty(`--theme-${token}-count`, String(value.length));
      return;
    }

    if (typeof value === "string") {
      root.style.setProperty(`--theme-${token}`, value);
    }
  });

  root.dataset.theme = resolvedTheme;
  const scheme = tokens.colorScheme ?? "light";
  root.dataset.colorScheme = scheme;
  root.style.colorScheme = scheme;
  root.style.setProperty("--theme-colorScheme", scheme);
};

const hasTheme = (name: string): name is ResolvedThemeName =>
  themes.realNames.includes(name as ResolvedThemeName);

export const ThemeProvider = ({
  children,
  initialTheme = "system",
}: {
  children: ReactNode;
  initialTheme?: ThemeName;
}) => {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);
  const [systemPreference, setSystemPreference] = useState<ResolvedThemeName>(
    themes.defaultRealTheme
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const computePreference = (matchesDark: boolean): ResolvedThemeName => {
      if (matchesDark && hasTheme("dark")) return "dark";
      if (!matchesDark && hasTheme("light")) return "light";
      return themes.defaultRealTheme;
    };

    const updatePreference = (matchesDark: boolean) => {
      setSystemPreference(computePreference(matchesDark));
    };

    updatePreference(media.matches);

    const listener = (event: MediaQueryListEvent) => updatePreference(event.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    media.addListener(listener);
    return () => media.removeListener(listener);
  }, []);

  const resolvedTheme: ResolvedThemeName = useMemo(() => {
    if (themeName === "system") {
      return systemPreference;
    }
    return themeName as ResolvedThemeName;
  }, [themeName, systemPreference]);

  const theme = useMemo(() => themes.tokens[resolvedTheme], [resolvedTheme]);

  useEffect(() => {
    applyThemeVariables(theme, resolvedTheme);
  }, [theme, resolvedTheme]);

  const setTheme = useCallback(
    (name: ThemeName) => {
      if (!themes.names.includes(name)) return;
      setThemeName(name);
    },
    [setThemeName]
  );

  const value = useMemo(
    () => ({ themeName, resolvedTheme, theme, setTheme }),
    [themeName, resolvedTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
