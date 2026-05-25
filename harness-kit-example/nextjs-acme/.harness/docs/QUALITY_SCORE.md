# Acme Notes — Quality Standards

The quality bar that must be cleared before a feature is "done" in Acme Notes.

## Code Quality

- TypeScript strict mode is on; no `any`, no `as unknown as`.
- ESLint clean — no `eslint-disable` without a `// eslint-disable-next-line <rule> -- <reason>` comment naming the rule and reason.
- One term per concept: `note_id` everywhere (not `noteId` in some places and `note_id` in others); `state` everywhere (not `status`).
- Server-only modules (Drizzle client, Auth.js server config, secret-handling helpers) are never imported from `"use client"` files.
- Drizzle queries always include `WHERE user_id = $1 AND deleted_at IS NULL` on owner-scoped tables; the type system does not enforce this, so a code review must catch any missing scope filter.

## Security

- All secrets are unprefixed env vars (`DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`). Anything exposed to the client uses `NEXT_PUBLIC_`.
- Session validation lives in `middleware.ts`. No page or server action re-implements it.
- Every mutation route validates input with a `zod` schema before touching the database.
- Public read path explicitly checks `state = 'PUBLISHED' AND deleted_at IS NULL` — no cache layer that could serve a stale `PUBLISHED` for a now-archived note.
- Error responses never include database error messages or stack traces. Server logs get the detail; the user sees a generic message.

## Reliability

- State transitions use atomic SQL: `UPDATE notes SET state = $1, updated_at = NOW(), published_at = COALESCE(published_at, NOW()) WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL`. Zero rows returned → 404.
- Duplicate-create detection: same user + same title + same body within 5 seconds returns `409` with the existing `note_id`.
- The public read path has no terminal "failure" state to distinguish from a normal 404. Either the note is `PUBLISHED` and visible, or the request 404s.
- No background side effects in V1, so there is nothing to mark as "edit-after-commit failed."

## User Experience

- Top bar is 60 px. No marketing band, no oversized hero on internal pages.
- Active navigation state on the current page (only matters once we have more than one nav item).
- Status badges only on actual states (`DRAFT`, `PUBLISHED`, `ARCHIVED`) — never as a decorative pill on section headings.
- Destructive actions (delete forever) confirm before executing.
- Back navigation on `/notes/{note_id}` and `/notes/archive` returns to `/`.
- Loading skeletons on the dashboard list.
- Error boundary on the authenticated tree, with a "Try again" CTA.
- Branded 404 on `/n/{note_id}` for unpublished or soft-deleted notes.
- The note edit form is a single column — no stepper, no multi-tab layout.
- Inline validation feedback on the email input on `/login`.

### Status Tag Mapping

The note lifecycle uses three states. The same tone/icon mapping is used in the dashboard list, the editor header, and the archive view.

| State | Tone | Icon (Phosphor) |
|-------|------|------------------|
| `DRAFT` | muted (`slate-500` on `slate-100`) | `PencilSimple` |
| `PUBLISHED` | success (`emerald-700` on `emerald-50`) | `Globe` |
| `ARCHIVED` | muted (`slate-500` on `slate-100`) | `Archive` |

This is the single source of truth for status presentation. `FRONTEND.md` references this table; do not redefine it elsewhere.

### Visual Standards

- System font stack (`ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`).
- Standardized border-radius: `rounded-md` on inputs/buttons, `rounded-lg` on note rows and cards.
- One accent color (`sky-600`) for primary actions; one tone (`rose-600`) for destructive actions.
- No wrapper card around dashboard rows — they sit directly on the page background with `border-b` separators.

## Documentation

- `AGENTS.md`, `ARCHITECTURE.md`, and `PLANS.md` all reference the same API routes and field names. If a route is renamed, the rename happens in the same commit across all three.
- The status table above is the single source of truth — `FRONTEND.md` and `DESIGN.md` link here rather than re-stating the mapping.
- `PLANS.md`'s "Execution Snapshot" is updated when a phase moves between active/completed.

## Testing Strategy

V1 relies on manual end-to-end verification (see `UAT_CHECKLIST.md`). The minimal set:

- create a note (signed in)
- edit title / body
- publish (DRAFT → PUBLISHED)
- archive (PUBLISHED → ARCHIVED)
- unarchive (ARCHIVED → PUBLISHED)
- soft-delete from any state
- duplicate-create within 5 seconds returns 409
- public read works for PUBLISHED, 404s for DRAFT/ARCHIVED/soft-deleted/non-existent
- cross-user scope: user B cannot read user A's notes via `/api/notes/{id}`

Automated tests are deferred to V2. Documented as a known gap in `RELIABILITY.md`.

## Quality Checklist

| Area | Required checks |
|------|-----------------|
| API | every documented `/api/notes` route matches the live response shape (no stale fields) |
| States | `DRAFT → PUBLISHED`, `PUBLISHED → ARCHIVED`, `ARCHIVED → PUBLISHED` all behave per `ARCHITECTURE.md`'s lifecycle diagram |
| Errors | duplicate-create returns 409 with `existing_note_id`; cross-user reads return 404 |
| UI | top bar height, dashboard list, edit form, status badges all match the `FRONTEND.md` spec |
| Docs | the field list returned by `GET /n/{note_id}` matches `ARCHITECTURE.md`'s "Data Stored for Outcomes" section |
