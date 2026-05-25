# Development Guide

> Authoritative guide for AI coding agents (Claude Code, Codex, Cursor) and human contributors working on this project. Update this file whenever the project's contract or process changes.

## Project Overview

Replace this paragraph with a one- or two-sentence description of what the project does and who uses it. Be concrete. The agent uses this as the anchor for every other decision in the codebase.

## Canonical Product Contract

The contract section captures the *invariants* of the product — names, ID formats, public field shapes, lifecycle semantics, error rules. Fill it in once and treat it as the source of truth that other docs cite.

- Replace these bullets with your real contract. Examples of the kinds of facts that belong here:
- Tenancy model (single-user, single-tenant, multi-tenant)
- Auth model (session-based, API-key-per-resource, OAuth)
- Public ID format(s) (e.g. `usr_xxx`, `note_xxx`)
- Public lifecycle field name and value casing
- Primary API routes and their auth
- Idempotency / duplicate-handling rules
- Error semantics that callers depend on

## Tech Stack

- Next.js App Router (TypeScript)
- Tailwind CSS
- Postgres (via your chosen client — `@vercel/postgres`, `drizzle`, `prisma`, etc.)
- Auth.js (NextAuth v5) or another session/SSR auth library
- Vercel for deployment
- Add project-specific libraries here (validation, ORM, queue, etc.)

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

- Any code modification requires an active phase plan in `docs/exec-plans/phases/active/` first
- Proposal plans are experimental branches only; they do not authorize code changes until promoted into an active phase plan
- The agent must ask the user for confirmation on every non-trivial design or implementation decision before proceeding
- The agent must not self-determine visual design choices, copy text, component structure, or dependency additions without explicit user approval
- Update documentation before writing code; update the phase plan to reflect decisions as they are made

## Security Requirements

Fill in with project-specific rules. Common defaults for a Next.js + Postgres + Auth.js app:

- Secrets never leave server components / route handlers; never imported from `"use client"` files
- Auth-session checks live in middleware or a server helper, not duplicated in every page
- Server-only environment variables are unprefixed; client-exposed ones must use `NEXT_PUBLIC_`
- Sensitive at-rest values (API tokens, third-party secrets) are encrypted in the database
- All mutations validate input at the route boundary

## Database Model

List the core tables and link to a generated schema file when you have one.

- `users`
- `sessions`
- (add project tables here)

Link: `docs/generated/db-schema.md` (generate via your tool of choice).

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
├── design-docs/                  # one file per significant design decision
├── exec-plans/
│   ├── overall/{current,superseded}/
│   ├── phases/{active,completed}/
│   └── proposals/{active,superseded}/
├── generated/                    # tool-output (db schema, OpenAPI, etc.)
├── product-specs/                # PRDs and product narratives
├── references/                   # LLM-readable third-party reference dumps
└── superpowers/
    ├── plans/                    # dated execution plans for new skills
    └── specs/                    # design specs paired with each plan
```

## Development Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
```

Add project-specific commands (db migrate, seed, test, etc.) as you wire them up.

## Claude Code Permissions

A permissions preset is shipped at `.claude/settings.example.json`. To activate it for this project, copy it to `.claude/settings.local.json` — the `.local.json` filename is what Claude Code reads, and it is also what most teams' global `.gitignore` excludes from version control.

```bash
cp .claude/settings.example.json .claude/settings.local.json
```

Edit the local copy to grant any project-specific permissions your work requires.
