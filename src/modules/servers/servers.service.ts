// src/modules/servers/servers.service.ts
// Server business logic

import { prisma } from '../../db/client.js';
import { NotFoundError } from '../../utils/errors.js';
import type { ServerResponse, PlayerOnServer } from './servers.types.js';

/**
 * Get all active servers
 */
export async function getServers(): Promise<ServerResponse[]> {
  const servers = await prisma.server.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return servers.map(server => ({
    id: server.id,
    name: server.name,
    ip: server.ip,
    port: server.port,
    isActive: server.isActive,
  }));
}

/**
 * Get a single server by ID
 */
export async function getServerById(id: string): Promise<ServerResponse> {
  const server = await prisma.server.findUnique({
    where: { id },
  });

  if (!server) {
    throw new NotFoundError('Server');
  }

  return {
    id: server.id,
    name: server.name,
    ip: server.ip,
    port: server.port,
    isActive: server.isActive,
  };
}

/**
 * Get players who have recent votes associated with a server
 * Note: This is a simplified implementation - in production,
 * you would integrate with actual server player lists
 */
export async function getServerPlayers(serverId: string): Promise<PlayerOnServer[]> {
  // Verify server exists
  const server = await prisma.server.findUnique({
    where: { id: serverId },
  });

  if (!server) {
    throw new NotFoundError('Server');
  }

  // Get unique players who have recent votes on this server
  const recentVotes = await prisma.vote.findMany({
    where: {
      serverId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    select: {
      target: {
        select: {
          steam64: true,
          lastKnownName: true,
        },
      },
    },
    distinct: ['targetSteam64'],
    take: 100,
  });

  return recentVotes.map(vote => ({
    steam64: vote.target.steam64,
    lastKnownName: vote.target.lastKnownName,
  }));
}
