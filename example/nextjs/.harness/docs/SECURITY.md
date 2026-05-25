# Security Overview

This document summarizes the project's security posture. For implementation-level details, link to `design-docs/security-model.md` once you have one.

## Security Principles

1. Encrypt sensitive secrets at rest.
2. Hash credentials (API keys, OAuth refresh tokens) instead of storing plaintext.
3. Verify every signed callback (webhooks, OAuth, payment providers) before any business logic runs.
4. Enforce tenant scope through the database (RLS or query-level enforcement), not just the application.
5. Prevent duplicate state transitions with atomic database updates.

## Authentication Layers

Document each authentication mechanism, its scope, and where the server resolves identity from.

### User authentication

- mechanism: Auth.js session cookies
- scope: per user
- storage: `sessions` table in Postgres
- session is verified in middleware before any page renders

### Service / agent authentication

- mechanism: `x-api-key` header (or similar) — only if your product exposes a machine API
- scope: exactly one resource per key (one workflow, one project, one tenant — pick one and stick to it)
- storage: SHA-256 hash in the resource record
- the server resolves resource + tenant from the key

### Third-party signature verification

- mechanism: Ed25519, HMAC, or provider-specific signature verification with a per-resource public key or shared secret
- request origin is verified before any business logic runs

## Secrets

### API keys

- shown once when issued
- stored only as SHA-256 hashes
- regenerated through an explicit management action that invalidates the previous key

### Downstream / third-party secrets

- encrypted at rest (AES-256-GCM with a key from `ENCRYPTION_KEY`)
- decrypted only at the moment of use
- never returned in API responses

### OAuth tokens

- encrypted at rest with the same key envelope as downstream secrets
- access tokens refreshed via a server-side flow
- refresh tokens never exposed to client bundles

## Tenant Isolation

If multi-tenant:

- `<tenant_entity>` defines the primary boundary (e.g. `organizations`, `workspaces`, `accounts`)
- a membership table maps users into tenants
- every owned resource table carries `<tenant_id>` and is filtered at the query level (or via RLS policies)
- service / agent access is constrained to its scoped resource through the resolved API key
- management routes resolve the active tenant from session context — never from a client-supplied parameter

If single-tenant, say so explicitly: "single user, no tenancy boundary."

## Race Protection

State transitions update only resources currently in the expected starting state:

```sql
UPDATE <resource>
SET state = $1, updated_at = NOW(), resolved_at = NOW(), resolved_by = $2
WHERE id = $3 AND state = 'PENDING'
```

This ensures only the first decision takes effect.

## Known Gaps

Be honest about what you have not yet covered. Examples to consider:

- no HMAC signing on internal callback IDs
- no rate limiting yet
- no dedicated audit trail beyond resource records
- no anomaly detection on auth attempts
- (extend per project)
