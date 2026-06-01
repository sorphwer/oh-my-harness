# Specs and Plans — Authoring Convention

This folder holds two kinds of long-form planning documents. They are not interchangeable. Mixing them is a process bug, not a stylistic preference.

```
.harness/docs/superpowers/
├── specs/   YYYY-MM-DD-<topic>-design.md   — what we are building and why
└── plans/   YYYY-MM-DD-<topic>.md          — how to build it, step by step
```

## TL;DR

> **A spec defines the contract. A plan executes against it.**
> Spec failure: you build the wrong thing well.
> Plan failure: you build the right thing but skip a step.

## Spec vs Plan

| | **Spec** (`specs/`) | **Plan** (`plans/`) |
|---|---|---|
| Answers | "What are we building? Why? What are the invariants?" | "Which files change? In what order? How do we know we're done?" |
| Primary content | Vocabulary, contracts, decisions, non-goals, open questions | File list, numbered tasks, `- [ ]` checkbox steps, acceptance criteria |
| Form | Prose + tables + zod / TS signatures + ASCII diagrams | `## Task N` blocks + concrete commands and edits |
| Authoring skill | `superpowers:brainstorming` → `superpowers:spec-first-planning` | `superpowers:writing-plans` |
| Execution skill | None — humans review the design | `superpowers:executing-plans` or `superpowers:subagent-driven-development` |
| Lifecycle | Long-lived; extended or superseded by later specs | Consumed once; marked `implemented`, `SUPERSEDED`, or `NEEDS REWRITE` after execution |
| Variable that triggers update | Requirements, constraints, or invariants changed | Repo state changed (files renamed, deps moved, deferred task picked up) |
| Cost of being wrong | Architectural debt; expensive to undo | Local rework; cheap to fix |

## When to write a spec

Before any plan, when **any** of these is true:

- The vocabulary is unsettled (we don't agree on what to call things).
- A design decision will outlive any single implementation pass.
- The work introduces or changes a contract (yaml shape, public API, file layout, on-disk artifact).
- Reasonable engineers could pick different shapes; we need to pick one and write down why.

A spec is the artifact of the `spec` stage (see [`2026-05-26-plugin-stage-matrix-design.md`](specs/2026-05-26-plugin-stage-matrix-design.md)).

## When to write a plan

After a spec exists and was approved, when **any** of these is true:

- The work touches more than ~5 files or spans more than one logical phase.
- The work will be handed to a subagent or executed across sessions.
- The work has acceptance criteria that should be checkable mechanically.
- We want a written record of execution order for future archaeology.

A plan is the artifact of the `plan` stage. It cites its spec in the header.

## Required shape

### Spec front matter (`specs/YYYY-MM-DD-<topic>-design.md`)

```
# <Topic> — Design

Date: YYYY-MM-DD
Status: draft | accepted | superseded
Extends / Supersedes: <other spec path, if applicable>

## Goal
## Background
## <design body — vocabulary, contracts, decisions>
## Non-Goals
## Open Questions
```

### Plan front matter (`plans/YYYY-MM-DD-<topic>.md`)

```
# <Topic> — Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans.

Goal: <one paragraph>
Architecture: <one paragraph>
Spec: <link to the spec it implements>

## File Structure
   New: <list>
   Modified: <list>
   Not modified: <list>

## Task 0: <name>
   Files: <list>
   - [ ] Step 1: <action with exact command or edit>
   - [ ] Step 2: ...
   - [ ] Step N: Commit
       git commit -m "..."

## Task 1: ...
...
## Acceptance Criterion
   <executable predicate that says "this plan shipped">
## Out of Scope
   <explicit deferrals>
```

## What does NOT belong in each

| | Spec | Plan |
|---|---|---|
| File-level edits with line numbers | ✗ — that's a plan | ✓ |
| Open design questions | ✓ | ✗ — resolve in the spec first |
| `git commit -m "..."` commands | ✗ | ✓ |
| zod schemas defining the contract | ✓ | ✗ — only reference the spec's schema |
| Speculation about future work | ✓ (Non-Goals / Open Questions) | ✗ (Out of Scope only — concrete deferrals, not ideas) |
| Step-by-step instructions for an agent | ✗ | ✓ |
| Acceptance criterion you can `grep` for | ✗ | ✓ |

## Why separation matters

If spec and plan are merged into one document:

- Reviewers are forced to evaluate "is this the right design?" and "is step 3 the right edit?" in the same pass. The two have different review tempos and different reviewers (designer vs operator), and they pollute each other.
- An executing subagent stalls on open design questions because it cannot tell which lines are "to do" and which are "still being argued about".
- When the spec needs to evolve six months later, the plan-style edit history obscures which decisions were load-bearing and which were incidental to one execution pass.

If a single document tries to do both, split it before review.

## Lifecycle

```
brainstorm (intent)
    │
    ▼
spec-first-planning  ─►  specs/YYYY-MM-DD-<topic>-design.md   ← spec stage
    │                         │
    │                         │ approved
    ▼                         ▼
writing-plans        ─►  plans/YYYY-MM-DD-<topic>.md          ← plan stage
                              │
                              │ executed via subagent-driven-development
                              ▼
                          implement + verify + deliver
                              │
                              ▼
                          plan marked implemented, SUPERSEDED, or archived
                          spec stays canonical until extended/superseded
```

A spec outlives the plans that implement it. A topic typically has one spec and one or more plans (initial implementation plan, follow-up plans for deferred scope, rewrite plans when on-disk reality drifts).

## Naming and dating

- Date is the **authoring date**, not a target date. Don't bump it on edits.
- Topic is a kebab-case noun phrase. Prefer the noun (`plugin-stage-matrix`) over the verb (`add-plugin-stage-matrix`).
- Specs end with `-design.md`. Plans don't carry a suffix.
- A plan references its spec by relative link in the header — never by date alone.

## Related skills

The `plugins/planning/` plugin ships the skills that produce these documents:

- `skills/brainstorming` — turn intent into shared understanding (precedes spec).
- `skills/spec-first-planning` — turn shared understanding into a spec.
- `skills/test-driven-development` — execution discipline once a plan is being implemented.

The `writing-plans`, `executing-plans`, and `subagent-driven-development` skills live in the upstream `superpowers` plugin. In this repo they are discovered through the current harness/plugin inventory, not a project preset.
