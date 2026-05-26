---
name: google-aip-api-design
description: Design, review, and refactor backend APIs to follow Google API Improvement Proposals (google.aip.dev). Use when creating or updating REST, gRPC, protobuf, or OpenAPI APIs; modeling resources and resource names; choosing standard CRUD versus custom methods; defining pagination, filtering, field masks, etags, request IDs, and error semantics; or checking whether an API contract conforms to Google AIP.
---

# Google AIP API Design

## Overview

Design APIs around Google AIP's resource-oriented model. Use this skill both for greenfield API contracts and for targeted refactors or reviews of existing routes, protobuf services, or OpenAPI documents.

## Quick Start

1. Inspect the source of truth: `.proto`, OpenAPI, framework routes, or handwritten handlers.
2. Model resources before endpoints. Define resource type, parent, canonical name pattern, and lifecycle first.
3. Prefer standard methods from AIP-131 to AIP-135 before inventing custom endpoints.
4. Normalize common fields and behaviors: `name`, `parent`, `page_size`, `page_token`, `next_page_token`, `filter`, `order_by`, `update_mask`, `etag`, `request_id`.
5. Keep HTTP/JSON mapping, error semantics, and field behavior consistent across the surface.
6. If backward compatibility prevents strict conformance, keep the wire contract stable and explicitly call out the AIP deviation.

## Route The Task

- New API or major redesign: load `references/aip-checklist.md` first, then `references/proto-patterns.md`.
- Existing protobuf service: preserve message and field numbers, then align names, methods, and annotations incrementally.
- Existing REST or OpenAPI API: keep AIP semantics even if the project does not use protobuf directly.
- Review request: report findings in this order: broken resource model, incorrect method shape, inconsistent field semantics, HTTP mapping issues, error or compatibility risks.

## Core Rules

### 1. Design Resources First

- Use nouns for resources and collections; reserve verbs for custom actions.
- Define canonical resource names before request and response messages.
- Prefer hierarchical resource names such as `publishers/{publisher}/books/{book}`.
- Keep identifiers opaque and stable; do not encode mutable business data into IDs.

### 2. Prefer Standard Methods

- `Get`: fetch one resource by `name`.
- `List`: fetch a collection under `parent`, with pagination and optional filtering or ordering.
- `Create`: create under `parent` with a resource body and optional caller-specified ID.
- `Update`: use partial update semantics with the resource plus `update_mask`.
- `Delete`: delete by `name`; do not overload delete for non-delete state transitions.

### 3. Use Custom Methods Sparingly

- Use a custom method only when a standard method does not fit the business action.
- Keep the target resource explicit and use `POST` with a `:verb` suffix, such as `POST /v1/{name=publishers/*/books/*}:approve`.
- Name request messages after the action, such as `ApproveBookRequest`.

### 4. Normalize Cross-Cutting Fields

- Use `name` for a resource's full canonical name and `parent` for the owning collection.
- Use `page_size`, `page_token`, and `next_page_token` together for pagination.
- Use `filter` and `order_by` only on list methods.
- Use `update_mask` on partial updates and keep mask paths relative to the resource body.
- Add `etag` for optimistic concurrency only when the resource needs conflict protection.
- Add `request_id` only when retry safety matters for mutating operations.

### 5. Keep Behavior and Errors Predictable

- Treat `REQUIRED`, `OUTPUT_ONLY`, `IMMUTABLE`, and `IDENTIFIER` as first-class design constraints even outside protobuf.
- Use canonical error semantics: validation errors are not missing-resource errors, and conflicts are not permission failures.
- Preserve backward compatibility. Add fields instead of reusing or renumbering them, and avoid breaking wire-visible names without a migration plan.

## Delivery Checklist

Before finishing:

1. Verify each operation is centered on a resource, not an RPC verb.
2. Verify every method shape matches a standard method or a justified custom method.
3. Verify field names and request shapes use AIP-standard names.
4. Verify HTTP paths and verbs mirror the resource model.
5. Verify pagination, filtering, partial update, and concurrency semantics are internally consistent.
6. Verify all intentional deviations are documented with the reason and compatibility tradeoff.

If the repo already has API linting, protobuf linting, or contract tests, run them after changes. If not, do the checklist manually and state any unverified risk.

## References

- Load `references/aip-checklist.md` for the AIP map, design checklist, and official URLs.
- Load `references/proto-patterns.md` for concrete protobuf and HTTP annotation patterns.
