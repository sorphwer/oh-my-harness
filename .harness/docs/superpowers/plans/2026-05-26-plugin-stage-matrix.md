# Plugin Stage Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tag every current plugin resource with lifecycle stages in place and publish the full plugin x stage matrix without moving skills out of their owning plugins.

**Architecture:** Plugins remain the distribution and ownership boundary. `stage` metadata is added to each `SKILL.md`; skill-local `agents/openai.yaml` files inherit their parent skill stage; MCP config is mirrored into the plugin `mcp/` resource home for stage indexing but does not satisfy coverage. The matrix is recorded in `plugins/INDEX.md` and later becomes compiler IR.

**Tech Stack:** Markdown frontmatter, YAML metadata, JSON MCP config, shell/Node one-liners for verification.

**Spec:** [`../specs/2026-05-26-plugin-stage-matrix-design.md`](../specs/2026-05-26-plugin-stage-matrix-design.md)

**Extends:** [`../specs/2026-05-25-harness-yaml-schema-design.md`](../specs/2026-05-25-harness-yaml-schema-design.md)

**Supersedes:** The earlier narrow version of this plan that only tagged the 18 bootstrap skills. Current scope is every `SKILL.md` under `plugins/`, excluding vendored payloads such as `node_modules/` and `.app/Contents/`.

---

## File Structure

**New:**

- `src/stages.ts` - closed stage vocabulary, required stages, default stage, and zod schemas.
- `plugins/computer-use/mcp/computer-use.json` - harness-kit MCP resource mirror for the existing upstream `plugins/computer-use/.mcp.json`.

**Modified:**

- `plugins/**/skills/**/SKILL.md` - add or update `stage: [...]` frontmatter on all 83 current skills.
- `plugins/INDEX.md` - replace raw inventory with a plugin x stage matrix, coverage summary, and companion-agent/MCP notes.
- `.harness/docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md` - forward-reference the matrix spec and add `workflows` / `mcp` extras.
- `.harness/ARCHITECTURE.md` - document matrix IR and stage projections.
- `.harness/AGENTS.md` - document stage-tagging authoring rules and the `src/stages.ts` source of truth.

**Not modified:**

- `plugins/**/skills/**/agents/openai.yaml` - skill-local agent metadata inherits the parent skill's stage and is not independently tagged in this plan.
- `plugins/computer-use/.mcp.json` - preserve the upstream Codex plugin metadata file; mirror it rather than move it.
- Vendored payloads under `plugins/**/node_modules/` and app bundles under `plugins/**/*.app/Contents/`.

---

## Stage Assignment Table

Skill id means the directory name under `plugins/<plugin>/skills/<skill>/`.

| Plugin | Skill | Stage |
|---|---|---|
| `backend` | `api-design` | `[spec, implement]` |
| `backend` | `backend-change` | `[implement]` |
| `backend` | `data-integrity` | `[implement, verify]` |
| `browser` | `browser` | `[explore, verify]` |
| `codex-security` | `attack-path-analysis` | `[review]` |
| `codex-security` | `finding-discovery` | `[explore, review]` |
| `codex-security` | `fix-finding` | `[implement, verify]` |
| `codex-security` | `security-scan` | `[spec, explore, verify, review]` |
| `codex-security` | `threat-model` | `[spec]` |
| `codex-security` | `validation` | `[verify, review]` |
| `codex-system-skills` | `imagegen` | `[implement]` |
| `codex-system-skills` | `openai-docs` | `[explore, spec, implement]` |
| `codex-system-skills` | `plugin-creator` | `[implement]` |
| `codex-system-skills` | `skill-creator` | `[spec, implement, verify]` |
| `codex-system-skills` | `skill-installer` | `[implement]` |
| `codex-user-skills` | `authoring-architecture-overview` | `[explore, deliver]` |
| `codex-user-skills` | `design-taste-frontend` | `[spec, implement, verify]` |
| `codex-user-skills` | `discord-js` | `[spec, implement, verify]` |
| `codex-user-skills` | `dual-repo-cli-release` | `[spec, implement, deliver]` |
| `codex-user-skills` | `full-output-enforcement` | `[freestyle]` |
| `codex-user-skills` | `google-aip-api-design` | `[spec, implement, review]` |
| `codex-user-skills` | `i-animate` | `[implement]` |
| `codex-user-skills` | `i-audit` | `[verify, review]` |
| `codex-user-skills` | `i-bolder` | `[implement]` |
| `codex-user-skills` | `i-clarify` | `[implement]` |
| `codex-user-skills` | `i-colorize` | `[implement]` |
| `codex-user-skills` | `i-critique` | `[review]` |
| `codex-user-skills` | `i-delight` | `[implement]` |
| `codex-user-skills` | `i-distill` | `[implement]` |
| `codex-user-skills` | `i-extract` | `[implement]` |
| `codex-user-skills` | `i-frontend-design` | `[spec, implement]` |
| `codex-user-skills` | `i-harden` | `[implement, verify]` |
| `codex-user-skills` | `i-normalize` | `[implement, review]` |
| `codex-user-skills` | `i-onboard` | `[spec, implement]` |
| `codex-user-skills` | `i-optimize` | `[implement, verify]` |
| `codex-user-skills` | `i-polish` | `[implement, verify]` |
| `codex-user-skills` | `i-quieter` | `[implement]` |
| `codex-user-skills` | `i-teach-impeccable` | `[intent, spec]` |
| `codex-user-skills` | `pdf` | `[explore, implement, verify, deliver]` |
| `codex-user-skills` | `redesign-existing-projects` | `[spec, implement, verify]` |
| `codex-user-skills` | `ticket-reply-wording` | `[deliver]` |
| `codex-user-skills` | `use-json-render-cli` | `[implement, verify, deliver]` |
| `codex-user-skills` | `use-zendesk-cli` | `[explore, deliver]` |
| `codex-user-skills` | `vercel-deploy` | `[verify, deliver]` |
| `codex-user-skills` | `vercel-react-best-practices` | `[spec, implement, verify, review]` |
| `codex-user-skills` | `web-design-guidelines` | `[verify, review]` |
| `computer-use` | `computer-use` | `[explore, implement, verify]` |
| `debugging` | `systematic-debugging` | `[explore, verify]` |
| `delivery` | `code-review` | `[review]` |
| `delivery` | `finishing-branch` | `[deliver]` |
| `delivery` | `receiving-code-review` | `[review, implement]` |
| `delivery` | `requesting-code-review` | `[review]` |
| `delivery` | `verification-before-completion` | `[verify]` |
| `documents` | `documents` | `[implement, verify, deliver]` |
| `frontend` | `accessibility-audit` | `[verify]` |
| `frontend` | `frontend-implementation` | `[implement]` |
| `frontend` | `frontend-polish` | `[implement]` |
| `github` | `gh-address-comments` | `[review, implement, verify]` |
| `github` | `gh-fix-ci` | `[verify, implement]` |
| `github` | `github` | `[explore, review]` |
| `github` | `yeet` | `[deliver]` |
| `planning` | `brainstorming` | `[intent]` |
| `planning` | `spec-first-planning` | `[spec, plan]` |
| `planning` | `test-driven-development` | `[implement, verify]` |
| `presentations` | `presentations` | `[implement, verify, deliver]` |
| `security-review` | `fix-security-finding` | `[implement, verify]` |
| `security-review` | `security-scan` | `[spec, explore, verify, review]` |
| `security-review` | `threat-model` | `[spec]` |
| `spreadsheets` | `spreadsheets` | `[implement, verify, deliver]` |
| `superpowers` | `brainstorming` | `[intent]` |
| `superpowers` | `dispatching-parallel-agents` | `[plan, implement]` |
| `superpowers` | `executing-plans` | `[implement, verify]` |
| `superpowers` | `finishing-a-development-branch` | `[deliver]` |
| `superpowers` | `receiving-code-review` | `[review, implement]` |
| `superpowers` | `requesting-code-review` | `[review]` |
| `superpowers` | `subagent-driven-development` | `[implement, verify]` |
| `superpowers` | `systematic-debugging` | `[explore, verify]` |
| `superpowers` | `test-driven-development` | `[implement, verify]` |
| `superpowers` | `using-git-worktrees` | `[implement]` |
| `superpowers` | `using-superpowers` | `[freestyle, intent]` |
| `superpowers` | `verification-before-completion` | `[verify]` |
| `superpowers` | `writing-plans` | `[plan]` |
| `superpowers` | `writing-skills` | `[spec, implement, verify]` |

MCP assignment:

| Plugin | MCP resource | Stage | Coverage eligible? |
|---|---|---|---|
| `computer-use` | `computer-use` | `[explore, implement, verify]` | no |

Skill-local companion agents:

| Resource form | Count | Stage behavior | Coverage eligible? |
|---|---:|---|---|
| `plugins/*/skills/*/agents/openai.yaml` | 39 | inherits parent `SKILL.md` stage | no |

Hooks:

| Resource form | Count | Plan action |
|---|---:|---|
| `plugins/*/hooks/*` | 0 | no-op verification only |

---

## Task 0: Add Closed Stage Vocabulary Module

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
 * Stages are a set, not a sequence. The array order is display order only.
 */
export const STAGES = [
  "freestyle",
  "intent",
  "spec",
  "plan",
  "explore",
  "implement",
  "verify",
  "review",
  "deliver",
] as const;

export type Stage = (typeof STAGES)[number];

export const REQUIRED_STAGES = [
  "intent",
  "plan",
  "implement",
  "verify",
  "deliver",
] as const satisfies readonly Stage[];

export const DEFAULT_STAGE: Stage = "freestyle";

export const stageSchema = z.enum(STAGES);

export const stageListSchema = z
  .union([stageSchema, z.array(stageSchema).min(1)])
  .transform((value) => (Array.isArray(value) ? value : [value]));
```

- [ ] **Step 2: Verify file content**

Run: `sed -n '1,120p' src/stages.ts`

Expected: the file exports `STAGES` with 9 values, `REQUIRED_STAGES` with 5 values, `DEFAULT_STAGE`, `stageSchema`, and `stageListSchema`.

- [ ] **Step 3: Commit**

```bash
git add src/stages.ts
git commit -m "feat(spec): add closed lifecycle stage vocabulary"
```

---

## Task 1: Tag Every Skill In Place

**Files:**

- Modify: every `SKILL.md` listed in the Stage Assignment Table.

- [ ] **Step 1: Confirm the skill count before editing**

Run:

```bash
find plugins -path '*/node_modules/*' -prune -o -path '*.app/*' -prune -o -name SKILL.md -print | wc -l
```

Expected: `83`.

- [ ] **Step 2: Add `stage` frontmatter for each skill**

For every row in the Stage Assignment Table, open:

```text
plugins/<plugin>/skills/<skill>/SKILL.md
```

Insert the exact stage list from the table inside the existing YAML frontmatter block, immediately before the closing `---`.

Example:

```yaml
---
name: gh-fix-ci
description: Use when a user asks to debug or fix failing GitHub PR checks that run in GitHub Actions.
stage: [verify, implement]
---
```

If a file already has `stage`, replace it with the table value. Preserve every other frontmatter key and the body content.

- [ ] **Step 3: Verify all 83 skills are tagged**

Run:

```bash
node -e 'const fs=require("fs"),path=require("path");const stages=new Set(["freestyle","intent","spec","plan","explore","implement","verify","review","deliver"]);function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(p.includes("/node_modules/")||p.includes(".app/Contents/"))continue;if(e.isDirectory())walk(p,out);else if(e.name==="SKILL.md")out.push(p)}return out}const files=walk("plugins").sort();const bad=[];for(const f of files){const s=fs.readFileSync(f,"utf8");const m=s.match(/^---\n([\s\S]*?)\n---/);const fm=m&&m[1];const line=fm&&fm.match(/^stage:\s*\[([^\]]+)\]\s*$/m);if(!line){bad.push(`${f}: missing stage`);continue}for(const raw of line[1].split(",")){const stage=raw.trim();if(!stages.has(stage))bad.push(`${f}: invalid stage ${stage}`)}}console.log(`skills=${files.length}`);if(bad.length){console.error(bad.join("\n"));process.exit(1)}console.log("all skill stages valid")'
```

Expected:

```text
skills=83
all skill stages valid
```

- [ ] **Step 4: Commit**

```bash
git add plugins
git commit -m "feat(plugins): tag current skills with lifecycle stages"
```

---

## Task 2: Mirror Computer Use MCP Config Into Harness Resource Layout

**Files:**

- Read: `plugins/computer-use/.mcp.json`
- Create: `plugins/computer-use/mcp/computer-use.json`

- [ ] **Step 1: Read the upstream MCP config**

Run: `sed -n '1,120p' plugins/computer-use/.mcp.json`

Expected: JSON with one `mcpServers.computer-use` entry.

- [ ] **Step 2: Create the harness MCP resource**

Create `plugins/computer-use/mcp/computer-use.json`:

```json
{
  "stage": ["explore", "implement", "verify"],
  "mcpServers": {
    "computer-use": {
      "command": "./Codex Computer Use.app/Contents/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient",
      "args": ["mcp"],
      "cwd": "."
    }
  }
}
```

- [ ] **Step 3: Preserve the upstream metadata file**

Run: `test -f plugins/computer-use/.mcp.json`

Expected: command exits 0. Do not delete or move `.mcp.json`.

- [ ] **Step 4: Commit**

```bash
git add plugins/computer-use/mcp/computer-use.json
git commit -m "feat(plugins): mirror computer-use mcp config for stage indexing"
```

---

## Task 3: Record The Plugin Stage Matrix In The Inventory

**Files:**

- Modify: `plugins/INDEX.md`

- [ ] **Step 1: Replace the current raw inventory table with a staged inventory**

Keep the opening title. Replace the body with these sections:

```markdown
This inventory is the current source snapshot for harness-kit plugin resources.
Skills stay under their owning plugin; stages are retrieval and coverage
metadata.

## Resource Counts

| Resource | Count | Notes |
|---|---:|---|
| Skills | 83 | Every `SKILL.md` has explicit `stage` frontmatter. |
| Skill-local agents | 39 | `skills/<skill>/agents/openai.yaml`; inherits parent skill stage. |
| Top-level hooks | 0 | No `plugins/*/hooks/*` resources currently exist. |
| Top-level agents | 0 | No `plugins/*/agents/<name>.md` resources currently exist. |
| MCP resources | 1 | `computer-use`; indexed, not coverage-eligible. |

## Coverage Summary

| Stage | Coverage-eligible plugins |
|---|---|
| `intent` | `planning`, `codex-user-skills`, `superpowers` |
| `spec` | `backend`, `codex-security`, `codex-system-skills`, `codex-user-skills`, `planning`, `security-review`, `superpowers` |
| `plan` | `planning`, `superpowers` |
| `explore` | `browser`, `codex-security`, `codex-system-skills`, `codex-user-skills`, `computer-use`, `debugging`, `github`, `security-review`, `superpowers` |
| `implement` | `backend`, `codex-security`, `codex-system-skills`, `codex-user-skills`, `computer-use`, `delivery`, `documents`, `frontend`, `github`, `planning`, `presentations`, `security-review`, `spreadsheets`, `superpowers` |
| `verify` | `backend`, `browser`, `codex-security`, `codex-system-skills`, `codex-user-skills`, `computer-use`, `debugging`, `delivery`, `documents`, `frontend`, `github`, `planning`, `presentations`, `security-review`, `spreadsheets`, `superpowers` |
| `review` | `codex-security`, `codex-user-skills`, `delivery`, `github`, `security-review`, `superpowers` |
| `deliver` | `codex-user-skills`, `delivery`, `documents`, `github`, `presentations`, `spreadsheets`, `superpowers` |
| `freestyle` | `codex-user-skills`, `superpowers` |

## Full Assignment Table

Use the assignment table in `.harness/docs/superpowers/plans/2026-05-26-plugin-stage-matrix.md` as the canonical edit list for this migration.
```

- [ ] **Step 2: Commit**

```bash
git add plugins/INDEX.md
git commit -m "docs(plugins): record current plugin stage matrix"
```

---

## Task 4: Update Cross-Reference Documentation

**Files:**

- Modify: `.harness/docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md`
- Modify: `.harness/ARCHITECTURE.md`
- Modify: `.harness/AGENTS.md`

- [ ] **Step 1: Extend the schema spec**

Add a note near the top of `.harness/docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md`:

```markdown
> **Extended by the plugin-stage matrix spec (2026-05-26).** Plugin resources
> carry closed lifecycle-stage metadata. Plugin source layout now also accepts
> `workflows/<name>.md` and `mcp/<name>.json`; `extras` accepts `workflows`
> and `mcp` selectors. The yaml selection model remains plugin-owned.
```

Update its plugin layout and extras schema to include `workflows` and `mcp`.

- [ ] **Step 2: Update architecture docs**

In `.harness/ARCHITECTURE.md`, add a `Matrix IR` section stating:

```markdown
After resolve, the compiler holds a sparse plugin x stage matrix. Plugins are
the unit of distribution; stages are the unit of lifecycle retrieval and
coverage. Render and emit consume the matrix instead of walking plugin source
directories again.
```

- [ ] **Step 3: Update agent guidance**

In `.harness/AGENTS.md`, add a `Stage Tagging` subsection:

```markdown
Every stage-indexed plugin resource declares one or more lifecycle stages from
`src/stages.ts`. Skills declare stages in `SKILL.md` frontmatter. Skill-local
`agents/openai.yaml` files inherit their parent skill stage. MCP resources are
stage-indexed for retrieval but do not satisfy coverage.
```

- [ ] **Step 4: Commit**

```bash
git add .harness/docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md .harness/ARCHITECTURE.md .harness/AGENTS.md
git commit -m "docs(harness): cross-reference plugin stage matrix model"
```

---

## Task 5: Final Verification

**Files:** read-only verification.

- [ ] **Step 1: Verify every skill has valid stage frontmatter**

Run the Node validation command from Task 1 Step 3.

Expected:

```text
skills=83
all skill stages valid
```

- [ ] **Step 2: Verify skill-local agents are preserved**

Run:

```bash
find plugins -path '*/node_modules/*' -prune -o -path '*.app/*' -prune -o -path '*/agents/openai.yaml' -print | wc -l
```

Expected: `39`.

- [ ] **Step 3: Verify no top-level hooks currently exist**

Run:

```bash
find plugins -path '*/node_modules/*' -prune -o -path '*.app/*' -prune -o -path '*/hooks/*' -type f -print | wc -l
```

Expected: `0`.

- [ ] **Step 4: Verify MCP mirror exists and upstream MCP metadata remains**

Run:

```bash
test -f plugins/computer-use/.mcp.json && test -f plugins/computer-use/mcp/computer-use.json
```

Expected: command exits 0.

- [ ] **Step 5: Verify required-stage coverage from tagged skills**

Run:

```bash
node -e 'const fs=require("fs"),path=require("path");const required=["intent","plan","implement","verify","deliver"];function walk(d,out=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(p.includes("/node_modules/")||p.includes(".app/Contents/"))continue;if(e.isDirectory())walk(p,out);else if(e.name==="SKILL.md")out.push(p)}return out}const coverage=Object.fromEntries(required.map(s=>[s,new Set()]));for(const f of walk("plugins")){const parts=f.split(path.sep);const plugin=parts[1];const s=fs.readFileSync(f,"utf8");const line=s.match(/^stage:\s*\[([^\]]+)\]\s*$/m);if(!line)continue;for(const stage of line[1].split(",").map(x=>x.trim()))if(coverage[stage])coverage[stage].add(plugin)}for(const stage of required)console.log(`${stage}: ${[...coverage[stage]].sort().join(", ")}`);if(required.some(stage=>coverage[stage].size===0))process.exit(1)'
```

Expected: every required stage prints at least one plugin name.

- [ ] **Step 6: Commit final verification note if needed**

If verification required documentation fixes, commit them:

```bash
git add .harness plugins src
git commit -m "docs(verify): confirm current plugin stage matrix coverage"
```

If there were no fixes after Task 4, do not create an empty commit.

---

## Acceptance Criterion

- `src/stages.ts` exists and exports the closed 9-stage vocabulary in display order: `freestyle`, `intent`, `spec`, `plan`, `explore`, `implement`, `verify`, `review`, `deliver`.
- Every current non-vendored `plugins/**/skills/**/SKILL.md` has explicit valid `stage: [...]` frontmatter.
- No skill has moved out of its owning plugin.
- All 39 skill-local `agents/openai.yaml` files remain in place and inherit parent skill stage.
- `plugins/computer-use/mcp/computer-use.json` exists with stage metadata, while `plugins/computer-use/.mcp.json` is preserved.
- `plugins/INDEX.md` records resource counts and the plugin x stage coverage table.
- `.harness/AGENTS.md`, `.harness/ARCHITECTURE.md`, and the schema spec cross-reference the plugin-stage matrix model.
- Required stages `intent`, `plan`, `implement`, `verify`, and `deliver` each have at least one coverage-eligible skill in the current inventory.

When all criteria hold, the matrix metadata migration is complete. A later compiler plan can consume this state to implement `manifest.json` and `stages/<stage>/index.md` emission.
