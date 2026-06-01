# Reliability Design

This document is a scaffold for capturing how a project behaves when work is
retried, duplicated, delayed, partially completed, stale, or failed. It should
help an agent gather enough concrete answers to later rewrite `RELIABILITY.md`
as a project-specific reliability design with the same granularity as a
completed harness document.

A filled version should explain the reliability goal, failure classes, state
transition rules, duplicate handling, side-effect semantics, freshness
guarantees, generated-output guarantees, and monitoring signals. It should be
specific enough that a caller, contributor, reviewer, or operator can predict
the system's behavior without reading the source.

## How To Ask The User

Start by inspecting the repo, existing harness docs, tests, API routes, CLI
commands, schemas, database models, background jobs, generated artifacts, and
deployment notes. Ask the user only for facts that are not already visible.

Ask one question at a time when the answer can change the next question. Prefer
questions that force a concrete rule: status code, terminal state, retry rule,
cache limit, output path, alert threshold, or source-of-truth system. Avoid
broad questions such as "what should reliability be." If the user answers
broadly, narrow the next question to one operation and one failure mode.

Before writing the final version, gather answers for these topics:

- the primary reliability promise
- the operations that mutate state, emit files, call dependencies, or trigger
  side effects
- the source of truth for user-visible or caller-visible outcomes
- the failure classes callers should see and the failure classes logs should
  keep internal
- the expected behavior for retries, duplicate requests, duplicate commands, or
  repeated events
- the state transitions that must be atomic
- the failures that are retryable, terminal, ignored, or operator-actionable
- the side effects that can fail after local work succeeds
- the downstream systems, queues, stores, filesystems, caches, or generated
  outputs that can drift from the source of truth
- the freshness guarantees for reads, caches, static pages, generated files, or
  copied resources
- the monitoring signals that prove the system failed safely or recovered

Good opening questions:

- "What is the most important reliability promise this project must keep?"
- "Which operation must never happen twice, even if the caller retries?"
- "When local work succeeds but a notification, webhook, queue, file write, or
  downstream call fails, what should the caller see?"
- "Which state transition has to be atomic, and what happens when two callers
  race?"
- "What makes a repeated request a duplicate rather than a new action?"
- "Which read path must always be fresh, and which path may serve stale data?"
- "What evidence should an operator check before retrying, rolling back, or
  marking the failure terminal?"

When the answers are vague, ask for one concrete scenario with this shape:
the caller action, the local state change, the external dependency or emitted
artifact, the failure point, the response returned to the caller, and the final
state recorded by the system.

If a category does not apply, the filled document should say so explicitly. For
example, a local-only generator may have no production service, no cache, and no
webhooks, while a hosted app may have no generated artifact output. Stating the
absence is better than leaving generic guidance behind.

## Reliability Goal

State the one reliability promise that matters most. The goal should be written
from the caller's or user's point of view, not from the implementation's point
of view.

Useful goal shapes include:

- same input and same version produce the same output
- accepted writes are durable and visible on the next read
- duplicate submissions do not create duplicate resources
- partial failures are recorded and surfaced instead of being hidden as success
- user-visible reads never leak data across ownership boundaries
- stale cached data is bounded and intentionally invalidated

Questions to ask:

- "Who depends on the reliability promise: end user, API caller, CLI user,
  operator, reviewer, or another service?"
- "What would make a caller lose trust in the system?"
- "Which failure should stop the operation instead of allowing ambiguous
  output?"
- "Which tradeoff should win by default: durability, freshness, availability,
  deterministic output, cost, or operator simplicity?"

## Error Handling Strategy

Describe the failure classes the project exposes and how each class is returned
or recorded. A filled version should name real status codes, error codes, exit
codes, log fields, UI states, or generated diagnostics.

Useful failure classes include:

- validation failure
- authentication or authorization failure
- not-found or inaccessible resource
- duplicate request or duplicate command
- invalid state transition
- dependency failure
- timeout
- filesystem or generated-output failure
- template, schema, or manifest failure
- unexpected internal failure

Questions to ask:

- "What single error shape should callers expect?"
- "Which failures are safe to show to users, and which details belong only in
  logs?"
- "Which failures should block completion before any ambiguous output is
  emitted?"
- "Which path, id, field, command, or resource name should appear in the error
  so the user can fix it?"
- "Does the project intentionally hide existence with a generic not-found
  response?"

## State Transition Semantics

List the states that matter for reliability and the transitions between them.
The filled version should explain which transitions are allowed, which are
terminal, which are retryable, and how concurrent attempts are handled.

For database-backed systems, state whether transitions are atomic at the
database. For file generators, state when an output is considered committed. For
workflow systems, state which event or job owns each transition.

Questions to ask:

- "What are the lifecycle states that callers or operators can observe?"
- "Which transition must happen exactly once?"
- "Which transitions are no-ops when repeated?"
- "What happens when two callers try to transition the same object at the same
  time?"
- "Which state is terminal, and what evidence should be kept when reaching it?"

## Duplicate Request Rule

Define how duplicate work is detected and what response is returned. A duplicate
rule should be deterministic enough that two contributors would implement the
same comparison.

Useful dimensions include:

- caller identity or credential
- resource owner, workspace, repository, account, or output directory
- canonical request body, command arguments, manifest, event id, or file path
- time window
- stable hashing or normalization rules
- response code or exit behavior
- reference to the existing resource, run, output, or diagnostic

Questions to ask:

- "Which repeated action should not create a second resource or output?"
- "What fields make two requests the same?"
- "Should whitespace, object key order, array order, casing, timestamps, or
  generated ids affect duplicate detection?"
- "What should the caller receive when a duplicate is detected?"
- "Is the duplicate response a success, conflict, warning, or ignored event?"

## Side-Effect Failure Semantics

Document what happens when the project commits local work and then a side
effect fails. Side effects include notifications, webhooks, emails, queue jobs,
external API calls, cache invalidation, generated-file writes, publication,
indexing, analytics, and edits to external surfaces.

A filled version should say whether the local record remains committed, whether
the side effect is retried, what state is stored, and what the caller sees.

Questions to ask:

- "Which side effects happen after the source-of-truth change?"
- "Can a side effect failure roll back the local write?"
- "What state records the failure?"
- "What failure detail is kept for retry or operator review?"
- "Does the caller receive the local id, the side-effect failure signal, both,
  or neither?"
- "Who owns retries: caller, background job, operator, or no one?"

## Downstream Execution Failure

If a successful local transition triggers downstream execution, document how
downstream failure affects the final outcome. Do not conflate "local request was
accepted" with "downstream work succeeded."

Questions to ask:

- "Which downstream systems can turn an accepted request into a failed outcome?"
- "Where is the downstream status code, error message, run id, or attempt count
  stored?"
- "Which downstream failures are retryable, and which are terminal?"
- "Does the caller poll for final status, receive a synchronous failure, or get
  notified later?"
- "What prevents an old downstream result from overwriting a newer state?"

## Timeout And Expiration Semantics

Describe deadlines, time-bounded states, idle runs, stale locks, and expiration
rules. If the project uses lazy timeout, state which read or command evaluates
the timeout before returning.

Questions to ask:

- "Which states or outputs expire?"
- "Is timeout evaluated by cron, queue worker, database TTL, read-time check, or
  manual operation?"
- "What response does a caller get after expiration?"
- "Can an expired item be retried, resumed, restored, or only recreated?"
- "What clock or timestamp is authoritative?"

## Cache And Freshness Discipline

State where cached data can appear and how stale it may become. A filled version
should name the read paths that require freshness, the paths allowed to cache,
and the invalidation rule for mutations.

Questions to ask:

- "Which read must reflect the source of truth immediately?"
- "Which read can tolerate stale data, and for how long?"
- "What mutation invalidates or revalidates cached output?"
- "Which framework, CDN, browser, database, or application cache is involved?"
- "What failure would users see if stale data were served?"

## Generated Artifact And Filesystem Reliability

For CLIs, compilers, scaffolding tools, exporters, or document generators,
describe how output is produced safely and deterministically. If the project
does not emit files, say so in the filled version and omit file-specific rules.

Useful rules include:

- same inputs produce the same bytes
- output order does not depend on filesystem traversal order
- line endings and whitespace are stable
- copied resources are copied in the intended mode
- duplicate output paths fail instead of using last-writer-wins behavior
- unsafe output paths are rejected
- parent directories are created intentionally
- files not owned by the generator are preserved unless an explicit clean mode
  says otherwise

Questions to ask:

- "What inputs define the output exactly?"
- "Which files, directories, or resources are owned by the generator?"
- "What happens if two sources resolve to the same output path?"
- "Can the generator delete existing files, or only write known outputs?"
- "How is path traversal, absolute output, or writing outside the target
  directory prevented?"
- "What byte-for-byte fixture proves output stability?"

## Path, Ownership, And Boundary Safety

Reliability and security overlap when the wrong caller can read, write, mutate,
or generate output across a boundary. State the boundary that every reliable
operation must preserve.

Questions to ask:

- "What boundary matters most: user, organization, workspace, repository,
  environment, API key, account, document, or output directory?"
- "Where is the active owner resolved?"
- "Which caller-supplied boundary values are ignored or rechecked?"
- "Which operation could accidentally cross the boundary during a retry,
  duplicate check, cache read, or generated-file write?"
- "What test or review step proves the boundary is preserved?"

## Monitoring Recommendations

List the signals that show reliability is healthy or degraded. The filled
version should name real dashboards, logs, tests, commands, metrics, thresholds,
or manual checks.

Useful signals include:

- validation error rate
- duplicate response rate
- side-effect failure count
- downstream execution failure count
- age of in-flight work
- stale cache incidents
- fixture diffs or generated-output drift
- filesystem write failures
- queue depth and retry exhaustion
- database connection latency or error rate
- unexpected internal error rate

Questions to ask:

- "Which reliability failure should page someone?"
- "Which failures are normal product behavior and should not alert?"
- "What command, test, fixture, or dashboard proves the system is healthy?"
- "What threshold distinguishes a transient blip from an incident?"
- "What evidence should be captured before retrying or rolling back?"

## Completion Check

A finished project-specific `RELIABILITY.md` should pass this check:

- The reliability goal is written from the caller's or user's point of view.
- Error classes map to concrete response, exit, UI, log, or diagnostic behavior.
- State transitions are explicit, including atomic, retryable, and terminal
  outcomes.
- Duplicate detection is deterministic and names the returned behavior.
- Side-effect and downstream failures do not masquerade as success.
- Timeout, expiration, cache, and freshness rules are stated when relevant.
- Generated-output and filesystem rules are stated when the project emits files.
- Ownership or output-boundary safety is covered where retries, caches, or file
  writes could cross a boundary.
- Monitoring recommendations name observable signals instead of generic
  aspirations.
- The document contains no unresolved questions, template instructions, or
  generic examples that read as final project facts.
