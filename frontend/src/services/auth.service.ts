// src/services/auth.service.ts
// Authentication service

import axios from 'axios';
import type { User } from '@/types';

// Separate axios instance for auth routes (no /api prefix)
const authApi = axios.create({
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface AuthResponse {
  authenticated: boolean;
  user?: User;
}

export const authService = {
  // Get current logged in user
  async getMe(): Promise<User | null> {
    try {
      const response = await authApi.get<AuthResponse>('/auth/me');
      if (response.data.authenticated && response.data.user) {
        return response.data.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  // Logout
  async logout(): Promise<void> {
    await authApi.post('/auth/logout');
  },

  // Get Steam login URL
  getSteamLoginUrl(): string {
    return '/auth/steam';
  },
};
