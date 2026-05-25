# Plans Overview

This document is the entry point for planning and execution tracking. Update it whenever a plan moves between layers.

## Planning Structure

Four layers, from coarse to fine:

1. **Overall plan** — the multi-week roadmap. One active version at a time.
2. **Phase plan** — a single shippable slice (1–5 days of work). Several may be active in sequence but rarely in parallel.
3. **Proposal plan** — an experimental branch of work that may or may not be promoted to a phase. Never authorizes code changes on its own.
4. **Implementation record** — the post-hoc capture of what was actually built, paired one-to-one with the completed phase.

## Why Hashes In Filenames

Each plan filename ends with a short hash (e.g. `phase-03-feature-x-7f3ad.md`). The hash is generated when the plan is created and remains stable through its lifecycle (active → completed). Using a hash lets us:

- detect when a plan has been rewritten vs renamed
- pair an `impl-` file with its phase plan by matching the suffix
- avoid filename collisions when two phases get similar slugs

Pick a 5-character hex hash (e.g. take the first 5 chars of a UUID) when you create the file.

## Directory Layout

```text
docs/exec-plans/
├── overall/
│   ├── current/                    # at most one active overall plan
│   └── superseded/
├── phases/
│   ├── active/                     # phases currently being implemented
│   └── completed/                  # paired phase + impl files
├── proposals/
│   ├── active/                     # experimental, not yet authorized
│   └── superseded/                 # archived or promoted into a phase
└── tech-debt-tracker.md            # rolling list of known debt
```

## Current Overall Plan

Link to the currently active overall plan once it exists:

`exec-plans/overall/current/overall-v{n}-{hash}.md`

## Execution Snapshot

Maintain a short snapshot of "what's happening right now" at the top of this doc. Example shape:

- completed phases: 1–N
- active phases: list, or "none"
- active proposals: list, or "none"
- production URL: `https://...`
- last production deploy: ISO date + commit short SHA

Update this snapshot whenever a phase opens or closes.

## Phase And Proposal Summary

Tabulate phases and proposals once you have more than a handful. Keep it terse — link to the full plan file for detail.

| Track | Scope | Est. | Status |
|-------|-------|------|--------|
| 1 | Project scaffold | 0.5 d | Completed |
| 2 | Auth + session model | 1 d | Active |
| P1 | Experimental: real-time updates | 2 d | Proposal |

## Phase Details

When the table above gets long, move per-phase descriptions into the linked phase plan file and keep this section short. If a phase changed scope significantly, note the rationale in the phase plan, not here.

## Change Process

- A code change requires an active phase plan in `phases/active/` first.
- Proposals are explored under `proposals/active/` and only authorize code work after being promoted into a phase.
- Each completed phase produces an `impl-` file with the same hash, capturing what shipped vs what was planned.
- Superseded overall / proposal plans are moved (not deleted) into their `superseded/` folder so the history is recoverable.

## Tech Debt

Use `exec-plans/tech-debt-tracker.md` as the single rolling list of known debt. Each item is a one-liner: what, where, why it's debt, when it should be addressed. The tracker is allowed to grow; pruning happens when debt is paid down.
