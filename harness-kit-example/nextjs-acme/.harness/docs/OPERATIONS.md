# Acme Notes — Operations Runbook

Production operating model and common incident scenarios for Acme Notes.

## Production Environment

- **Production URL**: `https://acme-notes.vercel.app/` (placeholder until first deploy)
- **Platform**: Vercel (Next.js 16 App Router on Fluid Compute)
- **Database**: Postgres via Neon (Vercel Marketplace integration)
- **Auth**: Auth.js (NextAuth v5), email magic-link provider (Resend transport)
- **Email**: Resend

## Operating Model

- **Tenancy boundary**: the signed-in user. No organizations.
- **Session of record**: Auth.js `sessions` table in Postgres.
- **Source of truth for user-visible outcomes**: the `notes` row. The public read path (`/n/{note_id}`) renders directly from the database with no caching layer.
- **Incident vs expected error**: a `404` on a non-existent or unpublished note ID is expected. A `500` on the dashboard or on the public read path for a known-published note is an incident.

## Daily Checks

1. `https://acme-notes.vercel.app/login` loads.
2. A test account can sign in (magic link arrives, callback completes, dashboard renders).
3. The dashboard lists the test account's notes.
4. `https://acme-notes.vercel.app/n/{known-published-note-id}` returns 200 with the expected content.
5. Vercel deploy logs show no error spikes in the last 24 h.
6. Neon dashboard: connection pool usage below 50%, no slow query alerts.

## Incident Priorities

| Priority | Scenario |
|----------|----------|
| P1 | Users cannot sign in (magic link does not arrive, or callback returns 500) |
| P1 | Public read path returns 500 for a known-published note |
| P1 | Data loss or corruption suspected (e.g. `deleted_at` set without a delete request) |
| P2 | Dashboard returns 500 for some users but sign-in works |
| P2 | Magic-link emails are delayed but eventually arriving |
| P3 | Visual regression, copy bug, branded 404 styling issue |

## Scenarios

### Scenario: Sign-in fails for everyone

Symptom: users on the login page submit their email but never receive the magic link, or the link returns 500.

Checks:

1. Auth.js `AUTH_URL` matches the deployment URL (Vercel env var).
2. `AUTH_SECRET` is set and not rotated unexpectedly.
3. Resend API key (`RESEND_API_KEY`) is valid; Resend dashboard shows recent send attempts.
4. `sessions` table is readable (run a quick `SELECT count(*) FROM sessions` from the Neon console).

Actions:

1. Restore the correct `AUTH_URL` if changed.
2. Re-deploy if a recent push removed env vars.
3. If Resend is degraded, point `EMAIL_FROM` at a backup provider temporarily.
4. If sessions table is unreachable, see "Database connection failure" below.

Escalation: page the on-call after 10 minutes of confirmed total sign-in failure. Include: deployment URL, last successful sign-in timestamp, current Resend status.

### Scenario: Public read returns 500 for a known-published note

Symptom: `https://acme-notes.vercel.app/n/{note_id}` 500s for a note that the owner sees as `PUBLISHED` in their dashboard.

Checks:

1. Vercel runtime logs for `/n/{note_id}`.
2. Recent deploy changed the public read query.
3. Database connection saturation.

Actions:

1. Roll back the deploy via Vercel if the regression is recent.
2. Increase Neon connection pool if saturated.
3. If the failure is in zod parsing of the note row (e.g. unexpected null), file a hotfix that tolerates the unexpected shape and surfaces the error to ops without crashing the user.

### Scenario: Dashboard returns 500 for a signed-in user

Checks:

1. Same user can sign in (`/login` flow works).
2. Vercel runtime logs filtered by the user's email — what query failed?
3. Did the user's `notes` table have a malformed row recently?

Actions:

1. If isolated to one user, capture the row data, file a bug, and serve a friendly empty-state error page.
2. If broader, treat as P1 and follow the "Public read returns 500" runbook for the dashboard route.

### Scenario: Database connection failure

Symptom: any database-touching route 500s with "could not acquire connection."

Checks:

1. Neon status page.
2. Neon dashboard: connection count, pool saturation, recent autosuspend events.
3. Recent deploy changed `DATABASE_URL` or pool size.

Actions:

1. If Neon is degraded: post status, wait. Vercel Fluid Compute should retry transient failures.
2. If pool saturated: increase pool size in Neon and redeploy.
3. If autosuspend triggered cold start: the first request after suspend may 500; subsequent requests recover. Confirm in logs.

### Scenario: Magic-link emails are slow

Checks:

1. Resend dashboard latency.
2. User's email provider (Gmail, Outlook) — is there a delivery delay class-wide?

Actions:

1. Tell affected users to wait 5 minutes before re-requesting (re-requesting invalidates the previous link).
2. If Resend is the bottleneck, no immediate fix; document on the status page.

## Vercel Deployment Notes

### Environment Variables

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `DATABASE_URL` | Server | yes | Neon pooled connection string |
| `AUTH_SECRET` | Server | yes | Auth.js session signing secret |
| `AUTH_URL` | Server | yes | Canonical deployment URL (e.g. `https://acme-notes.vercel.app`) |
| `EMAIL_FROM` | Server | yes | `noreply@acme-notes.com` (the sender Resend uses) |
| `RESEND_API_KEY` | Server | yes | Resend API key |
| `NEXT_PUBLIC_APP_NAME` | All | no | "Acme Notes"; falls back to a hardcoded string |

No `NEXT_PUBLIC_DATABASE_URL` or similar — none of the server secrets are ever exposed client-side.

### Redeployment

Push to `main`. Vercel auto-deploys to production. Preview branches deploy to `https://acme-notes-git-{branch}-{team}.vercel.app/`. Use `vercel deploy --prod` only for ad-hoc rollbacks via the CLI.

### Cold Start Latency

Fluid Compute keeps warm instances; cold starts are rare. If observed, the most common cause is a fresh Neon autosuspend. The first request after autosuspend can take ~1.5s to acquire a connection; subsequent requests are <100ms.

### Post-Deployment Verification

After every production deploy:

1. Hit `/` signed-in; confirm the dashboard renders.
2. Create a throwaway note, publish it, hit `/n/{note_id}` while signed out, confirm public read works.
3. Soft-delete the throwaway note; confirm `/n/{note_id}` now 404s.
4. Search Vercel runtime logs for the deploy commit hash; confirm no error entries.

## Monitoring

- **Vercel Web Analytics**: deployment health, request rates, p95 latency. Owner: founder.
- **Neon dashboard**: connection pool, slow queries. Owner: founder.
- **Resend dashboard**: email send rate, bounce rate. Owner: founder.
- **TODO: wire up an external uptime monitor** (e.g. Better Uptime) for the public read path.
