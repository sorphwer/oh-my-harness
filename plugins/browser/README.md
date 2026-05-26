# browser

This directory is a copy of the currently enabled Codex plugin metadata and skills from this machine.

## Source Metadata

- Name: browser
- Version: 26.519.41501
- Description: Browser / browser-use plugin  Aliases: @browser, @browser-use, browser-use, Browser, in-app browser.  Use Browser, the Codex in-app browser, when the user asks to open, inspect, navigate, test, click, type, or screenshot local web targets such as localhost, 127.0.0.1, ::1, file:// URLs, or the current in-app browser tab.  After significant frontend changes to a local app, use Browser to open the relevant local target when it is known or obvious, unless the user asks for another browser tool.  For requests like "open localhost:3000" or "open to localhost:4000", navigate the in-app browser to http://localhost:3000 or http://localhost:4000.  Do not satisfy explicit @browser or @browser-use requests with macOS `open`, shell commands, or generic web browsing unless the user asks for another browser tool or approves a fallback.
- License: Proprietary
- Repository: https://github.com/openai/openai/tree/master/lib/browser_use/plugin

## Contributes

- `skills/browser`

## Provenance

Generated from the active local Codex plugin cache. Skill files are copied verbatim from the source plugin directory.
