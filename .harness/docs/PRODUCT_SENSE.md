# Product Vision and Sense

## Problem Statement

Teams increasingly use AI coding agents, but the team's operating model is usually scattered across chat history, README notes, personal habits, and unstated reviewer expectations. Agents then make plausible but wrong decisions because the project lacks a local, explicit, reusable process contract.

## Target Audience

1. Engineering leads - want agents to follow the team's actual planning, quality, security, and release habits.
2. Developers using AI agents - want a project-local guide that reduces repeated prompting and reviewer cleanup.
3. Harness authors - want reusable doc and skill fragments that can be adapted without copying an entire template by hand.

## Product Value

- Turn a team's working style into a project-local `.harness/` folder.
- Keep the authoring source compact in `harness.yaml`.
- Compile deterministically without an API key, network call, or LLM runtime dependency.
- Make examples and fixtures the quality bar, not marketing copy.
- Stay complementary to hook-focused tools by leading with methodology and docs.

## MVP Intentional Constraints

- No CLI in v0; use a direct TypeScript function first.
- No `--watch`, `--check`, package publishing, or install flow in v0.
- No LLM frontend until yaml-to-folder compile is proven.
- No reverse extraction from `.harness/` back to yaml.
- No broad hook enforcement layer.
- No attempt to support every framework in the first schema.

## Strategic Shape

- `harness.yaml` becomes the stable interface.
- Content pools make docs reusable without making the compiler nondeterministic.
- Fixtures define real acceptance behavior: every new schema capability should be justified by a fixture that needs it.
- Self-hosting keeps the product honest because this repo must use the same compiler it ships.

## Future Direction

- Expand from the Acme fixture to the generic Next.js skeleton.
- Extract a fuller docs pool and skill catalog.
- Generate this repo's own `.harness/` from root `harness.yaml`.
- Add `--watch` and `--check` once compile semantics are stable.
- Add an optional LLM frontend for natural-language harness authoring.

