"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function Dropdown({ value, options, onChange, ariaLabel, className }: DropdownProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Select.Root value={value} onValueChange={onChange}>
        <Select.Trigger
          aria-label={ariaLabel}
          className="flex min-w-28 items-center justify-between gap-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground transition-colors hover:bg-foreground/[0.03]"
        >
          <Select.Value placeholder="Select" />
          <Select.Icon>
            <ChevronDown size={14} strokeWidth={1.75} className="text-muted" />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={4}
            className="z-50 min-w-28 overflow-hidden rounded border border-border bg-background py-1 shadow-lg"
          >
            <Select.Viewport>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex w-full cursor-default items-center justify-between px-2 py-1 text-left text-xs text-foreground outline-none data-[highlighted]:bg-foreground/[0.05] data-[disabled]:cursor-not-allowed data-[disabled]:text-muted/40"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={12} strokeWidth={2} className="text-foreground" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
