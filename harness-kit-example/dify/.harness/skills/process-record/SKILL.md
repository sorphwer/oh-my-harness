# Process Record

Phase: record

Triggers:
- harness change
- workflow change

Requires:
- review summary

Outputs:
- change log entry

Gates:
- Record process change (recommended): record-process-change

Instructions:
- Record durable process or harness changes in `.harness/changes/CHANGELOG.md`.
- Keep entries short and focused on why the process changed.
- Do not log routine implementation work unless the user or project asks for it.
