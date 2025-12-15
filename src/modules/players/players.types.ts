// src/modules/players/players.types.ts
// Type definitions for players module

/**
 * Player response type for API
 */
export interface PlayerResponse {
  steam64: string;
  lastKnownName: string;
  firstSeenAt: string;  // ISO date string
  lastSeenAt: string;   // ISO date string
}

/**
 * Top reason category in reputation summary
 */
export interface TopCategory {
  name: string;
  count: number;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

/**
 * Recent voting trend
 */
export interface RecentTrend {
  period: string;
  up: number;
  down: number;
}

/**
 * Reputation summary for a player
 */
export interface ReputationSummary {
  totalUp: number;
  totalDown: number;
  ratio: number;      // 0-1, positive votes / total
  totalVotes: number;
}

/**
 * Full reputation response
 */
export interface ReputationResponse {
  steam64: string;
  displayName: string;
  summary: ReputationSummary;
  topCategories: TopCategory[];
  recentTrend: RecentTrend;
}

/**
 * Search query parameters
 */
export interface PlayerSearchQuery {
  q: string;
}
