# Dark Mode Toggle — Design Spec

**Date:** 2026-05-25
**Status:** Approved

## Overview

Add a user-controlled light / dark / system theme toggle to the authenticated app shell. The preference persists across sessions for signed-in users and across page reloads for guests.

## User Flow

1. User clicks the theme icon in the top bar.
2. A small popover opens with three options: Light, Dark, System.
3. The selected option is applied immediately to the document root (`data-theme="light|dark"`).
4. For signed-in users, the choice is persisted to the database via a server action.
5. For guests, the choice is persisted to `localStorage`.
6. On the next visit, the saved choice is applied before first paint to avoid a flash.

## Architecture

### Data Flow

```text
ThemeToggle (client)
  → setTheme("light" | "dark" | "system")
  → updates data-theme on <html>
  → if signed in: server action persistThemePreference(theme)
  → if guest: localStorage.setItem("theme", theme)

Server render
  → reads session.user.themePreference (or guest cookie)
  → renders <html data-theme={resolvedTheme}>
  → no client-side rehydration flash
```

### Resolution Rules

- `"system"` resolves via `prefers-color-scheme` on the client. On the server it falls back to `"light"`.
- An explicit `"light"` or `"dark"` always wins over the system preference.
- The resolved theme is what gets written to `data-theme`; the raw preference is what gets stored.

### Persistence

- Signed-in users: `users.theme_preference TEXT NULL CHECK (theme_preference IN ('light', 'dark', 'system'))`.
- Guests: `localStorage` key `theme`, same value set.
- A first-party cookie mirror (`theme=dark`) lets the server pick the right pre-paint theme even before the session is resolved.

## Files Changed

### `src/components/layout/theme-toggle.tsx` (new)

- Client component
- Renders an icon button + popover with three radio options
- Calls a context hook `useTheme()` to read/write state

### `src/components/layout/theme-provider.tsx` (new)

- Wraps the app; exposes `useTheme()` and applies `data-theme` to `document.documentElement`
- Reads initial value from a server-injected prop

### `src/app/layout.tsx`

- Read theme from session or cookie on the server
- Pass it to `<ThemeProvider initial={...}>` and to `<html data-theme={resolvedTheme}>`

### `src/app/(app)/layout.tsx`

- Mount `<ThemeToggle />` in the top bar between navigation and user dropdown

### `src/app/actions/preferences.ts` (new)

- `persistThemePreference(theme)` server action
- Validates input and updates `users.theme_preference`

### Database migration

- Add `theme_preference` column to `users`

### `src/app/globals.css`

- Replace hardcoded color values in :root with two declaration blocks scoped by `[data-theme="light"]` and `[data-theme="dark"]`
- Existing component styles continue to use the same CSS variable names — no per-component changes

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Unsupported value sent to server action | Reject with `400`, do not update database |
| `localStorage` blocked (privacy mode) | Fall back to in-memory state for the session |
| User signs in with one preference and database has another | Database wins on next render; popover reflects the new value |

## Accessibility

- Toggle button has `aria-label="Theme"`.
- Popover items use `role="menuitemradio"` with `aria-checked`.
- `prefers-reduced-motion` disables the cross-fade between themes.

## Out of Scope

- Per-page or per-route theme overrides
- Auto-switching by time of day
- High-contrast / dyslexia-friendly themes
- Syncing theme across multiple devices in real time
