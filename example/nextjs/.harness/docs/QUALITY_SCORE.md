# Quality Standards and Scoring Criteria

This document defines the project quality bar. Each section is a checklist the team and the agent use before claiming a feature is "done."

## Code Quality

- TypeScript strict mode
- ESLint clean (no `eslint-disable` without a referenced reason)
- consistent naming across docs and code (one term per concept; the agent should grep before introducing a new name)
- no implicit `any` in shared modules
- server-only modules never imported from `"use client"` files

## Security

- secrets only in server-only environment variables (unprefixed); client-exposed values must use `NEXT_PUBLIC_`
- session checks centralized in middleware, not duplicated per route
- input validation at every route boundary
- sensitive at-rest values encrypted (third-party tokens, downstream credentials)
- error responses never leak internal stack traces

Extend with project-specific security rules (hashing, key rotation, signature verification, etc.).

## Reliability

- atomic updates on lifecycle transitions (a state must change exactly once)
- duplicate requests are detected and surfaced as `409` with a reference to the existing resource
- terminal failure states are clearly distinguished from retryable ones in the public contract
- timeouts are evaluated lazily on read, not via cron, unless a real-time deadline is required
- background side effects are idempotent

## User Experience

- compact top bar header (56–64 px), no oversized hero sections
- active navigation state on the current page
- clear status badges for actual lifecycle states only (not for section headings)
- user-facing copy is task-oriented and free of internal vocabulary
- destructive actions confirm before executing
- back navigation on sub-pages
- loading skeletons for async content
- error boundaries with retry actions
- branded 404 page
- form sections use proper typography hierarchy (`h3` headings, not pills)
- inline validation feedback on forms

### Status Tag Mapping

When the product has lifecycle states, document the tag mapping in one place so design and engineering reference the same source.

| State | Tone | Icon (Phosphor / lucide) |
|-------|------|--------------------------|
| `DRAFT` | muted | `PencilSimple` |
| `ACTIVE` | success | `CheckCircle` |
| `ARCHIVED` | muted | `Archive` |
| `FAILED` | danger | `XCircle` |

Replace with your project's actual states.

### Visual Standards

- pick one font stack and commit (system stack by default)
- standardized border-radius across cards, inputs, and pills
- one accent color for primary actions; one tone for destructive actions
- no wrapper cards with developer-facing titles on data pages

## Documentation

- API docs, product docs, and plans all reference the same public endpoints (no stale examples)
- lifecycle docs use the documented casing consistently (uppercase enum, snake_case, etc.)
- onboarding examples match the live public contract — if the contract changes, examples update in the same commit

## Testing Strategy

State the testing approach honestly. If V1 relies on manual end-to-end verification, say so and list the canonical scenarios. As automated coverage grows, replace the manual list with the test commands.

Canonical manual scenarios for the primary resource (replace with your own):

- create
- read one
- list
- update
- delete
- duplicate-create handling
- failure path

## Quality Checklist

| Area | Required checks |
|------|-----------------|
| API | every documented route matches the live contract |
| States | every documented state behaves as described |
| Errors | structured error responses include the reference fields callers depend on |
| UI | navigation, badges, header, loading and error states match the spec |
| Docs | no stale examples remain in current docs |
