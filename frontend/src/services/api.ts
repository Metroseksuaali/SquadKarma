// src/services/api.ts
// API client configuration with proper auth error handling and CSRF protection

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { QueryClient } from '@tanstack/react-query';

// QueryClient reference for auth state management
let queryClient: QueryClient | null = null;

// Race condition prevention flag
let isInvalidatingAuth = false;

// CSRF token storage
let csrfToken: string | null = null;
let csrfFetchPromise: Promise<string> | null = null;

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
 * Fetch a fresh CSRF token from the server.
 * Uses a promise cache to prevent duplicate concurrent requests.
 */
async function fetchCsrfToken(): Promise<string> {
  // If we're already fetching, wait for that request
  if (csrfFetchPromise) {
    return csrfFetchPromise;
  }

  csrfFetchPromise = axios
    .get<{ token: string }>('/auth/csrf-token', {
      baseURL: '/api',
      withCredentials: true,
    })
    .then((response) => {
      csrfToken = response.data.token;
      return csrfToken;
    })
    .finally(() => {
      csrfFetchPromise = null;
    });

  return csrfFetchPromise;
}

/**
 * Get CSRF token, fetching if necessary.
 */
async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  return fetchCsrfToken();
}

/**
 * Clear CSRF token (called on 403 CSRF errors to refetch).
 */
export function clearCsrfToken(): void {
  csrfToken = null;
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

// Request interceptor - adds CSRF token to mutating requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (config.method && mutatingMethods.includes(config.method.toUpperCase())) {
      const token = await getCsrfToken();
      config.headers.set('X-CSRF-Token', token);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with proper auth error handling and CSRF retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle CSRF token errors - clear token and retry once
    if (
      error.response?.status === 403 &&
      originalRequest &&
      !originalRequest.headers.get('X-CSRF-Retry')
    ) {
      // Clear the invalid token and fetch a new one
      clearCsrfToken();

      // Mark this as a retry to prevent infinite loops
      originalRequest.headers.set('X-CSRF-Retry', 'true');

      // Fetch new token and retry
      const newToken = await getCsrfToken();
      originalRequest.headers.set('X-CSRF-Token', newToken);

      return api.request(originalRequest);
    }

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
