---
name: cli-feature-design
description: Deep-dive reference for CLI feature design — typer command structure, env var config, layered .env loading, agent-friendly output formats, init/set-env/update command implementations, error handling, pagination
---

# CLI Feature Design (Reference)

Deep-dive companion to `dual-repo-cli-release`. Read this when implementing commands, output formats, or config loading. The main SKILL.md has the rules; this file has the code.

## App Structure (typer)

```python
app = typer.Typer(name="myapp", no_args_is_help=True)

# Command groups as sub-typers
docs_app = typer.Typer(help="Browse documentation.", no_args_is_help=True)
app.add_typer(docs_app, name="docs")
# Result: myapp docs categories, myapp docs search, etc.
```

**`no_args_is_help=True`** — running `myapp` or `myapp docs` with no args shows help instead of an error.

## Essential Commands

| Command | Purpose | Pattern |
|---------|---------|---------|
| `init` | Interactive first-time setup | Prompt for credentials → write `.env` |
| `update` | Self-update binary | `--check` flag for dry-run |
| `set-env KEY VALUE` | Modify config without editing files | `--local/--global` flag |
| `--version` / `-V` | Show version | Eager callback on app |

### `init` command

```python
@app.command()
def init(
    local: bool = typer.Option(False, "--local/--global",
        help="--local: save to ./.env. --global: save to ~/.myapp/.env (default)."),
) -> None:
    """Interactively set up credentials."""
    env_path = Path.cwd() / ".env" if local else Path.home() / ".myapp" / ".env"

    if env_path.is_file():
        # Show existing config (mask secrets) and ask to overwrite
        existing = dotenv_values(env_path)
        console.print(
            f"  MYAPP_API_TOKEN={_mask_token(existing.get('MYAPP_API_TOKEN', ''))}"
        )
        if not typer.confirm("Overwrite?", default=False):
            raise SystemExit(0)

    subdomain = typer.prompt("Subdomain")
    email = typer.prompt("Email")
    token = typer.prompt("API token", hide_input=True)

    env_path.parent.mkdir(parents=True, exist_ok=True)
    env_path.write_text(
        f"MYAPP_SUBDOMAIN={subdomain}\nMYAPP_EMAIL={email}\nMYAPP_API_TOKEN={token}\n"
    )
    console.print(f"[green]Saved to {env_path}[/green]")


def _mask_token(token: str) -> str:
    if not token:
        return "(empty)"
    if len(token) < 8:
        return "****"
    return f"{token[:4]}...{token[-4:]}"
```

### `set-env` command

**Do not use `dotenv_values` round-trip** — it discards comments, blank lines, and key order. Users who hand-maintain `.env` (comments explaining each var, sectioned groups) lose everything on the first `set-env`. Rewrite line-by-line instead: match `KEY=` as a prefix, replace that one line, leave the rest untouched.

```python
@app.command("set-env")
def set_env(
    env_name: str = typer.Argument(..., help="Variable name."),
    value: str = typer.Argument(..., help="Value."),
    local: bool = typer.Option(False, "--local/--global"),
) -> None:
    """Set or update a variable in the .env file, preserving comments."""
    env_path = _find_env_path(local)
    old_value = _replace_env_line(env_path, env_name, value)
    if old_value is not None:
        console.print(f"[green]Updated[/green] {env_name}: {old_value} -> {value}  ({env_path})")
    else:
        console.print(f"[green]Added[/green] {env_name}={value}  ({env_path})")


def _replace_env_line(env_path: Path, key: str, value: str) -> str | None:
    """Rewrite env_path with KEY=value, preserving comments/order.

    Returns the previous value if the key existed, else None.
    """
    old_value: str | None = None
    new_line = f"{key}={value}\n"

    if not env_path.is_file():
        env_path.parent.mkdir(parents=True, exist_ok=True)
        env_path.write_text(new_line, encoding="utf-8")
        return None

    out_lines: list[str] = []
    replaced = False
    for line in env_path.read_text(encoding="utf-8").splitlines(keepends=True):
        stripped = line.lstrip()
        # Keep comments and blanks verbatim
        if not stripped or stripped.startswith("#"):
            out_lines.append(line)
            continue
        # Match "KEY=" (ignore surrounding whitespace on KEY only)
        if "=" in stripped:
            existing_key = stripped.split("=", 1)[0].rstrip()
            if existing_key == key:
                old_value = stripped.split("=", 1)[1].rstrip("\n").rstrip("\r")
                out_lines.append(new_line)
                replaced = True
                continue
        out_lines.append(line)

    if not replaced:
        # Ensure trailing newline on the last existing line before appending
        if out_lines and not out_lines[-1].endswith("\n"):
            out_lines[-1] = out_lines[-1] + "\n"
        out_lines.append(new_line)

    env_path.write_text("".join(out_lines), encoding="utf-8")
    return old_value
```

**Why not preserve the exact quoting of the value?** Keep it simple: `KEY=value` bare form is always valid; don't try to reproduce `KEY="foo bar"` quoting. If the user needs spaces or shell-metachars, they can edit the file directly.

### `--version` eager callback

```python
def _version_callback(value: bool) -> None:
    if value:
        try:
            ver = importlib.metadata.version("my-cli")
        except importlib.metadata.PackageNotFoundError:
            base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
            version_file = base / "my_pkg" / "_VERSION"
            ver = version_file.read_text().strip() if version_file.is_file() else "dev"
        typer.echo(ver)
        raise typer.Exit()


@app.callback()
def main(
    version: bool = typer.Option(False, "--version", "-V",
        help="Show version and exit.",
        callback=_version_callback, is_eager=True),
) -> None:
    """CLI tool for browsing widgets.

    \b
    Environment variables (set in .env or shell):
      MYAPP_SUBDOMAIN    Service subdomain (required)
      MYAPP_EMAIL        Account email (required)
      MYAPP_API_TOKEN    API token (required)
      MYAPP_OUTPUT       Default output format: table, text, json, csv
    """
```

**`\b` in typer docstring** prevents paragraph rewrapping — keeps env var list formatted.

## Environment Variable Config

### Naming convention

All env vars must use a **namespace prefix** matching the CLI name, in `SCREAMING_SNAKE_CASE`:

```
MYAPP_SUBDOMAIN      not SUBDOMAIN
MYAPP_EMAIL          not EMAIL
MYAPP_API_TOKEN      not API_TOKEN
MYAPP_OUTPUT         not OUTPUT
```

**Why prefix?** Avoids collisions with other tools. `EMAIL` or `OUTPUT` are too generic — they'll clash with other CLIs or system vars. The prefix also makes `env | grep MYAPP` instantly show all relevant config.

**Retrofitting a legacy unprefixed var:** if the CLI already shipped with `TIMEZONE` (or similar) and users depend on it, don't silently rename. Either (a) accept both names for one release with a deprecation warning, or (b) document the legacy name as a permanent exception. The CLI this skill was extracted from kept `TIMEZONE` unprefixed for backward compatibility — a real-world reminder that the prefix rule is easier to enforce on Day 0 than after users have `.env` files in the wild.

**Typer `envvar=` must also use the prefixed name:** keep one canonical key even if values come from inherited shell env, `~/.myapp/.env`, or `./.env`.

```python
output: OutputFormat = typer.Option(
    OutputFormat.TABLE, "-o", "--output",
    envvar="MYAPP_OUTPUT",            # ← prefixed, same as .env
)
```

### Env var categories

| Category | Examples | Notes |
|----------|----------|-------|
| **Credentials** (required) | `MYAPP_SUBDOMAIN`, `MYAPP_EMAIL`, `MYAPP_API_TOKEN` | Set via `init` command, validated on first API call |
| **Display defaults** (optional) | `MYAPP_OUTPUT`, `MYAPP_TIMEZONE` | Overridable per-command via flags (`-o`, `-tz`) |
| **Behavior toggles** (optional) | `MYAPP_FILTER_BOTS` | Boolean: `true`/`false`, default `false` |

### Layered loading

The intended precedence here is: per-directory `./.env` override first, `~/.myapp/.env` as the default config source second, inherited shell env third.

```python
def _find_and_load_env() -> None:
    # 3. inherited shell env is already in os.environ when the process starts
    home_values = dotenv_values(Path.home() / ".myapp" / ".env")   # 2. default config
    local_values = dotenv_values(Path.cwd() / ".env")              # 1. per-directory override

    for key, value in home_values.items():
        if value is not None:
            os.environ[key] = value

    for key, value in local_values.items():
        if value is not None:
            os.environ[key] = value


def _find_env_path(local: bool = False) -> Path:
    """Return .env path based on --local/--global flag."""
    return Path.cwd() / ".env" if local else Path.home() / ".myapp" / ".env"


class AppConfig:
    def __init__(self):
        _find_and_load_env()
        self.subdomain = os.getenv("MYAPP_SUBDOMAIN", "")
        self.email = os.getenv("MYAPP_EMAIL", "")
        self.api_token = os.getenv("MYAPP_API_TOKEN", "")
        self.timezone_offset = int(os.getenv("MYAPP_TIMEZONE", "0") or 0)
        self.filter_bots = os.getenv("MYAPP_FILTER_BOTS", "false").strip().lower() == "true"

    def validate(self) -> None:
        missing = [k for k, v in [
            ("MYAPP_SUBDOMAIN", self.subdomain),
            ("MYAPP_EMAIL", self.email),
            ("MYAPP_API_TOKEN", self.api_token),
        ] if not v]
        if missing:
            Console(stderr=True).print(f"[red]Error:[/red] Missing: {', '.join(missing)}")
            Console(stderr=True).print("\nRun [bold]myapp init[/bold] or set in .env")
            sys.exit(1)

config = AppConfig()  # singleton, loaded once at import
```

**Priority:** CWD `.env` > `~/.myapp/.env` > inherited shell env

**This is intentional, not accidental.** A checked-in or hand-written local `.env` is treated as a
per-directory override, and `~/.myapp/.env` is the user's default baseline. An inherited shell export
like `export MYAPP_OUTPUT=text` only fills gaps when neither file sets the key.

**Don't validate at import time** — `--help` and `--version` need to work without credentials. Call `config.validate()` from the client constructor (first API call).

### Three ways to set config

```bash
# 1. Interactive setup (credentials)
myapp init                                    # writes ~/.myapp/.env

# 2. Programmatic (individual vars, no editor needed)
myapp set-env MYAPP_OUTPUT text               # writes to ~/.myapp/.env (default config)
myapp set-env --local MYAPP_TIMEZONE 9        # writes to ./.env (highest-priority local override)

# 3. Shell export (session-only fallback)
export MYAPP_OUTPUT=text
```

### `.env.example`

Always ship one with prefixed names and comments:

```bash
# Required — set via `myapp init` or manually
MYAPP_SUBDOMAIN=
MYAPP_EMAIL=
MYAPP_API_TOKEN=

# Default output format for all commands (table, text, json, csv)
# Override per-command with -o / --output flag
# MYAPP_OUTPUT=table

# Timezone offset in hours (e.g. 9 for JST, -7 for PDT). Default: 0 (UTC)
# Override per-command with -tz / --timezone flag
# MYAPP_TIMEZONE=0

# Filter AI bot comments from ticket views (default: false)
# MYAPP_FILTER_BOTS=true
```

## Output Formats (Agent-Friendly)

A CLI used by both humans and AI agents needs multiple output modes. Key insight: **`text` mode outputs markdown** — lingua franca for LLMs, readable by humans, parseable by agents.

```python
class OutputFormat(str, Enum):
    TABLE = "table"    # rich Table with colors — for human terminals
    TEXT = "text"      # markdown output — for LLMs/agents and piping
    JSON = "json"      # raw API response — for programmatic use
    CSV = "csv"        # standard CSV — for spreadsheets/data export
```

**Why markdown for `text` mode?**
- LLMs natively understand markdown tables, headers, lists
- Human-readable in terminals (unlike raw JSON)
- Pipeable: `myapp items -o text | pbcopy` → paste into chat
- No ANSI escape codes that confuse agents

**Switchable via `-o` flag OR env var** — same canonical key, regardless of where the value came from:

```python
output: OutputFormat = typer.Option(
    OutputFormat.TABLE, "-o", "--output",
    help="Output format: table (rich), text (markdown/LLM), json, csv.",
    envvar="MYAPP_OUTPUT",              # inherited shell env fallback; .env files can still override it
)
```

**Format behavior by mode:**

| Mode | List view | Detail view | Use case |
|------|-----------|-------------|----------|
| `table` | Rich Table, ANSI colors, status/priority color-coded | Panel with sections | Human in terminal |
| `text` | Markdown table, plain text | Markdown headers + body | LLM agent, clipboard, piping |
| `json` | Raw API response (full) | Raw API response + comments | Scripting, jq, programmatic |
| `csv` | CSV with headers | CSV single row | Spreadsheet export |

**Example `text` output (markdown):**

```
| ID | Created | Priority | Status | Subject |
|----|---------|----------|--------|---------|
| 1220 | 2025-03-15 10:30:00 | high | open | Login failure after update |
| 1219 | 2025-03-14 09:15:00 | normal | pending | Cannot export reports |

Page 1 · 2 of 45 tickets · Next: myapp tickets -n 2 -p 2 -o text
```

### Display module: separate extraction from rendering

```python
# Shared field extraction (used by all formats)
def _extract_list_row(item, user_map=None, comment_map=None) -> dict:
    row = {"ID": item["id"], "Status": item["status"], "Subject": item["subject"]}
    if user_map:
        row["Assignee"] = user_map.get(item.get("assignee_id", 0), "")
    if comment_map:
        row["Latest"] = comment_map.get(item["id"], "")
    return row


# Format-specific renderers — all take the same row dicts
def _print_table(rows, ...):      # rich Table with ANSI colors
def _print_text(rows, ...):       # markdown table, no ANSI
def _print_csv(rows, ...):        # csv.writer to stdout
def _print_json(raw_data):        # json.dumps of full API response


# Public API — dispatches by format
def print_items(items, raw_data, fmt: OutputFormat, user_map=None, comment_map=None, ...):
    if fmt == OutputFormat.JSON:
        return _print_json(raw_data)
    rows = [_extract_list_row(i, user_map, comment_map) for i in items]
    {
        OutputFormat.TABLE: _print_table,
        OutputFormat.TEXT: _print_text,
        OutputFormat.CSV: _print_csv,
    }[fmt](rows, ...)
```

**Cross-cutting context** (user_map, comment_map, field_map) flows from `main.py` → `print_items` → `_extract_list_row`. Resolve once in main, pass through as kwargs — don't re-fetch inside display code.

## Flag Conventions

Consistent short flags across all commands:

| Flag | Short | Purpose | Example |
|------|-------|---------|---------|
| `--limit` | `-n` | Items per page | `-n 20` |
| `--page` | `-p` | Page number | `-p 2` |
| `--sort-by` | `-s` | Sort field | `-s created_at` |
| `--output` | `-o` | Output format | `-o json` |
| `--version` | `-V` | Show version | (eager callback) |
| `--query` | `-q` | Search text | `-q "error"` |

### Pagination with next-page hints

```python
# After printing results, show how to get next page
if data.get("next_page"):
    next_cmd = f"myapp items -n {limit} -p {page + 1}"
    if status: next_cmd += f" --status {status}"
    if output != "table": next_cmd += f" -o {output}"
    console.print(f"[dim]Next page: {next_cmd}[/dim]")
```

Agents cannot infer the next command on their own — print it verbatim.

## Smart Entity Resolution

When a flag can accept multiple input types:

```python
@app.command()
def items(
    assignee: str | None = typer.Option(None, "--assignee",
        help='Filter by assignee: user ID, email, name, or "me".'),
):
    if assignee:
        user_id = client.resolve_assignee(assignee)
        # resolve_assignee handles:
        #   "me"          → GET /users/me.json → user_id
        #   "12345"       → used directly as int
        #   "alice@co.me" → GET /users/search.json?query=... → first match
```

## Error Handling

```python
def _error(message: str) -> None:
    """Print to stderr with color, then exit 1."""
    Console(stderr=True).print(f"[red]Error:[/red] {message}")
    raise SystemExit(1)


# Usage — validate before API calls, catch HTTP errors after
def set_status(ticket_id: int, status: str):
    if status not in ALLOWED:
        _error(f'Invalid status "{status}". Allowed: {", ".join(ALLOWED)}.')
    try:
        client.update(ticket_id, {"status": status})
    except httpx.HTTPStatusError as err:
        _error(f"Update failed with HTTP {err.response.status_code}.")
```

**Errors go to stderr** (`Console(stderr=True)`) so JSON/CSV output on stdout stays parseable. Critical for agent pipelines and `| jq` usage.

## Client Layer

```python
class ApiClient:
    def __init__(self):
        config.validate()                       # fail early if creds missing
        self._client = httpx.Client(
            base_url=config.base_url,
            auth=config.auth,                   # HTTP Basic
            timeout=30.0,
            headers={"Accept": "application/json"},
        )

    def _get(self, path, params=None) -> dict:
        resp = self._client.get(path, params=params)
        resp.raise_for_status()
        return resp.json()
```

**Validate config on client init**, not at import time — so `--help` and `--version` work without credentials.

## Deprecation Pattern

Never silently rename a shipped env var or command. Users have `.env` files, shell aliases, and CI pipelines pinned to the old name. A silent rename turns into a broken upgrade.

### Env var rename (e.g. `TIMEZONE` → `MYAPP_TIMEZONE`)

Accept both in `config.py`, prefer new, warn on old. Remove the legacy path only at the next major version.

```python
import warnings

def _get_env(new_name: str, legacy_name: str | None = None) -> str | None:
    """Read env var, falling back to legacy name with a deprecation warning."""
    value = os.getenv(new_name)
    if value is not None:
        return value
    if legacy_name:
        legacy_value = os.getenv(legacy_name)
        if legacy_value is not None:
            Console(stderr=True).print(
                f"[yellow]Warning:[/yellow] {legacy_name} is deprecated, "
                f"use {new_name}. Old name will be removed in the next major release."
            )
            return legacy_value
    return None


class AppConfig:
    def __init__(self):
        _find_and_load_env()
        self.subdomain = _get_env("MYAPP_SUBDOMAIN") or ""
        self.timezone_offset = int(_get_env("MYAPP_TIMEZONE", legacy_name="TIMEZONE") or 0)
        # ...
```

Document the deprecation in help text:

```python
"""
\b
Environment variables:
  MYAPP_TIMEZONE     Timezone offset in hours (e.g. 9, -7). Default: 0
                     (Legacy alias: TIMEZONE — deprecated, remove after next major)
"""
```

### Command rename

Use a hidden alias command that forwards to the new one:

```python
@app.command("assign-to")  # new canonical name
def assign_to(ticket_id: int, assignee: str): ...


@app.command("assign", hidden=True, deprecated=True)
def assign_deprecated(ticket_id: int, assignee: str):
    """Deprecated. Use `assign-to`."""
    Console(stderr=True).print(
        "[yellow]Warning:[/yellow] `assign` is deprecated, use `assign-to`."
    )
    assign_to(ticket_id, assignee)
```

`hidden=True` keeps the old name out of `--help`; `deprecated=True` marks it in typer's internal model. The warning tells active users; the help text only advertises the new name.

### Output format rename

Same idea, but `Enum` values need aliasing carefully. Either add both values to the enum and normalize in a dispatcher, or accept both strings in a `callback=`.

## Shell Completion

Typer installs `--install-completion` and `--show-completion` hidden options on every app by default (`typer.Typer(add_completion=True)`, which is the default). No extra code required — but users don't know it exists unless you tell them.

**Add a one-liner to your help text and README:**

```
To enable tab completion:
  myapp --install-completion zsh    # or bash, fish, powershell
  # then restart your shell
```

**Verification in CI or local test:** `myapp --show-completion zsh` should dump a completion script. If it errors, check that `add_completion=False` wasn't accidentally passed to `typer.Typer(...)`.

**Binary mode caveat:** completion scripts shell out to `myapp` at autocomplete time. With a PyInstaller onefile binary each tab-press triggers a ~100-300ms extraction. Fine for interactive use; annoying on slow machines. No good fix short of switching to `--onedir`.
