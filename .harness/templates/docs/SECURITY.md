# Security Overview

This document records the security posture of the project and the questions an
agent should ask before turning this scaffold into a project-specific security
model. Keep the final version factual, concrete, and tied to the real codebase.

## How to Ask the User

Ask for facts, not opinions. Prefer short, concrete questions that map directly
to sections in this document. If the user is unsure, inspect the code and then
ask them to confirm the observed behavior.

Ask these questions first:

1. What data does the system protect, and which data is sensitive?
2. Who can use the system: anonymous users, signed-in users, admins, services,
   agents, or third-party systems?
3. Which routes or commands are intentionally public or unauthenticated?
4. Where is identity established and verified before business logic runs?
5. Are there tenants, organizations, workspaces, accounts, or roles?
6. Which secrets exist, where are they stored, and which ones can reach the
   client?
7. Does the system accept inbound webhooks, callbacks, file uploads, or user
   supplied URLs?
8. Does any path call an LLM, execute generated code, run shell commands, or
   fetch remote content?
9. Which state transitions must be atomic to prevent duplicate actions?
10. What security gaps are accepted for the current release?

When filling the final SECURITY.md:

- Replace general guidance with project-specific facts.
- Name concrete files, routes, tables, environment variables, and verification
  points when known.
- State when a capability is not present instead of leaving a vague section.
- Keep acknowledged gaps explicit and scoped to the current release.
- Do not include real secrets, private customer data, or speculative claims.

## Security Principles

Use this section to list the invariants that must remain true for the system to
be safe. Good principles are testable and connected to real boundaries.

Examples of principles to adapt or replace:

1. Authentication is verified before protected business logic runs.
2. Authorization is enforced at the data boundary, not only in the UI.
3. Secrets never reach client bundles, logs, examples, fixtures, or generated
   documentation.
4. Public and unauthenticated surfaces are intentionally small and documented.
5. State transitions that spend money, send messages, publish data, or grant
   access are idempotent or atomic.
6. Generated, user-provided, or remote content is treated as untrusted input.
7. The system fails closed when identity, tenant scope, signature verification,
   or permission checks cannot be established.

Ask the user:

- Which security rules should never be violated, even during an incident or
  migration?
- Which risks are intentionally accepted for this release?

## Assets and Data Classification

Document what the system protects and how sensitive each class of data is.
Include user data, tenant data, credentials, logs, generated files, uploaded
files, analytics events, billing records, and operational metadata when they
exist.

For each data class, capture:

- who owns it
- where it is stored
- who can read it
- who can modify it
- whether it is sent to third parties
- whether it is exposed in logs, telemetry, exports, or support tools

Ask the user:

- What data would cause user harm, business harm, or compliance risk if leaked?
- Is any data encrypted, hashed, redacted, or intentionally stored in plaintext?

## Trust Boundaries

List each boundary where untrusted input enters or where privileges change.
Common boundaries include browsers, public routes, authenticated app routes,
admin surfaces, background jobs, webhooks, queues, databases, storage buckets,
LLM providers, payment providers, email providers, and local developer tools.

For each boundary, capture:

- source of input
- trust level
- validation point
- authorization point
- allowed side effects
- failure behavior

Ask the user:

- Which inputs are controlled by users or third parties?
- Which components are trusted project code, and which are external services?
- Can any user-controlled value influence file paths, shell commands, URLs,
  redirects, SQL queries, prompts, or generated output paths?

## Authentication Layers

Document every mechanism that establishes identity.

### User Authentication

Record the sign-in mechanism, session storage, cookie behavior, token lifetime,
refresh behavior, and the exact verification point before protected routes run.

Ask the user:

- How do users sign in?
- Where does the server resolve the current user?
- Which middleware, handler, or route guard rejects missing or expired sessions?
- What happens when session verification fails?

### Service and Agent Authentication

Record any API key, service token, signed request, mTLS, OAuth client, or
machine-to-machine flow. If the system has no machine API, state that directly
in the final document.

Ask the user:

- Are there endpoints intended for agents, integrations, cron jobs, or internal
  services?
- Are machine credentials scoped to one tenant, one resource, one action, or
  broad administrative access?
- Are credentials stored as hashes, encrypted values, or plaintext?
- How are keys rotated and revoked?

### Third-Party Signature Verification

Record webhook or callback providers, signature algorithms, replay protection,
clock tolerance, and where verification runs.

Ask the user:

- Which providers call inbound endpoints?
- Is the signature verified before parsing or business logic with side effects?
- Is replay prevented with timestamps, nonces, event IDs, or idempotency keys?

## Authorization and Tenant Isolation

Document the primary access boundary. It may be a user account, organization,
workspace, project, environment, customer account, or single-tenant deployment.

For multi-tenant systems, record:

- tenant entity
- membership model
- role model
- how active tenant scope is resolved
- where tenant filtering is enforced
- whether the database uses row-level security or query-level enforcement
- how cross-tenant access attempts respond

For single-tenant systems, say so directly and describe what prevents accidental
multi-user exposure.

Ask the user:

- What is the tenant boundary?
- Can a user belong to more than one tenant?
- Are roles enforced server-side?
- Do queries include tenant or owner filters at the data boundary?
- Should cross-tenant reads return forbidden, not found, or a redacted response?

## Public and Unauthenticated Surfaces

List every route, command, file, bucket, callback, or page that is intentionally
reachable without a signed-in user.

For each public surface, capture:

- purpose
- allowed methods
- accepted inputs
- validation rules
- selected response fields
- rate limits or abuse controls
- cache behavior
- reason it is safe to expose

Ask the user:

- What is the complete unauthenticated attack surface?
- Are public IDs random enough to act as share tokens?
- Can public responses reveal owner IDs, internal state, deleted records, or
  private metadata?

## Secrets and Configuration

Document every environment variable and secret class without revealing secret
values.

Group secrets by exposure level:

- server-only secrets
- client-exposed public configuration
- third-party provider credentials
- database and storage credentials
- signing, encryption, and session keys
- local development secrets

For each secret, capture:

- purpose
- storage location
- runtime that can access it
- rotation process
- blast radius if exposed

Ask the user:

- Which environment variables are safe to expose to the client?
- Which values are required only during build, server runtime, tests, or local
  development?
- How are signing keys and encryption keys rotated?
- Are secrets ever printed in logs, error messages, generated docs, fixtures, or
  screenshots?

## Data Storage and Encryption

Record storage systems, encryption assumptions, retention, backups, deletion
behavior, and plaintext exceptions.

Ask the user:

- Which databases, object stores, queues, caches, and analytics systems hold
  user or tenant data?
- Is encryption provided by the platform, by the application, or not used?
- Are sensitive fields encrypted, hashed, tokenized, or redacted?
- How are records deleted, archived, or retained?
- Are backups covered by the same access and deletion expectations?

## Input Validation and Output Encoding

Document how the system validates request bodies, query parameters, route
params, uploaded files, imported data, generated content, and third-party
payloads. Include output encoding rules for HTML, Markdown, JSON, CSV, logs, and
downloaded files when relevant.

Ask the user:

- Which schemas, validators, or type guards reject malformed input?
- Are URLs normalized and restricted before fetching?
- Are filenames, paths, and archive contents sanitized?
- Can user content render as HTML, Markdown, SVG, script, style, iframe, or rich
  text?
- Which outputs need escaping to prevent injection?

## File, Path, and Upload Handling

Document file upload, download, import, export, and generated-output paths.

Ask the user:

- Can users upload files or provide filenames?
- What file types, sizes, and content signatures are accepted?
- Are files scanned, transformed, sandboxed, or served from isolated origins?
- Can any input influence a filesystem path, object-storage key, or download
  filename?
- Are generated files constrained to an expected output directory?

## Network, LLM, and Tool Boundaries

Document outbound network calls, inbound callbacks, LLM usage, browser
automation, local shell execution, package downloads, and generated code
execution.

Ask the user:

- Which code paths call external services?
- Can users influence destination URLs, headers, prompts, tool arguments, or
  command strings?
- Does the system fetch remote templates, remote code, remote images, package
  registries, or arbitrary URLs?
- Does any LLM output become code, SQL, shell commands, file paths, routes,
  permissions, or stored content?
- What validation happens after generated output and before side effects?

## State Transitions and Race Protection

Document transitions where duplicate or concurrent actions would be harmful:
payments, publishing, deleting, sending messages, granting access, accepting
invitations, running jobs, syncing data, and updating workflow state.

Ask the user:

- Which actions must happen exactly once?
- Are transitions guarded by expected current state, unique constraints,
  idempotency keys, transactions, locks, or queues?
- What response should a duplicate or stale request receive?

## Logging, Audit, and Monitoring

Document what the system logs, what it redacts, and which actions are auditable.
Mention alerts, security events, and who can inspect logs if known.

Ask the user:

- Are authentication failures, permission denials, data exports, admin actions,
  key creation, key rotation, and destructive actions logged?
- Are logs safe from secrets and sensitive payloads?
- How long are logs retained?
- Who can access production logs and audit records?

## Dependency and Supply Chain Posture

Document package managers, lockfiles, update process, vulnerability scanning,
build provenance, deployment permissions, and any generated artifacts.

Ask the user:

- Which package managers and lockfiles define the dependency graph?
- Are dependency updates reviewed manually, automated, or both?
- Does CI run tests, linting, type checks, audits, secret scans, or security
  scanners?
- Can build scripts or install scripts execute untrusted code?
- Who can publish packages, deploy releases, or change production environment
  variables?

## Deployment and Operations

Document production environments, staging environments, access controls,
deployment flow, rollback process, backups, and incident response expectations.

Ask the user:

- Where does the system run in production?
- Who can deploy, roll back, or edit production configuration?
- Is there a staging environment that mirrors production security settings?
- What is the backup and restore process?
- Who owns incident triage and user notification decisions?

## Known Gaps

Use this section to record accepted gaps honestly. A useful gap is specific,
bounded, and connected to a future decision or mitigation. Avoid vague entries
that only say security should be improved.

Examples of gap categories to consider:

- no application-layer rate limiting
- no dedicated audit log
- no two-factor authentication
- no content security policy beyond framework defaults
- no automated dependency audit in CI
- no documented incident-response timeline
- no formal key-rotation runbook
- no security review for a newly added public surface

Ask the user:

- Which gaps are acceptable for the current release?
- Which gaps block launch?
- Which gaps need owners, dates, or explicit risk acceptance?
