# Acme Notes — Plans Overview

This document is the entry point for planning and execution tracking. Update it whenever a plan moves between layers.

## Planning Structure

Four layers, from coarse to fine:

1. **Overall plan** — the multi-week roadmap. One active version at a time.
2. **Phase plan** — a single shippable slice (1–5 days). Several may run in sequence but rarely in parallel.
3. **Proposal plan** — experimental branch of work that may or may not become a phase. Never authorizes code changes on its own.
4. **Implementation record** — paired one-to-one with each completed phase.

## Current Overall Plan

Active overall plan: [`overall-v1-a3f12.md`](exec-plans/overall/current/overall-v1-a3f12.md)

Estimate: 9 working days across 5 phases for V1 MVP.

## Execution Snapshot

Status as of 2026-05-25:

- completed phases: 1, 2
- active phase: 3 (publish toggle + public read path)
- active proposals: none
- production URL: not yet deployed
- last production deploy: n/a

## Phase And Proposal Summary

| Track | Scope | Est. | Status |
|-------|-------|------|--------|
| 1 | Project scaffold + Auth.js email magic-link | 1 d | Completed |
| 2 | Notes CRUD (DRAFT only) + dashboard list | 2 d | Completed |
| 3 | Publish toggle + public `/n/{note_id}` read path | 2 d | Active |
| 4 | Archive state + soft delete + trash view | 1.5 d | Planned |
| 5 | Polish: empty states, error boundaries, branded 404 | 1 d | Planned |
| 6 | Vercel deploy + production smoke test | 0.5 d | Planned |
| P1 | Markdown rendering with allowlisted tags only | 1 d | Proposal |

## Phase Details

### Phase 1 — Project scaffold + Auth

Set up the Next.js 16 project, Tailwind, Drizzle, Neon connection, and Auth.js with the email magic-link provider. Sign-in works end-to-end against a local Postgres.

### Phase 2 — Notes CRUD + dashboard

Implement `POST/GET/PATCH/DELETE /api/notes` for the `DRAFT` state only. Build the dashboard list view and the create/edit form. No publish toggle yet.

### Phase 3 — Publish toggle + public read

Add the `PUBLISHED` state transition and the unauthenticated `/n/{note_id}` read path. Update `QUALITY_SCORE.md` status badge mapping to include `PUBLISHED`. Document the public-read invariant (`state = 'PUBLISHED' AND deleted_at IS NULL`) in `SECURITY.md`.

### Phase 4 — Archive + soft delete

Add `ARCHIVED` state, soft-delete column, and a "Trash" view that lists soft-deleted notes for 30 days. Undelete is not in scope for V1 UI but the row is recoverable.

### Phase 5 — Polish

Loading skeletons, error boundary on the dashboard, branded 404 on the public read path, and a friendly empty state on the dashboard.

### Phase 6 — Deploy

Vercel project setup, Neon production branch, env vars, callback URL configuration, and a smoke test of the full create → publish → public read flow against production.

### Proposal 1 — Markdown rendering

Render note bodies with a restricted set of markdown features (headings, bold, italic, links, lists, code spans). Reject anything else at render time. Decide on a parser (`remark` vs hand-rolled) and assess the bundle cost before promoting this proposal into a phase.

## Change Process

- A code change requires an active phase plan in `phases/active/` first.
- Proposals are explored under `proposals/active/` and only authorize code work after promotion into a phase.
- Each completed phase produces an `impl-` file with the same hash, capturing what shipped vs what was planned.
- Superseded overall / proposal plans are moved (not deleted) into their `superseded/` folder so the history is recoverable.

## Tech Debt

Use [`exec-plans/tech-debt-tracker.md`](exec-plans/tech-debt-tracker.md) as the single rolling list of known debt.
