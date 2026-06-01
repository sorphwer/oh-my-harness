# Design Overview

This document is a scaffold for capturing the design philosophy of a project.
It should help an agent gather enough concrete answers to later rewrite
`DESIGN.md` as a project-specific design overview with the same granularity as
a completed harness document.

The filled document should explain how product, interface, data, and caller
contracts fit together. It is not a visual style guide and it should not be a
list of implementation tasks.

## How To Ask The User

Start with the smallest set of questions that reveals tradeoffs. Ask one
question at a time when the answer can change the next question. Prefer
multiple-choice options when the user is choosing between tradeoffs, and use
open-ended questions when asking for the shape of the domain.

Before writing the final version, gather answers for these topics:

- the product or system purpose
- the primary user or caller
- the main object the system manages
- the dominant happy-path flow
- the state model or lifecycle, if any
- the ownership, tenancy, or permission boundary
- the public API, UI, CLI, or document surface exposed to callers
- the fields or data that must never leak across that surface
- the operational constraints that should win over convenience

Good opening questions:

- "What should this system optimize for when speed, safety, flexibility, and
  operational simplicity conflict?"
- "Who is the main user or caller, and what are they trying to finish quickly?"
- "What is the primary resource or object, and what states can it be in?"
- "What is the shortest successful path from input to useful output?"
- "Where is the boundary between one owner, tenant, workspace, account, or
  customer and another?"
- "Which data is safe to return to callers, and which data is internal only?"

When the answers are vague, ask for one concrete example. A useful example names
the actor, the object, the action, the expected output, and the failure behavior.

## Design Philosophy

Capture 3-5 ordered design priorities. The order is load-bearing: it explains
which principle wins when two good ideas conflict.

Each priority should be specific enough to guide an implementation decision.
Avoid slogans that could apply to any project. A good priority names both the
desired outcome and the tradeoff it is willing to make.

Questions to ask:

- "Which quality should win by default: speed, durability, privacy,
  explainability, extensibility, compatibility, cost, or operator control?"
- "What is the most expensive mistake this project could make?"
- "What constraint should future contributors preserve even when adding new
  features?"
- "What would you intentionally keep out of scope to protect the product shape?"

## Interface Design Principles

Describe the rules for every human-facing or caller-facing surface. For a web
app, this means navigation, layout density, copy, forms, and states. For an API,
CLI, library, or document harness, this means command shape, input validation,
error messages, naming, defaults, and output stability.

A filled version should state principles that a contributor can apply without
asking the original author. It should also explain when a principle does not
apply.

Questions to ask:

- "What is the first useful thing the user or caller should see or receive?"
- "Which actions need confirmation, and which should be direct?"
- "What language should the interface use for states and destructive actions?"
- "How should loading, empty, denied, invalid, and failed states behave?"
- "What should stay compact and repeatable because users do it often?"
- "Which internal terms should never appear in user-facing copy?"

## Core Pattern

State the dominant control-flow or data-flow pattern in one short block, then
explain it in a paragraph.

Examples of acceptable pattern shapes:

- `validate input -> persist change -> return response`
- `receive event -> normalize payload -> enqueue work -> record outcome`
- `load manifest -> resolve local resources -> render files -> emit output`
- `authenticate caller -> scope query -> transform result -> return safe fields`

The pattern should answer how work moves through the system. If there are
background jobs, scheduled jobs, streaming updates, cache refreshes, or
read-time state transitions, name them here.

Questions to ask:

- "What happens between the initial request, command, or event and the final
  output?"
- "Is the system mostly request-response, batch processing, event-driven,
  stateful workflow, or generated artifact output?"
- "Where does validation happen, and what happens when validation fails?"
- "Does any state change happen later, asynchronously, or on read?"
- "Which layers are wrappers, and which layer owns the actual behavior?"

## Tenancy And Ownership

State the boundary that prevents one actor from seeing or changing another
actor's data. If the project is single-tenant, say so explicitly. If the project
has no user data, state the closest equivalent boundary, such as repository,
workspace, environment, account, API key, document, or output directory.

A filled version should identify where the active boundary is resolved and
which client-supplied values are trusted, ignored, or rechecked server-side.

Questions to ask:

- "What entity owns data or actions: user, organization, workspace, repository,
  environment, API key, account, or another resource?"
- "Where is the active owner resolved: session, token, URL, header, config file,
  command argument, or runtime context?"
- "Can a client choose the owner, or is it always derived server-side?"
- "Does the UI expose a switcher, selector, or impersonation path?"
- "What query filter, path guard, or permission check protects the boundary?"

## Key Design Patterns

Document the small recurring patterns that future contributors should recognize
and reuse. Each pattern should have a short heading, a concrete rule, and one
sentence explaining why the rule exists.

Useful pattern categories include:

- state transitions and lifecycle rules
- public versus authenticated surfaces
- soft delete, archive, restore, and permanent delete behavior
- cache ownership and invalidation rules
- id format, routing, and durable URL rules
- form validation and server action rules
- error mapping and empty-state rules
- generated file, manifest, and local-resource resolution rules
- permission checks and tenant scoping rules

Questions to ask:

- "What rule repeats in more than one route, command, screen, or module?"
- "Which pattern would be dangerous if two contributors implemented it
  differently?"
- "Which behavior exists for product reasons rather than framework defaults?"
- "Which old pattern should future work avoid?"

## Data Returned To Callers

List the stable data exposed through the primary read path or output surface.
For UI-only projects, describe the data shown in the main view. For APIs, list
response fields. For CLIs and generators, list emitted files, exit behavior,
stdout shape, and error shape.

Keep the caller-visible surface small and explicit. It is easier to add data
later than to remove data that callers already depend on.

Questions to ask:

- "What is the primary read path or output surface?"
- "Which fields, files, or values are guaranteed to callers?"
- "Which internal fields must never be returned or rendered?"
- "Which error cases are part of the public contract?"
- "What should remain stable across refactors?"

## Completion Check

A finished project-specific `DESIGN.md` should pass this check:

- The design priorities are ordered and concrete.
- The main interface rules are actionable for the actual product surface.
- The core pattern explains the dominant flow in one glance.
- Tenancy or ownership is explicit, even when the answer is single-tenant.
- Key patterns are project-specific rather than generic advice.
- Caller-visible data is named, and internal-only data is named.
- The document contains no unresolved questions, template instructions, or
  generic examples that read as final project facts.
