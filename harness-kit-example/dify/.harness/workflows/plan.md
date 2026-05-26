# Plan Workflow

Phase: plan

Entry criteria:
- Behavior target is known.

Exit criteria:
- A scoped implementation path.
- A targeted test command.
- A required formatting/linting command.

Checklist:
- Detect the environment:
  - `test -f BUCK && echo buck || echo cargo`
  - `test -d "$(sl root 2>/dev/null)/.sl" && echo sapling || echo git`
- Pick tests by area:
  - Type checker regression: add or update `pyrefly/lib/test/*.rs`, then run
    `cargo test <test_name>` or `buck test pyrefly:pyrefly_library -- <test_name>`.
  - Lightweight LSP: use `pyrefly/lib/test/lsp`.
  - Heavyweight LSP interaction: use the dedicated interaction target only when
    lightweight tests cannot cover the behavior.
  - IDE markdown tests: use `test/`.
- Keep the plan narrow. Broad refactors need an explicit reason and stronger
  verification.
