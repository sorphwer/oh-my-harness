# Plugin Inventory

This inventory was generated from the plugins and skills active in the current Codex session. Plugin metadata comes from `.codex-plugin/plugin.json`; skill instructions come from the copied `SKILL.md` files.

## Active Codex Plugins

| Plugin | Version | Skills |
|---|---:|---:|
| `browser` | `26.519.41501` | 1 |
| `codex-security` | `0.1.0` | 6 |
| `computer-use` | `1.0.799` | 1 |
| `documents` | `26.521.10419` | 1 |
| `github` | `0.1.0` | 4 |
| `presentations` | `26.521.10419` | 1 |
| `spreadsheets` | `26.521.10419` | 1 |
| `superpowers` | `5.1.0` | 14 |

## Active Standalone Skills

| Container | Skills |
|---|---:|
| `codex-system-skills` | 5 |
| `codex-user-skills` | 31 |

## Standalone Skill IDs

- `imagegen` - Generate or edit raster images when the task benefits from AI-created bitmap visuals such as photos, illustrations, textures, sprites, mockups, or transparent-background cutouts. Use when Codex should create a brand-new image, transform an existing image, or derive visual variants from references, and the output should be a bitmap asset rather than repo-native code or vector. Do not use when the task is better handled by editing existing SVG/vector/code-native assets, extending an established icon or logo system, or building the visual directly in HTML/CSS/canvas.
- `openai-docs` - Use when the user asks how to build with OpenAI products or APIs and needs up-to-date official documentation with citations, help choosing the latest model for a use case, or model upgrade and prompt-upgrade guidance; prioritize OpenAI docs MCP tools, use bundled references only as helper context, and restrict any fallback browsing to official OpenAI domains.
- `plugin-creator` - Create and scaffold plugin directories for Codex with a required `.codex-plugin/plugin.json`, optional plugin folders/files, valid manifest defaults, and personal-marketplace entries by default. Use when Codex needs to create a new personal plugin, add optional plugin structure, or generate or update marketplace entries for plugin ordering and availability metadata.
- `skill-creator` - Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations.
- `skill-installer` - Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos).
- `authoring-architecture-overview` - Use when the user asks for a single-page HTML architecture overview or system diagram of a codebase — phrases like "architecture_overview.html", "画个系统总览图", "给这个项目做个架构图", "make an architecture diagram", or "overview HTML". Triggers on requests for a standalone browser-openable diagram (no Mermaid server, no build step).
- `design-taste-frontend` - Senior UI/UX Engineer. Architect digital interfaces overriding default LLM biases. Enforces metric-based rules, strict component architecture, CSS hardware acceleration, and balanced design engineering.
- `discord-js` - Build, debug, and refactor Discord bots and integrations with discord.js and official discord.js.org docs. Use when tasks involve slash commands, events, interactions (buttons, select menus, modals), embeds, permissions or intents, gateway/client lifecycle, message utilities, REST command registration, or Discord bot version migration in Node.js/TypeScript projects.
- `dual-repo-cli-release` - Use when building a Python CLI that ships as standalone binaries (no Python required on user machines), needs curl|sh install and self-update, and wants to keep source code private while publishing binaries publicly
- `full-output-enforcement` - Overrides default LLM truncation behavior. Enforces complete code generation, bans placeholder patterns, and handles token-limit splits cleanly. Apply to any task requiring exhaustive, unabridged output.
- `google-aip-api-design` - Design, review, and refactor backend APIs to follow Google API Improvement Proposals (google.aip.dev). Use when creating or updating REST, gRPC, protobuf, or OpenAPI APIs; modeling resources and resource names; choosing standard CRUD versus custom methods; defining pagination, filtering, field masks, etags, request IDs, and error semantics; or checking whether an API contract conforms to Google AIP.
- `i-animate` - Review a feature and enhance it with purposeful animations, micro-interactions, and motion effects that improve usability and delight.
- `i-audit` - Perform comprehensive audit of interface quality across accessibility, performance, theming, and responsive design. Generates detailed report of issues with severity ratings and recommendations.
- `i-bolder` - Amplify safe or boring designs to make them more visually interesting and stimulating. Increases impact while maintaining usability.
- `i-clarify` - Improve unclear UX copy, error messages, microcopy, labels, and instructions. Makes interfaces easier to understand and use.
- `i-colorize` - Add strategic color to features that are too monochromatic or lack visual interest. Makes interfaces more engaging and expressive.
- `i-critique` - Evaluate design effectiveness from a UX perspective. Assesses visual hierarchy, information architecture, emotional resonance, and overall design quality with actionable feedback.
- `i-delight` - Add moments of joy, personality, and unexpected touches that make interfaces memorable and enjoyable to use. Elevates functional to delightful.
- `i-distill` - Strip designs to their essence by removing unnecessary complexity. Great design is simple, powerful, and clean.
- `i-extract` - Extract and consolidate reusable components, design tokens, and patterns into your design system. Identifies opportunities for systematic reuse and enriches your component library.
- `i-frontend-design` - Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications. Generates creative, polished code that avoids generic AI aesthetics.
- `i-harden` - Improve interface resilience through better error handling, i18n support, text overflow handling, and edge case management. Makes interfaces robust and production-ready.
- `i-normalize` - Normalize design to match your design system and ensure consistency
- `i-onboard` - Design or improve onboarding flows, empty states, and first-time user experiences. Helps users get started successfully and understand value quickly.
- `i-optimize` - Improve interface performance across loading speed, rendering, animations, images, and bundle size. Makes experiences faster and smoother.
- `i-polish` - Final quality pass before shipping. Fixes alignment, spacing, consistency, and detail issues that separate good from great.
- `i-quieter` - Tone down overly bold or visually aggressive designs. Reduces intensity while maintaining design quality and impact.
- `i-teach-impeccable` - One-time setup that gathers design context for your project and saves it to your AI config file. Run once to establish persistent design guidelines.
- `pdf` - Use when tasks involve reading, creating, or reviewing PDF files where rendering and layout matter; prefer visual checks by rendering pages (Poppler) and use Python tools such as `reportlab`, `pdfplumber`, and `pypdf` for generation and extraction.
- `redesign-existing-projects` - Upgrades existing websites and apps to premium quality. Audits current design, identifies generic AI patterns, and applies high-end design standards without breaking functionality. Works with any CSS framework or vanilla CSS.
- `ticket-reply-wording` - Use when polishing a support ticket reply from a raw solution or conclusion into Riino's writing style. Triggers when user asks to draft, polish, or reword a ticket response.
- `use-json-render-cli` - Render structured JSON UI specs to PNG images with json-render-cli. Use when users ask to generate visual outputs such as compact tables, ticket status tables, KPI/info cards, announcement cards, or flow/timeline summaries, and route to the matching use-case reference under references/.
- `use-zendesk-cli` - Operate the Zendesk CLI to browse tickets, manage assignments and statuses, search Help Center articles, render ticket images, and download attachments. Use when the user asks to check Zendesk tickets, look up help center docs, download attachments, assign tickets, change ticket status, render ticket snapshots, or configure CLI settings via the command line.
- `vercel-deploy` - Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push this live", or "create a preview deployment".
- `vercel-react-best-practices` - React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
- `web-design-guidelines` - Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
