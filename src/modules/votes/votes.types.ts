// src/modules/votes/votes.types.ts
// Type definitions for votes module

/**
 * Request body for creating a vote
 */
export interface VoteFormData {
  targetSteam64: string;
  serverId: string;
  direction: 'UP' | 'DOWN';
  reasonCategoryId: number;
}

/**
 * Vote response type
 */
export interface VoteResponse {
  id: string;
  voterSteam64: string;
  targetSteam64: string;
  serverId: string;
  direction: 'UP' | 'DOWN';
  reasonCategoryId: number;
  createdAt: string;
}

/**
 * Cooldown status response
 */
export interface CooldownResponse {
  canVote: boolean;
  secondsRemaining: number;
}

/**
 * Reason category response
 */
export interface ReasonCategoryResponse {
  id: number;
  name: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}
