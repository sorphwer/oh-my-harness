# Dark Mode Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-controlled light / dark / system theme toggle that persists per signed-in user and per guest browser, with no flash on first paint.

**Architecture:** A `ThemeProvider` client component receives the resolved theme as a server-injected prop and sets `data-theme` on `<html>`. A `ThemeToggle` popover writes back through a server action (signed-in) or `localStorage` + cookie (guest). CSS variables already in `globals.css` switch between two `[data-theme=...]` blocks. See spec: `docs/superpowers/specs/2026-05-25-dark-mode-toggle-design.md`.

**Tech Stack:** Next.js App Router (Server Components, Server Actions), TypeScript, Tailwind CSS variables, Auth.js sessions, Postgres.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/layout/theme-provider.tsx` | New | Provider, `useTheme()` hook, applies `data-theme` |
| `src/components/layout/theme-toggle.tsx` | New | Icon button + popover, calls `setTheme()` |
| `src/app/actions/preferences.ts` | New | `persistThemePreference()` server action |
| `src/app/layout.tsx` | Modify | Read theme from session / cookie; render `<html data-theme>` |
| `src/app/(app)/layout.tsx` | Modify | Mount `<ThemeToggle />` in top bar |
| `src/app/globals.css` | Modify | Move color values into `[data-theme]` blocks |
| `migrations/2026_05_25_add_theme_preference.sql` | New | Add `users.theme_preference` column |
| `src/lib/users.ts` | Modify | Include `theme_preference` when loading the user row |

---

### Task 1: Database migration

- [ ] Create `migrations/2026_05_25_add_theme_preference.sql`:

```sql
ALTER TABLE users
  ADD COLUMN theme_preference TEXT
  CHECK (theme_preference IN ('light', 'dark', 'system'));
```

- [ ] Apply the migration locally and confirm the column exists.

### Task 2: Server action for persistence

- [ ] Create `src/app/actions/preferences.ts` exporting `persistThemePreference(theme: "light" | "dark" | "system")`.
- [ ] Validate input against the literal union; reject with `ApiError(400, "VALIDATION")` on a bad value.
- [ ] Resolve the current user from session. If unauthenticated, no-op and return `{ ok: true, scope: "guest" }`.
- [ ] Update `users.theme_preference` and return `{ ok: true, scope: "user" }`.

### Task 3: User row exposes the new field

- [ ] Update `src/lib/users.ts` so the function that loads the current user includes `theme_preference` in the returned shape.
- [ ] Update the TypeScript type alias for the current user.

### Task 4: ThemeProvider + useTheme hook

- [ ] Create `src/components/layout/theme-provider.tsx`.
- [ ] Accept `initial: "light" | "dark"` (already resolved on the server) and `preference: "light" | "dark" | "system"` (the raw choice).
- [ ] Set `<html data-theme="...">` on mount and whenever `preference` changes.
- [ ] Expose `useTheme()` returning `{ preference, resolved, setTheme }`.
- [ ] `setTheme(value)` updates context, writes the cookie, and:
  - if `window.localStorage` is available, writes `theme=value`
  - if a session exists (passed in as `signedIn: boolean` prop), calls `persistThemePreference(value)`

### Task 5: Root layout integration

- [ ] In `src/app/layout.tsx`, read the cookie + session and resolve the initial theme on the server.
- [ ] Render `<html data-theme={resolvedTheme}>` and wrap children in `<ThemeProvider initial={resolvedTheme} preference={rawPreference} signedIn={!!session} />`.

### Task 6: Top-bar toggle UI

- [ ] Create `src/components/layout/theme-toggle.tsx`.
- [ ] Icon button (`Sun` / `Moon` / `Monitor` icons depending on `preference`).
- [ ] Popover with three `role="menuitemradio"` options.
- [ ] On select, call `setTheme()` from `useTheme()`.
- [ ] Mount in `src/app/(app)/layout.tsx` top bar.

### Task 7: CSS variables

- [ ] In `src/app/globals.css`, extract the existing color tokens into two blocks:

```css
:root, [data-theme="light"] { --bg: #ffffff; --fg: #18181b; /* ... */ }
[data-theme="dark"] { --bg: #18181b; --fg: #fafafa; /* ... */ }
```

- [ ] Confirm no component styles hard-code the previous values; replace with `var(--...)` if any do.

### Task 8: First-paint smoke test

- [ ] With no preference saved, load `/` while OS is in dark mode. Confirm the page renders dark (no flash).
- [ ] Toggle to `"light"`, refresh. Confirm light is applied before first paint.
- [ ] Sign in and toggle. Sign out, clear cookies. Confirm the next session starts from system default.

### Task 9: Accessibility audit

- [ ] Confirm the toggle button has `aria-label="Theme"`.
- [ ] Confirm popover items have correct `aria-checked` reflecting `preference`.
- [ ] Add `@media (prefers-reduced-motion: reduce)` rule to disable any cross-fade transition.

### Task 10: Update docs

- [ ] Add an entry to `docs/FRONTEND.md` under "Theme" pointing at the toggle and the `data-theme` convention.
- [ ] Add `theme_preference` to the schema reference in `docs/generated/db-schema.md` (or note it for the next generation pass).
- [ ] Move this plan and the paired spec into `docs/superpowers/` archived state per repo convention once the work is merged.

---

## Acceptance

- [ ] Toggle reaches Light / Dark / System and visibly updates the page.
- [ ] No flash of incorrect theme on hard reload, signed in or signed out.
- [ ] Preference survives sign-out / sign-in for the same user.
- [ ] Database column is populated for signed-in users; null for users who never toggled.
- [ ] Lighthouse contrast checks pass on both themes for the primary page.
