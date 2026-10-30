"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Renderer, JSONUIProvider } from "@json-render/react";
import type { UITree } from "@json-render/core";
import { Loader2, PencilLine } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getStep, type StepId } from "@/lib/steps";
import { registry } from "@/lib/json-render-registry";
import { streamSSE } from "@/lib/sse";
import {
  clearAnswers,
  ensureStepState,
  getAnswers,
  getStepState,
  setAnswer,
  stepStateKey,
  updateStepState,
  useStepState,
} from "@/lib/agent-state-cache";

const REMARK_PLUGINS = [remarkGfm];

type AgentFrame =
  | { kind: "init"; sessionId: string }
  | { kind: "text"; delta: string }
  | { kind: "assistantDone"; text: string }
  | { kind: "result"; output: string }
  | { kind: "error"; message: string };

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

function parsePluginList(body: string): string[] | null {
  try {
    const parsed = JSON.parse(body);
    if (Array.isArray(parsed)) return parsed.map((p) => String(p));
  } catch {
    // not JSON; not a plugin list
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
  const key = stepStateKey(props.sessionId, props.stepId);

  ensureStepState(key, {
    tree: null,
    status: props.initiallyDone ? "done" : "idle",
    mode: props.initiallyDone ? "view" : "interview",
    error: null,
    savedOutput: null,
    hasFetchedSavedOutput: false,
  });

  const state = useStepState(key);
  const tree = state?.tree ?? null;
  const status = state?.status ?? "idle";
  const mode = state?.mode ?? "interview";
  const error = state?.error ?? null;
  const savedOutput = state?.savedOutput ?? null;
  const hasFetchedSavedOutput = state?.hasFetchedSavedOutput ?? false;

  const [loadingSaved, setLoadingSaved] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);

  const startTurn = useCallback(
    async (userMessage?: string) => {
      if (!step.mvpEnabled) return;
      streamAbortRef.current?.abort();
      const ctrl = new AbortController();
      streamAbortRef.current = ctrl;
      updateStepState(key, { status: "streaming", error: null, tree: null });
      let buf = "";

      try {
        await streamSSE(
          `/api/agent/${props.stepId}`,
          { sessionId: props.sessionId, userMessage },
          (raw) => {
            if (ctrl.signal.aborted) return;
            const frame = raw as AgentFrame;
            if (frame.kind === "text") {
              buf += frame.delta;
              const parsed = parseSpec(buf);
              if (parsed) updateStepState(key, { tree: parsed });
            } else if (frame.kind === "assistantDone") {
              const parsed = parseSpec(frame.text);
              if (parsed) updateStepState(key, { tree: parsed });
            } else if (frame.kind === "error") {
              updateStepState(key, {
                error: frame.message,
                status: "error",
              });
            }
          },
          ctrl.signal,
        );
        if (ctrl.signal.aborted) return;
        updateStepState(key, { status: "awaiting" });
      } catch (err) {
        if (ctrl.signal.aborted) return;
        const msg = err instanceof Error ? err.message : String(err);
        updateStepState(key, { error: msg, status: "error" });
      }
    },
    [key, props.sessionId, props.stepId, step.mvpEnabled],
  );

  // Fetch saved output when entering view mode, unless already cached.
  useEffect(() => {
    if (mode !== "view") return;
    if (hasFetchedSavedOutput) return;
    const ctrl = new AbortController();
    setLoadingSaved(true);
    (async () => {
      let body: string | null = null;
      try {
        const res = await fetch(
          `/api/step/${props.stepId}/output?sessionId=${encodeURIComponent(props.sessionId)}`,
          { signal: ctrl.signal },
        );
        if (res.ok) {
          const data = (await res.json()) as { body?: unknown };
          if (typeof data?.body === "string") body = data.body;
        }
      } catch {
        // network error or aborted; fall through with body=null
      }
      if (ctrl.signal.aborted) return;
      updateStepState(key, { savedOutput: body, hasFetchedSavedOutput: true });
      setLoadingSaved(false);
    })();
    return () => {
      ctrl.abort();
    };
  }, [mode, hasFetchedSavedOutput, key, props.sessionId, props.stepId]);

  // Auto-start interview when there's no work in progress for this step.
  useEffect(() => {
    if (mode !== "interview") return;
    if (!step.mvpEnabled) {
      updateStepState(key, { status: "idle" });
      return;
    }
    // Read fresh state from the cache so this works correctly across
    // StrictMode double-invocation and remounts.
    const fresh = getStepState(key);
    if (!fresh) return;
    if (fresh.tree !== null) return;
    if (
      fresh.status === "streaming" ||
      fresh.status === "awaiting" ||
      fresh.status === "saving"
    ) {
      return;
    }
    // status is idle, done, or error — all are safe to (re)start, and
    // 'error' means the previous turn failed and the user re-entered.
    void startTurn(undefined);
  }, [key, mode, step.mvpEnabled, startTurn]);

  const handleAnswer = useCallback(
    async (params: Record<string, unknown>) => {
      const { name, value } = params as { name: string; value: unknown };
      setAnswer(key, name, value);
    },
    [key],
  );

  const handleSubmit = useCallback(
    async (params: Record<string, unknown>) => {
      const { kind, markdown, plugins } = params as {
        kind: string;
        markdown?: string;
        plugins?: string[];
      };
      if (kind === "continue") {
        const snapshot = { ...getAnswers(key) };
        clearAnswers(key);
        await startTurn(
          JSON.stringify({ kind: "answers", values: snapshot }),
        );
        return;
      }
      if (kind === "skip-turn") {
        clearAnswers(key);
        await startTurn(JSON.stringify({ kind: "skip-turn" }));
        return;
      }
      updateStepState(key, { status: "saving" });
      try {
        const isPlugins = kind === "plugins";
        const submitPayload = isPlugins
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

        const newBody = isPlugins
          ? JSON.stringify(plugins ?? [], null, 2)
          : (markdown ?? "");
        updateStepState(key, {
          savedOutput: newBody,
          hasFetchedSavedOutput: true,
          tree: null,
          status: "done",
          mode: "view",
        });
        if (!props.initiallyDone) props.onCompleted();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        updateStepState(key, { error: msg, status: "error" });
      }
    },
    [
      key,
      props.initiallyDone,
      props.onCompleted,
      props.sessionId,
      props.stepId,
      startTurn,
    ],
  );

  const actionHandlers = useMemo(
    () => ({
      answer: handleAnswer,
      submit: handleSubmit,
    }),
    [handleAnswer, handleSubmit],
  );

  const handleSkipStep = useCallback(async () => {
    updateStepState(key, { status: "saving" });
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
      updateStepState(key, { status: "done", mode: "view" });
      if (!props.initiallyDone) props.onCompleted();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      updateStepState(key, { error: msg, status: "error" });
    }
  }, [key, props.initiallyDone, props.onCompleted, props.sessionId, props.stepId]);

  const startRevise = useCallback(() => {
    clearAnswers(key);
    updateStepState(key, {
      mode: "interview",
      status: "idle",
      tree: null,
      error: null,
    });
  }, [key]);

  const cancelRevise = useCallback(() => {
    updateStepState(key, {
      mode: "view",
      tree: null,
      status: "done",
      error: null,
    });
  }, [key]);

  let body: React.ReactNode = null;

  // View mode for a done step.
  if (mode === "view") {
    if (loadingSaved) {
      body = (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading saved output…
        </div>
      );
    } else if (savedOutput === null) {
      body = (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Step is marked done but no saved output was found on disk.
          <button
            type="button"
            onClick={startRevise}
            className="ml-3 rounded-md border border-amber-400 bg-background px-3 py-1 text-xs hover:bg-amber-100"
          >
            Restart agent
          </button>
        </div>
      );
    } else if (props.stepId === "plugin-selection") {
      const pluginList = parsePluginList(savedOutput) ?? [];
      body = (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-border bg-background p-4">
            <p className="mb-3 text-sm font-medium">Selected plugins</p>
            {pluginList.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {pluginList.map((p) => (
                  <li
                    key={p}
                    className="rounded-full border border-node-done bg-node-done/5 px-3 py-1 text-xs"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No plugins selected.
              </p>
            )}
          </div>
          <ReviseFooter onClick={startRevise} />
        </div>
      );
    } else {
      body = (
        <div className="flex flex-col gap-4">
          <article className="rounded-md border border-border bg-background p-5">
            <div className="markdown-body text-sm text-foreground">
              <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>
                {savedOutput}
              </ReactMarkdown>
            </div>
          </article>
          <ReviseFooter onClick={startRevise} />
        </div>
      );
    }
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
          onClick={handleSkipStep}
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
          {props.initiallyDone ? (
            <button
              type="button"
              onClick={cancelRevise}
              disabled={busy}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-50"
              title="Discard this revise turn and return to the saved document."
            >
              Cancel revise
            </button>
          ) : null}
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
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-semibold">{step.title}</h2>
          {mode === "view" && step.outputRelPath ? (
            <code className="text-xs text-muted-foreground">
              {step.outputRelPath}
            </code>
          ) : null}
          {mode === "interview" && props.initiallyDone ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-800">
              revising
            </span>
          ) : null}
        </div>
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {mode === "view" ? "done · view" : status}
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

function ReviseFooter({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center gap-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent"
      >
        <PencilLine className="h-4 w-4" />
        Chat with agent to revise
      </button>
      <span className="text-xs text-muted-foreground">
        Restarts the agent with the saved document as context.
      </span>
    </div>
  );
}
