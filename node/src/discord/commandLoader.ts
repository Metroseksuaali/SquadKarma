/**
 * Command Loader
 *
 * Loads Discord slash commands from the commands directory
 * and registers them with Discord API.
 */

import { Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Command, DiscordClientWithCommands } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load all commands from the commands directory
 */
export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();
  const commandsPath = join(__dirname, 'commands');

  try {
    const commandFiles = readdirSync(commandsPath).filter(
      (file) => file.endsWith('.ts') || file.endsWith('.js')
    );

    console.log(`📦 Loading ${commandFiles.length} command file(s)...`);

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = await import(filePath);

      if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command);
        console.log(`   ✅ Loaded: /${command.data.name}`);
      } else {
        console.warn(`   ⚠️  Skipped ${file}: missing data or execute export`);
      }
    }

    return commands;
  } catch (error) {
    console.error('Failed to load commands:', error);
    throw error;
  }
}

/**
 * Register commands with Discord API
 *
 * @param clientId - Discord application client ID
 * @param token - Discord bot token
 * @param guildId - Optional: guild ID for instant testing (guild commands)
 */
export async function registerCommands(
  clientId: string,
  token: string,
  commands: Collection<string, Command>,
  guildId?: string
): Promise<void> {
  const commandData = Array.from(commands.values()).map((cmd) => cmd.data.toJSON());

  const rest = new REST().setToken(token);

  try {
    console.log(`🔄 Registering ${commandData.length} slash command(s)...`);

    if (guildId) {
      // Guild-specific registration (instant, for testing)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandData,
      });
      console.log(`✅ Registered ${commandData.length} command(s) to guild ${guildId}`);
    } else {
      // Global registration (takes ~1 hour to propagate)
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData,
      });
      console.log(`✅ Registered ${commandData.length} command(s) globally`);
      console.log(`   Note: Global commands may take up to 1 hour to appear`);
    }
  } catch (error) {
    console.error('Failed to register commands:', error);
    throw error;
  }
}

/**
 * Attach loaded commands to the Discord client
 */
export function attachCommandsToClient(
  client: DiscordClientWithCommands,
  commands: Collection<string, Command>
): void {
  client.commands = commands;
}
