import { NextResponse } from "next/server";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { stringify as yamlStringify } from "yaml";
import { compileWithOverrides } from "harness-kit";
import { STEP_GRAPH } from "@/lib/steps";
import { loadBrief, loadStepOutput } from "@/lib/session-store";

export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { sessionId } = parsed.data;

  const brief = loadBrief(sessionId);

  const pluginListRaw = loadStepOutput(sessionId, "plugin-selection");
  if (!pluginListRaw) {
    return NextResponse.json(
      { error: "plugin-selection step has not been completed" },
      { status: 400 },
    );
  }
  let plugins: string[];
  try {
    const parsedList = JSON.parse(pluginListRaw);
    if (!Array.isArray(parsedList) || parsedList.length === 0) {
      throw new Error("empty plugin list");
    }
    plugins = parsedList.map(String);
  } catch (err) {
    return NextResponse.json(
      {
        error: `plugin-selection output is not a non-empty JSON array: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 400 },
    );
  }

  const overrides = new Map<string, string>();
  for (const node of STEP_GRAPH) {
    if (!node.outputRelPath) continue;
    const filled = loadStepOutput(sessionId, node.id);
    if (filled !== null) {
      overrides.set(node.outputRelPath, filled);
    }
  }

  const tmp = mkdtempSync(join(tmpdir(), "harness-kit-webapp-"));
  const yamlPath = join(tmp, "harness.yaml");
  const yamlBody = yamlStringify({
    name: brief.name,
    displayName: brief.displayName,
    plugins,
  });
  writeFileSync(yamlPath, yamlBody);

  try {
    const outDir = await compileWithOverrides(yamlPath, {
      templateOverrides: overrides,
    });
    return NextResponse.json({ outDir });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
