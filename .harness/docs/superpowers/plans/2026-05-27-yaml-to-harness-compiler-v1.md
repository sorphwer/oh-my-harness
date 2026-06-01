# YAML to Harness Compiler v1 - Implementation Record

Status: implemented minimal prototype

Spec: [`../specs/2026-05-27-yaml-to-harness-compiler-v1-design.md`](../specs/2026-05-27-yaml-to-harness-compiler-v1-design.md)

Goal: build the first TypeScript compiler for the accepted compiler v1 contract:
copy the 11 fixed harness templates into a generated `.harness/` tree and emit
a deterministic `.harness/PLUGINS.md` inventory from yaml-selected plugins.

This is the active v1 implementation record. Deprecated v0 pool-model plans
(`docs-pool`, `catalog`, `skills-pool`, `agents-pool`, `hooks-pool`, and
permission pools) must not be resumed.

Development entrypoint:

```bash
npx tsx src/compile.ts <harness.yaml>
```

## Implemented Scope

- TypeScript project scaffold: `package.json`, `package-lock.json`,
  `tsconfig.json`, and `.gitignore`.
- Root manifest: `harness.yaml`.
- Compiler entrypoint and phases in `src/compile.ts`.
- Generated run directories under `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>`.
- Compiler v1 fixture: `harness-kit-example/compiler-v1/harness.yaml`.
- Tests in `test/helpers.ts` and `test/fixtures.test.ts`.
- Fixed source templates under `.harness/templates/`.
- Deterministic plugin inventory output in `PLUGINS.md`.

## Compiler Contract

`src/compile.ts` owns four phases:

- `load`: parse and validate `harness.yaml`.
- `resolveHarness`: validate selected plugin ids and required templates.
- `render`: byte-copy fixed templates and compose `PLUGINS.md`.
- `emit`: write generated files under the generated run directory.

The compiler validates that every selected plugin id exists under `plugins/`.
Unknown plugin ids fail before generated files are emitted.

Plugins are first-class in the v1 docs. The prototype only inventories selected
plugins today; later work should add `plugin.skill`, `plugin.agent`, and
`plugin.rules` projection after those schemas are defined.

## Fixed Template Set

```text
.harness/templates/AGENTS.md
.harness/templates/ARCHITECTURE.md
.harness/templates/docs/DESIGN.md
.harness/templates/docs/FRONTEND.md
.harness/templates/docs/OPERATIONS.md
.harness/templates/docs/PLANS.md
.harness/templates/docs/PRODUCT_SENSE.md
.harness/templates/docs/QUALITY_SCORE.md
.harness/templates/docs/RELIABILITY.md
.harness/templates/docs/SECURITY.md
.harness/templates/docs/UAT_CHECKLIST.md
```

Generated output maps those files to the same paths under
`outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>/`, without the
`.harness/templates/` prefix, plus `PLUGINS.md`.

## Verification Commands

```bash
find .harness/templates -maxdepth 3 -type f | sort
rg -n "TODO|TBD|<%=|\\{\\{|\\}\\}|\\$\\{|<[^>]+>" .harness/templates
LC_ALL=C rg -n "[^\\x00-\\x7F]" .harness/templates
npm test
npm run typecheck
npx tsx src/compile.ts harness.yaml
```

Expected result:

- `find` lists exactly the 11 fixed template files.
- Both template `rg` checks return no matches.
- Tests pass.
- Typecheck passes.
- The direct script smoke emits the 11 fixed harness docs plus `PLUGINS.md`
  under `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>/`.

## Current Boundaries

The compiler v1 minimal prototype intentionally does not include:

- v0 schema compatibility.
- Packaged CLI command.
- Watch mode or check mode.
- LLM frontend.
- Self-host overwrite of this repo's live `.harness/`.
- References output.
- `.claude` output.
- Stage matrix output.
- Copying plugin skill, agent, or rules bodies.
- Template variable rendering.

## Next Decisions Before More Code

Do not implement plugin body projection until these are defined:

- Exact schema for `plugin.skill`.
- Exact schema for `plugin.agent`.
- Exact schema for `plugin.rules`.
- Whether plugin inventories should include stage coverage.
- Whether later yaml should keep explicit `plugins` only or reintroduce
  higher-level presets.
