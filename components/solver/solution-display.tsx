"use client";

import { useEffect, useRef, useState } from "react";

import { ensureMathLive } from "@/components/editor";
import type { SolverCategory, SolverResult } from "@/types";

interface SolutionDisplayProps {
  result: SolverResult | null;
  loading: boolean;
  category: SolverCategory;
}

function LatexOutput({ latex }: { latex: string }) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureMathLive().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;
    (el as unknown as { value: string }).value = latex;
  }, [latex, ready]);

  if (!ready) {
    return <p className="px-1 font-mono text-sm text-foreground">{latex}</p>;
  }

  return (
    <math-field
      ref={ref}
      read-only
      className="w-full rounded-md border-none bg-transparent px-1 text-sm text-foreground outline-none"
    />
  );
}

export function SolutionDisplay({ result, loading, category }: SolutionDisplayProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    );
  }

  if (!result) {
    return (
      <p className="py-4 text-center text-sm text-muted">
        Enter an expression and click Solve
      </p>
    );
  }

  if (category === "statistics" && !result.error && result.steps && result.steps.length > 0) {
    return (
      <div className="rounded-lg bg-surface p-3">
        <ol className="list-inside list-decimal space-y-1 text-xs text-muted">
          {result.steps.map((step, i) => (
            <li key={i} className="font-mono">
              {step}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`rounded-lg p-3 ${
          result.error ? "bg-red-500/10" : "bg-surface"
        }`}
      >
        {result.error ? (
          <p className="whitespace-pre-line text-sm text-red-500">
            {result.output}
          </p>
        ) : result.outputLatex ? (
          <LatexOutput latex={result.outputLatex} />
        ) : (
          <p className="font-mono text-sm text-foreground">{result.output}</p>
        )}
      </div>
      {result.steps && result.steps.length > 0 && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer hover:text-foreground">
            Show steps
          </summary>
          <ol className="mt-2 list-inside list-decimal space-y-1 pl-2">
            {result.steps.map((step, i) => (
              <li key={i} className="font-mono">
                {step}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
