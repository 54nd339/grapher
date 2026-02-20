"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Trash2, Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { IconButton } from "@/components/ui";
import { useExpressionStore } from "@/stores";
import type { Folder } from "@/types";

interface FolderRowProps {
  folder: Folder;
  children: React.ReactNode;
}

export function FolderRow({ folder, children }: FolderRowProps) {
  const { toggleFolder, removeFolder, add } = useExpressionStore(
    useShallow((s) => ({ toggleFolder: s.toggleFolder, removeFolder: s.removeFolder, add: s.add })),
  );
  const [editing, setEditing] = useState(false);

  // Direct store mutation for folder name since folders don't go through
  // the same update path as expressions
  const renameFolder = (name: string) => {
    const store = useExpressionStore.getState();
    const folders = store.folders.map((f) =>
      f.id === folder.id ? { ...f, name } : f,
    );
    useExpressionStore.setState({ folders });
  };

  return (
    <div className="rounded-lg border border-border/50">
      <div className="flex items-center gap-1 px-1.5 py-1">
        <button
          onClick={() => toggleFolder(folder.id)}
          className="shrink-0 text-muted hover:text-foreground"
          aria-label={folder.collapsed ? "Expand folder" : "Collapse folder"}
        >
          {folder.collapsed ? (
            <ChevronRight size={14} strokeWidth={1.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={1.5} />
          )}
        </button>

        {editing ? (
          <input
            autoFocus
            type="text"
            value={folder.name}
            onChange={(e) => renameFolder(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="min-w-0 flex-1 rounded border border-border bg-transparent px-1 py-0.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            className="min-w-0 flex-1 truncate text-left text-xs font-medium text-foreground/80 hover:text-foreground"
            onDoubleClick={() => setEditing(true)}
          >
            {folder.name}
          </button>
        )}

        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            label="Add expression to folder"
            onClick={() => add(folder.id)}
          >
            <Plus size={12} strokeWidth={1.5} />
          </IconButton>
          <IconButton
            label="Delete folder"
            onClick={() => removeFolder(folder.id)}
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>

      {!folder.collapsed && (
        <div className="flex flex-col gap-0.5 pb-1 pl-3">{children}</div>
      )}
    </div>
  );
}
