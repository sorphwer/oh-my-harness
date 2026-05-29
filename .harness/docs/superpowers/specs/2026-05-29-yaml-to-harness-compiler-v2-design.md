# YAML to Harness Compiler v2 - Design

Date: 2026-05-29
Status: accepted
Builds on:
- `2026-05-27-yaml-to-harness-compiler-v1-design.md`

## Goal

Close the loop on "selected plugin's skills actually land in the generated
harness". Reuse the v1 `load → resolve → render → emit` pipeline; extend each
phase by the minimum needed to validate plugin/skill source quality, copy each
selected skill verbatim into the output tree, and emit a `PLUGINS.md` that is
an actual navigation hub rather than a stub list.

In parallel, fix the two quality holes v1 already surfaced: the plugin id
existence check is too permissive (`plugins: ['INDEX.md']` passes), and
`PLUGINS.md` is an island that no other document references.

Two assets in the generated `.harness/` are the explicit quality targets:

1. The 11 fixed template documents.
2. The SKILL.md files copied from each selected plugin.

## Non-Goals

Inherited from v1, not relaxed in v2:

- No `agents/` or `rules/` resource projection. Plugins only contribute skills.
- No template variable rendering. 10 of the 11 templates remain byte-copied;
  `AGENTS.md` is updated at the template source, not interpolated at compile
  time.
- No `--out <dir>`. Output stays under `<repoRoot>/outputs/`. Dogfooding into a
  separate project is deferred.
- No per-skill selection granularity. yaml still selects whole plugins.
- No stage matrix projection. The `stage` field in SKILL.md frontmatter passes
  through untouched; v2 neither consumes nor validates it.
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
| `name` | yes | Project name. Appears in the generated `PLUGINS.md` header line and nowhere else in the output. Must match `^[a-z0-9][a-z0-9-]*$`. |
| `plugins` | yes, non-empty | Ordered list of plugin ids. Each id must match `^[a-z0-9][a-z0-9-]*$`, must be a directory under `plugins/`, must contain a `skills/` directory, and that `skills/` directory must contain at least one valid skill. |

`displayName` from v1 is removed. The schema is strict: any extra top-level
field fails load. Duplicate plugin ids fail load.

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
- Additional frontmatter fields (`stage`, etc.) are preserved verbatim. v2
  neither consumes nor validates them.
- All files and subdirectories inside the skill directory are copied
  recursively. No content filtering.

A plugin unit:

- One plugin equals one directory `plugins/<id>/`.
- `skills/` subdirectory must exist.
- `skills/` must contain at least one valid skill directory. Non-directory
  entries (`README`, `.DS_Store`) inside `skills/` are ignored silently. A
  subdirectory of `skills/` that exists but has no `SKILL.md` is a hard error
  (avoids silent skips).
- `plugins/<id>/README.md`, `agents/`, `rules/` are not read.

Discovery is one-way: yaml selects `plugins: [...]` explicitly; the compiler
expands each selected plugin to the full set of skill directories present
under it. v2 does not support per-skill picking in yaml, nor a plugin-side
manifest that re-orders or filters skills.

## Output Layout

```text
outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>/
  AGENTS.md
  ARCHITECTURE.md
  PLUGINS.md
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
```

Invariants:

- The 11 fixed template paths are identical to v1.
- `PLUGINS.md` sits at the output root, peer to the 11 templates.
- The skill landing path mirrors the source path's `<plugin-id>/skills/<slug>/`
  suffix verbatim, with only the `plugins/` prefix preserved. Relative links
  in `PLUGINS.md` of the form `./plugins/<id>/skills/<slug>/SKILL.md` resolve
  directly.
- The output does **not** contain `plugins/<id>/README.md`, `plugins/<id>/agents/`,
  `plugins/<id>/rules/`, `plugins/INDEX.md`, `.claude/`, `docs/references/`, or
  any file from a skill directory that lives outside the chosen `<plugin-id>/skills/<slug>/` subtree.
- Output remains at `<repoRoot>/outputs/.harness-<ts>-<hash>/`; each compile
  allocates a new directory. Cleanup is delegated to gitignore plus manual or
  CI sweeps.

Determinism: same yaml + same templates + same plugin tree + same compiler
version produces identical bytes for every output file. Only the directory
name's timestamp and 4-character hash vary.

## Compile Pipeline

Four phases, same names and order as v1.

### load

```
yaml string
  → yaml.parse
  → zod.strict schema (name + plugins)
  → HarnessYaml { name, plugins[] }
```

Any schema failure throws and the pipeline halts before `resolve`. No output
directory is created.

### resolve

Input: `HarnessYaml`. Output: `ResolvedHarness`:

```ts
type ResolvedHarness = {
  name: string;
  templates: Array<{ relPath: string; sourcePath: string }>;
  plugins: Array<{
    id: string;
    skills: Array<{
      slug: string;
      frontmatter: { name: string; description: string; [extra: string]: unknown };
      files: Array<{ relPath: string; absPath: string }>;
    }>;
  }>;
};
```

`resolve` runs every validation up-front:

1. All 11 template source files exist.
2. For each yaml-selected plugin id:
   - `plugins/<id>/` exists and is a directory.
   - `plugins/<id>/skills/` exists and is a directory.
   - `plugins/<id>/skills/` contains at least one subdirectory.
3. For each subdirectory inside `plugins/<id>/skills/`:
   - The name matches the skill slug regex.
   - The directory contains a `SKILL.md`.
   - The frontmatter parses, has non-empty `name` and `description`, and
     `frontmatter.name === slug`.
   - All files inside the skill directory are enumerated (recursively) into
     `files[]` with paths relative to the skill directory root.

Any failure throws; no output directory is created.

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

# Generated manifest
files.set("PLUGINS.md", Buffer.from(renderPlugins(resolved), "utf8"))

return files
```

`render` performs no validation; that is `resolve`'s job. If two entries
attempt to claim the same `relPath`, `render` throws "output path collision"
rather than silently overwriting. (Today's source structure cannot trigger
this, but the contract makes the invariant explicit.)

### emit

Input: the file map and an `outDir`. Behavior is identical to v1:

- Create `outDir`.
- For each `(relPath, content)`: verify `relative(outDir, target)` does not
  start with `..` and is not absolute (v1's existing path traversal guard);
  `mkdirSync(dirname, recursive)` then `writeFileSync`.

`emit` has no knowledge of plugins or skills; it operates on relative paths
only.

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
  empty strings, and ids that start with a digit-or-symbol-first sequence.
- `plugins/<id>` must be a directory (`statSync().isDirectory()`), not a file.

Skill directory:

- Slug matches the same regex.
- Contains `SKILL.md`.
- Frontmatter passes:
  ```
  { name: non-empty string, description: non-empty string, [...]: unknown }
  ```
- `frontmatter.name === slug`.
- Non-directory entries inside `skills/` are skipped silently and never enter
  the output.
- A subdirectory inside `skills/` that has no `SKILL.md` is a hard error.

Plugin must have at least one valid skill:

- `plugins/<id>/skills/` missing, not a directory, or empty of valid skills →
  hard error.

11 fixed templates:

- All 11 source files exist (v1's check, preserved).
- v2 does **not** lint template content (no TBD/TODO scan, no broken-link
  scan). Templates are intentionally interview scaffolds and contain
  "ask the user" placeholders by design; lint heuristics would misfire.
  Template content quality is owned by authoring discipline, not the
  compiler.

### Output-side, enforced by tests

The fixture tests lock down output shape. Any drift fails CI:

1. The output file path set is exactly: 11 templates + `PLUGINS.md` + the
   recursive file set of every selected skill directory. No more, no less.
2. Each of the 11 templates is byte-for-byte equal to its source in
   `.harness/templates/`.
3. Each skill file is byte-for-byte equal to its source under
   `plugins/<id>/skills/<slug>/`.
4. `PLUGINS.md` contains the `Harness for \`<name>\`` header; one second-level
   heading per selected plugin in yaml order; one two-line entry per skill in
   slug ASCII order; the format described in the next section.
5. The output contains none of: `.claude/`, `docs/references/`,
   `plugins/<id>/README.md`, `plugins/<id>/agents/`, `plugins/<id>/rules/`,
   `plugins/INDEX.md`, any plugin-level file outside `<plugin-id>/skills/<slug>/`.
6. Reject paths produce no output directory:
   - Unknown plugin id → throws, no `outputs/` directory created.
   - `plugins: ['INDEX.md']` and similar non-directory ids → throws.
   - Skill frontmatter missing fields or `name !== slug` → throws.
   - Selected plugin with no valid skills → throws.

### Authoring checklist (spec-side, not enforced by compile)

For plugin authors, not for the compiler:

- A SKILL.md `description` should begin with a "Use when ..." trigger clause
  so that downstream agents reading PLUGINS.md can see when to invoke it.
- Each SKILL.md should fit within 1–3 screens. Larger skills should be split.
- Template edits (see "AGENTS.md Template Edit" below) propagate through the
  fixture's byte-equality assertion automatically; no manual sync needed.

## PLUGINS.md Rendering Contract

PLUGINS.md is the only file v2 generates at compile time (everything else is
byte-copied), so its format is locked.

### Template

```
# Plugins — harness for `{name}`

Selected plugins for this harness. Each skill below is copied verbatim from
its source plugin under `./plugins/<id>/skills/<slug>/`.

## {plugin-id-1}

- `{skill-slug}` — {skill-description}
  ./plugins/{plugin-id-1}/skills/{skill-slug}/SKILL.md
- `{skill-slug}` — {skill-description}
  ./plugins/{plugin-id-1}/skills/{skill-slug}/SKILL.md

## {plugin-id-2}

- `{skill-slug}` — {skill-description}
  ./plugins/{plugin-id-2}/skills/{skill-slug}/SKILL.md
```

### Rules

- File is UTF-8, no BOM, ends with a single `\n`.
- Top heading text is exactly `Plugins — harness for \`<name>\``. The dash is
  U+2014 (em dash).
- The introductory paragraph is exactly the two lines shown above (followed
  by a blank line).
- Plugin sections appear in yaml `plugins:` order. No sorting, no
  deduplication. (Duplicate ids are rejected at resolve time.)
- Skill bullets within a plugin section are sorted by slug in ASCII ascending
  order. This decouples manifest output from filesystem enumeration order.
- Each skill entry is two lines:
  - Line 1: `- \`<slug>\` — <description-first-line>` where
    `<description-first-line>` is the first line of the frontmatter
    `description` field, trimmed. Multi-line descriptions are truncated to
    the first line at manifest generation time.
  - Line 2: two-space indented relative path,
    `  ./plugins/<id>/skills/<slug>/SKILL.md`.
- Plugin sections are separated by a single blank line; the document ends
  with a single trailing `\n`, no consecutive blank lines.
- `<name>`, `<id>`, `<slug>` are always wrapped in backticks. The regex on
  these tokens guarantees they need no markdown escaping.
- `<description-first-line>` is not escaped. Authoring is expected to keep
  descriptions as single-line plain prose; escaping is the authoring
  checklist's job, not the compiler's.

### What is intentionally omitted

- Per-plugin description blocks. Plugins have only a README.md today and no
  structured description field. Adding one would require a `plugin.yaml`
  contract that v2 does not introduce.
- Skill counts and stage labels. `stage` is out of scope for v2. Counts are
  noise.
- Reverse sort, stage-based grouping, plugin-level folds. Each grouping
  strategy adds an authoring decision; v2 keeps the list flat.

## AGENTS.md Template Edit

v2 modifies exactly one file under `.harness/templates/`: `AGENTS.md`. The
other 10 templates are not changed.

### Where

The existing `## Documentation Structure` section receives a new third-level
subsection appended to its end. The two existing paragraphs of that section
are preserved verbatim.

### Inserted text

```markdown
### Plugins And Skills

This harness ships with a curated set of plugins. Each selected plugin contributes one or more skills as a self-contained directory under `plugins/<id>/skills/<slug>/`, each rooted at a `SKILL.md` file with a frontmatter `name` and `description`.

The full inventory lives in `./PLUGINS.md`. Read it before starting non-trivial work — its descriptions tell you when a skill applies. When a skill matches the task, open its `SKILL.md` and follow it.

Do not edit files under `plugins/` to "customize" a skill for this project. If a skill is wrong for the project, raise it as a project-specific override in `docs/` rather than mutating the shipped skill.
```

### Reasoning

- No plugin id is mentioned. The template must remain generic across all yaml
  selections; concrete ids live only in `PLUGINS.md`.
- No reference to harness-kit, the compiler, or "this file was generated".
  The downstream agent reading the generated `AGENTS.md` does not need to
  know about the build pipeline.
- The "do not edit `plugins/`" sentence prevents the most likely failure
  mode: a future contributor editing a shipped skill inside the generated
  output and losing the change at the next compile.
- No "Updating Plugins And Skills" section is added; recompile cadence is a
  harness-kit workflow concern, not a per-project AGENTS.md concern.

The edit propagates through the fixture's "11 templates byte-equal to source"
assertion automatically: the template source changes, the asserted bytes
change with it.

## Development Entrypoint

Unchanged from v1:

```bash
npx tsx src/compile.ts <harness.yaml>
```

Prints the generated `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>` directory
path on success. Non-zero exit on any compile error.

No `--out`, no `--watch`, no packaged binary.

## Acceptance Criteria

CI green on all of:

1. YAML shrinks to two fields. `harness.yaml` containing only `name` +
   `plugins` compiles successfully. A yaml with `displayName` or any extra
   top-level field fails compile.
2. Plugin id validation is hardened. `plugins: ['INDEX.md']`,
   `plugins: ['..']`, `plugins: ['Planning']` all fail at resolve before any
   output directory is created.
3. Skill frontmatter is enforced. Missing `name`, missing `description`, or
   `name !== slug` each fail compile.
4. Empty skills selection is rejected. A selected plugin whose `skills/`
   contains no valid SKILL.md fails compile.
5. Output shape matches. Selecting `[planning, delivery, debugging]` produces
   exactly: 11 templates + `PLUGINS.md` + every skill file under each
   selected plugin's `skills/`. No more, no less.
6. Bytes match. The 11 templates equal `.harness/templates/` byte-for-byte.
   Every skill file equals its source under
   `plugins/<id>/skills/<slug>/` byte-for-byte.
7. `PLUGINS.md` is well-formed. Header line with `Harness for \`<name>\``,
   plugin sections in yaml order, skill bullets in slug ASCII order, two-line
   entry format, single trailing `\n`.
8. `AGENTS.md` template has been upgraded. The template source contains the
   `### Plugins And Skills` subsection described above, and the fixture
   continues to assert byte-equality against the updated source.
9. CLI behavior is unchanged. `npx tsx src/compile.ts <harness.yaml>` prints
   the generated directory path; output remains under
   `<repoRoot>/outputs/.harness-<ts>-<hash>/`; no `--out`.

## Test Matrix

Vitest, in `test/`. Two fixture roots: existing `harness-kit-example/compiler-v1/`
stays; v2 adds `harness-kit-example/compiler-v2/`.

| Case | Type | Acceptance |
|---|---|---|
| Compile three-plugin fixture; path set equals expected | happy | 1, 5 |
| 11 templates byte-equal to source | happy | 6, 8 |
| Every skill file byte-equal to source (recursive) | happy | 6 |
| `PLUGINS.md` structure (header, plugin order, skill order, two-line format, trailing newline) | happy | 7 |
| CLI entrypoint creates run directory and matching path set | happy | 9 |
| yaml with `displayName` → throws, no output | sad | 1 |
| yaml `plugins: [INDEX.md]` → throws | sad | 2 |
| yaml `plugins: [..]` → throws | sad | 2 |
| Plugin with no `skills/` directory → throws | sad | 4 |
| Plugin with `skills/<slug>/` but no `SKILL.md` → throws | sad | 3 |
| SKILL.md frontmatter `name !== slug` → throws | sad | 3 |
| All sad-path cases assert no new `outputs/` directory appeared | sad | 1–4 |

Sad-path fixtures requiring deliberately broken plugins or skills are
constructed in temporary directories via `mkdtempSync` + `writeFileSync`, not
in the repo's `plugins/`.

## Open Questions

Recorded for v3 or later; do not block v2 implementation:

1. When does `--out <dir>` enter the CLI? v3 or later?
2. When does a structured plugin description field (likely `plugin.yaml`)
   appear, allowing per-plugin paragraphs in `PLUGINS.md`?
3. Multi-line `description` in SKILL.md frontmatter currently truncates to
   the first line in `PLUGINS.md`. If full descriptions should be surfaced,
   the manifest renderer needs revisiting.
