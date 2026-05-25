# Reliability Design

This document describes failure handling and reliability behavior. The goal is that callers can predict our behavior without reading our source.

## Error Handling Strategy

- use structured error payloads (a single `ApiError` shape across the codebase)
- distinguish validation, duplicate, auth, not-found, and dependency failures
- do not conflate downstream failure with success

Common response classes:

- `400` validation failure
- `401` missing or invalid auth
- `403` out-of-scope access
- `404` missing resource
- `409` duplicate request reused an existing resource
- `503` an upstream / downstream dependency failed after the local write
- `500` unexpected internal failure

## Notification / Side-Effect Failure Semantics

If your product writes a row and then fires a side effect (notification, webhook, downstream HTTP call), document the failure mode explicitly.

Example shape:

- the row is created
- the side effect fails
- the row enters a terminal failure state (e.g. `NOTIFICATION_FAILED`)
- the caller receives the local id *and* the failure signal so they can choose retry vs abandon

## Downstream Execution Failure

If a successful local transition triggers a downstream call that fails:

- final state moves to a distinct failure state (e.g. `EXECUTION_FAILED`)
- store the downstream status code and a short error message
- do not mark the request as successful

## Atomic State Transitions

State transitions must be atomic at the database. Example pattern with Postgres:

```sql
UPDATE <resource>
SET state = $1, updated_at = NOW()
WHERE id = $2 AND state = 'PENDING'
RETURNING *
```

If no row is returned, another transition already won. Treat this as a normal outcome, not an error.

## Duplicate Request Rule

If your API is invoked by automation, document an explicit duplicate-detection rule. Common shape:

- same auth credential
- same canonical request body
- within a small time window (e.g. 60 seconds)

Canonical request body rules (so the comparison is deterministic):

- recursively sort object keys before serialization
- preserve array order
- ignore insignificant whitespace
- preserve scalar values exactly (`null`, `false`, `0`, empty string)
- hash the stable JSON string with SHA-256

Behavior:

- no second resource is created
- response is `409`
- the existing resource reference is returned in error details

## Lazy Timeout

If your resource has a deadline, prefer evaluating timeout on read rather than via cron:

- on every `GET` of the resource, check whether it has expired
- if so, transition it before returning
- the same code path serves the next caller's read

This avoids running a separate timer worker and keeps the lifecycle logic in one place.

## Edit-After-Commit Failures

If you update a related external surface (Discord message, Slack post, email) after committing to the database:

- the database record remains the source of truth
- a failed update of the external surface does *not* roll back the database
- operators may see a stale external surface; the runbook should remind them to trust the database

## Monitoring Recommendations

List the signals that would page someone:

- side-effect send failures
- side-effect edit failures
- downstream execution failures
- age of in-flight requests in the primary lifecycle state
- unexpected spikes in `409` duplicate responses
