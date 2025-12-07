// src/db/redis.ts
// Redis client for sessions and rate limiting

import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis error');
});

// Helper functions for vote cooldown
export async function checkCooldown(
  voterSteam64: string, 
  targetSteam64: string
): Promise<number | null> {
  const key = `cooldown:${voterSteam64}:${targetSteam64}`;
  const ttl = await redis.ttl(key);
  return ttl > 0 ? ttl : null;
}

export async function setCooldown(
  voterSteam64: string, 
  targetSteam64: string, 
  seconds: number = 3600
): Promise<void> {
  const key = `cooldown:${voterSteam64}:${targetSteam64}`;
  await redis.set(key, '1', 'EX', seconds);
}
