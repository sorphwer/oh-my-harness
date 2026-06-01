---
name: fix-security-finding
description: Use when fixing a validated or plausible security finding in code, configuration, tests, or generated output.
stage: [implement, verify]
---

# Fix Security Finding

## Workflow

1. Restate the finding as source, sink, missing control, and impact.
2. Reproduce or demonstrate reachability when practical.
3. Make the smallest fix at the correct boundary, preferably where the trust decision already belongs.
4. Add or update tests that fail without the fix and cover the attack path.
5. Re-run targeted tests and any broader checks touched by the changed boundary.

## Fix Placement

Prefer central controls over scattered call-site checks:

- auth middleware before individual handlers
- schema validation before business logic
- scoped query builders before ad hoc filters
- atomic database updates before client-side state checks
- provider signature verification before webhook processing

## Avoid

- Do not hide the issue behind UI-only checks.
- Do not weaken validation to make existing tests pass.
- Do not broaden permissions as a shortcut.
