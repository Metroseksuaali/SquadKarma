import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { isValidSteam64 } from '../../utils/steam.js';

/**
 * Request parameters schema
 */
const reputationParamsSchema = z.object({
  steam64: z.string().refine(isValidSteam64, 'Invalid Steam64 ID'),
});

/**
 * Register reputation routes
 */
export async function registerReputationRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/reputation/:steam64
   * Get aggregated reputation for a player
   */
  fastify.get<{
    Params: { steam64: string };
  }>(
    '/api/reputation/:steam64',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      try {
        // Validate parameters
        const params = reputationParamsSchema.parse(request.params);

        // Get all votes for this player
        const votes = await prisma.vote.findMany({
          where: {
            targetSteam64: params.steam64,
          },
          include: {
            voterSession: true,
            targetSession: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (votes.length === 0) {
          return {
            steam64: params.steam64,
            totalVotes: 0,
            upvotes: 0,
            downvotes: 0,
            netReputation: 0,
            categories: {},
            recentVotes: [],
          };
        }

        // Aggregate votes by direction
        const upvotes = votes.filter((v) => v.direction === 'UP').length;
        const downvotes = votes.filter((v) => v.direction === 'DOWN').length;
        const netReputation = upvotes - downvotes;

        // Aggregate votes by category
        const categories: Record<string, { up: number; down: number }> = {};
        for (const vote of votes) {
          if (!categories[vote.reasonCategory]) {
            categories[vote.reasonCategory] = { up: 0, down: 0 };
          }
          const category = categories[vote.reasonCategory];
          if (category) {
            if (vote.direction === 'UP') {
              category.up++;
            } else {
              category.down++;
            }
          }
        }

        // Get recent votes (last 10)
        const recentVotes = votes.slice(0, 10).map((vote) => ({
          direction: vote.direction,
          reasonCategory: vote.reasonCategory,
          createdAt: vote.createdAt.toISOString(),
          replicatedFrom: vote.replicatedFrom,
        }));

        return {
          steam64: params.steam64,
          totalVotes: votes.length,
          upvotes,
          downvotes,
          netReputation,
          categories,
          recentVotes,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({
            error: 'Bad Request',
            message: error.errors[0]?.message || 'Invalid request parameters',
          });
          return;
        }

        request.log.error(error, 'Failed to get reputation');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to retrieve reputation',
        });
      }
    }
  );
}
