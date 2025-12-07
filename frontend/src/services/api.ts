// src/services/api.ts
// API client configuration with proper auth error handling

import axios, { AxiosError } from 'axios';
import type { QueryClient } from '@tanstack/react-query';

// QueryClient reference for auth state management
let queryClient: QueryClient | null = null;

// Race condition prevention flag
let isInvalidatingAuth = false;

/**
 * Set the QueryClient reference for auth state management.
 * This should be called once during app initialization.
 */
export function setQueryClient(client: QueryClient): void {
  queryClient = client;
}

/**
 * Get the current QueryClient reference.
 * Useful for checking if auth state management is configured.
 */
export function getQueryClient(): QueryClient | null {
  return queryClient;
}

/**
 * Main API client for /api/* routes.
 * Handles auth state invalidation on 401 responses.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any request transformations here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with proper auth error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && queryClient && !isInvalidatingAuth) {
      // Prevent multiple simultaneous invalidations
      isInvalidatingAuth = true;

      // Check if user was previously logged in (for session expiry notification)
      const wasLoggedIn = queryClient.getQueryData(['auth', 'me']);

      // Invalidate auth cache - UI will update automatically via TanStack Query
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Emit custom event for session expiry handling (optional toast notifications)
      if (wasLoggedIn) {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }

      // Reset flag after short delay to allow batched 401s to be handled together
      setTimeout(() => {
        isInvalidatingAuth = false;
      }, 1000);
    }

    // Always propagate the error - let components handle it
    return Promise.reject(error);
  }
);

export default api;
