---
name: finishing-branch
description: Use when implementation is complete and tests pass, before merging or opening a PR - guides the integration decision instead of defaulting to "just merge it".
---

# Finishing a Development Branch

## Rule

"Done" is a decision, not a default. Before integrating, explicitly choose how the work should land based on its risk, audience, and review needs.

## Workflow

1. Confirm completion: agreed scope is done, tests pass, verification was run, no scratch files or debug code remain.
2. Review the diff yourself, end to end, as if you did not write it.
3. Choose the integration path:
   - Direct merge for low-risk, solo-owned work.
   - Pull request when others need to review, when the change touches shared code, or when policy requires it.
   - Split into multiple PRs when the diff mixes unrelated concerns.
   - Hold and revise when self-review uncovers a gap.
4. Write a commit or PR description that explains the why, the scope, and what was deliberately left out.
5. Clean up the local branch after integration: delete merged branches, drop temporary worktrees.

## Output Shape for the PR or Commit Description

- One-line summary of the change
- Motivation and link to the spec or issue
- What is in scope and what is explicitly not
- How it was tested
- Migration, rollout, or rollback notes if relevant

## Avoid

- Do not merge to bypass a review you expect to be hard.
- Do not bundle a refactor into a feature change without calling it out.
- Do not leave the branch alive "just in case" once it is merged.
