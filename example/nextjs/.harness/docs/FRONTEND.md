# Frontend Conventions

This document captures frontend conventions for the project. The goal is consistency, not novelty — pick conventions and stick to them.

## Technology

- Next.js App Router
- TypeScript
- Tailwind CSS with CSS variables for theme tokens
- Auth.js (NextAuth v5) via session cookies
- System font stack by default; switch to a custom font only with an explicit decision recorded in `design-docs/`
- Use a client-only data-refresh library (e.g. SWR or React Query) only inside isolated "refresh islands," never as the primary data path

## Page Structure

```text
src/app/
├── layout.tsx                  # root layout, metadata, theme provider
├── globals.css                 # theme tokens, base styles
├── not-found.tsx               # branded 404
├── login/
│   ├── page.tsx
│   ├── auth-form.tsx
│   └── actions.ts              # sign-in / sign-up / sign-out server actions
└── (app)/
    ├── layout.tsx              # authenticated shell (top bar, nav)
    ├── loading.tsx             # skeleton loader for the authenticated tree
    ├── error.tsx               # error boundary for the authenticated tree
    ├── page.tsx                # primary dashboard
    └── <resource>/
        ├── new/page.tsx
        ├── [id]/page.tsx
        └── actions.ts          # CRUD server actions for the resource
```

Use route groups (`(app)`) to share layout without affecting URLs. Keep server actions colocated with the page they serve.

## Pages

Document each top-level page in its own subsection with: purpose, layout, and the data it loads. Keep the description focused on what the user sees and the data shape, not implementation. Example skeleton:

### Dashboard (`/`)

- one-line purpose
- key layout zones (left / middle / right)
- empty state behavior
- what triggers a refresh

### Login (`/login`)

- centered single-card layout
- product name + tagline + form
- post-auth redirect target

### Resource Create / Edit (`/<resource>/new` and `/<resource>/[id]`)

- form sections with `h3` headings, not pill labels
- a stepper only if the form is genuinely long; otherwise a single scrollable form
- save behavior (server action vs client submission)
- delete and other destructive actions require confirmation

## Component Architecture

```text
src/components/
├── ui/                         # primitives (button, input, card, status-tag)
├── <feature>/                  # feature-scoped composite components
└── layout/                     # nav, top bar, sidebar
```

Keep primitives unopinionated. Push composition into feature folders so they can change independently.

## Auth Flow

```text
Request -> middleware -> validate session
  -> unauthenticated: redirect to /login
  -> authenticated: resolve user context
  -> authorized: render page
```

Centralize session validation in middleware; do not duplicate session checks in individual pages.

## Data Flow

- Server components fetch from the database directly
- Mutations go through server actions, not client-side fetch
- For management surfaces that need a refresh (focus / reconnect), wrap a small client island with SWR and feed it server-rendered `fallbackData`
- Avoid polling

## Visual Direction

### Layout

- compact top bar: product name, navigation, user dropdown (56–64 px)
- max-width container with generous horizontal padding
- no wrapper cards around top-level page content; use direct headings and spacing
- back navigation on sub-pages

### Theme

- pick light or dark as the default and commit
- system font stack unless a design decision says otherwise
- one accent color for primary CTAs; reserve it strictly for that role
- semantic colors (amber, rose, emerald, sky) for status indicators only

### Surfaces

- flat by default: no backdrop-blur, no box-shadow unless explicitly motivated
- 1 px borders using a subtle tone
- standardized border-radius: small for inputs/buttons, slightly larger for panels

### Typography

- compact sizing: body 13–14 px, labels 11–12 px, titles 20–24 px
- headings: `font-semibold tracking-tight`, no internal-phase language
- sentence case throughout

### Icons

Pick one icon library and use it everywhere. Document the chosen sizes (e.g. 14 px inline, 16 px standard, 20 px section heading, 24 px empty state).

### Status Tags

If the product has lifecycle states, map each state to a tone + icon and document the mapping in `QUALITY_SCORE.md` so design and engineering reference the same source.

### Interactions

- hover: subtle background shift on interactive elements
- focus: visible focus ring on every interactive element
- transitions: 150 ms for hover/focus, 200–300 ms for entrance animations
- loading: flat skeleton blocks (no shimmer unless motivated)
- empty states: contextual icon + message + primary CTA

### Motion

Define easing curves and entrance keyframes once, in CSS, and reuse. Always disable custom animations under `@media (prefers-reduced-motion: reduce)`.

### Content Language

- task-oriented, user-facing copy
- no "Phase N" references in UI
- no internal architecture terminology in UI
- active voice, direct language
- sentence case for headings

## V1 Boundaries

State explicitly what is *out* of scope for V1 so the agent does not silently expand the surface area:

- no real-time streaming updates
- no advanced RBAC editor
- no organization switcher
- (extend per project)
