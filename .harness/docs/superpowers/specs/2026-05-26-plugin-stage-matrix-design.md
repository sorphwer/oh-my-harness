# Plugin × Stage Matrix — Design

Date: 2026-05-26
Status: draft, pending user review
Extends: [`2026-05-25-harness-yaml-schema-design.md`](2026-05-25-harness-yaml-schema-design.md) (this spec adds an orthogonal axis; the yaml shape and plugin directory layout from that spec are unchanged in spirit but the plugin sub-directory list is broadened — see §10)

## Goal

Lock the model that lets harness-kit answer two questions the current schema design can not:

1. **"What fires right now?"** — Given the agent is in stage X of a coding task, which resources (skills / hooks / workflows / subagents / MCP) are relevant?
2. **"Is this preset complete?"** — Given a selected set of plugins, does the resulting harness cover every load-bearing stage of the development lifecycle?

The answer is a **two-dimensional model**: every compile-time resource is indexed by (plugin × stage). Plugins are the unit of distribution; stages are the unit of lifecycle. Both axes are first-class. The compiler's intermediate representation is a sparse matrix over these two axes; `.harness/` is one projection of that matrix to disk.

## Background — Why Two Axes

Earlier drafts treated "plugin" as the sole organizing primitive. That collapsed two distinct concerns onto one axis and produced two persistent confusions:

- **Distribution vs lifecycle.** Real-world plugins (`superpowers`, `vercel:nextjs`, `frontend-design`) are organized by domain/vendor and routinely span 4–6 lifecycle stages. Forcing one-plugin-per-stage would fragment vendor ownership; forcing one-stage-per-plugin would erase lifecycle semantics.
- **"What does this preset give me?"** A preset is a list of plugin ids today. Without a stage axis there is no machine-checkable way to ask whether a preset's union of plugins covers planning, implementation, verification, and delivery — coverage gaps are silent.

The fix is to keep plugin as the distribution axis (unchanged) and add **stage** as an orthogonal classification on every resource. The compiler then materializes a `plugin × stage` matrix at resolve time. Selection happens along the plugin axis; runtime retrieval happens along the stage axis; coverage audit happens by inspecting columns.

## Stage Vocabulary (closed)

Nine stages. The set is fixed; plugin authors choose from this list and may not invent new names.

| Stage | Definition | Typical cell occupants |
|---|---|---|
| `freestyle` | No process gate. Ad-hoc edits, REPL exploration, single-file patches, conversational coding. | Lightweight skills, MCP servers, reference snippets. Default for resources that do not declare a stage. |
| `intent` | Capture and clarify what the user wants before any artifact exists. | `brainstorming` skill; oracle-style subagents. |
| `plan` | Decompose intent into ordered, checkable steps. | `writing-plans` skill; `plan-required` hook; planning workflow. |
| `spec` | Author formal design documents that an implementation plan can reference. | `spec-first-planning` skill; spec doc templates. |
| `explore` | Read existing code, find callsites, confirm invariants without writing. | `explore` subagent; `lsp` / `search` MCP surfaces; reference docs. |
| `implement` | Edit source files to make the planned change real, including test code written alongside. | `test-driven-development`, `backend-change`, `frontend-implementation` skills; `oracle`, `codex-rescue` subagents. |
| `verify` | Execute tests, typecheck, lint, E2E, manual smoke; produce evidence the change works. | `verification-before-completion` skill; `tests-must-pass` hook; `systematic-debugging` skill. |
| `review` | Request, perform, or absorb code review. | `code-review`, `requesting-code-review`, `receiving-code-review` skills; `reviewer` subagent. |
| `deliver` | Commit, push, open PR, write changelog, deploy. | `finishing-branch` skill; `no-secrets-on-push` hook; delivery workflow. |

Properties of the vocabulary:

- **Closed.** Compiler ships `STAGES` as a TypeScript `const` array. zod uses `z.enum(STAGES)`. Unknown stage strings in frontmatter fail validation with the offending file path in the message.
- **Set, not sequence.** Stages have no canonical order. `verify` may fire repeatedly inside `implement`; `explore` may run at any point; `plan` and `spec` order is project-dependent.
- **Default value.** A resource that omits `stage` in its frontmatter defaults to `[freestyle]`. This lets unmodified plugin sources keep compiling while migration progresses.

## Required vs Optional Stages

Five stages are **load-bearing** — a preset that fails to cover them produces a `.harness/` that can not run a full development cycle:

```
required = [intent, plan, implement, verify, deliver]
optional = [freestyle, spec, explore, review]
```

Coverage is enforced by the compiler at warn level only:

- A required stage with zero resources across all enabled plugins emits a build-time warning naming the missing stage.
- `extras.{skills,agents,hooks,workflows,mcp}` entries can satisfy coverage even if the underlying plugin is not fully enabled.
- An optional stage with zero resources is silent.

Reasoning for the split:

- `spec` is project-culture-dependent (formal design docs are not universal).
- `explore` is overkill for small projects that have no need for an isolated read-only subagent.
- `review` is unnecessary for solo work.
- `freestyle` is the always-available bucket and never counts toward coverage by construction.

Warnings, not errors: the user may consciously omit a stage (e.g. solo experimentation), and the harness should still build.

## Resource → Stage Assignment

Every resource a plugin ships declares its stage(s) in its source frontmatter / config.

**Skills.** Extend `SKILL.md` frontmatter with `stage`:

```yaml
---
name: brainstorming
description: ...
stage: [intent]
---
```

`stage` is `Stage | Stage[]`. Single value is sugar for a one-element array. A skill that legitimately serves multiple lifecycle points (e.g. `systematic-debugging` fits both `explore` and `verify`) lists all of them.

**Hooks.** `plugins/<id>/hooks/<name>.json` gains a top-level `stage` field. The compiler uses it for matrix placement and for grouping in the emitted `stages/<stage>/` index; the underlying Claude Code hook semantics (event, match, action) are unchanged.

**Workflows.** `plugins/<id>/workflows/<name>.md` gains required frontmatter:

```yaml
---
name: plan
description: ...
stage: [plan]
---
```

**Subagents.** `plugins/<id>/agents/<name>.md` gains the same frontmatter shape. Subagent invocations are stage-scoped: `stages/explore/` listing the `explore` subagent helps the LLM frontend recommend "you have no `explore` cell — add an `explore` plugin or accept the gap".

**MCP servers.** `plugins/<id>/mcp/<name>.json` gains `stage` at the config root.

**Docs / rules / context / references.** These are passive (always-on), not stage-gated. They do not carry a `stage` field and do not appear in the matrix. They are emitted along their existing paths (`AGENTS.md`, `ARCHITECTURE.md`, `docs/references/*`) and consumed via the project's standing system prompt, not via stage retrieval.

**Permissions.** Aggregate, not per-resource. `plugins/<id>/permissions.json` has no stage. It is merged into `.claude/settings.example.json` as before.

## The Matrix as Compiler IR

After `resolve()` runs the resolver, the compiler holds:

```ts
type Cell =
  | { kind: "skill";     plugin: string; name: string; sourcePath: string }
  | { kind: "hook";      plugin: string; name: string; sourcePath: string }
  | { kind: "workflow";  plugin: string; name: string; sourcePath: string }
  | { kind: "agent";     plugin: string; name: string; sourcePath: string }
  | { kind: "mcp";       plugin: string; name: string; sourcePath: string };

type Matrix = {
  plugins: string[];                                          // enabled plugin ids in deterministic order
  stages: readonly Stage[];                                   // imported from src/stages.ts
  cells: Record<string, Record<Stage, Cell[]>>;               // cells[pluginId][stage] = resources
  coverage: Record<Stage, { plugins: string[]; ok: boolean }>;
};
```

Construction rules:

1. Start with empty matrix; `plugins` = preset expansion ∪ `extras.plugins`.
2. For each enabled plugin: walk its sub-directories, read frontmatter, place each resource into `cells[plugin][stage]` for every stage it declares.
3. For each `extras.{skills,agents,hooks,workflows,mcp}: ["<plugin>:<name>"]` entry: load the single source file and add to its cell *without* enabling the rest of the plugin.
4. After fill, compute `coverage` by scanning each stage's column.

The matrix is the **single source of truth** for downstream phases. `render()` and `emit()` consume the matrix; they do not re-traverse plugin source directories.

## Output Projections

`.harness/` is **one** projection of the matrix. Three projections coexist so each consumer reads through its preferred lens.

### Projection A — Resource-kind directories (consumer-facing)

Matches what Claude Code / Cursor / similar harnesses expect. Flat, kind-keyed, plugin id encoded in the filename for collision avoidance:

```
.harness/
├── AGENTS.md                                      # rendered doc
├── ARCHITECTURE.md
├── SKILLS.md                                      # aggregated index of all skills
├── docs/
│   ├── PLANS.md  PRODUCT_SENSE.md  ...
│   └── references/                                # raw reference passthrough
├── .claude/
│   ├── settings.example.json                      # merged permissions + hooks + plugin list
│   └── agents/<plugin>-<name>.md
├── skills/<plugin>-<name>/SKILL.md
├── hooks/<plugin>-<name>.json
├── workflows/<plugin>-<name>.md
└── mcp/config.json                                # merged mcp servers
```

### Projection B — Stage index (runtime retrieval)

A `stages/` directory whose entries are *not copies* but pointers. Lets an in-session agent answer "what's available at my current stage" cheaply.

```
.harness/stages/
├── freestyle/index.md
├── intent/index.md
├── plan/index.md
├── spec/index.md
├── explore/index.md
├── implement/index.md
├── verify/index.md
├── review/index.md
└── deliver/index.md
```

Each `index.md` is a small markdown file listing every cell in that stage's column, with relative paths into Projection A:

```markdown
# Stage: plan

## Skills
- planning · writing-plans → ../../skills/planning-writing-plans/SKILL.md
- superpowers · spec-first-planning → ../../skills/superpowers-spec-first-planning/SKILL.md

## Hooks
- planning · plan-required → ../../hooks/planning-plan-required.json

## Workflows
- planning · plan-flow → ../../workflows/planning-plan-flow.md
```

Markdown over symlinks so the layout is portable across filesystems and reads cleanly in any editor or git diff.

### Projection C — Machine-readable matrix (introspection)

```
.harness/manifest.json
```

The matrix itself, serialized. Consumers: the (post-v0) LLM frontend, coverage tooling, future `harness-kit explain` commands, CI gates that check coverage in PR pipelines.

```json
{
  "version": 1,
  "plugins": ["superpowers", "planning", "delivery", "nextjs"],
  "stages": ["freestyle","intent","plan","spec","explore","implement","verify","review","deliver"],
  "cells": {
    "superpowers": {
      "intent":    [{"kind":"skill","name":"brainstorming","path":"skills/superpowers-brainstorming/SKILL.md"}],
      "plan":      [{"kind":"skill","name":"writing-plans","path":"skills/superpowers-writing-plans/SKILL.md"}],
      "implement": [{"kind":"skill","name":"test-driven-development","path":"skills/superpowers-tdd/SKILL.md"}]
    },
    "planning": {
      "plan": [{"kind":"hook","name":"plan-required","path":"hooks/planning-plan-required.json"}]
    }
  },
  "coverage": {
    "freestyle": {"plugins": [],            "ok": true,  "required": false},
    "intent":    {"plugins": ["superpowers"], "ok": true,  "required": true},
    "plan":      {"plugins": ["superpowers","planning"], "ok": true, "required": true},
    "spec":      {"plugins": [],            "ok": false, "required": false},
    "explore":   {"plugins": [],            "ok": false, "required": false},
    "implement": {"plugins": ["superpowers","nextjs"], "ok": true, "required": true},
    "verify":    {"plugins": ["superpowers"], "ok": true,  "required": true},
    "review":    {"plugins": [],            "ok": false, "required": false},
    "deliver":   {"plugins": ["superpowers"], "ok": true,  "required": true}
  },
  "warnings": []
}
```

`warnings` collects any required-stage coverage gaps in human-readable form. CI can `jq '.warnings | length == 0'`.

## Plugin Sub-Directory Layout (extension)

The `2026-05-25-harness-yaml-schema-design.md` plugin layout is broadened from 5 to 7 sub-resource kinds. New entries are bolded:

```
plugins/<plugin>/
  README.md                                       # required, not emitted
  skills/<name>/SKILL.md                          # 0..N
  agents/<name>.md                                # 0..N
  hooks/<name>.json                               # 0..N
  docs/<name>/{manifest.ts, template.md}          # 0..N (rendered, passive)
  permissions.json                                # 0..1 (passive)
  **workflows/<name>.md**                         # 0..N
  **mcp/<name>.json**                             # 0..N
```

`workflows/` and `mcp/` are added because real lifecycle coverage requires them: the dify example today places `workflows/` and `mcp/` at the top of its hand-written `.harness/` because plugin sources have nowhere to put them. After this extension, those resources have a source home.

Migration impact on existing plugins: zero. No current plugin ships `workflows/` or `mcp/`; they are purely additive.

## Manifest Selection Algebra

Restated in matrix terms for clarity:

| Selector | Matrix effect |
|---|---|
| `preset: <name>` | Enable each plugin id in the preset's list; fill the full plugin row from its sub-directories. |
| `extras.plugins: [foo]` | Add row `foo`, fill its full row. |
| `extras.skills: ["foo:bar"]` | Add only the single cell `(foo, stage-of-bar, skill=bar)`. Plugin `foo` is not implicitly enabled. |
| `extras.agents` / `extras.hooks` / `extras.workflows` / `extras.mcp` | Same single-cell semantics. |
| `references` | Not in matrix (passive); rendered separately. |

`extras.workflows` and `extras.mcp` are new namespaces under `extras:` — additive to the yaml schema in `2026-05-25-harness-yaml-schema-design.md` and follow the same `<plugin>:<name>` addressing rule.

## Migration

Existing plugin source files have no `stage` frontmatter. Behavior:

1. Compiler defaults missing `stage` to `[freestyle]`.
2. All existing skills accordingly land in the `freestyle` column at first compile.
3. Coverage check warns that `intent`, `plan`, `implement`, `verify`, `deliver` are uncovered.
4. A documentation-only sweep (see plan) adds explicit `stage` to every existing SKILL.md.

Acceptance for migration: after the sweep, the `nextjs` preset's `manifest.json` `coverage` field has `ok: true` for all 5 required stages with no `warnings`.

## Non-Goals (this revision)

- **No stage inference.** The compiler never guesses a stage from skill name or description. Frontmatter is the only signal.
- **No stage hierarchy.** Stages are flat. No `implement.frontend` nested form.
- **No per-project stage override.** Yaml does not allow re-tagging a third-party skill's stage.
- **No required hook list.** Coverage is per stage at the resource-count level; we do not require specific hook kinds per stage.
- **No timeline / ordering enforcement.** Stages are a set; `plan` happening after `implement` is allowed.
- **No registry-level stage policy.** Plugin authors choose stages freely from the closed set; harness-kit does not curate.

## Open Questions

- **Should `freestyle` resources also appear in `stages/<other>/index.md`?** Argument for: a freestyle skill might be useful mid-implement. Argument against: it dilutes per-stage retrieval. *Initial position: freestyle appears only in `stages/freestyle/index.md` plus the global SKILLS.md.*
- **MCP servers and "stage" semantics.** An MCP server is persistent, not stage-bound. Is `stage` on MCP useful, or should MCP skip the matrix and live as a flat resource only? *Initial position: keep `stage` on MCP for stage-index retrieval, but never use MCP for coverage counting.*
- **Coverage warnings — soft or strict mode?** Should `harness-kit compile --strict` (post-v0) promote coverage warnings to errors? *Initial position: yes, behind an opt-in flag.*
- **Permissions per stage.** A delivery-time permission ("allow `gh pr create`") is different from an implement-time permission ("allow `npm install`"). Worth splitting? *Initial position: no, permissions stay aggregated; revisit when a real conflict appears.*
