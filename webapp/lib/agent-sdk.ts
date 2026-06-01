import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { getStep, getTransitiveDeps, type StepId } from "@/lib/steps";
import {
  loadBrief,
  loadMeta,
  loadStepOutput,
  setResumeToken,
} from "@/lib/session-store";

export type SSEFrame =
  | { kind: "init"; sessionId: string }
  | { kind: "text"; delta: string }
  | { kind: "assistantDone"; text: string }
  | { kind: "result"; output: string }
  | { kind: "error"; message: string };

const WEBAPP_ROOT = process.cwd();
const REPO_ROOT = join(WEBAPP_ROOT, "..");

function loadSpec(stepId: StepId): string {
  const step = getStep(stepId);
  const protocol = readFileSync(
    join(WEBAPP_ROOT, "specs/_protocol.md"),
    "utf8",
  );
  const role = readFileSync(join(WEBAPP_ROOT, step.specPath), "utf8");
  return `${protocol}\n\n---\n\n${role}`;
}

function loadTemplate(stepId: StepId): string {
  const step = getStep(stepId);
  if (!step.outputRelPath) return "";
  return readFileSync(
    join(REPO_ROOT, ".harness/templates", step.outputRelPath),
    "utf8",
  );
}

type PluginDescriptor = { description: string; when_to_include: string };

function loadPluginIndex(): string {
  const path = join(REPO_ROOT, "plugins/INDEX.md");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function loadPluginDescriptors(): Record<string, PluginDescriptor> {
  const pluginsRoot = join(REPO_ROOT, "plugins");
  if (!existsSync(pluginsRoot)) return {};
  const result: Record<string, PluginDescriptor> = {};
  for (const id of readdirSync(pluginsRoot)) {
    const readme = join(pluginsRoot, id, "README.md");
    if (!existsSync(readme)) continue;
    const body = readFileSync(readme, "utf8");
    result[id] = {
      description: extractFirstParagraph(body),
      when_to_include: extractWhenToInclude(body),
    };
  }
  return result;
}

function extractFirstParagraph(md: string): string {
  const lines = md.split("\n");
  const collected: string[] = [];
  let started = false;
  for (const line of lines) {
    if (!started) {
      if (line.startsWith("#")) continue;
      if (line.trim() === "") continue;
      started = true;
      collected.push(line.trim());
      continue;
    }
    if (line.trim() === "") break;
    collected.push(line.trim());
  }
  return collected.join(" ").slice(0, 400);
}

function extractWhenToInclude(md: string): string {
  const idx = md.toLowerCase().indexOf("when to include");
  if (idx < 0) return "";
  const tail = md.slice(idx);
  const next = tail.split("\n##")[1] ? tail.split(/\n##/)[0] : tail;
  return next.replace(/^[^\n]*\n/, "").trim().slice(0, 500);
}

function buildPriorDocuments(
  stepId: StepId,
  sessionId: string,
): Record<string, string> {
  const priorDocs: Record<string, string> = {};
  for (const dep of getTransitiveDeps(stepId)) {
    const depStep = getStep(dep);
    if (!depStep.outputRelPath) continue;
    const body = loadStepOutput(sessionId, dep);
    if (body) priorDocs[depStep.outputRelPath] = body;
  }
  return priorDocs;
}

function buildUserTurn(opts: {
  stepId: StepId;
  sessionId: string;
  userMessage?: string;
}): string {
  if (opts.userMessage) return opts.userMessage;

  const brief = loadBrief(opts.sessionId);
  const priorDocs = buildPriorDocuments(opts.stepId, opts.sessionId);

  const lines: string[] = [
    "Below is the shared project brief.",
    "Start the interview now by emitting your first JSON UITree.",
    "",
    "## project_brief",
    "```json",
    JSON.stringify(brief, null, 2),
    "```",
  ];

  if (Object.keys(priorDocs).length > 0) {
    lines.push(
      "",
      "## prior_documents",
      "These upstream documents are already filled. Consult them silently —",
      "do NOT re-ask questions whose answers are visible here. Reference them",
      "by relative path when relevant.",
      "",
      "```json",
      JSON.stringify(priorDocs, null, 2),
      "```",
    );
  }

  if (opts.stepId === "plugin-selection") {
    lines.push(
      "",
      "## plugins_index",
      "```markdown",
      loadPluginIndex(),
      "```",
      "",
      "## plugin_descriptors",
      "```json",
      JSON.stringify(loadPluginDescriptors(), null, 2),
      "```",
    );
  } else {
    const template = loadTemplate(opts.stepId);
    lines.push("", "## template_body", "```markdown", template, "```");
  }

  return lines.join("\n");
}

export async function* runAgent(opts: {
  stepId: StepId;
  sessionId: string;
  userMessage?: string;
}): AsyncGenerator<SSEFrame> {
  const systemPrompt = loadSpec(opts.stepId);
  const meta = loadMeta(opts.sessionId);
  const resume = meta.resumeTokens[opts.stepId];

  let agentSessionId: string | undefined;
  let textBuf = "";

  try {
    for await (const msg of query({
      prompt: buildUserTurn(opts),
      options: {
        systemPrompt,
        allowedTools: [],
        settingSources: [],
        ...(resume ? { resume } : {}),
      },
    })) {
      if (msg.type === "system" && msg.subtype === "init") {
        agentSessionId = msg.session_id;
        yield { kind: "init", sessionId: msg.session_id };
        continue;
      }

      if (msg.type === "assistant") {
        const content = msg.message?.content ?? [];
        for (const block of content) {
          if (block.type === "text") {
            textBuf += block.text;
            yield { kind: "text", delta: block.text };
          }
        }
        continue;
      }

      if (msg.type === "result") {
        if (textBuf.length > 0) {
          yield { kind: "assistantDone", text: textBuf };
        }
        if ("result" in msg && typeof msg.result === "string") {
          yield { kind: "result", output: msg.result };
        }
      }
    }

    if (agentSessionId) {
      setResumeToken(opts.sessionId, opts.stepId, agentSessionId);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    yield { kind: "error", message };
  }
}
