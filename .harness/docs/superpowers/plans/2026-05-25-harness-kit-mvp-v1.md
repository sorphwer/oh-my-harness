# harness-kit MVP v1 Implementation Plan

> **NEEDS REWRITE (2026-05-25 reorg).** This plan was authored before the `skills-pool/` → `plugins/<category>/skills/<name>/SKILL.md` reorganization. It still assumes (a) plugin ids `superpowers` / `code-review` (now `planning` / `delivery` etc. on disk), (b) skill source format `skills/<name>.json` (now nested `skills/<name>/SKILL.md` with frontmatter), and (c) a `CatalogEntry` JSON schema. Do NOT execute this plan as-written — it will create a parallel, divergent plugin tree. Re-run `writing-plans` against the current spec (`../specs/2026-05-25-harness-yaml-schema-design.md`) to produce a v2 plan that targets the on-disk layout.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal TypeScript script (`src/compile.ts`) that reads `harness-kit-example/nextjs-acme/harness.yaml` (new schema: `preset: nextjs` + `extras`) and writes `harness-kit-example/nextjs-acme/.harness/` byte-identical to a hand-curated target. All reusable content lives under `plugins/<id>/`; the preset expands to a plugin id list.

**Architecture:** Four pipeline phases as plain functions in one file — `load` (yaml→typed object) → `resolve` (preset → plugin ids → walk `plugins/<id>/{skills,agents,hooks,docs,permissions.json}`) → `render` (fragments→file content map) → `emit` (map→disk). No CLI, no watch, no check mode. One integration test asserts byte equality between compiled output and hand-curated target using the subset rule.

**Tech Stack:** TypeScript (run via `tsx`, no build step). Deps: `yaml`, `zod`, `eta`. Dev deps: `vitest`, `tsx`, `typescript`, `@types/node`.

**Spec:** [`../specs/2026-05-25-harness-yaml-schema-design.md`](../specs/2026-05-25-harness-yaml-schema-design.md)

**Supersedes:** [`2026-05-25-harness-kit-mvp-v0.md`](2026-05-25-harness-kit-mvp-v0.md) (pre-redesign schema; kept for reference).

---

## File Structure

Files this plan creates or modifies:

**Existing (must not regress):**
- `harness-kit-example/nextjs-acme/harness.yaml` — new-schema yaml, already authored
- `harness-kit-example/nextjs-acme/.harness/AGENTS.md`
- `harness-kit-example/nextjs-acme/.harness/ARCHITECTURE.md`
- `harness-kit-example/nextjs-acme/.harness/docs/PLANS.md`
- `harness-kit-example/nextjs-acme/.harness/docs/PRODUCT_SENSE.md`

**New:**
- `package.json`, `tsconfig.json`, `.gitignore`
- `src/compile.ts` — load / resolve / render / emit + preset map + shared zod schemas
- `test/fixtures.test.ts`, `test/helpers.ts`
- `plugins/superpowers/README.md`
- `plugins/superpowers/skills/writing-plans.json`
- `plugins/superpowers/skills/test-driven-development.json`
- `plugins/superpowers/skills/executing-plans.json`
- `plugins/code-review/README.md`
- `plugins/code-review/skills/code-review.json`
- `plugins/nextjs/README.md`
- `plugins/nextjs/permissions.json`
- `plugins/nextjs/docs/agent-guide/{manifest.ts, template.md}`
- `plugins/nextjs/docs/architecture/{manifest.ts, template.md}`
- `plugins/nextjs/docs/planning-conventions/{manifest.ts, template.md}`
- `plugins/nextjs/docs/product-sense/{manifest.ts, template.md}`
- `references-pool/auth-js-llms.txt`
- `harness-kit-example/nextjs-acme/.harness/SKILLS.md` — hand-curated target
- `harness-kit-example/nextjs-acme/.harness/docs/references/auth-js-llms.txt` — hand-curated target
- `harness-kit-example/nextjs-acme/.harness/.claude/settings.example.json` — hand-curated target (permissions + plugin list)

### What v0 exercises

The `nextjs` preset (hardcoded in `src/compile.ts`) expands to `["superpowers", "code-review", "nextjs"]`. Acme's yaml has no `extras`. Resolved buckets for acme:

- `plugins`: `["superpowers", "code-review", "nextjs"]` (declared in settings.example.json)
- `skills`: 3 from superpowers + 1 from code-review = 4
- `docs`: 4 from nextjs (agent-guide, architecture, planning-conventions, product-sense)
- `permissions`: from `plugins/nextjs/permissions.json`
- `agents`: empty (no plugin ships any in v0)
- `hooks`: empty (no plugin ships any in v0)
- `references`: 1 (auth-js-llms)

Code paths for agents and hooks are wired in `resolve()` and `render()` but produce no files for the acme fixture. The first plugin that ships `agents/` or `hooks/` (post-v0) exercises them.

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
  "include": ["src/**/*.ts", "test/**/*.ts", "plugins/**/*.ts"]
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
Expected: Vitest exits with "No test files found" or similar non-error message.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore
git commit -m "chore: scaffold harness-kit project (deps, tsconfig)"
```

---

## Task 1: Failing fixture test + stub compile

**Files:**
- Create: `src/compile.ts`
- Create: `test/helpers.ts`
- Create: `test/fixtures.test.ts`

- [ ] **Step 1: Create stub `src/compile.ts`**

```ts
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  // stub — real implementation lands in later tasks
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
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "vitest";
import { compile } from "../src/compile";
import { assertActualSubsetOfExpected } from "./helpers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

test("nextjs-acme: compiled tree is a byte-equal subset of the target", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "harness-kit-"));
  await compile(
    join(repoRoot, "harness-kit-example/nextjs-acme/harness.yaml"),
    tmp,
  );
  assertActualSubsetOfExpected(tmp, join(repoRoot, "harness-kit-example/nextjs-acme/.harness"));
});
```

- [ ] **Step 4: Run the test**

Run: `npm test`
Expected: PASS (stub writes no files; subset rule is trivially satisfied).

- [ ] **Step 5: Commit**

```bash
git add src/compile.ts test/helpers.ts test/fixtures.test.ts
git commit -m "test: add fixture round-trip test (vacuously green)"
```

---

## Task 2: Verify `harness-kit-example/nextjs-acme/harness.yaml`

This file already exists from the doc-update sweep. Sanity-check it matches the schema before downstream tasks depend on it.

**Files:**
- Modify (if needed): `harness-kit-example/nextjs-acme/harness.yaml`

- [ ] **Step 1: Print and confirm shape**

Run: `cat harness-kit-example/nextjs-acme/harness.yaml`
Expected: contains `preset: nextjs`, `name: acme-notes`, `displayName: Acme Notes`, `overview`, `stack`, `contract`, `references: [auth-js-llms]`. No `extras:`. No `docs:` / `skills:` / `permissions:` at the top level.

Canonical content (reset to this if drift is found):

```yaml
preset: nextjs

name: acme-notes
displayName: Acme Notes
overview: |
  Acme Notes is a single-user Next.js notes app. Each signed-in user owns a
  private collection of notes. Notes have a small lifecycle
  (DRAFT → PUBLISHED → ARCHIVED) and can be shared by URL only after they
  reach PUBLISHED.

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

references:
  - auth-js-llms
```

- [ ] **Step 2: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 3: Commit if edited**

```bash
git add harness-kit-example/nextjs-acme/harness.yaml
git commit -m "chore(example): reconfirm acme harness.yaml matches v1 schema"
```

---

## Task 3: Expand acme target — `SKILLS.md`

The hand-curated `SKILLS.md` that the compiler must reproduce byte-for-byte.

**Files:**
- Create: `harness-kit-example/nextjs-acme/.harness/SKILLS.md`

- [ ] **Step 1: Create `harness-kit-example/nextjs-acme/.harness/SKILLS.md`**

```markdown
# Installed Skills

This project expects the following skills to be available to the AI coding agent. Install the corresponding plugins / configure your agent so each is invocable.

## superpowers:executing-plans

**Source:** plugin `superpowers`

Use when following a written implementation plan task-by-task inside one session.

**When to use:** After a plan is written, when execution is happening in the current session rather than via dispatched subagents.

## superpowers:test-driven-development

**Source:** plugin `superpowers`

Use when implementing any feature or bugfix that changes observable behavior.

**When to use:** Code edits that change behavior (not docs, config, or pure refactors without behavior change).

## superpowers:writing-plans

**Source:** plugin `superpowers`

Use when turning an approved design spec into a task-by-task implementation plan.

**When to use:** After a brainstorm produces an approved spec and before any implementation begins.

## code-review

**Source:** plugin `code-review`

Use when reviewing the current diff for correctness bugs before opening a PR.

**When to use:** Before requesting human review, after the implementation is locally green.
```

Order matters: `resolve()` iterates preset plugins in preset order (`superpowers`, `code-review`, `nextjs`) and within each plugin uses `readdirSync(skillsDir).sort()`, which yields alphabetical filename order. So superpowers contributes (alphabetical by filename) `executing-plans`, `test-driven-development`, `writing-plans` — then code-review's single skill follows. The `## <id>` headings, `**Source:**` lines, body paragraphs, and `**When to use:**` lines must match `buildSkillsDoc` output in Task 17 word-for-word.

- [ ] **Step 2: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 3: Commit**

```bash
git add harness-kit-example/nextjs-acme/.harness/SKILLS.md
git commit -m "feat(example): expand acme target with SKILLS.md"
```

---

## Task 4: Expand acme target — reference file

**Files:**
- Create: `references-pool/auth-js-llms.txt`
- Create: `harness-kit-example/nextjs-acme/.harness/docs/references/auth-js-llms.txt`

- [ ] **Step 1: Create `references-pool/auth-js-llms.txt`**

The two files must be byte-identical.

```
# Auth.js — LLM Reference Stub

This is a placeholder reference file for harness-kit v0. In a real project, this file would contain the relevant Auth.js documentation flattened to plain text for the agent to read.

See https://authjs.dev for the real documentation.
```

- [ ] **Step 2: Copy to target**

Run: `mkdir -p harness-kit-example/nextjs-acme/.harness/docs/references && cp references-pool/auth-js-llms.txt harness-kit-example/nextjs-acme/.harness/docs/references/auth-js-llms.txt`

- [ ] **Step 3: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 4: Commit**

```bash
git add references-pool/auth-js-llms.txt harness-kit-example/nextjs-acme/.harness/docs/references/auth-js-llms.txt
git commit -m "feat: add auth-js reference to pool and acme target"
```

---

## Task 5: Expand acme target — `.claude/settings.example.json`

The settings file carries: a permissions block (merged from each enabled plugin's `permissions.json`; for acme only `nextjs` ships one), a plugin list (the resolved id list), and (when any plugin ships hooks) a hooks block (acme has none).

**Files:**
- Create: `harness-kit-example/nextjs-acme/.harness/.claude/settings.example.json`

- [ ] **Step 1: Create the file**

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
  },
  "plugins": [
    "superpowers",
    "code-review",
    "nextjs"
  ]
}
```

Key order matters for byte equality: `$schema`, `permissions`, `plugins`. Two-space indent. Pick a trailing-newline policy (with or without) and match it in `renderSettings` in Task 17.

- [ ] **Step 2: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 3: Commit**

```bash
git add harness-kit-example/nextjs-acme/.harness/.claude/settings.example.json
git commit -m "feat(example): expand acme target with settings.example.json"
```

---

## Task 6: Create `plugins/superpowers/`

A pure-skill plugin: only `README.md` and `skills/`.

**Files:**
- Create: `plugins/superpowers/README.md`
- Create: `plugins/superpowers/skills/writing-plans.json`
- Create: `plugins/superpowers/skills/test-driven-development.json`
- Create: `plugins/superpowers/skills/executing-plans.json`

- [ ] **Step 1: Create `plugins/superpowers/README.md`**

```markdown
# superpowers — process skills for spec-driven agentic development

## What it contributes

- Skills: `writing-plans`, `test-driven-development`, `executing-plans`
- Agents: none
- Hooks: none
- Docs: none
- Permissions: none

## When to use

For any project that benefits from a disciplined brainstorm → spec → plan → implementation loop. The skills are framework- and language-agnostic and pair well with stack plugins (like `nextjs`).
```

- [ ] **Step 2: Create `plugins/superpowers/skills/writing-plans.json`**

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

- [ ] **Step 3: Create `plugins/superpowers/skills/test-driven-development.json`**

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

- [ ] **Step 4: Create `plugins/superpowers/skills/executing-plans.json`**

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

**Critical:** The `description` and `whenToUse` strings here MUST match the corresponding text in `harness-kit-example/nextjs-acme/.harness/SKILLS.md` (Task 3) word-for-word.

- [ ] **Step 5: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 6: Commit**

```bash
git add plugins/superpowers/
git commit -m "feat: add superpowers plugin (3 skills)"
```

---

## Task 7: Create `plugins/code-review/`

A single-skill plugin.

**Files:**
- Create: `plugins/code-review/README.md`
- Create: `plugins/code-review/skills/code-review.json`

- [ ] **Step 1: Create `plugins/code-review/README.md`**

```markdown
# code-review — diff-correctness skill

## What it contributes

- Skills: `code-review`
- Agents: none
- Hooks: none
- Docs: none
- Permissions: none

## When to use

When you want the agent to review the current diff for correctness bugs before opening a PR. Pairs with any stack plugin.
```

- [ ] **Step 2: Create `plugins/code-review/skills/code-review.json`**

```json
{
  "id": "code-review",
  "displayName": "code-review",
  "source": {
    "kind": "plugin",
    "plugin": "code-review",
    "name": "code-review"
  },
  "description": "Use when reviewing the current diff for correctness bugs before opening a PR.",
  "whenToUse": "Before requesting human review, after the implementation is locally green.",
  "rigidity": "flexible"
}
```

`description` and `whenToUse` MUST match `harness-kit-example/nextjs-acme/.harness/SKILLS.md` (Task 3) word-for-word.

- [ ] **Step 3: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 4: Commit**

```bash
git add plugins/code-review/
git commit -m "feat: add code-review plugin (single skill)"
```

---

## Task 8: Create `plugins/nextjs/` skeleton — README + permissions

The stack plugin. This task lays down its README and permissions; Tasks 9–12 add the four `docs/` fragments.

**Files:**
- Create: `plugins/nextjs/README.md`
- Create: `plugins/nextjs/permissions.json`

- [ ] **Step 1: Create `plugins/nextjs/README.md`**

```markdown
# nextjs — Next.js stack plugin (docs + permissions)

## What it contributes

- Skills: none
- Agents: none
- Hooks: none
- Docs: `AGENTS.md`, `ARCHITECTURE.md`, `docs/PLANS.md`, `docs/PRODUCT_SENSE.md`
- Permissions: yes (Next.js-friendly defaults: npm/npx/git read-mostly + write/edit on the project)

## When to use

For any Next.js 16 App Router project. Pairs with `superpowers` (process skills) and `code-review` (diff review).
```

- [ ] **Step 2: Create `plugins/nextjs/permissions.json`**

```json
{
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
```

This is the structure `renderSettings` will read in Task 17 and merge into `.claude/settings.example.json`'s `permissions` block. The content must match the `permissions` field of the target file in Task 5.

- [ ] **Step 3: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 4: Commit**

```bash
git add plugins/nextjs/README.md plugins/nextjs/permissions.json
git commit -m "feat: add nextjs plugin skeleton (README + permissions)"
```

---

## Task 9: `plugins/nextjs/docs/agent-guide/` → `AGENTS.md`

The first and largest doc fragment. Strategy: read `harness-kit-example/nextjs-acme/.harness/AGENTS.md`, identify project-specific strings, replace with `<%= var %>` placeholders, declare in `manifest.ts`'s `paramsSchema`.

The yaml in Task 2 supplies the required params (`displayName`, `overview`, `stack.*`, `contract.*`). Templates may also reference compiler-injected derived params (`<%= skillsSection %>`, `<%= referencesList %>`).

**Files:**
- Create: `plugins/nextjs/docs/agent-guide/manifest.ts`
- Create: `plugins/nextjs/docs/agent-guide/template.md`

- [ ] **Step 1: Read the source**

Run: `cat harness-kit-example/nextjs-acme/.harness/AGENTS.md`

- [ ] **Step 2: Create `plugins/nextjs/docs/agent-guide/manifest.ts`**

```ts
import { z } from "zod";

export const paramsSchema = z.object({
  displayName: z.string(),
  overview: z.string(),
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

- [ ] **Step 3: Create `plugins/nextjs/docs/agent-guide/template.md`**

Start with this header block (parameterized contract bits + hardcoded acme specifics that don't yet parameterize):

```markdown
# <%= displayName %> — Development Guide

> Authoritative guide for AI coding agents (Claude Code, Codex, Cursor) and human contributors working on <%= displayName %>. Update this file whenever the product contract or process changes.

## Project Overview

<%= overview %>

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
```

- [ ] **Step 4: Fill in the rest of the template**

Append everything from the existing `AGENTS.md` starting at `## Planning Document Convention` through the end of `## Development Commands`. Copy verbatim — these sections stay acme-specific for v0.

- [ ] **Step 5: Re-run test**

Run: `npm test`
Expected: PASS (vacuous — compile is still a stub).

- [ ] **Step 6: Commit**

```bash
git add plugins/nextjs/docs/agent-guide/
git commit -m "feat(nextjs): add agent-guide doc fragment"
```

---

## Task 10: `plugins/nextjs/docs/architecture/` → `ARCHITECTURE.md`

**Files:**
- Create: `plugins/nextjs/docs/architecture/manifest.ts`
- Create: `plugins/nextjs/docs/architecture/template.md`

- [ ] **Step 1: Read the source**

Run: `cat harness-kit-example/nextjs-acme/.harness/ARCHITECTURE.md`

- [ ] **Step 2: Create `plugins/nextjs/docs/architecture/manifest.ts`**

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

- [ ] **Step 3: Create `plugins/nextjs/docs/architecture/template.md`**

Copy `harness-kit-example/nextjs-acme/.harness/ARCHITECTURE.md` verbatim. Replace the top-level heading `# Acme Notes — Architecture` with `# <%= displayName %> — Architecture`. Leave the rest verbatim for v0.

- [ ] **Step 4: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 5: Commit**

```bash
git add plugins/nextjs/docs/architecture/
git commit -m "feat(nextjs): add architecture doc fragment"
```

---

## Task 11: `plugins/nextjs/docs/planning-conventions/` → `docs/PLANS.md`

**Files:**
- Create: `plugins/nextjs/docs/planning-conventions/manifest.ts`
- Create: `plugins/nextjs/docs/planning-conventions/template.md`

- [ ] **Step 1: Read the source**

Run: `cat harness-kit-example/nextjs-acme/.harness/docs/PLANS.md`

- [ ] **Step 2: Create `plugins/nextjs/docs/planning-conventions/manifest.ts`**

```ts
import { z } from "zod";

export const paramsSchema = z.object({
  displayName: z.string(),
});

export const outputPath = "docs/PLANS.md";
```

- [ ] **Step 3: Create `plugins/nextjs/docs/planning-conventions/template.md`**

Copy `harness-kit-example/nextjs-acme/.harness/docs/PLANS.md` verbatim. Replace the top-level heading `# Acme Notes — Plans Overview` with `# <%= displayName %> — Plans Overview`. Leave the rest verbatim.

- [ ] **Step 4: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 5: Commit**

```bash
git add plugins/nextjs/docs/planning-conventions/
git commit -m "feat(nextjs): add planning-conventions doc fragment"
```

---

## Task 12: `plugins/nextjs/docs/product-sense/` → `docs/PRODUCT_SENSE.md`

**Files:**
- Create: `plugins/nextjs/docs/product-sense/manifest.ts`
- Create: `plugins/nextjs/docs/product-sense/template.md`

- [ ] **Step 1: Read the source**

Run: `cat harness-kit-example/nextjs-acme/.harness/docs/PRODUCT_SENSE.md`

- [ ] **Step 2: Create `plugins/nextjs/docs/product-sense/manifest.ts`**

```ts
import { z } from "zod";

export const paramsSchema = z.object({
  displayName: z.string(),
});

export const outputPath = "docs/PRODUCT_SENSE.md";
```

- [ ] **Step 3: Create `plugins/nextjs/docs/product-sense/template.md`**

Copy `harness-kit-example/nextjs-acme/.harness/docs/PRODUCT_SENSE.md` verbatim. Replace the top-level heading `# Acme Notes — Product Vision and Sense` with `# <%= displayName %> — Product Vision and Sense`. Leave the rest verbatim.

- [ ] **Step 4: Re-run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 5: Commit**

```bash
git add plugins/nextjs/docs/product-sense/
git commit -m "feat(nextjs): add product-sense doc fragment"
```

---

## Task 13: Implement `load()`

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Replace stub with the load implementation**

```ts
import { readFileSync } from "node:fs";
import { z } from "zod";
import { parse as parseYaml } from "yaml";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const Extras = z.object({
  plugins: z.array(z.string()).default([]),
  skills:  z.array(z.string()).default([]),  // each entry "<plugin>:<name>"
  agents:  z.array(z.string()).default([]),  // each entry "<plugin>:<name>"
  hooks:   z.array(z.string()).default([]),  // each entry "<plugin>:<name>"
}).partial();

export const HarnessYaml = z.object({
  preset: z.enum(["nextjs"]),

  name:        z.string(),
  displayName: z.string(),
  overview:    z.string(),

  stack: z.object({
    framework:  z.enum(["nextjs-16"]),
    database:   z.enum(["postgres-neon"]),
    orm:        z.enum(["drizzle"]),
    auth:       z.enum(["authjs-magic-link"]),
    validation: z.enum(["zod"]),
    deploy:     z.enum(["vercel-fluid"]),
  }),

  contract: z.object({
    tenancy:         z.enum(["single-user", "single-tenant", "multi-tenant"]),
    publicIdFormat:  z.string(),
    lifecycleField:  z.string(),
    lifecycleValues: z.array(z.string()),
    publicReadPath:  z.string().optional(),
  }),

  references: z.array(z.string()).default([]),

  extras: Extras.optional(),
});
export type ParsedHarness = z.infer<typeof HarnessYaml>;

export const CatalogEntry = z.object({
  id: z.string(),
  displayName: z.string(),
  source: z.object({
    kind: z.literal("plugin"),
    plugin: z.string(),
    name: z.string(),
  }),
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

// stub — implemented in later tasks
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  const parsed = load(yamlPath);
  void parsed;
  void outDir;
}
```

- [ ] **Step 2: Run test**

Run: `npm test`
Expected: PASS (vacuous). Schema mismatch would throw and fail.

- [ ] **Step 3: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement load phase (yaml → typed object)"
```

---

## Task 14: Implement preset expansion

Hardcode the `nextjs` preset as a plugin id list.

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Append preset map and helper**

```ts
// ─── Presets ─────────────────────────────────────────────────────────────────

const PRESETS: Record<string, string[]> = {
  nextjs: ["superpowers", "code-review", "nextjs"],
};

export function expandPreset(name: string): string[] {
  const plugins = PRESETS[name];
  if (!plugins) throw new Error(`unknown preset: "${name}"`);
  return plugins;
}
```

- [ ] **Step 2: Run test**

Run: `npm test`
Expected: PASS (vacuous).

- [ ] **Step 3: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): add nextjs preset (plugin id list)"
```

---

## Task 15: Implement `resolve()`

Expand the preset, walk each enabled plugin for its contributions, layer in extras.

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Append resolve types and implementation**

```ts
import { existsSync, readdirSync } from "node:fs";
import { dirname, extname, isAbsolute, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import type { ZodTypeAny } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolvePath(__dirname, "..");

export type ResolvedDoc         = { kind: "doc";         pluginId: string; id: string; templatePath: string; outputPath: string; params: unknown };
export type ResolvedSkill       = { kind: "skill";       pluginId: string; entry: CatalogEntry };
export type ResolvedReference   = { kind: "reference";   srcPath: string; outputPath: string };
export type ResolvedAgent       = { kind: "agent";       pluginId: string; name: string; srcPath: string; outputPath: string };
export type ResolvedHook        = { kind: "hook";        pluginId: string; name: string; entry: Record<string, unknown> };
export type ResolvedPermissions = { kind: "permissions"; pluginId: string; entry: { allow?: string[]; deny?: string[] } };

export type ResolvedHarness = {
  plugins:     string[];                       // declared in settings.example.json
  docs:        ResolvedDoc[];
  skills:      ResolvedSkill[];
  references:  ResolvedReference[];
  agents:      ResolvedAgent[];
  hooks:       ResolvedHook[];
  permissions: ResolvedPermissions[];
};

export async function resolve(parsed: ParsedHarness, yamlPath: string): Promise<ResolvedHarness> {
  const presetPlugins = expandPreset(parsed.preset);
  const extras = parsed.extras ?? {};

  const enabledPlugins = uniq([...presetPlugins, ...(extras.plugins ?? [])]);

  const docs:        ResolvedDoc[]         = [];
  const skills:      ResolvedSkill[]       = [];
  const agents:      ResolvedAgent[]       = [];
  const hooks:       ResolvedHook[]        = [];
  const permissions: ResolvedPermissions[] = [];

  for (const pluginId of enabledPlugins) {
    const pluginDir = join(repoRoot, "plugins", pluginId);
    if (!existsSync(pluginDir)) throw new Error(`unknown plugin: "${pluginId}" (looked in ${pluginDir})`);

    // skills/
    const skillsDir = join(pluginDir, "skills");
    if (existsSync(skillsDir)) {
      for (const f of readdirSync(skillsDir).sort()) {
        if (!f.endsWith(".json")) continue;
        skills.push({ kind: "skill", pluginId, entry: readCatalogEntry(join(skillsDir, f)) });
      }
    }

    // agents/
    const agentsDir = join(pluginDir, "agents");
    if (existsSync(agentsDir)) {
      for (const f of readdirSync(agentsDir).sort()) {
        if (!f.endsWith(".md")) continue;
        const name = f.slice(0, -3);
        agents.push({
          kind: "agent",
          pluginId,
          name,
          srcPath: join(agentsDir, f),
          outputPath: join(".claude/agents", f),
        });
      }
    }

    // hooks/
    const hooksDir = join(pluginDir, "hooks");
    if (existsSync(hooksDir)) {
      for (const f of readdirSync(hooksDir).sort()) {
        if (!f.endsWith(".json")) continue;
        const name = f.slice(0, -5);
        const entry = JSON.parse(readFileSync(join(hooksDir, f), "utf-8")) as Record<string, unknown>;
        hooks.push({ kind: "hook", pluginId, name, entry });
      }
    }

    // docs/<name>/{manifest.ts, template.md}
    const docsDir = join(pluginDir, "docs");
    if (existsSync(docsDir)) {
      for (const name of readdirSync(docsDir).sort()) {
        const docDir = join(docsDir, name);
        const manifestPath = join(docDir, "manifest.ts");
        const templatePath = join(docDir, "template.md");
        if (!existsSync(manifestPath)) throw new Error(`missing manifest.ts in plugins/${pluginId}/docs/${name}`);
        if (!existsSync(templatePath)) throw new Error(`missing template.md in plugins/${pluginId}/docs/${name}`);
        const manifest = (await import(manifestPath)) as { paramsSchema: ZodTypeAny; outputPath: string };
        const result = manifest.paramsSchema.safeParse(parsed);
        if (!result.success) {
          throw new Error(
            `plugins/${pluginId}/docs/${name}: param validation failed\n${JSON.stringify(result.error.issues, null, 2)}`,
          );
        }
        docs.push({ kind: "doc", pluginId, id: name, templatePath, outputPath: manifest.outputPath, params: result.data });
      }
    }

    // permissions.json
    const permPath = join(pluginDir, "permissions.json");
    if (existsSync(permPath)) {
      const entry = JSON.parse(readFileSync(permPath, "utf-8")) as { allow?: string[]; deny?: string[] };
      permissions.push({ kind: "permissions", pluginId, entry });
    }
  }

  // extras.skills / extras.agents / extras.hooks — each is "<plugin>:<name>"
  for (const id of extras.skills ?? []) {
    const [pluginId, name] = splitId(id, "extras.skills");
    const path = join(repoRoot, "plugins", pluginId, "skills", `${name}.json`);
    if (!existsSync(path)) throw new Error(`unknown extras.skills entry: "${id}" (looked in ${path})`);
    if (skills.some((s) => s.entry.id === id || (s.pluginId === pluginId && s.entry.source.name === name))) continue;
    skills.push({ kind: "skill", pluginId, entry: readCatalogEntry(path) });
  }
  for (const id of extras.agents ?? []) {
    const [pluginId, name] = splitId(id, "extras.agents");
    const srcPath = join(repoRoot, "plugins", pluginId, "agents", `${name}.md`);
    if (!existsSync(srcPath)) throw new Error(`unknown extras.agents entry: "${id}" (looked in ${srcPath})`);
    if (agents.some((a) => a.pluginId === pluginId && a.name === name)) continue;
    agents.push({ kind: "agent", pluginId, name, srcPath, outputPath: join(".claude/agents", `${name}.md`) });
  }
  for (const id of extras.hooks ?? []) {
    const [pluginId, name] = splitId(id, "extras.hooks");
    const path = join(repoRoot, "plugins", pluginId, "hooks", `${name}.json`);
    if (!existsSync(path)) throw new Error(`unknown extras.hooks entry: "${id}" (looked in ${path})`);
    if (hooks.some((h) => h.pluginId === pluginId && h.name === name)) continue;
    const entry = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
    hooks.push({ kind: "hook", pluginId, name, entry });
  }

  // references
  const references = parsed.references.map((id) => resolveReference(id, yamlPath));

  return { plugins: enabledPlugins, docs, skills, references, agents, hooks, permissions };
}

function uniq<T>(xs: T[]): T[] { return Array.from(new Set(xs)); }

function splitId(id: string, label: string): [string, string] {
  const i = id.indexOf(":");
  if (i === -1) throw new Error(`${label} entry "${id}" must be in "<plugin>:<name>" form`);
  return [id.slice(0, i), id.slice(i + 1)];
}

function readCatalogEntry(path: string): CatalogEntry {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const result = CatalogEntry.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `catalog entry ${path}: schema validation failed\n${JSON.stringify(result.error.issues, null, 2)}`,
    );
  }
  return result.data;
}

function resolveReference(id: string, yamlPath: string): ResolvedReference {
  if (id.startsWith("./") || id.startsWith("../") || isAbsolute(id)) {
    const srcPath = isAbsolute(id) ? id : resolvePath(dirname(yamlPath), id);
    if (!existsSync(srcPath)) throw new Error(`reference path not found: "${id}" (resolved to ${srcPath})`);
    return { kind: "reference", srcPath, outputPath: join("docs/references", basenameOf(srcPath)) };
  }
  const dir = join(repoRoot, "references-pool");
  const matches = readdirSync(dir).filter((f) => {
    const ext = extname(f);
    return f.slice(0, f.length - ext.length) === id || f === id;
  });
  if (matches.length === 0) throw new Error(`unknown reference: "${id}" (looked in ${dir})`);
  if (matches.length > 1) {
    throw new Error(`ambiguous reference: "${id}" matched ${matches.length} files in ${dir}: ${matches.join(", ")}`);
  }
  const file = matches[0];
  return { kind: "reference", srcPath: join(dir, file), outputPath: join("docs/references", file) };
}

function basenameOf(p: string): string {
  const i = p.lastIndexOf("/");
  return i === -1 ? p : p.slice(i + 1);
}
```

- [ ] **Step 2: Wire `resolve` into `compile()`**

```ts
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  const parsed = load(yamlPath);
  const resolved = await resolve(parsed, yamlPath);
  void resolved;
  void outDir;
}
```

- [ ] **Step 3: Run test**

Run: `npm test`
Expected: PASS (vacuous). No errors confirms preset expansion + plugin walking + extras resolution + reference lookup all succeed. If you see `unknown plugin/skill/reference`, fix wiring before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement resolve phase (preset → plugin walk → buckets)"
```

---

## Task 16: Implement `render()` — docs

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Append render() with docs only**

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
    referencesList: resolved.references.map((r) => basenameOf(r.outputPath)),
    harnessKitVersion: "0.0.0",
  };

  for (const doc of resolved.docs) {
    const tmpl = readFileSync(doc.templatePath, "utf-8");
    const rendered = eta.renderString(tmpl, { ...(doc.params as object), ...derived });
    out.set(doc.outputPath, rendered);
  }

  // Task 17: skills, references, agents, settings

  return out;
}

function buildSkillsSection(skills: ResolvedSkill[]): string {
  // One-line summary used inside doc templates that reference <%= skillsSection %>.
  // No v0 template uses it, but the value is computed for forward compatibility.
  return skills.map((s) => `- **${s.entry.displayName}** — ${s.entry.description}`).join("\n");
}
```

- [ ] **Step 2: Wire render into compile()**

```ts
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  const parsed = load(yamlPath);
  const resolved = await resolve(parsed, yamlPath);
  const files = await render(resolved);
  void files;
  void outDir;
}
```

- [ ] **Step 3: Run test**

Run: `npm test`
Expected: PASS (vacuous, but render is exercised for docs). If you see an eta `undefined variable` error, fix the template or manifest schema.

- [ ] **Step 4: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement render phase for docs"
```

---

## Task 17: Implement `render()` — skills, references, agents, settings

Extend `render()` to produce `SKILLS.md`, copy references and agents, and compose `.claude/settings.example.json` by merging permissions and hooks from each plugin that ships them.

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Replace the `// Task 17: ...` comment with the full body**

```ts
  // Skills → SKILLS.md
  if (resolved.skills.length > 0) {
    out.set("SKILLS.md", buildSkillsDoc(resolved.skills));
  }

  // References → copy bytes
  for (const ref of resolved.references) {
    out.set(ref.outputPath, readFileSync(ref.srcPath));
  }

  // Agents → copy each subagent definition verbatim
  for (const agent of resolved.agents) {
    out.set(agent.outputPath, readFileSync(agent.srcPath));
  }

  // Settings → merged permissions + plugin list + merged hooks
  out.set(
    ".claude/settings.example.json",
    renderSettings(resolved.plugins, resolved.permissions, resolved.hooks),
  );
```

- [ ] **Step 2: Append helper functions**

```ts
function buildSkillsDoc(skills: ResolvedSkill[]): string {
  const sections = skills.map((s) => {
    const source = `**Source:** plugin \`${s.entry.source.plugin}\``;
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

function renderSettings(
  plugins: string[],
  permissions: ResolvedPermissions[],
  hooks: ResolvedHook[],
): string {
  // Merge permissions across plugins. Concatenate allow / deny, preserve order,
  // de-duplicate within each list, and throw on cross-list collisions
  // (same string in both allow and deny).
  const allow: string[] = [];
  const deny: string[] = [];
  for (const p of permissions) {
    for (const a of p.entry.allow ?? []) if (!allow.includes(a)) allow.push(a);
    for (const d of p.entry.deny  ?? []) if (!deny.includes(d))  deny.push(d);
  }
  const collisions = allow.filter((a) => deny.includes(a));
  if (collisions.length) {
    throw new Error(`permissions collision (in both allow and deny): ${collisions.join(", ")}`);
  }

  // Key order matters for byte equality: $schema, permissions, plugins, hooks.
  const obj: Record<string, unknown> = {
    $schema: "https://json.schemastore.org/claude-code-settings.json",
    permissions: { allow, deny },
    plugins,
  };

  if (hooks.length > 0) {
    const merged: Record<string, unknown> = {};
    for (const h of hooks) {
      for (const [k, v] of Object.entries(h.entry)) {
        if (k in merged) {
          throw new Error(
            `hooks collision on key "${k}" (already set by another plugin/hook; conflicting source: plugins/${h.pluginId}/hooks/${h.name}.json)`,
          );
        }
        merged[k] = v;
      }
    }
    obj.hooks = merged;
  }

  return JSON.stringify(obj, null, 2);
}
```

**Important:** Watch the trailing newline. `JSON.stringify(obj, null, 2)` does NOT add one. If the target file from Task 5 ends with a newline, either strip it from the target or `return JSON.stringify(...) + "\n";`. Pick one and stay consistent.

- [ ] **Step 3: Run test**

Run: `npm test`
Expected: PASS (vacuous; full render pipeline now exercised). Map includes docs + SKILLS.md + references + settings. Emit is still a stub.

- [ ] **Step 4: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement render for skills, references, agents, settings"
```

---

## Task 18: Implement `emit()`

**Files:**
- Modify: `src/compile.ts`

- [ ] **Step 1: Append emit()**

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

```ts
export async function compile(yamlPath: string, outDir: string): Promise<void> {
  const parsed = load(yamlPath);
  const resolved = await resolve(parsed, yamlPath);
  const files = await render(resolved);
  emit(files, outDir);
}
```

- [ ] **Step 3: Run test**

Run: `npm test`
Expected: the test runs end-to-end with real assertions. Likely:
- `Compiler emitted files that aren't in the target` — content path mismatch
- `File differs: <path>` — content drift (fix in Task 19)
- (best case, unlikely on first run) PASS

- [ ] **Step 4: Commit**

```bash
git add src/compile.ts
git commit -m "feat(compile): implement emit phase (write tree to disk)"
```

---

## Task 19: Iterate to byte-equal

**Files:** any of the plugin contents, yaml, target files, or `src/compile.ts`.

- [ ] **Step 1: Run test and read the first diff**

Run: `npm test`
Expected: either passing (skip to Step 5) or a specific diff/mismatch.

- [ ] **Step 2: Diagnose**

| Symptom | Likely cause | Fix in |
|---|---|---|
| `Compiler emitted files that aren't in the target` | Output path mismatch | Fix manifest `outputPath` or add the file to the target |
| `File differs: SKILLS.md` (text) | `buildSkillsDoc` output drift | Edit either side to converge |
| `File differs: settings.example.json` (trailing newline) | `JSON.stringify` no trailing newline; target may have one | Add `+ "\n"` to `renderSettings`, OR strip from target |
| `File differs: settings.example.json` (key order) | Object key order in `renderSettings` doesn't match | Reorder the object literal |
| `File differs: settings.example.json` (permissions arrays) | Plugin's `permissions.json` doesn't match target's permissions block | Fix `plugins/nextjs/permissions.json` |
| `File differs: settings.example.json` (plugins array) | preset expansion order or extras merge | Check `PRESETS["nextjs"]` order; check `enabledPlugins` build |
| `File differs: <some .md>` (whitespace/eta) | eta delimiters eating whitespace; template/target trailing newline | Adjust template or eta config |
| `param validation failed` in resolve | Manifest schema doesn't match yaml | Adjust `paramsSchema` in the offending plugin's `docs/<name>/manifest.ts` |
| `eta undefined variable` | Template references an undeclared param | Add to manifest schema + yaml, or hardcode in template |
| `unknown preset` | preset name typo | Check `parsed.preset` vs keys in `PRESETS` |
| `unknown plugin` | preset includes a plugin id with no `plugins/<id>/` directory | Create the plugin dir or remove from preset |
| `unknown reference` | yaml reference id has no match in `references-pool/` | Check spelling vs filename stem |
| `permissions collision` | Two plugins ship overlapping allow/deny | Edit one plugin's `permissions.json` |

- [ ] **Step 3: Fix one thing, re-run, loop**

Make the smallest change that addresses the first failure. Don't batch.

- [ ] **Step 4: Final verification**

Run: `npm test`
Expected:
```
 ✓ test/fixtures.test.ts (1)
   ✓ nextjs-acme: compiled tree is a byte-equal subset of the target

 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Sanity-check: the compiler should have produced 4 doc files (`AGENTS.md`, `ARCHITECTURE.md`, `docs/PLANS.md`, `docs/PRODUCT_SENSE.md`) + `SKILLS.md` + `docs/references/auth-js-llms.txt` + `.claude/settings.example.json` = 7 files total. No `.claude/agents/*` (acme has no agents).

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: harness-kit MVP v1 — yaml→folder compiler with plugin-centric layout"
```

v1 ships when this test is green. Next iteration (CLI, watch, second fixture, self-host, exercising agent/hook pipelines via a real plugin that ships them) starts from here.

---

## Notes for the engineer

- **Schema is the source of truth.** If you find yourself wishing the yaml had a different shape, read [`../specs/2026-05-25-harness-yaml-schema-design.md`](../specs/2026-05-25-harness-yaml-schema-design.md) before modifying.
- **Preset expansion is hardcoded for v0.** `PRESETS` is an object literal in `src/compile.ts`. When the second preset lands, extract to `presets/<name>.ts`; don't do it earlier.
- **Plugin discovery is convention-based.** `resolve()` walks `plugins/<id>/{skills,agents,hooks,docs,permissions.json}` and adds whatever exists. No plugin manifest file in v0; the directory shape is the contract.
- **`agents/` and `hooks/` paths are dead code for v0** — wired in `resolve()` and `render()`, never exercised by the acme fixture (no plugin ships any). First plugin that adds an `agents/` or `hooks/` subdir exercises them. Don't delete these paths.
- **Permissions merge** concatenates allow / deny lists across all plugins that ship `permissions.json`, de-duplicates within each list, and throws on cross-list collisions. v0 only has one plugin shipping permissions, so the merge is trivial; the logic is in place for the second one.
- **Hooks merge** is shallow under the `hooks` key. Same-key collisions across plugins throw.
- **JSON whitespace** matters for byte-equality. Pick a trailing-newline policy and apply it consistently in `renderSettings` and the hand-curated `settings.example.json` target.
- **eta delimiters** default to `<% %>` / `<%= %>`. They can eat preceding whitespace; `rmWhitespace: false` is set in Task 16 to avoid surprises.
- **Don't add features.** If a thought starts with "while we're in here, let's also...", stop. This plan is v1.
