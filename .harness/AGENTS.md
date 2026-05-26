# harness-kit Development Guide

> Authoritative guide for AI coding agents (Claude Code, Codex, Cursor) and human contributors working on harness-kit. This root `.harness/` is currently hand-bootstrapped from the examples; once `./harness.yaml` exists and the compiler can self-host, this folder becomes compiler output.

## Project Overview

harness-kit is a doc-first, opinionated methodology bundle for AI coding agents. It captures how a team works - planning conventions, quality bar, operations, security posture, UAT, skills, and references - and ships that process as a per-project `.harness/` folder compiled from a small yaml manifest.

The GitHub repo is named `oh-my-harness` for historical reasons. The published npm package will be `harness-kit`; the CLI command name is still deferred.

## Canonical Product Contract

- `harness.yaml` is the source of truth for a project harness.
- `.harness/` is generated output, not a hand-edited authoring surface once a yaml exists.
- Compile direction is one-way: `harness.yaml -> .harness/`. There is no folder-to-yaml reverse extraction.
- The compiler is deterministic code: same yaml, same content pools, same compiler version, same output bytes.
- The compiler does not call an LLM, require an API key, reach the network, or use timestamps / random IDs in output.
- The LLM frontend is optional and only helps produce an initial `harness.yaml`.
- The deliverable is a methodology / document harness, not a hook enforcement framework.
- Hooks stay secondary and minimal: permissions allowlist first, maybe a plan-required gate later.
- User-facing positioning must not overlap with `kyu1204/oh-my-harness`'s hook-led pitch. Lead with "methodology bundle", "doc harness", and "compiled from a yaml".
- Dogfooding is an acceptance test: this repo must eventually generate its own `./.harness/` from `./harness.yaml`.

## Current Status

- Product model: settled.
- Stdlib skeleton: `example/nextjs/.harness/` exists and is hand-written.
- Filled demo: `example/nextjs-acme/.harness/` exists.
- MVP v0 spec and implementation plan: migrated into `.harness/docs/superpowers/`.
- Compiler, CLI, root `harness.yaml`, and self-host generation: not implemented yet.

## MVP Development Order

Do not skip ahead:

1. Define the minimal yaml schema needed to reproduce the current example target.
2. Build the deterministic compiler from yaml to folder.
3. Extract the skills pool from hand-written harness content.
4. Self-host this repo with `./harness.yaml` and generated `./.harness/`.
5. Add `--watch`.
6. Add the natural-language to yaml LLM frontend.

The active v0 implementation plan intentionally starts with `example/nextjs-acme`, because it is a filled-in target. `example/nextjs` remains the stdlib skeleton and broader reference.

## Tech Stack

Planned for compiler v0:

- Node.js ESM
- TypeScript strict mode
- `yaml` for manifest parsing
- `zod` for schema validation
- `eta` for markdown template rendering
- `tsx` for running TypeScript directly during development
- `vitest` for fixture tests

Content directories (current):

- `plugins/<id>/` - self-contained bundles. Each plugin can ship any combination of:
  - `README.md` (required) - LLM- and human-readable description
  - `skills/<name>/SKILL.md` - frontmatter (`name`, `description`) + body; aggregated into `SKILLS.md`
  - `agents/<name>.md` - copied to `.claude/agents/<name>.md`
  - `hooks/<name>.json` - merged into `.claude/settings.example.json`'s `hooks` block
  - `docs/<name>/{manifest.ts, template.md}` - rendered to the path declared in the manifest
  - `permissions.json` - merged into `.claude/settings.example.json`'s `permissions` block

  On disk today: the original bootstrap skills-only plugins (`planning`, `debugging`, `frontend`, `backend`, `delivery`, `security-review`) plus a copied snapshot of the current Codex session's real plugin and standalone skill inventory. Start from `plugins/INDEX.md` when you need the active inventory. The copied snapshot includes the enabled Codex plugins (`browser`, `codex-security`, `computer-use`, `documents`, `github`, `presentations`, `spreadsheets`, `superpowers`) and two harness-local containers for active standalone skills (`codex-system-skills`, `codex-user-skills`).
- `references-pool/` - shared raw LLM-readable reference files
- `presets/<name>.ts` - named plugin id lists (post-v0; hardcoded in compiler for v0)

## Planning Document Convention

Canonical planning docs for this repo now live under `.harness/docs/superpowers/`:

- design specs: `.harness/docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- implementation plans: `.harness/docs/superpowers/plans/YYYY-MM-DD-<topic>.md`

Current MVP docs:

- Spec: `.harness/docs/superpowers/specs/2026-05-25-mvp-development-design.md`
- Plan: `.harness/docs/superpowers/plans/2026-05-25-harness-kit-mvp-v0.md`

Root `CLAUDE.md`, `AGENTS.md`, and `README.md` are lightweight entry points. Keep repo-specific process rules in `.harness/` so there is one canonical location.

## Change Process

- For non-trivial code work, start from an approved spec and implementation plan.
- Keep changes narrowly scoped to the current MVP phase.
- Do not add CLI flags, watch mode, check mode, packaging, or LLM behavior while implementing v0 unless a plan explicitly changes scope.
- If a change expands the yaml schema, update the schema docs and fixtures in the same phase.
- If a generated output folder already has a yaml source, edit the yaml and recompile instead of hand-editing the folder.
- Until this repo has root `harness.yaml`, root `.harness/` may be edited directly, but treat those edits as bootstrap work that must later become compiler output.

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

## Security Requirements

- No secrets or API keys in sample harnesses, fixtures, references, or generated output.
- No network access in the compile path.
- No LLM call in the compile path.
- Validate yaml before resolving fragments.
- Prevent output path traversal; generated files must stay under the requested `outDir`.
- Treat content pools as local trusted project code, not user-supplied remote code.
- Do not ship broad hook-enforcement behavior under the harness-kit name.

## Documentation Structure

```text
.harness/
├── AGENTS.md
├── ARCHITECTURE.md
├── .claude/
│   └── settings.example.json
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
src/
  compile.ts
docs-pool/
catalog/
references-pool/
test/
example/
  nextjs/
  nextjs-acme/
```

## Development Commands

These commands become canonical once the v0 scaffold lands:

```bash
npm install
npm test
npm run test:watch
npx tsc --noEmit
npx tsx src/compile.ts
```

Until `package.json` exists, rely on file inspection and the active implementation plan.

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
