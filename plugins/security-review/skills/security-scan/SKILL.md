---
name: security-scan
description: Use when performing a full security review of a repository, branch, pull request, commit, or patch where threat model, findings, validation, and severity need to be reported.
stage: [spec, explore, verify, review]
---

# Security Scan

## Workflow

1. Inventory runtime entrypoints, privileged operations, auth boundaries, data stores, and external callbacks.
2. Build a small threat model before looking for bugs: assets, actors, trust boundaries, and abuse goals.
3. Discover candidate findings by tracing source-to-sink paths, not by pattern matching alone.
4. Validate each candidate with code evidence and an attack path. Drop speculative items.
5. Calibrate severity from actual impact, required privileges, reachability, and compensating controls.

## Output

Lead with findings, ordered by severity. For each finding include:

- severity and short title
- affected file and line
- attack path
- impact
- concrete fix
- verification or missing test coverage

If there are no findings, say so clearly and name any residual review gaps.

## Common Mistakes

- Do not report a vulnerability without a reachable source and sink.
- Do not assume public exposure; verify routing, auth middleware, deployment, and default config.
- Do not conflate best-practice hardening with exploitable security impact.
