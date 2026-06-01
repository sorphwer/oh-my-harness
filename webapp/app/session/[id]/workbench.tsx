"use client";

import { useMemo, useState } from "react";
import { WizardDag } from "@/components/WizardDag";
import { AgentCanvas } from "@/components/AgentCanvas";
import {
  STEP_GRAPH,
  computeStatuses,
  type StepId,
} from "@/lib/steps";
import type { Brief } from "@/lib/session-store";

export default function SessionWorkbench(props: {
  sessionId: string;
  brief: Brief;
  initialDoneSteps: StepId[];
}) {
  const [doneSteps, setDoneSteps] = useState<Set<StepId>>(
    new Set(props.initialDoneSteps),
  );
  const [selected, setSelected] = useState<StepId | null>(() => {
    const ready = STEP_GRAPH.find(
      (n) =>
        !props.initialDoneSteps.includes(n.id) &&
        n.dependsOn.every((d) => props.initialDoneSteps.includes(d)),
    );
    return ready?.id ?? null;
  });
  const [outDir, setOutDir] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);

  const statuses = useMemo(
    () =>
      computeStatuses(
        doneSteps,
        selected ? new Set([selected]) : new Set(),
      ),
    [doneSteps, selected],
  );

  const allDone = useMemo(
    () => STEP_GRAPH.every((s) => doneSteps.has(s.id)),
    [doneSteps],
  );

  const onCompleted = (stepId: StepId) => {
    setDoneSteps((prev) => {
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
    const nextReady = STEP_GRAPH.find(
      (n) =>
        !doneSteps.has(n.id) &&
        n.id !== stepId &&
        n.dependsOn.every((d) => doneSteps.has(d) || d === stepId),
    );
    setSelected(nextReady?.id ?? null);
  };

  const runCompile = async () => {
    setCompiling(true);
    setCompileError(null);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: props.sessionId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { outDir: string };
      setOutDir(data.outDir);
    } catch (err) {
      setCompileError(err instanceof Error ? err.message : String(err));
    } finally {
      setCompiling(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold">{props.brief.displayName}</h1>
            <p className="text-xs text-muted-foreground">
              session <code>{props.sessionId.slice(0, 8)}</code> ·{" "}
              {doneSteps.size}/{STEP_GRAPH.length} steps complete
            </p>
          </div>
          {allDone ? (
            <div className="flex flex-col items-end gap-1">
              {outDir ? (
                <div className="rounded-md border border-node-done bg-node-done/5 px-3 py-1.5 text-xs">
                  ✓ wrote <code>{outDir}</code>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={runCompile}
                  disabled={compiling}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
                >
                  {compiling ? "Compiling…" : "Generate harness"}
                </button>
              )}
              {compileError ? (
                <p className="text-xs text-red-700">{compileError}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      <WizardDag
        statuses={statuses}
        selectedId={selected}
        onSelect={(id) => setSelected(id)}
      />

      <section className="flex-1 bg-muted/20">
        {selected ? (
          <AgentCanvas
            key={selected}
            sessionId={props.sessionId}
            stepId={selected}
            initiallyDone={doneSteps.has(selected)}
            onCompleted={() => onCompleted(selected)}
          />
        ) : (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Click a node in the DAG above to enter that step.
          </div>
        )}
      </section>
    </main>
  );
}
