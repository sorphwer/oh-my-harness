# Security Overview

This document summarizes the security posture for harness-kit.

## Security Principles

1. The compile path is local and deterministic.
2. `harness.yaml` is data, not executable code.
3. Output paths must never escape the generated `outputs/.harness-*` run directory.
4. No secrets belong in examples, fixtures, templates, references, or generated harness docs.
5. LLMs are optional authoring helpers, never part of deterministic compile.
6. Hook behavior remains minimal and explicit.

## Trust Boundaries

### User manifest

- source: `harness.yaml`
- trust level: untrusted input
- handling: parse, validate with schema, and reject unknown or unsupported values

### Fixed templates

- source: `.harness/templates/`
- trust level: trusted project content
- handling: copied as bytes into generated output

### Plugin inventory

- source: `plugins/<id>/`
- trust level: trusted project content
- handling: compiler v1 validates selected plugin ids and writes only `PLUGINS.md`

### Generated output

- source: compiler output map
- trust level: artifact
- handling: write only under the generated `outputs/.harness-*` run directory; do not execute generated content

## Secrets

- Do not put real API keys, tokens, webhook secrets, OAuth credentials, or private customer data in fixtures.
- Template files must stay generic and public.
- Future reference files must be public documentation extracts or synthetic local examples.
- Future permissions presets must not grant commands that read private home-directory secrets.

## Network and LLM Boundaries

The compiler must not:

- fetch remote templates
- call package registries
- call an LLM
- inspect browser state
- read agent-global memory or private config

The future LLM frontend is a separate authoring layer. Its output is yaml that
still goes through the same compiler validation.

## Path Traversal Protection

The compiler guards every output path. A malicious or broken source path must
not cause writes outside the generated `outputs/.harness-*` run directory.

## Adjacent Tool Boundary

harness-kit must not become a broad hook enforcement framework. If a feature is
primarily about blocking shell commands, branch names, or commits, treat it as
composition with a hook-focused tool unless the user explicitly approves a small
permissions surface.

## Known Gaps

- Plugin skill, agent, and rules resource schemas are not finalized.
- References output is not implemented.
- `.claude` output is not implemented.
- No formal package supply-chain policy exists yet.
- No published npm package exists yet.
