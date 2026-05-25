# Acme Notes — Security Overview

This document summarizes Acme Notes' security posture. For implementation-level detail, link to `design-docs/security-model.md` once one exists.

## Security Principles

1. Auth.js owns session lifecycle. The application never inspects raw session tokens.
2. Database is the source of truth for "is this note public?" — no application-layer cache may override the DB's `state` field.
3. The only unauthenticated route is `GET /n/{note_id}`. Every other route validates a session.
4. Single-user tenancy is enforced at the query level: every owner-scoped query carries `WHERE user_id = $session_user_id AND deleted_at IS NULL`.
5. There is no machine API in V1. No API keys, no service-to-service auth, no third-party callbacks.

## Authentication Layers

### User authentication

- **Mechanism**: Auth.js session cookies, email magic-link provider (Resend transport).
- **Scope**: per user. A session grants access to all notes owned by the user.
- **Storage**: `sessions` table in Postgres, managed by the Auth.js Drizzle adapter.
- **Verification point**: `middleware.ts` runs `auth()` on every non-public request and rejects (redirect to `/login`) if the session is missing or expired.
- **Session TTL**: 30 days, sliding renewal on every authenticated request.

### Service / agent authentication

Not present in V1. There is no `/api/admin`, no machine-to-machine endpoint, no API key. If a future use case (export-to-external-service) needs one, it goes here, scoped to a single resource per key.

### Third-party signature verification

Not present in V1. There are no inbound webhooks. Resend delivers outbound only; the magic-link callback uses Auth.js's standard token verification, not a custom signature scheme.

## Secrets

### Server-only environment variables

All managed via Vercel env var UI. Never imported from `"use client"` files.

- `DATABASE_URL` — Neon pooled connection string
- `AUTH_SECRET` — Auth.js session signing secret (rotation requires a manual coordinated logout: rotate, redeploy, accept that every active session is invalidated)
- `AUTH_URL` — canonical deployment URL; must match the production URL exactly or magic-link callbacks fail
- `EMAIL_FROM` — `noreply@acme-notes.com` (the sender Resend uses)
- `RESEND_API_KEY` — Resend API key

### Client-exposed environment variables

- `NEXT_PUBLIC_APP_NAME` — "Acme Notes" — used in the page title and the top bar; safe to expose.

### What is not a secret in V1

- The note body is plaintext in the database. Acme Notes is a public-share-by-design notes app, not a private vault. Documented explicitly so no one is surprised that we are not encrypting at rest.

## Tenant Isolation

Single user per account. There are no organizations, workspaces, or roles. Every `notes` row carries `user_id`; every owner-scoped query filters by the session-resolved `user_id`.

Cross-user reads return `404`, not `403`. This avoids leaking the existence of a note ID that belongs to another user.

Public reads (`GET /n/{note_id}`) intentionally bypass owner-scope: they only check `state = 'PUBLISHED' AND deleted_at IS NULL`. By design, the `note_id` itself is the share token. If a user does not want a note publicly readable, they keep it as `DRAFT` or move it to `ARCHIVED`.

## Race Protection

State transitions update only notes currently in a non-deleted state owned by the caller:

```sql
UPDATE notes
SET state = $1, updated_at = NOW()
WHERE id = $2 AND user_id = $3 AND deleted_at IS NULL
```

If a concurrent request soft-deleted the note between the read and the write, the `UPDATE` returns zero rows and the route responds `404`. No advisory locks needed.

## Public Read Path: the only unauth surface

`GET /n/{note_id}` is the entire unauthenticated attack surface. Its checks:

1. Parse `note_id` against the expected `note_{ulid}` shape. Reject malformed IDs with `404` (no error detail).
2. `SELECT id, state, title, body, created_at, updated_at, published_at FROM notes WHERE id = $1 AND state = 'PUBLISHED' AND deleted_at IS NULL`.
3. If zero rows: `404`.
4. If one row: render.

The query does not `SELECT *` — only the columns the public response needs. `user_id`, `deleted_at`, and any future internal columns cannot accidentally leak.

The page sets `dynamic = "force-dynamic"` and `revalidate = 0` to ensure no stale `PUBLISHED` is served after the note is archived or deleted.

## Known Gaps

V1 ships with these acknowledged gaps:

- No rate limiting on `/api/notes/*` or `/n/{note_id}`. Vercel's edge has basic DDoS protection; we have not added application-layer rate limits.
- No audit log beyond the row's `created_at` / `updated_at`. We cannot answer "who changed this note's state last and when" if `published_at` is overwritten.
- No 2FA. Email magic-link is the only auth factor.
- No CSP header beyond Next.js defaults. Inline scripts emitted by Next.js work because the default `unsafe-inline` is present.
- No automated security scanning in CI.
- No documented incident-response timeline. If the Neon database is compromised, we have not pre-decided how we notify users.

These are tracked as future work, not immediate blockers for the V1 launch.
