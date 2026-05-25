---
name: threat-model
description: Use when defining, refreshing, or reviewing a project's security model, trust boundaries, sensitive assets, actors, entrypoints, and abuse cases.
---

# Threat Model

## Workflow

1. Read the product contract and architecture first.
2. List protected assets: secrets, user data, tenant data, billing state, privileged jobs, and integration credentials.
3. List actors: anonymous users, authenticated users, tenant admins, service accounts, maintainers, and third-party providers.
4. Draw trust boundaries around browser, server, database, queues, webhooks, object storage, and external APIs.
5. For each boundary, write abuse cases in plain language and the controls expected to stop them.

## Output

Use a compact structure:

- Assets
- Actors
- Entry points
- Trust boundaries
- Main abuse cases
- Existing controls
- Open questions and gaps

## Calibration

Keep it concrete. A useful threat model should point a future reviewer toward exact files, middleware, tables, routes, jobs, or config where security decisions happen.
