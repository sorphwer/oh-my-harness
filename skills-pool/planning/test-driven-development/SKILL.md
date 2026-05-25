---
name: test-driven-development
description: Use when implementing a feature or bugfix where behavior can be specified with tests before production code changes.
---

# Test Driven Development

## Cycle

1. Write the smallest test that captures the desired behavior or regression.
2. Run it and confirm it fails for the expected reason.
3. Write the smallest implementation that makes it pass.
4. Run the focused test again.
5. Refactor only after the test is green.
6. Run broader checks affected by the change.

## Test Choice

- Unit tests for pure logic.
- Integration tests for API, database, auth, and data-flow behavior.
- Browser or component tests for UI workflows.
- Fixture tests for generated output.

## Avoid

- Do not write implementation first and then retrofit a test.
- Do not accept a failing test for the wrong reason.
- Do not broaden the refactor while the behavior is still red.
