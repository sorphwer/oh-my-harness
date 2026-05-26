---
name: requesting-code-review
description: Use when completing a task, finishing a major feature, or before merging - sets up an independent review that can catch issues self-review will miss.
stage: [review]
---

# Requesting Code Review

## Why

The author is the worst reviewer of their own work. A reviewer that did not write the code catches assumptions, missing tests, and silent scope creep that the author has already rationalized away.

## Workflow

1. Confirm the work is actually complete: targeted tests pass, broader checks pass, the change matches the agreed plan.
2. Summarize the change in a few lines: goal, what changed, what was deliberately not changed.
3. Point the reviewer at the diff, the relevant tests, and the verification you ran.
4. Call out anything risky, surprising, or that you are not sure about. Do not bury it.
5. State what kind of review you want: correctness, security, design, or all of the above.

## Output Shape

- Goal and scope
- Files and rough size of the change
- Tests added or updated
- Verification commands and their results
- Open questions or known gaps

## Avoid

- Do not request review on a half-finished branch and call it "early feedback" without saying so.
- Do not hide the risky part of the change in a large unrelated refactor.
- Do not treat green CI as a substitute for review.
