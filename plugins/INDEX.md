# Plugin Inventory

This inventory is the current source snapshot for harness-kit plugin resources.
Skills stay under their owning plugin; stages are retrieval and coverage
metadata.

Compiler v1 uses this tree only to validate selected plugin ids and generate
`PLUGINS.md`. It does not yet copy plugin skill, agent, or rules bodies. The
current v1 docs treat plugins as first-class resources; the future resource
identities remain plugin-scoped: `plugin.skill`, `plugin.agent`, and
`plugin.rules`.

Deprecated v0 pool layouts (`docs-pool`, `catalog`, `skills-pool`,
`agents-pool`, `hooks-pool`, and permission pools) must not be reintroduced.

## Resource Counts

| Resource | Count | Notes |
|---|---:|---|
| Skills | 83 | Every `SKILL.md` has explicit `stage` frontmatter. |
| Skill-local agents | 39 | `skills/<skill>/agents/openai.yaml`; inherits parent skill stage. |
| Top-level hooks | 0 | No `plugins/*/hooks/*` resources currently exist. |
| Top-level agents | 0 | No `plugins/*/agents/<name>.md` resources currently exist. |
| MCP resources | 1 | `computer-use`; indexed, not coverage-eligible. |

## Coverage Summary

| Stage | Coverage-eligible plugins |
|---|---|
| `intent` | `planning`, `codex-user-skills`, `superpowers` |
| `spec` | `backend`, `codex-security`, `codex-system-skills`, `codex-user-skills`, `planning`, `security-review`, `superpowers` |
| `plan` | `planning`, `superpowers` |
| `explore` | `browser`, `codex-security`, `codex-system-skills`, `codex-user-skills`, `computer-use`, `debugging`, `github`, `security-review`, `superpowers` |
| `implement` | `backend`, `codex-security`, `codex-system-skills`, `codex-user-skills`, `computer-use`, `delivery`, `documents`, `frontend`, `github`, `planning`, `presentations`, `security-review`, `spreadsheets`, `superpowers` |
| `verify` | `backend`, `browser`, `codex-security`, `codex-system-skills`, `codex-user-skills`, `computer-use`, `debugging`, `delivery`, `documents`, `frontend`, `github`, `planning`, `presentations`, `security-review`, `spreadsheets`, `superpowers` |
| `review` | `codex-security`, `codex-user-skills`, `delivery`, `github`, `security-review`, `superpowers` |
| `deliver` | `codex-user-skills`, `delivery`, `documents`, `github`, `presentations`, `spreadsheets`, `superpowers` |
| `freestyle` | `codex-user-skills`, `superpowers` |

## Full Assignment Table

The assignment table in `.harness/docs/superpowers/plans/2026-05-26-plugin-stage-matrix.md`
is the historical edit list for the stage metadata migration. Treat
`src/stages.ts` and this inventory as the current entrypoints.
