# Quality Standards and Scoring Criteria

This document defines the quality bar for harness-kit.

## Compiler Quality

- Deterministic generated file contents for identical inputs.
- No timestamps, random IDs, network reads, or LLM calls inside generated file contents.
- Run directory names use `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>`.
- Validates yaml before resolving plugins or templates.
- Throws loudly on unknown plugin ids.
- Verifies all 11 fixed templates exist before emit.
- Keeps generated paths inside the generated `outputs/.harness-*` run directory.
- Leaves unrelated files in `outputs/` untouched unless a future explicit clean mode is designed.

## TypeScript Quality

- TypeScript strict mode.
- Shared schemas live near the compile code until a second caller justifies splitting them.
- No implicit `any` in compiler surfaces.
- Prefer typed zod schemas over ad hoc object checks.
- Keep compiler v1 implementation in one readable `src/compile.ts` unless it outgrows comprehension.
- Do not include plugin source examples in `tsconfig` typechecking until plugin source schemas are fixed.

## Documentation Quality

- Current templates must not contain unresolved `TODO`, `TBD`, or template-variable markers.
- User-facing copy leads with doc-led methodology, not hook enforcement.
- Docs must distinguish fixed harness templates from plugin resources.
- Docs must distinguish the development entrypoint from a packaged CLI.
- If README, repo guide, spec, and plan disagree, update the stale document in the same change.
- File paths in docs should point to real files or explicitly say planned.

## Fixture Quality

- Fixture tests compile into a fresh generated `outputs/.harness-*` directory
  and clean it up after assertions.
- Generated fixed docs must be byte-equal to `.harness/templates/`.
- `PLUGINS.md` must preserve plugin order from yaml.
- Unknown plugin ids must fail before generated output is emitted.
- No test should pass if the compiler writes zero files.

## Security Quality

- No secrets in fixtures, templates, reference files, or generated output.
- No user-controlled output path escapes.
- No network fetches in compile.
- No broad hook-enforcement claims or generated shell hooks in compiler v1.

## Test Strategy

Compiler v1 tests cover:

- `compile()` emits 11 fixed docs plus `PLUGINS.md`
- generated docs match template bytes
- `npx tsx src/compile.ts <yaml>` works
- unknown plugin ids fail before emit

Future tests should be added when the implementation surface expands, not
preemptively for features outside the active contract.

## Quality Checklist

| Area | Required checks |
|------|-----------------|
| Schema | yaml rejects invalid shape |
| Resolve | unknown plugin ids fail without fallback behavior |
| Render | emitted markdown is byte-stable |
| Emit | files stay under the generated `outputs/.harness-*` run directory |
| Docs | positioning remains doc-led and compiler-focused |
| Scope | no refs, `.claude`, resource projection, watch, check, package, or LLM work lands without a spec update |
