import { create } from "zustand";

interface UIState {
  commandPaletteOpen: boolean;
  sidebarCollapsed: boolean;
  shortcutsOverlayOpen: boolean;
  tableOpen: boolean;
  dataImportOpen: boolean;
  fractalMode: "off" | "mandelbrot" | "julia";
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setShortcutsOverlayOpen: (open: boolean) => void;
  toggleTable: () => void;
  setDataImportOpen: (open: boolean) => void;
  setFractalMode: (mode: "off" | "mandelbrot" | "julia") => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  sidebarCollapsed: false,
  shortcutsOverlayOpen: false,
  tableOpen: false,
  dataImportOpen: false,
  fractalMode: "off",

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setShortcutsOverlayOpen: (open) => set({ shortcutsOverlayOpen: open }),
  toggleTable: () => set((s) => ({ tableOpen: !s.tableOpen })),
  setDataImportOpen: (open) => set({ dataImportOpen: open }),
  setFractalMode: (mode) => set({ fractalMode: mode }),
}));

