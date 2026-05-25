# UAT Checklist

This checklist defines the acceptance pass for harness-kit MVP v0.

## Current Context

- Validating: minimal `yaml -> .harness/` compiler.
- Target fixture: `example/nextjs-acme`.
- Root `.harness/`: hand-bootstrapped for this project and not yet generated.

## Preconditions

- `package.json` exists with required TypeScript, test, and compiler dependencies.
- `example/nextjs-acme/harness.yaml` exists.
- `example/nextjs-acme/.harness/` contains the hand-curated target files.
- The active spec and plan exist under `.harness/docs/superpowers/`.

## Compiler Acceptance

### 1. Load

- [ ] Valid yaml parses successfully.
- [ ] Invalid yaml syntax fails with the yaml path.
- [ ] Schema errors include the relevant field path.

### 2. Resolve

- [ ] Known docs resolve to doc-pool fragments.
- [ ] Known skills resolve to catalog entries.
- [ ] Known references resolve to reference-pool files.
- [ ] Unknown ids fail without fallback behavior.

### 3. Render

- [ ] `AGENTS.md`, `ARCHITECTURE.md`, `docs/PLANS.md`, and `docs/PRODUCT_SENSE.md` render from templates.
- [ ] `SKILLS.md` is composed from selected catalog entries.
- [ ] References are copied byte-for-byte.
- [ ] Permissions preset writes `.claude/settings.example.json`.

### 4. Emit

- [ ] Output directory is created if missing.
- [ ] Parent directories are created as needed.
- [ ] Emitted paths stay under `outDir`.
- [ ] Pre-existing unrelated files are left untouched.

## Fixture Acceptance

- [ ] Compiling `example/nextjs-acme/harness.yaml` into a temp directory passes the subset comparison.
- [ ] Every emitted file exists in `example/nextjs-acme/.harness/`.
- [ ] Every emitted file is byte-equal to the target version.
- [ ] No feature outside v0 is required for the fixture to pass.

## Documentation Acceptance

- [ ] README, repo guide, spec, and plan agree that v0 has no CLI, watch, check, packaging, or LLM frontend.
- [ ] User-facing copy describes harness-kit as doc-led and compiler-driven.
- [ ] No generated or filled harness doc contains unresolved placeholders.
- [ ] Root `.harness/docs/superpowers/` contains the current MVP spec and plan.

## Exit Criteria

MVP v0 is shippable when:

- [ ] `npm test` passes.
- [ ] The fixture output is deterministic across repeated runs.
- [ ] The compiler does not reach the network or call an LLM.
- [ ] The compiler rejects unsafe output paths.
- [ ] The v0 scope remains limited to the planned compiler function and fixture.

