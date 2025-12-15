/**
 * Discord Client Setup
 *
 * Initializes the Discord bot client with proper intents and event handlers.
 */

import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import type { DiscordClientWithCommands } from './types.js';

/**
 * Create and configure Discord client
 */
export function createDiscordClient(): DiscordClientWithCommands {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,         // Required for guild events and slash commands
      GatewayIntentBits.GuildMembers,   // For member info in reputation queries
      GatewayIntentBits.DirectMessages, // For Steam auth DMs (Phase 3)
    ],
  }) as DiscordClientWithCommands;

  // Initialize commands collection
  client.commands = new Collection();

  // Ready event - called once when bot connects
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Discord bot logged in as ${readyClient.user.tag}`);
    console.log(`   Serving ${readyClient.guilds.cache.size} guild(s)`);
    console.log(`   Loaded ${client.commands.size} command(s)`);
  });

  // Interaction event - handles slash commands
  client.on(Events.InteractionCreate, async (interaction) => {
    // Only handle chat input commands (slash commands)
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`❌ No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      console.log(`📝 Executing command: /${interaction.commandName} by ${interaction.user.tag}`);
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Error executing ${interaction.commandName}:`, error);

      const errorMessage = {
        content: 'There was an error while executing this command!',
        ephemeral: true,
      };

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (followUpError) {
        console.error('Failed to send error message:', followUpError);
      }
    }
  });

  // Error handling
  client.on(Events.Error, (error) => {
    console.error('Discord client error:', error);
  });

  client.on(Events.Warn, (warning) => {
    console.warn('Discord client warning:', warning);
  });

  return client;
}
