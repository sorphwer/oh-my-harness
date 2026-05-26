# Regression Planning

Phase: plan

Triggers:
- behavior change
- bug fix
- broad refactor

Requires:
- affected area

Outputs:
- implementation plan
- test command

Gates:
- Plan before broad change (required): needs-plan
- Regression considered (required): regression-considered

Instructions:
- Prefer a targeted type-checker test under `pyrefly/lib/test` for solver,
  binding, export, config, module, or error behavior.
- Prefer lightweight LSP tests under `pyrefly/lib/test/lsp`; use
  `lsp_interaction` only when lightweight tests cannot express the behavior.
- Pick a narrow `cargo test <test_name>` or Buck equivalent for iteration.
- Include the formatting/linting driver in the handoff plan.
