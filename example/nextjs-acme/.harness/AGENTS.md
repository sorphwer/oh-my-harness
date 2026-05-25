# Acme Notes — Development Guide

> Authoritative guide for AI coding agents (Claude Code, Codex, Cursor) and human contributors working on Acme Notes. Update this file whenever the product contract or process changes.

## Project Overview

Acme Notes is a single-user Next.js notes app. Each signed-in user owns a private collection of notes. Notes have a small lifecycle (`DRAFT` → `PUBLISHED` → `ARCHIVED`) and can be shared by URL only after they reach `PUBLISHED`.

## Canonical Product Contract

- Single user per account; no multi-tenancy boundary above the user.
- Public note IDs use the format `note_{ulid}` (lowercase Crockford base32, 26 chars).
- Public lifecycle field is named `state`. Values are uppercase: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- API routes are session-authenticated via Auth.js cookies. There is no machine API in V1.
- Primary API routes:
  - `GET /api/notes` — list the calling user's notes
  - `POST /api/notes` — create a new note (defaults to `DRAFT`)
  - `GET /api/notes/{note_id}` — read one note (owner only)
  - `PATCH /api/notes/{note_id}` — update title / body / state
  - `DELETE /api/notes/{note_id}` — soft-delete (sets `deleted_at`)
- Public sharing route: `GET /n/{note_id}` returns the rendered note only if `state = 'PUBLISHED'` and `deleted_at IS NULL`.
- Duplicate-create rule: same user + same title + same body within 5 seconds returns `409` with the existing `note_id`.

## Tech Stack

- Next.js 16 App Router (TypeScript, strict mode)
- Tailwind CSS with CSS variables
- Postgres via Neon (Vercel Marketplace)
- Drizzle ORM
- Auth.js (NextAuth v5) with email magic-link provider
- `zod` for validation at route boundaries
- `ulid` for public ID generation
- Vercel Fluid Compute for deployment

## Planning Document Convention

Planning documents live under `docs/exec-plans/`:

- current overall plans: `docs/exec-plans/overall/current/overall-v{n}-{hash}.md`
- superseded overall plans: `docs/exec-plans/overall/superseded/overall-v{n}-{hash}.md`
- active phase plans: `docs/exec-plans/phases/active/phase-{nn}-{slug}-{hash}.md`
- active proposal plans: `docs/exec-plans/proposals/active/proposal-{nn}-{slug}-{hash}.md`
- superseded proposal plans: `docs/exec-plans/proposals/superseded/proposal-{nn}-{slug}-{hash}.md`
- completed phase plans: `docs/exec-plans/phases/completed/phase-{nn}-{slug}-{hash}.md`
- implementation files: `docs/exec-plans/phases/completed/impl-{nn}-{slug}-{same-hash}.md`

Entry point: `docs/PLANS.md`

## Change Process

- Any code modification requires an active phase plan in `docs/exec-plans/phases/active/` first.
- Proposals are experimental — they do not authorize code changes until promoted into a phase.
- The agent asks for confirmation on every non-trivial design or implementation decision before proceeding.
- The agent does not self-determine visual design choices, copy text, component structure, or new dependencies without explicit user approval.
- Update documentation before writing code; reflect decisions in the active phase plan as they are made.

## Security Requirements

- `AUTH_SECRET`, `DATABASE_URL`, and any provider keys are server-only env vars (no `NEXT_PUBLIC_` prefix).
- Session checks are centralized in `middleware.ts`; routes never re-implement session validation.
- All mutation routes validate input with `zod` schemas before touching the database.
- Note bodies are stored in plaintext (this is a notes app, not a vault). Document explicitly that we do not encrypt content at rest.
- `/n/{note_id}` is the only unauthenticated read path. It strictly checks `state = 'PUBLISHED' AND deleted_at IS NULL`.

## Database Model

Core tables:

- `users` — Auth.js user rows; one row per signed-in account.
- `sessions` — Auth.js session rows.
- `notes` — the primary product table.

See `docs/generated/db-schema.md` (regenerated from Drizzle introspection).

## Documentation Structure

```text
AGENTS.md
ARCHITECTURE.md
docs/
├── DESIGN.md
├── FRONTEND.md
├── OPERATIONS.md
├── PLANS.md
├── PRODUCT_SENSE.md
├── QUALITY_SCORE.md
├── RELIABILITY.md
├── SECURITY.md
├── UAT_CHECKLIST.md
├── design-docs/
│   ├── core-beliefs.md
│   └── share-link-model.md
├── exec-plans/
│   ├── overall/{current,superseded}/
│   ├── phases/{active,completed}/
│   └── proposals/{active,superseded}/
├── generated/
│   └── db-schema.md
├── product-specs/
│   └── mvp-prd.md
├── references/
│   ├── auth-js-llms.txt
│   └── drizzle-llms.txt
└── superpowers/
    ├── plans/
    └── specs/
```

## Development Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run db:migrate
npm run db:studio
```
