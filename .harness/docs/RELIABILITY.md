# Reliability Design

This document describes reliability behavior for the harness-kit compiler and generated artifacts.

## Reliability Goal

A user should be able to trust that `harness.yaml` plus the same version of harness-kit always produces the same `.harness/` tree. Failures should stop the compile before partial ambiguity becomes hidden drift.

## Error Handling Strategy

Use explicit failure classes in behavior, even if v0 implements them as plain `Error` messages:

- yaml parse failure
- schema validation failure
- unknown doc fragment
- unknown skill catalog entry
- unknown reference
- unknown permissions preset
- template render failure
- unsafe output path
- filesystem write failure

Every error should include the most useful path or id for the user to fix.

## Deterministic Rendering

- Sort generated aggregate sections by yaml order unless a spec says otherwise.
- Do not depend on filesystem traversal order for output order.
- Render markdown with stable newlines.
- Copy references as bytes, not strings, unless a reference is intentionally templated.
- Keep permissions presets as static content in v0.

## Emit Semantics

The v0 emitter:

- creates `outDir` if missing
- creates parent directories as needed
- writes files from the render map
- does not delete files it did not produce

This makes early dogfooding less risky. A future clean mode must be explicit and tested.

## Duplicate Output Rule

If two fragments resolve to the same output path, fail the compile. Silent last-writer-wins behavior would make the generated tree depend on ordering accidents.

## Path Safety

Reject output paths that:

- are absolute
- contain `..` path traversal
- resolve outside `outDir`
- collide with a directory that must be a file

## Fixture Reliability

Fixture tests should compile into a fresh temp directory. They should compare emitted files to the target tree byte-for-byte so line ending, whitespace, and reference-copy drift are caught.

## Operational Monitoring

There is no production service in v0. The reliability signals are local:

- test failures
- fixture diffs
- schema drift between docs and implementation
- generated output that cannot be reproduced from yaml

