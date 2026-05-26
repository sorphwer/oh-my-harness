---
name: release-pipeline
description: Deep-dive reference for the release pipeline — full GitHub Actions workflow, PyInstaller build, POSIX curl installer, in-app self-updater, _VERSION file mechanics, ancillary asset packaging, PAT scope
---

# Release Pipeline (Reference)

Deep-dive companion to `dual-repo-cli-release`. Read this when writing CI, the installer, or the self-updater. The main SKILL.md has the Day-0/Day-N flows; this file has the code.

## Version Mechanics

Single source of truth in `pyproject.toml`. At build time, version is extracted and written to a `_VERSION` file that PyInstaller bundles into the binary.

**`_VERSION` must NOT be committed** — it is a build artifact. Add to `.gitignore`:

```gitignore
my_pkg/_VERSION
dist/
build/
*.spec
```

### Reading version at runtime

Works in both dev mode (package metadata) and binary mode (bundled file):

```python
def get_current_version() -> str:
    import importlib.metadata
    try:
        return importlib.metadata.version("my-cli")        # dev: from package metadata
    except importlib.metadata.PackageNotFoundError:
        base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
        version_file = base / "my_pkg" / "_VERSION"        # binary: from bundled file
        if version_file.is_file():
            return version_file.read_text().strip()
        return "dev"
```

**`sys._MEIPASS`** is PyInstaller's onefile extract dir. `getattr(sys, "_MEIPASS", ...)` falls back to the source directory in dev mode.

## GitHub Actions Workflow

Tag push (`v*`) triggers a matrix build → package → cross-repo release.

```yaml
name: Release
on:
  push:
    tags: ["v*"]

permissions:
  contents: read

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v4
      - run: uv python install 3.11
      - run: uv sync --dev
      - name: Lint
        run: |
          uv run ruff check .
          uv run ruff format --check .
      - name: Test
        run: uv run pytest -q

  build:
    needs: lint-and-test
    strategy:
      matrix:
        include:
          - os: macos-14
            platform: macos-arm64
            package_format: dmg
          - os: ubuntu-22.04
            platform: linux-amd64
            package_format: tar.gz
          - os: ubuntu-22.04-arm           # GitHub-hosted arm64 runner
            platform: linux-arm64
            package_format: tar.gz
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0                # needed for annotated tag message

      - uses: astral-sh/setup-uv@v4
      - run: uv python install 3.11
      - run: uv sync

      - name: Extract version
        id: version
        run: echo "version=${GITHUB_REF_NAME#v}" >> "$GITHUB_OUTPUT"

      - name: Write _VERSION
        run: echo "${{ steps.version.outputs.version }}" > my_pkg/_VERSION

      - name: Build binary
        run: uv run pyinstaller --onefile --name myapp --add-data "my_pkg/_VERSION:my_pkg" my_pkg/main.py

      - name: Smoke test
        run: ./dist/myapp --version | grep -q "${{ steps.version.outputs.version }}"

      - name: Assemble staging
        run: |
          mkdir -p staging
          cp dist/myapp staging/
          # binary archive contains the CLI + README only
          # standalone assets (skills.tar.gz, templates.tar.gz, etc.) are packaged in release job
          sed "s/__VERSION__/v${{ steps.version.outputs.version }}/g" scripts/release-readme.md > staging/README.md

      - name: Package DMG (macOS)
        if: matrix.package_format == 'dmg'
        run: |
          VERSION="${{ steps.version.outputs.version }}"
          DMG="myapp-${VERSION}-${{ matrix.platform }}.dmg"
          for i in 1 2 3; do
            hdiutil create -volname "My App ${VERSION}" \
              -srcfolder staging -ov -format UDZO "$DMG" && break
            echo "hdiutil attempt $i failed, retrying in 5s..."
            sleep 5
          done
          echo "artifact_name=${DMG}" >> "$GITHUB_ENV"

      - name: Package tar.gz (Linux)
        if: matrix.package_format == 'tar.gz'
        run: |
          VERSION="${{ steps.version.outputs.version }}"
          TAR="myapp-${VERSION}-${{ matrix.platform }}.tar.gz"
          tar -czf "$TAR" -C staging .
          echo "artifact_name=${TAR}" >> "$GITHUB_ENV"

      - uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.platform }}
          path: ${{ env.artifact_name }}

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/download-artifact@v4
        with:
          path: artifacts
          pattern: release-*
          merge-multiple: true

      # Package ancillary assets here (platform-independent), BEFORE checksums
      - name: Package skills as standalone asset
        run: |
          cd skills
          tar -czf ../artifacts/skills.tar.gz my-skill

      - name: Generate checksums
        run: cd artifacts && sha256sum * > checksums-sha256.txt

      - name: Fetch annotated tags
        run: git fetch --tags --force

      - name: Extract changelog from tag
        id: meta
        run: |
          VERSION="${GITHUB_REF_NAME#v}"
          echo "version=${VERSION}" >> "$GITHUB_OUTPUT"
          CHANGELOG="$(git tag -l --format='%(contents)' "$GITHUB_REF_NAME" | sed '/^$/d')"
          [ -z "$CHANGELOG" ] && CHANGELOG="v${VERSION}"
          echo "$CHANGELOG" > /tmp/release-notes.md

      - name: Publish to release repo
        env:
          GH_TOKEN: ${{ secrets.RELEASE_REPO_PAT }}
        run: |
          gh release create "v${{ steps.meta.outputs.version }}" \
            --repo owner/my-release-repo \
            --title "v${{ steps.meta.outputs.version }}" \
            --notes-file /tmp/release-notes.md \
            --latest \
            artifacts/*
```

### Key decisions

- **Annotated tags carry changelog** → `git tag -a v0.3.0 -m "changelog here"`
- **`fetch-depth: 0`** required to read tag messages (both checkout steps)
- **Lint/test gate** — `lint-and-test` job runs once on ubuntu-latest; the matrix `needs:` it so a broken tag never produces binaries. Keep tests fast (< 2 min) to avoid bottlenecking the release.
- **Three platforms** — macOS arm64, Linux amd64, Linux arm64. `ubuntu-22.04-arm` / `ubuntu-24.04-arm` are GitHub-hosted arm64 runners (paid for private repos, free for public). Do not cross-compile — native builds only; PyInstaller doesn't support it cleanly.
- **No macOS Intel by default** — Rosetta 2 translates the arm64 binary. Add a `macos-13` / `macos-amd64` matrix row only if users report real perf issues.
- **`hdiutil` retry loop** — macOS runners occasionally flake; 3 attempts with 5s sleep is enough
- **Smoke test after build** — binary can build but crash on import; always `--version` check
- **Checksums cover everything** including ancillary assets, so run sha256sum AFTER all artifacts land
- **PyInstaller `--add-data` separator**: `:` on Unix, `;` on Windows. This workflow targets Unix only. If you add a Windows matrix entry, conditionalize the separator.

### Ancillary assets (standalone downloads)

Ship skill files, templates, or config bundles as **separate release assets** alongside the binary archive. Lets downstream agents / CI / other projects `curl` just what they need.

**Delivery model:** users still run a single `curl .../install.sh | sh`. The installer then downloads two assets from the latest release: the platform-specific CLI archive and `skills.tar.gz`. Keep the public UX to one command; keep the release layout modular underneath.

**Where to package:** the `release` job, not the per-platform `build` job. Ancillary assets are platform-independent.

**Order matters:** insert the packaging step **after** `actions/download-artifact` and **before** `sha256sum`, so the tarball is included in `checksums-sha256.txt` and uploaded with `artifacts/*`.

**Stable URL convention** — GitHub serves a permanent redirect for every asset in the latest release:

```
https://github.com/<owner>/<repo>/releases/latest/download/<asset-name>
```

Downstream consumers never need to know the version number:

```bash
curl -fsSL https://github.com/owner/my-release-repo/releases/latest/download/skills.tar.gz | tar -xz
```

**Naming conventions:**
- Category-level names (`skills.tar.gz`, `templates.tar.gz`) beat project-prefixed ones — the release repo already scopes by owner/repo.
- Preserve a top-level directory inside the tar (`my-skill/SKILL.md`, not flat `SKILL.md`) so `tar -xz` creates a clean, labeled folder that can be dropped straight into `~/.claude/skills/` or an agent's skills dir.
- Keep asset names stable across versions — changing them breaks every hardcoded URL downstream.

**Must document the stable URL in the release repo README** — it's invisible otherwise. Also say explicitly that `install.sh` fetches both the CLI archive and `skills.tar.gz`, so the extra asset does not look optional or forgotten.

## POSIX Curl Installer

Hosted on the release repo's `main` branch (not in releases). Detects OS/arch, fetches latest release via GitHub API, installs to `~/.myapp/`.

```bash
#!/bin/sh
# Usage: curl -fsSL https://raw.githubusercontent.com/owner/my-release-repo/main/install.sh | sh
set -e

REPO="owner/my-release-repo"
INSTALL_DIR="$HOME/.myapp"

info()  { printf '  \033[1;34m>\033[0m %s\n' "$1"; }
error() { printf '  \033[1;31mError:\033[0m %s\n' "$1" >&2; exit 1; }

# Detect OS/arch
OS="$(uname -s)"; ARCH="$(uname -m)"
case "$OS" in
    Darwin) PLATFORM="macos" ;;
    Linux)  PLATFORM="linux" ;;
    *)      error "Unsupported OS: $OS" ;;
esac
case "$ARCH" in
    arm64|aarch64) ARCH_TAG="arm64" ;;
    x86_64|amd64)  ARCH_TAG="amd64" ;;
    *)             error "Unsupported architecture: $ARCH" ;;
esac

ASSET_PATTERN="myapp-.*-${PLATFORM}-${ARCH_TAG}"

# Detect sha256 tool (shasum on macOS, sha256sum on Linux)
if command -v sha256sum >/dev/null 2>&1; then
    SHA256="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
    SHA256="shasum -a 256"
else
    error "Neither sha256sum nor shasum found"
fi

# Fetch latest release
info "Fetching latest release ..."
RELEASE_JSON="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest")"
TAG="$(printf '%s' "$RELEASE_JSON" | grep '"tag_name"' | head -1 | sed 's/.*: *"\(.*\)".*/\1/')"
DOWNLOAD_URL="$(printf '%s' "$RELEASE_JSON" | grep '"browser_download_url"' | grep -E "$ASSET_PATTERN" | head -1 | sed 's/.*: *"\(.*\)".*/\1/')"
SKILLS_URL="$(printf '%s' "$RELEASE_JSON" | grep '"browser_download_url"' | grep 'skills.tar.gz' | head -1 | sed 's/.*: *"\(.*\)".*/\1/')"
CHECKSUM_URL="$(printf '%s' "$RELEASE_JSON" | grep '"browser_download_url"' | grep 'checksums-sha256.txt' | head -1 | sed 's/.*: *"\(.*\)".*/\1/')"
[ -n "$DOWNLOAD_URL" ] || error "No asset found for ${PLATFORM}-${ARCH_TAG}"
[ -n "$SKILLS_URL" ] || error "No skills.tar.gz found in release $TAG"
[ -n "$CHECKSUM_URL" ] || error "No checksums-sha256.txt in release $TAG — refusing to install unverified binary"

TMPDIR="$(mktemp -d)"; trap 'rm -rf "$TMPDIR"' EXIT
FILENAME="$(basename "$DOWNLOAD_URL")"
SKILLS_NAME="$(basename "$SKILLS_URL")"
info "Downloading $FILENAME ..."
curl -fsSL -o "$TMPDIR/$FILENAME" "$DOWNLOAD_URL"
info "Downloading $SKILLS_NAME ..."
curl -fsSL -o "$TMPDIR/$SKILLS_NAME" "$SKILLS_URL"
curl -fsSL -o "$TMPDIR/checksums.txt" "$CHECKSUM_URL"

# Verify sha256 before extracting either asset
checksum_for() {
    grep " $1\$" "$TMPDIR/checksums.txt" | awk '{print $1}'
}

verify_asset() {
    asset_name="$1"
    expected="$(checksum_for "$asset_name")"
    [ -n "$expected" ] || error "No checksum entry for ${asset_name} in checksums.txt"
    actual="$(cd "$TMPDIR" && $SHA256 "$asset_name" | awk '{print $1}')"
    [ "$expected" = "$actual" ] || error "Checksum mismatch for ${asset_name}: expected $expected, got $actual"
}

info "Verifying checksums ..."
verify_asset "$FILENAME"
verify_asset "$SKILLS_NAME"

# Extract and install
mkdir -p "$INSTALL_DIR"
case "$FILENAME" in
    *.dmg)
        MOUNT="$TMPDIR/mnt"; mkdir -p "$MOUNT"
        hdiutil attach "$TMPDIR/$FILENAME" -mountpoint "$MOUNT" -nobrowse -quiet
        cp "$MOUNT/myapp" "$INSTALL_DIR/myapp"; chmod +x "$INSTALL_DIR/myapp"
        hdiutil detach "$MOUNT" -quiet 2>/dev/null || true
        ;;
    *.tar.gz)
        EXT="$TMPDIR/ext"; mkdir -p "$EXT"
        tar -xzf "$TMPDIR/$FILENAME" -C "$EXT"
        cp "$EXT/myapp" "$INSTALL_DIR/myapp"; chmod +x "$INSTALL_DIR/myapp"
        ;;
esac

# Extract standalone skills asset into ~/.myapp/skills/
rm -rf "$INSTALL_DIR/skills"
mkdir -p "$INSTALL_DIR/skills"
tar -xzf "$TMPDIR/$SKILLS_NAME" -C "$INSTALL_DIR/skills"

# Add to PATH
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "$(command -v zsh 2>/dev/null)" ]; then
    RC="$HOME/.zshrc"
else
    RC="$HOME/.bashrc"
fi
grep -qF '.myapp' "$RC" 2>/dev/null || printf '\n# My App\nexport PATH="$HOME/.myapp:$PATH"\n' >> "$RC"
export PATH="$INSTALL_DIR:$PATH"

INSTALLED_VER="$("$INSTALL_DIR/myapp" --version 2>/dev/null || echo "unknown")"
echo ""
echo "  myapp $INSTALLED_VER installed!"
echo "  Run: source $RC && myapp --help"
```

### Design notes

- **POSIX `sh`, not bash** — works on Alpine, BusyBox, dash
- **`mktemp -d` + `trap`** for cleanup on any exit path
- **JSON parsing with grep/sed** — no `jq` dependency (not pre-installed everywhere)
- **Checksum verification before extract** — downloads `checksums-sha256.txt` from the same release and compares sha256 of both the binary archive and `skills.tar.gz`. macOS ships `shasum`, Linux ships `sha256sum` — detect whichever is available. Unverified assets never touch `~/.myapp/`.
- **Checksum file missing = hard fail**, not silent skip. A release without checksums is a malformed release; refusing to install is the safe default.
- **One public install command, two release downloads** — `install.sh` resolves the matching CLI archive, then separately fetches `skills.tar.gz`
- **Handles both DMG and tar.gz** for the CLI archive, then extracts `skills.tar.gz` into `~/.myapp/skills/`
- **PATH idempotency** — `grep -qF` before appending so re-running doesn't duplicate

## Self-Update (Python)

Built into the CLI. Two modes: passive background check + explicit `update` command.

### Passive check

```python
RELEASE_REPO = "owner/my-release-repo"
API_URL = f"https://api.github.com/repos/{RELEASE_REPO}/releases/latest"
CHECK_INTERVAL = 86400  # 24 hours
INSTALL_DIR = Path.home() / ".myapp"
CACHE_FILE = INSTALL_DIR / ".update-check"


def check_for_update(force: bool = False, raise_on_error: bool = False) -> dict | None:
    """Check for updates. Passive mode returns None on network failure."""
    current = get_current_version()
    if current == "dev":
        return None

    if not force and CACHE_FILE.is_file():
        try:
            if time.time() - float(CACHE_FILE.read_text().strip()) < CHECK_INTERVAL:
                return None
        except (ValueError, OSError):
            pass

    try:
        release = fetch_latest_release()   # httpx.get(API_URL, timeout=5)
    except Exception as exc:
        if raise_on_error:
            raise RuntimeError("Failed to fetch latest release metadata") from exc
        return None

    CACHE_FILE.write_text(str(time.time()))  # update cache after a successful fetch only

    if release is None:
        if raise_on_error:
            raise RuntimeError("Latest release metadata was empty")
        return None

    latest_tag = release.get("tag_name", "")
    if _parse_version(latest_tag) > _parse_version(current):
        return {"current": current, "latest": latest_tag.lstrip("v"), "tag": latest_tag}
    return None


def _parse_version(tag: str) -> tuple[int, ...]:
    """Parse 'v1.2.3' or '1.2.3' into a comparable tuple.

    Naive — does NOT support prerelease tags like 'v1.2.3-rc1'
    (the '-rc1' segment is silently dropped). For semver-prerelease
    support, switch to `packaging.version.Version`.
    """
    return tuple(int(x) for x in tag.lstrip("v").split(".") if x.isdigit())
```

### Performing the update

```python
def perform_update() -> str:
    """Download latest release, replace binary, return new version."""
    release = fetch_latest_release()
    pattern = _detect_asset_pattern()       # "macos-arm64.dmg" or "linux-amd64.tar.gz"

    download_url = next(
        (a["browser_download_url"] for a in release["assets"] if a["name"].endswith(pattern)),
        None
    )
    if not download_url:
        raise RuntimeError(f"No asset matching {pattern}")

    checksum_url = next(
        (a["browser_download_url"] for a in release["assets"] if a["name"] == "checksums-sha256.txt"),
        None,
    )
    if not checksum_url:
        raise RuntimeError("Release missing checksums-sha256.txt — refusing unverified update")

    skills_url = next(
        (a["browser_download_url"] for a in release["assets"] if a["name"] == "skills.tar.gz"),
        None,
    )
    if not skills_url:
        raise RuntimeError("Release missing skills.tar.gz")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_path = Path(tmpdir)
        archive = tmp_path / Path(download_url).name
        skills_archive = tmp_path / "skills.tar.gz"
        _download(download_url, archive)
        _download(skills_url, skills_archive)

        # Verify sha256 before touching the installed binary or standalone skills asset
        _download(checksum_url, tmp_path / "checksums.txt")
        for artifact in (archive, skills_archive):
            expected = _lookup_checksum(tmp_path / "checksums.txt", artifact.name)
            actual = hashlib.sha256(artifact.read_bytes()).hexdigest()
            if expected != actual:
                raise RuntimeError(f"Checksum mismatch for {artifact.name}")

        if archive.suffix == ".dmg":
            new_binary = _extract_dmg(archive, tmp_path)
        else:
            new_binary = _extract_tarball(archive, tmp_path)

        target = INSTALL_DIR / "myapp"
        # macOS/Linux allow replacing a running executable (inode swap).
        # On Windows this would require renaming the current binary first.
        shutil.copy2(new_binary, target)
        target.chmod(0o755)

        # Refresh standalone skills asset into ~/.myapp/skills/
        skills_dir = INSTALL_DIR / "skills"
        shutil.rmtree(skills_dir, ignore_errors=True)
        skills_dir.mkdir(parents=True, exist_ok=True)
        with tarfile.open(skills_archive, "r:gz") as tar:
            tar.extractall(skills_dir)

    CACHE_FILE.unlink(missing_ok=True)      # reset cache after update
    return release["tag_name"].lstrip("v")
```

**Replacing a running binary** works on macOS/Linux because `cp` unlinks the old inode while the running process keeps its handle open. The new binary takes effect on the next invocation. On Windows you'd need to rename the current binary first (`myapp.exe` → `myapp.old.exe`) then write the new one.

**Standalone assets update separately** — the updater should treat `skills.tar.gz` exactly like the CLI archive: download it from the release, verify checksum, then refresh `~/.myapp/skills/`. Do not assume the binary archive contains a `skills/` directory.

### Integration in CLI entry point

```python
@app.callback(invoke_without_command=True)
def main_callback(version: bool = typer.Option(False, "--version")):
    if version:
        print(get_current_version())
        raise typer.Exit()

    # Passive update check — non-blocking, silent on error
    try:
        info = check_for_update()
        if info:
            Console(stderr=True).print(
                f"[dim]Update available: v{info['latest']} (current: v{info['current']}). "
                f"Run: myapp update[/dim]"
            )
    except Exception:
        pass


@app.command()
def update(
    check: bool = typer.Option(False, "--check", "-c", help="Only check, don't install."),
):
    """Check for and install the latest version."""
    info = check_for_update(force=True, raise_on_error=True)
    if info is None:
        console.print(f"[green]Already up to date ({get_current_version()})[/green]")
        raise typer.Exit()

    console.print(f"[yellow]Update available:[/yellow] v{info['current']} → v{info['latest']}")
    if check:
        console.print("Run [bold]myapp update[/bold] to install.")
        return

    console.print("Downloading and installing...")
    new_version = perform_update()
    console.print(f"[green]Updated to v{new_version}![/green] Restart to use the new version.")
```

**Passive check must never block or throw** — wrap in bare `except Exception: pass`. Users should never see a traceback because GitHub's API was slow. But an explicit `myapp update` should surface fetch failures instead of claiming the install is already current.

## Local Build Script

For dev testing of the binary (same output as CI, installed to `~/.myapp/`):

```bash
#!/bin/bash
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INSTALL_DIR="$HOME/.myapp"
VERSION="$(grep '^version' "$REPO_ROOT/pyproject.toml" | head -1 | sed 's/.*"\(.*\)".*/\1/')"

echo "$VERSION" > "$REPO_ROOT/my_pkg/_VERSION"
cd "$REPO_ROOT"
uv run pyinstaller --onefile --name myapp \
    --add-data "my_pkg/_VERSION:my_pkg" \
    my_pkg/main.py

mkdir -p "$INSTALL_DIR"
cp dist/myapp "$INSTALL_DIR/myapp"
chmod +x "$INSTALL_DIR/myapp"
rm -f "$REPO_ROOT/my_pkg/_VERSION"

echo "Installed to $INSTALL_DIR/myapp (v${VERSION})"
```

## RELEASE_REPO_PAT Scope

Fine-grained Personal Access Token:

1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens**
2. **Repository access:** only select the release repo (`owner/my-release-repo`)
3. **Repository permissions:**
   - Contents: **Read and write** (to create releases and upload assets)
   - Metadata: Read (required, auto-enabled)
4. Expiration: set a calendar reminder — the workflow silently fails on expiry
5. Copy the token, then in the **source** repo: Settings → Secrets and variables → Actions → New repository secret
   - Name: `RELEASE_REPO_PAT`
   - Value: (paste token)

**Do NOT use `GITHUB_TOKEN`** — it's scoped to the current repo and cannot push to the release repo.

## Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Version source | `pyproject.toml` | Single source of truth |
| `_VERSION` file | Built at CI time, bundled by PyInstaller | Runtime version in binary |
| `release.yml` | `.github/workflows/` | Tag → build → publish |
| `remote-install.sh` | `scripts/` in source repo → copied to release repo `main` as `install.sh` | `curl \| sh` installer |
| `build-local.sh` | `scripts/` | Dev binary builds |
| `release-readme.md` | `scripts/` | Template with `__VERSION__` placeholder |
| `updater.py` | CLI package | Self-update logic |
| `RELEASE_REPO_PAT` | GitHub secret on source repo | Cross-repo publish auth |

## Common CI Mistakes

| Mistake | Fix |
|---------|-----|
| Forgetting `fetch-depth: 0` | Tag message reads as empty → generic changelog. Both checkout steps need it. |
| `_VERSION` committed to source | Add to `.gitignore` — it's a build artifact |
| `jq` in installer | Not pre-installed everywhere — use grep/sed |
| Blocking update check | Set short timeout (5s), catch all exceptions |
| Non-POSIX installer | Use `#!/bin/sh` not `#!/bin/bash`, test on dash |
| No smoke test in CI | Binary can build but crash on import — always `--version` check |
| Forgetting checksum | Always generate `sha256sum` for release assets |
| Hard-coded platform list | Use `uname` detection in installer, `platform` module in updater |
| Packaging ancillary assets in build job | Duplicates them per-platform. Do it in the release job, once. |
| Ancillary asset step AFTER sha256sum | Checksums won't cover it. Package first, then checksum. |
| `GITHUB_TOKEN` instead of PAT for cross-repo | `gh release create --repo other/repo` fails silently — needs PAT with Contents: Write on target |
| No lint/test gate | Broken build or lint-dirty code ships as a release | Separate `lint-and-test` job on ubuntu-latest; `build` matrix has `needs: lint-and-test` |
| Cross-compiling for Linux arm64 from amd64 | PyInstaller can't do it cleanly; bundled deps won't match | Use `ubuntu-22.04-arm` native runner — `runs-on` picks the right architecture |
| Installer skips checksum verification | Tampered asset installs silently | Pull `checksums-sha256.txt` alongside and `sha256` match before extract |
| Updater skips checksum verification | Self-update delivers tampered binary | Same pattern in Python — `hashlib.sha256` compare against `checksums-sha256.txt` before swap |
