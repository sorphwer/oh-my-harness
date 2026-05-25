# Acme Notes — Filled-In Harness Demo

This folder is a **demonstration** of what `example/nextjs/.harness/` looks like once a real project fills in the templates. It is *not* meant to be copied wholesale.

The fictional product is **Acme Notes**: a single-user Next.js notes app. Each user owns their own notes; notes have a small lifecycle (`DRAFT` → `PUBLISHED` → `ARCHIVED`).

Only four files are filled in here, because those four are what reveal the *shape* of a project most quickly:

- `.harness/AGENTS.md` — the canonical product contract and stack
- `.harness/ARCHITECTURE.md` — the system shape
- `.harness/docs/PRODUCT_SENSE.md` — the product narrative
- `.harness/docs/PLANS.md` — the planning convention in use, with two example phases

For the remaining files (DESIGN, FRONTEND, OPERATIONS, QUALITY_SCORE, RELIABILITY, SECURITY, UAT_CHECKLIST, superpowers, references), see the skeleton at `../nextjs/.harness/`. They follow the same generic shape; an Acme version of each would just substitute the resource names.
