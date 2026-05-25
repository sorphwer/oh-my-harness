# harness-kit

> Status: pre-MVP. The doc model is settled; the compiler is not built yet. This repo now has a hand-bootstrapped root `.harness/`; generated self-hosting from `./harness.yaml` is still future work.

harness-kit is a doc-first, opinionated bundle for AI coding agents (Claude Code, Codex, Cursor). It captures how a team works - planning conventions, quality bar, operations, security posture, UAT, skills, and references - and ships that process as a per-project `.harness/` folder compiled from a small yaml manifest.

The GitHub repo is named `oh-my-harness` for historical reasons. The published npm package will be `harness-kit`.

## Core Idea

```text
natural-language description
        |
        v  optional LLM frontend
  harness.yaml
        |
        v  deterministic compiler, no LLM, no network
    .harness/
```

The important properties:

- `harness.yaml` is the source of truth.
- `.harness/` is generated output once a yaml exists.
- Compile is one-way: yaml to folder.
- The compiler is deterministic code.
- The LLM frontend is optional and only helps author yaml.

## Project Harness

All repo-specific development guidance lives under [`.harness/`](.harness/):

- Agent guide: [`.harness/AGENTS.md`](.harness/AGENTS.md)
- Architecture: [`.harness/ARCHITECTURE.md`](.harness/ARCHITECTURE.md)
- Current plan: [`.harness/docs/PLANS.md`](.harness/docs/PLANS.md)
- Product sense: [`.harness/docs/PRODUCT_SENSE.md`](.harness/docs/PRODUCT_SENSE.md)
- Quality bar: [`.harness/docs/QUALITY_SCORE.md`](.harness/docs/QUALITY_SCORE.md)
- Agent rules: [`.harness/docs/RULES.md`](.harness/docs/RULES.md)
- Competitive reference: [`.harness/docs/references/kyu1204-oh-my-harness.md`](.harness/docs/references/kyu1204-oh-my-harness.md)
- MVP spec: [`.harness/docs/superpowers/specs/2026-05-25-mvp-development-design.md`](.harness/docs/superpowers/specs/2026-05-25-mvp-development-design.md)
- MVP implementation plan: [`.harness/docs/superpowers/plans/2026-05-25-harness-kit-mvp-v0.md`](.harness/docs/superpowers/plans/2026-05-25-harness-kit-mvp-v0.md)

Root `CLAUDE.md` and `AGENTS.md` are pointer files only. Do not maintain a second copy of process rules there.

## What This Is Not

harness-kit is not a hook enforcement framework. `kyu1204/oh-my-harness` (npm `oh-my-harness`) already owns that hook-led space. harness-kit is complementary and doc-led, with hooks only as a small secondary layer.

## Repo Tour

- [`.harness/`](.harness/) - this repo's hand-bootstrapped process harness.
- [`example/nextjs/.harness/`](example/nextjs/.harness/) - the stdlib harness skeleton.
- [`example/nextjs-acme/`](example/nextjs-acme/) - a filled-in demo using the same skeleton.
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) - tiny agent entry points that redirect to `.harness/`.

## Try It Now

Until the compiler is built, you can use the skeleton directly:

```bash
cp -r path/to/oh-my-harness/example/nextjs/.harness ./
```

Then fill in the placeholder content for your project. See [`example/nextjs-acme/.harness/`](example/nextjs-acme/.harness/) for a filled-in version.

Planned compiler flow:

```bash
harness-kit init
harness-kit compile
```

## License

TBD.
