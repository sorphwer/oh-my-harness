---
name: frontend-implementation
description: Use when building or changing a user-facing web page, component, dashboard, tool, form, or interactive application.
stage: [implement]
---

# Frontend Implementation

## Workflow

1. Inspect the existing UI stack, component library, design tokens, routing, and data flow.
2. Build the real usable screen or workflow first, not a marketing placeholder.
3. Match the app's density and intent. Operational tools should be quiet, scannable, and efficient.
4. Use established primitives before inventing new visual patterns.
5. Implement loading, empty, error, disabled, focus, and narrow-screen states.
6. Verify in a browser at desktop and mobile widths.

## UI Rules

- Prefer icons for common tools and text labels for clear commands.
- Keep page sections unframed; reserve cards for repeated items, modals, and real panels.
- Use stable dimensions for boards, toolbars, counters, and tiles.
- Ensure text never overlaps, clips awkwardly, or depends on viewport-width font scaling.

## Output

Summarize the changed surface, state any test/browser verification, and call out known gaps.
