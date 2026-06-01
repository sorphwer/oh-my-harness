---
name: spec-first-planning
description: Use when non-trivial work needs a design spec, implementation plan, sequencing, acceptance criteria, or handoff document before code changes.
stage: [spec, plan]
---

# Spec First Planning

## Workflow

1. Read the project's agent guide for planning document locations and conventions.
2. Define the goal, non-goals, user-facing behavior, data model, risks, and acceptance criteria.
3. Break implementation into small, ordered tasks with exact files when known.
4. Include verification commands and expected outcomes.
5. Keep scope narrow. Defer adjacent features unless the user explicitly approves them.

## Plan Shape

Use this compact structure:

- Goal
- Scope and non-goals
- Design decisions
- Implementation tasks
- Tests and verification
- Rollback or migration notes, if relevant

## Local Rules

Project instructions override generic defaults. If the repo says plans live under a specific path, use that path.
