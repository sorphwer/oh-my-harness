# Gates

- required: blocks completion claims until satisfied.
- recommended: complete it or explain why it does not apply.
- advisory: keep it visible as non-blocking guidance.

- Environment detected (required): Choose Buck versus Cargo and Git versus
  Sapling before running build, test, or source-control commands.
- Architecture fit checked (required): Identify the affected Pyrefly area before
  editing shared type-checker behavior.
- Plan before broad change (required): Require a plan for broad, cross-phase, or
  risky changes.
- Regression considered (required): Add or update a targeted test for behavior
  changes, or explain why no test is appropriate.
- Verify before completion (required): Do not claim completion without
  verification evidence or a clear explanation of why verification could not
  run.
- Format and lint before handoff (required): Run
  `python3 test.py --no-test --no-conformance --no-jsonschema` in external
  Cargo checkouts, or the internal equivalent, before handing code off.
- Record process change (recommended): Record notable harness or workflow
  changes after implementation.
