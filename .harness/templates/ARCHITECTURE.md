# Architecture Overview

This document is a scaffold for capturing how a project works at the system
boundary level. It should help an agent gather enough concrete answers to later
rewrite `ARCHITECTURE.md` as a project-specific architecture guide with the same
granularity as a completed harness document.

The filled document should explain the system shape, the important runtime
flows, the caller-facing contracts, the ownership boundary, and the reliability
behavior that future contributors must preserve. It is not a backlog, a feature
pitch, or a complete code map.

## How To Ask The User

Start from the repository before asking questions. Read existing docs, route or
command entrypoints, schema definitions, configuration files, deployment files,
and tests. Then tell the user which facts are already evident and ask only for
the missing decisions.

Ask one question at a time when the answer changes the next question. Prefer
multiple-choice options when the user is choosing between architecture shapes,
and use open-ended questions when asking about domain concepts, ownership, or
failure behavior.

Before writing the final version, gather answers for these topics:

- the type of system and its main callers
- the primary runtime or execution model
- the durable state, external services, and generated artifacts
- the most important end-to-end flow
- the public interface that callers rely on
- the internal interface that should not become public contract
- the main resources, identifiers, lifecycle states, and ownership rules
- the authentication, authorization, tenancy, or workspace boundary
- the failure, retry, duplicate-request, and race-safety semantics
- the data that is returned to callers and the data that remains internal

Good opening questions:

- "What kind of system is this: web app, API, CLI, generator, worker, library,
  integration, or something else?"
- "Who or what calls it, and what successful outcome do they expect?"
- "What is the single most important happy path from input to useful output?"
- "Where does durable state live, and which services or files does the system
  depend on?"
- "Which interface should future callers treat as stable?"
- "What data boundary prevents one user, tenant, workspace, repository, or
  environment from seeing another?"
- "Which failures should be retried, rejected, ignored, or surfaced to the
  caller?"

When the answer is vague, ask for one concrete example. A useful example names
the actor, the entrypoint, the input, the state change, the output, and the
failure behavior.

## System Overview

Explain the system in one or two short paragraphs. Name the kind of system, its
main callers, its primary data or artifacts, and the outcome it exists to
produce.

A finished overview should answer:

- what starts work in the system
- what layer owns the core behavior
- what durable state or output is produced
- what is explicitly outside the system boundary

Questions to ask:

- "What should a new contributor understand about this system in the first
  minute?"
- "Which part owns the actual behavior, as opposed to wrapping, routing, or
  presentation?"
- "What does the system intentionally not do?"

## High-Level Architecture

Include a compact diagram that shows callers, the main application or execution
boundary, durable storage, external services, and emitted artifacts. Use the
smallest diagram that explains the system. ASCII diagrams are usually enough;
Mermaid is useful when state or sequence matters.

The diagram should distinguish:

- human users, automated callers, scheduled jobs, and external services
- server-side code, client-side code, workers, and local command execution
- trusted internal modules and untrusted input boundaries
- durable stores, caches, queues, object storage, and generated output folders

Questions to ask:

- "Which boxes must appear in the architecture diagram for it to be truthful?"
- "Does work happen synchronously in one request or across background steps?"
- "Which dependencies are optional conveniences, and which are required for the
  system to function?"
- "Where is untrusted input first accepted?"

## Core Flow

Describe the most important happy path from trigger to output. Use a short
step-by-step block, then add prose for non-obvious details.

Useful flow shapes include:

- `receive request -> validate input -> authorize caller -> persist change -> return response`
- `read manifest -> resolve local resources -> render files -> emit output`
- `receive event -> normalize payload -> enqueue work -> record outcome`
- `load data -> transform result -> cache safe view -> render interface`

If the system has more than one load-bearing flow, add a subsection for each.
Name background jobs, scheduled jobs, fan-out, retries, webhooks, streaming, and
read-time state transitions where they matter.

Questions to ask:

- "What is the shortest successful path through the system?"
- "Where does validation happen, and what happens when it fails?"
- "Which step changes durable state?"
- "Which side effects happen before the caller receives a result?"
- "Can the same input be processed twice, and what should happen then?"

## Core Components

List the few components a contributor must understand to make safe changes.
Each component should have a concrete responsibility, its main inputs and
outputs, and the dependencies it is allowed to call.

Good component descriptions answer:

- what the component owns
- what it must never own
- which other components call it
- which failures it reports upward
- which invariants it protects

Questions to ask:

- "Which files, modules, services, or packages form real architecture
  boundaries rather than convenience folders?"
- "Which component should future work reuse instead of duplicating behavior?"
- "Where would a new feature most likely enter the system?"
- "Which dependency direction should never be reversed?"

## Resource Model

Document each public or durable resource that callers, users, or operators need
to reason about. Keep the list short and focused on architecture contracts, not
every table or class.

For each resource, capture:

- identifier format and routing shape
- owner, tenant, workspace, repository, or environment scope
- lifecycle states and valid transitions
- soft-delete, archive, restore, or retention behavior
- visibility rules for public, authenticated, and internal views
- storage location and important indexes or uniqueness rules when relevant

Questions to ask:

- "What are the named things the system manages?"
- "Which identifiers appear in URLs, APIs, files, logs, or user-visible output?"
- "What states can the resource be in?"
- "Which state transitions are forbidden?"
- "Which fields exist only for internal operation?"

## Public Interface

Describe the surface that callers may depend on. Depending on the project, this
may be HTTP routes, a CLI, generated files, exported library functions, message
topics, webhooks, or a user-facing UI workflow.

For APIs and routes, use a compact table with path, method, auth, purpose, and
stable response shape. For CLIs and generators, describe command inputs, exit
behavior, stdout or file output, and error shape. For UI-only systems, describe
the user-visible workflows and the data they reveal.

Questions to ask:

- "Which interface must remain stable for callers after refactors?"
- "What auth method applies to each entrypoint?"
- "Which responses, files, or statuses are part of the contract?"
- "Which errors should callers handle intentionally?"
- "What should never be treated as public API?"

## Internal Interfaces

List internal-only routes, commands, modules, admin screens, maintenance jobs,
and debug surfaces that contributors may use but callers must not rely on.
State why each surface is internal and what would need to change before it could
become public contract.

Questions to ask:

- "Which interfaces exist only for operators, admins, tests, local development,
  or migration?"
- "Which internal shortcut would be dangerous if an external caller depended on
  it?"
- "Are there hidden routes, scripts, dashboards, or generated files that look
  public but are not?"

## Request Or Resource Lifecycle

If the project has lifecycle states, document the transitions as a diagram or
small table. If it has no lifecycle state, say what the closest equivalent is:
request lifecycle, compile lifecycle, job lifecycle, deploy lifecycle, or no
stateful lifecycle.

A finished lifecycle section should name:

- starting state
- terminal states
- allowed transitions
- forbidden transitions
- who or what may trigger each transition
- side effects that happen during transitions

Questions to ask:

- "What states can this request, job, resource, or artifact move through?"
- "Which transitions can users trigger directly?"
- "Which transitions are automatic?"
- "What happens if a transition races with another transition?"
- "Can a terminal state be reopened?"

## Ownership And Tenancy Boundary

State the boundary explicitly even when the answer is single-user,
single-tenant, local-only, or repository-only. The filled document should say
where the active owner is resolved and which client-supplied selectors are
trusted, ignored, or rechecked.

Useful boundary types include:

- user account
- organization or tenant
- workspace or project
- repository checkout
- deployment environment
- API key or integration account
- output directory or generated artifact set

Questions to ask:

- "What entity owns data, actions, credentials, or generated output?"
- "Where is the active owner resolved?"
- "Can a caller choose the owner, or is it derived from session, token, config,
  path, or runtime context?"
- "Which query filter, path guard, permission check, or filesystem guard
  protects the boundary?"
- "Is there any impersonation, delegation, or cross-tenant admin path?"

## Data Stored And Data Returned

Separate internal storage from caller-visible data. Name the stable fields,
files, statuses, logs, or rendered values that callers can rely on, and name the
internal data that must not leak.

Questions to ask:

- "What data is persisted, cached, generated, or logged?"
- "Which fields or files are returned through the primary read path?"
- "Which internal fields support operation but must stay hidden?"
- "Which data is sensitive because of privacy, security, tenancy, licensing, or
  business logic?"
- "What can be added later without breaking callers?"

## Reliability Semantics

Capture the failure-handling behavior that callers and contributors can rely on.
Keep rationale brief; detailed incident, operations, or observability material
can live in a separate reliability document when the project needs one.

Cover the rules that apply:

- validation failures and error mapping
- authentication and authorization failures
- duplicate requests and idempotency
- retryable versus terminal failures
- timeout behavior
- race-safety guarantees
- partial writes and rollback behavior
- cache freshness or invalidation guarantees
- external service degradation
- emit or filesystem safety for generators and CLIs

Questions to ask:

- "What should the caller see when validation, auth, storage, or dependency
  calls fail?"
- "Which operations must be idempotent?"
- "Can partial work be observed, retried, or rolled back?"
- "What concurrency issue is most likely to corrupt state or output?"
- "Which stale read is acceptable, and which stale read is unsafe?"

## Evolution Notes

Record architecture facts that shape future work but are not active contracts
yet. This section is for known constraints, deferred surfaces, migration
direction, and deliberate omissions. Keep it short and delete it when it stops
helping.

Questions to ask:

- "What future architecture path is intentionally deferred?"
- "Which current simplification should not be mistaken for a permanent
  constraint?"
- "Which integration, CLI, worker, queue, cache, or public API is out of scope
  for the current version?"
- "What would force this architecture to change?"

## Filled Document Standard

A finished project-specific `ARCHITECTURE.md` should pass this check:

- The overview names the system type, callers, primary data, and output.
- The architecture diagram matches the real runtime or execution shape.
- The core flow traces the most important path from input to output.
- Components have clear ownership and dependency direction.
- Public and internal interfaces are separated.
- Resources, identifiers, states, and transitions are concrete.
- Ownership or tenancy is explicit, even for local-only and single-user systems.
- Caller-visible data and internal-only data are both named.
- Reliability semantics cover duplicate requests, failures, races, and partial
  work where relevant.
- The document contains no unresolved questions, template instructions, or
  generic examples that read as final project facts.
