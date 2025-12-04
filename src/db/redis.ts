// src/db/redis.ts
// Redis client for sessions and rate limiting

import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
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

// Rate limiting helper
export async function checkRateLimit(
  steam64: string, 
  maxVotes: number = 10, 
  windowSeconds: number = 600
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${steam64}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return {
    allowed: current <= maxVotes,
    remaining: Math.max(0, maxVotes - current),
  };
}
