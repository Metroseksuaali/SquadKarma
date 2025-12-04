// src/services/players.service.ts
// Player-related API calls

import api from './api';
import type { Player, Reputation } from '@/types';

export const playersService = {
  // Get player by Steam64
  async getPlayer(steam64: string): Promise<Player> {
    const response = await api.get<Player>(`/players/${steam64}`);
    return response.data;
  },

  // Search players by name
  async searchPlayers(query: string): Promise<Player[]> {
    const response = await api.get<Player[]>('/players/search', {
      params: { q: query },
    });
    return response.data;
  },

  // Get player reputation
  async getReputation(steam64: string): Promise<Reputation> {
    const response = await api.get<Reputation>(`/players/${steam64}/reputation`);
    return response.data;
  },
};
