import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import type { SlashCommand } from './types.js';
import { config } from '../config/env.js';

/**
 * Extended Discord client with command collection
 */
export interface DiscordClientWithCommands extends Client {
  commands: Collection<string, SlashCommand>;
}

/**
 * Create and configure Discord client
 */
export function createDiscordClient(): DiscordClientWithCommands {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.DirectMessages,
    ],
  }) as DiscordClientWithCommands;

  client.commands = new Collection();

  // Ready event
  client.on('ready', () => {
    if (!client.user) {
      console.error('❌ Client user is null');
      return;
    }

    console.log(`✅ Discord bot logged in as ${client.user.tag}`);
    console.log(`   Serving ${client.guilds.cache.size} guild(s)`);
    console.log(`   Loaded ${client.commands.size} command(s)`);
  });

  // Interaction handler
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);

      const errorMessage = {
        content: 'There was an error while executing this command!',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  });

  return client;
}

/**
 * Register slash commands with Discord
 */
export async function registerCommands(
  commands: SlashCommand[],
  guildId?: string
): Promise<void> {
  const rest = new REST().setToken(config.discord.token);

  const commandData = commands.map((cmd) => cmd.data.toJSON());

  try {
    console.log(`🔄 Registering ${commands.length} slash command(s)...`);

    if (guildId) {
      // Register to specific guild (faster for testing)
      await rest.put(Routes.applicationGuildCommands(config.discord.clientId, guildId), {
        body: commandData,
      });
      console.log(`✅ Registered ${commands.length} command(s) to guild ${guildId}`);
    } else {
      // Register globally (takes up to 1 hour)
      await rest.put(Routes.applicationCommands(config.discord.clientId), {
        body: commandData,
      });
      console.log(`✅ Registered ${commands.length} command(s) globally`);
    }
  } catch (error) {
    console.error('Failed to register commands:', error);
    throw error;
  }
}
