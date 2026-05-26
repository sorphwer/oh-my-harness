---
name: code-review
description: Use when reviewing a pull request, branch, commit, patch, or working-tree diff for bugs, regressions, missing tests, maintainability risks, or security issues.
stage: [review]
---

# Code Review

## Review Stance

Prioritize actionable findings over summary. Look for behavior changes, broken assumptions, missing tests, compatibility issues, deployment risk, data loss, and security impact.

## Workflow

1. Confirm the exact diff and target branch.
2. Read surrounding code, not just changed lines.
3. Verify framework or library claims against actual usage when the issue is subtle.
4. Test or reason through edge cases affected by the change.
5. Report only issues the author can act on.

## Output

Findings first, ordered by severity. Each finding should include file and line, why it matters, and a concrete fix direction. After findings, add open questions, then a short summary only if useful.

If no issues are found, say that clearly and mention residual risk or tests not run.
