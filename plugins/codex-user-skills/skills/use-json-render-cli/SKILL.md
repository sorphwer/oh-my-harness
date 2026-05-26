---
name: use-json-render-cli
description: Render structured JSON UI specs to PNG images with json-render-cli. Use when users ask to generate visual outputs such as compact tables, ticket status tables, KPI/info cards, announcement cards, or flow/timeline summaries, and route to the matching use-case reference under references/.
---

# Use JSON Render CLI

## Overview

Render deterministic PNG visuals from JSON specs with one unified skill.
Keep this file as the router: load only the relevant use-case reference for the current request.

## Use-Case Routing

1. Identify requested visual type.
2. Load exactly one primary use-case file from `references/`.
3. Load the linked command template and spec template for that use case only.
4. Render and return output path (or Base64 only if explicitly requested).

Use-case map:
- Generic table (non-ticket): read `references/use-case-table.md`.
- Ticket table (`ID/Priority/Status/Assignee/Updated/Topic`): read `references/use-case-ticket-table.md`.
- KPI/metric/summary cards: read `references/use-case-info-cards.md`.
- Announcement/hero/profile cards: read `references/use-case-announcement-cards.md`.
- Flow/timeline/stage summary: read `references/use-case-flow-summary.md`.

## Shared Workflow

1. Ensure runtime is available:
- `json-render` binary (install with `npm i -g json-render-cli` if missing).
- Playwright Chromium for screenshots (templates run a preflight check and install with `npx --yes playwright install chromium` when missing).

2. Build message JSON in memory:
- Prefer placeholder replacement over writing temporary JSON files.
- Use process substitution for config (`-c <(...)`) where possible.

3. Choose compact viewport first:
- Start near content footprint.
- Increase dimensions only when clipping appears.
- For variable row count/line wrapping, set `screenshot.fullPage=true`.

4. Output policy:
- Prefer `-o /tmp/<name>.png`.
- Use `-o stdout` only when caller explicitly requests Base64.

## Coordination Rules

- Prefer rendering in the current main agent when output must be delivered in the same turn.
- Delegate rendering only when output-path handoff is explicit and deterministic.
- Do not delete/move rendered PNG in sub-agents.
- Perform cleanup only in the main agent after delivery succeeds.

## Theme Policy

- `theme.mode` defaults to `system`.
- Use fixed `light` or `dark` only when explicitly requested.

## References Index

Routing guides:
- `references/use-case-table.md`
- `references/use-case-ticket-table.md`
- `references/use-case-info-cards.md`
- `references/use-case-announcement-cards.md`
- `references/use-case-flow-summary.md`

Executable templates and specs:
- `references/compact-table-template.md`
- `references/compact-table-spec.template.json`
- `references/compact-ticket-template.md`
- `references/compact-ticket-spec.template.json`
- `references/kpi-overview-template.md`
- `references/kpi-overview-spec.template.json`
- `references/metric-compare-template.md`
- `references/metric-compare-spec.template.json`
- `references/daily-summary-template.md`
- `references/daily-summary-spec.template.json`
- `references/announcement-card-template.md`
- `references/announcement-card-spec.template.json`
- `references/flow-summary-template.md`
- `references/flow-summary-spec.template.json`
