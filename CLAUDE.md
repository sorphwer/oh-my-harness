# harness-kit — Repo Guide

This repo builds **harness-kit**: a doc-first, opinionated bundle for AI coding agents (Claude Code, Codex, Cursor) that captures *how a team works* — planning conventions, quality bar, operations, security posture, UAT, skills, and references — and ships it as a per-project `.harness/` folder.

The GitHub repo is named `oh-my-harness` for historical reasons; the published npm package is `harness-kit`. CLI command name is TBD.

## Architecture

Three layers, top to bottom:

```text
┌──────────────────────────────────────────────────┐
│  1. User intent  (natural language)              │
│     "Next.js app with TDD and multi-tenancy"     │
└────────────────────┬─────────────────────────────┘
                     │  LLM (frontend, replaceable)
                     ▼
┌──────────────────────────────────────────────────┐
│  2. harness.yaml  (structured manifest)          │
│     identity, stack, contract, docs, skills, …   │
└────────────────────┬─────────────────────────────┘
                     │  Compiler (deterministic, code, testable)
                     ▼
┌──────────────────────────────────────────────────┐
│  3. .harness/     (generated folder of docs +    │
│                    settings, dropped into a      │
│                    user's project root)          │
└──────────────────────────────────────────────────┘
```

Properties of this architecture:

- **Single source of truth: `harness.yaml`.** The folder is a generated artifact, not a hand-edited surface. To change a harness you change its yaml and recompile.
- **Direction is one-way: yaml → folder.** No reverse extraction from folder back to yaml. If users want to start from an existing harness, they hand-write a yaml that produces it.
- **LLM is a frontend, not a runtime.** The yaml → folder compile is pure code: deterministic, fast, testable, no API key required. The LLM only helps the user produce a starting yaml from their natural-language description.
- **Dogfooding is the acceptance test.** This repo manages its own `./.harness/` from a `./harness.yaml` using the same compiler we ship. If the compiler cannot satisfy our own needs, the design is wrong.

## What we are (and are not)

**We are**: a methodology and document harness. The deliverable is the curated content — process docs, skill artifacts, LLM reference files, and a small permissions/hook preset — described in a small yaml and compiled into a per-project `.harness/`.

**We are not**: a hook enforcement framework. `kyu1204/oh-my-harness` (npm `oh-my-harness`) already owns that space — its headline value is shell hooks (TDD guard, branch guard, commit gates, etc.). We are **complementary, doc-led**, with hooks as a small secondary layer (e.g. permissions allowlist, plan-required gate), never the headline.

If a feature request reads like "let's add another enforcement hook," pause and ask whether it belongs in harness-kit or in a hooks-focused tool the user can compose alongside us.

## Glossary

- **`harness.yaml`** — the manifest. The source of truth for one harness. Hand-written or LLM-written; consumed by the compiler.
- **`.harness/`** — the generated folder. Lives at the root of a target project. Contains all process docs, skills, references, and agent config.
- **Compiler** — the deterministic code that reads a `harness.yaml`, pulls fragments from the skills pool, and emits a `.harness/`. No LLM in this path.
- **Skills pool** — the set of reusable, parameterized fragments the compiler assembles from. Each skill is self-contained with a small front-matter manifest declaring its parameters.
- **Fixture** — a `(harness.yaml, .harness/)` pair checked in to verify the compiler produces the expected output. Lives under `example/`.
- **Stdlib harness** — a polished, opinionated reference `.harness/` (and its yaml) that demonstrates "what good looks like." `example/nextjs/` is the first one.

## Repo layout

```text
oh-my-harness/
├── CLAUDE.md                          # this file
├── harness.yaml                       # (planned) yaml for this repo itself
├── .harness/                          # (planned) generated artifact for this repo
├── src/                               # (planned) compiler + CLI source
├── skills/                            # (planned) skills pool
├── example/
│   ├── nextjs/
│   │   ├── harness.yaml               # (planned) input
│   │   └── .harness/                  # (current) hand-written; will become compiler output
│   └── nextjs-acme/
│       ├── harness.yaml               # (planned) input
│       ├── README.md
│       └── .harness/                  # filled-in demo
└── (planned)
    └── templates/                     # raw fragments not yet in the skills pool
```

The hand-written `example/*/.harness/` folders that exist today are working targets — they tell the compiler what to produce. As we build the compiler and skills pool, we work backwards: write a `harness.yaml` for each example, and verify the compiler reproduces the existing folder byte-for-byte (or close enough that the diff is explainable).

## MVP plan

Sequenced — do **not** skip ahead:

1. **Define the yaml schema (minimal, working).** Capture only the fields needed to produce the existing `example/nextjs/.harness/`. Document the schema in `docs/yaml-schema.md` (or similar) as it solidifies.
2. **Build the compiler (yaml → folder).** Single command, deterministic, no LLM, no external services. The bar is "produces `example/nextjs/.harness/` from `example/nextjs/harness.yaml`."
3. **Extract the skills pool** from the hand-written content. Each skill = one fragment with named parameters. Start with the docs that vary least (PLANS, QUALITY_SCORE, RELIABILITY, SECURITY) since their structure is the most reusable.
4. **Self-host.** Write `./harness.yaml`, run the compiler, get `./.harness/`. From this point on, the rule is: changes to this repo's harness happen via `./harness.yaml`, not by editing `./.harness/` directly.
5. **Add `--watch`.** Re-compile on yaml change. This is what makes the inner loop tight enough for dogfooding to be pleasant.
6. **Add the LLM frontend.** Natural language → `harness.yaml`. Optional convenience layer. The core product works without it.

## Working rules

- **`harness.yaml` is the source. The folder is the output.** Once a yaml exists for a folder, do not hand-edit the folder. Edit the yaml, recompile. Until a yaml exists for a folder, edit the folder freely — but flag any change that would expand the yaml schema so we can capture it.
- **Compiler stays deterministic.** Same yaml + same skills pool + same compiler version → byte-identical folder. No timestamps in output, no random IDs, no LLM in the compile path. If a fragment needs to vary, parameterize it in the yaml.
- **Eat our own dogfood.** The rules we ship in the stdlib harness (plan before code, ask before non-trivial design, no self-determined visual decisions) apply when working *on* harness-kit too. Treat `example/nextjs/.harness/` as authoritative for this repo's own process until `./.harness/` exists.
- **Watch the name boundary.** When wording user-facing copy, README, or CLI help, never describe ourselves in terms that overlap with kyu1204/oh-my-harness's enforcement-hook pitch. Lead with "methodology bundle" / "doc harness" / "compiled from a yaml," not "guardrails."
- **Hooks stay minimal.** A permissions allowlist and (later) maybe a plan-required gate. That's it. Larger hook coverage belongs in a different tool.

## Reference

- The seeded content in `example/nextjs/.harness/` was generalized from `discord-human-approval-desk`. The `example/nextjs-acme/.harness/` filled-in demo (`AGENTS.md`, `ARCHITECTURE.md`, `PRODUCT_SENSE.md`, `PLANS.md`) shows what the same skeleton looks like once a real project fills it in.
- Competitor / adjacent product to keep aware of: <https://github.com/kyu1204/oh-my-harness> (npm `oh-my-harness`, 0.11.0 as of 2026-05). Doc-led vs hook-led is the cleanest framing for any positioning copy.
