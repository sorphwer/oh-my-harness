# Design Overview

This document captures harness-kit's product and authoring design philosophy.
It is about the developer experience and generated documentation shape, not
visual UI polish.

## Design Philosophy

1. Deterministic compile path before convenience layers.
2. Fixed harness document coverage before resource projection.
3. Small yaml schema that grows only when a real fixture requires it.
4. Documentation as the primary product surface.
5. Plugin-first resource organization, without flattening resources into global pools.
6. Hook behavior as a secondary capability, never the headline.

## Interface Design Principles

- **Yaml is the authoring interface.** It should be small enough to write by
  hand and structured enough to validate.
- **Generated docs should start honest.** Current templates are scaffolds and
  user-interview guides, not fake project facts.
- **The compiler should make scope obvious.** Compiler v1 emits fixed docs and
  `PLUGINS.md`; it does not pretend plugin bodies, refs, or `.claude` support
  exist yet.
- **Errors should name the broken contract.** Unknown plugin id, invalid yaml
  shape, missing template, and unsafe output path should be distinguishable.
- **No magic in compile.** No timestamps, inference from git state, network
  fetches, or local user config.

## Core Pattern

```text
validate yaml -> resolve local plugins and templates -> render output map -> emit files
```

Every future layer should preserve this pattern. A packaged CLI, watch mode,
check mode, and LLM authoring are wrappers around it, not replacements for it.

## Naming Boundary

Use these terms in user-facing copy:

- methodology bundle
- doc harness
- generated `.harness/`
- compiled from yaml
- deterministic compiler
- plugin inventory

Avoid leading with:

- guardrails
- hook framework
- enforcement engine

The adjacent `kyu1204/oh-my-harness` project owns the hook-led positioning.

## Key Design Patterns

### Fixed template coverage

Every generated harness starts with the same 11 documentation surfaces:
agent guide, architecture, design, frontend, operations, plans, product sense,
quality score, reliability, security, and UAT.

### User-interview templates

Templates ask the agent to interview the user until the document reaches
project-specific granularity. They do not contain variables or pretend that
yaml already knows every project fact.

### Plugin-first resources

Reusable resources live under `plugins/<plugin-id>/`. The current output is
only a `PLUGINS.md` inventory because `plugin.skill`, `plugin.agent`, and
`plugin.rules` schemas are still open.

### Self-hosting as product proof

The repo now has a root `harness.yaml`. Replacing the root `.harness/` with
generated output remains a deliberate future step because it would overwrite
the current project harness.

## Data Returned to Callers

The meaningful output is the generated file tree. The stable caller-visible
data for compiler v1 is:

- emitted relative path
- file content bytes
- `PLUGINS.md` plugin order
- thrown error message for invalid yaml, unknown plugin, missing template, or
  failed output
