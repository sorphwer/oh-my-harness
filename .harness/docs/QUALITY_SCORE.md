# Quality Standards and Scoring Criteria

This document defines the quality bar for harness-kit.

## Compiler Quality

- Deterministic output for identical inputs.
- No timestamps, random IDs, network reads, or LLM calls in compile.
- Validates yaml before resolving fragments.
- Throws loudly on unknown docs, skills, references, or permissions presets.
- Keeps generated paths inside `outDir`.
- Leaves unrelated files in `outDir` untouched unless a future explicit clean mode is designed.

## TypeScript Quality

- TypeScript strict mode.
- Shared schemas live near the compile code until a second caller justifies splitting them.
- No implicit `any` in compiler surfaces.
- Prefer typed zod schemas over ad hoc object checks.
- Keep v0 implementation in one readable `src/compile.ts` unless it outgrows comprehension.

## Documentation Quality

- Filled harness docs must not contain placeholder instructions.
- User-facing copy leads with doc-led methodology, not hook enforcement.
- Examples should match the live schema and compiler behavior.
- If README, repo guide, spec, and plan disagree, update the stale document in the same change.
- File paths in docs should point to real files or explicitly say planned.

## Fixture Quality

- Every emitted file in a fixture must be byte-equal to the hand-curated target.
- If the target changes, the reason should be clear from the plan or commit.
- Do not silently widen schema enums; add only values needed by a fixture.
- References copied by the compiler should be byte-preserving.

## Security Quality

- No secrets in fixtures or reference files.
- No user-controlled output path escapes.
- No network fetches in compile.
- No broad hook-enforcement claims or generated shell hooks in v0.

## Test Strategy

The v0 test strategy is intentionally narrow:

- one integration fixture for `example/nextjs-acme`
- compile into a temp directory
- assert every emitted file is a byte-equal subset of `example/nextjs-acme/.harness`

Future tests should be added when the implementation surface expands, not preemptively for features outside v0.

## Quality Checklist

| Area | Required checks |
|------|-----------------|
| Schema | yaml rejects invalid shape with useful path information |
| Resolve | unknown ids fail without fallback behavior |
| Render | emitted markdown is byte-stable |
| Emit | files stay under `outDir` and preserve reference bytes |
| Docs | positioning remains doc-led and compiler-focused |
| Scope | no CLI, watch, check, package, or LLM work lands in v0 |

