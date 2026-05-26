# Plugin × Stage Matrix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock the stage vocabulary and matrix model into the repo's documentation, schema, and plugin source files so that the next compiler implementation pass (the v1-rewrite plan) can implement the matrix without re-debating semantics. This plan is **doc + frontmatter only**; no compiler code is written here.

**Architecture:** Three layers of change land in order — (1) authoritative stage constants module (TypeScript const + zod enum), (2) every existing plugin source file gains `stage` frontmatter, (3) `.harness/` planning documents (architecture, schema spec, agents guide) cross-reference the new model. The compiler itself is touched only to the extent that `src/stages.ts` becomes the future zod source-of-truth; resolver / matrix / emitter changes are deferred to the v1-rewrite plan.

**Spec:** [`../specs/2026-05-26-plugin-stage-matrix-design.md`](../specs/2026-05-26-plugin-stage-matrix-design.md)

**Extends:** [`../specs/2026-05-25-harness-yaml-schema-design.md`](../specs/2026-05-25-harness-yaml-schema-design.md)

**Predecessor plan:** [`2026-05-25-harness-kit-mvp-v1.md`](2026-05-25-harness-kit-mvp-v1.md) (marked NEEDS REWRITE; the rewrite that absorbs this matrix model is tracked as a separate plan to be authored after this one lands).

---

## File Structure

Files this plan creates or modifies:

**New:**

- `src/stages.ts` — closed stage vocabulary as TypeScript const + zod enum + required-stages array. Authoritative source.

**Modified — plugin source frontmatter (add `stage` field):**

- `plugins/planning/skills/brainstorming/SKILL.md`
- `plugins/planning/skills/spec-first-planning/SKILL.md`
- `plugins/planning/skills/test-driven-development/SKILL.md`
- `plugins/debugging/skills/systematic-debugging/SKILL.md`
- `plugins/frontend/skills/frontend-implementation/SKILL.md`
- `plugins/frontend/skills/frontend-polish/SKILL.md`
- `plugins/frontend/skills/accessibility-audit/SKILL.md`
- `plugins/backend/skills/api-design/SKILL.md`
- `plugins/backend/skills/backend-change/SKILL.md`
- `plugins/backend/skills/data-integrity/SKILL.md`
- `plugins/delivery/skills/code-review/SKILL.md`
- `plugins/delivery/skills/requesting-code-review/SKILL.md`
- `plugins/delivery/skills/receiving-code-review/SKILL.md`
- `plugins/delivery/skills/verification-before-completion/SKILL.md`
- `plugins/delivery/skills/finishing-branch/SKILL.md`
- `plugins/security-review/skills/threat-model/SKILL.md`
- `plugins/security-review/skills/security-scan/SKILL.md`
- `plugins/security-review/skills/fix-security-finding/SKILL.md`

**Modified — documentation:**

- `.harness/docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md` — add forward-reference to matrix spec; broaden plugin sub-directory list to 7 entries (`workflows/`, `mcp/`); extend `extras` schema with `workflows` and `mcp` namespaces.
- `.harness/ARCHITECTURE.md` — collapse the linear pipeline diagram into the matrix-IR view; add `stage` frontmatter to the Plugin section; add a Matrix section.
- `.harness/AGENTS.md` — add a short subsection describing stage tagging as a content-authoring rule; add `src/stages.ts` to the planned implementation structure.

**Not modified:**

- `plugins/*/README.md` — plugin READMEs are author-facing summaries; per-skill stage assignments live with the skill, not the README.
- `harness-kit-example/nextjs-acme/harness.yaml` — yaml shape is unchanged by this revision (matrix is a compiler-internal IR).
- `harness-kit-example/nextjs-acme/.harness/` — these are pre-compiler hand-curated targets; they will be refreshed when the v1-rewrite plan adds `manifest.json` and `stages/` emission.

---

## Task 0: Stage vocabulary module

Single source of truth that every downstream zod schema and compiler component will import. Written now so frontmatter validation has a target to reference, even before the resolver exists.

**Files:**
- Create: `src/stages.ts`

- [ ] **Step 1: Create `src/stages.ts`**

```ts
import { z } from "zod";

/**
 * Closed lifecycle-stage vocabulary.
 *
 * Source: .harness/docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md
 *
 * Stages are a set, not a sequence. Resources declare their stage(s) via
 * frontmatter; the compiler indexes them into a plugin × stage matrix at
 * resolve time. Adding a new stage requires a spec change.
 */
export const STAGES = [
  "freestyle",
  "intent",
  "plan",
  "spec",
  "explore",
  "implement",
  "verify",
  "review",
  "deliver",
] as const;

export type Stage = (typeof STAGES)[number];

/**
 * Stages whose absence in a compiled harness produces a coverage warning.
 * A preset that fails to cover all five can not run a full development
 * cycle without help from extras.
 */
export const REQUIRED_STAGES = [
  "intent",
  "plan",
  "implement",
  "verify",
  "deliver",
] as const satisfies readonly Stage[];

/**
 * Resources without an explicit stage default to this value.
 * Lets unmodified plugins keep compiling during migration.
 */
export const DEFAULT_STAGE: Stage = "freestyle";

export const stageSchema = z.enum(STAGES);

/**
 * Frontmatter accepts a single string or an array of strings. Both forms
 * normalize to a non-empty Stage[] downstream. Missing field is filled
 * with [DEFAULT_STAGE] before validation.
 */
export const stageListSchema = z
  .union([stageSchema, z.array(stageSchema).min(1)])
  .transform((value) => (Array.isArray(value) ? value : [value]));
```

- [ ] **Step 2: Verify the module type-checks in isolation**

The repo has no `package.json` yet (v1 has not been built). Skip compilation; verify by reading the file back and confirming there are no TODO markers, no missing exports, and the closed list matches the spec verbatim.

Run: `read src/stages.ts:raw`
Expected: file content matches what was written in Step 1, byte-for-byte.

- [ ] **Step 3: Commit**

```bash
git add src/stages.ts
git commit -m "feat(spec): introduce closed stage vocabulary (src/stages.ts)"
```

---

## Task 1: Tag `planning` plugin skills

Three skills. All are tightly coupled to spec/plan phases.

**Files:**
- Modify: `plugins/planning/skills/brainstorming/SKILL.md`
- Modify: `plugins/planning/skills/spec-first-planning/SKILL.md`
- Modify: `plugins/planning/skills/test-driven-development/SKILL.md`

- [ ] **Step 1: Tag `brainstorming` as `[intent]`**

Add `stage: [intent]` line to the frontmatter block. Preserve every existing field (`name`, `description`) and the body unchanged.

Expected frontmatter after edit:

```yaml
---
name: brainstorming
description: Use before creating a feature, building a component, adding functionality, or modifying behavior - explores user intent, requirements, and design tradeoffs before any code or plan is written.
stage: [intent]
---
```

- [ ] **Step 2: Tag `spec-first-planning` as `[spec, plan]`**

Spec authoring + plan derivation both fit this skill.

- [ ] **Step 3: Tag `test-driven-development` as `[implement, verify]`**

TDD spans writing test first (implement) and asserting it red/green (verify).

- [ ] **Step 4: Spot-check by re-reading frontmatter only**

For each of the three files, confirm the frontmatter still parses as YAML and that no body content was disturbed.

- [ ] **Step 5: Commit**

```bash
git add plugins/planning/skills/
git commit -m "feat(plugins): tag planning skills with lifecycle stages"
```

---

## Task 2: Tag `debugging` plugin skills

One skill, cross-cutting.

**Files:**
- Modify: `plugins/debugging/skills/systematic-debugging/SKILL.md`

- [ ] **Step 1: Tag `systematic-debugging` as `[explore, verify]`**

Debugging happens both when reading unknown code (explore) and when a test/assertion fails (verify).

- [ ] **Step 2: Commit**

```bash
git add plugins/debugging/skills/
git commit -m "feat(plugins): tag debugging skill with lifecycle stages"
```

---

## Task 3: Tag `frontend` plugin skills

Three skills. Implementation, polish, and audit each map to one stage.

**Files:**
- Modify: `plugins/frontend/skills/frontend-implementation/SKILL.md`
- Modify: `plugins/frontend/skills/frontend-polish/SKILL.md`
- Modify: `plugins/frontend/skills/accessibility-audit/SKILL.md`

- [ ] **Step 1: Tag `frontend-implementation` as `[implement]`**

- [ ] **Step 2: Tag `frontend-polish` as `[implement]`**

Polish is a second pass within the implement stage, not a separate lifecycle phase.

- [ ] **Step 3: Tag `accessibility-audit` as `[verify]`**

A11y audit is a check on a built UI, sits with verification.

- [ ] **Step 4: Commit**

```bash
git add plugins/frontend/skills/
git commit -m "feat(plugins): tag frontend skills with lifecycle stages"
```

---

## Task 4: Tag `backend` plugin skills

Three skills.

**Files:**
- Modify: `plugins/backend/skills/api-design/SKILL.md`
- Modify: `plugins/backend/skills/backend-change/SKILL.md`
- Modify: `plugins/backend/skills/data-integrity/SKILL.md`

- [ ] **Step 1: Tag `api-design` as `[spec, implement]`**

API design straddles formal spec writing and the actual route/handler implementation.

- [ ] **Step 2: Tag `backend-change` as `[implement]`**

- [ ] **Step 3: Tag `data-integrity` as `[implement, verify]`**

Schema migrations need both writing code and asserting invariants post-change.

- [ ] **Step 4: Commit**

```bash
git add plugins/backend/skills/
git commit -m "feat(plugins): tag backend skills with lifecycle stages"
```

---

## Task 5: Tag `delivery` plugin skills

Five skills covering the back half of the lifecycle.

**Files:**
- Modify: `plugins/delivery/skills/code-review/SKILL.md`
- Modify: `plugins/delivery/skills/requesting-code-review/SKILL.md`
- Modify: `plugins/delivery/skills/receiving-code-review/SKILL.md`
- Modify: `plugins/delivery/skills/verification-before-completion/SKILL.md`
- Modify: `plugins/delivery/skills/finishing-branch/SKILL.md`

- [ ] **Step 1: Tag `code-review` as `[review]`**

- [ ] **Step 2: Tag `requesting-code-review` as `[review]`**

- [ ] **Step 3: Tag `receiving-code-review` as `[review]`**

- [ ] **Step 4: Tag `verification-before-completion` as `[verify]`**

- [ ] **Step 5: Tag `finishing-branch` as `[deliver]`**

- [ ] **Step 6: Commit**

```bash
git add plugins/delivery/skills/
git commit -m "feat(plugins): tag delivery skills with lifecycle stages"
```

---

## Task 6: Tag `security-review` plugin skills

Three skills.

**Files:**
- Modify: `plugins/security-review/skills/threat-model/SKILL.md`
- Modify: `plugins/security-review/skills/security-scan/SKILL.md`
- Modify: `plugins/security-review/skills/fix-security-finding/SKILL.md`

- [ ] **Step 1: Tag `threat-model` as `[spec]`**

Threat modeling produces a design-level artifact, lives in the spec stage.

- [ ] **Step 2: Tag `security-scan` as `[verify, review]`**

Scans are both an automated verification and a review input.

- [ ] **Step 3: Tag `fix-security-finding` as `[implement]`**

- [ ] **Step 4: Commit**

```bash
git add plugins/security-review/skills/
git commit -m "feat(plugins): tag security-review skills with lifecycle stages"
```

---

## Task 7: Audit coverage of the `nextjs` preset

A manual audit, mirroring what the future compiler's coverage check will produce. Confirms that the stage assignments in Tasks 1–6 actually produce a complete preset.

**Files:** none modified (read-only).

- [ ] **Step 1: List enabled plugins for `preset: nextjs`**

Per spec, `nextjs` expands to `["superpowers", "code-review", "nextjs"]`. The on-disk plugin set differs: `planning` plays the `superpowers` role, `delivery` plays the `code-review` role, and `nextjs` is the (planned but not yet on disk) stack plugin.

Working set for this audit: `["planning", "delivery", "debugging", "backend", "frontend", "security-review"]` (everything currently on disk that a Next.js project would enable; the planned `nextjs` stack plugin ships docs+permissions only and contributes nothing to the matrix).

- [ ] **Step 2: Compute the matrix column for each required stage**

Read each tagged SKILL.md and group by stage:

| Stage | Cells (`plugin · skill`) | Required? | OK? |
|---|---|---|---|
| `intent` | `planning · brainstorming` | yes | yes |
| `plan` | `planning · spec-first-planning` | yes | yes |
| `implement` | `planning · test-driven-development` · `frontend · frontend-implementation` · `frontend · frontend-polish` · `backend · backend-change` · `backend · api-design` · `backend · data-integrity` · `security-review · fix-security-finding` | yes | yes |
| `verify` | `planning · test-driven-development` · `debugging · systematic-debugging` · `frontend · accessibility-audit` · `backend · data-integrity` · `delivery · verification-before-completion` · `security-review · security-scan` | yes | yes |
| `deliver` | `delivery · finishing-branch` | yes | yes |

Optional stages: `spec` gets `planning · spec-first-planning`, `backend · api-design`, `security-review · threat-model`; `explore` gets `debugging · systematic-debugging`; `review` gets all three `delivery` review skills plus `security-review · security-scan`; `freestyle` empty (acceptable).

- [ ] **Step 3: Record the audit result**

Append a short table to the matrix spec under a new "Audit Results" appendix, capturing the table from Step 2 as the baseline. Future spec/skill changes can diff against this baseline.

File to modify: `.harness/docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md`

Add at the end of the file, before any new section:

```markdown
## Appendix A — Baseline Coverage Audit (2026-05-26)

Working preset: on-disk plugins as of this spec date (`planning`, `delivery`,
`debugging`, `backend`, `frontend`, `security-review`).

| Stage | Cells | Required? | OK? |
| ... (paste table from Step 2)
```

- [ ] **Step 4: Commit**

```bash
git add .harness/docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md
git commit -m "docs(spec): record baseline stage-coverage audit for nextjs preset"
```

---

## Task 8: Extend the schema spec with workflows/, mcp/, and forward-reference

Make the prior schema spec point forward to the matrix spec, and absorb the plugin sub-directory broadening so a reader of the schema spec alone is not misled.

**Files:**
- Modify: `.harness/docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md`

- [ ] **Step 1: Add a "Supersession Note" near the top**

Insert immediately after the existing `Status:` line:

```markdown
> **Extended (2026-05-26).** Plugin sub-directory list broadens from 5 to 7
> kinds (`workflows/` and `mcp/` added). `extras` gains `workflows` and `mcp`
> namespaces. Every resource gains a `stage` frontmatter field with a closed
> 9-value vocabulary. Full details in
> [`2026-05-26-plugin-stage-matrix-design.md`](2026-05-26-plugin-stage-matrix-design.md).
> This document remains the source of truth for yaml shape, preset semantics,
> and resolution flow.
```

- [ ] **Step 2: Broaden the plugin directory layout block**

Find the existing `plugins/<plugin>/` tree (under "Plugin directory layout") and add two rows so it reads:

```
plugins/<plugin>/
  README.md                                # required
  skills/<name>/SKILL.md                   # optional, 0..N
  agents/<name>.md                         # optional, 0..N
  hooks/<name>.json                        # optional, 0..N
  workflows/<name>.md                      # optional, 0..N  (added 2026-05-26)
  mcp/<name>.json                          # optional, 0..N  (added 2026-05-26)
  docs/<name>/{manifest.ts, template.md}   # optional, 0..N
  permissions.json                         # optional, 0..1
```

- [ ] **Step 3: Broaden the "Plugin contribution → output mapping" table**

Append two rows to the table:

| Source inside a plugin | Output destination |
|---|---|
| `workflows/<name>.md` | copied to `<outDir>/workflows/<plugin>-<name>.md` |
| `mcp/<name>.json` | merged across all enabled plugins into `<outDir>/mcp/config.json` |

- [ ] **Step 4: Extend the `Extras` zod schema in §"Zod Schema (v1)"**

Add two fields to the `Extras` object:

```ts
const Extras = z.object({
  plugins:   z.array(z.string()).default([]),
  skills:    z.array(z.string()).default([]),
  agents:    z.array(z.string()).default([]),
  hooks:     z.array(z.string()).default([]),
  workflows: z.array(z.string()).default([]),  // added 2026-05-26
  mcp:       z.array(z.string()).default([]),  // added 2026-05-26
}).partial();
```

- [ ] **Step 5: Commit**

```bash
git add .harness/docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md
git commit -m "docs(spec): extend schema with workflows/mcp dirs and stage forward-ref"
```

---

## Task 9: Refresh ARCHITECTURE.md with the matrix view

The current architecture doc describes a linear pipeline. Replace the resolve step's prose with a matrix description and add a Matrix section.

**Files:**
- Modify: `.harness/ARCHITECTURE.md`

- [ ] **Step 1: Edit the high-level pipeline block**

Inside the `resolve` block of the existing ASCII pipeline (lines that read `preset -> plugin id list ... resolve references`), add one line after the existing references step:

```
 |   fill plugin × stage matrix from frontmatter        |
```

- [ ] **Step 2: Add a "Matrix IR" subsection right after "Core Flow"**

Insert a new H2:

```markdown
## Matrix IR

After `resolve`, the compiler holds a sparse `plugin × stage` matrix. Plugins
are the unit of distribution; stages are the unit of lifecycle. The matrix is
the single source of truth for `render` and `emit`; downstream phases do not
re-walk plugin source directories.

Stage vocabulary is closed and defined in `src/stages.ts`. Coverage is checked
against the five required stages (`intent`, `plan`, `implement`, `verify`,
`deliver`); missing coverage emits a build-time warning.

Full model: [`docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md`](docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md).
```

- [ ] **Step 3: Extend the "Plugin" entity table to mention `stage`**

In the existing plugin sub-resources table (the one under "### Plugin"), add a single sentence after the table:

```markdown
Every skill / hook / workflow / agent / MCP file declares a `stage` in its
frontmatter (default `[freestyle]`). The compiler uses this to build the
matrix; see the Matrix IR section.
```

- [ ] **Step 4: Add `workflows/` and `mcp/` rows to the plugin sub-resources table**

Match the additions from Task 8 Step 3.

- [ ] **Step 5: Commit**

```bash
git add .harness/ARCHITECTURE.md
git commit -m "docs(arch): introduce matrix IR; add workflows/mcp plugin sub-dirs"
```

---

## Task 10: Update AGENTS.md content-pool section

Add the stage-tagging rule and the new module to the planned implementation structure.

**Files:**
- Modify: `.harness/AGENTS.md`

- [ ] **Step 1: Add a "Stage Tagging" subsection under "Operating Rules"**

Insert before the existing "## Security Requirements" section:

```markdown
## Stage Tagging

Every resource a plugin ships (`skills/<name>/SKILL.md`,
`hooks/<name>.json`, `workflows/<name>.md`, `agents/<name>.md`,
`mcp/<name>.json`) declares one or more lifecycle stages in its frontmatter
or top-level JSON field:

    stage: [intent | plan | spec | explore | implement | verify | review | deliver | freestyle]

The vocabulary is closed and lives in `src/stages.ts`. Missing field defaults
to `[freestyle]`. See
[`docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md`](docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md).
```

- [ ] **Step 2: Add `src/stages.ts` to the "Planned repo implementation structure" tree**

In the existing tree under "Planned repo implementation structure", add `stages.ts` next to `compile.ts`:

```
src/
  compile.ts
  stages.ts        # closed stage vocabulary; imported by zod schemas
```

- [ ] **Step 3: Commit**

```bash
git add .harness/AGENTS.md
git commit -m "docs(agents): document stage-tagging rule and src/stages.ts"
```

---

## Task 11: Final cross-document sanity sweep

Confirm that the three primary documents — schema spec, matrix spec, ARCHITECTURE.md — are mutually consistent and that every plugin source file actually carries a `stage` field.

**Files:** none modified (read-only verification).

- [ ] **Step 1: Confirm every `plugins/*/skills/*/SKILL.md` has `stage`**

Run a search: `search "stage:" plugins/`

Expected: at least one match per skill file listed in the File Structure section above. If any file lacks `stage`, return to the relevant Task (1–6) and finish it.

- [ ] **Step 2: Confirm the closed vocabulary appears verbatim in `src/stages.ts`**

Run: `read src/stages.ts:raw`

Expected: `STAGES` array contains exactly the 9 strings in the order `freestyle, intent, plan, spec, explore, implement, verify, review, deliver`. `REQUIRED_STAGES` contains exactly 5 strings.

- [ ] **Step 3: Confirm both specs cross-reference each other**

- Schema spec (`2026-05-25-harness-yaml-schema-design.md`) has the "Extended (2026-05-26)" note pointing at the matrix spec.
- Matrix spec (`2026-05-26-plugin-stage-matrix-design.md`) has its "Extends:" line pointing at the schema spec.
- `ARCHITECTURE.md` has a "Matrix IR" section pointing at the matrix spec.
- `AGENTS.md` has a "Stage Tagging" subsection pointing at the matrix spec.

- [ ] **Step 4: Confirm baseline coverage audit table is present**

Read `.harness/docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md` and confirm "Appendix A — Baseline Coverage Audit" exists with all five required stages marked `OK? yes`.

- [ ] **Step 5: Commit final summary**

If any document needed a fix in Steps 1–4, commit those fixes here. Otherwise this task closes with a no-op verification record:

```bash
git commit --allow-empty -m "docs(verify): confirm matrix-spec cross-references are consistent"
```

---

## Acceptance Criterion

```
- src/stages.ts exists, exports STAGES (length 9), REQUIRED_STAGES (length 5),
  DEFAULT_STAGE = "freestyle", and stageSchema + stageListSchema.
- Every existing plugins/*/skills/*/SKILL.md carries a `stage:` frontmatter
  field whose values are drawn from STAGES.
- 2026-05-25-harness-yaml-schema-design.md has the extension note, the
  broadened plugin sub-directory list, the workflows/+mcp/ output rows, and
  the extended Extras zod schema.
- 2026-05-26-plugin-stage-matrix-design.md has Appendix A populated with
  the baseline coverage audit.
- ARCHITECTURE.md has a Matrix IR section.
- AGENTS.md has a Stage Tagging subsection.
- All five REQUIRED_STAGES are covered by at least one cell for the
  on-disk plugin set.
```

When all the above hold, this plan ships. The next plan (v1 compiler rewrite, to be authored separately via `superpowers:writing-plans`) consumes this output: it implements `resolve()` to fill the matrix, `render()` to project to disk, and `emit()` to write `manifest.json` + `stages/<stage>/index.md`.

---

## Out of Scope (this plan)

- Compiler code beyond `src/stages.ts`. The matrix IR, resolver matrix-fill, coverage check, and `manifest.json` / `stages/` emission all belong in the v1-rewrite plan.
- Updating the `harness-kit-example/nextjs-acme/.harness/` hand-curated target to include `manifest.json` or `stages/`. That target is refreshed when the compiler can actually emit those files.
- Tagging hooks, workflows, agents, or MCP files. No plugin ships any of these on disk today; tagging happens at the same commit as their introduction.
- Authoring the planned `nextjs` stack plugin. It belongs in the compiler-implementation plan.
- Renaming the `superpowers` / `code-review` plugin ids in the preset hardcode. The on-disk plugin layout already differs from preset expansion; reconciliation happens in the v1-rewrite plan.
- Building a CI gate that fails on coverage warnings. Coverage runs at compile time only; CI gating is a post-MVP feature.
