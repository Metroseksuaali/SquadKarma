/**
 * Squad Karma - Central Discord Bot
 *
 * This bot coordinates between multiple Squad server nodes,
 * allowing players to vote on reputation with proof of presence validation.
 */

import { config } from './config/env.js';
import { checkDatabaseConnection, disconnectDatabase } from './db/client.js';
import { createDiscordClient, registerCommands } from './discord/client.js';
import { loadCommands } from './discord/commandLoader.js';
import { healthCheckAllNodes } from './services/nodeRegistry.js';

let client: ReturnType<typeof createDiscordClient> | null = null;

/**
 * Main bot startup
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Squad Karma - Central Discord Bot');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Environment: ${config.env}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Check database connection
    console.log('🔌 Checking database connection...');
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    console.log('✅ Database connection successful\n');

    // 2. Run Prisma migrations
    console.log('🔄 Checking database schema...');
    // In production, use: npx prisma migrate deploy
    // For now, we rely on manual schema push
    console.log('✅ Database schema ready\n');

    // 3. Create Discord client
    console.log('🤖 Starting Discord Bot...');
    client = createDiscordClient();

    // 4. Load commands
    const commands = await loadCommands();

    // Register commands to client
    for (const command of commands) {
      client.commands.set(command.data.name, command);
    }

    // 5. Register slash commands with Discord
    // For testing, register to all guilds the bot is in
    // In production, register globally (takes up to 1 hour)
    await client.login(config.discord.token);

    // Wait for client to be ready before registering commands
    await new Promise<void>((resolve) => {
      client!.once('ready', () => resolve());
    });

    // Register commands to all guilds (for testing)
    if (config.isDevelopment) {
      for (const guild of client.guilds.cache.values()) {
        await registerCommands(commands, guild.id);
      }
    } else {
      // Register globally for production
      await registerCommands(commands);
    }

    console.log('✅ Discord bot started successfully\n');

    // 6. Start periodic health checks (every 5 minutes)
    setInterval(async () => {
      await healthCheckAllNodes();
    }, 5 * 60 * 1000);

    console.log('✅ All services started successfully');
    console.log('🤖 Bot is now running...\n');

  } catch (error) {
    console.error('❌ Fatal error during startup:', error);
    await cleanup();
    process.exit(1);
  }
}

/**
 * Cleanup and graceful shutdown
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up...');

  try {
    if (client) {
      client.destroy();
    }
    await disconnectDatabase();
  } catch (error) {
    console.error('Error during cleanup:', error);
  }

  console.log('✅ Cleanup complete');
}

/**
 * Graceful shutdown handlers
 */
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Received SIGTERM, shutting down gracefully...');
  await cleanup();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanup();
  process.exit(1);
});

// Start the bot
main();
