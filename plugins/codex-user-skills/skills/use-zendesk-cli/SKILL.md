---
name: use-zendesk-cli
description: Operate the Zendesk CLI to browse tickets, manage assignments and statuses, search Help Center articles, render ticket images, and download attachments. Use when the user asks to check Zendesk tickets, look up help center docs, download attachments, assign tickets, change ticket status, render ticket snapshots, or configure CLI settings via the command line.
---

# Use Zendesk CLI

Translate ticket / help-center / attachment / image requests into `zendesk` CLI commands and return output in the format the user wants.

## When To Use

Trigger on any of these workflows:

- Setup — interactive credential configuration (`zendesk init`)
- Configuration — update env vars (`zendesk set-env`), timezone, default output format
- Tickets — list, filter, sort, paginate, search, inspect, update assignee/status
- Attachments — list or download (individual or all) attachments on a ticket
- Images — render tickets as PNG (`zendesk get-image`), clean up (`zendesk clear-images`)
- Help Center docs — browse categories/sections/articles, search, show article body
- Output control — choose `table|text|json|csv` or set `ZENDESK_OUTPUT`
- Troubleshooting CLI or API failures for any of the above

Common trigger intents: "初始化配置", "查工单", "筛工单", "看某个 ticket", "下载附件", "搜索帮助中心", "输出改成 text/json", "查看版本", "生成工单截图", "设置时区"

## Workflow

### 1. Confirm Runtime and Auth

Run commands with `zendesk ...` (the CLI is already installed globally).

Check the CLI is working:

```bash
zendesk --version      # or zendesk -V
```

If credentials are not yet configured, run interactive setup:

```bash
zendesk init            # saves to ~/.zendesk-cli/.env (global)
zendesk init --local    # saves to ./.env (current directory)
```

Required env vars (in `.env` or `~/.zendesk-cli/.env`):

```
ZENDESK_SUBDOMAIN=your-subdomain
ZENDESK_EMAIL=your-email@example.com
ZENDESK_API_TOKEN=your-api-token
```

Optional env vars:
- `ZENDESK_OUTPUT=text` — default output format
- `TIMEZONE=9` — UTC offset for displayed times (default: UTC)

If any variable is missing, suggest running `zendesk init` first — do not retry without credentials.

### 2. Choose Command and Output Mode

All commands accept `-o/--output`: `table` (default), `text` (LLM-friendly), `json` (pipe to `jq`), `csv`.

When running on behalf of an AI agent or for scripting, prefer `-o text`.

Output precedence: CLI flag `-o` > env `ZENDESK_OUTPUT` > default `table`.

### 3. Execute

#### List / Filter Tickets

```bash
zendesk tickets -n 10
zendesk tickets -n 20 --page 2
zendesk tickets --sort-by updated_at --sort-order asc
zendesk tickets -n 5 --latest-comments        # attach last comment

zendesk tickets --status open
zendesk tickets --status unsolved              # new/open/pending/hold
zendesk tickets --priority urgent
zendesk tickets --assignee me
zendesk tickets --assignee john@example.com
zendesk tickets --since 2026-01-01 --until 2026-01-31
zendesk tickets --assignee me --status open --priority high

# Free-text search (combines with any filter above)
zendesk tickets -q "delete plugin"
zendesk tickets -q "login issue" --status open --assignee me
zendesk tickets -q "password reset" -n 5 -o json
```

Filters: `--status`, `--priority`, `--assignee`, `--since`, `--until`, `-q/--query`.
Sort: `--sort-by` (`created_at|updated_at|priority|status`), `--sort-order` (`asc|desc`).
Pagination: `-n/--limit` (max 100), `-p/--page`.
Status aliases: `unsolved`, `unresolved`, `active` all mean `status<solved`.

#### View One Ticket

```bash
zendesk ticket 1220
zendesk ticket 1220 --latest-comments 3
zendesk ticket 1220 --latest-comments 1        # newest single reply
zendesk ticket 1220 --no-comments               # metadata only, faster
zendesk ticket 1220 -o json | jq '.ticket.subject'
```

Custom fields with non-empty values are automatically displayed with their human-readable names.

#### Update a Ticket

```bash
zendesk assign-to 1220 me
zendesk assign-to 1220 john@example.com
zendesk set-status 1220 pending
```

- `assign-to` accepts: `me`, numeric user ID, email, or name.
- `set-status` only allows `open` or `pending`. Other values (including `new`, `hold`, `closed`, `solved`) are intentionally blocked.

#### Configuration

```bash
zendesk set-env TIMEZONE 9                # UTC+9 (e.g. JST)
zendesk set-env ZENDESK_OUTPUT text       # default output format
zendesk set-env TIMEZONE 9 --local        # write to ./.env instead of global
zendesk set-env -- TIMEZONE -7            # use -- for negative values
```

#### Render Tickets as PNG

```bash
zendesk get-image 1592 1686 1685
zendesk get-image 1592 1686 --file tickets.png
zendesk get-image 1592 1686 --timezone 9       # override TIMEZONE env
zendesk get-image 1592 1686 -tz -7
```

- Images saved to `~/.zendesk-cli/images/` by default (override with `--file`).
- Shows table with columns: ID, Priority, Status, Assignee, Updated (UTC+N), Subject.
- Priority/Status rendered as colored pill badges. CJK text supported.

```bash
zendesk clear-images                           # remove all PNGs from images dir
```

#### Attachments

```bash
zendesk attachment list -t 1220
zendesk attachment download -t 1735 --all                  # all attachments + inline images
zendesk attachment download -t 1220 --id 498483
zendesk attachment download -t 1220 --name "error.log"
zendesk attachment download -t 1735 --all --dir ./downloads
```

- `-t` is shorthand for `--ticket`.
- Source column shows `attached` (standard) or `inline` (images pasted into ticket body).
- Inline images are auto-extracted from comment HTML — they appear even when standard attachments list is empty.
- `zendesk ticket <id>` already shows inline images (🖼) per comment, so you can go straight to `--all` without `attachment list`.
- Downloads go to `attachments/ticket-<id>/` by default (override with `--dir`).
- File naming: `<original_name>.<YYYY-MM-DD-HHMMSS>.attachment` (compressed files keep archive suffix).
- Injection hardening: text files get a warning header prepended; binary files unchanged.
- Provide exactly one selector: `--id`, `--name`, or `--all`.

#### Help Center Docs

```bash
zendesk docs categories
zendesk docs sections --locale en-us
zendesk docs articles --label-names "billing,faq"
zendesk docs articles --sort-by position --sort-order asc
zendesk docs search --query "reset password"
zendesk docs search --section 12345 --updated-after 2026-01-01
zendesk docs search --query "error" --created-after 2026-01-01 --updated-before 2026-03-01
zendesk docs search --query "setup" --sort-by created_at --sort-order asc
zendesk docs show 987654 --locale en-us
zendesk docs get-html 987654 --locale zh-cn
```

- Locale defaults to `en-us`; allowed prefixes: `en`, `zh`, `ja`. Input is normalized (`ZH_CN` → `zh-cn`).
- `docs search` requires at least one of: `--query`, `--category`, `--section`, `--label-names`.
- Discovery order: `docs categories` → `docs sections` → `docs articles`.
- For full article body: `docs show <id>` or `docs get-html <id>` (raw HTML).

#### Shell Completion

```bash
zendesk --install-completion
```

## Common Workflows

### Triage: find my open tickets and latest replies

```bash
zendesk tickets --assignee me --status open --latest-comments -o text
```

### Investigate a ticket fully

```bash
zendesk ticket 1220 -o text
zendesk attachment download -t 1220 --all
```

### Search tickets by keyword

```bash
zendesk tickets -q "deploy failure" -o text
zendesk tickets -q "login" --status open --assignee me -o text
```

### Search knowledge base

```bash
zendesk docs search --query "password reset" -o text
zendesk docs show <article_id> -o text
```

### Generate ticket snapshot image

```bash
zendesk get-image 1592 1686 --timezone 9
```

### Set timezone globally

```bash
zendesk set-env TIMEZONE 9
```

## Command Rules

- Use `zendesk init` for first-time setup or re-configuration; prefer `--global` (default) for shared use.
- Use `zendesk --version` or `zendesk -V` to verify the CLI is installed.
- Prefer `zendesk tickets` with no filters for a quick look at newest tickets.
- Prefer filtered `zendesk tickets` for workflow triage.
- Use `--no-comments` when only metadata is needed; use `--latest-comments 1` for just the newest reply.
- Never pass statuses other than `open|pending` to `set-status`.
- If multiple users match an assignee text query, the CLI uses first-match — mention this if relevant.
- For post-processing (e.g. `jq`), always use `-o json`.
- Use `set-env` to persist config changes; use `-- KEY -value` syntax for negative numbers.
- `get-image` respects the `TIMEZONE` env var; use `-tz` flag to override per invocation.

## Failure Handling

| Symptom                        | Action                                                                    |
| ------------------------------ | ------------------------------------------------------------------------- |
| Missing env vars               | Suggest `zendesk init` to set up credentials interactively                |
| Assignee lookup fails          | Retry with exact email or numeric user ID                                 |
| Multiple users match assignee  | Inform user of first-match behavior                                       |
| Auth / permission error        | Surface HTTP status, advise token/subdomain check or re-run `zendesk init`|
| `docs search` with no filters  | Ask user for at least one of `--query|--category|--section|--label-names` |
| Docs locale outside `en|zh|ja` | Explain allowed prefixes, retry with valid locale                         |
| Negative value rejected        | Use `--` before key-value pair: `zendesk set-env -- TIMEZONE -7`          |
