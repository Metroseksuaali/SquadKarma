// src/server.ts
// Application entry point
// Updated to follow Context7 documentation

import 'dotenv/config';
import { buildApp } from './app.js';
import { prisma } from './db/client.js';
import { redis } from './db/redis.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  console.log('🚀 Starting Squad Karma API...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected');

    // Build and start Fastify
    const app = await buildApp();
    
    await app.listen({ port: PORT, host: HOST });
    console.log(`✅ Server running at http://${HOST}:${PORT}`);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n🛑 Shutting down...');
  
  await prisma.$disconnect();
  redis.disconnect();
  
  console.log('👋 Goodbye!');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
