import type { CommandAction } from "@/types";

import { EXPRESSION_TEMPLATES } from "./templates";

/**
 * Build the command palette actions.
 * Accepts store actions as params to avoid importing stores in a lib file.
 */
export function buildCommands(actions: {
  addExpression: () => void;
  setGraphMode: (mode: "2d" | "3d") => void;
  toggleSolver: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  addTemplate?: (latex: string, kind: string) => void;
  openDataImport?: () => void;
  setFractalMode?: (mode: "off" | "mandelbrot" | "julia") => void;
  toggleTangentLine?: () => void;
  togglePolarGrid?: () => void;
}): CommandAction[] {
  const cmds: CommandAction[] = [
    {
      id: "add-expression",
      label: "Add Expression",
      shortcut: "Ctrl+Enter",
      action: actions.addExpression,
    },
    {
      id: "switch-2d",
      label: "Switch to 2D",
      shortcut: "Ctrl+Shift+2",
      action: () => actions.setGraphMode("2d"),
    },
    {
      id: "switch-3d",
      label: "Switch to 3D",
      shortcut: "Ctrl+Shift+3",
      action: () => actions.setGraphMode("3d"),
    },
    {
      id: "toggle-solver",
      label: "Toggle Solver",
      shortcut: "Ctrl+Shift+S",
      action: actions.toggleSolver,
    },
    {
      id: "toggle-theme",
      label: "Toggle Dark Mode",
      action: actions.toggleTheme,
    },
    {
      id: "toggle-sidebar",
      label: "Toggle Sidebar",
      action: actions.toggleSidebar,
    },
  ];

  if (actions.openDataImport) {
    cmds.push({
      id: "import-data",
      label: "Import Data (CSV/TSV)",
      action: actions.openDataImport,
    });
  }

  if (actions.setFractalMode) {
    cmds.push(
      {
        id: "fractal-mandelbrot",
        label: "Explore: Mandelbrot Set",
        action: () => actions.setFractalMode!("mandelbrot"),
      },
      {
        id: "fractal-julia",
        label: "Explore: Julia Set",
        action: () => actions.setFractalMode!("julia"),
      },
      {
        id: "fractal-off",
        label: "Close Fractal Explorer",
        action: () => actions.setFractalMode!("off"),
      },
    );
  }

  if (actions.toggleTangentLine) {
    cmds.push({
      id: "toggle-tangent",
      label: "Toggle Tangent Line",
      action: actions.toggleTangentLine,
    });
  }

  if (actions.togglePolarGrid) {
    cmds.push({
      id: "toggle-polar-grid",
      label: "Toggle Polar Grid",
      action: actions.togglePolarGrid,
    });
  }

  if (actions.addTemplate) {
    for (const t of EXPRESSION_TEMPLATES) {
      cmds.push({
        id: `template-${t.name.toLowerCase().replace(/\s+/g, "-")}`,
        label: `Template: ${t.name}`,
        action: () => actions.addTemplate!(t.latex, t.kind),
      });
    }
  }

  return cmds;
}
