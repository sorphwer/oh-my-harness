# Plans Overview

This document is the entry point for planning and execution tracking. It should help
an agent or contributor answer three questions quickly:

- What is the project trying to ship next?
- Which plan authorizes the current work?
- What has already shipped, changed, or been deferred?

A project-specific version should use concrete paths, dates, owners, plan names,
and status notes. Do not leave placeholder text behind. If the needed facts are
missing, ask the user before turning this scaffold into a project record.

## Planning Structure

Use planning layers from coarse to fine. A small project may keep only the first
active layer and add the others when the work needs them.

1. **Current snapshot** - the short operational state of the project right now.
2. **Overall plan** - the roadmap or strategy across multiple phases.
3. **Phase plan** - a shippable slice of work with a bounded scope.
4. **Proposal plan** - an experimental branch of work that does not authorize implementation until promoted.
5. **Implementation record** - the post-hoc capture of what shipped compared with what was planned.

Superpowers specs and implementation plans belong under
`.harness/docs/superpowers/`. Longer-lived roadmap, phase, proposal, and
implementation records can live under `.harness/docs/exec-plans/` when the
project needs that level of tracking.

## Directory Layout

Use this layout as the default unless the project already has a simpler canonical
planning tree.

```text
.harness/docs/
|-- PLANS.md
|-- superpowers/
|   |-- specs/
|   `-- plans/
`-- exec-plans/
    |-- overall/
    |   |-- current/
    |   `-- superseded/
    |-- phases/
    |   |-- active/
    |   `-- completed/
    |-- proposals/
    |   |-- active/
    |   `-- superseded/
    `-- tech-debt-tracker.md
```

## Current Snapshot

Keep the snapshot short enough to scan in one pass. A filled project document
should capture:

- current product phase
- active implementation track
- active spec or design document
- active implementation plan
- completed phases
- active proposals
- production or demo URL when relevant
- last deploy, release, or verification checkpoint when relevant

If a field does not apply to the project, omit it instead of writing empty status
text.

## Current Overall Plan

Link the active overall plan when one exists. Explain the target outcome,
estimated scope, and planning horizon in plain language. If the project does not
yet need an overall plan, say which active phase or Superpowers plan is currently
steering the work.

## Phase And Proposal Summary

Use a compact table once there is more than one phase or proposal to track. The
standard columns are:

- Track
- Scope
- Estimate
- Status

The table should summarize status, not replace the linked plan files. Keep names
short and move detailed rationale into the phase, proposal, or implementation
record.

## Phase Details

Add short phase descriptions when they help a reader understand the sequence of
work. Each phase description should include:

- user-visible outcome
- major files or systems affected
- key invariant or acceptance check
- reason the scope is bounded

If a phase changed significantly while being implemented, record the change in
the phase plan or implementation record, then summarize the result here.

## Change Process

- Code changes should map back to an active spec, phase plan, or implementation plan.
- Proposal plans are for exploration and do not authorize implementation until promoted.
- If the implementation plan is wrong, update the plan before continuing.
- Completed phases should produce an implementation record that states what
  shipped, what differed from the plan, and what remains.
- Superseded overall and proposal plans are moved to their superseded folders instead of deleted.
- Deferred work belongs in this document only when it affects current planning decisions.

## Tech Debt

Use `.harness/docs/exec-plans/tech-debt-tracker.md` as the rolling list of known
debt when the project needs one. Each item should state what the debt is, where
it lives, why it matters, and when it should be addressed.

## Agent Intake Guide

Before filling a project-specific `PLANS.md`, gather enough answers to make the
document concrete. Ask only for facts that are not already available in the repo,
active branch, issue, pull request, or existing harness docs.

Good intake behavior:

- Start by saying what you found and what is still unknown.
- Ask one decision at a time when the answer changes the planning structure.
- Prefer short multiple-choice questions when the user is choosing between
  planning shapes.
- Use the user's words for product goals, but rewrite them into precise project state.
- Treat "not applicable" as a valid answer and omit that section from the filled document.
- When the user is unsure, propose a conservative default and label it as an assumption before editing.

Questions that usually matter:

1. What is the current product phase?
2. What work is actively authorized right now?
3. Which spec, design, issue, or plan should be treated as the source of truth?
4. What has already shipped or been completed?
5. What work is active, planned, proposed, blocked, or deferred?
6. What should not be included in the current scope?
7. What evidence closes the active phase: tests, build, deploy, user acceptance,
   migration, or another check?
8. Where should completion notes or implementation records be stored?
9. Are there production, staging, demo, or preview URLs that belong in the snapshot?
10. Are there known debt items that should influence planning order?

When the user gives partial answers, fill only the sections supported by
evidence and ask a focused follow-up for the next missing decision.

## Filled Document Standard

A filled `PLANS.md` should be specific enough that a new agent can continue the
project without rediscovering the planning context. It should include concrete
file paths, active plan names, current status, and bounded deferred work. It
should not duplicate full phase plans, specs, issue threads, or implementation
records.
