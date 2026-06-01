# YAML to Harness Compiler v2 - Design

Date: 2026-05-29
Status: accepted
Builds on:
- `2026-05-27-yaml-to-harness-compiler-v1-design.md`
- `2026-05-26-plugin-stage-matrix-design.md`

## Goal

Close the loop on "selected plugin's skills actually land in the generated
harness" while also making the plugin x stage matrix real in compiler output.
Reuse the v1 `load -> resolve -> render -> emit` pipeline; extend each phase by
the minimum needed to validate plugin/skill source quality, copy each selected
skill verbatim into the output tree, fill the selected plugins' skill cells into
the stage matrix, and emit navigation surfaces that are useful to both humans
and future tooling.

v2 is therefore not just a plugin-skill copier. It is the first compiler version
where stages become an actual intermediate representation:

1. yaml still selects plugins along the distribution axis.
2. `resolve` expands those plugins into skills and places each skill into one or
   more lifecycle stages.
3. `render` projects the same resolved matrix into:
   - plugin-owned skill directories,
   - a plugin-first `PLUGINS.md`,
   - stage-first `stages/<stage>/index.md` files,
   - a machine-readable `manifest.json`.

In parallel, fix the two quality holes v1 already surfaced: the plugin id
existence check is too permissive (`plugins: ['INDEX.md']` passes), and
`PLUGINS.md` is an island that no other document references.

Three assets in the generated `.harness/` are the explicit quality targets:

1. The 11 fixed template documents.
2. The skill directories copied from each selected plugin.
3. The stage matrix projections: `stages/`, `manifest.json`, and stage labels in
   `PLUGINS.md`.

## Non-Goals

Inherited from v1, not relaxed in v2:

- No `agents/` or `rules/` resource projection. v2's matrix cells are skills
  only.
- No hooks, workflows, or MCP projection. Those resource kinds remain part of
  the broader matrix design, but v2 fills the matrix from `SKILL.md` resources
  only.
- No template variable rendering. 10 of the 11 templates remain byte-copied;
  `AGENTS.md` is updated at the template source, not interpolated at compile
  time.
- No `--out <dir>`. Output stays under `<repoRoot>/outputs/`. Dogfooding into a
  separate project is deferred.
- No per-skill selection granularity. yaml still selects whole plugins.
- No stage-owned packaging. Skills stay under
  `plugins/<id>/skills/<slug>/`; stage indexes contain pointers back to those
  plugin-owned paths.
- No stage inference from skill names or descriptions. `stage` frontmatter is
  the only explicit signal; missing `stage` defaults to `freestyle`.
- No strict coverage failure. Required-stage gaps are warnings, not hard errors.
- No preset support. No reverse extraction from `.harness/` to yaml. No
  packaged CLI command.

## YAML Contract

```yaml
name: example-project
plugins:
  - planning
  - delivery
  - debugging
```

| Field | Required | Purpose |
|---|---|---|
| `name` | yes | Project name. Appears in generated `PLUGINS.md` and `manifest.json`. Must match `^[a-z0-9][a-z0-9-]*$`. |
| `plugins` | yes, non-empty | Ordered list of plugin ids. Each id must match `^[a-z0-9][a-z0-9-]*$`, must be a directory under `plugins/`, must contain a `skills/` directory, and that `skills/` directory must contain at least one valid skill. |

`displayName` from v1 is removed. The schema is strict: any extra top-level
field fails load. Duplicate plugin ids fail load.

## Stage Contract

v2 imports the closed stage vocabulary from the matrix design:

```ts
const STAGES = [
  "freestyle",
  "intent",
  "spec",
  "plan",
  "explore",
  "implement",
  "verify",
  "review",
  "deliver",
] as const;

const REQUIRED_STAGES = [
  "intent",
  "plan",
  "implement",
  "verify",
  "deliver",
] as const;
```

Properties:

- Stage names are closed. Unknown `stage` strings in `SKILL.md` frontmatter are
  hard errors and include the offending file path in the message.
- `stage` is `Stage | Stage[]`. A single string is normalized to a one-element
  array.
- Missing `stage` defaults to `["freestyle"]`.
- Duplicate stages within one skill normalize to one entry in `STAGES` display
  order.
- The compiler never infers stages from skill slug, description, or plugin id.
- Required-stage coverage is computed after matrix fill. Missing required
  stages produce warnings; they do not prevent output creation.

## Plugin and Skill Resource Model

Source directory shape (already present in the repo, unchanged by v2):

```text
plugins/
  <plugin-id>/
    README.md           # not consumed by v2
    skills/
      <skill-slug>/
        SKILL.md        # required
        ...             # any other files or subdirectories
    agents/             # ignored by v2
    rules/              # ignored by v2
```

A skill unit:

- One skill equals one directory `plugins/<id>/skills/<slug>/`.
- `<slug>` matches `^[a-z0-9][a-z0-9-]*$`.
- The directory must contain a `SKILL.md`.
- `SKILL.md` must begin with a YAML frontmatter block containing at least:
  - `name`: non-empty string, **must equal** `<slug>`.
  - `description`: non-empty string.
  - `stage`: optional `Stage | Stage[]`; if omitted, defaults to `freestyle`.
- Additional frontmatter fields are preserved verbatim in the copied file and
  ignored by v2.
- All files and subdirectories inside the skill directory are copied
  recursively. No content filtering.
- Skill-local files such as `agents/openai.yaml` are copied with the skill and
  inherit the parent skill's stage for matrix navigation, but they do not become
  independent matrix cells.

A plugin unit:

- One plugin equals one directory `plugins/<id>/`.
- `skills/` subdirectory must exist.
- `skills/` must contain at least one valid skill directory. Non-directory
  entries (`README`, `.DS_Store`) inside `skills/` are ignored silently. A
  subdirectory of `skills/` that exists but has no `SKILL.md` is a hard error
  (avoids silent skips).
- `plugins/<id>/README.md`, `agents/`, `rules/` are not read.

Discovery is one-way: yaml selects `plugins: [...]` explicitly; the compiler
expands each selected plugin to the full set of skill directories present under
it. v2 does not support per-skill picking in yaml, nor a plugin-side manifest
that re-orders or filters skills.

## Output Layout

```text
outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>/
  AGENTS.md
  ARCHITECTURE.md
  PLUGINS.md
  manifest.json
  docs/
    DESIGN.md
    FRONTEND.md
    OPERATIONS.md
    PLANS.md
    PRODUCT_SENSE.md
    QUALITY_SCORE.md
    RELIABILITY.md
    SECURITY.md
    UAT_CHECKLIST.md
  plugins/
    <plugin-id>/
      skills/
        <skill-slug>/
          SKILL.md
          ...           # other files from the source skill directory
  stages/
    freestyle/index.md
    intent/index.md
    spec/index.md
    plan/index.md
    explore/index.md
    implement/index.md
    verify/index.md
    review/index.md
    deliver/index.md
```

Invariants:

- The 11 fixed template paths are identical to v1.
- `PLUGINS.md` sits at the output root, peer to the 11 templates.
- `manifest.json` sits at the output root and serializes the resolved
  skills-only matrix.
- All 9 `stages/<stage>/index.md` files are emitted every time, even if a stage
  has no resources.
- The skill landing path mirrors the source path's `<plugin-id>/skills/<slug>/`
  suffix verbatim, with only the `plugins/` prefix preserved. Relative links in
  `PLUGINS.md` and `stages/<stage>/index.md` resolve directly.
- The output does **not** contain `plugins/<id>/README.md`,
  `plugins/<id>/agents/`, `plugins/<id>/rules/`, `plugins/INDEX.md`, `.claude/`,
  `docs/references/`, or any file from a skill directory that lives outside the
  chosen `<plugin-id>/skills/<slug>/` subtree.
- Output remains at `<repoRoot>/outputs/.harness-<ts>-<hash>/`; each compile
  allocates a new directory. Cleanup is delegated to gitignore plus manual or CI
  sweeps.

Determinism: same yaml + same templates + same plugin tree + same compiler
version produces identical bytes for every output file. Only the directory
name's timestamp and 4-character hash vary.

## Compile Pipeline

Four phases, same names and order as v1.

### load

```
yaml string
  -> yaml.parse
  -> zod.strict schema (name + plugins)
  -> HarnessYaml { name, plugins[] }
```

Any schema failure throws and the pipeline halts before `resolve`. No output
directory is created.

### resolve

Input: `HarnessYaml`. Output: `ResolvedHarness`:

```ts
type Stage = (typeof STAGES)[number];

type SkillResource = {
  slug: string;
  description: string;
  stages: Stage[];
  frontmatter: {
    name: string;
    description: string;
    stage?: Stage | Stage[];
    [extra: string]: unknown;
  };
  files: Array<{ relPath: string; absPath: string }>;
  outputPath: string; // plugins/<id>/skills/<slug>/SKILL.md
};

type MatrixCell = {
  kind: "skill";
  plugin: string;
  name: string;
  stages: Stage[];
  path: string; // plugins/<id>/skills/<slug>/SKILL.md
  description: string;
};

type StageCoverage = {
  plugins: string[];
  ok: boolean;
  required: boolean;
};

type ResolvedHarness = {
  name: string;
  templates: Array<{ relPath: string; sourcePath: string }>;
  plugins: Array<{
    id: string;
    skills: SkillResource[];
  }>;
  matrix: {
    stages: readonly Stage[];
    cells: Record<string, Record<Stage, MatrixCell[]>>;
    coverage: Record<Stage, StageCoverage>;
    warnings: string[];
  };
};
```

`resolve` runs every validation up-front:

1. All 11 template source files exist.
2. For each yaml-selected plugin id:
   - id matches `^[a-z0-9][a-z0-9-]*$`.
   - `plugins/<id>/` exists and is a directory.
   - `plugins/<id>/skills/` exists and is a directory.
   - `plugins/<id>/skills/` contains at least one subdirectory.
3. For each subdirectory inside `plugins/<id>/skills/`:
   - The name matches the skill slug regex.
   - The directory contains a `SKILL.md`.
   - The frontmatter parses, has non-empty `name` and `description`, and
     `frontmatter.name === slug`.
   - `stage`, when present, parses as `Stage | Stage[]`; missing `stage`
     normalizes to `["freestyle"]`.
   - All files inside the skill directory are enumerated recursively into
     `files[]` with paths relative to the skill directory root.
4. After all selected skills are discovered, `resolve` fills the matrix:
   - `cells[pluginId][stage]` receives one `MatrixCell` for every normalized
     skill stage.
   - Required-stage coverage scans across selected plugin rows.
   - Missing required stages append human-readable warnings.

Any validation failure throws; no output directory is created. Coverage warnings
are not validation failures.

### render

Input: `ResolvedHarness`. Output: `Map<string, Buffer>` keyed by relative path
under the output directory.

```
files = new Map()

# 11 fixed templates - byte copy
for each template:
    files.set(template.relPath, readFileSync(template.sourcePath))

# Skill files - byte copy
for each plugin, for each skill, for each file:
    files.set(
      `plugins/${plugin.id}/skills/${skill.slug}/${file.relPath}`,
      readFileSync(file.absPath)
    )

# Generated projections
files.set("PLUGINS.md", Buffer.from(renderPlugins(resolved), "utf8"))
for each stage in STAGES:
    files.set(
      `stages/${stage}/index.md`,
      Buffer.from(renderStageIndex(resolved, stage), "utf8")
    )
files.set(
  "manifest.json",
  Buffer.from(JSON.stringify(renderManifest(resolved), null, 2) + "\n", "utf8")
)

return files
```

`render` performs no validation; that is `resolve`'s job. If two entries attempt
to claim the same `relPath`, `render` throws "output path collision" rather than
silently overwriting. Today's source structure cannot trigger this, but the
contract makes the invariant explicit.

### emit

Input: the file map and an `outDir`. Behavior is identical to v1:

- Create `outDir`.
- For each `(relPath, content)`: verify `relative(outDir, target)` does not
  start with `..` and is not absolute (v1's existing path traversal guard);
  `mkdirSync(dirname, recursive)` then `writeFileSync`.

`emit` has no knowledge of plugins, skills, or stages; it operates on relative
paths only.

### compile (top level)

```ts
async function compile(yamlPath: string): Promise<string> {
  const parsed   = load(yamlPath);
  const resolved = resolveHarness(parsed);
  const files    = render(resolved);
  const outDir   = createOutputDir();
  emit(files, outDir);
  return outDir;
}
```

All four phases are synchronous. The `async`/`Promise<string>` signature is
preserved to keep the call-site contract stable for future async work. The
implementation may also drop `async` if convenient; the spec accepts either.

## Quality Gates

### Source-side, enforced by compile

Plugin id:

- Must match `^[a-z0-9][a-z0-9-]*$`. This rejects `..`, `./x`, `INDEX.md`,
  empty strings, uppercase ids, and ids that start with symbols.
- `plugins/<id>` must be a directory (`statSync().isDirectory()`), not a file.

Skill directory:

- Slug matches the same regex.
- Contains `SKILL.md`.
- Frontmatter passes:
  ```
  {
    name: non-empty string,
    description: non-empty string,
    stage?: Stage | Stage[],
    [...]: unknown
  }
  ```
- `frontmatter.name === slug`.
- `stage`, when present, uses only closed-vocabulary stage names.
- Non-directory entries inside `skills/` are skipped silently and never enter
  the output.
- A subdirectory inside `skills/` that has no `SKILL.md` is a hard error.

Plugin must have at least one valid skill:

- `plugins/<id>/skills/` missing, not a directory, or empty of valid skills ->
  hard error.

11 fixed templates:

- All 11 source files exist (v1's check, preserved).
- v2 does **not** lint template content (no TBD/TODO scan, no broken-link scan).
  Templates are intentionally interview scaffolds and contain "ask the user"
  placeholders by design; lint heuristics would misfire. Template content
  quality is owned by authoring discipline, not the compiler.

Stage coverage:

- Required stages are `intent`, `plan`, `implement`, `verify`, and `deliver`.
- A required stage with zero skill cells across all selected plugins creates a
  warning.
- Warnings are included in `manifest.json`.
- The CLI may write warnings to stderr, but stdout remains the generated output
  directory path.

### Output-side, enforced by tests

The fixture tests lock down output shape. Any drift fails CI:

1. The output file path set is exactly: 11 templates + `PLUGINS.md` +
   `manifest.json` + 9 `stages/<stage>/index.md` files + the recursive file set
   of every selected skill directory. No more, no less.
2. Each of the 11 templates is byte-for-byte equal to its source in
   `.harness/templates/`.
3. Each skill file is byte-for-byte equal to its source under
   `plugins/<id>/skills/<slug>/`.
4. `PLUGINS.md` contains the exact `# Plugins — harness for \`<name>\`` header;
   one second-level heading per selected plugin in yaml order; one two-line
   entry per skill in slug ASCII order; each entry includes normalized stages.
5. Every `stages/<stage>/index.md` exists, is deterministic, and lists skill
   cells for that stage using links back to plugin-owned skill paths.
6. `manifest.json` serializes `name`, selected plugins in yaml order, `STAGES`,
   plugin x stage skill cells, coverage, and warnings.
7. The output contains none of: `.claude/`, `docs/references/`,
   `plugins/<id>/README.md`, `plugins/<id>/agents/`, `plugins/<id>/rules/`,
   `plugins/INDEX.md`, any plugin-level file outside
   `<plugin-id>/skills/<slug>/`.
8. Reject paths produce no output directory:
   - Unknown plugin id -> throws, no `outputs/` directory created.
   - `plugins: ['INDEX.md']` and similar non-directory ids -> throws.
   - Skill frontmatter missing required fields or `name !== slug` -> throws.
   - Skill frontmatter with unknown `stage` -> throws.
   - Selected plugin with no valid skills -> throws.

### Authoring checklist (spec-side, not enforced by compile)

For plugin authors, not for the compiler:

- A SKILL.md `description` should begin with a "Use when ..." trigger clause so
  that downstream agents reading PLUGINS.md or a stage index can see when to
  invoke it.
- Each SKILL.md should fit within 1-3 screens. Larger skills should be split.
- Each SKILL.md should carry explicit `stage` once the plugin is maintained by
  this repo. The compiler default exists for compatibility, not as the preferred
  authoring style.
- Template edits (see "AGENTS.md Template Edit" below) propagate through the
  fixture's byte-equality assertion automatically; no manual sync needed.

## Stage Matrix Rendering Contract

The matrix is filled during `resolve` and projected twice during `render`.

### Stage index files

Each stage gets one index file:

```text
stages/<stage>/index.md
```

Template:

```markdown
# Stage: `<stage>`

Required: yes

## Skills

- `<plugin-id>` / `<skill-slug>` [`<stage-1>`, `<stage-2>`] — <description-first-line>
  ../../plugins/<plugin-id>/skills/<skill-slug>/SKILL.md
```

Rules:

- File is UTF-8, no BOM, ends with a single `\n`.
- Stage files are emitted in the fixed `STAGES` list; filesystem enumeration
  order never controls stage order.
- `Required:` is `yes` for required stages and `no` otherwise.
- Skill entries are grouped under a single `## Skills` heading.
- Within a stage, entries are ordered by yaml plugin order, then skill slug ASCII
  order.
- A multi-stage skill appears in every declared stage index.
- If a stage has no skills, the section body is exactly `(none)`.
- Paths are relative from `stages/<stage>/index.md` back to the output root.

### Manifest

`manifest.json` serializes the same skills-only matrix:

```json
{
  "version": 1,
  "name": "example-project",
  "plugins": ["planning", "delivery", "debugging"],
  "stages": ["freestyle", "intent", "spec", "plan", "explore", "implement", "verify", "review", "deliver"],
  "cells": {
    "planning": {
      "plan": [
        {
          "kind": "skill",
          "name": "writing-plans",
          "stages": ["plan"],
          "path": "plugins/planning/skills/writing-plans/SKILL.md",
          "description": "Use when ..."
        }
      ]
    }
  },
  "coverage": {
    "intent": { "plugins": [], "ok": false, "required": true }
  },
  "warnings": [
    "Required stage 'intent' has no skill resources in selected plugins."
  ]
}
```

Rules:

- JSON is pretty-printed with two spaces and a single trailing `\n`.
- `cells` includes every selected plugin key in yaml order.
- Each plugin has keys for all 9 stages. Empty stages are `[]`.
- Cell paths are output-root-relative paths to copied `SKILL.md` files.
- `coverage[stage].plugins` lists plugins with at least one skill cell in that
  stage, in yaml order.
- `coverage[stage].ok` is true when the stage has at least one skill cell, or
  when the stage is `freestyle`; false otherwise.
- `coverage[stage].required` is true only for required stages.
- `warnings` includes one line per uncovered required stage and is empty when
  all required stages have at least one skill cell.

## PLUGINS.md Rendering Contract

PLUGINS.md is generated at compile time and is the plugin-first navigation hub.

### Template

```markdown
# Plugins — harness for `{name}`

Selected plugins for this harness. Each skill below is copied verbatim from
its source plugin under `./plugins/<id>/skills/<slug>/`.

Stage indexes live under `./stages/<stage>/index.md`; they point back to these
same plugin-owned skill files.

## {plugin-id-1}

- `{skill-slug}` [`{stage-1}`, `{stage-2}`] — {skill-description}
  ./plugins/{plugin-id-1}/skills/{skill-slug}/SKILL.md
- `{skill-slug}` [`{stage-1}`] — {skill-description}
  ./plugins/{plugin-id-1}/skills/{skill-slug}/SKILL.md

## {plugin-id-2}

- `{skill-slug}` [`{stage-1}`] — {skill-description}
  ./plugins/{plugin-id-2}/skills/{skill-slug}/SKILL.md
```

### Rules

- File is UTF-8, no BOM, ends with a single `\n`.
- Top heading text is exactly `Plugins — harness for \`<name>\``. The dash is
  U+2014 (em dash).
- The introductory text is exactly the four lines shown above, with paragraph
  breaks preserved.
- Plugin sections appear in yaml `plugins:` order. No sorting, no deduplication.
  Duplicate ids are rejected at load time.
- Skill bullets within a plugin section are sorted by slug in ASCII ascending
  order. This decouples manifest output from filesystem enumeration order.
- Each skill entry is two lines:
  - Line 1: `- \`<slug>\` [\`<stage-1>\`, \`<stage-2>\`] — <description-first-line>`.
  - Line 2: two-space indented relative path,
    `  ./plugins/<id>/skills/<slug>/SKILL.md`.
- Stage labels use normalized `STAGES` display order.
- Multi-line descriptions are truncated to the first line at manifest
  generation time.
- Plugin sections are separated by a single blank line; the document ends with
  a single trailing `\n`, no consecutive blank lines.
- `<name>`, `<id>`, `<slug>`, and stage tokens are always wrapped in backticks.
  The regex/closed vocabulary guarantees they need no markdown escaping.
- `<description-first-line>` is not escaped. Authoring is expected to keep
  descriptions as single-line plain prose; escaping is the authoring checklist's
  job, not the compiler's.

### What is intentionally omitted

- Per-plugin description blocks. Plugins have only a README.md today and no
  structured description field. Adding one would require a `plugin.yaml`
  contract that v2 does not introduce.
- Skill counts. Counts are noise once the stage and plugin indexes exist.
- Stage-based grouping inside PLUGINS.md. The stage-first view belongs in
  `stages/<stage>/index.md`; PLUGINS.md remains plugin-first.

## AGENTS.md Template Edit

v2 modifies exactly one file under `.harness/templates/`: `AGENTS.md`. The
other 10 templates are not changed.

### Where

The existing `## Documentation Structure` section receives a new third-level
subsection appended to its end. The two existing paragraphs of that section are
preserved verbatim.

### Inserted text

```markdown
### Plugins And Skills

This harness ships with a curated set of plugins. Each selected plugin contributes one or more skills as a self-contained directory under `plugins/<id>/skills/<slug>/`, each rooted at a `SKILL.md` file with a frontmatter `name`, `description`, and optional `stage`.

The plugin-first inventory lives in `./PLUGINS.md`. Stage-specific indexes live under `./stages/<stage>/index.md`. Read the relevant index before starting non-trivial work — its descriptions tell you when a skill applies. When a skill matches the task, open its `SKILL.md` and follow it.

Do not edit files under `plugins/` to "customize" a skill for this project. If a skill is wrong for the project, raise it as a project-specific override in `docs/` rather than mutating the shipped skill.
```

### Reasoning

- No plugin id is mentioned. The template must remain generic across all yaml
  selections; concrete ids live only in `PLUGINS.md` and `stages/`.
- No reference to harness-kit, the compiler, or "this file was generated". The
  downstream agent reading the generated `AGENTS.md` does not need to know about
  the build pipeline.
- Mentioning both `PLUGINS.md` and `stages/` makes the two matrix axes visible
  without turning AGENTS.md into generated inventory.
- The "do not edit `plugins/`" sentence prevents the most likely failure mode: a
  future contributor editing a shipped skill inside the generated output and
  losing the change at the next compile.
- No "Updating Plugins And Skills" section is added; recompile cadence is a
  harness-kit workflow concern, not a per-project AGENTS.md concern.

The edit propagates through the fixture's "11 templates byte-equal to source"
assertion automatically: the template source changes, the asserted bytes change
with it.

## Development Entrypoint

Unchanged from v1:

```bash
npx tsx src/compile.ts <harness.yaml>
```

Prints the generated `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>` directory path
on success. Non-zero exit on any compile error. Coverage warnings may be written
to stderr, but stdout remains the generated directory path.

No `--out`, no `--watch`, no packaged binary.

## Acceptance Criteria

CI green on all of:

1. YAML shrinks to two fields. `harness.yaml` containing only `name` + `plugins`
   compiles successfully. A yaml with `displayName` or any extra top-level field
   fails compile.
2. Plugin id validation is hardened. `plugins: ['INDEX.md']`,
   `plugins: ['..']`, `plugins: ['Planning']` all fail at resolve before any
   output directory is created.
3. Skill frontmatter is enforced. Missing `name`, missing `description`, or
   `name !== slug` each fail compile.
4. Skill stage metadata is consumed. Valid `stage` strings and arrays normalize
   into `Stage[]`; missing `stage` becomes `freestyle`; unknown stage names fail
   compile.
5. Empty skills selection is rejected. A selected plugin whose `skills/`
   contains no valid SKILL.md fails compile.
6. Output shape matches. Selecting `[planning, delivery, debugging]` produces
   exactly: 11 templates + `PLUGINS.md` + `manifest.json` + 9 stage index files +
   every file under each selected plugin's `skills/`. No more, no less.
7. Bytes match. The 11 templates equal `.harness/templates/` byte-for-byte.
   Every skill file equals its source under
   `plugins/<id>/skills/<slug>/` byte-for-byte.
8. `PLUGINS.md` is well-formed. Header line is exactly
   `# Plugins — harness for \`<name>\``; plugin sections are in yaml order;
   skill bullets are in slug ASCII order; each skill entry includes normalized
   stage labels, description first line, two-line entry format, and single
   trailing `\n`.
9. Stage indexes are well-formed. All 9 `stages/<stage>/index.md` files exist;
   each multi-stage skill appears in every declared stage; empty stages render
   `(none)`; links point to plugin-owned skill paths.
10. `manifest.json` is well-formed. It includes `version`, `name`, `plugins`,
    `stages`, `cells`, `coverage`, and `warnings`; selected plugin order and
    stage order are deterministic; required-stage gaps appear as warnings.
11. `AGENTS.md` template has been upgraded. The template source contains the
    `### Plugins And Skills` subsection described above, and the fixture
    continues to assert byte-equality against the updated source.
12. CLI behavior is stable. `npx tsx src/compile.ts <harness.yaml>` prints the
    generated directory path to stdout; output remains under
    `<repoRoot>/outputs/.harness-<ts>-<hash>/`; no `--out`.

## Test Matrix

Vitest, in `test/`. Two fixture roots: existing
`harness-kit-example/compiler-v1/` stays; v2 adds
`harness-kit-example/compiler-v2/`.

| Case | Type | Acceptance |
|---|---|---|
| Compile three-plugin fixture; path set equals expected | happy | 1, 6 |
| 11 templates byte-equal to source | happy | 7, 11 |
| Every skill file byte-equal to source (recursive) | happy | 7 |
| `PLUGINS.md` structure (header, plugin order, skill order, stages, two-line format, trailing newline) | happy | 8 |
| Stage index structure for all 9 stages, including empty stage rendering | happy | 9 |
| Multi-stage skill appears in every declared stage index | happy | 4, 9 |
| `manifest.json` structure, deterministic ordering, cells, coverage, warnings | happy | 10 |
| CLI entrypoint creates run directory and matching path set | happy | 12 |
| yaml with `displayName` -> throws, no output | sad | 1 |
| yaml `plugins: [INDEX.md]` -> throws | sad | 2 |
| yaml `plugins: [..]` -> throws | sad | 2 |
| Plugin with no `skills/` directory -> throws | sad | 5 |
| Plugin with `skills/<slug>/` but no `SKILL.md` -> throws | sad | 3 |
| SKILL.md frontmatter `name !== slug` -> throws | sad | 3 |
| SKILL.md frontmatter `stage: not-a-stage` -> throws | sad | 4 |
| Missing skill `stage` defaults to `freestyle` | compatibility | 4 |
| Required-stage gap emits warning but still creates output | warning | 10, 12 |
| All sad-path cases assert no new `outputs/` directory appeared | sad | 1-5 |

Sad-path fixtures requiring deliberately broken plugins or skills are
constructed in temporary directories via `mkdtempSync` + `writeFileSync`, not in
the repo's `plugins/`.

## Open Questions

Recorded for v3 or later; do not block v2 implementation:

1. When does `--out <dir>` enter the CLI? v3 or later?
2. When does a structured plugin description field (likely `plugin.yaml`)
   appear, allowing per-plugin paragraphs in `PLUGINS.md`?
3. Multi-line `description` in SKILL.md frontmatter currently truncates to the
   first line in `PLUGINS.md` and stage indexes. If full descriptions should be
   surfaced, the renderers need revisiting.
4. Should future `--strict` promote required-stage coverage warnings to hard
   compile errors?
