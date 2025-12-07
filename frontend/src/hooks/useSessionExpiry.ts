// src/hooks/useSessionExpiry.ts
// Hook for handling session expiry notifications

import { useEffect, useCallback } from 'react';

interface UseSessionExpiryOptions {
  /** Callback when session expires */
  onSessionExpired?: () => void;
}

/**
 * Hook that listens for session expiry events from the API interceptor.
 * Can be used to show toast notifications or trigger other UI updates.
 * 
 * @example
 * ```tsx
 * useSessionExpiry({
 *   onSessionExpired: () => {
 *     toast.info('Your session has expired. Please log in again.');
 *   }
 * });
 * ```
 */
export function useSessionExpiry(options: UseSessionExpiryOptions = {}) {
  const { onSessionExpired } = options;

  const handleSessionExpired = useCallback(() => {
    onSessionExpired?.();
  }, [onSessionExpired]);

  useEffect(() => {
    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [handleSessionExpired]);
}
