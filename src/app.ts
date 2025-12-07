// src/app.ts
// Fastify application setup

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import RedisStore from 'fastify-session-redis-store';
import { AppError } from './utils/errors.js';
import { redis } from './db/redis.js';
import { logger } from './utils/logger.js';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/index.js';
import { serverRoutes } from './modules/servers/index.js';
import { playerRoutes } from './modules/players/index.js';
import { voteRoutes, reasonCategoryRoutes } from './modules/votes/index.js';

export async function buildApp() {
  const app = Fastify({
    logger: logger,
  });

  // CORS
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  // Cookies (required for sessions)
  await app.register(cookie);

  // Create Redis session store using official package
  const redisStore = new RedisStore({
    client: redis,
    prefix: 'squadkarma:sess:',
    ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  });

  // Session with Redis store
  await app.register(session, {
    secret: env.SESSION_SECRET,
    store: redisStore,
    cookie: {
      secure: env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
      sameSite: 'lax',
    },
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API info
  app.get('/', async () => {
    return {
      name: 'Squad Karma API',
      version: '0.1.0',
      docs: '/docs',
    };
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.code,
        message: error.message,
        ...(error instanceof Object && 'secondsRemaining' in error
          ? { secondsRemaining: (error as any).secondsRemaining }
          : {}),
      });
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.validation,
      });
    }

    // Unknown errors
    return reply.status(500).send({
      error: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
    });
  });

  // Register route modules
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(serverRoutes, { prefix: '/api/servers' });
  await app.register(playerRoutes, { prefix: '/api/players' });
  await app.register(voteRoutes, { prefix: '/api/votes' });
  await app.register(reasonCategoryRoutes, { prefix: '/api/reason-categories' });

  return app;
}
