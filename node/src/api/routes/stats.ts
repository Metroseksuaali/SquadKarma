import { FastifyInstance } from 'fastify';
import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';
import { authenticateApiKey } from '../middleware/auth.js';

/**
 * Register stats routes
 */
export async function registerStatsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/stats
   * Get node statistics
   */
  fastify.get(
    '/api/stats',
    { preHandler: authenticateApiKey },
    async (request, reply) => {
      try {
        const [totalSessions, activeSessions, totalVotes, uniquePlayersResult] =
          await Promise.all([
            prisma.session.count({
              where: { serverId: config.node.id },
            }),
            prisma.session.count({
              where: {
                serverId: config.node.id,
                leftAt: null,
              },
            }),
            prisma.vote.count(),
            prisma.session.groupBy({
              by: ['steam64'],
              where: { serverId: config.node.id },
            }),
          ]);

        const uniquePlayers = uniquePlayersResult.length;

        // Calculate uptime
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const uptimeStr = `${hours}h ${minutes}m`;

        return {
          nodeId: config.node.id,
          nodeName: config.node.name,
          totalSessions,
          activeSessions,
          totalVotes,
          uniquePlayers,
          uptime: uptimeStr,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        request.log.error(error, 'Failed to get stats');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to retrieve statistics',
        });
      }
    }
  );
}
