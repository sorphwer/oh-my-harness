---
name: api-design
description: Use when designing, reviewing, or refactoring backend APIs, REST resources, RPC methods, OpenAPI specs, protobufs, or external integration contracts.
stage: [spec, implement]
---

# API Design

## Workflow

1. Identify the resource model before naming endpoints or methods.
2. Prefer standard create, get, list, update, and delete shapes when they fit.
3. Use custom actions only for domain verbs that cannot be modeled as state updates.
4. Define authorization, idempotency, pagination, filtering, sorting, errors, and partial update behavior.
5. Make response schemas explicit and stable. Avoid leaking internal database fields.
6. Add contract tests or schema checks where the repo supports them.

## Design Checks

- Resource names are consistent and durable.
- IDs are opaque unless the product contract says otherwise.
- List APIs have bounded pagination.
- Mutations define retry behavior and duplicate request handling.
- Error responses are predictable and do not expose secrets.

## Output

Document the chosen API shape, rejected alternatives that matter, and compatibility implications.
