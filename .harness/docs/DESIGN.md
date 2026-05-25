# Design Overview

This document captures harness-kit's product and authoring design philosophy. It is about the shape of the developer experience, not visual UI polish.

## Design Philosophy

1. Deterministic compile path before convenience layers.
2. Small yaml schema that grows only when fixtures require it.
3. Documentation as the primary product surface.
4. Local, inspectable content pools over hidden runtime behavior.
5. Hook behavior as a small preset, never the headline.

## Interface Design Principles

- **Yaml is the authoring interface.** It should be small enough to write by hand and structured enough to validate.
- **Generated docs should read like human project docs.** Avoid template residue, placeholders, or generic examples in filled targets.
- **Examples are product UX.** `example/nextjs` and `example/nextjs-acme` should teach the user what good output looks like.
- **Errors should name the broken contract.** Unknown fragment id, invalid schema path, render failure, and emit failure should be distinguishable.
- **No magic in compile.** No timestamps, inference from git state, network fetches, or local user config.

## Core Pattern

```text
validate manifest -> resolve local fragments -> render markdown -> emit files
```

Every future layer should preserve this pattern. CLI, watch mode, check mode, and LLM authoring are wrappers around it, not replacements for it.

## Naming Boundary

Use these terms in user-facing copy:

- methodology bundle
- doc harness
- generated `.harness/`
- compiled from yaml
- deterministic compiler

Avoid leading with:

- guardrails
- hook framework
- enforcement engine

The adjacent `kyu1204/oh-my-harness` project owns the hook-led positioning.

## Key Design Patterns

### Fixture-driven schema growth

Every new yaml field should be justified by a fixture that needs it. Do not add broad schema flexibility ahead of evidence.

### Local pools

Docs, skills, and references live in local pools. The compiler resolves ids into those pools; it does not fetch remote templates.

### Subset rule for early fixtures

v0 may emit a subset of the hand-written target. The test still has teeth: every emitted file must exist in the target and be byte-equal.

### Self-hosting as product proof

Once the compiler can generate this repo's own `.harness/`, hand edits to root `.harness/` should stop. The repo should demonstrate its own rules.

## Data Returned to Callers

v0 has no runtime API. The meaningful output is the generated file tree. The stable caller-visible data is:

- emitted relative path
- file content bytes
- thrown error message for invalid input or failed output

