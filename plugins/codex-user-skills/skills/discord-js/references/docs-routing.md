# Discord.js Docs Routing

Use this file to find the correct official documentation page fast.

## Primary Sources

- discord.js docs: https://discord.js.org/docs/packages/discord.js/main
- discord.js guide: https://discordjs.guide
- Discord platform docs (API constraints, permissions, interactions): https://discord.com/developers/docs

## Routing Steps

1. Read `package.json` and confirm installed `discord.js` major version.
2. Start from the class or builder name required by the task.
3. Open the official class page and verify constructor options, method signatures, and return types.
4. If behavior depends on Discord platform constraints (interaction timing, permission bits, command limits), confirm in Discord Developer docs.
5. Apply only APIs available in the project's installed version.

## High-Frequency Pages

- Client class: https://discord.js.org/docs/packages/discord.js/main/Client:Class
- Events enum: https://discord.js.org/docs/packages/discord.js/main/Events:Enum
- Gateway intents: https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:Enum
- Slash command builder: https://discord.js.org/docs/packages/builders/main/SlashCommandBuilder:Class
- REST class: https://discord.js.org/docs/packages/rest/main/REST:Class
- Routes helpers: https://discord.js.org/docs/packages/discord.js/main/Routes:Variable
- Interaction base class: https://discord.js.org/docs/packages/discord.js/main/BaseInteraction:Class
- Embed builder: https://discord.js.org/docs/packages/builders/main/EmbedBuilder:Class

## Version Safety Rules

- Do not copy snippets that target a different major version.
- Prefer docs pages over third-party blog posts when signatures conflict.
- Keep imports consistent with the package actually used by the project.
