# Skills Pool

Reusable agent skills live here as source material for future harness generation.

Each skill uses this shape:

```text
skills-pool/<category>/<skill-name>/SKILL.md
```

Categories:

- `planning/` - intent capture, specs, implementation plans, and TDD-style execution.
- `debugging/` - systematic root-cause investigation before fixes.
- `frontend/` - frontend implementation, polish, and accessibility review.
- `backend/` - API design, backend changes, and data integrity work.
- `delivery/` - code review (giving, requesting, receiving), verification, and branch finishing.
- `security-review/` - threat modeling, security review, and fixing validated findings.

Keep each skill small, agent-neutral, and focused on reusable judgment. Project-specific rules belong in that project's `.harness/`, not in this pool.
