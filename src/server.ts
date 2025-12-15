// src/server.ts
// Application entry point
// Updated to follow Context7 documentation

import 'dotenv/config';
import { buildApp } from './app.js';
import { prisma } from './db/client.js';
import { redis } from './db/redis.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  logger.info('Starting Squad Karma API...');

  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connected');

    // Build and start Fastify
    const app = await buildApp();
    
    await app.listen({ port: PORT, host: HOST });
    logger.info({ port: PORT, host: HOST }, 'Server running');

  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  
  await prisma.$disconnect();
  redis.disconnect();
  
  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
