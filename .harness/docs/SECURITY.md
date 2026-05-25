# Security Overview

This document summarizes the security posture for harness-kit.

## Security Principles

1. The compile path is local and deterministic.
2. `harness.yaml` is data, not executable code.
3. Output paths must never escape the selected output directory.
4. No secrets belong in examples, fixtures, references, or generated harness docs.
5. LLMs are optional authoring helpers, never part of deterministic compile.
6. Hook behavior remains minimal and explicit.

## Trust Boundaries

### User manifest

- source: `harness.yaml`
- trust level: untrusted input
- handling: parse, validate with schema, and reject unknown or unsupported values

### Local content pools

- source: repo-owned `docs-pool/`, `catalog/`, `references-pool/`
- trust level: trusted project content
- handling: resolved only by known ids from the manifest

### Generated output

- source: compiler render map
- trust level: artifact
- handling: write only under `outDir`; do not execute generated content

## Secrets

- Do not put real API keys, tokens, webhook secrets, OAuth credentials, or private customer data in fixtures.
- Reference files must be public documentation extracts or synthetic local examples.
- Permissions presets should not grant commands that read private home-directory secrets.

## Network and LLM Boundaries

The compiler must not:

- fetch remote templates
- call package registries
- call an LLM
- inspect browser state
- read agent-global memory or private config

The future LLM frontend is a separate authoring layer. Its output is yaml that still goes through the same compiler validation.

## Path Traversal Protection

The compiler must guard every output path. A malicious or broken fragment manifest cannot cause writes outside `outDir`.

## Adjacent Tool Boundary

harness-kit must not become a broad hook enforcement framework. If a feature is primarily about blocking shell commands, branch names, or commits, treat it as composition with a hook-focused tool unless the user explicitly approves a small permissions preset.

## Known Gaps

- No compiler implementation exists yet.
- No root `harness.yaml` exists yet.
- No formal package supply-chain policy exists yet.
- No published npm package exists yet.

