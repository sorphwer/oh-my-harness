# UAT Checklist

The minimum acceptance pass before a release. Update the per-phase sections to match the work currently being validated. Keep generic acceptance items in the "Exit Criteria" section so they survive across phases.

## Current Context

Replace this block on every release branch:

- Phases implemented through phase N
- Currently validating phase N+1
- Active proposals (if any) checks are included below

Use this document in two ways:

- **Local validation** — without a live deployment, run the management + core API checks and treat externally-dependent cases as readiness checks.
- **Production validation** — against the live deployment, run the full checklist including any externally-dependent cases.

## Preconditions

- Necessary migrations are applied (locally or in production)
- The app starts with a valid `.env.local` (or production env vars in Vercel)
- A test user exists with the necessary permissions for the scenarios below
- Any required external integrations (OAuth provider, webhook receiver, etc.) are reachable

## Core API Acceptance

Replace these with your project's primary scenarios. Use the checkbox form so the validator can tick them off in PRs / release notes.

### 1. Create

- [ ] `POST /api/<resource>` with a valid body returns `200` and the new resource id
- [ ] Reading that id immediately afterward returns the expected initial state

### 2. Duplicate Create

- [ ] Re-sending the same body within the duplicate window returns `409`
- [ ] The error includes the original resource id
- [ ] No second resource is created

### 3. List

- [ ] `GET /api/<resource>` returns the calling user's resources only
- [ ] Pagination tokens work for more than one page
- [ ] Filters (if any) restrict results as documented

### 4. Update

- [ ] `PATCH /api/<resource>/{id}` updates only the documented fields
- [ ] Unknown fields are rejected with `400`
- [ ] Cross-user updates return `404` (not `403`, so existence is not leaked)

### 5. Delete

- [ ] `DELETE /api/<resource>/{id}` returns `200` and the resource is no longer readable
- [ ] Subsequent reads return `404`

### 6. Scope Isolation

- [ ] A resource created by user A is not readable by user B
- [ ] A resource created in tenant A is not readable from tenant B (if multi-tenant)
- [ ] Cross-scope read attempts return `404`

## Lifecycle Acceptance

If your product has lifecycle states, add a check per state.

### A. Successful transition

- [ ] Trigger the primary action
- [ ] Resource moves to the expected state
- [ ] Side effects (notifications, downstream calls) happened exactly once

### B. Failure transition

- [ ] Force the downstream / side effect to fail
- [ ] Resource moves to the documented failure state
- [ ] Error metadata is persisted

### C. Timeout

- [ ] Create a resource with a short timeout
- [ ] Wait past the deadline without acting on it
- [ ] Read the resource and confirm it transitioned to `TIMED_OUT`

## Phase-Specific Checks

For each active phase, add a numbered section with checks specific to that phase's scope. Delete the section when the phase is completed and any phase-specific behavior is now covered by the general acceptance above.

### Phase N

- [ ] (phase-specific behavior)

## Exit Criteria

The release is shippable when every item below is true:

- [ ] Core API acceptance passes locally
- [ ] Lifecycle acceptance passes locally
- [ ] All public states behave as documented
- [ ] Duplicate handling returns the documented `409` shape
- [ ] Terminal failure states are reachable through the agent / API surface
- [ ] Primary read endpoint is trusted as the source of truth
- [ ] Production environment variables are configured for any new keys introduced in this release
- [ ] Operations runbook is updated for any new scenario this release introduces
