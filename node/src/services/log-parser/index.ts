/**
 * Squad Log Parser Service
 *
 * Main entry point for log parsing functionality
 */

export * from './types.js';
export * from './parser.js';
export * from './watcher.js';
export * from './session-manager.js';

import { LogWatcher } from './watcher.js';
import { SessionManager } from './session-manager.js';
import { config } from '../../config/env.js';

/**
 * Initialize and start the log parser service
 */
export async function startLogParserService() {
  console.log('🚀 Starting Squad Log Parser Service...');

  // Create session manager
  const sessionManager = new SessionManager(config.node.id);

  // Create log watcher
  const watcher = new LogWatcher({
    filePath: config.node.logFilePath,
    pollInterval: 1000, // Check every second
  });

  // Register event handler
  watcher.onEvent(async (event) => {
    try {
      await sessionManager.handleEvent(event);
    } catch (error) {
      console.error('Error processing log event:', error);
    }
  });

  // Start watching
  await watcher.start();

  // Log initial stats
  const stats = await sessionManager.getStats();
  console.log('📊 Session Statistics:');
  console.log(`   Total sessions: ${stats.totalSessions}`);
  console.log(`   Active sessions: ${stats.activeSessions}`);
  console.log(`   Unique players: ${stats.uniquePlayers}`);

  // Graceful shutdown handler
  const shutdown = async () => {
    console.log('\n🛑 Shutting down log parser...');
    watcher.stop();
    await sessionManager.closeAllOpenSessions();
    console.log('✅ Log parser shutdown complete');
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return {
    watcher,
    sessionManager,
    shutdown,
  };
}
