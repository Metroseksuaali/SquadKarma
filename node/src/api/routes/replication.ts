import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { isValidSteam64 } from '../../utils/steam.js';
import { config } from '../../config/env.js';

/**
 * Vote replication schema
 */
const replicatedVoteSchema = z.object({
  voterSteam64: z.string().refine(isValidSteam64, 'Invalid voter Steam64 ID'),
  targetSteam64: z.string().refine(isValidSteam64, 'Invalid target Steam64 ID'),
  direction: z.enum(['UP', 'DOWN']),
  reasonCategory: z.string().min(1, 'Reason category is required'),
  voterSessionId: z.number().int().positive(),
  targetSessionId: z.number().int().positive(),
  createdAt: z.string().datetime(),
  sourceNodeId: z.string().min(1, 'Source node ID is required'),
});

/**
 * Batch vote replication schema
 */
const batchVoteReplicationSchema = z.object({
  votes: z.array(replicatedVoteSchema).max(100), // Max 100 votes per batch
  sourceNodeId: z.string().min(1, 'Source node ID is required'),
});

/**
 * Register replication routes
 */
export async function registerReplicationRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/replicate/votes
   * Receive votes from other trusted nodes
   */
  fastify.post<{
    Body: {
      votes: Array<{
        voterSteam64: string;
        targetSteam64: string;
        direction: 'UP' | 'DOWN';
        reasonCategory: string;
        voterSessionId: number;
        targetSessionId: number;
        createdAt: string;
        sourceNodeId: string;
      }>;
      sourceNodeId: string;
    };
  }>(
    '/api/replicate/votes',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      try {
        // Validate request body
        const body = batchVoteReplicationSchema.parse(request.body);

        // Verify source node is trusted
        const trustedNode = await prisma.trustedNode.findUnique({
          where: {
            nodeId: body.sourceNodeId,
          },
        });

        if (!trustedNode || !trustedNode.isActive) {
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'Source node is not in trusted nodes list or is inactive',
          });
        }

        // Process each vote
        const results = {
          total: body.votes.length,
          inserted: 0,
          duplicates: 0,
          errors: 0,
        };

        for (const vote of body.votes) {
          try {
            // Check if vote already exists (conflict resolution: first vote wins)
            // We check by voter+target Steam64 and approximate timestamp (within 1 hour)
            const voteTimestamp = new Date(vote.createdAt);
            const oneHourBefore = new Date(voteTimestamp.getTime() - 60 * 60 * 1000);
            const oneHourAfter = new Date(voteTimestamp.getTime() + 60 * 60 * 1000);

            const existingVote = await prisma.vote.findFirst({
              where: {
                voterSteam64: vote.voterSteam64,
                targetSteam64: vote.targetSteam64,
                createdAt: {
                  gte: oneHourBefore,
                  lte: oneHourAfter,
                },
              },
            });

            if (existingVote) {
              // Vote already exists - skip (first vote wins)
              results.duplicates++;
              continue;
            }

            // Get or create session records for the replicated vote
            // Note: We create placeholder sessions since we don't have full session data
            // We look up by steam64 + serverId + timestamp proximity instead of remote ID
            // Reuse the timestamp variables from above

            let voterSession = await prisma.session.findFirst({
              where: {
                steam64: vote.voterSteam64,
                serverId: vote.sourceNodeId,
                joinedAt: {
                  gte: oneHourBefore,
                  lte: oneHourAfter,
                },
              },
            });

            if (!voterSession) {
              // Create placeholder session with new local ID
              voterSession = await prisma.session.create({
                data: {
                  steam64: vote.voterSteam64,
                  playerName: `Player-${vote.voterSteam64.substring(0, 8)}`,
                  serverId: vote.sourceNodeId,
                  joinedAt: new Date(vote.createdAt),
                  leftAt: new Date(vote.createdAt), // Placeholder
                },
              });
            }

            let targetSession = await prisma.session.findFirst({
              where: {
                steam64: vote.targetSteam64,
                serverId: vote.sourceNodeId,
                joinedAt: {
                  gte: oneHourBefore,
                  lte: oneHourAfter,
                },
              },
            });

            if (!targetSession) {
              // Create placeholder session with new local ID
              targetSession = await prisma.session.create({
                data: {
                  steam64: vote.targetSteam64,
                  playerName: `Player-${vote.targetSteam64.substring(0, 8)}`,
                  serverId: vote.sourceNodeId,
                  joinedAt: new Date(vote.createdAt),
                  leftAt: new Date(vote.createdAt), // Placeholder
                },
              });
            }

            // Insert the replicated vote
            await prisma.vote.create({
              data: {
                voterSteam64: vote.voterSteam64,
                targetSteam64: vote.targetSteam64,
                direction: vote.direction,
                reasonCategory: vote.reasonCategory,
                voterSessionId: voterSession.id,
                targetSessionId: targetSession.id,
                replicatedFrom: vote.sourceNodeId,
                createdAt: new Date(vote.createdAt),
              },
            });

            results.inserted++;
          } catch (error) {
            request.log.error({ error, vote }, 'Failed to replicate individual vote');
            results.errors++;
          }
        }

        // Update last seen timestamp for trusted node
        await prisma.trustedNode.update({
          where: { nodeId: body.sourceNodeId },
          data: { lastSeenAt: new Date() },
        });

        return {
          success: true,
          results,
          message: `Processed ${results.total} votes: ${results.inserted} inserted, ${results.duplicates} duplicates, ${results.errors} errors`,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400).send({
            error: 'Bad Request',
            message: error.errors[0]?.message || 'Invalid request parameters',
          });
          return;
        }

        request.log.error(error, 'Failed to process vote replication');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to process vote replication',
        });
      }
    }
  );

  /**
   * GET /api/replicate/health
   * Health check for node-to-node communication
   */
  fastify.get('/api/replicate/health', async (request, reply) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;

      // Get node stats
      const voteCount = await prisma.vote.count();
      const sessionCount = await prisma.session.count();
      const trustedNodeCount = await prisma.trustedNode.count({
        where: { isActive: true },
      });

      return {
        status: 'healthy',
        nodeId: config.node.id || 'unknown',
        timestamp: new Date().toISOString(),
        stats: {
          votes: voteCount,
          sessions: sessionCount,
          trustedNodes: trustedNodeCount,
        },
      };
    } catch (error) {
      request.log.error(error, 'Health check failed');
      return reply.code(503).send({
        status: 'unhealthy',
        error: 'Database connection failed',
      });
    }
  });

  /**
   * GET /api/replicate/votes/since/:timestamp
   * Get votes since a specific timestamp for replication
   */
  fastify.get<{
    Params: { timestamp: string };
  }>(
    '/api/replicate/votes/since/:timestamp',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      try {
        const since = new Date(request.params.timestamp);

        if (isNaN(since.getTime())) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid timestamp format',
          });
        }

        // Get votes created since the timestamp that were NOT replicated
        const votes = await prisma.vote.findMany({
          where: {
            createdAt: {
              gt: since,
            },
            replicatedFrom: null, // Only send original votes, not replicated ones
          },
          include: {
            voterSession: true,
            targetSession: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 100, // Limit to 100 votes per request
        });

        return {
          nodeId: config.node.id || 'unknown',
          votesCount: votes.length,
          votes: votes.map(vote => ({
            voterSteam64: vote.voterSteam64,
            targetSteam64: vote.targetSteam64,
            direction: vote.direction,
            reasonCategory: vote.reasonCategory,
            voterSessionId: vote.voterSessionId,
            targetSessionId: vote.targetSessionId,
            createdAt: vote.createdAt.toISOString(),
            sourceNodeId: config.node.id || 'unknown',
          })),
        };
      } catch (error) {
        request.log.error(error, 'Failed to get votes for replication');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to retrieve votes',
        });
      }
    }
  );
}
