# Engineering Standards

Rules are standing repository policies. They apply across workflows and skills.

- Architecture Fit (critical): Place changes in the matching phase: exports,
  bindings, solving, CLI/config, errors, module resolution, state, tests, LSP,
  website, or VS Code extension.
- Correctness Over Fallbacks (critical): If a state should be unreachable,
  panic with `unreachable!` or `expect` and explain the invariant. Do not add
  silent defaults for impossible type-checker states.
- Minimal Rust (high): Prefer the simplest local change. Avoid single-use
  helpers unless they clarify a real invariant or remove meaningful complexity.
- Type Representation Discipline (high): Check `pyrefly_types` helpers before
  manually destructuring or constructing `Type` values.
- Semantic Extraction (high): Extract semantic information as early as possible.
  Avoid threading `Expr` nodes through layers that should operate on resolved
  facts.
- Imports (medium): Add `use` imports at the top of Rust files. Use inline
  qualified paths only for rare name collisions.
- Generated Artifacts (high): Do not manually edit `conformance` data generated
  by `test.py`. Include generated changes only after running the proper driver.
- Build Tool Discipline (high): Detect Buck versus Cargo before testing. In an
  external checkout, use plain Cargo and `python3 test.py`.
- VCS Discipline (high): Detect Git versus Sapling before source-control
  commands. Do not assume Git in internal checkouts.
- Test Markers (medium): A `bug = "..."` marker documents wrong behavior while
  the test still passes. Remove or update the marker when the behavior changes.
