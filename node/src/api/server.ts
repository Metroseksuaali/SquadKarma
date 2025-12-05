import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from '../config/env.js';
import { registerStatsRoutes } from './routes/stats.js';
import { registerSessionRoutes } from './routes/session.js';
import { registerReputationRoutes } from './routes/reputation.js';
import { registerReplicationRoutes } from './routes/replication.js';

/**
 * Create and configure Fastify server
 */
export async function createServer() {
  const fastify = Fastify({
    logger: {
      level: config.isDevelopment ? 'info' : 'warn',
    },
  });

  // Enable CORS
  await fastify.register(cors, {
    origin: true, // In production, restrict this to trusted origins
  });

  // Health check endpoint (no auth required)
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      nodeId: config.node.id,
      nodeName: config.node.name,
    };
  });

  // Register route modules
  await registerStatsRoutes(fastify);
  await registerSessionRoutes(fastify);
  await registerReputationRoutes(fastify);
  await registerReplicationRoutes(fastify);

  return fastify;
}

/**
 * Start the API server
 */
export async function startApiServer() {
  const server = await createServer();

  try {
    await server.listen({
      port: config.api.port,
      host: config.api.host,
    });

    console.log(`✅ API server started on http://${config.api.host}:${config.api.port}`);
    console.log(`   Node ID: ${config.node.id}`);
    console.log(`   API Key: ${config.api.key.substring(0, 8)}...`);
  } catch (error) {
    console.error('❌ Failed to start API server:', error);
    throw error;
  }

  return server;
}
