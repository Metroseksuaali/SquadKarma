// src/middleware/auth.guard.ts
// Authentication middleware

import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

// Extend FastifyRequest to include user from session
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      steam64: string;
      displayName: string;
      avatarUrl: string | null;
      isBanned: boolean;
    };
  }
}

/**
 * Middleware to set user from session
 * Call this as a preHandler to populate request.user
 */
export async function populateUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.session?.user) {
    request.user = request.session.user;
  }
}

/**
 * Requires authenticated user
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // First populate user from session
  if (request.session?.user) {
    request.user = request.session.user;
  }
  
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
  // Populate user from session if available
  if (request.session?.user) {
    request.user = request.session.user;
  }
}
