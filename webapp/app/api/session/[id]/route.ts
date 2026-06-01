import { NextResponse } from "next/server";
import { loadBrief, loadMeta } from "@/lib/session-store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const brief = loadBrief(id);
    const meta = loadMeta(id);
    return NextResponse.json({ brief, meta });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 404 },
    );
  }
}
