# harness-kit — Repo Guide

This repo builds **harness-kit**: a doc-first, opinionated bundle for AI coding agents (Claude Code, Codex, Cursor) that captures *how a team works* — planning conventions, quality bar, operations, security posture, UAT, skills, and references — and ships it as a per-project `.harness/` folder.

The GitHub repo is named `oh-my-harness` for historical reasons; the published npm package is `harness-kit`. CLI command name is TBD.

## What we are (and are not)

**We are**: a methodology and document harness. The product is the curated content — process docs, skill artifacts, LLM reference files, and a small permissions/hook preset — assembled into a per-project `.harness/` so an agent always knows how to plan, build, ship, and verify in this codebase.

**We are not**: a hook enforcement framework. `kyu1204/oh-my-harness` (npm `oh-my-harness`) already owns that space — its headline value is shell hooks (TDD guard, branch guard, commit gates, etc.). We are **complementary, doc-led**, with hooks as a small secondary layer (e.g. permissions allowlist, plan-required gate), never the headline.

If a feature request reads like "let's add another enforcement hook," pause and ask whether it belongs in harness-kit or in a hooks-focused tool the user can compose alongside us.

## Glossary

- **`.harness/`** — the per-project bundle the tool produces (or the user copies). Lives at the root of a user's project. Contains all process docs, skills, references, and agent config.
- **Harness templates** — base content we ship in this repo, organized by stack (e.g. `example/nextjs/.harness/`).
- **Skills pool** — reusable skill / superpower / spec artifacts that get mixed into `.harness/docs/superpowers/` based on the user's answers during init.
- **Stdlib harness** — a polished, opinionated reference `.harness/` that demonstrates "what good looks like." `example/nextjs/.harness/` is the first one.

## Repo layout

```
oh-my-harness/
├── CLAUDE.md                          # this file
├── example/
│   └── nextjs/
│       └── .harness/                  # reference stdlib harness (MVP focus)
│           ├── AGENTS.md
│           ├── ARCHITECTURE.md
│           ├── .claude/settings.example.json  # template — users rename to settings.local.json
│           └── docs/
│               ├── DESIGN.md, FRONTEND.md, OPERATIONS.md, PLANS.md,
│               ├── PRODUCT_SENSE.md, QUALITY_SCORE.md, RELIABILITY.md,
│               ├── SECURITY.md, UAT_CHECKLIST.md
│               ├── superpowers/{plans,specs}/
│               └── references/*.txt
└── (future)
    ├── templates/                     # parameterized templates extracted from example/
    ├── skills/                        # skills pool
    └── cli/                           # the CLI (later)
```

## MVP plan

Sequenced — do **not** skip ahead:

1. **Polish `example/nextjs/.harness/`** into a standalone, copy-pasteable reference. Strip product-specific Discord/Supabase wording from the seeded files; replace with parameterizable language. This is the content-quality validation step.
2. **Extract templates** from the polished example into `templates/nextjs/`, with placeholder syntax for stack-specific values (project name, framework, db, etc).
3. **Build a skills pool** under `skills/`, each skill self-contained with a small front-matter manifest.
4. **CLI last.** Once content quality is proven by manual copy + edit, build a minimal `omh init` flow (interactive Q&A → assemble `.harness/`). No CLI before content is validated by real use.

## Working rules

- **Don't add the CLI before MVP step 4.** It's tempting; it's premature. Templates first.
- **Don't add hooks beyond a minimal default** (permissions allowlist, plan-required-before-edit). Defer broader hook coverage — that's not our wedge.
- **Edit existing docs in `example/nextjs/.harness/` rather than create new ones.** The whole point is a tight, opinionated set, not a kitchen sink.
- **Eat our own dogfood**: the rules we ship in the harness (plan before code, ask before non-trivial design, no self-determined visual decisions, etc.) apply when working *on* harness-kit too. Treat the example harness as authoritative for this repo's own process.
- **Watch the name boundary**: when wording user-facing copy, README, or CLI help, never describe ourselves in terms that overlap with kyu1204/oh-my-harness's enforcement-hook pitch. Lead with "methodology bundle" / "doc harness" / "skills assembly," not "guardrails."

## Reference

- The seeded content in `example/nextjs/.harness/` came from `discord-human-approval-desk` and still contains Discord/Supabase-specific language. Treat that as raw material to generalize, not as canon.
- Competitor / adjacent product to keep aware of: <https://github.com/kyu1204/oh-my-harness> (npm `oh-my-harness`, 0.11.0 as of 2026-05). Doc-led vs hook-led is the cleanest framing for any positioning copy.
