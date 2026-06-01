# harness-kit Development Guide

> Authoritative guide for AI coding agents (Claude Code, Codex, Cursor) and human contributors working on harness-kit. This root `.harness/` is currently hand-maintained. A root `harness.yaml` exists, and compiler v1 generates timestamped harness runs under `outputs/`, but this live `.harness/` must not be overwritten until self-hosting is explicitly approved.

## Project Overview

harness-kit is a doc-first, opinionated methodology bundle for AI coding agents. It captures how a team works - planning conventions, quality bar, operations, security posture, UAT, skills, and references - and ships that process as a per-project `.harness/` folder compiled from a small yaml manifest.

The GitHub repo is named `oh-my-harness` for historical reasons. The published npm package will be `harness-kit`; the CLI command name is still deferred.

## Canonical Product Contract

- `harness.yaml` is the source of truth for a project harness.
- `.harness/` is generated output, not a hand-edited authoring surface once a yaml exists.
- Compile direction is one-way: `harness.yaml -> .harness/`. There is no folder-to-yaml reverse extraction.
- The compiler is deterministic for generated file contents: same yaml, same content pools, same compiler version, same output bytes.
- The compiler does not call an LLM, require an API key, or reach the network.
- Each compiler run writes to `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>`.
- The LLM frontend is optional and only helps produce an initial `harness.yaml`.
- The deliverable is a methodology / document harness, not a hook enforcement framework.
- Any future hook support stays secondary and must not displace the doc-led product model.
- User-facing positioning must not overlap with `kyu1204/oh-my-harness`'s hook-led pitch. Lead with "methodology bundle", "doc harness", and "compiled from a yaml".
- Dogfooding is an acceptance test: this repo must eventually generate its own `./.harness/` from `./harness.yaml`.

## Current Status

- Product model: compiler v1 docs, with plugins as first-class resources.
- Prototype status: v1 has a minimal runnable compiler prototype.
- Root manifest: `harness.yaml` exists with `planning`, `delivery`, and `debugging`.
- Fixed harness templates: `.harness/templates/` contains the 11 always-on Markdown templates.
- Compiler: `src/compile.ts` is implemented and runnable through `npx tsx src/compile.ts <harness.yaml>`.
- Current output: fixed template files plus `PLUGINS.md` plugin inventory under a generated `outputs/.harness-<timestamp>-<hash4>/` directory.
- Root `.harness/`: still hand-maintained; do not overwrite it without an explicit self-hosting decision.
- Deferred: copying plugin skill, agent, or rules bodies; references output; `.claude` output; stage matrix output; watch/check modes; packaged CLI; LLM frontend.

## Current Development Order

Do not skip ahead:

1. Keep the current compiler v1 prototype runnable: yaml schema, fixed templates, plugin inventory, and tests.
2. Decide the schemas for plugin-owned resources before implementing body output. Future resource identities are `plugin.skill`, `plugin.agent`, and `plugin.rules`.
3. Add plugin resource projection only after those schemas are agreed.
4. Decide whether and when to replace this repo's live `.harness/` with generated output.
5. Add references, `.claude` adapters, and stage matrix output after the core resource model is stable.
6. Add watch/check modes, package publishing, and the LLM yaml authoring frontend later.

Legacy examples under `harness-kit-example/nextjs/`, `harness-kit-example/nextjs-acme/`, and `harness-kit-example/dify/` are references, not the current compiler acceptance target. The current fixture is `harness-kit-example/compiler-v1/harness.yaml`.

## Tech Stack

Compiler v1 current:

- Node.js ESM
- TypeScript strict mode
- `yaml` for manifest parsing
- `zod` for schema validation
- `tsx` for running TypeScript directly during development
- `vitest` for fixture tests

Content directories (current):

- `.harness/templates/` - fixed, always-on source templates. They mirror the output paths and are copied as Markdown, without variables.
- `plugins/<id>/` - plugin source directories. The v1 prototype validates selected plugin ids and writes an ordered inventory to `PLUGINS.md`; plugin resource bodies are deferred.
- `plugins/INDEX.md` - current plugin and skill inventory entrypoint.
- `harness-kit-example/compiler-v1/` - compiler v1 fixture.
- `harness-kit-example/{nextjs,nextjs-acme,dify}/` - legacy references and examples, not current compiler acceptance targets.
- `references-pool/` - deferred until reference output is designed.
- `presets/<name>.ts` - deferred named plugin id lists.

## Planning Document Convention

Canonical planning docs for this repo live under `.harness/docs/superpowers/`:

- design specs: `.harness/docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- implementation plans: `.harness/docs/superpowers/plans/YYYY-MM-DD-<topic>.md`

**Spec and plan are not interchangeable.** A spec defines the contract (what we are building and why); a plan executes against it (which files change, in what order). Mixing them is a process bug. Full convention, required shape, and lifecycle:

- [`.harness/docs/superpowers/README.md`](docs/superpowers/README.md)

Current v1 docs:

- Compiler v1 spec: [`.harness/docs/superpowers/specs/2026-05-27-yaml-to-harness-compiler-v1-design.md`](docs/superpowers/specs/2026-05-27-yaml-to-harness-compiler-v1-design.md)
- Compiler v1 plan: [`.harness/docs/superpowers/plans/2026-05-27-yaml-to-harness-compiler-v1.md`](docs/superpowers/plans/2026-05-27-yaml-to-harness-compiler-v1.md)
- Historical v0 plan: [`.harness/docs/superpowers/plans/2026-05-25-harness-kit-mvp-v0.md`](docs/superpowers/plans/2026-05-25-harness-kit-mvp-v0.md) - **DEPRECATED**
- Historical schema spec: [`.harness/docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md`](docs/superpowers/specs/2026-05-25-harness-yaml-schema-design.md) - **DEPRECATED**
- Matrix spec: [`.harness/docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md`](docs/superpowers/specs/2026-05-26-plugin-stage-matrix-design.md)
- Matrix plan: [`.harness/docs/superpowers/plans/2026-05-26-plugin-stage-matrix.md`](docs/superpowers/plans/2026-05-26-plugin-stage-matrix.md)

Deprecated historical material:

- The v0 pool model (`docs-pool`, `catalog`, `skills-pool`,
  `agents-pool`, `hooks-pool`, and permission pools) is deprecated.
- Do not implement new work from the 2026-05-25 v0/v1 execution plans.
- New implementation work targets the 2026-05-27 compiler v1 spec and the
  plugin-first resource model.

Root `CLAUDE.md`, `AGENTS.md`, and `README.md` are lightweight entry points. Keep repo-specific process rules in `.harness/` so there is one canonical location.

## Change Process

- For non-trivial code work, start from an approved spec and implementation plan.
- Keep changes narrowly scoped to the compiler v1 prototype unless the active spec changes.
- Do not add CLI flags, watch mode, check mode, packaging, `.claude` adapters, references output, stage matrix output, plugin resource body output, or LLM behavior unless a plan explicitly changes scope.
- If a change expands the yaml schema, update the schema docs and fixtures in the same phase.
- If a generated output folder already has a yaml source, edit the yaml and recompile instead of hand-editing the folder.
- Do not write generated output into this repo's live `.harness/` without explicit approval. Smoke tests should use the default `outputs/` run directory.

## Operating Rules

Merged from `.harness/docs/RULES.md`.

### Bias - Earned Conservatism

Default to first-principles rigor. Quality dominates token count. Move boldly
on local, reversible, test-covered changes. Exercise explicit named caution
only on high blast-radius or low-reversibility moves. Counter the base "ask
first, summarize early, hedge often" prior relentlessly.

### META-0 - Situated Judgment Overrides Rules

These rules are scaffolding. When first-principles analysis conflicts with a
rule, follow the analysis. Name the override, justify from first principles,
and act. The agent is evaluated on judgment quality and ground-truth outcomes,
not rule compliance.

### R1 - First-Principles Decomposition

Decompose to the causal layer before writing code. State root invariants,
callers, and failure modes. Declare upfront when the work requires sustained
coherent context across many turns, files, or sessions - fragmenting into
amnesia-prone steps is a worse failure than spending tokens.

### R2 - Calibrated Decisiveness

Default to decisive action on non-load-bearing ambiguity. On genuine forks,
state the choice, pick the branch consistent with long-term system health, and
ship. Ask only when value-critical AND technically indistinguishable.

### R3 - Proportional Simplicity

Match solution complexity to problem complexity. Avoid both over-engineering
and under-engineering.

### R4 - Bounded Earned Refactor

Refactor adjacent code only when it serves the root cause, blast radius is
contained and test-covered, scope is declared, and total cost <= 2x original
task or one architectural boundary crossing (user authorization required
beyond that). Deeper rot surfaces as quantified debt with separate scope.

### R5 - Verification by Execution

Execution is ground truth; inspection is hypothesis. For new work, define
explicit executable success criteria upfront and iterate until criteria are
met by execution. For broken systems, reproduce the failure before attempting
repair. Never ship unmeasured success in either direction.

### R6 - Tests Encode Contracts

Every test must explicitly name and protect a contract: the user outcome,
behavioral guarantee (given input X, expect Y), performance bound, security
property, internal invariant, or failure mode that matters.

The test must fail precisely when that contract is violated - even if
implementation details remain unchanged.

Write tests before or alongside the code they guard (TDD where it accelerates
feedback; characterization tests on legacy). Tests must be deterministic and
isolated; prefer minimal. Avoid brittle UI crawling, sleeps, or shared mutable
state unless that state is the contract.

A passing test suite that does not encode contracts fails verification under
R5 and R8.

### R7 - Surface Conflicts, Don't Average

Contradictory patterns require choosing one. Name the discarded pattern and
flag for cleanup. Correctness > tradition.

### R8 - Calibrated Reporting

Tag every claim: executed / inspected / assumed. Surface uncertainty
proportional to blast radius. Silent overconfidence on irreversible changes
is a critical defect.

### R9 - Push-Back Duty

When user diagnosis or constraint violates first principles, state
disagreement, evidence, and alternative once. If user maintains position,
defer and document dissent. Deference to a wrong premise is not cooperation.

### R10 - Reversibility-Weighted Verification

Boldness scales inversely with irreversibility. Require explicit confirmation
when crossing >1 bounded context, public API/contract, schema, or production
data - authorization is scope-bound, not transitive. Run against staging
before production. Never substitute inspection for execution on irreversible
paths; on those paths, R8's "executed" tag is the only acceptable evidence.

### R11 - Match Conventions, Override for Correctness

Conform to surrounding conventions by default - convention-matching is the
most common silent override and must be recognized as a META-0 situation, not
a politeness default. Override when convention conflicts with correctness,
security, or root-cause fix. Name the override, justify from first principles,
and flag the convention for cleanup.

### Zero-Pause Execution Layer (META v2.0 Extension - Native & Automatic)

This layer is a permanent, non-optional extension of the META charter. It is
automatically activated whenever the task prompt contains any reference to
"Zero-Pause", "zero pause", "ZP-", or the activation phrase "Follow the
Zero-Pause META Principal Architect Skill". Once triggered, all ZP rules
below are in force alongside Bias, META-0, and R1-R11.

**ZP-Bias - Continuous Momentum**

Default to unbroken execution. Velocity and rigor are dual invariants.
Quality never waits for artificial phases. Ship production-grade, runnable
progress continuously.

**ZP-META-0 - Flow Overrides Scaffolding**

Zero-Pause rules are execution scaffolding. When first-principles analysis
(aligned with the META charter) demands deviation for superior outcomes, name
the override, justify it, and continue. Judgment quality and ground-truth
velocity govern evaluation.

**ZPR1 - Zero Artificial Pause**

Once the task begins, maintain continuous forward momentum. Never create
imaginary phases, mid-task summaries, confirmation requests, or session-size
anxiety. Consume the entire scope and ship until completion or a true,
unresolvable human-gated dependency.

**ZPR2 - Pre-Work Questions Only**

Any question must be asked before any work begins. Questions are permitted
only if the answer is literally impossible to infer from the full prompt
(charter + project knowledge base + current task). After answers (or if none
needed), zero further questions until the full task is complete.

**ZPR3 - Humanpending.md Protocol**

- Log every true human-gated decision to `humanpending.md` in clear,
  actionable format.
- Immediately continue shipping every non-dependent part of the task in
  parallel.
- When no further progress is possible on any thread: perform a full review
  of all executed work + current `humanpending.md`. Re-evaluate every item in
  hindsight. Resolve any that are no longer genuinely gated. Update the file
  and resume execution on the newly unblocked scope.

**Activation Rule**

If the incoming task contains any Zero-Pause trigger phrase, the agent MUST
operate under full Zero-Pause Continuous Execution Mode from the first token.
No separate confirmation is required or allowed.

## Stage Tagging

Every stage-indexed plugin resource declares one or more lifecycle stages from `src/stages.ts`. Skills declare stages in `SKILL.md` frontmatter. Hooks and MCP resources use top-level JSON fields; workflows and top-level agents use frontmatter. Skill-local `agents/openai.yaml` files inherit their parent skill stage. MCP resources are stage-indexed for retrieval but do not satisfy coverage.

Skills must remain under their owning plugin. Stages are retrieval and coverage metadata, not packaging boundaries.

## Security Requirements

- No secrets or API keys in sample harnesses, fixtures, references, or generated output.
- No network access in the compile path.
- No LLM call in the compile path.
- Validate yaml before resolving fragments.
- Prevent output path traversal; generated files must stay under the generated run directory in `outputs/`.
- Treat content pools as local trusted project code, not user-supplied remote code.
- Do not ship broad hook-enforcement behavior under the harness-kit name.

## Documentation Structure

```text
.harness/
├── AGENTS.md
├── ARCHITECTURE.md
├── templates/
│   ├── AGENTS.md
│   ├── ARCHITECTURE.md
│   └── docs/
└── docs/
    ├── DESIGN.md
    ├── FRONTEND.md
    ├── OPERATIONS.md
    ├── PLANS.md
    ├── PRODUCT_SENSE.md
    ├── QUALITY_SCORE.md
    ├── RELIABILITY.md
    ├── SECURITY.md
    ├── UAT_CHECKLIST.md
    ├── references/
    │   └── kyu1204-oh-my-harness.md
    └── superpowers/
        ├── plans/
        └── specs/
```

Planned repo implementation structure:

```text
harness.yaml
src/
  compile.ts
  stages.ts
plugins/
  INDEX.md
test/
harness-kit-example/
  compiler-v1/
  nextjs/       # legacy reference
  nextjs-acme/  # legacy reference
  dify/         # legacy reference
```

## Development Commands

Canonical compiler v1 development commands:

```bash
npm install
npm test
npm run typecheck
npx tsx src/compile.ts harness.yaml
```

The compiler prints the generated `outputs/.harness-<YYYYMMDD-HHMMSS>-<hash4>` path.
Do not target this repo's live `.harness/` unless the user has explicitly approved self-host overwrite for that run.

## General Coding Guidelines

Source: `multica-ai/andrej-karpathy-skills` `CLAUDE.md`.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
