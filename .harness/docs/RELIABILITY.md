# Reliability Design

This document describes reliability behavior for the harness-kit compiler and
generated artifacts.

## Reliability Goal

A user should be able to trust that `harness.yaml` plus the same version of
harness-kit always produces the same generated file contents. Each run gets a
fresh `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>` directory. Failures should
stop the compile before partial ambiguity becomes hidden drift.

## Error Handling Strategy

Compiler v1 uses plain `Error` messages, but the behavior distinguishes:

- yaml parse failure
- schema validation failure
- unknown plugin id
- missing fixed template file
- unsafe output path
- filesystem write failure

Every error should include the most useful path or id for the user to fix.

## Deterministic Rendering

- Preserve plugin order from yaml.
- Do not depend on filesystem traversal order for output order.
- Copy templates as bytes.
- Render `PLUGINS.md` with stable newlines.
- Do not write timestamps, random IDs, host-specific paths, or local user config into generated file contents.
- Use timestamp and four-character hash only in the generated run directory name.

## Emit Semantics

The compiler v1 emitter:

- creates a run directory under `outputs/`
- creates parent directories as needed
- writes files from the render map
- does not delete files it did not produce

This makes early dogfooding less risky. A future clean mode must be explicit
and tested.

## Duplicate Output Rule

Compiler v1 has a fixed output map. When future plugin resource projection is
added, any two resources resolving to the same output path must fail the compile.
Silent last-writer-wins behavior would make the generated tree depend on
ordering accidents.

## Path Safety

Reject output paths that:

- are absolute
- contain `..` path traversal
- resolve outside the generated `outputs/.harness-*` run directory
- collide with a directory that must be a file

## Fixture Reliability

Fixture tests should compile into a fresh generated run directory and clean it
up after assertions. They should compare generated fixed docs to
`.harness/templates/` byte-for-byte so line ending and whitespace drift are
caught.

## Operational Monitoring

There is no production service. Reliability signals are local:

- `npm test` failures
- `npm run typecheck` failures
- direct `npx tsx src/compile.ts ...` smoke failures
- schema drift between docs and implementation
- generated output that cannot be reproduced from yaml
