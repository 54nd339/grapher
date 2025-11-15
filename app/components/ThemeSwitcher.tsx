"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/theme/ThemeProvider";
import { themes, type ThemeName, type ResolvedThemeName } from "@/theme/presets";
import { themeVar } from "@/theme/themeVars";

const STORAGE_KEY = "ui-theme";

const getPreviewTokens = (name: ThemeName, resolvedTheme: ResolvedThemeName) => {
  if (name === "system") {
    return themes.tokens[resolvedTheme];
  }
  return themes.tokens[name as ResolvedThemeName];
};

export default function ThemeSwitcher() {
  const { themeName, resolvedTheme, setTheme } = useTheme();
  const themeList = useMemo(() => [...themes.names], []);
  const [open, setOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  const hydratedRef = useRef(false);

  // hydrate from localStorage once on mount
  useEffect(() => {
    if (hydratedRef.current || typeof window === "undefined") return;
    hydratedRef.current = true;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored && themeList.includes(stored)) {
      setTheme(stored);
    }
  }, [setTheme, themeList]);

  // persist whenever theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, themeName);
  }, [themeName]);

  // close dropdown on outside click
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!switcherRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectTheme = (name: ThemeName) => {
    setTheme(name);
    setOpen(false);
  };

  const dropdownStyle = {
    background: themeVar("surface"),
    borderColor: themeVar("border"),
    boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
  } as const;

  const buttonStyle = {
    background: themeVar("surface"),
    borderColor: themeVar("border"),
    color: themeVar("text"),
  } as const;

  return (
    <div ref={switcherRef} className="relative" aria-expanded={open}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Theme settings"
        className="w-10 h-10 rounded-full border flex items-center justify-center transition-all glow-button"
        style={buttonStyle}
        data-active="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 3.75A8.25 8.25 0 1 0 19.5 15a2.25 2.25 0 0 0-2.25-2.25H15a1.5 1.5 0 0 1-1.5-1.5V9A5.25 5.25 0 0 0 8.25 3.75h-.75Z"
          />
          <circle cx="9" cy="8.25" r=".75" />
          <circle cx="12" cy="6.75" r=".75" />
          <circle cx="15" cy="8.25" r=".75" />
          <circle cx="13.5" cy="11.25" r=".75" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl border p-3 z-50"
          style={dropdownStyle}
          role="menu"
        >
          <div className="text-xs uppercase tracking-wider mb-2" style={{ color: themeVar("textMuted") }}>
            Theme
          </div>
          <div className="flex flex-col gap-2">
            {themeList.map((name) => {
              const active = name === themeName;
              const tokens = getPreviewTokens(name as ThemeName, resolvedTheme);
              const palette = Array.isArray(tokens?.equationPalette)
                ? tokens.equationPalette.slice(0, 4)
                : undefined;
              return (
                <button
                  key={name}
                  type="button"
                  className="flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition-all glow-button"
                  style={{
                    borderColor: active ? themeVar("primary") : themeVar("border"),
                    background: active ? themeVar("surfaceAlt") : themeVar("surface"),
                    color: themeVar("text"),
                  }}
                  data-active={active}
                  onClick={() => selectTheme(name as ThemeName)}
                  role="menuitemradio"
                  aria-checked={active}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-medium">
                      {themes.displayNames[name as ThemeName] ?? name}
                    </span>
                    {name === "system" && (
                      <span className="text-xs" style={{ color: themeVar("textMuted") }}>
                        Following {themes.displayNames[resolvedTheme]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {palette?.map((color, index) => (
                      <span
                        key={`${name}-swatch-${index}`}
                        className="block w-3 h-3 rounded-full"
                        style={{ background: color }}
                      />
                    ))}
                    {active && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-4 h-4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4 10-10" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
