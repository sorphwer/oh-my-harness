# Quality Standards and Scoring Criteria

This document is a scaffold for defining the quality bar a project must clear
before a feature, release, or generated artifact is called done. It should help
an agent gather enough concrete answers to later rewrite `QUALITY_SCORE.md` as a
project-specific quality standard with the same granularity as a completed
harness document.

A filled version should name the actual checks that matter for the project:
code conventions, security boundaries, reliability guarantees, user experience
standards, documentation consistency, and verification strategy. It should be
specific enough that a reviewer can decide whether work passes without asking
the original author.

## How To Ask The User

Start by inspecting the repo, existing harness docs, plans, tests, framework
configuration, and public surfaces. Ask the user only for facts that are not
already visible in those sources.

Ask one question at a time when the answer can change the next question. Prefer
multiple-choice options when the user is choosing a quality tradeoff, and use
open-ended questions when asking for project-specific risks or acceptance
criteria.

Before writing the final version, gather answers for these topics:

- the primary thing the project must protect or optimize
- the language, framework, runtime, and linting or type-checking rules
- the security boundary and the data that must never leak
- the most important reliability guarantee
- the main human-facing or caller-facing workflow
- the lifecycle states, status tags, or output states that reviewers must check
- the documentation sources that must stay consistent with code
- the test commands, manual scenarios, or review steps that count as evidence
- known gaps that should be stated honestly instead of hidden

Good opening questions:

- "What is the most expensive quality failure this project could have?"
- "Which check should block completion: type errors, lint errors, tests,
  manual UAT, deploy verification, security review, or documentation review?"
- "What boundary prevents one user, tenant, workspace, repository, or caller
  from seeing another's data?"
- "Which states or lifecycle transitions must be reviewed every time they
  change?"
- "Which user-facing behavior should remain consistent across new features?"
- "Which docs should be treated as the source of truth when code and prose
  disagree?"

When the answers are vague, ask for one concrete example of a passing change and
one concrete example of a change that should fail review.

## Quality Score Model

Define how the project decides whether work passes. A small project may use a
checklist only. A larger project may use a score per area plus mandatory gates.

Use plain language for the scoring scale. Each score should map to observable
evidence, not reviewer mood.

Example scale:

- `0` means the area is unverified or known broken.
- `1` means the area works only for the happy path or relies on undocumented
  assumptions.
- `2` means the area meets the current project contract with known limitations
  documented.
- `3` means the area is verified, documented, and resilient to the expected edge
  cases for this phase.

Questions to ask:

- "Does this project need numeric scores, pass/fail gates, or both?"
- "Which areas are mandatory gates even when the total score looks acceptable?"
- "What evidence moves an area from acceptable to excellent?"
- "Which known gaps are allowed in the current phase, and where are they
  tracked?"

## Code Quality

Document the language, framework, type-safety, linting, naming, import, and
module-boundary rules that apply to this project. A filled version should name
real commands, real config files, and real forbidden patterns.

Useful rules to capture include:

- type-checking and strictness expectations
- linting and formatting commands that must pass
- naming conventions for domain concepts and public fields
- allowed and disallowed casts, suppressions, or generated code edits
- server-only, client-only, runtime-only, or build-only module boundaries
- where shared schemas, validators, constants, or helpers should live
- when duplication is acceptable and when a shared abstraction is required

Questions to ask:

- "Which commands prove code quality for this project?"
- "Which suppressions are acceptable, and what reason must they include?"
- "Which names or field casing conventions are already load-bearing?"
- "Which modules must never import from each other?"
- "What should a reviewer grep for before accepting a new term or helper?"

## Security

State the project-specific security bar. A filled version should identify the
active trust boundary, the secret-handling rules, the validation points, and the
failure modes that must not expose sensitive detail.

Useful rules to capture include:

- secret storage and client-exposed environment variable rules
- authentication and authorization boundaries
- tenancy, ownership, workspace, repository, account, or output-directory guards
- input validation at API, CLI, file, webhook, or manifest boundaries
- safe error responses and server-side logging expectations
- path traversal, command execution, network access, or generated-file rules
- encryption, signing, token rotation, or audit-log requirements when relevant

Questions to ask:

- "What is the active security boundary in this project?"
- "Which values are secrets, and which values may be exposed to clients or
  generated output?"
- "Where does validation happen before data affects storage, network calls, or
  emitted files?"
- "What information may appear in user-facing errors, and what must stay in
  logs only?"
- "Which security checks are mandatory for every change in this area?"

## Reliability

Define the behavior that must stay correct under retries, duplicates, partial
failure, stale reads, timeouts, and state transitions. A filled version should
name the actual lifecycle rules and the expected behavior when operations fail.

Useful rules to capture include:

- atomic state transitions and idempotency expectations
- duplicate request handling and conflict responses
- retryable versus terminal failure states
- background jobs, queues, webhooks, scheduled tasks, or read-time transitions
- cache ownership, invalidation, and stale-data limits
- filesystem, database, network, or external-service failure behavior
- observability expectations for important failures

Questions to ask:

- "Which operation must change state exactly once?"
- "How should duplicate requests, retries, or repeated commands behave?"
- "Which failures are terminal, and which should be retried?"
- "Does any state change happen later, asynchronously, or on read?"
- "What evidence shows that the system recovered or failed safely?"

## User Experience

Document the quality bar for human-facing surfaces. For APIs, CLIs, libraries,
or generators, treat the caller experience as the interface and describe output
shape, errors, defaults, and stability instead of visual layout.

Useful rules to capture include:

- navigation, layout density, and page structure expectations
- loading, empty, invalid, denied, failed, and success states
- destructive action confirmation rules
- form validation and recovery behavior
- status badge, lifecycle tag, and icon mapping rules
- copy tone and vocabulary that should or should not appear
- accessibility, responsive behavior, and keyboard expectations
- CLI stdout, stderr, exit code, and generated artifact expectations

Questions to ask:

- "What is the most common workflow, and what should make it feel fast and
  understandable?"
- "Which actions need confirmation, undo, retry, or a clear failure message?"
- "What states should be represented with badges, tags, icons, or exit codes?"
- "Which internal terms should never appear in user-facing copy?"
- "What viewport, terminal, device, or caller shape must be checked manually?"

### Status Tag Mapping

If the product has lifecycle states, define the single source of truth for how
each state is displayed or returned. Include this section only when state
presentation matters to reviewers.

Questions to ask:

- "What are the actual lifecycle states?"
- "Which tone, icon, label, or exit behavior belongs to each state?"
- "Where else will this mapping be referenced so it is not redefined?"
- "Which labels are internal-only and should not be shown to users?"

## Documentation

State which docs must stay consistent with the code, public contract, and active
plans. A filled version should name the real files that reviewers check when a
route, command, state, field, or output changes.

Useful rules to capture include:

- canonical docs for product behavior, API routes, CLI commands, or generated
  files
- docs that must be updated in the same change as code
- stale examples that reviewers should reject
- terms, field names, state names, and route names that must stay consistent
- active plans or implementation records that must be updated after completion

Questions to ask:

- "Which documentation file is canonical for the public contract?"
- "Which docs usually drift when code changes?"
- "What examples must be updated when fields, routes, commands, or states
  change?"
- "Which planning or completion record should move when a phase changes status?"

## Testing Strategy

Describe the verification strategy honestly. If the current phase relies on
manual end-to-end checks, say so and list the canonical scenarios. As automated
coverage grows, replace manual-only evidence with concrete commands and named
test files.

Useful rules to capture include:

- required test, lint, type-check, build, or compile commands
- fixture, golden-output, snapshot, or byte-equality expectations
- manual UAT scenarios and the order they should be run
- security, accessibility, performance, or deploy checks when relevant
- known test gaps and where follow-up work is tracked
- evidence required before claiming work is done

Questions to ask:

- "What command or manual scenario proves the main contract still works?"
- "Which fixtures or golden outputs must be byte-stable?"
- "Which failure path must be tested before release?"
- "What verification is intentionally deferred in this phase?"
- "Where should a reviewer record evidence or known gaps?"

## Quality Checklist

Use a compact checklist for the gates that must pass before completion. The
filled version should use project-specific rows and checks.

| Area | Required checks |
|------|-----------------|
| Code | type, lint, naming, and module-boundary rules are satisfied |
| Security | trust boundaries, validation, secrets, and safe errors are checked |
| Reliability | lifecycle, retries, duplicates, and failure behavior match the contract |
| UX | primary workflow, states, errors, and accessibility expectations are checked |
| Docs | public contract, examples, and active plans are consistent |
| Tests | automated commands or manual scenarios provide current evidence |

## Completion Check

A finished project-specific `QUALITY_SCORE.md` should pass this check:

- The scoring model or pass/fail gates are explicit.
- Each quality area names real project rules rather than generic advice.
- Security and ownership boundaries are stated, even for single-user projects.
- Reliability rules cover duplicates, retries, state transitions, or explain why
  they do not apply.
- User-facing or caller-facing behavior is concrete enough to review.
- Documentation consistency rules name the files that must stay aligned.
- Testing strategy lists executable commands or manual scenarios that count as
  evidence.
- Known gaps are stated honestly with their current tracking location.
- The document contains no unresolved questions, template instructions, or
  generic examples that read as final project facts.
