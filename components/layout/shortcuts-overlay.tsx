"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { IconButton } from "@/components/ui";
import { useUIStore } from "@/stores";

const SHORTCUTS = [
  { keys: "Ctrl + K", description: "Command palette" },
  { keys: "Ctrl + Enter", description: "Add expression" },
  { keys: "Ctrl + Z", description: "Undo" },
  { keys: "Ctrl + Shift + Z", description: "Redo" },
  { keys: "Ctrl + Shift + S", description: "Toggle solver" },
  { keys: "Ctrl + Shift + 2", description: "Switch to 2D" },
  { keys: "Ctrl + Shift + 3", description: "Switch to 3D" },
  { keys: "Ctrl + /", description: "Toggle math keyboard" },
  { keys: "Ctrl + D", description: "Duplicate expression" },
  { keys: "Backspace", description: "Delete empty expression" },
  { keys: "?", description: "This help overlay" },
] as const;

export function ShortcutsOverlay() {
  const open = useUIStore((s) => s.shortcutsOverlayOpen);
  const setOpen = useUIStore((s) => s.setShortcutsOverlayOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-base font-semibold text-foreground">
              Keyboard Shortcuts
            </Dialog.Title>
            <Dialog.Close asChild>
              <IconButton label="Close" onClick={() => setOpen(false)}>
                <X size={18} strokeWidth={1.5} />
              </IconButton>
            </Dialog.Close>
          </div>

          <div className="space-y-2">
            {SHORTCUTS.map((s) => (
              <div
                key={s.keys}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm text-foreground/70">
                  {s.description}
                </span>
                <kbd className="rounded bg-surface px-2 py-1 font-mono text-xs text-muted">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
