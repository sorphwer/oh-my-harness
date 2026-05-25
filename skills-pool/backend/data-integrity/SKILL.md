---
name: data-integrity
description: Use when changing database schemas, migrations, persistence rules, lifecycle transitions, uniqueness constraints, transactions, or concurrency-sensitive behavior.
---

# Data Integrity

## Workflow

1. Identify invariants: ownership, uniqueness, lifecycle states, balances, counters, ordering, and foreign-key relationships.
2. Enforce invariants in the database where practical, then mirror them in application validation for good errors.
3. Use transactions for multi-row or multi-table changes that must commit together.
4. Use atomic conditional updates for state transitions and race-prone counters.
5. Plan migration safety: defaults, backfills, nullable-to-non-nullable transitions, and rollback impact.
6. Test duplicate, concurrent, stale, and invalid state cases.

## Common Patterns

- Unique indexes for natural uniqueness.
- Foreign keys for ownership relationships.
- Check constraints or enums for lifecycle states.
- `WHERE state = <expected>` updates for one-way transitions.

## Avoid

Do not rely on UI disabling or client-side checks to protect data invariants.
