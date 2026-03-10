"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Drawer } from "vaul";

interface MobileSheetProps {
  children: ReactNode;
}

type SnapPoint = 0.08 | 0.5 | 0.9;
const SNAP_POINTS: SnapPoint[] = [0.08, 0.5, 0.9];

export function MobileSheet({ children }: MobileSheetProps) {
  const [snap, setSnap] = useState<SnapPoint>(0.5);

  const handleToggle = useMemo(
    () => () => {
      setSnap((current) => {
        if (current === 0.08) return 0.5;
        if (current === 0.5) return 0.9;
        return 0.08;
      });
    },
    []
  );

  useHotkeys(
    "esc",
    () => {
      if (snap !== 0.08) {
        setSnap(0.08);
      }
    },
    {},
    [snap]
  );

  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      snapPoints={SNAP_POINTS}
      activeSnapPoint={snap}
      setActiveSnapPoint={(next) => setSnap((next ?? 0.5) as SnapPoint)}
    >
      <Drawer.Portal>
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-40 flex h-[90vh] flex-col rounded-t-xl border-t border-border bg-background outline-none md:hidden">
          <Drawer.Title className="sr-only">Expression panel</Drawer.Title>
          <button
            className="flex flex-col items-center justify-center py-2"
            aria-label={snap === 0.08 ? "Expand panel" : "Collapse panel"}
            onClick={handleToggle}
          >
            <div className="h-1 w-8 rounded-full bg-muted/40" />
          </button>

          <div className="flex-1 overflow-y-auto px-3 pb-4">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
