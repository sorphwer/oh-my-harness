import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { getStep, type StepId } from "@/lib/steps";
import { saveStepOutput, setResumeToken } from "@/lib/session-store";

export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  payload: z.object({
    kind: z.enum(["final", "skip", "plugins"]),
    markdown: z.string().optional(),
    plugins: z.array(z.string()).optional(),
  }),
});

const validStepIds: ReadonlySet<string> = new Set([
  "product-sense",
  "agents",
  "architecture",
  "design",
  "frontend",
  "operations",
  "plans",
  "quality-score",
  "reliability",
  "security",
  "uat-checklist",
  "plugin-selection",
]);

const REPO_ROOT = join(process.cwd(), "..");

export async function POST(
  req: Request,
  ctx: { params: Promise<{ stepId: string }> },
) {
  const { stepId } = await ctx.params;
  if (!validStepIds.has(stepId)) {
    return NextResponse.json({ error: "unknown step" }, { status: 400 });
  }
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const id = stepId as StepId;
  const step = getStep(id);

  let bodyText: string;
  if (parsed.data.payload.kind === "plugins") {
    bodyText = JSON.stringify(parsed.data.payload.plugins ?? [], null, 2);
  } else if (parsed.data.payload.kind === "skip") {
    if (!step.outputRelPath) {
      bodyText = "";
    } else {
      bodyText = readFileSync(
        join(REPO_ROOT, ".harness/templates", step.outputRelPath),
        "utf8",
      );
    }
  } else {
    bodyText = parsed.data.payload.markdown ?? "";
  }

  saveStepOutput(parsed.data.sessionId, id, bodyText);
  setResumeToken(parsed.data.sessionId, id, undefined);
  return NextResponse.json({ ok: true });
}
