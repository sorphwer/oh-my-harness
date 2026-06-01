# YAML to Harness Compiler v1 - Design

Date: 2026-05-27
Status: accepted
Supersedes:
- `2026-05-25-mvp-development-design.md` for compiler implementation scope.
- `2026-05-25-harness-kit-mvp-v0.md` and `2026-05-25-harness-kit-mvp-v1.md` as executable plans.
Deprecates:
- the v0 pool model: `docs-pool`, `catalog`, `skills-pool`,
  `agents-pool`, `hooks-pool`, and permission pools.

## Goal

Build the first executable TypeScript compiler for the current harness-kit v1
resource model. The compiler reads a small `harness.yaml` and emits a project
`.harness/` directory made from fixed harness templates plus a selected plugin
inventory.

The old v0 compiler target is abandoned. All new implementation work targets
this v1 contract. A minimal compiler v1 prototype now exists in `src/compile.ts`.

## Background

harness-kit is a doc-first methodology bundle. A generated `.harness/` should
start a project with durable process documents, then guide the agent to ask the
user enough questions to fill those documents to the same granularity as this
repo's current `.harness/` and the Next.js examples.

The source model has two separate parts:

- Fixed harness templates are part of harness-kit itself.
- Plugins are first-class user-selectable resources, organized by plugin id.

Those parts must not be collapsed. The fixed templates are not plugin resources.
Plugins do not own the core `.harness` document skeleton.

## Fixed Harness Templates

The compiler copies fixed Markdown templates from `.harness/templates/` into the
generated `.harness/` tree. The template source layout mirrors the output layout.

Required template files:

```text
.harness/templates/AGENTS.md
.harness/templates/ARCHITECTURE.md
.harness/templates/docs/DESIGN.md
.harness/templates/docs/FRONTEND.md
.harness/templates/docs/OPERATIONS.md
.harness/templates/docs/PLANS.md
.harness/templates/docs/PRODUCT_SENSE.md
.harness/templates/docs/QUALITY_SCORE.md
.harness/templates/docs/RELIABILITY.md
.harness/templates/docs/SECURITY.md
.harness/templates/docs/UAT_CHECKLIST.md
```

Generated output paths:

```text
.harness/AGENTS.md
.harness/ARCHITECTURE.md
.harness/docs/DESIGN.md
.harness/docs/FRONTEND.md
.harness/docs/OPERATIONS.md
.harness/docs/PLANS.md
.harness/docs/PRODUCT_SENSE.md
.harness/docs/QUALITY_SCORE.md
.harness/docs/RELIABILITY.md
.harness/docs/SECURITY.md
.harness/docs/UAT_CHECKLIST.md
```

Template content rules:

- Pure Markdown only.
- No render variables, template expressions, timestamps, or random content.
- No unresolved `TODO` or `TBD` markers.
- The initial content is a scaffold and user-interview guide, not a completed
  project document.
- Each template tells an agent what to ask the user before turning the scaffold
  into a project-specific document.

The compiler v1 first pass does not render templates with project variables.
It copies them as bytes.

## Plugin Resource Model

The top-level organization unit is a plugin.

```text
plugins/
  <plugin-id>/
    README.md
    skills/
    agents/
    rules/
```

The resource identity model is:

- `plugin.skill`
- `plugin.agent`
- `plugin.rules`

The exact shape of resources inside each plugin type is not finalized in this
contract. Compiler v1 therefore does not copy skill, agent, or rules bodies into
the generated harness yet.

For the first compiler v1 implementation, selected plugins are represented only
by a generated inventory file:

```text
.harness/PLUGINS.md
```

`PLUGINS.md` lists selected plugin ids and points contributors to plugin source
directories. It is an inventory, not a resource projection.

## YAML Contract

The first implementation needs only enough yaml to select plugins and name the
project. Keep the schema narrow until another fixture demands more.

```yaml
name: example-project
displayName: Example Project
plugins:
  - planning
  - delivery
```

Fields:

| Field | Required | Purpose |
|---|---:|---|
| `name` | yes | Stable project slug for validation and future outputs. |
| `displayName` | yes | Human-readable project name for future use. |
| `plugins` | yes | Ordered list of plugin ids to include in `.harness/PLUGINS.md`. |

The compiler validates that every selected plugin id exists under `plugins/`.
The compiler does not infer plugins from a preset in this first pass.

## Pipeline

```text
harness.yaml
  -> load yaml and validate schema
  -> resolve selected plugin ids against plugins/
  -> collect fixed template files from .harness/templates/
  -> render output map by byte-copying templates and composing PLUGINS.md
  -> create outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>/
  -> emit files under that run directory
```

Phase contracts:

- `load` reads and validates yaml.
- `resolve` checks plugin ids and required template files.
- `render` returns deterministic output bytes.
- `emit` writes files and creates parent directories under the generated run directory.

The same input yaml, template tree, plugin tree, and compiler version must
produce the same output bytes. The run directory name intentionally varies by
timestamp and four-character hash.

## Development Entrypoint

Compiler v1 exposes a direct TypeScript script entrypoint for development use:

```bash
npx tsx src/compile.ts <harness.yaml>
```

This is not a packaged CLI. It is the minimal runnable surface needed before
the project has a published `harness-kit` command. It prints the generated
`outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>` directory path.

## Non-Goals

- No v0 schema support.
- No packaged CLI command.
- No watch mode.
- No LLM frontend.
- No self-hosting.
- No references output.
- No `.claude` output or settings adaptation.
- No stage matrix projection.
- No copying plugin skill, agent, or rules bodies.
- No template variable rendering.
- No reverse extraction from `.harness/` to yaml.

## Acceptance Criteria

- The repository contains the 11 fixed template source files under
  `.harness/templates/`.
- A fixture yaml can compile into `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>/`
  containing the 11 fixed `.harness` document files and `PLUGINS.md`.
- The generated fixed documents are byte-equal to their template sources after
  path mapping.
- The generated `PLUGINS.md` is deterministic and lists exactly the yaml-selected
  plugin ids in order.
- Unknown plugin ids fail validation before emit.
- No generated output includes references or `.claude` files.

## Open Questions

- What is the exact schema for `plugin.skill`, `plugin.agent`, and
  `plugin.rules` resources?
- Should a later compiler pass use `preset` again, or should `plugins` remain
  explicit in yaml?
- Should plugin inventories eventually include stage coverage once plugin
  resource schemas are fixed?
