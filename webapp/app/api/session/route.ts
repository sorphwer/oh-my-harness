import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/session-store";

export const runtime = "nodejs";

const briefSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9-]*$/, "kebab-case lowercase slug"),
  displayName: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = briefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const meta = createSession(parsed.data);
  return NextResponse.json({ id: meta.id });
}
