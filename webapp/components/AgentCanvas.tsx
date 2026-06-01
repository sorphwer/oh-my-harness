"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Renderer, JSONUIProvider } from "@json-render/react";
import type { UITree } from "@json-render/core";
import { Loader2 } from "lucide-react";
import { getStep, type StepId } from "@/lib/steps";
import { registry } from "@/lib/json-render-registry";
import { streamSSE } from "@/lib/sse";

type AgentFrame =
  | { kind: "init"; sessionId: string }
  | { kind: "text"; delta: string }
  | { kind: "assistantDone"; text: string }
  | { kind: "result"; output: string }
  | { kind: "error"; message: string };

type Status = "idle" | "streaming" | "awaiting" | "saving" | "done" | "error";

function parseSpec(text: string): UITree | null {
  try {
    const parsed = JSON.parse(text);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.root === "string" &&
      parsed.elements &&
      typeof parsed.elements === "object"
    ) {
      return parsed as UITree;
    }
  } catch {
    // partial JSON; ignore
  }
  return null;
}

export function AgentCanvas(props: {
  sessionId: string;
  stepId: StepId;
  initiallyDone: boolean;
  onCompleted: () => void;
}) {
  const step = getStep(props.stepId);
  const [status, setStatus] = useState<Status>(
    props.initiallyDone ? "done" : "idle",
  );
  const [tree, setTree] = useState<UITree | null>(null);
  const [error, setError] = useState<string | null>(null);
  const answers = useRef<Record<string, unknown>>({});

  const startTurn = useCallback(
    async (userMessage?: string) => {
      if (!step.mvpEnabled) return;
      setStatus("streaming");
      setError(null);
      setTree(null);
      let buf = "";

      try {
        await streamSSE(
          `/api/agent/${props.stepId}`,
          { sessionId: props.sessionId, userMessage },
          (raw) => {
            const frame = raw as AgentFrame;
            if (frame.kind === "text") {
              buf += frame.delta;
              const parsed = parseSpec(buf);
              if (parsed) setTree(parsed);
            } else if (frame.kind === "assistantDone") {
              const parsed = parseSpec(frame.text);
              if (parsed) setTree(parsed);
            } else if (frame.kind === "error") {
              setError(frame.message);
              setStatus("error");
            }
          },
        );
        setStatus("awaiting");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    },
    [props.sessionId, props.stepId, step.mvpEnabled],
  );

  useEffect(() => {
    if (props.initiallyDone) {
      setStatus("done");
      return;
    }
    if (step.mvpEnabled) {
      void startTurn(undefined);
    } else {
      setStatus("idle");
    }
  }, [props.stepId, props.initiallyDone, step.mvpEnabled, startTurn]);

  const handleAnswer = useCallback(
    async (params: Record<string, unknown>) => {
      const { name, value } = params as { name: string; value: unknown };
      answers.current[name] = value;
    },
    [],
  );

  const handleSubmit = useCallback(
    async (params: Record<string, unknown>) => {
      const { kind, markdown, plugins } = params as {
        kind: string;
        markdown?: string;
        plugins?: string[];
      };
      if (kind === "continue") {
        await startTurn(
          JSON.stringify({ kind: "answers", values: answers.current }),
        );
        answers.current = {};
        return;
      }
      if (kind === "skip-turn") {
        answers.current = {};
        await startTurn(JSON.stringify({ kind: "skip-turn" }));
        return;
      }
      setStatus("saving");
      try {
        const submitPayload =
          kind === "plugins"
            ? { kind: "plugins" as const, plugins: plugins ?? [] }
            : { kind: "final" as const, markdown: markdown ?? "" };
        const res = await fetch(`/api/step/${props.stepId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: props.sessionId,
            payload: submitPayload,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        setStatus("done");
        props.onCompleted();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    },
    [props.onCompleted, props.sessionId, props.stepId, startTurn],
  );

  const actionHandlers = useMemo(
    () => ({
      answer: handleAnswer,
      submit: handleSubmit,
    }),
    [handleAnswer, handleSubmit],
  );

  const handleSkip = useCallback(async () => {
    setStatus("saving");
    try {
      const res = await fetch(`/api/step/${props.stepId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: props.sessionId,
          payload: { kind: "skip" },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("done");
      props.onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }, [props.onCompleted, props.sessionId, props.stepId]);

  let body: React.ReactNode = null;

  if (status === "done") {
    body = (
      <div className="rounded-md border border-node-done bg-node-done/5 p-4 text-sm">
        ✓ This step is complete. The DAG above shows downstream steps that are
        now unlocked.
      </div>
    );
  } else if (!step.mvpEnabled) {
    body = (
      <div className="flex flex-col gap-3 rounded-md border border-border p-4 text-sm">
        <p className="font-medium">{step.title} — not wired in MVP</p>
        <p className="text-muted-foreground">
          Skipping writes the unmodified template bytes for{" "}
          <code>{step.outputRelPath}</code> to this step&apos;s output.
        </p>
        <button
          type="button"
          onClick={handleSkip}
          className="self-start rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
          disabled={status === "saving"}
        >
          {status === "saving" ? "Saving…" : "Skip this step"}
        </button>
      </div>
    );
  } else if (status === "streaming" && !tree) {
    body = (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Agent is thinking…
      </div>
    );
  } else if (tree) {
    const busy = status === "saving" || status === "streaming";
    body = (
      <JSONUIProvider registry={registry} actionHandlers={actionHandlers}>
        <Renderer tree={tree} registry={registry} />
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => void handleSubmit({ kind: "continue" })}
            disabled={busy}
            className="rounded-md bg-node-ready px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-node-ready/90 disabled:opacity-50"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit({ kind: "skip-turn" })}
            disabled={busy}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
            title="Skip these questions. The agent will mark this section as N/A and move on."
          >
            Skip this turn
          </button>
          <span className="text-xs text-muted-foreground">
            host-provided controls (always available)
          </span>
        </div>
      </JSONUIProvider>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{step.title}</h2>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {status}
        </span>
      </header>
      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      ) : null}
      {body}
    </div>
  );
}
