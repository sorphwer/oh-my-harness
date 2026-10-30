import { NextResponse } from "next/server";
import { loadStepOutput } from "@/lib/session-store";
import { VALID_STEP_IDS, type StepId } from "@/lib/steps";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ stepId: string }> },
) {
  const { stepId } = await ctx.params;
  if (!VALID_STEP_IDS.has(stepId)) {
    return NextResponse.json({ error: "unknown step" }, { status: 400 });
  }
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "missing sessionId" }, { status: 400 });
  }
  const body = loadStepOutput(sessionId, stepId as StepId);
  if (body === null) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ body });
}
