// src/types/index.ts
// Shared types between frontend and backend

export interface User {
  id: string;
  steam64: string;
  displayName: string;
  avatarUrl: string | null;
  isBanned: boolean;
}

export interface Server {
  id: string;
  name: string;
  ip: string;
  port: number;
  isActive: boolean;
  playerCount?: number;
}

export interface Player {
  steam64: string;
  lastKnownName: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface ReasonCategory {
  id: number;
  name: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

export interface Vote {
  id: string;
  voterSteam64: string;
  targetSteam64: string;
  serverId: string;
  direction: 'UP' | 'DOWN';
  reasonCategoryId: number;
  createdAt: string;
}

export interface Reputation {
  steam64: string;
  displayName: string;
  summary: {
    totalUp: number;
    totalDown: number;
    ratio: number;
    totalVotes: number;
  };
  topCategories: Array<{
    name: string;
    count: number;
    type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  }>;
  recentTrend: {
    period: string;
    up: number;
    down: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Vote form types
export interface VoteFormData {
  targetSteam64: string;
  serverId: string;
  direction: 'UP' | 'DOWN';
  reasonCategoryId: number;
}
