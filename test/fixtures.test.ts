import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { compile, compileWithOverrides } from "../src/compile";
import {
  assertFileEquals,
  assertNoPath,
  ensureParent,
  listFiles,
} from "./helpers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const outputsDir = join(repoRoot, "outputs");
const generatedDirPattern = /^\.harness-\d{8}-\d{6}-[a-f0-9]{4}$/;

const templateFiles = [
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
];

function listOutputRunDirs(): string[] {
  if (!existsSync(outputsDir)) {
    return [];
  }

  return readdirSync(outputsDir)
    .filter((entry) => {
      const fullPath = join(outputsDir, entry);
      return generatedDirPattern.test(entry) && statSync(fullPath).isDirectory();
    })
    .sort();
}

function expectGeneratedOutputDir(outDir: string): void {
  expect(dirname(outDir)).toBe(outputsDir);
  expect(basename(outDir)).toMatch(generatedDirPattern);
}

function cleanupGeneratedOutput(outDir: string): void {
  if (
    dirname(outDir) === outputsDir &&
    generatedDirPattern.test(basename(outDir))
  ) {
    rmSync(outDir, { recursive: true, force: true });
  }
}

describe("compiler v1 fixture", () => {
  test("compile() emits fixed templates and selected plugin inventory", async () => {
    let outDir = "";

    try {
      outDir = await compile(
        join(repoRoot, "harness-kit-example/compiler-v1/harness.yaml"),
      );

      expectGeneratedOutputDir(outDir);
      expect(listFiles(outDir)).toEqual([...templateFiles, "PLUGINS.md"].sort());

      for (const relPath of templateFiles) {
        assertFileEquals(
          join(outDir, relPath),
          join(repoRoot, ".harness/templates", relPath),
        );
      }

      const plugins = readFileSync(join(outDir, "PLUGINS.md"), "utf8");
      expect(plugins).toContain("# Plugins");
      expect(plugins).toContain("- `planning` -> `plugins/planning/`");
      expect(plugins).toContain("- `delivery` -> `plugins/delivery/`");
      expect(plugins.indexOf("`planning`")).toBeLessThan(
        plugins.indexOf("`delivery`"),
      );

      assertNoPath(join(outDir, ".claude"));
      assertNoPath(join(outDir, "docs/references"));
    } finally {
      if (outDir) {
        cleanupGeneratedOutput(outDir);
      }
    }
  });

  test("CLI entrypoint works with npx tsx", () => {
    const before = listOutputRunDirs();
    let outDir = "";

    try {
      execFileSync(
        "npx",
        [
          "tsx",
          join(repoRoot, "src/compile.ts"),
          join(repoRoot, "harness-kit-example/compiler-v1/harness.yaml"),
        ],
        { cwd: repoRoot, stdio: "pipe" },
      );

      const after = listOutputRunDirs();
      const created = after.filter((entry) => !before.includes(entry));
      expect(created).toHaveLength(1);

      outDir = join(outputsDir, created[0]);
      expectGeneratedOutputDir(outDir);
      expect(listFiles(outDir)).toEqual([...templateFiles, "PLUGINS.md"].sort());
    } finally {
      if (outDir) {
        cleanupGeneratedOutput(outDir);
      }
    }
  });

  test("compileWithOverrides() replaces only the supplied template", async () => {
    let outDir = "";
    const overrideBody = "# PRODUCT_SENSE\n\nFilled by agent.\n";

    try {
      outDir = await compileWithOverrides(
        join(repoRoot, "harness-kit-example/compiler-v1/harness.yaml"),
        {
          templateOverrides: new Map([
            ["docs/PRODUCT_SENSE.md", Buffer.from(overrideBody, "utf8")],
          ]),
        },
      );

      expectGeneratedOutputDir(outDir);
      expect(listFiles(outDir)).toEqual([...templateFiles, "PLUGINS.md"].sort());

      const productSense = readFileSync(
        join(outDir, "docs/PRODUCT_SENSE.md"),
        "utf8",
      );
      expect(productSense).toBe(overrideBody);

      for (const relPath of templateFiles) {
        if (relPath === "docs/PRODUCT_SENSE.md") continue;
        assertFileEquals(
          join(outDir, relPath),
          join(repoRoot, ".harness/templates", relPath),
        );
      }
    } finally {
      if (outDir) cleanupGeneratedOutput(outDir);
    }
  });

  test("fails before emit for an unknown plugin id", async () => {
    const outDir = mkdtempSync(join(tmpdir(), "harness-kit-bad-"));
    const yamlPath = join(outDir, "harness.yaml");
    ensureParent(yamlPath);
    writeFileSync(
      yamlPath,
      [
        "name: bad-fixture",
        "displayName: Bad Fixture",
        "plugins:",
        "  - plugin-that-does-not-exist",
        "",
      ].join("\n"),
    );

    const before = listOutputRunDirs();

    await expect(compile(yamlPath)).rejects.toThrow(
      /Unknown plugin id: plugin-that-does-not-exist/,
    );
    expect(listFiles(outDir)).toEqual(["harness.yaml"]);
    expect(listOutputRunDirs()).toEqual(before);
  });
});
