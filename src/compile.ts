import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { randomBytes } from "node:crypto";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve as resolvePath,
} from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolvePath(__dirname, "..");

const harnessYamlSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  plugins: z.array(z.string().min(1)).min(1),
});

const requiredTemplateFiles = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "docs/DESIGN.md",
  "docs/FRONTEND.md",
  "docs/OPERATIONS.md",
  "docs/PLANS.md",
  "docs/PRODUCT_SENSE.md",
  "docs/QUALITY_SCORE.md",
  "docs/RELIABILITY.md",
  "docs/SECURITY.md",
  "docs/UAT_CHECKLIST.md",
] as const;

type HarnessYaml = z.infer<typeof harnessYamlSchema>;

type ResolvedHarness = {
  parsed: HarnessYaml;
  plugins: string[];
  templates: Array<{ relPath: string; sourcePath: string }>;
};

export type CompileOverrides = {
  templateOverrides?: Map<string, Buffer | string>;
};

export async function compile(yamlPath: string): Promise<string> {
  return compileWithOverrides(yamlPath, {});
}

export async function compileWithOverrides(
  yamlPath: string,
  overrides: CompileOverrides,
): Promise<string> {
  const parsed = load(yamlPath);
  const resolved = resolveHarness(parsed);
  const files = render(resolved, overrides);
  const outDir = createOutputDir();
  emit(files, outDir);

  return outDir;
}

export async function main(argv = process.argv.slice(2)): Promise<string> {
  if (argv.length !== 1) {
    throw new Error("Usage: npx tsx src/compile.ts <harness.yaml>");
  }

  const outDir = await compile(resolvePath(argv[0]));
  console.log(outDir);
  return outDir;
}

export function load(yamlPath: string): HarnessYaml {
  const raw = readFileSync(yamlPath, "utf8");
  const data = parse(raw);
  const result = harnessYamlSchema.safeParse(data);

  if (!result.success) {
    throw new Error(
      `Invalid harness yaml at ${yamlPath}: ${result.error.message}`,
    );
  }

  return result.data;
}

export function resolveHarness(parsed: HarnessYaml): ResolvedHarness {
  for (const plugin of parsed.plugins) {
    const pluginDir = join(repoRoot, "plugins", plugin);
    if (!existsSync(pluginDir)) {
      throw new Error(`Unknown plugin id: ${plugin}`);
    }
  }

  const templates = requiredTemplateFiles.map((relPath) => {
    const sourcePath = join(repoRoot, ".harness/templates", relPath);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing harness template: ${relPath}`);
    }
    return { relPath, sourcePath };
  });

  return {
    parsed,
    plugins: parsed.plugins,
    templates,
  };
}

export function render(
  resolved: ResolvedHarness,
  overrides: CompileOverrides = {},
): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  const templateOverrides = overrides.templateOverrides;

  for (const template of resolved.templates) {
    const override = templateOverrides?.get(template.relPath);
    if (override !== undefined) {
      files.set(
        template.relPath,
        typeof override === "string" ? Buffer.from(override, "utf8") : override,
      );
    } else {
      files.set(template.relPath, readFileSync(template.sourcePath));
    }
  }

  files.set("PLUGINS.md", Buffer.from(renderPlugins(resolved.plugins), "utf8"));

  return files;
}

export function emit(files: Map<string, Buffer>, outDir: string): void {
  mkdirSync(outDir, { recursive: true });

  for (const [relPath, content] of files) {
    const targetPath = join(outDir, relPath);
    const relativeTarget = relative(outDir, targetPath);

    if (relativeTarget.startsWith("..") || isAbsolute(relativeTarget)) {
      throw new Error(`Refusing to write outside output directory: ${relPath}`);
    }

    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, content);
  }
}

export function createOutputDir(now = new Date()): string {
  const outputRoot = join(repoRoot, "outputs");

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = join(outputRoot, formatOutputDirName(now, randomHash()));
    if (!existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("Unable to allocate unique output directory");
}

export function formatOutputDirName(now: Date, hash: string): string {
  if (!/^[a-f0-9]{4}$/.test(hash)) {
    throw new Error(`Invalid output hash: ${hash}`);
  }

  return `.harness-${formatTimestamp(now)}-${hash}`;
}

function formatTimestamp(now: Date): string {
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  const hours = pad2(now.getHours());
  const minutes = pad2(now.getMinutes());
  const seconds = pad2(now.getSeconds());

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function randomHash(): string {
  return randomBytes(2).toString("hex");
}

function renderPlugins(plugins: string[]): string {
  return [
    "# Plugins",
    "",
    "Selected plugin inventory for this harness.",
    "",
    "Compiler v1 lists selected plugins only. It does not copy plugin skill, agent, or rules resources yet.",
    "",
    ...plugins.map((plugin) => `- \`${plugin}\` -> \`plugins/${plugin}/\``),
    "",
  ].join("\n");
}

function isDirectRun(): boolean {
  if (!process.argv[1]) {
    return false;
  }

  return resolvePath(process.argv[1]) === fileURLToPath(import.meta.url);
}

if (isDirectRun()) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
