# backend

API design, backend code changes, and data-integrity discipline.

## Contributes

- `skills/api-design` — design endpoints and contracts before writing handlers.
- `skills/backend-change` — guardrails for editing existing server-side code (migrations, jobs, side-effects).
- `skills/data-integrity` — invariants, transactions, and idempotency for anything that writes to a store.

## When to include

Any project with a server, database, or job queue. Pair with `security-review` whenever the backend handles authentication or untrusted input.
