import { z } from "zod";
import { runAgent } from "@/lib/agent-sdk";
import type { StepId } from "@/lib/steps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  userMessage: z.string().optional(),
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

export async function POST(
  req: Request,
  ctx: { params: Promise<{ stepId: string }> },
) {
  const { stepId } = await ctx.params;
  if (!validStepIds.has(stepId)) {
    return new Response(`Unknown step: ${stepId}`, { status: 400 });
  }
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(parsed.error.message, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const frame of runAgent({
          stepId: stepId as StepId,
          sessionId: parsed.data.sessionId,
          userMessage: parsed.data.userMessage,
        })) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(frame)}\n\n`),
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ kind: "error", message })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
