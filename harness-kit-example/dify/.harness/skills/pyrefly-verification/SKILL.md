# Pyrefly Verification

Phase: test

Triggers:
- completed implementation
- before handoff

Requires:
- code changes

Outputs:
- test evidence
- lint evidence

Gates:
- Verify before completion (required): needs-tests
- Format and lint before handoff (required): format-lint

Instructions:
- In an external checkout, run targeted `cargo test <test_name>` when behavior
  changed.
- In an internal checkout, run the matching Buck test target.
- Before handoff, run `python3 test.py --no-test --no-conformance --no-jsonschema`
  externally or the internal equivalent.
- Do not add custom Cargo wrapper or target directory overrides unless the task
  explicitly asks for them.
