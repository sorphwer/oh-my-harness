---
name: backend-change
description: Use when implementing or reviewing server-side application behavior, background jobs, service integrations, authorization, validation, or business logic.
---

# Backend Change

## Workflow

1. Read the product contract, route or job entrypoint, data model, and existing helper APIs.
2. Add or update tests around the externally visible behavior before changing shared logic.
3. Validate inputs at the boundary and keep business rules close to the domain layer.
4. Resolve identity and authorization before touching tenant-owned or user-owned data.
5. Keep side effects explicit: database writes, emails, webhooks, queue jobs, cache invalidation, and external API calls.
6. Verify with targeted tests and any relevant typecheck or lint command.

## Design Bias

Use local patterns. Prefer existing repositories, service wrappers, error helpers, and transaction utilities over new abstractions.

## Avoid

- Do not duplicate authorization checks in many unrelated handlers.
- Do not let client-supplied tenant or owner ids override server-resolved context.
- Do not swallow integration failures unless the product has an explicit retry or dead-letter path.
