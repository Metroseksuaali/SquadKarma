// src/modules/servers/servers.routes.ts
// Server API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getServers, getServerById, getServerPlayers } from './servers.service.js';
import { optionalAuth } from '../../middleware/auth.guard.js';

// Request type for server ID parameter
interface ServerParams {
  id: string;
}

export async function serverRoutes(app: FastifyInstance) {
  // Add optional auth to all routes
  app.addHook('preHandler', optionalAuth);

  /**
   * GET /api/servers
   * List all active servers
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const servers = await getServers();
    return reply.send(servers);
  });

  /**
   * GET /api/servers/:id
   * Get a single server by ID
   */
  app.get<{ Params: ServerParams }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const server = await getServerById(id);
      return reply.send(server);
    }
  );

  /**
   * GET /api/servers/:id/players
   * Get players associated with a server
   */
  app.get<{ Params: ServerParams }>(
    '/:id/players',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const players = await getServerPlayers(id);
      return reply.send(players);
    }
  );
}
