"use client";

import { useSyncExternalStore } from "react";
import type { UITree } from "@json-render/core";
import type { StepId } from "@/lib/steps";

export type Status =
  | "idle"
  | "streaming"
  | "awaiting"
  | "saving"
  | "done"
  | "error";

export type Mode = "view" | "interview";

export type PerStepState = {
  tree: UITree | null;
  status: Status;
  mode: Mode;
  error: string | null;
  savedOutput: string | null;
  hasFetchedSavedOutput: boolean;
};

type Listener = () => void;

const stateByKey = new Map<string, PerStepState>();
const listenersByKey = new Map<string, Set<Listener>>();
const answersByKey = new Map<string, Record<string, unknown>>();

export function stepStateKey(sessionId: string, stepId: StepId): string {
  return `${sessionId}::${stepId}`;
}

export function ensureStepState(
  key: string,
  initial: PerStepState,
): PerStepState {
  let existing = stateByKey.get(key);
  if (!existing) {
    stateByKey.set(key, initial);
    existing = initial;
  }
  if (!answersByKey.has(key)) {
    answersByKey.set(key, {});
  }
  return existing;
}

export function getStepState(key: string): PerStepState | undefined {
  return stateByKey.get(key);
}

export function updateStepState(
  key: string,
  patch: Partial<PerStepState>,
): void {
  const prev = stateByKey.get(key);
  if (!prev) return;
  const next = { ...prev, ...patch };
  stateByKey.set(key, next);
  const set = listenersByKey.get(key);
  if (set) {
    for (const listener of set) listener();
  }
}

function subscribe(key: string, listener: Listener): () => void {
  let set = listenersByKey.get(key);
  if (!set) {
    set = new Set();
    listenersByKey.set(key, set);
  }
  set.add(listener);
  return () => {
    const s = listenersByKey.get(key);
    if (s) s.delete(listener);
  };
}

export function useStepState(key: string): PerStepState | undefined {
  return useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => stateByKey.get(key),
    () => stateByKey.get(key),
  );
}

export function getAnswers(key: string): Record<string, unknown> {
  let answers = answersByKey.get(key);
  if (!answers) {
    answers = {};
    answersByKey.set(key, answers);
  }
  return answers;
}

export function setAnswer(key: string, name: string, value: unknown): void {
  const answers = getAnswers(key);
  answers[name] = value;
}

export function clearAnswers(key: string): void {
  answersByKey.set(key, {});
}
