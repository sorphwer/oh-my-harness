# Zendesk CLI Command Recipes

Use these recipes when converting user intent into concrete commands.

## Setup and Sanity Check

```bash
zendesk --version
zendesk init
```

## List and Filter Tickets

```bash
# Latest 5 tickets
zendesk tickets -n 5

# Page 2, 20 per page
zendesk tickets -n 20 -p 2

# Open tickets assigned to me
zendesk tickets --assignee me --status open

# Unsolved urgent tickets in a date range
zendesk tickets --status unsolved --priority urgent --since 2026-01-01 --until 2026-01-31

# Sort by update time ascending
zendesk tickets --sort-by updated_at --sort-order asc

# Include latest comment per ticket
zendesk tickets -n 5 --latest-comments
```

## Inspect One Ticket

```bash
# Full detail with conversation/comments
zendesk ticket 1220

# Only the newest 3 comments
zendesk ticket 1220 --latest-comments 3

# Only the newest single reply
zendesk ticket 1220 --latest-comments 1

# Detail only (skip comments)
zendesk ticket 1220 --no-comments
```

Custom fields with non-empty values are automatically displayed with their human-readable names.

## Update One Ticket

```bash
# Assign to current user
zendesk assign-to 1220 me

# Assign by email or name
zendesk assign-to 1220 john@example.com

# Set ticket status (allowed: open|pending)
zendesk set-status 1220 pending
```

`zendesk set-status 1220 solved` is blocked by the CLI (only `open|pending` are allowed).

## Configuration

```bash
# Set timezone (UTC offset)
zendesk set-env TIMEZONE 9

# Set default output format
zendesk set-env ZENDESK_OUTPUT text

# Write to local .env instead of global
zendesk set-env TIMEZONE 9 --local

# Use -- for negative values
zendesk set-env -- TIMEZONE -7
```

## Render Tickets as PNG

```bash
# Render multiple tickets into a PNG snapshot
zendesk get-image 1592 1686 1685

# Save to a specific file
zendesk get-image 1592 1686 --file tickets.png

# Override timezone for the image
zendesk get-image 1592 1686 --timezone 9
zendesk get-image 1592 1686 -tz -7

# Clean up generated images
zendesk clear-images
```

## Attachment Workflow

```bash
# List all attachments on a ticket (includes inline images)
zendesk attachment list -t 1220

# Download ALL attachments + inline images
zendesk attachment download -t 1735 --all

# Download all to a specific directory
zendesk attachment download -t 1735 --all --dir ./downloads

# Download one attachment by ID
zendesk attachment download -t 1220 --id 498483

# Download one attachment by exact file name
zendesk attachment download -t 1220 --name "error.log"
```

By default, downloaded attachments are hardened:
- Text files are prefixed with an external-source warning block
- Binary files remain unchanged and print `binary-unchanged`
- Compressed files keep their original archive suffix (for example, `.zip`, `.tar.gz`)

Attachment list shows a `Source` column: `attached` for standard attachments, `inline` for images pasted into ticket body.

## Output Mode Selection

```bash
# Set global default output persistently
zendesk set-env ZENDESK_OUTPUT text

# Human-readable table
zendesk tickets -n 10 -o table

# Compact LLM/scripting output
zendesk tickets -n 10 -o text

# Programmatic JSON
zendesk ticket 1220 -o json

# JSON + jq extraction
zendesk ticket 1220 -o json | jq '.ticket.subject'

# CSV export
zendesk tickets -n 50 -o csv
```

Output precedence:
- `-o/--output`
- `ZENDESK_OUTPUT`
- fallback default `table`

## Help Center Docs (Read-only)

```bash
# List category tree roots
zendesk docs categories

# List sections
zendesk docs sections

# List articles (latest updates first by default)
zendesk docs articles

# List articles by labels
zendesk docs articles --label-names "billing,faq"

# Sort articles
zendesk docs articles --sort-by position --sort-order asc

# Search docs by query
zendesk docs search --query "password reset"

# Search docs by section/date filters
zendesk docs search --section 12345 --updated-after 2026-01-01

# Search with date range
zendesk docs search --query "error" --created-after 2026-01-01 --updated-before 2026-03-01

# Search with sorting
zendesk docs search --query "setup" --sort-by created_at --sort-order asc

# Show one article (full body)
zendesk docs show 987654

# Get raw HTML body
zendesk docs get-html 987654 --locale zh-cn
```

Docs locale rules:
- Default locale is `en-us`
- Supported prefixes are only `en`, `zh`, `ja`
- Locale is normalized (`ZH_CN` -> `zh-cn`)

Search rule:
- `zendesk docs search` requires at least one of:
  - `--query`
  - `--category`
  - `--section`
  - `--label-names`

## Shell Completion

```bash
zendesk --install-completion
```

## Intent-to-Command Mapping

- "Show newest tickets": `zendesk tickets -n <count>`
- "Find open/high tickets for me": `zendesk tickets --assignee me --status open --priority high`
- "Show ticket 1234 conversation": `zendesk ticket 1234`
- "Show the latest 3 replies on ticket 1234": `zendesk ticket 1234 --latest-comments 3`
- "Show only the latest reply on ticket 1234": `zendesk ticket 1234 --latest-comments 1`
- "Assign ticket 1234 to me": `zendesk assign-to 1234 me`
- "Set ticket 1234 to pending": `zendesk set-status 1234 pending`
- "List ticket attachments": `zendesk attachment list -t <id>`
- "Download all attachments": `zendesk attachment download -t <id> --all`
- "Download one attachment by ID": `zendesk attachment download -t <id> --id <attachment_id>`
- "Browse docs categories": `zendesk docs categories`
- "Search docs for a topic": `zendesk docs search --query "<keywords>"`
- "Show one docs article": `zendesk docs show <article_id>`
- "Generate ticket snapshot": `zendesk get-image <id1> <id2>`
- "Set timezone": `zendesk set-env TIMEZONE 9`
- "Give me machine-readable output": add `-o json` or `-o csv`
- "Keep response compact for LLM": add `-o text`
