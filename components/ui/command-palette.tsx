"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useState, useRef, useMemo, useCallback } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";

import { useUIStore } from "@/stores";
import type { CommandAction } from "@/types";

interface CommandPaletteProps {
  commands: CommandAction[];
}

export function CommandPalette({ commands }: CommandPaletteProps) {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const commandMap = useMemo(() => {
    return new Map(commands.map((command) => [command.id, command]));
  }, [commands]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setQuery("");
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      setOpen(nextOpen);
    },
    [setOpen]
  );

  const execute = useCallback(
    (action: CommandAction) => {
      try {
        action.action();
      } catch (error) {
        const description =
          error instanceof Error ? error.message : "The selected command failed to run.";
        toast.error("Command failed.", { description });
      }
      setOpen(false);
    },
    [setOpen]
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm" />
        <Dialog.Content
          ref={dialogRef}
          className="fixed left-1/2 top-[20vh] z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-border bg-background shadow-2xl"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Command
            label="Command palette"
            className="flex flex-col"
            loop
            filter={(value, search, keywords) => {
              const haystack = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase();
              return haystack.includes(search.toLowerCase()) ? 1 : 0;
            }}
          >
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search size={16} strokeWidth={1.5} className="text-muted" />
              <Command.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder="Type a command..."
                className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted outline-none focus-visible:outline-none"
              />
              <Dialog.Close asChild>
                <button
                  className="text-muted hover:text-foreground"
                  aria-label="Close command palette"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </Dialog.Close>
            </div>

            <Command.List className="scrollbar-none max-h-64 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
                No commands found
              </Command.Empty>

              {commands.map((cmd) => (
                <Command.Item
                  key={cmd.id}
                  value={cmd.label}
                  keywords={[cmd.shortcut ?? "", cmd.id]}
                  onSelect={() => execute(commandMap.get(cmd.id) ?? cmd)}
                  className="flex cursor-default items-center justify-between rounded-lg px-3 py-2.5 text-sm text-foreground/70 outline-none transition-colors data-[selected=true]:bg-accent/10 data-[selected=true]:text-foreground"
                >
                  <span>{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-muted">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
