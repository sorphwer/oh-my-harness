# Google AIP Checklist

Use this file when designing or reviewing an API surface. It summarizes the AIPs that matter most for backend API work and gives a practical review checklist.

## AIP Map

| Topic | AIP | Use it for |
| --- | --- | --- |
| Resource-oriented design | 121 | Modeling APIs around resources instead of verbs |
| Resource names | 122 | Canonical `name` and `parent` patterns |
| HTTP and gRPC transcoding | 127 | Mapping RPC semantics onto HTTP paths, verbs, and bodies |
| Get | 131 | Single-resource read methods |
| List | 132 | Collection reads, pagination, filtering, ordering |
| Create | 133 | Parent-scoped create methods and caller-specified IDs |
| Update | 134 | PATCH plus `update_mask` partial updates |
| Delete | 135 | Delete semantics and delete requests |
| Custom methods | 136 | Non-CRUD actions with `:verb` suffixes |
| Partial responses | 157 | Read-time field selection when needed |
| Pagination | 158 | `page_size`, `page_token`, `next_page_token` |
| Filtering | 160 | Standard `filter` parameter on list methods |
| Field masks | 161 | Update masks and mask path behavior |
| Field behavior docs | 203 | `REQUIRED`, `OUTPUT_ONLY`, `IMMUTABLE`, `IDENTIFIER` |
| Resource freshness validation | 154 | `etag` for optimistic concurrency |
| Request identification | 155 | `request_id` for retry-safe mutations |
| Errors | 193 | Canonical status model and structured errors |

## Design Checklist

### Resource model

- Start from the resource noun and lifecycle, not from controller actions.
- Define the canonical resource name before the handler or database schema.
- Keep collection names plural and resource messages singular.
- Make parent-child relationships obvious from the URI pattern.

### Standard methods

- Use `Get`, `List`, `Create`, `Update`, `Delete` whenever the operation fits.
- Keep request message names and response shapes predictable.
- Return the resource directly for `Get`, `Create`, and `Update`.
- Return `repeated <Resource>` plus `next_page_token` for `List`.

### Custom methods

- Reach for a custom method only when the action is not CRUD.
- Use `POST` with a `:verb` suffix.
- Keep the method anchored to a resource or collection, not an arbitrary RPC namespace.

### Fields

- Use `name` for a full resource name and `parent` for the owning collection.
- Use `page_size`, `page_token`, `next_page_token`, `filter`, `order_by`, `update_mask`, `etag`, and `request_id` with exactly those names.
- Add field behavior semantics wherever they affect callers.
- Keep IDs stable and opaque.

### HTTP and transport

- Make the path match the canonical resource name.
- Use `GET` for reads, `POST` for creates and custom actions, `PATCH` for partial updates, and `DELETE` for deletes.
- Keep the resource body separate from routing fields like `name` and `parent`.
- In REST-only stacks, translate the same semantics even if there is no protobuf wrapper message.

### Errors and compatibility

- Return validation, not-found, conflict, and permission failures as distinct canonical errors.
- Do not silently overload one status for multiple failure classes.
- Preserve field numbers, wire-visible names, and existing contracts unless the migration is deliberate.
- Document every intentional AIP deviation.

## REST-First Translation Notes

If the project is OpenAPI-first or route-first rather than protobuf-first, keep the AIP contract by meaning:

- `name` maps to a full resource path parameter set.
- `parent` maps to the collection owner path.
- `Create` still takes a parent-scoped collection path and a resource body.
- `Update` still uses `PATCH` and `updateMask`.
- Custom actions still use `:verb` suffixes.
- `nextPageToken` remains part of the list response even if your framework prefers a different naming style.

## Official Sources

- AIP home: `https://google.aip.dev/`
- 121: `https://google.aip.dev/121`
- 122: `https://google.aip.dev/122`
- 127: `https://google.aip.dev/127`
- 131: `https://google.aip.dev/131`
- 132: `https://google.aip.dev/132`
- 133: `https://google.aip.dev/133`
- 134: `https://google.aip.dev/134`
- 135: `https://google.aip.dev/135`
- 136: `https://google.aip.dev/136`
- 154: `https://google.aip.dev/154`
- 155: `https://google.aip.dev/155`
- 157: `https://google.aip.dev/157`
- 158: `https://google.aip.dev/158`
- 160: `https://google.aip.dev/160`
- 161: `https://google.aip.dev/161`
- 193: `https://google.aip.dev/193`
- 203: `https://google.aip.dev/203`
