# Implement Workflow

Phase: implement

Entry criteria:
- Task and verification path selected.

Exit criteria:
- Code changes are minimal and match the selected architecture area.
- Regression coverage is added or an explicit reason is recorded.

Checklist:
- Follow existing local patterns before introducing a new abstraction.
- Prefer existing helpers in `crates/pyrefly_types/src` for type operations.
- Keep unreachable invariant failures loud with `unreachable!` or `expect`.
- Add Rust `use` imports at the top of the file.
- Avoid passing parsed expressions deeper than necessary; convert to semantic
  facts near the boundary.
- Do not manually edit generated conformance files.
