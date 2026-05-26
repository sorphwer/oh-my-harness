# Discord.js Recipes

Use these patterns as starting points, then adapt to the target codebase.

## Register Slash Commands

```ts
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const commands = [
  new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!").toJSON(),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

await rest.put(
  Routes.applicationGuildCommands(process.env.DISCORD_APP_ID!, process.env.DISCORD_GUILD_ID!),
  { body: commands },
);
```

## Handle Chat Input Commands

```ts
import { Events } from "discord.js";

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply({ content: "Pong!", ephemeral: true });
  }
});
```

## Button Interaction + Collector

```ts
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";

const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
  new ButtonBuilder().setCustomId("approve").setLabel("Approve").setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId("reject").setLabel("Reject").setStyle(ButtonStyle.Danger),
);

const message = await channel.send({ content: "Review this request", components: [row] });

const collector = message.createMessageComponentCollector({
  componentType: ComponentType.Button,
  time: 60_000,
});

collector.on("collect", async (i) => {
  if (i.customId === "approve") await i.update({ content: "Approved", components: [] });
  if (i.customId === "reject") await i.update({ content: "Rejected", components: [] });
});
```

## Modal Submit Flow

```ts
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

const modal = new ModalBuilder().setCustomId("redo-modal").setTitle("Redo Feedback");

const feedback = new TextInputBuilder()
  .setCustomId("feedback")
  .setLabel("What should be changed?")
  .setStyle(TextInputStyle.Paragraph)
  .setRequired(true);

modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(feedback));

await interaction.showModal(modal);

const submitted = await interaction.awaitModalSubmit({
  filter: (i) => i.customId === "redo-modal" && i.user.id === interaction.user.id,
  time: 120_000,
});

await submitted.reply({ content: "Feedback recorded", ephemeral: true });
```

## Defensive Error Wrapper For Interactions

```ts
try {
  await handler(interaction);
} catch (error) {
  const payload = { content: "Something went wrong.", ephemeral: true };
  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(payload).catch(() => null);
  } else {
    await interaction.reply(payload).catch(() => null);
  }
}
```
