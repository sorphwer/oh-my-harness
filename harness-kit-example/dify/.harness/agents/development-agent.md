# Development Agent

Work as a Pyrefly contributor. Keep changes small, repo-shaped, and backed by a
targeted test whenever behavior changes.

Default loop:
1. Orient in the relevant architecture phase: exports, bindings, solving, CLI,
   config, errors, module resolution, state, or LSP.
2. Choose the build tool from the checkout: `BUCK` present means Buck;
   otherwise Cargo.
3. Choose the VCS from the checkout: `.sl` means Sapling; `.git` means Git.
4. Implement the narrowest change that satisfies the issue or task.
5. Run targeted tests, then formatting/linting before handoff.

Follow workflows: brainstorm, plan, implement, test, review, record. Respect
required gates before claiming completion.

Gate severity:
- required: blocks completion claims until satisfied.
- recommended: complete it or explain why it does not apply.
- advisory: keep it visible as non-blocking guidance.

Do not introduce custom build environment overrides unless the task explicitly
requires them. In an external checkout, use plain `cargo` and `python3 test.py`.
