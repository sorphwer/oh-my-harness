# Design Overview

This document summarizes the design philosophy of the project. For concrete design decisions, see the detailed design docs under `design-docs/`.

## Design Philosophy

State the project's design priorities in 3-5 ordered bullets. The order matters — it's how you tiebreak when two priorities conflict.

Example shape (replace with your own):

1. Minimal operational burden
2. Security by default
3. Fast paths for the most common task
4. Boundaries that are simple to reason about
5. Operator-first interface design

## Interface Design Principles

These principles generalize across most internal-tool / SaaS / dashboard projects. Keep, remove, or extend per project.

- **Content above the fold.** The user should see the data or form they came for without scrolling past decorative headers.
- **Compact navigation.** A single top bar (56–64 px) carries the product name, navigation, and user context. No oversized hero sections on internal tools.
- **Task-oriented language.** All user-facing text describes what the user can do, not what the development team built. No "Phase N" references, no internal terminology.
- **State badges for states.** Reserve status-tag styling for actual lifecycle states and real status indicators. It is not a section heading.
- **Typography as hierarchy.** Section structure comes from heading levels and spacing, not from decorative pill labels.
- **Progressive disclosure.** Long forms group fields into collapsible sections. Optional or advanced fields start collapsed.
- **Back navigation.** Every sub-page provides a clear path back to the parent.
- **Graceful degradation.** Loading skeletons, error boundaries, and empty states are required for every async surface.

## Core Pattern

State the dominant control-flow pattern in one short block. Examples:

- *Stateless request handler*: validate → persist → respond.
- *Stateful relay*: receive → store → notify external → wait → continue.
- *Batch worker*: claim → process → ack.

The intent is to give a new contributor (or agent) a one-glance answer to "how does data move through this codebase?".

## Tenancy

If the product is multi-tenant, state:

- which entity defines the boundary
- where the active tenant is resolved (auth context, URL param, header)
- which routes accept tenant selectors from clients vs derive them server-side
- whether the UI exposes a switcher

If single-tenant, say so explicitly in one line so the reader is not left guessing.

## Key Design Patterns

Document the small set of recurring patterns that callers / contributors should recognize. Some examples:

### One key = one resource

If your API uses scoped API keys, state the binding rule plainly.

### Shared template / config syntax

If multiple operator-configured surfaces share a template language, state it once here and link.

### Asymmetric actions

If certain user actions require modals while others are direct, state the rule once.

### Lazy state evaluation

If any state transitions happen on read (instead of via cron), document the trigger and the reasoning.

## Data Returned to Callers

List the fields exposed in the primary read response. Keep this minimal — shrinking the surface is cheap; growing it later is expensive.
