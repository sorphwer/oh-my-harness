# Release-Readiness Checklist (Reference)

Audit list for a `dual-repo-cli-release`-shaped project. Organized by layer so you can verify piecemeal. Main SKILL.md has the rules and flow; this file is the last-mile pass before declaring the CLI release-ready.

## Project scaffolding (Day 0)

- [ ] `pyproject.toml` has `version = "0.1.0"`
- [ ] `.gitignore` excludes `my_pkg/_VERSION`, `dist/`, `build/`, `*.spec`
- [ ] `.env.example` ships with every prefixed var + comment explaining override
- [ ] Release repo exists, is public, and empty except for `install.sh` + README
- [ ] `RELEASE_REPO_PAT` configured on source repo as a fine-grained PAT (Contents: Write, release repo only)
- [ ] Release repo README documents the `curl | sh` one-liner, notes that `install.sh` fetches both the CLI archive and `skills.tar.gz`, and lists stable ancillary URLs (`releases/latest/download/*.tar.gz`)

## CLI feature design

- [ ] All env vars use `MYAPP_` prefix — no `EMAIL`, `OUTPUT`, `TIMEZONE` floating around
- [ ] Every `-o`/`--output` option has `envvar="MYAPP_OUTPUT"` so agents can `export` once
- [ ] Four output modes present: `table`, `text` (markdown), `json`, `csv`
- [ ] `text` mode emits plain markdown — no ANSI escapes
- [ ] `init`, `set-env`, `update` commands all implemented; `--version` / `-V` is an eager callback
- [ ] `--help` and `--version` work without credentials (config validated in client `__init__`, not at import)
- [ ] All errors go to stderr via `Console(stderr=True)` — stdout stays clean for `| jq`
- [ ] List commands print an exact next-page command verbatim when `next_page` is set
- [ ] Entity resolution accepts multiple forms (`"me"`, ID, email, name)
- [ ] Display module separates `_extract_*_row` (shared) from per-format renderers
- [ ] `set-env` preserves comments and key order in `.env` (line-level rewrite, not dict round-trip)
- [ ] Shell completion wired: `--install-completion` / `--show-completion` visible to users (typer provides free)
- [ ] Any renamed env var / command still accepts the old name for one release with a stderr deprecation warning

## CI workflow

- [ ] Triggers on `tags: ["v*"]`
- [ ] A `lint-and-test` job runs `ruff check`, `ruff format --check`, `pytest` and gates the build matrix (`needs: lint-and-test`)
- [ ] Build matrix covers **three** targets: macOS arm64 (DMG), Linux amd64 (tar.gz), Linux arm64 (tar.gz)
- [ ] BOTH `actions/checkout` steps use `fetch-depth: 0` (required for tag messages)
- [ ] `_VERSION` written from `${GITHUB_REF_NAME#v}` before PyInstaller runs
- [ ] PyInstaller uses `--add-data "my_pkg/_VERSION:my_pkg"` (colon on Unix)
- [ ] Smoke test (`./dist/myapp --version | grep -q "$VERSION"`) runs before packaging
- [ ] `hdiutil create` has a 3-attempt retry loop for macOS flakiness
- [ ] Ancillary assets (`skills.tar.gz`, etc.) packaged in the **release** job, **before** `sha256sum`
- [ ] `checksums-sha256.txt` generated and uploaded with other artifacts
- [ ] Changelog extracted from annotated tag via `git tag -l --format='%(contents)'`
- [ ] `gh release create` uses `RELEASE_REPO_PAT`, not `GITHUB_TOKEN`, with `--repo owner/release-repo --latest`

## Installer + self-updater

- [ ] `install.sh` starts with `#!/bin/sh` (POSIX, not bash)
- [ ] JSON parsed with grep/sed — no `jq` dependency
- [ ] `mktemp -d` + `trap 'rm -rf "$TMPDIR"' EXIT` for cleanup
- [ ] OS/arch detected via `uname`; fails cleanly on unsupported combos (including Linux arm64)
- [ ] Downloads both the platform archive and `skills.tar.gz` from the release, plus `checksums-sha256.txt`; verifies sha256 before extracting either asset (detect `sha256sum` vs `shasum -a 256`)
- [ ] PATH append is idempotent (`grep -qF` before writing to `.zshrc`/`.bashrc`)
- [ ] Handles both `.dmg` (hdiutil) and `.tar.gz` extraction paths for the CLI archive, then extracts `skills.tar.gz` into the install directory as a second step
- [ ] `updater.py` passive check wrapped in `except Exception: pass` — never throws to user
- [ ] HTTP calls have ≤5s timeout
- [ ] 24h cache file (`~/.myapp/.update-check`) throttles GitHub API hits
- [ ] `get_current_version()` returns `"dev"` in source mode and short-circuits update check
- [ ] `updater.py` also verifies checksums before swapping the binary and refreshing standalone assets like `skills.tar.gz`

## Release (Day N)

- [ ] Version bumped in `pyproject.toml` and committed
- [ ] Tag is annotated: `git tag -a vX.Y.Z -m "..."` (not `git tag vX.Y.Z`)
- [ ] Tag message is the actual changelog — bullets, not "release vX.Y.Z"
- [ ] CI finishes green; release appears on the release repo with BOTH platforms plus `skills.tar.gz` and `checksums-sha256.txt`
- [ ] Fresh install via `curl | sh` succeeds and `myapp --version` matches the tag
- [ ] `myapp update` from a prior version downloads and swaps the binary cleanly, and refreshes `~/.myapp/skills/`
