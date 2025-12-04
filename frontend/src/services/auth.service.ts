// src/services/auth.service.ts
// Authentication service

import api from './api';
import type { User } from '@/types';

export const authService = {
  // Get current logged in user
  async getMe(): Promise<User | null> {
    try {
      const response = await api.get<User>('/auth/me');
      return response.data;
    } catch {
      return null;
    }
  },

  // Logout
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  // Get Steam login URL
  getSteamLoginUrl(): string {
    return '/auth/steam';
  },
};
