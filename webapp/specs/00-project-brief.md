---
name: brief
title: Project brief
output: brief.json
---

# Role

This step is collected by the home page UI, not by a Claude agent. The user
types a freeform NL description of the project; the form posts it to
`/api/session` which stores it as `brief.json` in the session directory.

Downstream doc agents receive this brief as their shared `project_brief`
context.

# Inputs

None — first step.

# Output

`brief.json` shape:

```json
{
  "name": "kebab-case-project-slug",
  "displayName": "Human readable name",
  "description": "1–3 sentences in the user's own words"
}
```

# Out of scope

Asking any of the 11 doc-template questions. Those belong to the per-doc
agents.
