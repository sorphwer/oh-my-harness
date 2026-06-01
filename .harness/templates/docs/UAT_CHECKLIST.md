# UAT Checklist

This document is the release acceptance checklist for the project. Keep it practical: every checked item should describe an action a validator can perform, the expected result, and the evidence that proves the result.

Use this scaffold as the starting point for a project-specific UAT pass. Rewrite generic sections into concrete product areas as soon as the product, release scope, users, and environments are known.

## How to Ask the User

Before filling this checklist in detail, gather enough product truth to make the checks executable. Ask short, concrete questions and convert the answers into checkbox items with observable outcomes.

Good UAT questions ask for facts:

- What release, phase, branch, pull request, or feature set is being validated?
- Which environments must pass before release?
- Which user roles or tenant scopes must be tested?
- Which workflows would make the release unacceptable if they failed?
- Which screens, routes, APIs, commands, jobs, or integrations prove each workflow?
- Which data records should exist before the test run starts?
- Which states can an object move through, and which transitions are forbidden?
- Which failures must be handled without data loss, leakage, duplicate work, or stale UI?
- Which external systems must be live, mocked, or treated as readiness checks?
- Which documents, runbooks, dashboards, or alerts must be updated before shipping?

Ask follow-up questions until the answers include names instead of categories. A useful final checklist names the actual resource, role, route, state, error shape, integration, and environment wherever those details matter.

When turning answers into checks:

- Write one checkbox per observable claim.
- Prefer exact inputs and exact expected outputs.
- Include both happy paths and important failure paths.
- Include isolation checks for users, tenants, permissions, and public surfaces.
- Include evidence checks such as response bodies, UI text, database state, logs, emails, webhooks, and dashboard updates.
- Keep long-lived release criteria in "Exit Criteria" and phase-specific checks in the section for the current release.

## Current Context

- [ ] The release or validation scope is stated in plain language.
- [ ] The environments to validate are named.
- [ ] The active plan, spec, issue, branch, or pull request is identified when one exists.
- [ ] The user roles and permission boundaries relevant to this release are listed.
- [ ] The main product risks for this release are named.

## Preconditions

- [ ] Required migrations, seed data, feature flags, and configuration are applied.
- [ ] Test accounts exist for every role or scope that needs validation.
- [ ] Required environment variables or secrets are configured in each validation environment.
- [ ] Required external systems are reachable, intentionally mocked, or explicitly marked as readiness checks.
- [ ] The starting data state is known well enough that validation results can be interpreted.
- [ ] The validator knows where to inspect logs, emails, webhooks, jobs, database rows, or analytics events when those are part of acceptance.

## Core Workflow Acceptance

Use this section for the product paths that must work for the release to matter. Each workflow should include setup, action, expected result, and evidence.

### 1. Create or Start

- [ ] The primary creation or start action succeeds for an authorized user.
- [ ] The created record, session, job, or artifact is immediately readable through the primary product surface.
- [ ] Initial fields, status, ownership, timestamps, and derived values match the product contract.
- [ ] Invalid input is rejected with a clear error and no partial state is left behind.

### 2. Read or View

- [ ] The primary read or view surface shows the correct data for the current user.
- [ ] Empty states, loading states, and not-found states behave as designed.
- [ ] Private or internal fields are not exposed through public or cross-scope surfaces.
- [ ] Freshly changed data appears without unacceptable stale state.

### 3. List, Search, or Filter

- [ ] Lists show only records the current user is allowed to see.
- [ ] Sorting, filtering, search, pagination, and counts match documented behavior.
- [ ] Empty results are understandable and do not look like an error.
- [ ] Large enough result sets remain usable for the expected release scale.

### 4. Update or Continue

- [ ] Allowed changes update only the documented fields.
- [ ] Forbidden fields, invalid states, and malformed input are rejected.
- [ ] Concurrent or repeated actions do not create duplicate work or contradictory state.
- [ ] The user-facing surface and the source of truth agree after the update.

### 5. Delete, Cancel, or Roll Back

- [ ] The primary removal, cancellation, archive, or rollback action succeeds.
- [ ] Removed or inactive records no longer appear in active surfaces.
- [ ] Recovery, audit history, or permanent deletion behavior matches the product contract.
- [ ] Repeating the action is safe and returns the documented result.

### 6. Scope Isolation

- [ ] A user cannot read another user's private data.
- [ ] A user cannot change another user's private data.
- [ ] Tenant, workspace, organization, or project boundaries are enforced.
- [ ] Cross-scope attempts fail without leaking whether the target exists.
- [ ] Public surfaces expose only the fields intentionally made public.

## Lifecycle Acceptance

Use this section when the product has states, approvals, publishing, fulfillment, billing, background jobs, or other lifecycle transitions.

### A. Successful Transition

- [ ] The main transition succeeds from the expected starting state.
- [ ] The object moves to the expected next state.
- [ ] Required side effects run exactly once.
- [ ] User-facing status, source-of-truth state, and audit evidence agree.

### B. Rejected Transition

- [ ] A transition that is not allowed is rejected.
- [ ] The object remains in the previous valid state.
- [ ] The error explains what the user can do next without exposing sensitive internals.
- [ ] No side effect runs for the rejected transition.

### C. Failure Transition

- [ ] A downstream failure moves the object to the documented failure state.
- [ ] Retry behavior is clear and safe.
- [ ] Error metadata is stored where operators can inspect it.
- [ ] The user sees a useful status instead of a silent stall.

### D. Timeout or Expiration

- [ ] An object past its deadline transitions or expires as designed.
- [ ] Expired objects cannot be used in ways the product forbids.
- [ ] Notifications, cleanup, or audit events run when required.
- [ ] The UI or API communicates the expired state clearly.

## Integration Acceptance

- [ ] Authentication or identity flows required for the release work end to end.
- [ ] Email, webhook, payment, storage, search, AI, or other external integrations behave as required for this release.
- [ ] Integration retries are safe and observable.
- [ ] Missing, delayed, duplicated, or malformed integration responses are handled without corrupting state.
- [ ] Local, staging, and production differences are documented when they affect validation.

## Security and Privacy Acceptance

- [ ] Authorization checks protect every newly touched read and write path.
- [ ] Sensitive data is not exposed in UI, API responses, logs, errors, exports, URLs, or analytics events.
- [ ] Public or unauthenticated surfaces have explicit field and state limits.
- [ ] Cross-user, cross-tenant, and unauthenticated attempts produce the documented result.
- [ ] Rate limits, abuse controls, or operational guardrails are covered when relevant to the release.

## Operations Acceptance

- [ ] New configuration keys are documented.
- [ ] New migrations, jobs, queues, schedules, or storage buckets are documented.
- [ ] Logs, metrics, traces, dashboards, or alerts exist for new operationally important paths.
- [ ] The runbook explains how to detect, mitigate, and recover from the main failure modes.
- [ ] Rollback or disablement steps are known before production validation starts.

## Phase-Specific Checks

Use this section for behavior that belongs to the current release and has not yet become part of the standing checklist.

- [ ] The current release's main user-visible behavior passes in the target environment.
- [ ] The current release's main failure case is exercised.
- [ ] Documentation changed by the release matches what shipped.
- [ ] Any intentionally deferred behavior is recorded in the plan, issue tracker, or known-gaps document.

## Exit Criteria

A release is shippable when every item below is true:

- [ ] All required core workflow checks pass.
- [ ] All required lifecycle checks pass.
- [ ] All required integration checks pass or are explicitly accepted as readiness checks.
- [ ] Scope isolation and public-surface checks pass.
- [ ] Security and privacy checks pass for the release scope.
- [ ] Operational documentation is current for new behavior.
- [ ] The source of truth, user-facing surfaces, and evidence artifacts agree.
- [ ] Known gaps are documented with owner, impact, and next action.
- [ ] No unresolved placeholder text, stale phase notes, or obsolete acceptance criteria remain in this document.
