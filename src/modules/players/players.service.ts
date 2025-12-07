// src/modules/players/players.service.ts
// Player business logic

import { prisma } from '../../db/client.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import { isValidSteam64 } from '../../utils/steam.js';
import type { Player, Vote, ReasonCategory } from '@prisma/client';
import type { 
  PlayerResponse, 
  ReputationResponse, 
  TopCategory,
  RecentTrend,
} from './players.types.js';

// Type for vote with included reason category
type VoteWithCategory = Vote & {
  reasonCategory: ReasonCategory;
};

/**
 * Get a player by Steam64 ID
 */
export async function getPlayerBySteam64(steam64: string): Promise<PlayerResponse> {
  if (!isValidSteam64(steam64)) {
    throw new ValidationError('Invalid Steam64 ID format');
  }

  const player = await prisma.player.findUnique({
    where: { steam64 },
  });

  if (!player) {
    throw new NotFoundError('Player');
  }

  return {
    steam64: player.steam64,
    lastKnownName: player.lastKnownName,
    firstSeenAt: player.firstSeenAt.toISOString(),
    lastSeenAt: player.lastSeenAt.toISOString(),
  };
}

/**
 * Search players by name
 */
export async function searchPlayers(query: string): Promise<PlayerResponse[]> {
  if (!query || query.trim().length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  const players = await prisma.player.findMany({
    where: {
      lastKnownName: {
        contains: query.trim(),
        mode: 'insensitive',
      },
    },
    orderBy: { lastSeenAt: 'desc' },
    take: 50,
  });

  return players.map((player: Player) => ({
    steam64: player.steam64,
    lastKnownName: player.lastKnownName,
    firstSeenAt: player.firstSeenAt.toISOString(),
    lastSeenAt: player.lastSeenAt.toISOString(),
  }));
}


/**
 * Get player reputation summary
 */
export async function getPlayerReputation(steam64: string): Promise<ReputationResponse> {
  if (!isValidSteam64(steam64)) {
    throw new ValidationError('Invalid Steam64 ID format');
  }

  const player = await prisma.player.findUnique({
    where: { steam64 },
  });

  if (!player) {
    throw new NotFoundError('Player');
  }

  // Get all votes for this player
  const votes = await prisma.vote.findMany({
    where: { targetSteam64: steam64 },
    include: {
      reasonCategory: true,
    },
  });

  // Calculate summary
  const totalUp = votes.filter((v: VoteWithCategory) => v.direction === 'UP').length;
  const totalDown = votes.filter((v: VoteWithCategory) => v.direction === 'DOWN').length;
  const totalVotes = votes.length;
  const ratio = totalVotes > 0 ? totalUp / totalVotes : 0.5;

  // Calculate top categories
  const categoryCount = new Map<string, { count: number; type: string }>();
  votes.forEach((vote: VoteWithCategory) => {
    const name = vote.reasonCategory.name;
    const type = vote.reasonCategory.type;
    const existing = categoryCount.get(name) || { count: 0, type };
    categoryCount.set(name, { count: existing.count + 1, type });
  });

  const topCategories: TopCategory[] = Array.from(categoryCount.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      count: data.count,
      type: data.type as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
    }));

  // Calculate recent trend (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentVotes = votes.filter(v => v.createdAt >= sevenDaysAgo);
  const recentTrend: RecentTrend = {
    period: '7 days',
    up: recentVotes.filter(v => v.direction === 'UP').length,
    down: recentVotes.filter(v => v.direction === 'DOWN').length,
  };

  return {
    steam64: player.steam64,
    displayName: player.lastKnownName,
    summary: {
      totalUp,
      totalDown,
      ratio,
      totalVotes,
    },
    topCategories,
    recentTrend,
  };
}
