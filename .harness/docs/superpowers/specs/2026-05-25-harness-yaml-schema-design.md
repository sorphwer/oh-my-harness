# harness.yaml Schema & Resource Model — Design

Date: 2026-05-25
Status: deprecated

> **DEPRECATED — historical only.** This schema spec records an intermediate
> transition away from `catalog/`, `agents-pool/`, `hooks-pool`, and
> `skills-pool/`. Current work uses the accepted compiler v1 design:
> [`2026-05-27-yaml-to-harness-compiler-v1-design.md`](2026-05-27-yaml-to-harness-compiler-v1-design.md).
> In current v1 docs, plugins are first-class and the minimal prototype already
> exists in `src/compile.ts`.

> Historical note: this spec was later extended by the
> [`plugin-stage matrix spec`](2026-05-26-plugin-stage-matrix-design.md)
> (2026-05-26). That matrix remains useful as future IR direction, but this
> yaml schema is not the active compiler contract.

Historical note: this file originally superseded the "Yaml Schema (v0)" section
of `2026-05-25-mvp-development-design.md`. It is now superseded by the
2026-05-27 compiler v1 design and should not be used as the active yaml
contract.

## Goal

Define the long-lived shape of `harness.yaml` so that:

- yaml only carries what's project-specific. Defaults that ship with harness-kit do not appear as `values`.
- Reusable capabilities are organized as **plugins** — self-contained bundles that ship skills, agents, hooks, workflows, MCP resources, docs, and a permissions block as needed. The plugin is also the unit the (post-v0) LLM frontend picks from.
- A typical project's yaml fits in roughly 20–30 lines and reads top-to-bottom as "who this project is + what stack it's on + what extras it needs beyond the defaults."

## North Star

> yaml describes the customized part of a project. Defaults come from a `preset`. A preset is just a list of plugins.

Consequences:

1. There is no `docs: [...]` list in yaml. Which harness docs render is determined by which plugins are enabled (a plugin can ship `docs/<name>/{manifest.ts, template.md}`).
2. There is no `additional-skills` / `additional-docs` at the top level. Anything beyond the preset goes under a single `extras:` namespace.
3. There is no separate `catalog/` or `agents-pool/` or `hooks-pool/`. All such resources live inside `plugins/<plugin>/`.

## Resource Model

Two kinds of compile-time inputs:

1. **Plugins** — self-contained bundles. Each plugin can contribute any combination of skills, agents, hooks, workflows, MCP resources, docs, and a permissions block. The plugin is the unit the yaml lists (via `preset` or `extras.plugins`) and the unit the LLM frontend picks from (via `plugins/*/README.md`).
2. **References** — free-form per-project files (LLM-readable). Either pool ids from `references-pool/` when that pool exists, or filesystem paths supplied by the user in `harness.yaml`.

### Plugin directory layout

```
plugins/<plugin>/
  README.md                                # required
  skills/<name>/SKILL.md                   # optional, 0..N  (frontmatter `name` + `description`; body is the skill instructions)
  agents/<name>.md                         # optional, 0..N
  hooks/<name>.json                        # optional, 0..N
  workflows/<name>.md                      # optional, 0..N
  mcp/<name>.json                          # optional, 0..N
  docs/<name>/{manifest.ts, template.md}   # optional, 0..N
  permissions.json                         # optional, 0..1
```

Every subdirectory and every file is optional except `README.md`. The shape of a plugin is determined by which subdirs/files exist. Examples (on disk today):

Only `docs/<name>/{manifest.ts, template.md}` pairs are compiler-rendered doc
contributions. Other plugin-local documentation copied from upstream plugins
(for example `plugins/browser/docs/capabilities/*`) is auxiliary reference
material and is ignored by the compiler unless a future spec promotes it.

- **Multi-skill plugin** (`plugins/planning/`): `README.md` + `skills/{brainstorming,spec-first-planning,test-driven-development}/SKILL.md`.
- **Single-skill plugin** (`plugins/debugging/`): `README.md` + one `skills/systematic-debugging/SKILL.md`.
- **Stack plugin** (planned `plugins/nextjs/`): `README.md` + `docs/*` + `permissions.json`.
- **Full plugin** (hypothetical): `README.md` + everything.

### Plugin contribution → output mapping

| Source inside a plugin | Output destination |
|---|---|
| `README.md` | not emitted (consumed by the LLM frontend and humans only) |
| `skills/<name>/SKILL.md` | aggregated across all enabled plugins into `<outDir>/SKILLS.md` (frontmatter supplies name + description; body is the skill instructions) |
| `agents/<name>.md` | copied to `<outDir>/.claude/agents/<name>.md` |
| `hooks/<name>.json` | merged across all enabled plugins into `<outDir>/.claude/settings.example.json`'s `hooks` block |
| `workflows/<name>.md` | copied to `<outDir>/workflows/<plugin>-<name>.md` |
| `mcp/<name>.json` | merged across all enabled plugins into `<outDir>/mcp/config.json` |
| `docs/<name>/{manifest.ts, template.md}` | eta-rendered with yaml params, written to `<outDir>/<manifest.outputPath>` |
| `permissions.json` | merged across all enabled plugins into `<outDir>/.claude/settings.example.json`'s `permissions` block |

### References

References are not part of any plugin. They live in `references-pool/` once
shared reference fixtures exist, or are referenced by path in the yaml
(project-local files, drag-and-drop in the future UI). All references emit to
`<outDir>/docs/references/<basename>`.

## Plugin README

`plugins/<plugin>/README.md` is the source of truth for what the plugin contributes. It is consumed by:

- the (post-v0) LLM frontend, which enumerates `plugins/*/README.md` to build a selection table;
- humans who run `ls plugins/` and want to know what's there;
- `plugins/INDEX.md`, the current compact inventory and stage coverage summary.

The README is plain markdown — no required frontmatter in v0. A recommended structure (not enforced):

```markdown
# <plugin id> — <one-line summary>

## What it contributes

- Skills: <comma-separated list, or "none">
- Agents: <list, or "none">
- Hooks: <list, or "none">
- Workflows: <list, or "none">
- MCP: <list, or "none">
- Docs: <list of output paths, or "none">
- Permissions: <"yes" or "no">

## When to use

<a paragraph or two: what kind of project this is for, what assumptions it makes>
```

The compiler does not read `README.md` and does not enforce its shape. Current plugin inventory is summarized in `plugins/INDEX.md`; we'll formalize the README format only if/when the LLM frontend needs more structure.

## Preset

A preset is a named list of plugin ids:

```ts
type Preset = string[];   // e.g., ["superpowers", "code-review", "nextjs"]
```

That's all. Docs and permissions are not preset fields — they ride along inside whichever plugin contributes them.

Presets live in `presets/<name>.ts` (post-v0). For v0 they are hardcoded in `src/compile.ts`. Exactly one preset exists in v0: `nextjs`, expanding to `["superpowers", "code-review", "nextjs"]`.

## LLM Frontend (informational, post-v0)

The LLM frontend works like this:

```
NL intent
   │
   ▼  enumerate plugins/*/README.md → { id, summary, contributes }
   │
   ▼  LLM picks a preset + extras.plugins
   │
   ▼  LLM emits harness.yaml
   │
   ▼  deterministic compiler → .harness/
```

The compiler itself never calls an LLM. The LLM frontend is just one of several authoring paths — humans can write the yaml directly, and the compiler is identical either way.

## Yaml Shape

```yaml
preset: nextjs                # required: names a list of plugins

name: acme-notes              # required: slug
displayName: Acme Notes       # required: human title
overview: |                   # required: free-form paragraph
  Single-user Next.js notes app...

stack:                        # required: structured stack facts used by doc templates
  framework: nextjs-16
  database: postgres-neon
  orm: drizzle
  auth: authjs-magic-link
  validation: zod
  deploy: vercel-fluid

contract:                     # required: product-contract facts used by doc templates
  tenancy: single-user
  publicIdFormat: note_{ulid}
  lifecycleField: state
  lifecycleValues: [DRAFT, PUBLISHED, ARCHIVED]
  publicReadPath: /n/{note_id}

references:                   # optional: explicit per-project reference list
  - auth-js-llms              #   pool id (resolves to references-pool/auth-js-llms.*)
  - ./team-style.md           #   or a path relative to the yaml file

extras:                       # optional: anything beyond what the preset already gives
  plugins: [my-corp-style]    # additional plugin(s) (pulls in everything they ship)
  skills:  [other-plugin:special-skill]   # individual skills, addressed as <plugin>:<name>
  agents:  [my-plugin:domain-reviewer]    # individual agents
  hooks:   [my-plugin:prevent-secrets-commit]  # individual hooks
  workflows: [my-plugin:release]           # individual workflows
  mcp: [my-plugin:browser]                 # individual MCP configs
```

When no extras are needed, the entire `extras:` block is omitted.

Individual extras items (`extras.skills`, `extras.agents`, `extras.hooks`, `extras.workflows`, `extras.mcp`) reference resources inside a plugin via `<plugin>:<name>`. The compiler looks them up in `plugins/<plugin>/skills/<name>/SKILL.md`, `plugins/<plugin>/agents/<name>.md`, `plugins/<plugin>/hooks/<name>.json`, `plugins/<plugin>/workflows/<name>.md`, or `plugins/<plugin>/mcp/<name>.json` respectively. The plugin does NOT need to be enabled separately — naming the resource is enough to enable it.

## Zod Schema (v1)

```ts
// References are plain strings. Disambiguation happens in resolve():
//   leading "./", "../", or "/" → filesystem path (resolved relative to the yaml file)
//   anything else                → pool id (looked up in references-pool/)
const Extras = z.object({
  plugins: z.array(z.string()).default([]),
  skills:  z.array(z.string()).default([]),  // each entry is "<plugin>:<name>"
  agents:  z.array(z.string()).default([]),  // each entry is "<plugin>:<name>"
  hooks:   z.array(z.string()).default([]),  // each entry is "<plugin>:<name>"
  workflows: z.array(z.string()).default([]),  // each entry is "<plugin>:<name>"
  mcp:       z.array(z.string()).default([]),  // each entry is "<plugin>:<name>"
}).partial();

export const HarnessYaml = z.object({
  preset: z.enum(["nextjs"]),                // open up as presets are added

  name:        z.string(),
  displayName: z.string(),
  overview:    z.string(),

  stack: z.object({
    framework:  z.enum(["nextjs-16"]),
    database:   z.enum(["postgres-neon"]),
    orm:        z.enum(["drizzle"]),
    auth:       z.enum(["authjs-magic-link"]),
    validation: z.enum(["zod"]),
    deploy:     z.enum(["vercel-fluid"]),
  }),

  contract: z.object({
    tenancy:         z.enum(["single-user", "single-tenant", "multi-tenant"]),
    publicIdFormat:  z.string(),
    lifecycleField:  z.string(),
    lifecycleValues: z.array(z.string()),
    publicReadPath:  z.string().optional(),
  }),

  references: z.array(z.string()).default([]),

  extras: Extras.optional(),
});
```

Every enum stays narrow until a second fixture demands a new value. References accept both pool ids and paths so the future drag-and-drop UI can drop a file into the project without registering it in the pool.

## Resolution & Output

```
load   ─► parse + zod-validate yaml
        │
resolve ─► expand preset → plugin id list
        │  merge extras.plugins into the plugin set
        │  for each enabled plugin, walk plugins/<id>/{skills,agents,hooks,workflows,mcp,renderable docs,permissions.json}
        │    and add every present resource to the appropriate bucket
        │  for each extras.{skills,agents,hooks,workflows,mcp} entry, parse "<plugin>:<name>",
        │    load the single file, and add it to its bucket
        │  resolve each reference (pool id or path)
        │  fail loud on unknown plugin id, unknown <plugin>:<name>, unknown reference
        │
render  ─► eta-render each doc with stack/contract/derived params
        │  aggregate skills (across all enabled plugins + extras.skills) → SKILLS.md
        │  copy each agent file verbatim
        │  copy workflow files with plugin-prefixed names
        │  compose .claude/settings.example.json from:
        │    enabled plugin id list +
        │    merged permissions blocks (one per plugin that ships permissions.json) +
        │    merged hooks blocks
        │  merge MCP configs into mcp/config.json
        │  pass-through references as raw bytes
        │
emit    ─► write file map to outDir; never delete unrelated files
```

Permissions merging rule (v0): if two plugins both ship `permissions.json`, their `allow` and `deny` lists are concatenated and de-duplicated, preserving order from first-enabled-plugin onward. Conflicts (same string in both allow and deny) throw.

Hooks merging rule (v0): hooks JSON fragments are merged shallowly under the `hooks` key. Same-key collisions across plugins throw.

Output map:

| Source | Destination |
|--------|-------------|
| `plugins/<plugin>/docs/<name>/template.md` (rendered) | `<outDir>/<manifest.outputPath>` |
| aggregated `plugins/<plugin>/skills/*/SKILL.md` | `<outDir>/SKILLS.md` |
| `plugins/<plugin>/agents/<name>.md` | `<outDir>/.claude/agents/<name>.md` |
| `plugins/<plugin>/workflows/<name>.md` | `<outDir>/workflows/<plugin>-<name>.md` |
| merged plugin MCP configs | `<outDir>/mcp/config.json` |
| merged plugin permissions + plugin id list + merged hooks | `<outDir>/.claude/settings.example.json` |
| `references-pool/<id>.<ext>` or user path | `<outDir>/docs/references/<basename>` |

## Repo Layout

```
plugins/
  INDEX.md                  # compact current inventory and stage coverage summary
  planning/                 # multi-skill — intent capture, specs, plans, TDD
    README.md
    skills/
      brainstorming/SKILL.md
      spec-first-planning/SKILL.md
      test-driven-development/SKILL.md
  debugging/                # single-skill — root-cause investigation
    README.md
    skills/
      systematic-debugging/SKILL.md
  frontend/                 # multi-skill — frontend impl / polish / a11y
    README.md
    skills/
      frontend-implementation/SKILL.md
      frontend-polish/SKILL.md
      accessibility-audit/SKILL.md
  backend/                  # multi-skill — API design / changes / data integrity
    README.md
    skills/
      api-design/SKILL.md
      backend-change/SKILL.md
      data-integrity/SKILL.md
  delivery/                 # multi-skill — review (give/request/receive) / verify / finish
    README.md
    skills/
      code-review/SKILL.md
      requesting-code-review/SKILL.md
      receiving-code-review/SKILL.md
      verification-before-completion/SKILL.md
      finishing-branch/SKILL.md
  security-review/          # multi-skill — threat model / scan / fix
    README.md
    skills/
      threat-model/SKILL.md
      security-scan/SKILL.md
      fix-security-finding/SKILL.md
  ...                       # copied Codex plugin bundles and standalone-skill containers; see INDEX.md
  nextjs/                   # PLANNED stack plugin (created during v1 implementation)
    README.md
    docs/
      agent-guide/{manifest.ts, template.md}
      architecture/{manifest.ts, template.md}
      planning-conventions/{manifest.ts, template.md}
      product-sense/{manifest.ts, template.md}
    permissions.json

presets/                    # post-v0; for v0 hardcoded in src/compile.ts
  nextjs.ts

references-pool/
  auth-js-llms.txt          # planned; created when reference fixtures land

harness-kit-example/
  nextjs-acme/
    harness.yaml
    .harness/               # compiled output (round-trip test target)
```

For v0, `plugins/` is the active content directory and `plugins/INDEX.md`
summarizes the current copied inventory. `references-pool/` is created when
reference fixtures land; `presets/` stays hardcoded in `src/compile.ts` until a
second preset appears. The current plugin inventory includes the bootstrap
skills-only plugins plus copied Codex plugin bundles and standalone-skill
container plugins; the `nextjs` stack plugin is still planned for v1
implementation.

## Migration From the Pre-Redesign Layout

The pre-redesign layout had `catalog/`, `agents-pool/`, `hooks-pool/`, `docs-pool/`, and `permissions-pool/` as five top-level pool directories. The new layout collapses all five into `plugins/<plugin>/`. Concretely:

- `catalog/<plugin>/<skill>.json` → `plugins/<plugin>/skills/<skill>/SKILL.md`
- `catalog/<skill>.json` (built-in) → `plugins/<skill>/{README.md, skills/<skill>/SKILL.md}` (turn each built-in into a single-skill plugin)
- `agents-pool/<name>.md` → `plugins/<some-plugin>/agents/<name>.md`
- `hooks-pool/<name>.json` → `plugins/<some-plugin>/hooks/<name>.json`
- `docs-pool/<name>/...` → `plugins/<stack-plugin>/docs/<name>/...`
- `permissions-pool/<name>.ts` → `plugins/<plugin>/permissions.json`
- Preset shape `{ plugins, docs, permissions }` → `string[]` (plugin ids only).

The intermediate `skills-pool/<category>/<skill>/SKILL.md` + empty `agent-pool/` layout (the in-flight reshuffle before this spec landed) migrated as:

- `skills-pool/<category>/<skill>/SKILL.md` → `plugins/<category>/skills/<skill>/SKILL.md`
- `skills-pool/README.md` (per-category bullets) → one `plugins/<category>/README.md` per plugin
- `agent-pool/` (was empty) → removed; agents live inside whichever plugin ships them

yaml shape itself is unchanged from the previous draft (still `preset` + `name/displayName/overview` + `stack` + `contract` + `references` + optional `extras`). Only the on-disk content layout changed.

## Documents That Must Track This Spec

1. `.harness/docs/superpowers/specs/2026-05-25-mvp-development-design.md` — replace the "Yaml Schema (v0)" section with a forward-reference to this spec (already done in the previous pass; reconfirm the wording is still correct).
2. `.harness/docs/superpowers/plans/2026-05-25-harness-kit-mvp-v0.md` — already marked SUPERSEDED.
3. `.harness/docs/superpowers/plans/2026-05-25-harness-kit-mvp-v1.md` — rewrite against the plugin-centric layout (replace catalog/ and agents-pool/hooks-pool tasks with plugin-creation tasks; adjust all paths in resolve()/render() code).
4. `.harness/ARCHITECTURE.md` — collapse separate entity definitions (Skill / Agent / Hook / Docs / Permissions / Plugin) into a single Plugin entity that ships sub-resources; reflect the new pool list in the high-level diagram.
5. `.harness/AGENTS.md` — replace the planned content-pools list with `plugins/`, `presets/`, and a planned `references-pool/` note.
6. `harness-kit-example/nextjs-acme/harness.yaml` — no change needed (yaml shape unchanged).
7. `CLAUDE.md`, root `AGENTS.md` — no change needed (entry-point files; nothing references pool structure).

## Non-Goals (v1 of the schema)

- Per-project override of which docs a plugin renders (a plugin's `docs/` is all-or-nothing for now).
- `extras.docs` / `extras.permissions` override syntax. Defer until a project actually needs it.
- Plugin version pinning (`superpowers@^5`). v1 accepts plain plugin ids; pinning waits until plugin registry semantics are settled.
- Removing items from the preset. Adds-only in v1.
- Multi-stack presets (`preset: [nextjs, mobile]`). Single preset per project.
- Plugin manifest file (`plugins/<plugin>/plugin.json`). v0 derives a plugin's contributions purely from which subdirs/files exist; a declarative manifest can be added later.
- LLM frontend integration. Same as MVP spec — out of scope.

## Open Questions

- **Hook source format.** Are `plugins/<plugin>/hooks/<name>.json` entries full settings.json fragments, or do they declare hook type + script and the compiler wires them? Pick when the first hook lands.
- **Agent source format.** Is `plugins/<plugin>/agents/<name>.md` a literal Claude Code agent file (frontmatter + body), or a template parameterized by yaml fields? Pick when the first agent lands.
- **Reference path semantics.** Resolved relative to the yaml file, not the repo root. (Confirmed default; flagged here in case of later reversal.)
- **Plugin id namespace.** Bare `superpowers` vs `claude-plugins-official/superpowers`. Pick once the plugin registry shape is decided.
- **Permissions merge semantics.** v0 concatenates allow/deny across plugins and throws on collisions. Revisit if real-world usage needs richer rules.
