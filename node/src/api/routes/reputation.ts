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
 * Vote submission schema
 */
const voteSubmissionSchema = z.object({
  voterSteam64: z.string().refine(isValidSteam64, 'Invalid voter Steam64 ID'),
  targetSteam64: z.string().refine(isValidSteam64, 'Invalid target Steam64 ID'),
  direction: z.enum(['UP', 'DOWN']),
  reasonCategory: z.string().min(1, 'Reason category is required'),
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

  /**
   * POST /api/vote
   * Submit a vote with proof of presence validation
   */
  fastify.post<{
    Body: {
      voterSteam64: string;
      targetSteam64: string;
      direction: 'UP' | 'DOWN';
      reasonCategory: string;
    };
  }>(
    '/api/vote',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      try {
        // Validate request body
        const body = voteSubmissionSchema.parse(request.body);

        // Prevent self-voting
        if (body.voterSteam64 === body.targetSteam64) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Cannot vote for yourself',
          });
        }

        // Find recent sessions for both players (within last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const voterSessions = await prisma.session.findMany({
          where: {
            steam64: body.voterSteam64,
            joinedAt: {
              gte: twentyFourHoursAgo,
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        });

        const targetSessions = await prisma.session.findMany({
          where: {
            steam64: body.targetSteam64,
            joinedAt: {
              gte: twentyFourHoursAgo,
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        });

        // Check if sessions exist
        if (voterSessions.length === 0) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'No recent session found for voter (must be within last 24 hours)',
          });
        }

        if (targetSessions.length === 0) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'No recent session found for target player (must be within last 24 hours)',
          });
        }

        // Find overlapping sessions with at least 5 minutes overlap
        const MIN_OVERLAP_MS = 5 * 60 * 1000; // 5 minutes
        let voterSession: typeof voterSessions[0] | null = null;
        let targetSession: typeof targetSessions[0] | null = null;
        let maxOverlap = 0;

        for (const vSession of voterSessions) {
          for (const tSession of targetSessions) {
            // Calculate overlap
            const vStart = vSession.joinedAt.getTime();
            const vEnd = vSession.leftAt?.getTime() || Date.now();
            const tStart = tSession.joinedAt.getTime();
            const tEnd = tSession.leftAt?.getTime() || Date.now();

            const overlapStart = Math.max(vStart, tStart);
            const overlapEnd = Math.min(vEnd, tEnd);
            const overlap = overlapEnd - overlapStart;

            if (overlap >= MIN_OVERLAP_MS && overlap > maxOverlap) {
              maxOverlap = overlap;
              voterSession = vSession;
              targetSession = tSession;
            }
          }
        }

        // Verify minimum overlap requirement
        if (!voterSession || !targetSession) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Players must have played together for at least 5 minutes',
            details: {
              minOverlapMinutes: 5,
              voterHasSessions: voterSessions.length > 0,
              targetHasSessions: targetSessions.length > 0,
            },
          });
        }

        // Check if vote already exists for this session pair
        const existingVote = await prisma.vote.findUnique({
          where: {
            voterSessionId_targetSessionId: {
              voterSessionId: voterSession.id,
              targetSessionId: targetSession.id,
            },
          },
        });

        if (existingVote) {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'You have already voted for this player in this session',
            existingVote: {
              direction: existingVote.direction,
              reasonCategory: existingVote.reasonCategory,
              createdAt: existingVote.createdAt.toISOString(),
            },
          });
        }

        // Create the vote
        const vote = await prisma.vote.create({
          data: {
            voterSteam64: body.voterSteam64,
            targetSteam64: body.targetSteam64,
            direction: body.direction,
            reasonCategory: body.reasonCategory,
            voterSessionId: voterSession.id,
            targetSessionId: targetSession.id,
          },
          include: {
            voterSession: true,
            targetSession: true,
          },
        });

        return reply.code(201).send({
          success: true,
          vote: {
            id: vote.id,
            direction: vote.direction,
            reasonCategory: vote.reasonCategory,
            createdAt: vote.createdAt.toISOString(),
          },
          proof: {
            voterSession: {
              joinedAt: vote.voterSession.joinedAt.toISOString(),
              leftAt: vote.voterSession.leftAt?.toISOString() || null,
            },
            targetSession: {
              joinedAt: vote.targetSession.joinedAt.toISOString(),
              leftAt: vote.targetSession.leftAt?.toISOString() || null,
            },
            overlapMinutes: Math.floor(maxOverlap / (60 * 1000)),
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({
            error: 'Bad Request',
            message: error.errors[0]?.message || 'Invalid request parameters',
          });
          return;
        }

        request.log.error(error, 'Failed to submit vote');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to submit vote',
        });
      }
    }
  );
}
