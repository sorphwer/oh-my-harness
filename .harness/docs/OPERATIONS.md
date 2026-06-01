# Operations Runbook

This runbook covers the operating model for harness-kit as a local developer
tool. There is no hosted production service.

## Production Environment

- Hosted service: none.
- Package name: planned as `harness-kit`.
- Repository name: `oh-my-harness`.
- Current status: compiler v1 minimal prototype runnable locally.
- Primary acceptance target: local fixture tests plus direct `tsx` smoke.

## Operating Model

The compiler is the source of runtime behavior. Templates, yaml fixtures, and
generated docs are product fixtures. When something breaks, first determine
whether the issue is in:

- yaml schema
- plugin id resolution
- fixed template file set
- `PLUGINS.md` rendering
- file emission
- documentation drift

## Daily Checks During v1 Prototype Work

1. `git status --short` to see user and agent changes.
2. Inspect active spec and plan under `.harness/docs/superpowers/`.
3. Run `npm test`.
4. Run `npm run typecheck`.
5. Smoke the root manifest into `outputs/`:

   ```bash
   npx tsx src/compile.ts harness.yaml
   ```

6. Inspect the printed `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>` directory.
7. Keep README, repo guide, and harness docs aligned when product scope changes.

## Incident Priorities

| Priority | Scenario |
|----------|----------|
| P1 | Generated file contents are nondeterministic for the same input |
| P1 | Compiler writes outside its `outputs/.harness-*` run directory |
| P1 | Tests pass while the compiler emits no files |
| P2 | README / repo guide / harness docs disagree about current scope |
| P2 | Fixed templates contain unresolved markers |
| P3 | Copy, naming, or layout inconsistencies in docs |

## Scenario: Compiler Test Fails

Symptom: `npm test` fails.

Checks:

1. Identify whether the failing case is compile output, CLI entrypoint, or
   unknown plugin handling.
2. If `tsx` fails with IPC permissions in a restricted sandbox, rerun the same
   command in an approved execution context.
3. If generated docs differ, compare them with `.harness/templates/`.
4. If `PLUGINS.md` differs, compare plugin order with the yaml input.

Actions:

1. Make the smallest change that restores deterministic agreement.
2. Re-run `npm test`.
3. Re-run `npm run typecheck`.
4. Update spec or plan if expected behavior changed.

## Scenario: Schema Change Needed

Symptom: a real fixture needs a field not represented in the current yaml schema.

Checks:

1. Confirm the fixture cannot express the behavior with existing fields.
2. Confirm the new field belongs in yaml rather than a fixed template or plugin default.
3. Update schema, docs, example yaml, and fixture tests together.

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
