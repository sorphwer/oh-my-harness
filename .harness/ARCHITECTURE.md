# harness-kit Architecture

## System Overview

harness-kit is a local yaml-to-folder compiler for project process docs. A user
writes `harness.yaml`; the compiler validates it, copies fixed harness
templates, composes a selected plugin inventory, and emits a deterministic
`.harness/` tree into a generated run directory under `outputs/`.

Compiler v1 is intentionally small. It already has a minimal runnable
prototype, and the current documentation model is v1: plugins are first-class.
The prototype proves the runnable path before adding resource projections for
plugin skills, agents, rules, references, `.claude` settings, stage indexes,
watch mode, or a packaged CLI.

## High-Level Architecture

```text
harness.yaml
    |
    v
+------------------------------+
| load                         |
|   parse yaml                 |
|   validate schema            |
| resolve                      |
|   check selected plugin ids  |
|   check 11 template files    |
| render                       |
|   byte-copy templates        |
|   compose PLUGINS.md         |
| emit                         |
|   write under outputs/ run   |
+------------------------------+
    |
    v
outputs/.harness-YYYYMMDD-HHMMSS-xxxx/
```

## Source Layout

```text
harness.yaml                         # root self-hosting manifest
src/compile.ts                       # compiler v1 implementation
.harness/templates/                  # fixed harness doc template sources
plugins/<id>/                        # selectable plugin source directories
harness-kit-example/compiler-v1/      # minimal fixture input
test/                                # compiler fixture tests
```

## Generated Output

Compiler v1 emits these fixed documents by copying source bytes from
`.harness/templates/`:

```text
AGENTS.md
ARCHITECTURE.md
docs/DESIGN.md
docs/FRONTEND.md
docs/OPERATIONS.md
docs/PLANS.md
docs/PRODUCT_SENSE.md
docs/QUALITY_SCORE.md
docs/RELIABILITY.md
docs/SECURITY.md
docs/UAT_CHECKLIST.md
```

It also emits:

```text
PLUGINS.md
```

`PLUGINS.md` is only an inventory. It lists selected plugin ids and points to
their source directories. It does not copy plugin resources yet.

## Harness Manifest

Current compiler v1 schema:

```yaml
name: oh-my-harness
displayName: harness-kit
plugins:
  - planning
  - delivery
  - debugging
```

Fields:

- `name` - stable project slug
- `displayName` - human-readable project name
- `plugins` - ordered plugin ids to list in `PLUGINS.md`

Unknown plugin ids fail before emit.

## Plugin Boundary

Top-level organization is plugin-first. A plugin is the first-class unit of
authoring, selection, and future resource projection:

```text
plugins/
  <plugin-id>/
    README.md
    skills/
    agents/
    rules/
```

The resource identity model is:

- `plugin.skill`
- `plugin.agent`
- `plugin.rules`

The exact schemas for skill, agent, and rules resources are not finalized.
Compiler v1 therefore does not copy those bodies into generated output.

Deprecated v0 pool directories such as `docs-pool`, `catalog`, `skills-pool`,
`agents-pool`, `hooks-pool`, and permission pools are historical material only.
Do not use them as source layout for new compiler work.

## Fixed Template Boundary

Fixed harness docs are not plugin resources. They belong to harness-kit itself
and live under `.harness/templates/` so the templates remain visible inside the
repo's own harness.

The templates are pure Markdown scaffolds and user-interview guides. Compiler
v1 does not render variables into them; it copies them as bytes.

## Development Entrypoint

```bash
npx tsx src/compile.ts <harness.yaml>
```

Example:

```bash
npx tsx src/compile.ts harness.yaml
```

This is a development entrypoint, not the final packaged CLI. Each run writes
to `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>` and prints that path. A future
`harness-kit` command can wrap the same compile function.

## Determinism Rules

- Generated file contents do not include timestamps.
- Generated file contents do not include random IDs.
- Run directory names include a timestamp and four-character hash.
- Do not call external services.
- Do not call an LLM in the compile path.
- Do not read user home config in the compile path.
- Preserve template bytes exactly.
- Preserve plugin order from yaml in `PLUGINS.md`.

## Output Safety

Generated paths are relative to the created run directory under `outputs/`.
The compiler rejects file paths that would escape that run directory. The
current emitter writes the files it owns and does not delete unrelated files.

## Deferred Architecture

These are intentionally outside the compiler v1 prototype:

- copying plugin skill, agent, or rules bodies
- references output
- `.claude` settings or agents output
- stage matrix projection
- presets
- template variable rendering
- watch/check modes
- packaged CLI
- natural-language to yaml LLM frontend
