# harness-kit MVP v0 Implementation Plan

> **DEPRECATED — DO NOT EXECUTE.** This v0 plan is historical only. It was
> written for the old pool model (`docs-pool`, `catalog`, `skills-pool`,
> `references-pool`, and related resource pools) and predates the current v1 docs.
> Current work targets the compiler v1 contract, where plugins are first-class
> and a minimal prototype already exists in `src/compile.ts`.
>
> The task-by-task instructions below are stale and must not be followed
> literally.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal TypeScript script (`src/compile.ts`) that reads `example/nextjs-acme/harness.yaml` and writes `example/nextjs-acme/.harness/` byte-identical to a hand-curated target, exercising all three content pools (docs / skills / references).

**Architecture:** Four pipeline phases as plain functions in one file — `load` (yaml→typed object) → `resolve` (typed object→fragments+params) → `render` (fragments→file content map) → `emit` (map→disk). No CLI, no watch, no check mode. One integration test asserts byte equality between compiled output and hand-curated target.

**Tech Stack:** TypeScript (run via `tsx`, no build step). Deps: `yaml`, `zod`, `eta`. Dev deps: `vitest`, `tsx`, `typescript`, `@types/node`.

**Spec:** `.harness/docs/superpowers/specs/2026-05-25-mvp-development-design.md`

---

## File Structure

Files this plan creates or modifies:

**New:**
- `package.json` — project manifest
- `tsconfig.json` — TypeScript config
- `.gitignore` — exclude `node_modules`, `dist`
- `src/compile.ts` — all 4 pipeline phases + public `compile()` + shared zod schemas
- `test/fixtures.test.ts` — single integration test (round-trip)
- `test/helpers.ts` — `assertDirsEqual` helper
- `docs-pool/agent-guide/{manifest.ts, template.md}`
- `docs-pool/architecture/{manifest.ts, template.md}`
- `docs-pool/planning-conventions/{manifest.ts, template.md}`
- `docs-pool/product-sense/{manifest.ts, template.md}`
- `catalog/superpowers/writing-plans.json`
- `catalog/superpowers/test-driven-development.json`
- `catalog/superpowers/executing-plans.json`
- `catalog/code-review.json`
- `references-pool/auth-js-llms.txt`
- `example/nextjs-acme/harness.yaml`
- `example/nextjs-acme/.harness/SKILLS.md` (expansion of target)
- `example/nextjs-acme/.harness/docs/references/auth-js-llms.txt` (expansion of target)
- `example/nextjs-acme/.harness/.claude/settings.example.json` (expansion of target)

**Existing (not modified):**
- `example/nextjs-acme/.harness/AGENTS.md`
- `example/nextjs-acme/.harness/ARCHITECTURE.md`
- `example/nextjs-acme/.harness/docs/PLANS.md`
- `example/nextjs-acme/.harness/docs/PRODUCT_SENSE.md`

The integration test imports `compile` from `src/compile.ts` and `assertDirsEqual` from `test/helpers.ts`, calls `compile()` into a tmpdir, then asserts the tmpdir matches `example/nextjs-acme/.harness/` byte-for-byte.

---

## Task 0: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "harness-kit",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "eta": "^3.4.0",
    "yaml": "^2.6.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "test/**/*.ts", "docs-pool/**/*.ts"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Verify test runner boots**

Run: `npm test`
Expected: Vitest output saying "No test files found" or similar non-error exit. Exit code 0 or 1 acceptable here (no tests yet is fine).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore
git commit -m "chore: scaffold harness-kit project (deps, tsconfig)"
```

---

## Task 1: Failing fixture test + stub compile

Set up the integration test before any implementation. This is the test that proves v0 is done.

**Files:**
- Create: `src/compile.ts`
- Create: `test/helpers.ts`
- Create: `test/fixtures.test.ts`

- [ ] **Step 1: Create stub `src/compile.ts`**

```ts
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  // stub — Task 11+ implements this
  void yamlPath;
  void outDir;
}
```

- [ ] **Step 2: Create `test/helpers.ts`**

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Subset rule:
 *   - every file in `actual` must exist in `expected`
 *   - every file in `actual` must be byte-equal to the corresponding `expected`
 *   - files in `expected` that are not in `actual` are ignored
 *
 * This lets the hand-curated demo target contain docs that v0's compiler
 * doesn't yet produce, while still catching compiler bugs (extra files
 * or content drift).
 */
export function assertActualSubsetOfExpected(actual: string, expected: string): void {
  const actualFiles = listFiles(actual);

  const missingInExpected: string[] = [];
  for (const rel of actualFiles) {
    if (!existsSync(join(expected, rel))) missingInExpected.push(rel);
  }
  if (missingInExpected.length) {
    throw new Error(
      `Compiler emitted files that aren't in the target:\n  ${JSON.stringify(missingInExpected)}`,
    );
  }

  for (const rel of actualFiles) {
    const a = readFileSync(join(actual, rel));
    const e = readFileSync(join(expected, rel));
    if (a.equals(e)) continue;
    if (/\.(md|json|txt|ts|yaml|yml)$/i.test(rel)) {
      throw new Error(
        `File differs: ${rel}\n--- expected (${e.length} bytes)\n${e.toString("utf-8")}\n--- actual (${a.length} bytes)\n${a.toString("utf-8")}\n--- end`,
      );
    }
    throw new Error(`File differs (binary): ${rel} (expected ${e.length} bytes, actual ${a.length} bytes)`);
  }
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(relative(dir, full));
    }
  }
  walk(dir);
  return out.sort();
}
```

- [ ] **Step 3: Create `test/fixtures.test.ts`**

```ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { test } from "vitest";
import { compile } from "../src/compile";
import { assertActualSubsetOfExpected } from "./helpers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

test("nextjs-acme: compiled tree is a byte-equal subset of the target", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "harness-kit-"));
  await compile(
    join(repoRoot, "example/nextjs-acme/harness.yaml"),
    tmp,
  );
  assertActualSubsetOfExpected(tmp, join(repoRoot, "example/nextjs-acme/.harness"));
});
```

- [ ] **Step 4: Run the test to verify it passes vacuously**

Run: `npm test`
Expected: PASS. The compiler is a stub and writes no files, so `actual` is empty and the subset rule is trivially satisfied. (Once `compile()` starts writing files in Tasks 11+, real assertions kick in.)

- [ ] **Step 5: Commit**

```bash
git add src/compile.ts test/helpers.ts test/fixtures.test.ts
git commit -m "test: add failing fixture round-trip test"
```

---

## Task 2: Write `example/nextjs-acme/harness.yaml`

This is the input the compiler will read. It declares all fields the v0 schema requires.

**Files:**
- Create: `example/nextjs-acme/harness.yaml`

- [ ] **Step 1: Create the yaml**

```yaml
name: acme-notes
displayName: Acme Notes
projectOverview: |
  Acme Notes is a single-user Next.js notes app. Each signed-in user owns a private collection of notes. Notes have a small lifecycle (`DRAFT` → `PUBLISHED` → `ARCHIVED`) and can be shared by URL only after they reach `PUBLISHED`.

stack:
  framework: nextjs-16
  database: postgres-neon
  orm: drizzle
  auth: authjs-magic-link
  validation: zod
  deploy: vercel-fluid

contract:
  tenancy: single-user
  publicIdFormat: "note_{ulid}"
  lifecycleField: state
  lifecycleValues: [DRAFT, PUBLISHED, ARCHIVED]
  publicReadPath: "/n/{note_id}"

docs:
  - agent-guide
  - architecture
  - planning-conventions
  - product-sense

skills:
  - superpowers:writing-plans
  - superpowers:test-driven-development
  - superpowers:executing-plans
  - code-review

references:
  - auth-js

permissions:
  preset: default-nextjs
```

- [ ] **Step 2: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (still vacuous — compile is a stub, no files written, no exceptions). Subset rule is trivially satisfied. The yaml file existing doesn't change behavior yet.

- [ ] **Step 3: Commit**

```bash
git add example/nextjs-acme/harness.yaml
git commit -m "feat: add acme harness.yaml input"
```

---

## Task 3: Expand acme target — `SKILLS.md`

Add a hand-curated `SKILLS.md` to the target. The compiler's `render()` will need to produce byte-identical output to this. Start with a reasonable format; iterate in Task 16 if the implementation diverges.

**Files:**
- Create: `example/nextjs-acme/.harness/SKILLS.md`

- [ ] **Step 1: Create `example/nextjs-acme/.harness/SKILLS.md`**

```markdown
# Installed Skills

This project expects the following skills to be available to the AI coding agent. Install the corresponding plugins / configure your agent so each is invocable.

## superpowers:writing-plans

**Source:** plugin `superpowers`

Use when turning an approved design spec into a task-by-task implementation plan.

**When to use:** After a brainstorm produces an approved spec and before any implementation begins.

## superpowers:test-driven-development

**Source:** plugin `superpowers`

Use when implementing any feature or bugfix that changes observable behavior.

**When to use:** Code edits that change behavior (not docs, config, or pure refactors without behavior change).

## superpowers:executing-plans

**Source:** plugin `superpowers`

Use when following a written implementation plan task-by-task inside one session.

**When to use:** After a plan is written, when execution is happening in the current session rather than via dispatched subagents.

## code-review

**Source:** built-in

Use when reviewing the current diff for correctness bugs before opening a PR.

**When to use:** Before requesting human review, after the implementation is locally green.
```

- [ ] **Step 2: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (vacuous). Subset rule ignores expected-only files. SKILLS.md sits in the target waiting for the compiler to produce a matching version in Task 14.

- [ ] **Step 3: Commit**

```bash
git add example/nextjs-acme/.harness/SKILLS.md
git commit -m "feat(example): expand acme target with SKILLS.md"
```

---

## Task 4: Expand acme target — reference file

Copy a reference into both `references-pool/` (the source) and the acme target.

**Files:**
- Create: `references-pool/auth-js-llms.txt`
- Create: `example/nextjs-acme/.harness/docs/references/auth-js-llms.txt`

- [ ] **Step 1: Create `references-pool/auth-js-llms.txt`**

Use a short stub for v0; real `llms.txt` files can replace this later. The two files must be byte-identical.

```
# Auth.js — LLM Reference Stub

This is a placeholder reference file for harness-kit v0. In a real project, this file would contain the relevant Auth.js documentation flattened to plain text for the agent to read.

See https://authjs.dev for the real documentation.
```

- [ ] **Step 2: Copy to target**

Run: `mkdir -p example/nextjs-acme/.harness/docs/references && cp references-pool/auth-js-llms.txt example/nextjs-acme/.harness/docs/references/auth-js-llms.txt`
Expected: file exists at target path.

- [ ] **Step 3: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (vacuous). Target file is ignored by the subset rule until the compiler produces a matching one in Task 14.

- [ ] **Step 4: Commit**

```bash
git add references-pool/auth-js-llms.txt example/nextjs-acme/.harness/docs/references/auth-js-llms.txt
git commit -m "feat: add auth-js reference file to pool and acme target"
```

---

## Task 5: Expand acme target — `.claude/settings.example.json`

The `default-nextjs` permissions preset.

**Files:**
- Create: `example/nextjs-acme/.harness/.claude/settings.example.json`

- [ ] **Step 1: Create the settings file**

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Read(./**)",
      "Write(./**)",
      "Edit(./**)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(git push --force:*)"
    ]
  }
}
```

The compiler's preset hardcodes this exact JSON (Task 14, Step 3).

- [ ] **Step 2: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (vacuous). Target file is ignored by the subset rule until the compiler produces a matching one in Task 14.

- [ ] **Step 3: Commit**

```bash
git add example/nextjs-acme/.harness/.claude/settings.example.json
git commit -m "feat(example): expand acme target with permissions preset file"
```

---

## Task 6: Catalog entries

Create 4 JSON files for the skills `acme/harness.yaml` references.

**Files:**
- Create: `catalog/superpowers/writing-plans.json`
- Create: `catalog/superpowers/test-driven-development.json`
- Create: `catalog/superpowers/executing-plans.json`
- Create: `catalog/code-review.json`

- [ ] **Step 1: Create `catalog/superpowers/writing-plans.json`**

```json
{
  "id": "superpowers:writing-plans",
  "displayName": "writing-plans",
  "source": {
    "kind": "plugin",
    "plugin": "superpowers",
    "name": "writing-plans"
  },
  "description": "Use when turning an approved design spec into a task-by-task implementation plan.",
  "whenToUse": "After a brainstorm produces an approved spec and before any implementation begins.",
  "rigidity": "rigid"
}
```

- [ ] **Step 2: Create `catalog/superpowers/test-driven-development.json`**

```json
{
  "id": "superpowers:test-driven-development",
  "displayName": "test-driven-development",
  "source": {
    "kind": "plugin",
    "plugin": "superpowers",
    "name": "test-driven-development"
  },
  "description": "Use when implementing any feature or bugfix that changes observable behavior.",
  "whenToUse": "Code edits that change behavior (not docs, config, or pure refactors without behavior change).",
  "rigidity": "rigid"
}
```

- [ ] **Step 3: Create `catalog/superpowers/executing-plans.json`**

```json
{
  "id": "superpowers:executing-plans",
  "displayName": "executing-plans",
  "source": {
    "kind": "plugin",
    "plugin": "superpowers",
    "name": "executing-plans"
  },
  "description": "Use when following a written implementation plan task-by-task inside one session.",
  "whenToUse": "After a plan is written, when execution is happening in the current session rather than via dispatched subagents.",
  "rigidity": "rigid"
}
```

- [ ] **Step 4: Create `catalog/code-review.json`**

```json
{
  "id": "code-review",
  "displayName": "code-review",
  "source": {
    "kind": "builtin",
    "name": "code-review"
  },
  "description": "Use when reviewing the current diff for correctness bugs before opening a PR.",
  "whenToUse": "Before requesting human review, after the implementation is locally green.",
  "rigidity": "flexible"
}
```

**Critical:** The `displayName`, `description`, and `whenToUse` strings here MUST match the text used in `example/nextjs-acme/.harness/SKILLS.md` (Task 3, Step 1) word-for-word and section-heading-for-section-heading. If you change either, change both, or the round-trip test will diff.

- [ ] **Step 5: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (vacuous). Catalog entries are pure input data; the compiler hasn't been wired to read them yet.

- [ ] **Step 6: Commit**

```bash
git add catalog/
git commit -m "feat: add catalog entries for v0 acme skills"
```

---

## Task 7: docs-pool fragment — `agent-guide` → `AGENTS.md`

The first and largest docs-pool fragment. The strategy:

1. Read `example/nextjs-acme/.harness/AGENTS.md` carefully.
2. Identify the strings that are project-specific (will vary across harnesses).
3. Replace those with `<%= var %>` placeholders in `template.md`.
4. Declare the placeholders in `manifest.ts`'s `paramsSchema`.

The yaml in Task 2 already supplies the params needed (`displayName`, `projectOverview`, `stack.*`, `contract.*`). The template can also reference `<%= skillsSection %>` and `<%= referencesList %>` (compiler-injected).

**Files:**
- Create: `docs-pool/agent-guide/manifest.ts`
- Create: `docs-pool/agent-guide/template.md`

- [ ] **Step 1: Read the source file**

Run: `cat example/nextjs-acme/.harness/AGENTS.md`
Expected: the file contents print to stdout. Read them — you'll be parameterizing it next.

- [ ] **Step 2: Create `docs-pool/agent-guide/manifest.ts`**

```ts
import { z } from "zod";

export const paramsSchema = z.object({
  displayName: z.string(),
  projectOverview: z.string(),
  stack: z.object({
    framework: z.string(),
    database: z.string(),
    orm: z.string(),
    auth: z.string(),
    validation: z.string(),
    deploy: z.string(),
  }),
  contract: z.object({
    tenancy: z.string(),
    publicIdFormat: z.string(),
    lifecycleField: z.string(),
    lifecycleValues: z.array(z.string()),
    publicReadPath: z.string().optional(),
  }),
});

export const outputPath = "AGENTS.md";
```

- [ ] **Step 3: Create `docs-pool/agent-guide/template.md`**

Start with a parameterized copy of `example/nextjs-acme/.harness/AGENTS.md`. Replace project-specific strings with eta placeholders. The Tech Stack section has free-form descriptive strings that don't cleanly map from enum values — for v0, hardcode the four supported stack labels in the template as conditional output, or just hardcode the acme strings and accept that v0 only supports one stack combination. Choose the second (simpler): hardcode the stack labels, planning to revisit when nextjs fixture lands.

Template structure (copy this, refine in Task 16):

```markdown
# <%= displayName %> — Development Guide

> Authoritative guide for AI coding agents (Claude Code, Codex, Cursor) and human contributors working on <%= displayName %>. Update this file whenever the product contract or process changes.

## Project Overview

<%= projectOverview %>

## Canonical Product Contract

- Single user per account; no multi-tenancy boundary above the user.
- Public note IDs use the format `<%= contract.publicIdFormat %>` (lowercase Crockford base32, 26 chars).
- Public lifecycle field is named `<%= contract.lifecycleField %>`. Values are uppercase: <%= contract.lifecycleValues.map(v => '`' + v + '`').join(', ') %>.
- API routes are session-authenticated via Auth.js cookies. There is no machine API in V1.
- Primary API routes:
  - `GET /api/notes` — list the calling user's notes
  - `POST /api/notes` — create a new note (defaults to `DRAFT`)
  - `GET /api/notes/{note_id}` — read one note (owner only)
  - `PATCH /api/notes/{note_id}` — update title / body / state
  - `DELETE /api/notes/{note_id}` — soft-delete (sets `deleted_at`)
- Public sharing route: `GET <%= contract.publicReadPath %>` returns the rendered note only if `state = 'PUBLISHED'` and `deleted_at IS NULL`.
- Duplicate-create rule: same user + same title + same body within 5 seconds returns `409` with the existing `note_id`.

## Tech Stack

- Next.js 16 App Router (TypeScript, strict mode)
- Tailwind CSS with CSS variables
- Postgres via Neon (Vercel Marketplace)
- Drizzle ORM
- Auth.js (NextAuth v5) with email magic-link provider
- `zod` for validation at route boundaries
- `ulid` for public ID generation
- Vercel Fluid Compute for deployment

[... rest of file, copy verbatim from existing AGENTS.md sections "Planning Document Convention" through "Development Commands" ...]
```

**The contract bullets, primary API routes, and tech stack details above are currently acme-specific.** That's expected for v0 — we only need byte-equality for acme. The `<%= ... %>` placeholders only need to cover the few strings that we want to *prove* are parameterized (displayName, projectOverview, contract publicIdFormat / lifecycleField / lifecycleValues / publicReadPath). Other fields stay hardcoded until the nextjs fixture adds pressure to parameterize them.

- [ ] **Step 4: Fill in the rest of the template**

Continue `template.md` with everything from the existing `AGENTS.md` starting at `## Planning Document Convention` through the end of `## Development Commands`. Copy verbatim — these sections don't need parameterization for v0.

- [ ] **Step 5: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (vacuous). The template existing doesn't change behavior — `compile()` is still a stub.

- [ ] **Step 6: Commit**

```bash
git add docs-pool/agent-guide/
git commit -m "feat: add agent-guide docs-pool fragment"
```

---

## Task 8: docs-pool fragment — `architecture` → `ARCHITECTURE.md`

Same pattern as Task 7.

**Files:**
- Create: `docs-pool/architecture/manifest.ts`
- Create: `docs-pool/architecture/template.md`

- [ ] **Step 1: Read the source file**

Run: `cat example/nextjs-acme/.harness/ARCHITECTURE.md`

- [ ] **Step 2: Create `docs-pool/architecture/manifest.ts`**

```ts
import { z } from "zod";

export const paramsSchema = z.object({
  displayName: z.string(),
  contract: z.object({
    publicIdFormat: z.string(),
    lifecycleValues: z.array(z.string()),
    publicReadPath: z.string().optional(),
  }),
});

export const outputPath = "ARCHITECTURE.md";
```

- [ ] **Step 3: Create `docs-pool/architecture/template.md`**

Copy `example/nextjs-acme/.harness/ARCHITECTURE.md` verbatim. Replace the top-level heading `# Acme Notes — Architecture` with `# <%= displayName %> — Architecture`. Leave the rest verbatim for v0.

- [ ] **Step 4: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (vacuous). `compile()` is still a stub; templates aren't read until Tasks 11+.

- [ ] **Step 5: Commit**

```bash
git add docs-pool/architecture/
git commit -m "feat: add architecture docs-pool fragment"
```

---

## Task 9: docs-pool fragment — `planning-conventions` → `docs/PLANS.md`

**Files:**
- Create: `docs-pool/planning-conventions/manifest.ts`
- Create: `docs-pool/planning-conventions/template.md`

- [ ] **Step 1: Read the source file**

Run: `cat example/nextjs-acme/.harness/docs/PLANS.md`

- [ ] **Step 2: Create `docs-pool/planning-conventions/manifest.ts`**

```ts
import { z } from "zod";

export const paramsSchema = z.object({
  displayName: z.string(),
});

export const outputPath = "docs/PLANS.md";
```

- [ ] **Step 3: Create `docs-pool/planning-conventions/template.md`**

Copy `example/nextjs-acme/.harness/docs/PLANS.md` verbatim. Replace the top-level heading `# Acme Notes — Plans Overview` with `# <%= displayName %> — Plans Overview`. Leave the rest verbatim for v0 (the "Execution Snapshot", "Phase And Proposal Summary", and "Phase Details" sections are technically acme-specific, but parameterizing the contents of a plans tracker is out of scope for v0; this is documented as deferred in the spec's open questions).

- [ ] **Step 4: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (vacuous). `compile()` is still a stub; templates aren't read until Tasks 11+.

- [ ] **Step 5: Commit**

```bash
git add docs-pool/planning-conventions/
git commit -m "feat: add planning-conventions docs-pool fragment"
```

---

## Task 10: docs-pool fragment — `product-sense` → `docs/PRODUCT_SENSE.md`

**Files:**
- Create: `docs-pool/product-sense/manifest.ts`
- Create: `docs-pool/product-sense/template.md`

- [ ] **Step 1: Read the source file**

Run: `cat example/nextjs-acme/.harness/docs/PRODUCT_SENSE.md`

- [ ] **Step 2: Create `docs-pool/product-sense/manifest.ts`**

```ts
import { z } from "zod";

export const paramsSchema = z.object({
  displayName: z.string(),
});

export const outputPath = "docs/PRODUCT_SENSE.md";
```

- [ ] **Step 3: Create `docs-pool/product-sense/template.md`**

Copy `example/nextjs-acme/.harness/docs/PRODUCT_SENSE.md` verbatim. Replace the top-level heading `# Acme Notes — Product Vision and Sense` with `# <%= displayName %> — Product Vision and Sense`. Leave the rest verbatim.

- [ ] **Step 4: Re-run the test (no change expected)**

Run: `npm test`
Expected: PASS (vacuous). `compile()` is still a stub; templates aren't read until Tasks 11+.

- [ ] **Step 5: Commit**

```bash
git add docs-pool/product-sense/
git commit -m "feat: add product-sense docs-pool fragment"
```

---

## Task 11: Implement `load()`

Read yaml, validate against `HarnessYaml` zod schema, return a typed object.

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Replace stub `src/compile.ts` with the load implementation**

```ts
import { readFileSync } from "node:fs";
import { z } from "zod";
import { parse as parseYaml } from "yaml";

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const HarnessYaml = z.object({
  name: z.string(),
  displayName: z.string(),
  projectOverview: z.string(),

  stack: z.object({
    framework: z.enum(["nextjs-16"]),
    database: z.enum(["postgres-neon"]),
    orm: z.enum(["drizzle"]),
    auth: z.enum(["authjs-magic-link"]),
    validation: z.enum(["zod"]),
    deploy: z.enum(["vercel-fluid"]),
  }),

  contract: z.object({
    tenancy: z.enum(["single-user", "single-tenant", "multi-tenant"]),
    publicIdFormat: z.string(),
    lifecycleField: z.string(),
    lifecycleValues: z.array(z.string()),
    publicReadPath: z.string().optional(),
  }),

  docs: z.array(z.string()).min(1),
  skills: z.array(z.string()),
  references: z.array(z.string()),

  permissions: z
    .object({
      preset: z.enum(["default-nextjs"]),
    })
    .optional(),
});
export type ParsedHarness = z.infer<typeof HarnessYaml>;

export const CatalogEntry = z.object({
  id: z.string(),
  displayName: z.string(),
  source: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("plugin"),
      plugin: z.string(),
      name: z.string(),
    }),
    z.object({
      kind: z.literal("builtin"),
      name: z.string(),
    }),
  ]),
  description: z.string(),
  whenToUse: z.string(),
  rigidity: z.enum(["rigid", "flexible"]).optional(),
});
export type CatalogEntry = z.infer<typeof CatalogEntry>;

// ─── Pipeline ────────────────────────────────────────────────────────────────

export function load(yamlPath: string): ParsedHarness {
  const raw = readFileSync(yamlPath, "utf-8");
  const obj = parseYaml(raw);
  const result = HarnessYaml.safeParse(obj);
  if (!result.success) {
    throw new Error(
      `${yamlPath}: schema validation failed\n${JSON.stringify(result.error.issues, null, 2)}`,
    );
  }
  return result.data;
}

// stubs — implemented in later tasks
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  const parsed = load(yamlPath);
  void parsed;
  void outDir;
}
```

- [ ] **Step 2: Run the test**

Run: `npm test`
Expected: PASS (vacuous, but `load()` is now exercised). The compiler reads + validates the yaml then exits. If the yaml has a schema error, you'd see a thrown zod error and the test would fail — confirms `load()` works.

- [ ] **Step 3: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement load phase (yaml → typed object)"
```

---

## Task 12: Implement `resolve()`

Walk the yaml's `docs`, `skills`, `references` arrays. For each entry, find the source on disk and validate per-fragment params.

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Add resolve types and implementation**

Append to `src/compile.ts` (after `load`):

```ts
import { existsSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import type { ZodTypeAny } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolvePath(__dirname, "..");

export type ResolvedDoc = {
  kind: "doc";
  id: string;
  templatePath: string;
  outputPath: string;
  params: unknown;
};

export type ResolvedSkill = {
  kind: "skill";
  entry: CatalogEntry;
};

export type ResolvedReference = {
  kind: "reference";
  srcPath: string;
  outputPath: string;
};

export type ResolvedHarness = {
  docs: ResolvedDoc[];
  skills: ResolvedSkill[];
  references: ResolvedReference[];
  permissions?: ParsedHarness["permissions"];
};

export async function resolve(parsed: ParsedHarness): Promise<ResolvedHarness> {
  const docs = await Promise.all(parsed.docs.map(async (id) => resolveDoc(id, parsed)));
  const skills = parsed.skills.map(resolveSkill);
  const references = parsed.references.map(resolveReference);
  return { docs, skills, references, permissions: parsed.permissions };
}

async function resolveDoc(id: string, parsed: ParsedHarness): Promise<ResolvedDoc> {
  const dir = join(repoRoot, "docs-pool", id);
  if (!existsSync(dir)) {
    throw new Error(`unknown doc fragment: "${id}" (looked in ${dir})`);
  }
  const manifestPath = join(dir, "manifest.ts");
  const templatePath = join(dir, "template.md");
  if (!existsSync(manifestPath)) throw new Error(`missing manifest.ts in docs-pool/${id}`);
  if (!existsSync(templatePath)) throw new Error(`missing template.md in docs-pool/${id}`);

  const manifest = (await import(manifestPath)) as {
    paramsSchema: ZodTypeAny;
    outputPath: string;
  };

  const result = manifest.paramsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `docs-pool/${id}: param validation failed\n${JSON.stringify(result.error.issues, null, 2)}`,
    );
  }

  return {
    kind: "doc",
    id,
    templatePath,
    outputPath: manifest.outputPath,
    params: result.data,
  };
}

function resolveSkill(id: string): ResolvedSkill {
  const [plugin, name] = id.includes(":") ? id.split(":", 2) : [undefined, id];
  const path = plugin
    ? join(repoRoot, "catalog", plugin, `${name}.json`)
    : join(repoRoot, "catalog", `${name}.json`);
  if (!existsSync(path)) {
    throw new Error(`unknown skill: "${id}" (looked in ${path})`);
  }
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const result = CatalogEntry.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `catalog entry ${path}: schema validation failed\n${JSON.stringify(result.error.issues, null, 2)}`,
    );
  }
  return { kind: "skill", entry: result.data };
}

function resolveReference(id: string): ResolvedReference {
  const dir = join(repoRoot, "references-pool");
  const matches = readdirSync(dir).filter((f) => {
    const ext = extname(f);
    return f.slice(0, f.length - ext.length) === id || f === id;
  });
  if (matches.length === 0) {
    throw new Error(`unknown reference: "${id}" (looked in ${dir})`);
  }
  if (matches.length > 1) {
    throw new Error(`ambiguous reference: "${id}" matched ${matches.length} files in ${dir}: ${matches.join(", ")}`);
  }
  const file = matches[0];
  return {
    kind: "reference",
    srcPath: join(dir, file),
    outputPath: join("docs/references", file),
  };
}
```

**Note on the reference-matching rule:** `id: auth-js` matches `auth-js-llms.txt`? No — it matches by exact stem (basename minus ext). The current rule above would NOT match `auth-js-llms.txt` for id `auth-js`. To make the v0 yaml work, either:

- (a) change the yaml `references: - auth-js-llms` (stem matches)
- (b) change the rule to "filename starts with id"

Pick (a) — it's explicit. Update `example/nextjs-acme/harness.yaml` to use `auth-js-llms` as the reference id. Then the output path will be `docs/references/auth-js-llms.txt`, matching the target.

- [ ] **Step 2: Update the yaml to use the stem id**

Edit `example/nextjs-acme/harness.yaml`, change:

```yaml
references:
  - auth-js
```

to:

```yaml
references:
  - auth-js-llms
```

- [ ] **Step 3: Wire `resolve` into `compile()`**

Replace the body of `compile()` with:

```ts
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  const parsed = load(yamlPath);
  const resolved = await resolve(parsed);
  void resolved;
  void outDir;
}
```

- [ ] **Step 4: Run the test**

Run: `npm test`
Expected: PASS (vacuous, but `resolve()` is now exercised). No errors thrown confirms resolve found every doc / skill / reference id. If you see "unknown doc/skill/reference", that's a wiring bug — fix before continuing.

- [ ] **Step 5: Commit**

```bash
git add src/compile.ts example/nextjs-acme/harness.yaml
git commit -m "feat(compile): implement resolve phase (find + validate fragments)"
```

---

## Task 13: Implement `render()` — docs with derived params

Render each doc fragment with eta, passing the validated params plus compiler-derived params (`skillsSection`, `referencesList`).

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Add render() implementation (docs only for now)**

Append to `src/compile.ts`:

```ts
import { Eta } from "eta";

const eta = new Eta({
  autoEscape: false,
  useWith: true,
  rmWhitespace: false,
});

export async function render(resolved: ResolvedHarness): Promise<Map<string, string | Buffer>> {
  const out = new Map<string, string | Buffer>();

  const derived = {
    skillsSection: buildSkillsSection(resolved.skills),
    referencesList: resolved.references.map((r) => r.outputPath.split("/").pop()!),
    harnessKitVersion: "0.0.0",
  };

  for (const doc of resolved.docs) {
    const tmpl = readFileSync(doc.templatePath, "utf-8");
    const rendered = eta.renderString(tmpl, { ...(doc.params as object), ...derived });
    out.set(doc.outputPath, rendered);
  }

  // Task 14: skills, references, permissions

  return out;
}

function buildSkillsSection(skills: ResolvedSkill[]): string {
  // Short summary used inside doc templates that reference <%= skillsSection %>.
  // No template references it in v0 — kept here for forward compatibility.
  return skills.map((s) => `- **${s.entry.displayName}** — ${s.entry.description}`).join("\n");
}
```

- [ ] **Step 2: Wire render into compile()**

Update `compile()`:

```ts
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  const parsed = load(yamlPath);
  const resolved = await resolve(parsed);
  const files = await render(resolved);
  void files;
  void outDir;
}
```

- [ ] **Step 3: Run the test**

Run: `npm test`
Expected: PASS (vacuous, but `render()` is now exercised for docs). The rendered Map is built in memory but emit is still a stub, so nothing is written to disk. If you see an eta `undefined variable` error, fix the template or the params schema before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement render phase for docs"
```

---

## Task 14: Implement `render()` — skills, references, permissions

Extend `render()` to produce `SKILLS.md`, copy reference files, and emit the permissions preset.

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Extend `render()` to handle skills + references + permissions**

Replace the `// Task 14: skills, references, permissions` comment with:

```ts
  // Skills → SKILLS.md
  if (resolved.skills.length > 0) {
    out.set("SKILLS.md", buildSkillsDoc(resolved.skills));
  }

  // References → copy bytes
  for (const ref of resolved.references) {
    out.set(ref.outputPath, readFileSync(ref.srcPath));
  }

  // Permissions preset → .claude/settings.example.json
  if (resolved.permissions?.preset) {
    out.set(".claude/settings.example.json", renderPermissionsPreset(resolved.permissions.preset));
  }
```

- [ ] **Step 2: Add the helper functions**

Append to `src/compile.ts`:

```ts
function buildSkillsDoc(skills: ResolvedSkill[]): string {
  const sections = skills.map((s) => {
    const source =
      s.entry.source.kind === "plugin"
        ? `**Source:** plugin \`${s.entry.source.plugin}\``
        : `**Source:** built-in`;
    return [
      `## ${s.entry.id}`,
      "",
      source,
      "",
      s.entry.description,
      "",
      `**When to use:** ${s.entry.whenToUse}`,
    ].join("\n");
  });

  return [
    "# Installed Skills",
    "",
    "This project expects the following skills to be available to the AI coding agent. Install the corresponding plugins / configure your agent so each is invocable.",
    "",
    sections.join("\n\n"),
    "",
  ].join("\n");
}

function renderPermissionsPreset(preset: "default-nextjs"): string {
  if (preset !== "default-nextjs") throw new Error(`unknown permissions preset: ${preset}`);
  return JSON.stringify(
    {
      $schema: "https://json.schemastore.org/claude-code-settings.json",
      permissions: {
        allow: [
          "Bash(npm:*)",
          "Bash(npx:*)",
          "Bash(git status)",
          "Bash(git diff:*)",
          "Bash(git log:*)",
          "Read(./**)",
          "Write(./**)",
          "Edit(./**)",
        ],
        deny: ["Bash(rm -rf:*)", "Bash(git push --force:*)"],
      },
    },
    null,
    2,
  );
}
```

**Important:** The exact format of `SKILLS.md` and `settings.example.json` produced here MUST match the hand-curated target files from Tasks 3 and 5 byte-for-byte. The output of `JSON.stringify(obj, null, 2)` does *not* end with a trailing newline — the target file from Task 5 may or may not have one. If diffs appear here in Task 16, the fix is to either (a) add a trailing newline to the renderer output, or (b) ensure both files lack trailing newlines.

- [ ] **Step 3: Run the test**

Run: `npm test`
Expected: PASS (vacuous, but the full render pipeline is now exercised). The rendered Map now includes docs + SKILLS.md + references + permissions. Emit is still a stub, so nothing reaches disk.

- [ ] **Step 4: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement render for skills, references, permissions"
```

---

## Task 15: Implement `emit()`

Write the file map to disk.

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Add emit() implementation**

Append to `src/compile.ts`:

```ts
import { mkdirSync, writeFileSync } from "node:fs";

export function emit(files: Map<string, string | Buffer>, outDir: string): void {
  for (const [rel, content] of files) {
    const fullPath = join(outDir, rel);
    mkdirSync(dirname(fullPath), { recursive: true });
    if (typeof content === "string") {
      writeFileSync(fullPath, content, "utf-8");
    } else {
      writeFileSync(fullPath, content);
    }
  }
}
```

- [ ] **Step 2: Wire emit into compile()**

Update `compile()`:

```ts
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  const parsed = load(yamlPath);
  const resolved = await resolve(parsed);
  const files = await render(resolved);
  emit(files, outDir);
}
```

- [ ] **Step 3: Run the test**

Run: `npm test`
Expected: the test now runs end-to-end with files on disk and **real assertions** (no longer vacuous). Likely outcomes:
- `Compiler emitted files that aren't in the target: [...]` — emit produced a file the target lacks. Either the renderer's output path is wrong, or the target needs the file (Tasks 3/4/5 should have covered the expected ones).
- `File differs: <path>` — content drift. Fix in Task 16.
- (best case, unlikely on first run) PASS.

- [ ] **Step 4: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement emit phase (write tree to disk)"
```

---

## Task 16: Iterate to byte-equal

The integration test is now running end-to-end but is likely red. Each iteration: read the failure, fix the smallest thing, re-run.

**Files:** any of the templates, manifests, yaml, target files, or `src/compile.ts`.

- [ ] **Step 1: Run the test and read the first diff**

Run: `npm test`
Expected: either passing (skip to Step 5) or a specific diff/mismatch.

- [ ] **Step 2: Diagnose**

Common diff causes and where to fix:

| Symptom | Likely cause | Fix in |
|---------|--------------|--------|
| `Compiler emitted files that aren't in the target: [...]` | Compiler produced an output path that doesn't exist in the target. Most likely cause: a manifest's `outputPath` typo, or a target file got missed in Tasks 3/4/5 | Fix manifest `outputPath`, or add the file to the target |
| `File differs: SKILLS.md` with text diff | Hand-curated target text doesn't match `buildSkillsDoc` output | Edit `SKILLS.md` target *or* `buildSkillsDoc` to converge |
| `File differs: .claude/settings.example.json` — trailing newline | `JSON.stringify` doesn't add one; target file may have one from editor | Add `+ "\n"` to `renderPermissionsPreset` return, OR strip trailing newline on target |
| `File differs: AGENTS.md` — small text drift | Template eta output doesn't match hand-written AGENTS.md byte-for-byte | Edit `docs-pool/agent-guide/template.md` to converge with the target |
| `File differs: <some .md>` — whitespace | eta's `rmWhitespace`, trailing newlines, eta delimiters eating whitespace | Adjust template or eta config |
| `param validation failed` in resolve | A manifest schema doesn't match what the yaml provides | Adjust the manifest's `paramsSchema` |
| `eta undefined variable` | Template references a param the manifest doesn't declare or the yaml doesn't provide | Add to manifest schema + yaml, or hardcode in template |
| Test passes too early | The compiler emits 0 files but the test reports green | Probably wired `compile()` incorrectly — check that `emit(files, outDir)` is being called, not stubbed |

- [ ] **Step 3: Fix one thing**

Make the smallest change that addresses the first failure. Don't batch fixes; each loop is one fix, one re-run.

- [ ] **Step 4: Re-run and loop**

Run: `npm test`
Expected: either a new (different) failure, or a pass. If the same failure repeats, your fix was incorrect — re-diagnose.

Repeat Steps 1–4 until the test passes.

- [ ] **Step 5: Final verification**

Run: `npm test`
Expected:
```
 ✓ test/fixtures.test.ts (1)
   ✓ nextjs-acme: compiled tree is a byte-equal subset of the target

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Sanity-check by manual inspection: the compiler should have produced 4 doc files + `SKILLS.md` + `docs/references/auth-js-llms.txt` + `.claude/settings.example.json` = 7 files total. Verify with `ls -R <tmpdir>` during a debug run, or temporarily add `console.log([...files.keys()])` in `emit()` then remove it.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: harness-kit MVP v0 — yaml→folder compiler with byte-equal round-trip"
```

v0 ships when this test is green. Next iteration (CLI, watch, second fixture, self-host) starts from here.

---

## Notes for the engineer

- **You can run individual phases manually** by adding a tiny REPL-style file under `scratch/`. E.g. `tsx scratch/try-load.ts` that calls `load(...)` and `console.log`s the result. Don't commit scratch files; the `.gitignore` doesn't exclude `scratch/` by default so add it locally if you want.
- **eta delimiters** default to `<% %>` and `<%= %>`. They eat preceding whitespace on the same line in certain modes — if you see unexpected blank lines or missing newlines in rendered output, that's the most common cause. The config in Task 13 sets `rmWhitespace: false` to avoid surprises.
- **JSON whitespace** matters for byte-equality. `JSON.stringify(obj, null, 2)` uses 2-space indent, no trailing newline. If your editor auto-adds a trailing newline to the hand-curated target file, you must either (a) configure your editor not to, (b) strip the trailing newline from the target, or (c) add `+ "\n"` to the renderer output. Pick one and be consistent.
- **The `docs-pool/*/manifest.ts` files are TypeScript** that the compiler dynamically imports via `await import(manifestPath)`. With `"type": "module"` in `package.json` and `tsx` as the runner, this works without a build step. If you see "Cannot find module" errors on the manifest path, double-check the extension (`.ts`) and that tsx is the active loader (`npm test` runs through vitest, which respects the tsx loader transparently).
- **Don't add features.** If a thought starts with "while we're in here, let's also...", stop. This plan is v0. Everything else is later.
