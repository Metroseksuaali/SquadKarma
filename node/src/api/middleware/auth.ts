import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../config/env.js';

/**
 * API key authentication middleware
 */
export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing Authorization header',
    });
    return;
  }

  // Expected format: "Bearer <api_key>"
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: Bearer <api_key>',
    });
    return;
  }

  // Validate API key
  if (token !== config.api.key) {
    reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
    return;
  }

  // Authentication successful, continue to route handler
}
