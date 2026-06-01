# UAT Checklist

This checklist defines the acceptance pass for the harness-kit compiler v1
minimal prototype.

## Current Context

- Validating: minimal `yaml -> .harness/` compiler.
- Root manifest: `harness.yaml`.
- Fixture manifest: `harness-kit-example/compiler-v1/harness.yaml`.
- Generated run location: `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>`.
- Root `.harness/`: hand-maintained for this project; not overwritten during
  prototype smoke tests.

## Preconditions

- `package.json` exists with TypeScript, test, yaml, zod, tsx, and vitest dependencies.
- `.harness/templates/` contains the 11 fixed template files.
- root `harness.yaml` exists.
- `harness-kit-example/compiler-v1/harness.yaml` exists.
- The active spec and plan exist under `.harness/docs/superpowers/`.

## Compiler Acceptance

### 1. Load

- [ ] Valid yaml parses successfully.
- [ ] Invalid yaml syntax fails with the yaml path.
- [ ] Schema errors include useful validation context.

### 2. Resolve

- [ ] Known plugin ids resolve to directories under `plugins/`.
- [ ] Unknown plugin ids fail without fallback behavior.
- [ ] All 11 fixed templates are required.

### 3. Render

- [ ] `AGENTS.md` is copied from `.harness/templates/AGENTS.md`.
- [ ] `ARCHITECTURE.md` is copied from `.harness/templates/ARCHITECTURE.md`.
- [ ] The 9 docs under `docs/` are copied from `.harness/templates/docs/`.
- [ ] `PLUGINS.md` lists yaml-selected plugins in yaml order.

### 4. Emit

- [ ] A timestamped run directory is created under `outputs/`.
- [ ] Parent directories are created as needed.
- [ ] Emitted paths stay under the generated run directory.
- [ ] Pre-existing unrelated files in `outputs/` are left untouched.
- [ ] No `.claude` or `docs/references` output is produced in compiler v1.

## Fixture Acceptance

- [ ] `npm test` passes.
- [ ] The direct `npx tsx src/compile.ts ...` test passes.
- [ ] Generated fixed docs are byte-equal to `.harness/templates/`.
- [ ] Unknown plugin id fails before generated output is emitted.

## Smoke Acceptance

Run:

```bash
npx tsx src/compile.ts harness.yaml
find outputs/.harness-YYYYMMDD-HHMMSS-xxxx -maxdepth 3 -type f | sort
```

Expected:

- 11 fixed harness docs are present.
- `PLUGINS.md` is present.
- `PLUGINS.md` lists `planning`, `delivery`, and `debugging`.

## Documentation Acceptance

- [ ] README, repo guide, architecture, product, plan, quality, security,
  operations, reliability, and UAT docs agree on compiler v1 scope.
- [ ] User-facing copy describes harness-kit as doc-led and compiler-driven.
- [ ] Template docs contain no unresolved `TODO`, `TBD`, or variable markers.
- [ ] Root `.harness/docs/superpowers/` contains the current compiler v1 spec and plan.

## Exit Criteria

Compiler v1 minimal prototype is acceptable when:

- [ ] `npm test` passes.
- [ ] `npm run typecheck` passes.
- [ ] root `harness.yaml` compiles into `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>`.
- [ ] the compiler does not reach the network or call an LLM.
- [ ] the compiler rejects unsafe output paths.
- [ ] the scope remains limited to fixed templates plus plugin inventory.
