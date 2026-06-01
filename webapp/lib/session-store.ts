import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import type { StepId } from "@/lib/steps";

export type Brief = {
  name: string;
  displayName: string;
  description: string;
};

export type SessionMeta = {
  id: string;
  createdAt: string;
  doneSteps: StepId[];
  resumeTokens: Partial<Record<StepId, string>>;
};

const SESSIONS_ROOT = join(process.cwd(), ".sessions");

function ensureRoot(): void {
  if (!existsSync(SESSIONS_ROOT)) {
    mkdirSync(SESSIONS_ROOT, { recursive: true });
  }
}

function sessionDir(id: string): string {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    throw new Error(`Invalid session id: ${id}`);
  }
  return join(SESSIONS_ROOT, id);
}

export function createSession(brief: Brief): SessionMeta {
  ensureRoot();
  const id = randomUUID();
  const dir = sessionDir(id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "brief.json"), JSON.stringify(brief, null, 2));
  const meta: SessionMeta = {
    id,
    createdAt: new Date().toISOString(),
    doneSteps: ["brief"],
    resumeTokens: {},
  };
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2));
  return meta;
}

export function loadBrief(id: string): Brief {
  const raw = readFileSync(join(sessionDir(id), "brief.json"), "utf8");
  return JSON.parse(raw) as Brief;
}

export function loadMeta(id: string): SessionMeta {
  const raw = readFileSync(join(sessionDir(id), "meta.json"), "utf8");
  return JSON.parse(raw) as SessionMeta;
}

export function saveMeta(meta: SessionMeta): void {
  writeFileSync(
    join(sessionDir(meta.id), "meta.json"),
    JSON.stringify(meta, null, 2),
  );
}

export function saveStepOutput(
  id: string,
  stepId: StepId,
  body: string,
): void {
  const dir = sessionDir(id);
  writeFileSync(join(dir, `${stepId}.md`), body);
  const meta = loadMeta(id);
  if (!meta.doneSteps.includes(stepId)) {
    meta.doneSteps.push(stepId);
    saveMeta(meta);
  }
}

export function loadStepOutput(id: string, stepId: StepId): string | null {
  const path = join(sessionDir(id), `${stepId}.md`);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

export function setResumeToken(
  id: string,
  stepId: StepId,
  token: string | undefined,
): void {
  const meta = loadMeta(id);
  if (token === undefined) {
    delete meta.resumeTokens[stepId];
  } else {
    meta.resumeTokens[stepId] = token;
  }
  saveMeta(meta);
}

export function listSessions(): string[] {
  if (!existsSync(SESSIONS_ROOT)) return [];
  return readdirSync(SESSIONS_ROOT).filter((entry) =>
    existsSync(join(SESSIONS_ROOT, entry, "meta.json")),
  );
}
