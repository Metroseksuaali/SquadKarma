import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';
import { authenticateApiKey } from '../middleware/auth.js';
import { isValidSteam64 } from '../../utils/steam.js';

/**
 * Request parameters schema
 */
const sessionParamsSchema = z.object({
  steam64: z.string().refine(isValidSteam64, 'Invalid Steam64 ID'),
});

/**
 * Register session routes
 */
export async function registerSessionRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/session/:steam64
   * Get current or most recent session for a player
   */
  fastify.get<{
    Params: { steam64: string };
  }>(
    '/api/session/:steam64',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      try {
        // Validate parameters
        const params = sessionParamsSchema.parse(request.params);

        // Find active session first
        let session = await prisma.session.findFirst({
          where: {
            steam64: params.steam64,
            serverId: config.node.id,
            leftAt: null,
          },
          orderBy: {
            joinedAt: 'desc',
          },
        });

        // If no active session, find most recent completed session
        if (!session) {
          session = await prisma.session.findFirst({
            where: {
              steam64: params.steam64,
              serverId: config.node.id,
              leftAt: { not: null },
            },
            orderBy: {
              leftAt: 'desc',
            },
          });
        }

        if (!session) {
          reply.code(404).send({
            error: 'Not Found',
            message: `No session found for Steam64: ${params.steam64}`,
          });
          return;
        }

        // Calculate session duration
        const endTime = session.leftAt || new Date();
        const durationMs = endTime.getTime() - session.joinedAt.getTime();
        const durationMinutes = Math.floor(durationMs / 60000);

        return {
          session: {
            id: session.id,
            steam64: session.steam64,
            playerName: session.playerName,
            joinedAt: session.joinedAt.toISOString(),
            leftAt: session.leftAt?.toISOString() || null,
            isActive: session.leftAt === null,
            durationMinutes,
            serverId: session.serverId,
          },
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

        request.log.error(error, 'Failed to get session');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to retrieve session',
        });
      }
    }
  );

  /**
   * POST /api/session/validate-overlap
   * Validate if two players had overlapping sessions
   */
  fastify.post<{
    Body: {
      voterSteam64: string;
      targetSteam64: string;
      minOverlapMinutes?: number;
    };
  }>(
    '/api/session/validate-overlap',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      try {
        const { voterSteam64, targetSteam64, minOverlapMinutes = 5 } = request.body;

        // Validate Steam64 IDs
        if (!isValidSteam64(voterSteam64) || !isValidSteam64(targetSteam64)) {
          reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid Steam64 ID format',
          });
          return;
        }

        // Get recent sessions for both players (within last 24 hours)
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [voterSessions, targetSessions] = await Promise.all([
          prisma.session.findMany({
            where: {
              steam64: voterSteam64,
              serverId: config.node.id,
              joinedAt: { gte: twentyFourHoursAgo },
            },
            orderBy: { joinedAt: 'desc' },
          }),
          prisma.session.findMany({
            where: {
              steam64: targetSteam64,
              serverId: config.node.id,
              joinedAt: { gte: twentyFourHoursAgo },
            },
            orderBy: { joinedAt: 'desc' },
          }),
        ]);

        if (voterSessions.length === 0) {
          return {
            valid: false,
            reason: 'Voter has no recent sessions (last 24 hours)',
            overlapMinutes: 0,
          };
        }

        if (targetSessions.length === 0) {
          return {
            valid: false,
            reason: 'Target has no recent sessions (last 24 hours)',
            overlapMinutes: 0,
          };
        }

        // Check for overlapping sessions
        let maxOverlap = 0;
        let overlappingVoterSession = null;
        let overlappingTargetSession = null;

        for (const voterSession of voterSessions) {
          for (const targetSession of targetSessions) {
            const overlap = calculateSessionOverlap(voterSession, targetSession);
            if (overlap > maxOverlap) {
              maxOverlap = overlap;
              overlappingVoterSession = voterSession;
              overlappingTargetSession = targetSession;
            }
          }
        }

        const overlapMinutes = Math.floor(maxOverlap / 60000);
        const valid = overlapMinutes >= minOverlapMinutes;

        return {
          valid,
          reason: valid
            ? `Players overlapped for ${overlapMinutes} minutes`
            : `Insufficient overlap (${overlapMinutes} minutes, required: ${minOverlapMinutes})`,
          overlapMinutes,
          voterSessionId: overlappingVoterSession?.id,
          targetSessionId: overlappingTargetSession?.id,
        };
      } catch (error) {
        request.log.error(error, 'Failed to validate session overlap');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to validate session overlap',
        });
      }
    }
  );
}

/**
 * Calculate overlap between two sessions in milliseconds
 */
function calculateSessionOverlap(
  session1: { joinedAt: Date; leftAt: Date | null },
  session2: { joinedAt: Date; leftAt: Date | null }
): number {
  const start1 = session1.joinedAt.getTime();
  const end1 = (session1.leftAt || new Date()).getTime();
  const start2 = session2.joinedAt.getTime();
  const end2 = (session2.leftAt || new Date()).getTime();

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  return Math.max(0, overlapEnd - overlapStart);
}
