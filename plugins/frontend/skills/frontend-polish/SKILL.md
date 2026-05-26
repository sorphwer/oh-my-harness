---
name: frontend-polish
description: Use when doing a final quality pass on an existing frontend to improve spacing, hierarchy, alignment, color, motion, responsiveness, and visual consistency.
stage: [implement]
---

# Frontend Polish

## Checklist

- Visual hierarchy: one clear primary action and readable scan path.
- Spacing: consistent gaps, no accidental crowding, no nested-card clutter.
- Typography: display sizes only where the layout can carry them; compact controls stay compact.
- Color: avoid one-note palettes; reserve semantic colors for semantic meaning.
- Interaction: hover, focus, disabled, loading, and error states feel intentional.
- Motion: short and purposeful; respect reduced motion.
- Responsive behavior: mobile and wide desktop both preserve intent.

## Process

Inspect the screen in the browser, make the smallest coherent set of style changes, then verify screenshots or live behavior again. Prefer improving the existing system over introducing a parallel design language.

## Avoid

- Do not add decorative blobs, generic gradient hero art, or oversized marketing composition to product tools.
- Do not describe UI features with visible instructional copy when familiar controls are enough.
