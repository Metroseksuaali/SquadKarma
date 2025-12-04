// src/middleware/auth.guard.ts
// Authentication middleware

import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      steam64: string;
      displayName: string;
      isBanned: boolean;
    };
  }
}

/**
 * Requires authenticated user
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.user) {
    throw new UnauthorizedError('You must be logged in');
  }
  
  if (request.user.isBanned) {
    throw new ForbiddenError('Your account has been banned');
  }
}

/**
 * Optional auth - sets user if available but doesn't require it
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // User will be set by session plugin if logged in
  // This middleware just allows the request to continue
}
