# Frontend Overview

This document is a scaffold for capturing frontend conventions for a project.
It should help an agent gather enough concrete answers to later rewrite
`FRONTEND.md` as a project-specific frontend guide with the same granularity as
a completed harness document.

The filled document should describe the actual human-facing surface: technology,
routes or screens, component boundaries, data and auth flow, visual direction,
interaction states, copy rules, accessibility expectations, and frontend scope
limits. It is not a marketing brief and it should not be a backlog.

## How To Ask The User

Inspect the repository before asking. Use existing routes, components, styles,
framework config, screenshots, issues, product docs, and harness docs as the
first source of truth. Ask the user only for decisions or facts that are not
available in the repo.

Ask one question at a time when the answer can change the next question. Prefer
multiple-choice options for tradeoffs such as framework choice, design density,
theme direction, and data-refresh behavior. Use open-ended questions when
asking about the product domain, primary workflow, or brand personality.

Before writing the final version, gather answers for these topics:

- whether the project has a web, mobile, desktop, CLI, document, or no frontend
- the primary users and the tasks they repeat most often
- the framework, language, styling system, and icon library
- the route, screen, or view structure
- the authenticated, public, admin, and error surfaces
- the main layout shell and navigation model
- the component folder boundaries and naming conventions
- where data is loaded, mutated, cached, refreshed, and invalidated
- how loading, empty, error, denied, offline, and destructive states behave
- the default theme, typography, spacing, color, icon, and surface rules
- responsive breakpoints and accessibility requirements
- animation and motion rules, including reduced-motion behavior
- content language rules and internal terms that must not appear in the UI
- explicit V1 or current-release frontend boundaries

Good opening questions:

- "Does this project currently have a human-facing frontend, or is the primary
  interface a CLI, API, generated document, or compiler output?"
- "Who uses the interface most often, and what are they trying to finish
  quickly?"
- "Which screen or flow should feel most polished and predictable?"
- "What frontend stack is already chosen, and which parts are still decisions?"
- "Should the interface optimize for dense repeat work, guided onboarding,
  visual storytelling, or another mode?"
- "Which states or user actions are risky enough to need confirmation,
  permission checks, or extra clarity?"
- "What terms should appear in the UI, and what internal implementation terms
  should never be visible to users?"

When the answers are vague, ask for one concrete flow. A useful flow names the
actor, starting screen, action, data shown, success state, and failure state.

## Current Frontend Surface

State what frontend exists today. If the project has no product frontend, say so
clearly and describe the nearest human-facing surface, such as CLI output,
generated documents, local preview pages, admin screens, or public docs.

A filled version should answer:

- what users can open or run today
- which surfaces are production, demo, experimental, or future
- which files or folders define the current surface
- which frontend decisions are already fixed
- which decisions are intentionally deferred

Questions to ask:

- "What can a user actually see or interact with right now?"
- "Is the current surface meant for customers, operators, developers, reviewers,
  or only internal testing?"
- "Should future frontend work extend the existing surface or introduce a new
  one?"

## Technology

List the chosen frontend stack and the rules for using it. Include framework,
router, language mode, styling system, component library, icon library, form
strategy, test tools, and data-refresh libraries when they exist.

Prefer concrete commitments over lists of options. If a choice is not made,
record how the project will decide instead of leaving competing options in the
filled document.

Questions to ask:

- "Which framework and router are canonical for this project?"
- "Is TypeScript required, and how strict should it be?"
- "Which styling system owns design tokens and component styles?"
- "Is there an existing component library to follow or avoid?"
- "Which icon library should be used everywhere?"
- "Are client-side data libraries allowed, and only for which cases?"
- "What test tool proves the frontend contract?"

## Application Structure

Document the route, screen, or view layout as a tree. Keep it close to the real
file structure so an agent can navigate the code quickly.

A filled version should name:

- root layout and global styles
- public routes
- authenticated or app-shell routes
- admin or operator routes
- loading and error boundaries
- not-found behavior
- feature routes and colocated actions
- shared layout, navigation, and shell components

Questions to ask:

- "What are the top-level routes or screens?"
- "Which routes share the same layout shell?"
- "Which routes are public, authenticated, admin-only, or internal?"
- "Where do loading, error, and not-found states live?"
- "Which actions or mutations should be colocated with a route?"

## Pages And Primary Flows

Document each top-level page or screen in its own subsection. For each one,
state the purpose, layout zones, data shown, primary action, empty state,
loading state, error behavior, and refresh behavior.

Use the user's domain language. Avoid generic names when the product has real
objects, states, and actions.

Questions to ask:

- "Which pages are users expected to visit every day?"
- "What is the primary action on each page?"
- "What information must be visible without opening a detail view?"
- "What does the first-use or empty state invite the user to do?"
- "What happens after create, edit, delete, publish, archive, approve, or other
  state-changing actions?"
- "Which pages must be fast because they are used repeatedly?"

## Component Architecture

Describe how components are organized and where new UI should go. The filled
document should make the boundary between primitives, feature components,
layout components, and page-only components obvious.

Useful categories:

- UI primitives such as button, input, dialog, menu, badge, and table
- feature components that know the product domain
- layout components such as sidebar, top bar, container, and breadcrumbs
- client islands for interactivity that cannot stay server-rendered
- page-local components that should not be reused yet

Questions to ask:

- "Which component folder contains primitives, and what makes a component
  primitive enough to live there?"
- "Where should product-specific components live?"
- "Which components are allowed to fetch data or call mutations?"
- "When should a component become shared instead of staying page-local?"
- "Which existing component patterns should future work preserve?"

## Data, Auth, And State Flow

State how frontend data moves from source to screen and back. Include auth,
authorization, server rendering, client islands, forms, optimistic updates,
cache invalidation, and refresh rules when they apply.

A filled version should make the default path clear enough that contributors do
not invent a second data path for convenience.

Questions to ask:

- "Where is the active user, account, workspace, project, or tenant resolved?"
- "Which pages fetch data on the server, and which need client-side refresh?"
- "How are mutations submitted?"
- "What invalidates or refreshes stale data?"
- "Are optimistic updates allowed, and for which actions?"
- "Where are permission failures handled?"
- "Which data must never be rendered to the browser?"

## Visual Direction

Capture the visual system in concrete rules. The filled document should guide
spacing, density, typography, color, surfaces, icon usage, and hierarchy without
requiring a separate design review for every small change.

Cover these areas when they apply:

- layout density and page width
- navigation position and behavior
- theme default and theme switching
- typography scale and heading style
- spacing rhythm
- border radius and border weight
- shadows, elevation, and surface treatment
- primary accent color and semantic status colors
- icon library, sizes, and placement
- card, table, list, form, modal, and empty-state conventions

Questions to ask:

- "Should the interface feel dense and operational, calm and editorial,
  playful, sales-oriented, or another mode?"
- "What is the default theme?"
- "Which color is reserved for primary actions?"
- "Which colors represent success, warning, danger, info, and neutral states?"
- "How rounded, flat, bordered, or elevated should surfaces be?"
- "Which UI patterns should be avoided because they do not fit the product?"

## Responsive And Accessibility Rules

Document the minimum responsive and accessibility expectations. The filled
document should say how navigation, tables, grids, forms, dialogs, and dense
views adapt on small screens.

Questions to ask:

- "Which viewport sizes must be first-class?"
- "Does the product need mobile creation flows, mobile read-only access, or
  desktop-first operation?"
- "How should wide tables or dense lists behave on mobile?"
- "What keyboard flows must work?"
- "What focus, contrast, label, and announcement rules are required?"
- "Are there localization or long-text requirements that affect layout?"

## Interaction States And Motion

Record how interactive states behave. Include hover, active, focus, disabled,
loading, saving, success, error, empty, denied, destructive, and offline states
when relevant.

Motion should support comprehension. Define durations and easing only when the
project needs animation, and always state reduced-motion behavior.

Questions to ask:

- "Which actions need immediate feedback?"
- "What should happen while saving or loading?"
- "Which destructive actions need confirmation?"
- "Should updates appear instantly, after server confirmation, or after a full
  refresh?"
- "Which animations help the user understand state changes?"
- "Should custom motion be disabled when the user prefers reduced motion?"

## Content Language

State the language rules for user-facing copy. The filled version should make
labels, buttons, headings, empty states, errors, and destructive actions sound
consistent.

Questions to ask:

- "Should UI copy be formal, direct, friendly, technical, or highly concise?"
- "Which product nouns and verbs are canonical?"
- "Which internal terms should never appear in the interface?"
- "How should errors explain what happened and what the user can do next?"
- "What exact labels should be used for risky actions?"

## Frontend Boundaries

State what is out of scope for the current release or phase. This prevents an
agent from silently expanding the frontend while making a small change.

Useful boundary categories:

- no web UI yet
- no mobile app
- no realtime updates
- no advanced role editor
- no dashboard analytics
- no theme switcher
- no drag-and-drop editor
- no client-side data cache outside named islands
- no design-system extraction beyond current components

Questions to ask:

- "What should future contributors explicitly avoid adding in this phase?"
- "Which attractive feature would make the frontend too large right now?"
- "Which decisions are deferred until after the current release?"
- "Which existing surface should remain intentionally boring or minimal?"

## Completion Check

A finished project-specific `FRONTEND.md` should pass this check:

- The current frontend surface is explicit, including when there is no product
  frontend.
- The technology choices are concrete and do not list undecided alternatives as
  final facts.
- The route or screen structure maps to real project files.
- The main pages or flows describe purpose, layout, data, states, and refresh
  behavior.
- Component boundaries tell contributors where new UI belongs.
- Data, auth, and state flow have one default path.
- Visual direction includes density, typography, color, surfaces, icons, and
  common UI patterns.
- Responsive and accessibility expectations are stated.
- Interaction states and motion behavior are defined enough to implement.
- User-facing language rules name real product nouns, verbs, and forbidden
  internal terms.
- Frontend boundaries prevent scope creep.
- The document contains no unresolved questions, placeholder text, or generic
  examples that read as final project facts.
