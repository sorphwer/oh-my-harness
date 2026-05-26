# Deployment Paths

Pyrefly is a developer tool, not a containerized web service. Treat "deploy" as
local build, test, package, and release preparation.

Local development:
- External checkout: use Cargo from the repository root.
- Internal checkout: use Buck when root `BUCK` exists.
- Python tooling is driven by `test.py`; do not assume a `requirements.txt`
  application setup.

Verification:
- Targeted Rust tests with `cargo test <test_name>` or Buck equivalent.
- Formatting/linting with `python3 test.py --no-test --no-conformance --no-jsonschema`
  in external checkouts.
- Full validation with `python3 test.py` when warranted.

Release-related areas:
- CLI and type checker: Rust workspace.
- VS Code extension: `lsp`.
- Website: `website`.
- Release notes: `release_notes`.
