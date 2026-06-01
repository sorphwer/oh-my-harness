# Plans Overview

This document is the entry point for harness-kit planning and execution tracking.

## Current Snapshot

- Current product phase: compiler v1 docs and minimal prototype.
- Active implementation track: yaml-to-harness compiler v1.
- Active spec: `.harness/docs/superpowers/specs/2026-05-27-yaml-to-harness-compiler-v1-design.md`.
- Active plan: `.harness/docs/superpowers/plans/2026-05-27-yaml-to-harness-compiler-v1.md`.
- Root manifest: `harness.yaml` exists with `planning`, `delivery`, and `debugging` plugins.
- Resource model: plugin-first. The plugin is the top-level authoring and
  distribution boundary.
- Root `.harness/`: still hand-maintained; do not overwrite it unless self-hosting is explicitly approved.
- Deprecated: old v0 `docs-pool`, `catalog`, `skills-pool`,
  `agents-pool`, `hooks-pool`, and permission-pool plans are historical only.

## Planning Structure

This repo uses two planning layers during bootstrap:

1. **Superpowers spec** - the design document for a scoped piece of work.
2. **Superpowers implementation plan** - a step-by-step execution checklist
   paired with the spec.

Longer-term roadmap or phase plans can be added under `.harness/docs/exec-plans/`
when the project has enough history to need them. For now, keep the plan surface
small.

## Directory Layout

```text
.harness/docs/
|-- PLANS.md
`-- superpowers/
    |-- specs/
    |   |-- 2026-05-27-yaml-to-harness-compiler-v1-design.md
    |   |-- 2026-05-26-plugin-stage-matrix-design.md
    |   `-- deprecated historical 2026-05-25 specs
    `-- plans/
        |-- 2026-05-27-yaml-to-harness-compiler-v1.md
        |-- 2026-05-26-plugin-stage-matrix.md
        `-- deprecated historical 2026-05-25 plans
```

## Active v1 Prototype Record

The current compiler v1 implementation record covers the minimal prototype:

- TypeScript project scaffold.
- root `harness.yaml`.
- 11 fixed Markdown templates under `.harness/templates/`.
- `src/compile.ts` with `load`, `resolve`, `render`, `emit`, and `main`.
- `PLUGINS.md` inventory output.
- tests for compile output, direct `npx tsx` entrypoint, and unknown plugin failure.

Do not resume the deprecated v0 pool-model plans. They predate the current
plugin-first contract.

## Current Verification

Expected verification commands:

```bash
npm test
npm run typecheck
npx tsx src/compile.ts harness.yaml
```

`npx tsx src/compile.ts harness.yaml` writes to
`outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>`. `npm test` includes a direct
`npx tsx src/compile.ts ...` test. In restricted sandboxes, `tsx` may need
permission to create its local IPC pipe.

## Change Process

- Code changes should map back to the active spec and plan.
- If the implementation plan is wrong, update it before continuing.
- Keep fixture changes intentional: examples are acceptance tests for the product.
- Do not overwrite the root `.harness/` until self-hosting is explicitly in scope.
- If a change adds plugin resource projection, references, `.claude`, stage
  output, watch mode, check mode, packaging, or an LLM frontend, update the spec
  first.

## Deferred Work

Deferred does not mean forgotten. These items stay out of the compiler v1
prototype:

- packaged CLI command
- `--watch` and `--check`
- npm package publishing
- copying plugin skill, agent, or rules bodies
- references output
- `.claude` output
- stage matrix output
- replacing this repo's root `.harness/` with generated output
- natural-language to yaml LLM frontend
