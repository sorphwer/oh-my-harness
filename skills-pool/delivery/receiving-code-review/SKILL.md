---
name: receiving-code-review
description: Use when reading review feedback, before implementing suggestions - requires technical verification, not performative agreement or blind compliance.
---

# Receiving Code Review

## Rule

Feedback is an input, not an order. Treat each comment as a claim to verify against the code, the tests, and the actual behavior before you change anything.

## Workflow

1. Read every comment before responding to any of them. Group them by area.
2. For each comment, decide: agree and change, agree and defer, disagree with evidence, or need to ask.
3. When you agree, make the smallest change that addresses the underlying concern, not just the literal suggestion.
4. When you disagree, reply with the evidence: a test, a code path, a spec line, or an explicit tradeoff.
5. When unsure, ask a focused question instead of guessing or silently complying.
6. Re-run the verification that proves the change still works after edits.

## Anti-Patterns

- Implementing every suggestion verbatim to look agreeable, even when the suggestion is wrong.
- Pushing back on every suggestion to defend the original design.
- Marking comments resolved without a visible code change or written rationale.
- Bundling unrelated cleanup into the review-response commits.

## Output

A short reply per thread: what you changed, why, and a pointer to the commit or line. For disagreements, include the evidence that justifies the call.
