# Operations Runbook

This runbook captures how the project is operated, verified, and recovered when something user-visible breaks. Keep the filled version concrete enough that a new operator can act without guessing.

Use this scaffold as an interview guide before replacing guidance with project facts. Ask for observable facts, named systems, exact owner names or roles, real dashboards, concrete commands, and recovery actions. If a system does not exist yet, say so explicitly in the filled runbook instead of leaving a generic note behind.

## How to Ask the User

Ask for facts in small batches and turn each answer into runbook text immediately. Prefer questions that can be answered with a URL, command, dashboard name, account owner, threshold, or yes/no decision.

Good operating questions are specific:

- Where does the live system run, and what URL or endpoint proves it is reachable?
- What is the primary user path that must work after every deploy?
- What data store, auth system, file store, queue, email service, payment service, or external API can affect that path?
- Which service is the source of truth for user-visible state?
- What failures count as incidents, and which failures are expected product behavior?
- Who can deploy, roll back, change secrets, or access production logs?
- Which dashboards, logs, alerts, or status pages should be checked first?
- What command or manual action verifies the system after a deploy?
- What recent incidents or recurring failure modes should already have scenario runbooks?

Avoid broad questions such as "what is the ops setup" or "what should go here." If the user gives a broad answer, narrow it with a follow-up: ask which path fails, what a user sees, where evidence appears, and what the safest first action is.

When details are unknown, ask whether the filled runbook should record the absence as the current operating truth. For example, a pre-production project can say there is no hosted production service, no on-call rotation, or no external monitor yet. Absence is still useful operational information when it is stated plainly.

## Production Environment

Describe the live or intended runtime surface:

- hosted service or local-only status
- production URL or primary health endpoint
- deployment platform and runtime
- database and persistence systems
- authentication and session storage
- background job, queue, email, storage, payment, search, or analytics providers
- owner or role responsible for production access

Do not list aspirational infrastructure as active. Separate current production facts from planned release work.

## Operating Model

State the one-line facts an operator needs on day one:

- the tenancy or ownership boundary
- where the session or identity record lives
- which system is the source of truth for user-visible outcomes
- which paths are read-only, mutating, asynchronous, or externally dependent
- what an incident looks like compared with an expected product error
- what can be safely retried and what requires human review

The filled version should make it possible to classify a report quickly: expected behavior, user error, degraded dependency, deploy regression, data issue, or security concern.

## Routine Checks

List the checks that prove the system is healthy during normal operation. Include only checks someone can actually perform.

Use this shape:

1. Reach the public or local entry point.
2. Complete the primary authenticated or unauthenticated user path.
3. Verify the source-of-truth data store responds.
4. Confirm background or asynchronous work is not stuck.
5. Inspect recent errors, latency, or queue depth against normal ranges.
6. Confirm external dependencies needed by the primary path are available.

For early-stage projects, routine checks can be local test commands and fixture verification. For deployed products, include dashboards, smoke-test paths, and alert checks.

## Incident Priorities

Define priorities by user impact, not by implementation component.

| Priority | Scenario |
|----------|----------|
| P1 | Core user flow is unavailable, data loss is suspected, or authentication is broadly broken |
| P1 | Production writes are corrupting or exposing data |
| P2 | A secondary feature is failing while the core flow still works |
| P2 | Background work is delayed but recoverable |
| P3 | Visual regression, copy issue, non-blocking quality issue, or documentation drift |

Adjust the filled version to the project. Every priority row should describe a failure an operator can recognize from user reports, monitors, logs, or smoke tests.

## Scenario Runbooks

Create scenario runbooks for failures that are likely, high-impact, or historically recurring. Start with the primary user path, then cover supporting systems.

Use this structure for each scenario. The heading should name a concrete user-visible failure.

### Scenario: Primary Flow Is Unavailable

Symptom: describe what the user, monitor, test, or log shows.

Checks:

1. Check the most likely and easiest-to-verify cause first.
2. Check the relevant deploy, config, dependency, data, or permission boundary.
3. Check logs or dashboards that can confirm the failure mode.

Actions:

1. Take the smallest reversible action that restores safety or visibility.
2. Roll back, retry, disable, reconfigure, or patch only when the checks support that action.
3. Record follow-up work when the immediate action is a mitigation rather than a root-cause fix.

Escalation: state when to page, who or which role to page, and what evidence to include.

Good scenario titles name the failing user outcome, such as sign-in fails, primary page returns an error, database connection fails, webhook delivery stops, emails are delayed, or compiler output differs from the expected fixture.

## Deployment and Rollback

Document how production changes are shipped and reversed:

- source branch or release source
- build and test commands
- deployment trigger
- rollback method
- post-deploy smoke test
- who can approve or execute production changes

For local-only tools, replace deployment steps with release, packaging, fixture, or acceptance-test steps. The goal is the same: an operator should know how a change becomes the version users rely on.

## Configuration and Secrets

Document required configuration without exposing secret values.

For each variable or setting, capture:

- name
- scope, such as server-only, client-exposed, build-time, runtime, local, preview, or production
- whether it is required for the primary path
- where it is configured
- what breaks when it is missing or wrong

Call out any client-exposed configuration explicitly. Server secrets must not appear in client bundles, logs, screenshots, or examples.

## Post-Deployment Verification

Define the exact checks after a production deploy or release:

1. Open the primary entry point.
2. Complete the most important user flow.
3. Perform one safe mutation if the product has writes.
4. Verify the mutation appears in the source of truth.
5. Check logs, alerts, and dashboards for the deployed version.
6. Confirm no secret or sensitive data was exposed in client assets or public output.

For tools without production hosting, use the equivalent acceptance target: command output, fixture diff, generated file tree, package smoke test, or documented manual workflow.

## Monitoring and Alerts

List the observability surfaces operators should trust:

- uptime checks
- application logs
- platform logs
- database dashboards
- queue dashboards
- email, payment, storage, auth, or external API dashboards
- error tracking
- analytics used as a health signal

For each surface, include the owner, what healthy looks like, and what threshold should trigger action. If monitoring is not configured, state the current gap and the manual check that substitutes for it.

## Operational Change Log

Use the filled runbook to record meaningful operational changes:

- new production dependency
- changed deployment path
- changed rollback procedure
- changed incident priority
- new recurring incident scenario
- removed or replaced monitoring surface

Keep the change log short. Link to the deeper spec, plan, incident review, pull request, or release note when more detail is needed.
