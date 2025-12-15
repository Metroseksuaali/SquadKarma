// src/modules/votes/votes.service.ts
// Vote business logic

import { prisma } from '../../db/client.js';
import { 
  checkCooldown, 
  setCooldown, 
  checkRateLimit,
} from '../../db/redis.js';
import { 
  ValidationError, 
  NotFoundError, 
  ForbiddenError,
  CooldownError, 
  RateLimitError,
} from '../../utils/errors.js';
import { isValidSteam64 } from '../../utils/steam.js';
import type { 
  VoteFormData, 
  VoteResponse, 
  CooldownResponse,
  ReasonCategoryResponse,
} from './votes.types.js';

/**
 * Create a new vote
 */
export async function createVote(
  voterSteam64: string,
  data: VoteFormData
): Promise<VoteResponse> {
  const { targetSteam64, serverId, direction, reasonCategoryId } = data;

  // 1. Validate target Steam64 format
  if (!isValidSteam64(targetSteam64)) {
    throw new ValidationError('Invalid target Steam64 ID format');
  }

  // 2. User cannot vote for themselves
  if (voterSteam64 === targetSteam64) {
    throw new ForbiddenError('You cannot vote for yourself');
  }

  // 3. Check rate limit
  const rateLimit = await checkRateLimit(voterSteam64);
  if (!rateLimit.allowed) {
    throw new RateLimitError();
  }

  // 4. Check cooldown for this specific voter-target pair
  const cooldownSeconds = await checkCooldown(voterSteam64, targetSteam64);
  if (cooldownSeconds !== null) {
    throw new CooldownError(cooldownSeconds);
  }

  // 5. Verify server exists and is active
  const server = await prisma.server.findUnique({
    where: { id: serverId },
  });
  if (!server) {
    throw new NotFoundError('Server');
  }
  if (!server.isActive) {
    throw new ValidationError('Server is not active');
  }


  // 6. Verify reason category exists and is active
  const reasonCategory = await prisma.reasonCategory.findUnique({
    where: { id: reasonCategoryId },
  });
  if (!reasonCategory) {
    throw new NotFoundError('Reason category');
  }
  if (!reasonCategory.isActive) {
    throw new ValidationError('Reason category is not active');
  }

  // 7. Create or update Player record for target (upsert by steam64)
  await prisma.player.upsert({
    where: { steam64: targetSteam64 },
    update: { 
      lastSeenAt: new Date(),
    },
    create: {
      steam64: targetSteam64,
      lastKnownName: `Player ${targetSteam64.slice(-4)}`, // Default name
    },
  });

  // 8. Create Vote record
  const vote = await prisma.vote.create({
    data: {
      voterSteam64,
      targetSteam64,
      serverId,
      reasonCategoryId,
      direction,
    },
  });

  // 9. Set cooldown (1 hour by default)
  await setCooldown(voterSteam64, targetSteam64, 3600);

  return {
    id: vote.id,
    voterSteam64: vote.voterSteam64,
    targetSteam64: vote.targetSteam64,
    serverId: vote.serverId,
    direction: vote.direction,
    reasonCategoryId: vote.reasonCategoryId,
    createdAt: vote.createdAt.toISOString(),
  };
}

/**
 * Check cooldown status for voting on a specific target
 */
export async function getVoteCooldown(
  voterSteam64: string,
  targetSteam64: string
): Promise<CooldownResponse> {
  if (!isValidSteam64(targetSteam64)) {
    throw new ValidationError('Invalid target Steam64 ID format');
  }

  const cooldownSeconds = await checkCooldown(voterSteam64, targetSteam64);
  
  return {
    canVote: cooldownSeconds === null,
    secondsRemaining: cooldownSeconds || 0,
  };
}

/**
 * Get all active reason categories
 */
export async function getReasonCategories(): Promise<ReasonCategoryResponse[]> {
  const categories = await prisma.reasonCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  return categories.map(category => ({
    id: category.id,
    name: category.name,
    type: category.type,
  }));
}
