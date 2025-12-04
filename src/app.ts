// src/app.ts
// Fastify application setup
// Updated to follow Context7 documentation for @fastify/passport

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import { Authenticator } from '@fastify/passport';
import { AppError } from './utils/errors.js';

// Create passport authenticator instance
export const fastifyPassport = new Authenticator();

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // CORS
  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Cookies (required for sessions)
  await app.register(cookie);

  // Session (required for passport)
  await app.register(session, {
    secret: process.env.SESSION_SECRET || 'change-this-secret-min-32-chars!',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  });

  // Initialize passport and session storage
  await app.register(fastifyPassport.initialize());
  await app.register(fastifyPassport.secureSession());

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
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred',
    });
  });

  // TODO: Register route modules here
  // await app.register(authRoutes, { prefix: '/auth' });
  // await app.register(serverRoutes, { prefix: '/api/servers' });
  // await app.register(playerRoutes, { prefix: '/api/players' });
  // await app.register(voteRoutes, { prefix: '/api/votes' });

  return app;
}
