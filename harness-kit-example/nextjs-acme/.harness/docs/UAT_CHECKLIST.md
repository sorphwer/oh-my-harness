# Acme Notes — UAT Checklist

Minimum acceptance pass before a release. Update the per-phase sections to match the work currently being validated. Generic acceptance items live in the "Exit Criteria" section so they survive across phases.

## Current Context

- Phases implemented through phase 2 (notes CRUD + dashboard).
- Currently validating phase 3 (publish toggle + public read path).
- Active proposals: none.

Use this document in two ways:

- **Local validation** — against a local dev server with a local Neon branch. Run all checks; the "production verification" subset below is informational only.
- **Production validation** — against the live `https://acme-notes.vercel.app/` deployment. Run all checks including the externally-dependent ones (magic-link delivery, real public URL).

## Preconditions

- Neon migrations are applied.
- `.env.local` contains valid `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (set to `http://localhost:3000` locally), `EMAIL_FROM`, `RESEND_API_KEY`.
- A test user account exists. Test email is delivered (locally: Resend test mode; production: a real inbox you can read).
- No notes exist for the test user at the start of the run (or the existing-notes count is recorded so deltas are visible).

## Core API Acceptance

### 1. Create

- [ ] `POST /api/notes` with `{ title: "Test note", body: "Hello" }` returns `200` and `{ id: "note_..." }`.
- [ ] Reading `GET /api/notes/{id}` immediately afterward returns the same note with `state = "DRAFT"` and `published_at = null`.

### 2. Duplicate Create

- [ ] Re-sending the same `POST /api/notes` body within 5 seconds returns `409` with `error.code = "DUPLICATE_NOTE"`.
- [ ] The error includes `error.details.existing_note_id` equal to the first note's id.
- [ ] `GET /api/notes` confirms exactly one note with that title/body — no second row was created.

### 3. List

- [ ] `GET /api/notes` returns only the test user's notes (verified by creating a second test user and confirming user A's notes are not visible to user B).
- [ ] Notes are returned newest first by `created_at`.
- [ ] Soft-deleted notes do not appear in the list.

### 4. Update

- [ ] `PATCH /api/notes/{id}` with `{ title: "New title" }` updates only the title.
- [ ] An unknown field in the body (`{ owner: "someone-else" }`) returns `400`.
- [ ] `PATCH /api/notes/{some-other-user-note-id}` from user B returns `404` (not `403`).

### 5. Delete

- [ ] `DELETE /api/notes/{id}` returns `200`. The row's `deleted_at` is now non-null in the database.
- [ ] `GET /api/notes/{id}` returns `404`.
- [ ] `GET /api/notes` no longer includes the note.

### 6. Scope Isolation

- [ ] A note created by user A is not readable by user B via `GET /api/notes/{id}`.
- [ ] Cross-user reads return `404`, not `403`.
- [ ] Cross-user `PATCH` and `DELETE` also return `404`.

## Lifecycle Acceptance

### A. DRAFT → PUBLISHED

- [ ] `PATCH /api/notes/{id}` with `{ state: "PUBLISHED" }` returns `200`.
- [ ] `published_at` is now non-null and equal to the transition time.
- [ ] `GET /n/{note_id}` (unauthenticated) returns `200` and renders the note title and body.

### B. PUBLISHED → ARCHIVED

- [ ] `PATCH /api/notes/{id}` with `{ state: "ARCHIVED" }` returns `200`.
- [ ] `GET /n/{note_id}` (unauthenticated) returns `404`.
- [ ] The note still appears in the dashboard's "Archive" view.

### C. ARCHIVED → PUBLISHED

- [ ] `PATCH /api/notes/{id}` with `{ state: "PUBLISHED" }` returns `200`.
- [ ] `published_at` is unchanged (still the first-publish timestamp).
- [ ] `GET /n/{note_id}` returns `200` again.

### D. DRAFT → ARCHIVED (not allowed)

- [ ] `PATCH /api/notes/{id}` with `{ state: "ARCHIVED" }` while the note is `DRAFT` returns `400` with `error.code = "INVALID_TRANSITION"`.

### E. Soft delete from any state

- [ ] `DELETE /api/notes/{id}` while the note is `DRAFT` returns `200` and hides the note.
- [ ] Same while `PUBLISHED` — `GET /n/{note_id}` immediately returns `404`.
- [ ] Same while `ARCHIVED`.

## Public Read Acceptance

### 1. Happy path

- [ ] `GET /n/{published-note-id}` returns `200` with the note rendered.
- [ ] The page is renderable in an incognito browser (no session cookie).
- [ ] The response does not include `user_id`, `deleted_at`, or any internal column (verify by viewing page source).

### 2. Not-yet-published

- [ ] `GET /n/{draft-note-id}` returns `404` (branded 404 page).

### 3. Archived

- [ ] `GET /n/{archived-note-id}` returns `404`.

### 4. Soft-deleted

- [ ] `GET /n/{soft-deleted-note-id}` returns `404`.

### 5. Malformed ID

- [ ] `GET /n/note_invalid` returns `404` (no error detail leaked).

### 6. Cache discipline

- [ ] Publish a note. Hit the public URL (200). Archive it. Hit the public URL again — `404` on the next request (no stale `PUBLISHED` served).

## Auth Flow Acceptance

### 1. Magic-link sign-in

- [ ] Submit a valid email on `/login`. Magic-link email arrives within 60 seconds.
- [ ] Clicking the link lands on `/` with the user signed in.
- [ ] The dashboard renders the signed-in user's notes.

### 2. Re-requesting invalidates

- [ ] Submit the email twice in a row. The first link is invalid; the second link works.

### 3. Sign-out

- [ ] Click "Sign out" in the user dropdown.
- [ ] Land on `/login`.
- [ ] Visiting `/` redirects back to `/login`.

### 4. Unauthenticated protected route

- [ ] In an incognito window, visit `/` — redirects to `/login`.
- [ ] In an incognito window, visit `/notes/{any-id}` — redirects to `/login`.

## Phase-Specific Checks

### Phase 3 (publish toggle + public read)

- [ ] The "Publish" toggle in the edit UI flips between `DRAFT` and `PUBLISHED` and the dashboard badge updates without a manual refresh.
- [ ] The "Public link" displayed in the dashboard for `PUBLISHED` notes is exactly `https://acme-notes.vercel.app/n/{note_id}` (production) or `http://localhost:3000/n/{note_id}` (local).
- [ ] Copying that link and opening it in an incognito window renders the public note.
- [ ] `SECURITY.md`'s "Public Read Path: the only unauth surface" section accurately describes what was shipped.

## Exit Criteria

A release is shippable when every item below is true:

- [ ] All Core API checks pass locally.
- [ ] All Lifecycle Acceptance checks pass locally.
- [ ] All Public Read checks pass locally.
- [ ] All Auth Flow checks pass against production.
- [ ] Phase-specific checks for the current phase pass.
- [ ] `OPERATIONS.md` env var table includes any new variable introduced this release.
- [ ] `SECURITY.md` "Known Gaps" reflects any new gap introduced (or removed gap closed).
- [ ] `PLANS.md` "Execution Snapshot" is updated to mark the phase as completed.
- [ ] No `console.log`, no `eslint-disable` without a reason, no commented-out blocks left in the diff.
