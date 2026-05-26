# Use Case: Ticket Table

Use this when rows follow ticket/issue semantics: `ID`, `Priority`, `Status`, `Assignee`, `Updated`, `Topic`.

## Load These Files

1. `references/compact-ticket-template.md`
2. `references/compact-ticket-spec.template.json`

## Layout Guidance

- Keep six standard columns in a stable order.
- Use `Badge` for `Priority` and `Status`.
- Keep deterministic widths for consistent snapshots.
- Enable `screenshot.fullPage=true` if row count or wrapping is variable.
