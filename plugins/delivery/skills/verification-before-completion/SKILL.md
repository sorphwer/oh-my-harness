---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, passing, deployed, or ready for review.
stage: [verify]
---

# Verification Before Completion

## Rule

Evidence comes before completion claims. Run the most relevant verification available and inspect the output before saying the work is done.

## Workflow

1. Identify the smallest command or manual check that proves the changed behavior.
2. Run targeted tests first.
3. Run broader checks when shared code, build config, generated output, or user-facing flows changed.
4. For frontend changes, verify in a browser at the relevant viewport sizes.
5. If a command cannot run, state why and what risk remains.

## Output

Report the exact checks run and whether they passed. Do not imply unrun tests passed.

## Common Checks

- unit or integration test command
- typecheck
- lint
- build
- generated fixture diff
- browser smoke test
