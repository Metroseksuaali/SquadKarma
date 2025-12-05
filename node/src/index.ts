/**
 * Squad Karma - Distributed POC Node
 *
 * Main entry point for the Squad Karma node service.
 * This service runs on each Squad server to track player sessions
 * and manage reputation votes with proof of presence.
 */

import { config } from './config/env.js';
import { disconnectDatabase, checkDatabaseConnection } from './db/client.js';
import { startLogParserService } from './services/log-parser/index.js';
import { startApiServer } from './api/server.js';

/**
 * Main application startup
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Squad Karma - Distributed POC Node');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Node ID: ${config.node.id}`);
  console.log(`  Node Name: ${config.node.name}`);
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

    // 2. Start API server (Hybrid Architecture)
    await startApiServer();

    // 3. Start log parser service (Phase 1)
    await startLogParserService();

    // 4. Start Discord bot (Phase 2 - DEPRECATED in hybrid architecture)
    // Discord bot is now centralized in bot/ directory
    // await startDiscordBot();

    console.log('\n✅ All services started successfully');
    console.log('📊 Node is now running...\n');

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

// Start the application
main();
