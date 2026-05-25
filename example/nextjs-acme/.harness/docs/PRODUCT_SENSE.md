# Acme Notes — Product Vision and Sense

## Problem Statement

People who write often want a frictionless place to draft something, then later flip it from a private draft into a public link they can share — without having to think about hosting, formatting, or a CMS. Existing "notes" apps either keep everything private (no sharing) or push you into a heavyweight publishing workflow as soon as you want to share.

## Target Audience

1. Independent writers who want one place for drafting and selective sharing — they care about how fast they can capture an idea.
2. Engineers and PMs who want to share a written explanation by URL without opening Notion or Google Docs — they care about minimal ceremony.
3. People publishing occasional public writeups — they care about a stable, clean read URL.

## Product Value

- One place for both private drafts and public links.
- The "publish" gesture is a single toggle, not a workflow.
- Public URLs are simple (`/n/note_xxx`) and survive title changes.
- No tracking, no comments, no analytics, no follower model — just a writing surface and a share link.

## MVP Intentional Constraints

- Plain text + minimal markdown only. No rich text, no embeds, no images in V1.
- No multi-user collaboration. Each account is single-user; sharing means "this URL is readable by anyone."
- No comments, reactions, follower model, or feed.
- No revision history visible to users in V1 (the database keeps `updated_at`, that's all).
- No custom domains. All public links are under our domain.
- No mobile app. The web app is responsive and that's the surface.

## Strategic Shape

Even though V1 is single-user, the V1 schema already encodes:

- per-user data ownership (every row keyed by `user_id`)
- a state machine (`DRAFT` / `PUBLISHED` / `ARCHIVED`) — extensible for a future review or scheduled-publish state
- soft delete (`deleted_at`) — keeps options open for an undo / trash bin

We are not building those features for V1, but the schema does not block them.

## Future Direction

- Scheduled publish (`SCHEDULED` state with a `publish_at` time)
- Lightweight collaboration (one collaborator per note, read-only or comment-only)
- Custom domains for public links
- An export-everything button for portability
