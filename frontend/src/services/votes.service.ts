// src/services/votes.service.ts
// Vote-related API calls

import api from './api';
import type { Vote, VoteFormData, ReasonCategory } from '@/types';

export const votesService = {
  // Submit a vote
  async createVote(data: VoteFormData): Promise<Vote> {
    const response = await api.post<Vote>('/votes', data);
    return response.data;
  },

  // Check cooldown for voting on a player
  async checkCooldown(targetSteam64: string): Promise<{ canVote: boolean; secondsRemaining: number }> {
    const response = await api.get<{ canVote: boolean; secondsRemaining: number }>(
      `/votes/cooldown/${targetSteam64}`
    );
    return response.data;
  },

  // Get reason categories
  async getReasonCategories(): Promise<ReasonCategory[]> {
    const response = await api.get<ReasonCategory[]>('/reason-categories');
    return response.data;
  },
};
