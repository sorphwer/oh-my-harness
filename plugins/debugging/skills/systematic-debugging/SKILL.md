---
name: systematic-debugging
description: Use when encountering a bug, test failure, regression, or unexpected behavior, before proposing a fix.
stage: [explore, verify]
---

# Systematic Debugging

## Rule

Understand the failure before changing code. A fix that makes a symptom disappear without an explanation is a guess, and guesses tend to move the bug rather than remove it.

## Workflow

1. Reproduce the failure with the smallest reliable trigger.
2. State the expected behavior and the observed behavior in one sentence each.
3. Form a hypothesis about the root cause that explains every observed symptom.
4. Test the hypothesis with a focused probe: a log, a breakpoint, a narrower input, a git bisect.
5. If the hypothesis fails, discard it and form another. Do not patch around it.
6. Fix the root cause at the right layer. Add a regression test that fails without the fix.

## Anti-Patterns

- Changing code until the symptom disappears, then declaring victory.
- Adding defensive try/catch, null checks, or retries that hide the failure path.
- Blaming flakiness without evidence. Intermittent failures still have causes.
- Fixing in the caller when the bug is in the callee, or vice versa.

## Output

State the root cause, the fix location, and the regression coverage. If the cause could not be isolated, say what was ruled out and what risk remains.
