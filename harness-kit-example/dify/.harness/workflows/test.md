# Test Workflow

Phase: test

Entry criteria:
- Implementation complete.

Exit criteria:
- Targeted verification evidence is captured.
- Formatting and linting have run, or any pre-existing failure is clearly
  separated from the change.

Commands:
- External Cargo checkout:
  - `cargo test <test_name>`
  - `python3 test.py --no-test --no-conformance --no-jsonschema`
- Internal Buck checkout:
  - `buck test pyrefly:pyrefly_library -- <test_name>`
  - `buck test pyrefly:pyrefly_lsp_interaction_tests -- <test_name>` for
    heavyweight LSP interaction tests only.
  - `./test.py --no-test --no-conformance --no-jsonschema`
- Full suite when appropriate:
  - `python3 test.py` in external Cargo checkouts.
  - `./test.py` in internal checkouts.

Checklist:
- Use a narrow test name for iteration.
- Do not set custom Cargo wrapper or target directory overrides unless the task
  explicitly asks for that workflow.
- If linting fails, identify whether failures are in touched code.
