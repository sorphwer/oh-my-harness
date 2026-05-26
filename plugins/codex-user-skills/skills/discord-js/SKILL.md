---
name: discord-js
description: Build, debug, and refactor Discord bots and integrations with discord.js and official discord.js.org docs. Use when tasks involve slash commands, events, interactions (buttons, select menus, modals), embeds, permissions or intents, gateway/client lifecycle, message utilities, REST command registration, or Discord bot version migration in Node.js/TypeScript projects.
---

# Discord.js Workflow

## Quick Start

1. Detect installed runtime and package versions from `package.json` and lock to that major version.
2. Resolve API details from official docs before writing code.
3. Implement the smallest viable change with typed builders and explicit error handling.
4. Verify with lint/tests and a smoke interaction flow.

## Route The Task

- Bootstrapping bot/client login: `Client`, `GatewayIntentBits`, `Partials`, `Events.ClientReady`.
- Slash command definitions and deploy: `SlashCommandBuilder`, `REST`, `Routes.applicationCommands` or guild routes.
- Interaction handling: `ChatInputCommandInteraction`, button/select/menu/modal interactions.
- Components and UI: `ActionRowBuilder`, `ButtonBuilder`, `StringSelectMenuBuilder`, `ModalBuilder`, `TextInputBuilder`, `EmbedBuilder`.
- Messages/channels/members/roles: `Message`, `TextChannel`, `GuildMember`, `Role` APIs.
- Collectors and stateful flows: `createMessageComponentCollector`, `awaitModalSubmit`.
- Permission/intents failures: verify `GatewayIntentBits`, privileged intents, and channel/role permissions.
- REST edge cases and rate limits: inspect registration/update paths and API error handling.

## Docs-First Rules

1. Resolve class and method signatures from official discord.js docs before coding.
2. Match examples to the installed major version. Do not mix legacy v13 usage with v14 code.
3. Prefer builders and exported enums/constants over magic strings.
4. Reply to interactions quickly with `reply`/`deferReply`/`deferUpdate`, then use `editReply` or `followUp`.
5. Guard for uncached entities, partials, and nullable fields in handlers.

## Core Patterns

### Minimal Client Setup

```ts
import { Client, Events, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready as ${readyClient.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
```

### Slash Command Guard

```ts
if (!interaction.isChatInputCommand()) return;
if (interaction.commandName === "ping") {
  await interaction.reply({ content: "Pong!" });
}
```

### Safe Long-Running Interaction

```ts
await interaction.deferReply({ ephemeral: true });
const result = await doWork();
await interaction.editReply(`Done: ${result}`);
```

## Common Pitfalls Checklist

- Missing gateway intents for subscribed events.
- Changing slash command code without redeploying commands.
- Calling `reply` more than once instead of using `editReply`/`followUp`.
- Assuming cache objects always exist.
- Ignoring permissions in guild and channel context.
- Not surfacing REST/API errors during deploy or update.

## Change Workflow

1. Inspect existing architecture (single-file bot, command loader, event loader, framework wrapper).
2. Select the narrowest safe integration point; avoid broad rewrites unless requested.
3. Implement typed checks (`isChatInputCommand`, custom type guards) before accessing fields.
4. Add focused logging around interaction lifecycle and REST failures.
5. Run lint/tests and at least one manual smoke flow.
6. Report changed files, verification commands, and any remaining risks.

## References

- Load `references/docs-routing.md` to quickly locate the right official docs page.
- Load `references/recipes.md` for practical command, component, modal, and deploy templates.
