# Operations Runbook

This runbook covers the production operating model and common incident scenarios.

## Production Environment

- **Production URL**: `https://<your-app>.vercel.app/`
- **Platform**: Vercel (Next.js App Router on Fluid Compute)
- **Database**: Postgres (via your chosen Vercel Marketplace integration: Neon, Supabase, etc.)
- **Auth**: Auth.js (NextAuth v5) with session cookies

## Operating Model

State the one-liner facts a new on-call person needs to know on day one:

- who owns the tenancy boundary
- where the session of record lives
- which surface is the source of truth for user-visible outcomes
- what an "incident" looks like vs an expected error

## Daily Checks

1. The deployment is reachable.
2. The authenticated home page loads when logged in.
3. The database is reachable from a fresh request (cold start has not regressed).
4. Background jobs (if any) ran in the last 24 h.
5. Error rates and p95 latency are within their normal bands.

## Incident Priorities

| Priority | Scenario |
|----------|----------|
| P1 | Users cannot sign in, or signed-in users see a hard 500 on the primary page |
| P1 | Data loss or corruption suspected |
| P2 | A secondary feature fails but the core flow still works |
| P2 | Background processing is delayed but not lost |
| P3 | Visual regression, copy bug, non-blocking quality issue |

## Scenario Template

For each scenario, use this shape:

### Scenario: `<short title>`

Symptom: what the user / monitor sees.

Checks:

1. (most likely cause first)
2. ...

Actions:

1. (smallest, safest action first)
2. ...

Escalation: when to page someone, who to page, what context to include.

## Example Scenarios

### Scenario: Sign-in fails for everyone

Checks:

1. Auth.js callback URL matches deployment URL
2. `AUTH_SECRET` is set and not rotated unexpectedly
3. Database is reachable (sessions table reads)
4. OAuth provider (if any) status page is green

Actions:

1. Restore the correct callback URL if changed
2. Re-deploy if a recent push removed env vars
3. Fall back to email-magic-link if OAuth provider is degraded

### Scenario: Primary page returns 500

Checks:

1. Last deploy in Vercel: did it change data fetching?
2. Runtime logs for the failing route
3. Database connection saturation

Actions:

1. Roll back the deployment via Vercel if recent
2. Increase Postgres connection pool if saturated
3. Add a graceful empty state if the failure is a missing-row case

## Vercel Deployment Notes

### Environment Variables

Document every environment variable in one table with explicit scope (server-only vs client-exposed). Anything client-exposed must use the `NEXT_PUBLIC_` prefix.

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `DATABASE_URL` | Server | yes | Pooled connection string |
| `AUTH_SECRET` | Server | yes | Auth.js session secret |
| `AUTH_URL` | Server | yes | Canonical deployment URL |
| `NEXT_PUBLIC_APP_NAME` | All | no | Shown in the UI header |

### Redeployment

Push to the linked Git branch, or run `vercel deploy --prod` from the CLI. Prefer Git-driven deploys so the deployment URL is traceable to a commit.

### Cold Start Latency

For latency-sensitive paths (webhooks, OAuth callbacks), prefer Fluid Compute and keep the warm path small. Avoid heavy module imports in middleware.

### Post-Deployment Verification

After any production deploy:

1. Hit `/` while authenticated and confirm the dashboard renders.
2. Trigger one mutation (e.g. create a throwaway record) and confirm it appears.
3. Confirm no client bundle contains the first 8 characters of any server-only secret. Search the loaded JS in DevTools.

## Monitoring

List the named dashboards / alerts you rely on, with their owner. If you do not yet have monitoring set up, write "TODO: wire up monitoring" — do not silently skip this section.
