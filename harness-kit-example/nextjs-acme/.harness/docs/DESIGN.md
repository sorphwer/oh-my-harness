# Acme Notes — Design Overview

This document summarizes the design philosophy of Acme Notes. For concrete design decisions, see `design-docs/`.

## Design Philosophy

In tiebreak order:

1. **Speed of capture.** Time from "I want to write something down" to a saved draft is the primary success metric. Anything that slows that down loses by default.
2. **Durable public URLs.** Once a note is published at `/n/{note_id}`, that URL is permanent. Title changes don't break it; soft-delete redirects to a branded 404.
3. **No-ceremony publish.** Going from `DRAFT` to `PUBLISHED` is a single toggle, not a workflow. No reviewers, no scheduled rollouts, no draft preview link.
4. **Boundaries that are simple to reason about.** Single user per account; every row keyed by `user_id`; the only unauthenticated surface is the public read path.
5. **Minimal operational burden.** Vercel + Neon + Auth.js — nothing else in V1.

## Interface Design Principles

- **Content above the fold.** The dashboard shows the user's notes immediately. No marketing band, no onboarding overlay after first login.
- **Compact navigation.** A 56-px top bar carries the product name, "New note" button, and user dropdown. Nothing else.
- **Task-oriented language.** Buttons say "Publish", "Archive", "Delete forever" — not "Move to PUBLISHED state."
- **State badges for states.** Three states (`DRAFT`, `PUBLISHED`, `ARCHIVED`) map to three tone-and-icon badges. Documented in `QUALITY_SCORE.md`.
- **Typography as hierarchy.** Note titles use `h2`, sections within a note use `h3`. No decorative pill labels.
- **Back navigation.** The edit page and the public read page both expose a clear path back (to the dashboard / to the share-source dashboard if signed in).
- **Graceful degradation.** Dashboard list shows a skeleton while loading; empty dashboard shows a "Create your first note" CTA.

## Core Pattern

*Stateless request handler*: validate → persist → respond. Every mutation route is a thin layer over a `zod` schema and a single `UPDATE ... WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL` statement. The 0-rows-returned outcome maps to `404`.

There are no background workers, no queues, no scheduled jobs in V1.

## Tenancy

Single user per account. There is no organization, workspace, or team layer above the user. Every owned-resource table carries `user_id`; every query filters by the resolved session user. The UI does not expose a tenant switcher because there is no second tenant.

If a multi-user feature is added later, the entry point will be a `collaborators` table joined to `notes` — not a retrofitted organization model.

## Key Design Patterns

### One toggle = one state transition

The "Publish" toggle in the editor is the only UI affordance that moves state. Archive uses an explicit menu item. Soft-delete uses a destructive button. Each action maps to exactly one server action, no compound state changes per click.

### Public read is its own surface

`GET /n/{note_id}` does not share rendering code with the authenticated edit view. It re-checks `state = 'PUBLISHED' AND deleted_at IS NULL` in the database, never relies on a cache, and never exposes `user_id`, `deleted_at`, or any other internal field.

### Soft delete with no UI for undelete

`deleted_at` is set when the user clicks "Delete forever." The V1 dashboard hides soft-deleted rows entirely. The database row is recoverable (operators can `UPDATE notes SET deleted_at = NULL`), but no user-facing path exposes this in V1.

## Data Returned to Callers

The public note read response (`GET /n/{note_id}`) returns exactly these fields:

- `id`
- `state`
- `title`
- `body`
- `created_at`
- `updated_at`
- `published_at`

`user_id`, `deleted_at`, and any future analytics fields are never returned through the public API. The authenticated owner read returns the same fields plus nothing else — the owner has no privileged view of soft-delete metadata in V1.
