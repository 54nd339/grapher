"use client";

import { useTheme } from "@/theme/ThemeProvider";
import { useMathKeyboard } from "@/hooks/useMathKeyboard";
import { KEYBOARD_OFFSET } from "@/lib/mathKeyboardConfig";
import type { MathKeyboardMode } from "@/types";

export interface MathKeyboardProps {
  mode: MathKeyboardMode;
  onInsert: (text: string) => void;
}

export default function MathKeyboard({ mode, onInsert }: MathKeyboardProps) {
  const { theme } = useTheme();
  const { visible, toggleVisible, position, size, handleDragStart, handleResizeStart, sections, handleKeyClick } =
    useMathKeyboard({ mode, onInsert });

  const bg = theme.surfaceAlt || theme.surface || "rgba(15,23,42,0.98)";
  const border = theme.borderMuted || "rgba(148,163,184,0.4)";
  const text = theme.text || "#e5e7eb";
  const accent = theme.primary || "#38bdf8";

  if (!visible) {
    // Show a minimal collapsed state with just the toggle button
    return (
      <div
        className="mt-3 rounded-xl border shadow-xl p-2 fixed z-40"
        style={{
          background: bg,
          borderColor: border,
          color: text,
          bottom: `${KEYBOARD_OFFSET + position.y}px`,
          right: `${KEYBOARD_OFFSET - position.x}px`,
          width: 'auto',
          height: 'auto',
        }}
      >
        <button
          type="button"
          onClick={toggleVisible}
          className="px-3 py-1.5 rounded-full border text-xs font-medium"
          style={{ borderColor: border, background: 'transparent', color: text }}
        >
          Show Keyboard
        </button>
      </div>
    );
  }

  return (
    <div
      className="mt-3 rounded-xl border shadow-xl p-2 sm:p-3 space-y-2 custom-scrollbar touch-pan-y select-none fixed z-40"
      style={{
        background: bg,
        borderColor: border,
        color: text,
        bottom: `${KEYBOARD_OFFSET + position.y}px`,
        right: `${KEYBOARD_OFFSET - position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        maxWidth: 'min(100%, 480px)',
      }}
    >
      <div
        className="flex items-center justify-between text-[0.65rem] uppercase tracking-wide opacity-80 cursor-move mb-1"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <span>Math Keyboard ({mode === "latex" ? "LaTeX" : "Standard"})</span>
        <button
          type="button"
          onClick={toggleVisible}
          className="px-2 py-1 rounded-full border text-[0.65rem]"
          style={{ borderColor: border, background: 'transparent', color: text }}
        >
          Hide
        </button>
      </div>
      {/* Resize handles */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-2 cursor-ew-resize"
        onMouseDown={(e) => handleResizeStart("right", e)}
        onTouchStart={(e) => handleResizeStart("right", e)}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-2 cursor-ns-resize"
        onMouseDown={(e) => handleResizeStart("bottom", e)}
        onTouchStart={(e) => handleResizeStart("bottom", e)}
      />
      <div
        className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize"
        onMouseDown={(e) => handleResizeStart("corner", e)}
        onTouchStart={(e) => handleResizeStart("corner", e)}
      />
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="text-[0.65rem] font-semibold opacity-70">{section.title}</div>
            <div className="grid grid-cols-5 gap-1.5">
              {section.keys.map((k) => (
                <button
                  key={k.label + k.insert}
                  type="button"
                  onClick={() => handleKeyClick(k)}
                  className="px-2 py-1.5 rounded-lg text-xs sm:text-[0.75rem] font-medium border touch-feedback active:scale-95 whitespace-nowrap overflow-hidden text-ellipsis gpu-layer text-left"
                  aria-label={k.aria || k.label}
                  style={{
                    borderColor: border,
                    background: "rgba(15,23,42,0.4)",
                    color: text,
                  }}
                >
                  <span style={{ color: accent }}>{k.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
