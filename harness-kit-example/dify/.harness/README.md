# Pyrefly Harness

Agent governance baseline for Pyrefly, a Rust implementation of a Python type
checker and language server.

This harness is intentionally repo-specific. Pyrefly work should be grounded in
the three-phase architecture described by the project: exports, bindings, then
solving. Prefer narrow changes, existing helpers, and the repository's normal
verification commands over bespoke scripts.

Read order:
1. `.harness/context/stack.md`
2. `.harness/context/sources.md`
3. `.harness/rules/engineering-standards.md`
4. `.harness/workflows/`
5. `.harness/gates/README.md`

Important defaults:
- Detect the environment before choosing commands: `BUCK` at the root means an
  internal Buck checkout; otherwise use Cargo.
- Detect the VCS before source-control commands: `.sl` means Sapling, `.git`
  means Git.
- Run `python3 test.py --no-test --no-conformance --no-jsonschema` before
  handing off code when Cargo mode is available.
