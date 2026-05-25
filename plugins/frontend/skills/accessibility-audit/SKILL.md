---
name: accessibility-audit
description: Use when reviewing or hardening a web interface for keyboard use, focus management, semantic structure, contrast, labels, reduced motion, and assistive technology behavior.
---

# Accessibility Audit

## Review Areas

1. Keyboard: every interactive element is reachable, visible on focus, and operable without a mouse.
2. Semantics: buttons, links, headings, form fields, tables, and landmarks use the correct native elements.
3. Names: icon buttons and form controls have accessible names that match their purpose.
4. State: expanded, selected, invalid, busy, and disabled states are exposed when custom UI requires it.
5. Contrast: text, focus rings, controls, and status indicators remain readable in each theme.
6. Motion: custom animation respects `prefers-reduced-motion`.
7. Errors: validation messages identify the field and the recovery action.

## Output

Report issues as user impact first, then file/line, then fix. Mention verification method, such as keyboard walkthrough, browser accessibility tree, or automated scan.

## Avoid

Do not replace native controls with custom elements unless the custom behavior is necessary and fully accessible.
