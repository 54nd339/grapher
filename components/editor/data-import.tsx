"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useCallback, useRef } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

import { parseCSV } from "@/lib/math";
import { useExpressionStore } from "@/stores";

/**
 * Modal for importing CSV/TSV data as plottable points.
 * Supports file drag-and-drop and paste.
 */
export function DataImportModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<[number, number][]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const add = useExpressionStore((s) => s.add);
  const update = useExpressionStore((s) => s.update);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    const points = parseCSV(value);
    setPreview(points.slice(0, 20));
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) handleTextChange(content);
    };
    reader.onerror = () => {
      toast.error("Could not read data file.");
    };
    reader.readAsText(file);
  }, [handleTextChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleImport = useCallback(() => {
    const points = parseCSV(text);
    if (points.length === 0) {
      toast.warning("No valid points found.", {
        description: "Check CSV/TSV format and try again.",
      });
      return;
    }

    // Create a points expression with the parsed data
    const pointStr = points.map(([x, y]) => `(${x},${y})`).join(", ");
    add();
    const exprs = useExpressionStore.getState().expressions;
    const newest = exprs[exprs.length - 1];
    update(newest.id, { latex: pointStr, kind: "points", points });
    toast.success("Data imported.", {
      description: `${points.length} point${points.length === 1 ? "" : "s"} added.`,
    });
    onClose();
  }, [text, add, update, onClose]);

  return (
    <Dialog.Root open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 mx-4 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-border bg-background p-6 shadow-2xl">
          <Dialog.Title className="text-sm font-semibold text-foreground">Import Data</Dialog.Title>
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 text-muted hover:text-foreground" aria-label="Close">
              <X size={16} />
            </button>
          </Dialog.Close>

          <div
            className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-4 text-xs text-muted transition-colors hover:border-accent/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={20} className="mb-2 opacity-50" />
            <p>Drop a CSV/TSV file or click to browse</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={"Paste data here (x,y per line):\n1, 2\n3, 4\n5, 6"}
            className="h-24 w-full resize-none rounded-lg border border-border bg-transparent p-2 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
          />

          {preview.length > 0 && (
            <div className="max-h-24 overflow-y-auto rounded bg-foreground/[0.03] p-2 text-xs text-muted">
              <p className="mb-1 font-medium text-foreground/70">{preview.length}+ points parsed:</p>
              {preview.slice(0, 5).map(([x, y], i) => (
                <span key={i}>({x}, {y}){i < 4 ? ", " : "..."}</span>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={preview.length === 0}
              className="rounded-md bg-accent px-3 py-1.5 text-xs text-white disabled:opacity-40"
            >
              Import {preview.length > 0 ? `(${preview.length} points)` : ""}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
