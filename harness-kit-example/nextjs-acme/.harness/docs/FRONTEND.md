# Acme Notes — Frontend Conventions

This document captures frontend conventions for Acme Notes. Consistency over novelty.

## Technology

- Next.js 16 App Router (TypeScript, strict mode)
- Tailwind CSS with CSS variables for theme tokens (light theme default)
- Auth.js (NextAuth v5) via session cookies, email magic-link provider
- System font stack (`ui-sans-serif, system-ui, ...`)
- No client-side data-refresh library in V1 — every page is server-rendered, mutations go through server actions

## Page Structure

```text
src/app/
├── layout.tsx                  # root layout, theme + metadata
├── globals.css                 # theme tokens, base styles
├── not-found.tsx               # branded 404, used by both authenticated and public paths
├── login/
│   ├── page.tsx                # centered card, magic-link form
│   └── actions.ts              # signIn / signOut server actions
├── (app)/
│   ├── layout.tsx              # authenticated shell (top bar + container)
│   ├── loading.tsx             # dashboard skeleton
│   ├── error.tsx               # error boundary for the authenticated tree
│   ├── page.tsx                # dashboard: list of the user's non-archived notes
│   └── notes/
│       ├── new/page.tsx        # create-and-edit (creates a DRAFT on first save)
│       ├── [note_id]/page.tsx  # edit one note
│       ├── archive/page.tsx    # archived notes view
│       └── actions.ts          # create / update / publish / archive / delete server actions
└── n/
    └── [note_id]/page.tsx      # public read; no authentication required
```

Route group `(app)` carries the authenticated layout. The `n/` segment is intentionally outside it so the public read path does not pay the cost of the authenticated shell.

## Pages

### Dashboard (`/`)

- Purpose: show the user's `DRAFT` and `PUBLISHED` notes, newest first.
- Layout: top bar with "New note" CTA on the right; below, a vertical list of note rows (title, state badge, updated date, public link if `PUBLISHED`).
- Empty state: a single card with "Create your first note" CTA.
- Refresh: server-rendered on every navigation. No polling, no client refresh.

### Login (`/login`)

- Centered single-card layout.
- Card contains: product name, one-line tagline, email input, "Send magic link" submit button.
- After successful submit: a confirmation message ("Check your inbox") replaces the form.
- Post-auth redirect target: `/`.

### Note edit (`/notes/new` and `/notes/[note_id]`)

- Single-column form: title input (large, autofocused on `/new`), then body textarea, then a row with the "Publish" toggle and "Save" button.
- Save behavior: server action; on first save from `/new`, server-side redirect to `/notes/{note_id}`.
- Publish toggle: a single checkbox; flipping it triggers an immediate state change (no separate "save" required).
- Delete: in an overflow menu (`...`), styled destructive. Confirms before executing.

### Archive (`/notes/archive`)

- Same row layout as the dashboard, but lists only `ARCHIVED` notes.
- Each row has an "Unarchive" button (moves back to `PUBLISHED`).

### Public read (`/n/[note_id]`)

- No authenticated shell: just title, body, and a "Published on <date>" footer.
- Renders only if the note is `PUBLISHED` and not soft-deleted. Otherwise 404.
- Does not include "edit" affordances even if the viewer happens to be the owner.

## Component Architecture

```text
src/components/
├── ui/                         # primitives: button, input, textarea, badge, menu
├── notes/                      # note-row, publish-toggle, delete-confirm
└── layout/                     # top-bar, container
```

Primitives stay unopinionated. Note-specific composition lives under `components/notes/`.

## Auth Flow

```text
Request -> middleware -> validate Auth.js session
  -> unauthenticated and route is in (app) or /notes -> redirect to /login
  -> unauthenticated and route is / or /n/{id} -> allow (public routes)
  -> authenticated -> resolve user, render
```

Middleware is the only place session validation happens. Pages and server actions assume the session is valid.

## Data Flow

- Server components fetch notes from Postgres directly via the Drizzle client.
- Mutations go through server actions in `notes/actions.ts`, not client-side fetch.
- After every mutation, the server action calls `revalidatePath()` for the affected route.
- No SWR / React Query in V1. If a refresh-on-focus feature is added later, it goes in a small client island, not the main page tree.

## Visual Direction

### Layout

- Compact top bar (60 px), product name on the left, "New note" + user dropdown on the right.
- Max-width container: 768 px on the edit page (writer focus), 960 px on the dashboard.
- No wrapper cards around the dashboard list — direct rows.
- Back navigation on `/notes/{id}` and `/notes/archive` (link to `/`).

### Theme

- Light theme is default. Dark theme is a future enhancement, not in V1.
- One accent color (`sky-600` from Tailwind) for primary CTAs and the active nav state.
- Semantic colors for status badges only (see `QUALITY_SCORE.md` for the mapping).

### Surfaces

- Flat by default — no `backdrop-blur`, no `box-shadow`.
- 1 px borders using `slate-200`.
- Border-radius: `rounded-md` for inputs/buttons, `rounded-lg` for note rows.

### Typography

- Body: 14 px.
- Labels: 12 px.
- Note title input on the edit page: 24 px, `font-semibold`.
- All headings: `font-semibold tracking-tight`, sentence case.

### Icons

- Phosphor icons throughout. Sizes: 14 px inline, 16 px standard, 20 px section heading, 24 px empty state.

### Status Tags

`DRAFT` / `PUBLISHED` / `ARCHIVED` tone + icon mapping lives in `QUALITY_SCORE.md`. Do not re-define here.

### Interactions

- Hover: `bg-slate-50` on interactive rows.
- Focus: visible ring (`ring-2 ring-sky-500 ring-offset-2`).
- Transitions: 150 ms for hover/focus.
- Loading: flat skeleton blocks; no shimmer animation.
- Empty states: Phosphor icon (24 px) + sentence + primary CTA.

### Motion

Only entrance animations on the dashboard list (fade-in over 200 ms). Disabled under `@media (prefers-reduced-motion: reduce)`.

### Content Language

- Active voice. "Publish", "Archive", "Delete forever" — not "Mark as published."
- Sentence case for headings.
- No internal terms in the UI ("V1", "Phase 3", "ULID", "Drizzle" — none of these appear).

## V1 Boundaries

Out of scope for V1 (do not silently expand):

- No real-time collaborative editing.
- No comments or reactions.
- No revision history visible to users.
- No custom domains for public links.
- No mobile app.
- No markdown rendering (plain text only). See proposal P1 in `PLANS.md`.
- No dark theme.
- No client-side data-refresh library.
