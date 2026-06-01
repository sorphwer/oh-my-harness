---
name: dual-repo-cli-release
description: Use when building a Python CLI that ships as standalone binaries (no Python required on user machines), needs curl|sh install and self-update, and wants to keep source code private while publishing binaries publicly
stage: [spec, implement, deliver]
---

# Dual-Repo CLI Release Pipeline

## Overview

Pattern for building and shipping a Python CLI: a **private source repo** holds the code + CI; a **public release repo** hosts binaries and the `curl | sh` installer. End users get a standalone binary with self-update — no Python required.

```
source-repo (private)              release-repo (public)
├── pyproject.toml (version)       ├── install.sh (curl | sh)
├── .github/workflows/release.yml  └── Releases/
├── scripts/                           ├── v0.1.0/
│   ├── build-local.sh                 │   ├── myapp-0.1.0-macos-arm64.dmg
│   ├── remote-install.sh              │   ├── myapp-0.1.0-linux-amd64.tar.gz
│   └── release-readme.md              │   ├── skills.tar.gz
├── skills/                            │   └── checksums-sha256.txt
└── my_pkg/                            └── v0.2.0/ ...
    ├── main.py
    ├── client.py
    ├── config.py
    ├── display.py
    └── updater.py
```

**Version flows one way:** `pyproject.toml` → git tag → `_VERSION` file → baked into binary.

## When to Use

- Python CLI tool (typer + rich + httpx stack)
- Need cross-platform binaries (macOS arm64, Linux amd64)
- Want `curl | sh` install and self-update without package managers
- Source lives private, distribution is public

## When NOT to Use

- Node.js / Go / Rust CLI — the CI and installer are Python-specific
- Tool you intend to publish to PyPI — users already have `pip install`, no need for binaries
- Windows is a first-class target — the installer and updater here are Unix-only
- Single-repo public project — the dual-repo split is for keeping source private while binaries are open

## Decision Skeleton

These are the load-bearing rules. Apply them verbatim.

### 1. Env var naming

All env vars use a namespace prefix matching the CLI name: `MYAPP_SUBDOMAIN`, not `SUBDOMAIN`. Generic names (`EMAIL`, `OUTPUT`) collide with other tools and system vars. Also pass `envvar="MYAPP_OUTPUT"` to typer options so shell env, `~/.myapp/.env`, and `./.env` all resolve through one canonical key.

### 2. Three ways to set any config var

```bash
myapp init                                # interactive (credentials only)
myapp set-env MYAPP_OUTPUT text           # default config in ~/.myapp/.env
myapp set-env --local MYAPP_OUTPUT text   # temporary per-directory override in ./.env
export MYAPP_OUTPUT=text                  # inherited shell env fallback
```

Load order: CWD `.env` > `~/.myapp/.env` > inherited shell env.

### 3. Output formats — markdown is the lingua franca

Four modes, switchable via `-o` flag OR `MYAPP_OUTPUT` env var:

| Mode | Purpose |
|------|---------|
| `table` | Rich ANSI for humans |
| `text` | **Plain markdown** — agents, pipes, clipboard |
| `json` | Raw API response for scripting |
| `csv` | Spreadsheet export |

**`text` mode MUST be markdown, not colored/ANSI.** Agents can't parse escape codes.

### 4. Essential command triplet

Every CLI needs:
- `init` — interactive credential setup (writes `.env`)
- `set-env KEY VALUE` — single-var update, `--local/--global`
- `update` — self-update binary, `--check` for dry-run

Plus `--version` / `-V` as an eager callback that works without credentials.

### 5. Errors to stderr, output to stdout

`Console(stderr=True).print("[red]Error:[/red] ...")` so JSON/CSV piping stays parseable.

### 6. Validate config on client init, not import

`--help` and `--version` must work without credentials. Call `config.validate()` from the API client constructor, not in module load.

### 7. Renaming anything shipped? Deprecate, don't break

Changing an env var or command name after release: accept **both** names for at least one release, with a stderr warning on the old one. Document the old name as deprecated in help text. Remove only in the next major version. Silent rename = broken `.env` files in the wild.

**Implementation details** → `references/cli-feature-design.md`

## Day 0 — First-Time Setup

One-time steps before the first release can be cut. Skip if the release pipeline already works.

### 1. Create the release repo

On GitHub, create a new **public** repo (e.g. `owner/my-release-repo`). Leave it empty — the installer will be the first commit.

### 2. Generate the cross-repo PAT

Fine-grained Personal Access Token scoped to the release repo:

- GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**
- **Repository access:** only the release repo
- **Repository permissions:** Contents: Read and write
- Set an expiration and a calendar reminder — the workflow fails silently when it expires
- In the **source** repo: Settings → Secrets and variables → Actions → add secret `RELEASE_REPO_PAT`

**Do not use `GITHUB_TOKEN`** — it's scoped to the current repo and can't push to the release repo.

### 3. Seed the release repo

- Copy `scripts/remote-install.sh` from the source repo → release repo as `install.sh` on `main`
- Write a release-repo README documenting:
  - The one-line installer (`curl -fsSL .../install.sh | sh`) and that it fetches both the platform binary and `skills.tar.gz`
  - Stable URLs for ancillary assets (`releases/latest/download/skills.tar.gz`)

Without the README the stable URLs are invisible to users.

### 4. Wire the source repo

- `pyproject.toml` — set initial version (`0.1.0`)
- `.gitignore` — exclude `my_pkg/_VERSION`, `dist/`, `build/`, `*.spec`
- `.env.example` — all prefixed env vars with comments
- `.github/workflows/release.yml` — matrix build + cross-repo release (full YAML in `references/release-pipeline.md`)
- `scripts/build-local.sh` — for testing the PyInstaller build locally
- `scripts/release-readme.md` — template with `__VERSION__` placeholder, rendered into each release

### 5. Verify with a test release

- Bump version to `0.1.0`, commit, push
- Tag: `git tag -a v0.1.0 -m "initial release"` and `git push origin v0.1.0`
- Watch CI; confirm a release appears on the release repo with both CLI assets, `skills.tar.gz`, and `checksums-sha256.txt`
- Install via the `curl | sh` one-liner on a fresh machine (or container)
- Run `myapp --version` — should match the tag; `~/.myapp/skills/` should also be populated from `skills.tar.gz`

**Pipeline details** → `references/release-pipeline.md`

## Day N — Recurring Release Flow

Every release after Day 0.

```bash
# 1. Bump version
#    Edit pyproject.toml: version = "0.3.0"

# 2. Commit and push to main
git add pyproject.toml
git commit -m "release 0.3.0"
git push

# 3. Create annotated tag (message becomes the changelog)
git tag -a v0.3.0 -m "- New feature A
- Bug fix B
- Improvement C"
git push origin v0.3.0

# CI takes over: build → package → publish to release repo
```

**Annotated tag, not lightweight** — `git tag -a` with `-m` attaches a message the workflow reads via `git tag -l --format='%(contents)'`. A plain `git tag v0.3.0` produces an empty changelog.

**After CI finishes:** check the release repo, verify assets and checksums, test `myapp update` from an already-installed older version.

## Best Practice Checklist

Full layered audit list — scaffolding, CLI design, CI, installer/updater, Day N — lives in `references/release-readiness-checklist.md`. Run through it before declaring a release-ready CLI done.

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Unprefixed env var (`EMAIL`, `OUTPUT`) | Collides with other tools | Always `MYAPP_` prefix; `envvar=` on typer options too |
| ANSI colors in `text` mode | Agents can't parse output | `text` must be plain markdown |
| Errors to stdout | Breaks JSON/CSV piping and `\| jq` | `Console(stderr=True)` for errors |
| Validating config at import | `--help` / `--version` break without creds | Validate in API client `__init__`, not at module load |
| No next-page hint | Agents can't paginate | Print the exact next command verbatim |
| Lightweight tag instead of annotated | Empty changelog in release | `git tag -a vX.Y.Z -m "..."` |
| Missing `fetch-depth: 0` | Tag message reads as empty | Set on BOTH checkout steps in CI |
| `_VERSION` committed | Diff noise, merge conflicts | `.gitignore` it — build artifact |
| `jq` in installer | Not pre-installed everywhere | Parse JSON with grep/sed |
| `#!/bin/bash` in installer | Fails on Alpine/dash | POSIX `#!/bin/sh` |
| No smoke test in CI | Binary builds but crashes on import | `./dist/myapp --version` before packaging |
| Ancillary assets packaged per-platform | Duplicated, wastes storage | Package once in the release job, before `sha256sum` |
| `GITHUB_TOKEN` for cross-repo release | Silently fails to publish | Fine-grained PAT with Contents: Write on release repo |
| Passive update check blocks or throws | User sees traceback or hang | Bare `except Exception: pass`, 5s timeout |
| Installer expects skills inside the CLI archive | `install.sh` / `update` drift from release layout | Keep `skills.tar.gz` as a separate release asset and have installer/updater download it explicitly |
| No lint/test gate in CI | Broken or lint-dirty release ships | Gate build matrix with `needs: lint-and-test` job running `ruff` + `pytest` |
| Installer downloads binary without checksum verify | Tampered asset installs silently | Pull `checksums-sha256.txt` alongside and verify before extract |
| `set-env` rewrites `.env` via dict round-trip | User comments wiped out on first write | Line-level in-place rewrite; match `KEY=` prefix, preserve everything else |
| Renaming env var or command silently | Users with old `.env` break on upgrade | Accept both names for one release, warn on old; remove only at next major |
| Shipping without shell completion | Users tab-complete nothing | Typer gives `--install-completion` for free — mention in help/docs |

## Provenance & Testing

**Extracted from** a real-world Python CLI shipped under the dual-repo pattern (private source repo + public release repo). Every Decision Skeleton rule and Common Mistake is a lesson from shipping that CLI, not a hypothesis.

**Baseline pressure test — not yet run.** Per `superpowers:writing-skills`, this skill should be validated by giving a subagent a prompt like *"build a Python CLI that I can install via `curl | sh` and that self-updates, source stays private, binaries public"* **without** this skill, then observing which Decision Skeleton items they miss (expected gaps: env var prefix, `text`-as-markdown, `fetch-depth: 0`, annotated-vs-lightweight tag, `RELEASE_REPO_PAT` vs `GITHUB_TOKEN`, checksum verification in installer). Re-run with skill loaded; any gap that remains is a rule that needs stronger framing.

## References

- `references/cli-feature-design.md` — typer patterns, `init`/`set-env`/`--version` full implementations, layered `.env` loading, OutputFormat + display module structure, error handling, client layer
- `references/release-pipeline.md` — full GitHub Actions YAML, POSIX installer, self-updater, `_VERSION` mechanics, PyInstaller specifics, ancillary asset packaging, PAT scoping
- `references/release-readiness-checklist.md` — full audit checklist by layer (scaffolding, CLI design, CI, installer/updater, Day N release)

Read the reference only when implementing that layer. The rules above are enough to plan with.
