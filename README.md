# harness-kit

> Status: compiler v1 has a minimal runnable prototype. This repo has a root
> `harness.yaml`, fixed v1 harness templates under `.harness/templates/`, and a
> development entrypoint that compiles yaml to a timestamped `.harness-*`
> directory under `outputs/`.

harness-kit is a doc-first, opinionated bundle for AI coding agents (Claude
Code, Codex, Cursor). It captures how a team works - planning conventions,
quality bar, operations, security posture, UAT, skills, and plugin choices -
and ships that process as a per-project `.harness/` folder compiled from a
small yaml manifest.

The GitHub repo is named `oh-my-harness` for historical reasons. The published
npm package is planned as `harness-kit`.

## Core Idea

```text
harness.yaml
      |
      v  deterministic compiler, no LLM, no network
  .harness/
```

The current compiler v1 prototype treats plugins as first-class resources. It emits:

- 11 fixed harness documents copied from `.harness/templates/`
- `PLUGINS.md`, a selected-plugin inventory

It does not yet copy plugin skill, agent, or rules bodies. It also does not emit
references, `.claude` settings, stage indexes, watch mode, or a packaged CLI.

The old v0 pool model (`docs-pool`, `catalog`, `skills-pool`,
`agents-pool`, `hooks-pool`, and permission pools) is deprecated historical
material. New work should target the v1 plugin-first docs and compiler
contract.

## Try It

Install dependencies:

```bash
npm install
```

Generate a harness from the root manifest:

```bash
npx tsx src/compile.ts harness.yaml
```

Inspect the generated files:

```bash
find outputs/.harness-YYYYMMDD-HHMMSS-xxxx -maxdepth 3 -type f | sort
```

Each run writes to `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>`, where the
four-character hash avoids collisions between nearby runs. The command prints
the generated directory path.

## Current Manifest

The root [`harness.yaml`](harness.yaml) is the current self-hosting input:

```yaml
name: oh-my-harness
displayName: harness-kit
plugins:
  - planning
  - delivery
  - debugging
```

## Project Harness

All repo-specific development guidance lives under [`.harness/`](.harness/):

- Agent guide: [`.harness/AGENTS.md`](.harness/AGENTS.md)
- Architecture: [`.harness/ARCHITECTURE.md`](.harness/ARCHITECTURE.md)
- Current plan: [`.harness/docs/PLANS.md`](.harness/docs/PLANS.md)
- Product sense: [`.harness/docs/PRODUCT_SENSE.md`](.harness/docs/PRODUCT_SENSE.md)
- Quality bar: [`.harness/docs/QUALITY_SCORE.md`](.harness/docs/QUALITY_SCORE.md)
- Compiler v1 spec: [`.harness/docs/superpowers/specs/2026-05-27-yaml-to-harness-compiler-v1-design.md`](.harness/docs/superpowers/specs/2026-05-27-yaml-to-harness-compiler-v1-design.md)
- Compiler v1 plan: [`.harness/docs/superpowers/plans/2026-05-27-yaml-to-harness-compiler-v1.md`](.harness/docs/superpowers/plans/2026-05-27-yaml-to-harness-compiler-v1.md)
- Competitive reference: [`.harness/docs/references/kyu1204-oh-my-harness.md`](.harness/docs/references/kyu1204-oh-my-harness.md)

Root `CLAUDE.md` and `AGENTS.md` are pointer files only. Do not maintain a
second copy of process rules there.

## Repo Tour

- [`.harness/templates/`](.harness/templates/) - fixed source templates for the 11 generated harness docs.
- [`plugins/INDEX.md`](plugins/INDEX.md) - current plugin and skill inventory.
- [`harness-kit-example/compiler-v1/harness.yaml`](harness-kit-example/compiler-v1/harness.yaml) - minimal compiler v1 test fixture.
- [`harness-kit-example/nextjs/.harness/`](harness-kit-example/nextjs/.harness/) - hand-written skeleton reference.
- [`harness-kit-example/nextjs-acme/`](harness-kit-example/nextjs-acme/) - filled demo reference.
- [`src/compile.ts`](src/compile.ts) - compiler v1 implementation and development entrypoint.

## Verification

```bash
npm test
npm run typecheck
```

`npm test` includes the direct `npx tsx src/compile.ts ...` entrypoint test.
In restricted sandboxes, `tsx` may need permission to create its local IPC pipe.

## What This Is Not

harness-kit is not a hook enforcement framework. `kyu1204/oh-my-harness`
(npm `oh-my-harness`) already owns that hook-led space. harness-kit is
complementary and doc-led, with hooks only as a possible secondary layer later.

## License

Not set yet.
