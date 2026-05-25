# kyu1204/oh-my-harness 产品调研

Date: 2026-05-25
Target: [kyu1204/oh-my-harness](https://github.com/kyu1204/oh-my-harness)
Requested source: [author-filtered commits by kyu1204](https://github.com/kyu1204/oh-my-harness/commits?author=kyu1204)

## 结论

`kyu1204/oh-my-harness` 和 harness-kit 面向同一类痛点：让 AI coding agents 在不同项目里获得一致的项目上下文、规则和操作边界。但它的产品重心是 **hook-led enforcement**：用 CLI 从自然语言或 preset 生成 `harness.yaml`、`CLAUDE.md`、`AGENTS.md`、`.claude/`、`.codex/` 和 `.omh/hooks/`，并通过 TDD guard、path guard、command guard、commit gates 等 shell hooks 阻止坏操作。

harness-kit 应继续走 **doc-first methodology harness**：核心产物是 `.harness/` 里的团队工作方式、流程文档、skills、references 和少量权限预设，由 deterministic compiler 从 yaml 生成。两者可以互补，但对外文案必须保持边界：不要把 harness-kit 讲成 guardrails / hook enforcement 工具。

## 当前状态快照

- GitHub repo: public TypeScript project, description 为 "Tame your AI coding agents with natural language. Generate enforced guardrails (CLAUDE.md, hooks, settings) from a single command."
- npm package: `oh-my-harness`, latest `0.11.0`; npm created on 2026-03-16, latest publish on 2026-04-30.
- GitHub latest release: `v0.11.0`, published 2026-04-30.
- Repo activity: latest author-filtered commit observed on 2026-05-18; repo updated on 2026-05-18.
- Package runtime: Node.js `>=20`; TypeScript ESM package.
- CLI bins: `oh-my-harness` and `omh`.
- Top-level source shape: `bin/`, `src/catalog/`, `src/cli/`, `src/core/`, `src/detector/`, `src/generators/`, `src/nl/`, `src/utils/`.
- Presets currently include many stack/language entries: Next.js, React, Vue, FastAPI, Django, Rails, Go/Gin, Rust/Cargo, Java/Gradle/Maven/Spring Boot, Android, Swift, PHP/Laravel, Terraform, package managers, and others.

## Product Shape

The upstream product is a published npm CLI. Its quick-start path is:

```bash
npx oh-my-harness init "TypeScript Next.js frontend with Python FastAPI backend"
omh init --preset nextjs fastapi
omh catalog list
omh test
omh stats
```

Generated output is project-root config, not a contained `.harness/` folder:

- `CLAUDE.md` for Claude Code instructions.
- `AGENTS.md` for Codex instructions.
- `harness.yaml` as the editable source of truth.
- `.omh/hooks/` as shared hook scripts.
- `.omh/state/` for runtime events and TDD state.
- `.claude/settings.json` and `.codex/hooks.json` pointing at the same hook scripts.
- `.codex/config.toml` with feature flags such as `codex_hooks` and `goals`.

Its catalog is centered on enforcement blocks:

- Git and workflow: `branch-guard`, `auto-pr`, `worktree-setup`.
- Quality gates: `commit-test-gate`, `commit-typecheck-gate`, `tdd-guard`.
- File/security guards: `path-guard`, `command-guard`, `lockfile-guard`, `secret-file-guard`, `sql-guard`.
- Automation/observability: `lint-on-save`, `format-on-save`, `test-on-save`, `config-audit`, `desktop-notify`, `compact-context`, `omh stats`.

The LLM path is a frontend for creating config, backed by provider support for Claude CLI/API, OpenAI API, and Gemini API. The deterministic path is `harness.yaml -> generated instructions/settings/hooks`.

## Commit History Read

The author-filtered commit history shows a very compressed product buildout from 2026-03-16 to 2026-05-18.

### 2026-03-16: initial CLI and hook system

The project started with TypeScript/Vitest/Commander scaffolding, built-in presets, file generators for `CLAUDE.md`, hooks, settings, and `.gitignore`, then quickly added natural-language harness generation through `claude -p`. The same day it moved toward a catalog model: `harness.yaml` v2 hooks field, catalog blocks, CLI commands for catalog/hook management/sync, and the `omh` alias.

### 2026-03-17 to 2026-03-18: verification, TDD guard, stats

The next wave added stateful hook infrastructure, TDD guard, event logging, `omh test` dry-run verification, catalog block test cases, and an Ink/React `omh stats` dashboard. The commits also show repeated hardening around JSON parsing, block priority, settings errors, default params, and test coverage.

### 2026-03-20 to 2026-03-28: presets, catalog breadth, providers

The product expanded from simple presets into layered preset selection, Python detector support, more catalog blocks, Terraform detector/preset, multi-provider AI support, per-provider model selection, and a `worktree-setup` block. This is where it becomes a broad hook/catalog platform rather than a small Claude config generator.

### 2026-04-06 to 2026-04-15: hardening and release automation

The April commits are dominated by bug fixes and operational polish: TDD guard race conditions, stale hook cleanup, path normalization and traversal prevention, API-key file permissions, AI provider retry, hook ID collisions, user-owned permission preservation, malformed settings handling, absolute hook paths, macOS compatibility for `tdd-guard`, release branches, tags, and GitHub Releases.

### 2026-04-28 to 2026-04-30: Codex support and unified `.omh/`

PR #67 is the key inflection point for us. It adds:

- Codex emitter: `AGENTS.md`, `.codex/hooks.json`, `.codex/config.toml`.
- Shared `.omh/hooks/` scripts for both Claude and Codex.
- Shared `.omh/state/` runtime state and event logs.
- Migration from older `.claude/hooks/.state` layout.

The follow-up commits are heavy code-review hardening: TOML parsing via `smol-toml`, user-data preservation, JSON escaping with `jq`, manifest path traversal checks, event logging parity, and defensive parsing of external files.

### 2026-05-05 to 2026-05-18: Codex edge cases and source-of-truth fixes

Recent commits focus on Codex-specific correctness:

- Enable Codex `goals` feature by default.
- Detect Codex `apply_patch` payloads in file guards.
- Strip CR from CRLF `apply_patch` headers so Windows-style patches cannot bypass exact-path guards.
- Ensure preset init emits `harness.yaml`, relax schema defaults, and let `hook add` bootstrap a minimal yaml.
- Update roadmap from Cursor/GitHub Copilot emitters toward a PI emitter.

This confirms upstream is actively chasing hook-runtime correctness and cross-agent enforcement semantics, not doc methodology depth.

## Overlap With harness-kit

Shared problem space:

- Both use a `harness.yaml`-style source of truth.
- Both want repeatable, project-owned AI-agent setup.
- Both care about Claude/Codex parity.
- Both can use natural language as a frontend, while keeping generated files reproducible.
- Both benefit from presets and project detection.

Main divergence:

| Dimension | kyu1204/oh-my-harness | harness-kit |
|---|---|---|
| Headline | enforced guardrails | doc-first methodology bundle |
| Primary output | root config files plus hook runtime | contained `.harness/` docs/skills/references |
| Center of gravity | shell hooks and runtime state | deterministic document compiler |
| Runtime behavior | hooks block/allow operations during agent use | generated docs guide human/agent process |
| LLM role | NL init/config authoring | optional yaml authoring frontend, never compile runtime |
| Risk profile | hook bypasses, shell quoting, state migration, TOML/JSON config safety | schema design, template drift, fixture reproducibility, doc quality |

The clean positioning line is:

> Use `oh-my-harness` when you want enforcement hooks. Use harness-kit when you want a project-owned methodology harness that explains how the team plans, reviews, ships, operates, and validates work.

## Lessons To Borrow

- Emit yaml in every path. Upstream had to fix preset init because preset users lacked `harness.yaml`; harness-kit should never create a generated folder without the manifest that can reproduce it.
- Add a `doctor` or `check` mode early. Even a doc-first compiler needs an explicit way to detect broken generated state, stale outputs, missing references, and invalid yaml.
- Treat agent-specific emitters as views over one resolved model. Upstream learned this while unifying Claude and Codex around `.omh/hooks/`; harness-kit should likewise keep Claude/Codex/Cursor references derived from one manifest.
- Use real parsers for structured config. Upstream replaced TOML regex patching with `smol-toml`; harness-kit should avoid ad hoc edits for YAML, JSON, TOML, Markdown front matter, or future agent configs.
- Test the weird transport paths. Codex `apply_patch`, CRLF headers, shell quoting, path traversal, and non-TTY ANSI behavior all produced real fixes upstream. If harness-kit adds even small hooks, it needs the same level of adversarial fixture coverage.
- Keep generated and user-owned regions explicit. Upstream has many commits around stale managed sections and preserving user-owned permissions. harness-kit should define generated-folder ownership clearly and avoid ambiguous hand-edit surfaces once yaml exists.

## What Not To Copy

- Do not lead with "guardrails." That term is already central to upstream's README and feature set.
- Do not turn the MVP into a hook catalog. Larger hook coverage belongs to upstream or a composable hook-focused tool.
- Do not put runtime state inside harness-kit v0. Our planned `.harness/` should remain generated documentation and references.
- Do not make natural-language init the core path. Upstream's NL path is useful, but harness-kit's acceptance test is yaml -> folder with no API key.
- Do not scatter output across project root until the `.harness/` contract is proven. Root-level emitters can come later as views or adapters.

## Watchlist

- Upstream roadmap now lists a future PI emitter and community preset registry. If their registry evolves toward reusable methodology fragments, the overlap with harness-kit increases.
- The package name and repo name remain confusingly close to this repo's historical `oh-my-harness` name. Public copy should consistently say npm package `harness-kit`.
- The current upstream README has one stale-looking line under "Stateful Hook Logging" that still mentions `.claude/hooks/.state/events.jsonl`, while the generated tree and recent commits say `.omh/state/events.jsonl`. This is a minor docs inconsistency, but it is useful evidence that fast hook-runtime migrations create documentation drift.
- Their hardening cadence is high. Any comparison doc should be refreshed before public claims, especially around supported agents and latest version.

## Source Links

- GitHub repo: <https://github.com/kyu1204/oh-my-harness>
- Author-filtered commits: <https://github.com/kyu1204/oh-my-harness/commits?author=kyu1204>
- Latest release observed: <https://github.com/kyu1204/oh-my-harness/releases/tag/v0.11.0>
- npm package: <https://www.npmjs.com/package/oh-my-harness>
- Upstream `package.json`: <https://github.com/kyu1204/oh-my-harness/blob/main/package.json>
