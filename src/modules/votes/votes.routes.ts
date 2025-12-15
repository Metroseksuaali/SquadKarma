// src/modules/votes/votes.routes.ts
// Vote API routes

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  createVote, 
  getVoteCooldown,
  getReasonCategories,
} from './votes.service.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.guard.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { VoteFormData } from './votes.types.js';

// Request types
interface CooldownParams {
  targetSteam64: string;
}

// Vote schema for validation
const voteSchema = {
  body: {
    type: 'object',
    required: ['targetSteam64', 'serverId', 'direction', 'reasonCategoryId'],
    properties: {
      targetSteam64: { type: 'string', minLength: 17, maxLength: 17 },
      serverId: { type: 'string' },
      direction: { type: 'string', enum: ['UP', 'DOWN'] },
      reasonCategoryId: { type: 'integer' },
    },
  },
};

export async function voteRoutes(app: FastifyInstance) {
  /**
   * POST /api/votes
   * Submit a new vote (requires authentication)
   */
  app.post<{ Body: VoteFormData }>(
    '/',
    {
      schema: voteSchema,
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedError();
      }

      const vote = await createVote(request.user.steam64, request.body);
      return reply.status(201).send(vote);
    }
  );


  /**
   * GET /api/votes/cooldown/:targetSteam64
   * Check vote cooldown status (requires authentication)
   */
  app.get<{ Params: CooldownParams }>(
    '/cooldown/:targetSteam64',
    {
      schema: {
        params: {
          type: 'object',
          required: ['targetSteam64'],
          properties: {
            targetSteam64: { type: 'string', minLength: 17, maxLength: 17 },
          },
        },
      },
      preHandler: requireAuth,
    },
    async (request, reply) => {
      if (!request.user) {
        throw new UnauthorizedError();
      }

      const cooldown = await getVoteCooldown(
        request.user.steam64,
        request.params.targetSteam64
      );
      return reply.send(cooldown);
    }
  );
}

/**
 * Reason categories routes - separate plugin for /api/reason-categories
 */
export async function reasonCategoryRoutes(app: FastifyInstance) {
  // Add optional auth
  app.addHook('preHandler', optionalAuth);

  /**
   * GET /api/reason-categories
   * List all active reason categories
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const categories = await getReasonCategories();
    return reply.send(categories);
  });
}
