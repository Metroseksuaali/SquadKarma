// src/modules/players/players.routes.ts
// Player API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  getPlayerBySteam64, 
  searchPlayers, 
  getPlayerReputation,
} from './players.service.js';
import { optionalAuth } from '../../middleware/auth.guard.js';
import type { PlayerSearchQuery } from './players.types.js';

// Request type for Steam64 parameter
interface PlayerParams {
  steam64: string;
}

export async function playerRoutes(app: FastifyInstance) {
  // Add optional auth to all routes
  app.addHook('preHandler', optionalAuth);

  /**
   * GET /api/players/search
   * Search players by name
   * Note: This route must come BEFORE /:steam64 to avoid conflicts
   */
  app.get<{ Querystring: PlayerSearchQuery }>(
    '/search',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['q'],
          properties: {
            q: { type: 'string', minLength: 2 },
          },
        },
      },
    },
    async (request, reply) => {
      const { q } = request.query;
      const players = await searchPlayers(q);
      return reply.send(players);
    }
  );

  /**
   * GET /api/players/:steam64
   * Get a player by Steam64 ID
   */
  app.get<{ Params: PlayerParams }>(
    '/:steam64',
    {
      schema: {
        params: {
          type: 'object',
          required: ['steam64'],
          properties: {
            steam64: { type: 'string', minLength: 17, maxLength: 17 },
          },
        },
      },
    },
    async (request, reply) => {
      const { steam64 } = request.params;
      const player = await getPlayerBySteam64(steam64);
      return reply.send(player);
    }
  );

  /**
   * GET /api/players/:steam64/reputation
   * Get player reputation summary
   */
  app.get<{ Params: PlayerParams }>(
    '/:steam64/reputation',
    {
      schema: {
        params: {
          type: 'object',
          required: ['steam64'],
          properties: {
            steam64: { type: 'string', minLength: 17, maxLength: 17 },
          },
        },
      },
    },
    async (request, reply) => {
      const { steam64 } = request.params;
      const reputation = await getPlayerReputation(steam64);
      return reply.send(reputation);
    }
  );
}
