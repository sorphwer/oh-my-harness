# Product Vision and Sense

## Problem Statement

Teams increasingly use AI coding agents, but their operating model is usually
scattered across chat history, README notes, personal habits, and unstated
reviewer expectations. Agents then make plausible but wrong decisions because
the project lacks a local, explicit, reusable process contract.

## Target Audience

1. Engineering leads who want agents to follow the team's actual planning,
   quality, security, and release habits.
2. Developers using AI agents who want a project-local guide that reduces
   repeated prompting and reviewer cleanup.
3. Harness authors who want reusable methodology templates and plugin
   inventories without copying an entire example by hand.

## Product Value

- Turn a team's working style into a project-local `.harness/` folder.
- Keep the authoring source compact in `harness.yaml`.
- Compile deterministically without an API key, network call, or LLM runtime.
- Make fixed docs ask the right questions before pretending to know the project.
- Keep plugin selection visible without committing to plugin resource schemas too early.
- Stay complementary to hook-focused tools by leading with methodology and docs.

## Current v1 Prototype

Compiler v1 currently has a minimal runnable prototype:

- root `harness.yaml`
- 11 fixed Markdown templates under `.harness/templates/`
- `src/compile.ts`
- development entrypoint: `npx tsx src/compile.ts <harness.yaml>`
- generated run directories under `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>`
- generated `PLUGINS.md` inventory for yaml-selected plugins
- fixture tests for the compile function, direct `tsx` entrypoint, and unknown plugin failure

The current docs are v1 docs. Plugins are first-class: they are the top-level
resource organization and the future owner of `plugin.skill`, `plugin.agent`,
and `plugin.rules` resources.

The old v0 pool model is deprecated. Do not revive `docs-pool`, `catalog`,
`skills-pool`, `agents-pool`, `hooks-pool`, or permission-pool work for new
compiler changes.

## Intentional Constraints

- No packaged CLI yet.
- No `--watch`, `--check`, install flow, or npm publish flow.
- No LLM frontend until yaml-to-folder compile is stable.
- No reverse extraction from `.harness/` back to yaml.
- No references output.
- No `.claude` output.
- No broad hook enforcement layer.
- No copying plugin skill, agent, or rules bodies until those resource schemas are defined.

## Strategic Shape

- `harness.yaml` is the stable authoring interface.
- Fixed templates give every generated harness the same documentation coverage.
- Plugins are the first-class distribution unit for reusable resources.
- The compiler stays deterministic and local.
- Self-hosting should happen only after we decide to replace the current
  hand-maintained root `.harness/` with generated output.

## Future Direction

- Define `plugin.skill`, `plugin.agent`, and `plugin.rules` resource schemas.
- Decide whether presets return or `plugins:` stays explicit.
- Add resource projection beyond `PLUGINS.md`.
- Add references and `.claude` output once the v1 prototype contract is stable.
- Add `--watch` and `--check`.
- Add a packaged CLI.
- Add an optional LLM frontend for natural-language harness authoring.
