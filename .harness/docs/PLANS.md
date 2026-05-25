# Plans Overview

This document is the entry point for harness-kit planning and execution tracking.

## Current Snapshot

- Current product phase: pre-MVP.
- Active implementation track: MVP v0 compiler.
- Active spec: `.harness/docs/superpowers/specs/2026-05-25-mvp-development-design.md`.
- Active plan: `.harness/docs/superpowers/plans/2026-05-25-harness-kit-mvp-v0.md`.
- Root self-hosting status: hand-bootstrapped `.harness/` exists; generated `./.harness/` from `./harness.yaml` is still future work.

## Planning Structure

This repo uses two planning layers during bootstrap:

1. **Superpowers spec** - the design document for a scoped piece of work.
2. **Superpowers implementation plan** - a step-by-step execution checklist paired with the spec.

Longer-term roadmap or phase plans can be added under `.harness/docs/exec-plans/` when the project has enough history to need them. For now, keep the plan surface small.

## Directory Layout

```text
.harness/docs/
├── PLANS.md
└── superpowers/
    ├── specs/
    │   └── 2026-05-25-mvp-development-design.md
    └── plans/
        └── 2026-05-25-harness-kit-mvp-v0.md
```

## Active MVP Plan

The active plan builds the smallest useful compiler:

- TypeScript project scaffold.
- `example/nextjs-acme/harness.yaml`.
- Docs, skills, references, and permissions pools.
- `src/compile.ts` with `load`, `resolve`, `render`, and `emit`.
- One fixture test proving emitted files are byte-equal to the target subset.

## Change Process

- Code changes should map back to the active spec and plan.
- If the implementation plan is wrong, update it before continuing.
- If a task would add CLI, watch, check, packaging, or LLM behavior, stop and confirm scope first.
- Keep fixture changes intentional: examples are the acceptance tests for the product.
- Completed implementation notes should record what shipped, what differed from the plan, and what remains.

## Deferred Work

Deferred does not mean forgotten. These items stay out of v0:

- CLI entrypoint and command name.
- `--watch` and `--check`.
- npm package publishing.
- Full stdlib docs pool.
- Root self-hosting through `./harness.yaml`.
- Natural-language to yaml LLM frontend.

