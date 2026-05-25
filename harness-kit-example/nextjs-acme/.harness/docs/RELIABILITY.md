# Acme Notes — Reliability Design

How Acme Notes handles failure. The goal: callers can predict our behavior without reading our source.

## Error Handling Strategy

- A single `ApiError` shape across all `/api/notes/*` routes:

  ```json
  {
    "error": {
      "code": "DUPLICATE_NOTE",
      "message": "Same title and body posted within 5 seconds.",
      "details": { "existing_note_id": "note_01h8z9..." }
    }
  }
  ```

- Distinguish validation, duplicate, auth, not-found, and database failures by `code`.
- Server-rendered pages (`/`, `/n/{note_id}`, `/notes/{note_id}`) render a friendly error page on failure, not the raw error object.

Response classes:

- `400 BAD_REQUEST` — zod validation failed on the request body.
- `401 UNAUTHORIZED` — no session cookie or expired session.
- `404 NOT_FOUND` — note does not exist, is not owned by the caller, or (on public read) is not `PUBLISHED`.
- `409 DUPLICATE_NOTE` — duplicate-create rule triggered.
- `500 INTERNAL_ERROR` — unexpected failure; logged with full detail server-side.

There is intentionally no `403` in V1. Cross-user reads return `404` so existence is not leaked.

## Side-Effect Failure Semantics

Acme Notes has no side effects in V1. There are no webhooks, no notifications, no downstream API calls. A successful database write is the entire story. This eliminates an entire class of "wrote the row but the notification failed" reconciliation work.

When this changes (e.g. proposal P1 adds markdown rendering with a sanitizer that calls an external service), this section must be rewritten with the explicit failure semantics for that side effect.

## Downstream Execution Failure

Not applicable in V1. See above.

## Atomic State Transitions

Every state change uses the same pattern:

```sql
UPDATE notes
SET state = $1,
    updated_at = NOW(),
    published_at = CASE WHEN $1 = 'PUBLISHED' THEN COALESCE(published_at, NOW()) ELSE published_at END
WHERE id = $2
  AND user_id = $3
  AND deleted_at IS NULL
RETURNING *
```

If zero rows are returned, the note either doesn't exist, isn't owned by the caller, or is soft-deleted. Respond `404`. Do not branch on the reason; the public contract is "the note is not actionable by you right now."

Concurrent transitions race naturally: whichever `UPDATE` commits first wins; the second sees the new state (or zero rows if the second is now a no-op transition). No advisory locks, no SELECT-FOR-UPDATE.

## Duplicate Request Rule

A `POST /api/notes` is treated as a duplicate of a previous `POST /api/notes` by the same user when:

- the `Authorization` (session cookie) resolves to the same `user_id`
- the request body `title` and `body` are identical (whitespace preserved, no normalization)
- the timestamp of the previous matching note is within 5 seconds

Behavior on match:

- No second `notes` row is created.
- Response is `409 DUPLICATE_NOTE`.
- `error.details.existing_note_id` is the id of the existing row.

Why 5 seconds: covers the "user double-clicked the create button" case without conflating two genuinely separate creates of an identical note.

## Lazy Timeout

Acme Notes has no time-bounded states in V1. `DRAFT` doesn't expire; `PUBLISHED` doesn't have a TTL; `ARCHIVED` doesn't auto-delete. The soft-delete row is preserved indefinitely (operator decision: we may add a 90-day hard-delete later, but not in V1).

If future scheduled features (e.g. proposal `SCHEDULED` state with a `publish_at`) need timeout semantics, they go here.

## Edit-After-Commit Failures

Not applicable in V1. There is no external surface that mirrors the note row.

## Public Read Cache Discipline

The public read path `GET /n/{note_id}` explicitly opts out of Next.js caching:

```ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

Why: a note that the owner just archived must 404 on the next public request. We cannot risk serving a `PUBLISHED` page from cache after the row moved to `ARCHIVED`. The cost of skipping the cache is acceptable for V1 traffic volumes.

If traffic grows enough that cold reads become costly, the right path is short-TTL cache with revalidation on archive/delete, not removing the freshness check from the query itself.

## Monitoring Recommendations

V1 monitoring is minimal. Page someone if:

- error rate on `/n/{note_id}` exceeds 1% over 5 minutes (signal: published reads breaking)
- `409 DUPLICATE_NOTE` rate spikes 10× the baseline (signal: client-side bug double-submitting)
- database connection acquisition latency p95 exceeds 500 ms (signal: Neon saturation)

No alerts on `404` rates — those are normal user behavior.
