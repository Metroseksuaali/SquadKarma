// src/hooks/useRequireAuth.ts
// Hook for handling protected actions that require authentication

import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

interface UseRequireAuthResult {
  /** Check if user is logged in before executing an action */
  requireAuth: (action: () => void) => boolean;
  /** Current authentication status */
  isLoggedIn: boolean;
  /** Whether auth state is being loaded */
  isLoading: boolean;
  /** Trigger login flow with redirect back to current page */
  loginWithRedirect: () => void;
}

/**
 * Hook for handling protected actions that require authentication.
 * Stores the current location for post-login redirect.
 * 
 * @example
 * ```tsx
 * const { requireAuth, isLoggedIn } = useRequireAuth();
 * 
 * const handleVote = () => {
 *   requireAuth(() => {
 *     // This only runs if user is logged in
 *     submitVote(data);
 *   });
 * };
 * ```
 */
export function useRequireAuth(): UseRequireAuthResult {
  const { isLoggedIn, isLoading, login } = useAuth();
  const location = useLocation();

  const loginWithRedirect = useCallback(() => {
    // Store intended destination for post-login redirect
    sessionStorage.setItem('authRedirect', location.pathname + location.search);
    login();
  }, [login, location.pathname, location.search]);

  const requireAuth = useCallback(
    (action: () => void): boolean => {
      if (!isLoggedIn) {
        loginWithRedirect();
        return false;
      }
      action();
      return true;
    },
    [isLoggedIn, loginWithRedirect]
  );

  return {
    requireAuth,
    isLoggedIn,
    isLoading,
    loginWithRedirect,
  };
}
