"use client";

import { GRAPH_COLORS } from "@/lib/constants";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-1.5 p-1" role="radiogroup" aria-label="Expression color">
      {GRAPH_COLORS.map((color) => (
        <button
          key={color}
          role="radio"
          aria-checked={value === color}
          onClick={() => onChange(color)}
          className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
            value === color ? "border-foreground" : "border-transparent"
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
}
