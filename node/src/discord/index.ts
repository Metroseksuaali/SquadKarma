/**
 * Discord Bot Service
 *
 * Main entry point for Discord bot initialization and management.
 */

import { createDiscordClient } from './client.js';
import { loadCommands, registerCommands, attachCommandsToClient } from './commandLoader.js';
import { config } from '../config/env.js';
import type { DiscordClientWithCommands } from './types.js';

let discordClient: DiscordClientWithCommands | null = null;

/**
 * Initialize and start the Discord bot
 */
export async function startDiscordBot(): Promise<DiscordClientWithCommands> {
  console.log('🤖 Starting Discord Bot...');

  try {
    // Create client
    const client = createDiscordClient();

    // Load commands
    const commands = await loadCommands();

    // Attach commands to client
    attachCommandsToClient(client, commands);

    // Register commands with Discord API
    await registerCommands(
      config.discord.clientId,
      config.discord.token,
      commands,
      config.discord.guildId // Optional: for instant testing in specific guild
    );

    // Login to Discord
    await client.login(config.discord.token);

    discordClient = client;

    console.log('✅ Discord bot started successfully\n');

    return client;
  } catch (error) {
    console.error('❌ Failed to start Discord bot:', error);
    throw error;
  }
}

/**
 * Stop the Discord bot gracefully
 */
export async function stopDiscordBot(): Promise<void> {
  if (discordClient) {
    console.log('🛑 Stopping Discord bot...');
    discordClient.destroy();
    discordClient = null;
    console.log('✅ Discord bot stopped');
  }
}

/**
 * Get the Discord client instance
 */
export function getDiscordClient(): DiscordClientWithCommands | null {
  return discordClient;
}
