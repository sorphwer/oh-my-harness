# Project Development Guide

> Authoritative starting guide for AI coding agents and human contributors working in this project. Treat this file as the project process anchor until the team has answered the project-specific questions below and rewritten it into a concrete guide.

## Purpose

This guide defines how an agent should understand the project before changing it. A complete project guide should be specific enough that a new agent can identify the product contract, safe change process, technology stack, security boundaries, documentation map, and verification commands without guessing.

Until the guide is fully specialized for the project, agents must interview the user and inspect the repository before making non-trivial changes.

## How To Ask The User

Ask enough questions to turn this scaffold into a concrete project guide. Prefer short, numbered questions with examples. Ask one group at a time, then summarize the answers before moving to the next group.

Do not ask the user for information that can be directly and cheaply inspected from the repository, such as package manager, framework, scripts, routes, schema files, or deployment config. Inspect first, then ask the user to confirm product intent, policy, and unresolved decisions.

Use this pattern:

1. State what you already verified from the repository.
2. Ask for the missing decision or domain fact.
3. Offer common choices when the answer space is predictable.
4. Record the answer in this guide or in the relevant document.
5. Continue only when the answer affects the requested work.

For small edits, ask only the questions needed for that edit. For harness setup or major feature work, collect enough answers to fill every section below with concrete project facts.

## Project Overview

To complete this section, ask:

- What does the product do in one or two sentences?
- Who are the primary users?
- What outcome should the product reliably deliver for those users?
- What is explicitly out of scope for the current version?
- What product name should agents use in user-facing copy, docs, and PR descriptions?

A strong overview names the product, the users, and the core job. Avoid vague descriptions such as "a platform" or "a dashboard" without the workflow it supports.

## Canonical Product Contract

This section should capture invariants that other code and documentation must obey. Ask about:

- Tenancy model: single-user, per-account, per-organization, multi-tenant, or another boundary.
- Authentication model: public, session-based, OAuth, API keys, service tokens, or mixed.
- Public identifiers: formats, prefixes, casing, stability, and whether IDs may be exposed.
- Lifecycle states: field names, allowed values, transitions, and terminal states.
- Primary user workflows and the routes, commands, or APIs that implement them.
- Idempotency and duplicate-handling rules.
- Error semantics that clients, users, or integrations depend on.
- Compatibility promises for persisted data, APIs, URLs, files, and generated output.

Write this section as firm bullets. If a contract is not settled, ask the user to choose before implementing behavior that depends on it.

## Tech Stack

Inspect the repository first, then confirm the intended stack. Capture:

- Runtime and language versions.
- Frameworks, build tools, package manager, and module format.
- Database, ORM, migrations, and generated schema sources.
- Authentication, validation, queue, cache, storage, and search libraries.
- Deployment target and environment model.
- Test runner, linting, formatting, type checking, and local development tools.
- Important third-party services and whether they are required locally.

Keep this section factual. Do not list aspirational tools unless the user confirms they are part of the planned implementation.

## Planning Document Convention

Define where planning documents live and when they are required. Ask:

- Which directory is the entry point for current plans?
- What file naming convention should active, completed, and superseded plans use?
- Does every code change require an active plan, or only non-trivial changes?
- Where should design specs, implementation plans, product specs, and decision records live?
- How should agents record decisions made during implementation?

When this project uses Superpowers specs or plans, keep them under `docs/superpowers/specs/` and `docs/superpowers/plans/` unless the project guide says otherwise.

## Change Process

Describe how an agent moves from request to merged work. Ask:

- Which changes can be made directly, and which require an approved plan first?
- When should the agent ask for user confirmation?
- Which files are generated and should not be edited by hand?
- Which areas are high risk or require extra review?
- What counts as done: tests, screenshots, deployment, PR, release note, or another artifact?
- How should unrelated local changes be treated?

The final process should be decisive but bounded. It should let agents act on clear, reversible work and pause only for decisions that are truly product-critical or high risk.

## Security Requirements

Document project-specific security rules. Ask:

- Which secrets exist, where they may be read, and which must never reach client code or logs.
- Which routes, commands, jobs, and storage paths require authentication or authorization.
- What input validation is required at external boundaries.
- Whether user-generated content can contain HTML, Markdown, files, images, or scripts.
- Which data is sensitive, encrypted, retained, exported, or deleted.
- What network calls are allowed in local development, tests, build, and generated output.
- Which security checks must run before shipping.

If the project has no formal security model yet, record conservative defaults that match the actual architecture and ask the user to confirm them before building exposed features.

## Data And State Model

Capture the core entities and state transitions. Ask:

- What are the main domain objects?
- Which object owns or references which other object?
- Which fields are public contract, internal implementation detail, or generated metadata?
- Which state changes are allowed, forbidden, reversible, or audited?
- Which files, database tables, queues, caches, or external services store durable state?
- Where is the generated schema or API reference located?

Keep this section short enough to scan. Link to generated schema, OpenAPI, ERD, or migration docs when those exist.

## Documentation Structure

Map the harness and project docs. A complete project guide should explain the purpose of the main files under `docs/`, including architecture, product sense, design, frontend, operations, reliability, security, quality, UAT, references, generated docs, product specs, plans, and design records.

Ask the user which documents are canonical when two files appear to overlap. Prefer one clear source of truth over duplicated instructions.

## Development Commands

Inspect scripts and local tooling, then record commands for:

- Install dependencies.
- Start the development server.
- Build production artifacts.
- Run unit, integration, and end-to-end tests.
- Run linting, formatting, and type checks.
- Run database migrations, seeds, and schema generation.
- Compile or regenerate the harness.
- Open local docs or previews.

For each command, record any required environment variables, services, ports, or known caveats.

## Verification Expectations

Before claiming work is complete, run the smallest verification set that proves the changed contract still holds. Prefer execution over inspection.

Document:

- Required checks for documentation-only changes.
- Required checks for compiler, runtime, database, frontend, API, and deployment changes.
- Screenshot or browser verification expectations for UI work.
- How to report skipped checks and why they were skipped.

Claims in final responses should distinguish executed checks, inspected evidence, and assumptions.

## Agent Operating Notes

- Read this guide before editing the project.
- Keep changes scoped to the user's request.
- Preserve unrelated local changes.
- Do not hand-edit generated output when an authoring source exists.
- Do not invent product policy, API contracts, security rules, or visual direction.
- Ask the user only for decisions that cannot be inferred from repository evidence.
- Update this guide when the project contract, process, commands, or security model changes.

