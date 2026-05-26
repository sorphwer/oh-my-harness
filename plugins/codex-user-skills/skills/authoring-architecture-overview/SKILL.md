---
name: authoring-architecture-overview
description: Use when the user asks for a single-page HTML architecture overview or system diagram of a codebase — phrases like "architecture_overview.html", "画个系统总览图", "给这个项目做个架构图", "make an architecture diagram", or "overview HTML". Triggers on requests for a standalone browser-openable diagram (no Mermaid server, no build step).
stage: [explore, deliver]
---

# Authoring Architecture Overview HTML

## Overview

**Input:** a codebase + its documentation (and memory, if available).
**Output:** one self-contained HTML file (typically `docs/architecture_overview.html`) rendering a layered architecture diagram.

Core principle: the diagram is a **compressed, fact-checked snapshot of how data flows through the system**. Every card must map to real code; every arrow must map to a real dependency. Aesthetic polish is secondary to accuracy.

## When to Use

- User asks for an architecture overview / system diagram in HTML
- User wants a single page they can open in a browser (no build step, no Mermaid server)
- Project has multiple layers (ingest → storage → processing → consumers) that benefit from visual grouping
- Facts (counts, model names, versions) need to be verifiable against source

**Do NOT use for:**
- Pure UML or sequence diagrams → use Mermaid / PlantUML
- Code-level call graphs → use proper tooling (py-spy, dependency-cruiser)
- One-off slide illustrations where accuracy doesn't matter

## The Template

A ready-to-edit scaffold lives at `template.html` in this skill directory. **Always start by copying it**; the CSS palette, SVG overlay, and JS drawing code are load-bearing and non-trivial to reproduce.

```bash
cp ~/.claude/skills/authoring-architecture-overview/template.html <repo>/docs/architecture_overview.html
```

## Workflow (MUST follow in order)

### 1. Survey the codebase before writing anything

Do NOT start from memory or assumptions. Read:
- Top-level directory listing
- `README.md`, `docs/*.md`, `docs/current_status.md` if it exists
- `CLAUDE.md` / `AGENTS.md` / any project rules
- Relevant memory files (auto-memory, if the environment has them)

Produce a mental model of: **what layers exist, what cards belong in each, and what cross-layer data flows actually happen**.

### 2. Verify every concrete fact against source

This is the #1 failure mode. Do not write a card description that contains:
- A model name (e.g. `gemini-embedding-2-preview`)
- A dimension / version number
- A row/node count
- A file path
- A relationship / schema label

without having first **grep'd the actual codebase for it**.

**Strict rule — what counts as a valid source:**
| Claim type | Valid source |
|------------|--------------|
| Model name, embedding dim | Grep the code that instantiates the client / reads the env var |
| Node / row count | Query the live DB, or read a yaml/json snapshot **whose date ≥ last ingest commit** |
| File path, schema label | Read the actual file; grep the label in source |
| Library version | Read `pyproject.toml` / `package.json` / lockfile |

**Not valid by themselves:** `docs/current_status.md`, auto-memory files, commit messages, your own prior session. These go stale. If the only source for a number is a doc, you must also confirm the doc isn't dated before the most recent ingest/import commit — otherwise grep the code.

**Red flag:** "I remember the model is …" or "the status doc says 1032 tickets". Both mean stop and grep.

### 3. Classify every card along TWO independent dimensions

| Dimension | Values | Visual |
|-----------|--------|--------|
| **Status** | `done` / `wip` / `plan` | Fill color + border; `plan` uses **dashed** border |
| **Role**   | default / `store` / `core` / `orch` / `rrf` | Accent fill & border tone |

A card can combine both: `class="card store"` is a done storage card; `class="card plan"` would be a planned default card. Use role classes for data stores, the single core DB, the dispatcher/orchestrator, and any fusion/aggregation step.

### 4. Within each layer: add horizontal flow glyphs where a real sequence exists

Use these inline text elements between cards:

| Glyph | Class | Meaning |
|-------|-------|---------|
| `→` | `.arrow` | Sequential step to next card |
| `⇉` | `.arrow.fan` | Fan-out from orchestrator to parallel channels |
| `⇢` | `.arrow.merge` | Parallel channels merging into fusion |
| `·` | `.arrow.soft` | Siblings / parallel consumers (no data flow between them) |
| `\|` | `.divider` + `.divider-label` | Visual break + text label for an off-path group ("旁路配置" / "评测/未来") |

**Do not insert `→` between cards that are parallel, not sequential.** If four consumers call the same API, use `·` (soft) not `→`.

### 5. Cross-layer edges: draw SVG dashed arrows, card-to-card, never row-to-row

**This is the second major failure mode.** A single big arrow between rows is misleading because not every card in layer N feeds every card in layer N+1. Always connect specific cards.

Every card that participates in a cross-layer edge needs `id="card-<slug>"`. Then fill the `CONNECTIONS` array in the script:

```js
const CONNECTIONS = [
  ['card-intake',  'card-md'],              // raw md lands in data/
  ['card-build',   'card-neo4j', true],     // final graph write (strong)
  ['card-neo4j',   'card-orch',  true],     // core DB read by retrieval (strong)
  ['card-config',  'card-qp'],              // hints / synonym map
  ['card-enrich',  'card-web'],             // result delivery
  ['card-enrich',  'card-cli'],
  ['card-enrich',  'card-dify'],
  ['card-enrich',  'card-agent'],
];
```

Rules:
- Each tuple is `[fromId, toId, strong?]`. `strong` marks 1–2 most important edges (darker stroke).
- Only edges that represent an actual data or control flow. Don't add edges for visual balance.
- Multiple outgoing edges from one card (fan-out to N consumers) is fine.
- If the same source fans to many consumers, list them all — don't try to collapse into one edge.

### 6. Legend must cover BOTH dimensions

Legend has two groups, `状态` and `角色`. Missing the role group is a common mistake: without it, readers can't decode why `Neo4j AuraDB` is cyan but `output/ artifacts` is gray even though both are `done`.

### 7. Footer: deployment, CI/CD, domain glossary

Last row. Concrete deployment facts (Vercel / Cloud Run / managed DB), CI triggers, and a line of domain-specific vocabulary (e.g. KG relationship names) that help the reader decode card descriptions.

### 8. Sanity-check before reporting done

- [ ] Every `CONNECTIONS` entry's `fromId`/`toId` exists in the DOM (grep the file)
- [ ] Every quantitative claim (counts, model names, dimensions) has a source in code or docs
- [ ] Legend includes both status and role groups
- [ ] No `▼` / "layer-to-layer" arrow — only card-to-card SVG curves
- [ ] `margin-bottom` on `.row` is large enough (~54px) for SVG curves to breathe
- [ ] File opens in a browser and arrows render correctly
- [ ] Re-read every card description: is it derivable from current code, not from stale memory?

## Common Mistakes (baseline failures that this skill exists to prevent)

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Quoting a model name / count from memory without grep | e.g. writes `text-embedding-004` when code actually says `gemini-embedding-2-preview` | Grep codebase before writing the card |
| One-dimension legend | User asks "what do the colors mean?" after reading the diagram | Add role group to legend; label plan as "虚线边框" explicitly |
| Big `▼` between rows | User says "arrows are misleading" | Remove row-level glyphs; use SVG card-to-card with `CONNECTIONS[]` |
| Missing within-layer `→` | Cards look like a disconnected bag | Add `.arrow` glyphs between sequential cards |
| `→` between parallel consumers | Implies non-existent order | Use `.arrow.soft` (`·`) or just a divider label |
| Cards crammed, SVG curves overlap text | Curves bleed into cards | Bump `.row` margin-bottom to 50–60px |
| Cross-layer edge to orchestrator shows "consumer calls it" but arrow points wrong way | Semantic confusion | Decide direction = **data/result flow**, and document that choice in a comment |

## Iteration Pattern

First pass is always wrong. Expect these user corrections (treat as part of the normal loop):

1. "Legend 不全" → add role group
2. "水平箭头画上" → add within-layer `→`
3. "层间箭头误导" → replace `▼` with card-to-card SVG
4. "事实错了" → regrep, fix, apologize

Ship the first pass fast, iterate.

## Red Flags — Stop and Re-check

- About to type a version number / model name / count from memory
- About to write a `▼` between rows
- About to connect "the whole of layer 2" to "the whole of layer 3"
- About to put `→` between cards that are actually parallel consumers
- Finished writing but haven't opened the file in a browser

All of these mean: pause, grep, fix, then continue.
