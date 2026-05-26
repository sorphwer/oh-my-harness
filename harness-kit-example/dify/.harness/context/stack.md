# Stack

Stack: rust-python-typechecker-lsp
Version: repository-defined by rust-toolchain.toml and Cargo.lock
Risk: high
Focus: type-checker correctness, LSP behavior, targeted regression tests, review readiness

Primary implementation:
- Rust workspace managed by Cargo in external checkouts.
- Buck is used in internal checkouts when a root `BUCK` file is present.
- Type semantics live mostly under `pyrefly/lib/alt`, `pyrefly/lib/binding`,
  `pyrefly/lib/export`, and `crates/pyrefly_types/src`.
- Python files are test inputs, fixtures, conformance data, and project tooling.
- The VS Code extension lives under `lsp` and is TypeScript.
- Website work lives under `website`.

Environment detection:
- If root `BUCK` exists, use Buck commands from the project root.
- If root `BUCK` does not exist, use Cargo commands from the project root.
- If root `.sl` exists, use Sapling source-control commands.
- If root `.git` exists, use Git source-control commands.

Team constraints:
- Keep It Simple by reducing helper count and concept count.
- Prefer existing `pyrefly_types` helpers before constructing or destructuring
  `Type` manually.
- Extract semantic information early instead of passing parsed `Expr` nodes
  through many layers.
- Unreachable states must panic with a clear explanation rather than silently
  degrade.
- Imports belong at the top of Rust files unless a name collision makes that
  impractical.
