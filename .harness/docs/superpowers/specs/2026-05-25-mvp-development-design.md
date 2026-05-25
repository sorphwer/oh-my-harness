# harness-kit MVP v0 — Design Spec

Date: 2026-05-25
Status: draft, pending user review
Scope: minimal `yaml → .harness/` compiler. No CLI, no watch, no check mode.

## Goal

Prove the three-layer architecture from `CLAUDE.md` end-to-end with the smallest possible code surface: a TypeScript script that reads `harness-kit-example/nextjs-acme/harness.yaml` and produces a tree that is byte-equal to the corresponding subset of `harness-kit-example/nextjs-acme/.harness/` (the "subset rule" — see Test Strategy below). The hand-curated target also contains demo docs that v0 doesn't compile yet; those are allowed and ignored by the test.

If this works, every subsequent feature (CLI, `--watch`, `--check`, second fixture, self-host, LLM frontend) is a thin wrapper or extra phase added later.

## Non-Goals (v0)

The following are deferred and must not be built in v0:

- CLI entrypoint (no `bin`, no argv parser, no `harness-kit` command).
- `--check` mode and CI gating.
- `--watch` mode.
- Bundling / packaging (no tsup, no npm publish wiring).
- Unit tests per phase.
- CLI smoke tests.
- More than one fixture. `example/nextjs/` follows after `acme` is green.
- Error-quality polish: "did you mean?" hints, exit-code taxonomy, prettified diffs. Plain `throw new Error(msg)` is acceptable.
- LLM frontend (natural language → yaml).
- Self-hosting (`./harness.yaml` + `./.harness/` at repo root).

These are all on the roadmap (`CLAUDE.md` MVP plan steps 4–6 and beyond). v0 covers step 2 only.

## Architecture

Three content pools, one 4-phase pipeline. Same shape as `CLAUDE.md`'s architecture, scaled down.

```
harness.yaml
    │
    ▼  load()       parse + zod validate                → ParsedHarness
    │
    ▼  resolve()    look up each docs/skills/references → ResolvedHarness
    │                entry; validate per-fragment params
    │
    ▼  render()     eta render docs; aggregate skills   → Map<path, content>
    │                into derived `skillsSection`;
    │                references pass through
    │
    ▼  emit()       write tree to outDir                → files on disk
```

All four phases live as functions in **one file** (`src/compile.ts`). They are not split into `src/pipeline/*.ts` files until there is a second caller or the file outgrows comprehension.

### The three fragment kinds

| Kind | Source | Compile behavior | Output location |
|------|--------|------------------|------------------|
| `docs` | `docs-pool/<name>/{manifest.ts, template.md}` | eta-render template with yaml params + derived params | `<outDir>/<manifest.outputPath>` |
| `skills` | `catalog/<plugin>/<name>.json` (or `catalog/<name>.json` for unprefixed) | aggregate into `skillsSection` string injected into doc templates; also write `<outDir>/SKILLS.md` | `<outDir>/SKILLS.md` (single file) |
| `references` | `references-pool/<name>.<ext>` | copy bytes | `<outDir>/docs/references/<name>.<ext>` |

## Repo Layout (v0)

```
oh-my-harness/
├── src/
│   └── compile.ts                       # all 4 phases in one file
├── docs-pool/                           # doc-template fragments (v0 scope)
│   ├── agent-guide/{manifest.ts, template.md}
│   ├── architecture/{manifest.ts, template.md}
│   ├── planning-conventions/{manifest.ts, template.md}
│   └── product-sense/{manifest.ts, template.md}
├── catalog/                             # real-skill catalog entries (v0 scope)
│   ├── superpowers/
│   │   ├── writing-plans.json
│   │   ├── test-driven-development.json
│   │   └── executing-plans.json
│   └── code-review.json
├── references-pool/                     # raw third-party reference files (v0 scope)
│   └── auth-js-llms.txt
├── example/
│   ├── nextjs-acme/
│   │   ├── harness.yaml                 # v0 input
│   │   └── .harness/                    # v0 target (already exists, hand-written)
│   └── nextjs/                          # not used in v0
│       └── .harness/
├── test/
│   └── fixtures.test.ts                 # round-trip test
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

The pools above hold the **minimum entries needed for v0 acme** — 4 docs, 4 skills, 1 reference. The full catalog (~20 skills) and full docs-pool (~11 fragments) from earlier discussion are *not* required for v0; they get added later as additional fixtures or projects need them.

### Expanding the acme target

The hand-written `harness-kit-example/nextjs-acme/.harness/` contains 11 doc files (`AGENTS.md`, `ARCHITECTURE.md`, and 9 under `docs/`) so that the demo reads as a complete worked example. v0's compiler only produces 4 of those (`AGENTS.md`, `ARCHITECTURE.md`, `docs/PLANS.md`, `docs/PRODUCT_SENSE.md`); the other 7 are demo-only.

To make v0 also exercise skills + references + permissions, the target must additionally include:

- `SKILLS.md` — written by hand to match what the compiler will emit from the 4 catalog entries above.
- `docs/references/auth-js-llms.txt` — copied verbatim from `references-pool/auth-js-llms.txt`.
- `.claude/settings.example.json` — written by hand to match the `default-nextjs` permissions preset.

After this expansion, the round-trip test (with the subset rule below) proves docs + skills + references + permissions all work end-to-end.

## Yaml Schema

**Superseded by [`2026-05-25-harness-yaml-schema-design.md`](2026-05-25-harness-yaml-schema-design.md).**

The yaml schema, resource model, and preset semantics are defined in that companion spec. Key changes from the original v0 sketch that used to live here:

- `preset: nextjs` becomes a required top-level field. It expands to a default set of plugins, docs, and a permissions preset.
- `docs: []` is removed from yaml — the preset decides which docs render.
- `skills: []` moves under `extras.skills` (default empty); top-level skills no longer exist.
- New `extras: { plugins, skills, agents, hooks }` namespace covers everything beyond the preset.
- `projectOverview` renamed to `overview`.
- `references` stays at the top level (per-project, free-form) and accepts pool ids or filesystem paths.
- `permissions: { preset }` block removed — permissions ride along with the preset.

Two new content pools (`agents-pool/`, `hooks-pool/`) are added; `presets/` and `permissions-pool/` may stay hardcoded in `src/compile.ts` until a second preset / permission set appears.

The rest of this MVP spec — pipeline phases, fragment shapes, test strategy, dependencies, acceptance criterion — is unaffected by the schema redesign.

## Per-Phase Contracts

### `load(yamlPath: string): ParsedHarness`

- Read file at `yamlPath` as UTF-8.
- Parse with `yaml`.
- Validate against `HarnessYaml` zod schema.
- Throw on yaml syntax error or schema rejection. Message includes file path and zod path.

### `resolve(parsed: ParsedHarness): ResolvedHarness`

Pool paths are looked up relative to the repo root (which the script derives from `import.meta.url` for v0 — the compiler runs from inside the repo, no need to plumb a path).

For each entry in `parsed.docs`, `parsed.skills`, `parsed.references`:

- **docs entry `id`**: import `docs-pool/<id>/manifest.ts`. The manifest exports `{ paramsSchema: ZodSchema, outputPath: string }`. Validate the relevant fields from `parsed` against `paramsSchema`. Record `{ kind: "doc", id, templatePath, outputPath, params }`.
- **skills entry `id`**: parse `id` as `<plugin>:<name>` (or bare `<name>`). Read JSON from `catalog/<plugin>/<name>.json` (or `catalog/<name>.json`). Validate against a single shared catalog-entry schema. Record `{ kind: "skill", entry }`.
- **references entry `id`**: find `references-pool/<id>.*` (single match). Record `{ kind: "reference", srcPath, outputPath: \`docs/references/<basename>\` }`.

`ResolvedHarness` also carries through `parsed.permissions` (and any other top-level fields render needs) so the downstream phases don't need a reference to `parsed`.

Throws on any unknown id or any zod failure. No fallback behavior.

### `render(resolved: ResolvedHarness): Map<string, string | Buffer>`

- Build `derived`:
  - `skillsSection: string` — pre-formatted markdown bullet list of selected skills (id, displayName, whenToUse).
  - `referencesList: string[]` — basenames of references.
- For each `doc` entry: `eta.render(templateContents, { ...docParams, ...derived })`. Result is a string keyed by `outputPath`.
- Compose `SKILLS.md` from all skill entries (full per-entry detail). Add to map.
- For each `reference` entry: add `{ outputPath → fs.readFileSync(srcPath) }` (raw Buffer; no rendering).
- If `resolved.permissions?.preset` is set, look up the preset content (small hardcoded object in `compile.ts` for v0; only `default-nextjs` exists) and add it to the map at `.claude/settings.example.json`.

Returns a `Map<string, string | Buffer>` of all output files, keyed by path relative to `outDir`.

### `emit(files: Map<string, string | Buffer>, outDir: string): void`

- Ensure `outDir` exists (`fs.mkdirSync({ recursive: true })`).
- For each `(path, content)`: ensure parent dir, write file. String → UTF-8; Buffer → raw.
- Does **not** delete pre-existing files at `outDir` that the compiler did not produce. Stray files are left untouched. (Locked per Section 4 design discussion.)
- Throws on any fs error.

## Catalog Entry Schema

One JSON file per skill, validated by zod:

```ts
const CatalogEntry = z.object({
  id: z.string(),                         // "superpowers:test-driven-development"
  displayName: z.string(),                // "Test-Driven Development"
  source: z.object({
    kind: z.enum(["plugin", "builtin"]),
    plugin: z.string().optional(),        // required when kind === "plugin"
    name: z.string(),
  }),
  description: z.string(),                // one-line summary
  whenToUse: z.string(),                  // when to invoke
  rigidity: z.enum(["rigid", "flexible"]).optional(),
});
```

## Docs-Pool Fragment Shape

Each `docs-pool/<name>/` directory:

```ts
// manifest.ts
import { z } from "zod";

export const paramsSchema = z.object({
  displayName: z.string(),
  projectOverview: z.string(),
  contract: z.object({ /* ... fields this template reads ... */ }),
  // derived params are NOT declared here; the compiler always injects them
});

export const outputPath = "AGENTS.md";   // relative to outDir
```

```markdown
<!-- template.md, eta syntax -->
# <%= displayName %> — Development Guide

## Project Overview

<%= projectOverview %>

## Canonical Product Contract

- Tenancy: <%= contract.tenancy %>
...

<%= skillsSection %>
```

The compiler passes `{ ...validatedParams, ...derivedParams }` to eta. Templates can reference any param the manifest declares, plus the always-injected `skillsSection`, `referencesList`, `harnessKitVersion`.

## Test Strategy (v0)

**One test only**: fixture round-trip for `nextjs-acme`, using the **subset rule** (see below).

```ts
// test/fixtures.test.ts
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compile } from "../src/compile";
import { assertActualSubsetOfExpected } from "./helpers";

test("nextjs-acme: compiled tree is a byte-equal subset of the target", async () => {
  const tmp = mkdtempSync(join(tmpdir(), "harness-kit-"));
  await compile(
    "harness-kit-example/nextjs-acme/harness.yaml",
    tmp,
  );
  assertActualSubsetOfExpected(tmp, "harness-kit-example/nextjs-acme/.harness");
});
```

### The subset rule

`assertActualSubsetOfExpected(actual, expected)` enforces:

1. **Every file in `actual` exists in `expected`** (catches compiler bugs where it emits something unexpected).
2. **Every file in `actual` is byte-equal to the corresponding file in `expected`** (catches content bugs).
3. **Files in `expected` that are not in `actual` are ignored** (the demo target can contain more docs than v0's compiler produces).

This matches the "emit does not delete stray files" decision from the error-handling section: the compiler's output is a *subset* of the .harness/ folder, not the whole thing. The relaxation lets the acme demo stay complete-as-a-worked-example while v0 only compiles the four docs it knows how to.

When the docs-pool grows to cover all 11 demo docs (post-v0), this same test will exercise the full tree without modification — newly-compiled files will start matching their previously-ignored demo counterparts.

No unit tests, no mocks, no CLI smoke. If this single test is green, v0 is done.

## Dependencies

```json
{
  "dependencies": {
    "yaml": "^2",
    "zod": "^3",
    "eta": "^3"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "^4",
    "vitest": "^2",
    "@types/node": "^22"
  }
}
```

No bundler, no build step. Run via `tsx`. Run tests via `vitest`.

## Acceptance Criterion

```bash
npm test
# → 1 passed, 0 failed
#   nextjs-acme: compiled tree is a byte-equal subset of the target
```

That's it. When this passes, v0 ships and the next iteration (CLI, watch, second fixture, self-host, more docs-pool fragments) begins.

## Implementation Order

Checkpoint order — not strict serial, since later iteration loops back into earlier steps (e.g., deciding the exact SKILLS.md format in step 8's `render` implementation may force a touch-up to step 5's hand-written target). Treat this as the order to *first finish each item*, with the last step being where everything converges.

1. `package.json`, `tsconfig.json`, install deps.
2. `src/compile.ts` skeleton: typed `compile(yamlPath, outDir)` with empty `load`, `resolve`, `render`, `emit` stubs called in order.
3. Catalog entries (4 JSON files) for the skills acme uses.
4. References (`auth-js-llms.txt`) copied into `references-pool/` from a public source (or hand-written stub).
5. Expand the acme target: add `SKILLS.md`, `docs/references/auth-js-llms.txt`, and `.claude/settings.example.json` to `harness-kit-example/nextjs-acme/.harness/`. Initial content is the writer's best guess at what the compiler will emit; refined in step 10.
6. Docs-pool fragments (4 dirs: `agent-guide`, `architecture`, `planning-conventions`, `product-sense`), each with `manifest.ts` + `template.md`. Source the template content by examining the corresponding file in `harness-kit-example/nextjs-acme/.harness/` and parameterizing the bits that vary.
7. `harness-kit-example/nextjs-acme/harness.yaml` — write the yaml that, plus the pools above, should produce the (expanded) target folder.
8. Implement `load`, then `resolve`, then `render`, then `emit`.
9. `test/fixtures.test.ts` + `assertDirsEqual` helper.
10. Iterate: run the test, diff the output against the target, fix templates / params / pipeline / target until byte-equal.

Step 10 is where the real work happens. Steps 1–9 are scaffolding.

## Open Questions Deferred Past v0

- How permissions presets get described in yaml when there's more than one preset.
- Where the "permissions preset" content actually lives on disk (hardcoded in `compile.ts` is fine for v0; needs a real home before v1).
- How the `superpowers` section under `example/*/.harness/docs/superpowers/{plans,specs}/` (present in `nextjs` skeleton, not in `acme`) gets reproduced — acme doesn't have it so v0 doesn't need to answer this. Decide when adding the `nextjs` fixture.
- LLM frontend wire-up.

These should not block v0. Note them and continue.
