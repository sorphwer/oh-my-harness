# Product Vision and Sense

This document is a scaffold for capturing the product judgment behind a
project. It should help an agent gather enough concrete answers to later
rewrite `PRODUCT_SENSE.md` as a project-specific product overview with the same
granularity as a completed harness document.

The filled document should explain the user's pain, the audience, the
differentiated value, the intentional constraints, the strategic shape, and the
likely future direction. It should read like product memory for future planning,
not like marketing copy or an implementation checklist.

## How To Ask The User

Start by inspecting the repo, existing harness docs, issues, pull requests,
roadmap notes, and product surfaces. Tell the user what product facts are
already visible, then ask only for the missing decisions that would change the
document.

Ask one question at a time when the answer can change the next question. Prefer
short multiple-choice options when the user is choosing between product shapes,
and use open-ended questions when asking for the user's own language about the
problem. When the answer is vague, ask for one concrete user story before
editing the final document.

Good intake behavior:

- Use the user's words for pain, audience, and value before polishing them.
- Separate the problem from the proposed solution.
- Ask what the product is deliberately not doing, because constraints are often
  more load-bearing than features.
- Ask what must remain true if the implementation changes.
- Treat "not applicable" as a valid answer and omit unsupported claims from the
  filled document.
- When the user is unsure, propose a conservative default and label it as an
  assumption before editing.

Before writing the final version, gather answers for these topics:

- the primary pain the product exists to solve
- the distinct user roles and what each role values most
- the value a user would notice without reading an architecture document
- the product constraints that prevent scope creep
- the core entities, states, or relationships that make the product extensible
- the next direction if the current version succeeds
- the nearby tools, workflows, or alternatives the product should not blur into

Good opening questions:

- "What problem should still be true even if we replace the entire
  implementation?"
- "Who are the top one to three users, and what does each one care about most?"
- "What would a user underline as the differentiated value?"
- "Which features or workflows are intentionally out of scope for the first
  usable version?"
- "What structure should the product preserve now so the obvious next move is
  cheap later?"
- "If this version works, what direction should the product grow toward next?"
- "Which existing product category or competitor should this avoid imitating?"

## Problem Statement

Capture one concise paragraph that names the user's pain in their words. The
problem statement should not depend on the current implementation, framework,
UI, or architecture. It should still be true if the team later chooses a
different technical approach.

Questions to ask:

- "What is painful, slow, risky, expensive, or repetitive before this product
  exists?"
- "Who feels that pain most often?"
- "What bad workaround are users relying on today?"
- "What decision keeps being made incorrectly because the product does not exist
  yet?"
- "How would a user describe the problem without naming our solution?"

## Target Audience

List the distinct user roles the product serves. Three or fewer is usually
enough. For each role, state what that role cares about most, using product
language rather than internal team language.

A filled version should avoid vague audiences such as "developers" or "teams"
unless the project truly serves the whole category. Prefer a narrower audience
with a clear job to be done.

Questions to ask:

- "Who chooses the product, who uses it day to day, and who reviews or approves
  the result?"
- "Which role is the primary audience when tradeoffs conflict?"
- "What does each role want to finish faster, safer, or with less repeated
  explanation?"
- "Which potential audience is intentionally not being served yet?"

## Product Value

Write the value a user would recognize quickly. Focus on differentiated value,
not a list of features or parity claims. Each bullet should explain why the
product matters from the user's perspective.

Questions to ask:

- "What can the user do after adopting this that they could not reliably do
  before?"
- "What repeated prompt, meeting, review comment, manual step, or risky judgment
  does this remove?"
- "What value is unique enough that a user would repeat it to someone else?"
- "Which feature is only a means to the value, and should stay out of this
  section?"

## MVP Intentional Constraints

State what the first usable version deliberately does not do. This section
protects planning from scope creep and helps agents avoid inventing work that
the product strategy has already rejected.

Each constraint should be specific enough to block an implementation idea. A
filled version may include product constraints, technical constraints, workflow
constraints, audience exclusions, integration exclusions, and launch constraints.

Questions to ask:

- "What tempting feature should not be built yet?"
- "Which workflow is out of scope even if a user asks for it?"
- "What integration, platform, role, or deployment shape is excluded from the
  first usable version?"
- "Which constraint exists to keep the product simple, deterministic, safe, or
  easy to explain?"
- "What would make the first version too broad to verify?"

## Strategic Shape

Describe the durable product model that the current version should preserve.
This usually means the main entities, relationships, states, ownership
boundaries, or compilation and publishing direction that future work must not
accidentally reverse.

Strategic shape is not a roadmap. It explains the structure that makes future
growth cheap while keeping the current version small.

Questions to ask:

- "What are the core nouns in the product, and how do they relate?"
- "Which state machine, ownership boundary, or source-of-truth rule should be
  encoded from the beginning?"
- "What should be deterministic, stable, or one-way?"
- "What future option are we preserving without building the full feature now?"
- "Which adjacent product pitch or category should this product stay distinct
  from?"

## Future Direction

Capture three to five likely directions if the current version succeeds. These
bullets should describe a vector, not a committed roadmap. Keep speculative
ideas out unless they explain how the product may grow from the current shape.

Questions to ask:

- "If users adopt this version, what is the most natural next capability?"
- "What should become easier once the product model is proven?"
- "Which audience, platform, integration, or workflow might come next?"
- "What should wait until the current product contract is stable?"
- "Which future direction would change the product identity too much?"

## Completion Check

A finished project-specific `PRODUCT_SENSE.md` should pass this check:

- The problem statement is concrete and does not smuggle in the solution.
- The audience is narrow enough to guide tradeoffs.
- Product value is written from the user's perspective.
- MVP constraints are specific enough to block scope creep.
- Strategic shape names durable entities, states, relationships, or boundaries.
- Future direction reads as a product vector, not a task list.
- The document contains no unresolved questions, template instructions, or
  generic examples that read as final project facts.
