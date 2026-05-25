# Operations Runbook

This runbook covers the operating model for harness-kit as a local developer tool. There is no hosted production service in the current MVP.

## Production Environment

- Hosted service: none.
- Package name: planned as `harness-kit`.
- Repository name: `oh-my-harness`.
- Current status: pre-MVP.
- Primary acceptance target: local fixture tests.

## Operating Model

The compiler is the source of runtime behavior. Examples and generated docs are product fixtures. When something breaks, first determine whether the issue is in:

- yaml schema
- fragment resolution
- markdown rendering
- file emission
- hand-curated target fixture
- documentation drift

## Daily Checks During MVP Work

1. `git status --short` to see user and agent changes.
2. Inspect active spec and plan under `.harness/docs/superpowers/`.
3. Once scaffolded, run `npm test`.
4. Confirm fixture targets still describe the intended product behavior.
5. Keep README, repo guide, and harness docs aligned when product scope changes.

## Incident Priorities

| Priority | Scenario |
|----------|----------|
| P1 | Compiler output is nondeterministic for the same input |
| P1 | Compiler writes outside `outDir` |
| P1 | Fixture tests pass while emitted content differs from target files |
| P2 | README / repo guide / harness docs disagree about current scope |
| P2 | Example harness contains placeholders in a filled target |
| P3 | Copy, naming, or layout inconsistencies in docs |

## Scenario: Fixture Test Fails

Symptom: `npm test` reports a byte diff between compiled output and `example/nextjs-acme/.harness`.

Checks:

1. Read the diff and identify the emitted relative path.
2. Decide whether the compiler output or hand-curated target is correct.
3. If the target is correct, fix template rendering or derived params.
4. If the compiler is correct, update the target and explain why.

Actions:

1. Make the smallest change that restores deterministic agreement.
2. Re-run the fixture test.
3. Update spec or plan if the expected behavior changed.

## Scenario: Schema Change Needed

Symptom: a real fixture needs a field not represented in the current yaml schema.

Checks:

1. Confirm the fixture cannot express the behavior with existing fields.
2. Confirm the new field belongs in yaml rather than a local template default.
3. Update schema, docs, example yaml, and fixture target together.

Actions:

1. Add the narrowest field that satisfies the fixture.
2. Avoid generalizing ahead of evidence.
3. Add or update tests so the new behavior is covered.

## Release Notes

There is no release process yet. Before npm publishing is added, define:

- package build command
- smoke test command
- changelog convention
- npm access policy
- versioning policy

