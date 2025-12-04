// src/db/session-store.ts
// Redis-based session store for @fastify/session
// Compatible with express-session store interface

import { redis } from './redis.js';

interface SessionData {
  [key: string]: unknown;
}

interface StoreCallback {
  (err?: Error | null, session?: SessionData | null): void;
}

/**
 * Redis Session Store
 * Implements the session store interface expected by @fastify/session
 */
export class RedisSessionStore {
  private prefix: string;
  private ttl: number;

  /**
   * @param prefix - Key prefix for session keys in Redis (default: 'sess:')
   * @param ttl - Session TTL in seconds (default: 7 days)
   */
  constructor(options: { prefix?: string; ttl?: number } = {}) {
    this.prefix = options.prefix || 'sess:';
    this.ttl = options.ttl || 60 * 60 * 24 * 7; // 7 days default
  }

  /**
   * Get session key with prefix
   */
  private getKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  /**
   * Get session data by session ID
   */
  async get(sessionId: string, callback: StoreCallback): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      const data = await redis.get(key);
      
      if (!data) {
        return callback(null, null);
      }
      
      const session = JSON.parse(data) as SessionData;
      callback(null, session);
    } catch (err) {
      callback(err as Error);
    }
  }

  /**
   * Set session data
   */
  async set(
    sessionId: string, 
    session: SessionData, 
    callback: StoreCallback
  ): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      const data = JSON.stringify(session);
      
      await redis.set(key, data, 'EX', this.ttl);
      callback(null);
    } catch (err) {
      callback(err as Error);
    }
  }

  /**
   * Destroy/delete a session
   */
  async destroy(sessionId: string, callback: StoreCallback): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      await redis.del(key);
      callback(null);
    } catch (err) {
      callback(err as Error);
    }
  }

  /**
   * Touch/refresh session TTL
   * Called to keep session alive
   */
  async touch(
    sessionId: string, 
    session: SessionData, 
    callback: StoreCallback
  ): Promise<void> {
    try {
      const key = this.getKey(sessionId);
      await redis.expire(key, this.ttl);
      callback(null);
    } catch (err) {
      callback(err as Error);
    }
  }
}

/**
 * Create a new Redis session store instance
 */
export function createSessionStore(options?: { prefix?: string; ttl?: number }) {
  return new RedisSessionStore(options);
}
