// src/components/features/auth/AuthRequired.tsx
// Component for displaying auth-required content with fallback UI

import { useAuth } from '@/hooks/useAuth';
import { SteamLoginButton } from './SteamLoginButton';

interface AuthRequiredProps {
  /** Content to show when user is authenticated */
  children: React.ReactNode;
  /** Custom fallback UI when not authenticated (defaults to login prompt) */
  fallback?: React.ReactNode;
  /** Custom loading UI (defaults to spinner) */
  loadingFallback?: React.ReactNode;
  /** Custom message for the default login prompt */
  message?: string;
}

/**
 * Wrapper component that shows content only to authenticated users.
 * Displays a login prompt for unauthenticated users.
 * 
 * @example
 * ```tsx
 * <AuthRequired message="Sign in to vote on this player">
 *   <VoteForm targetSteam64={steam64} />
 * </AuthRequired>
 * ```
 */
export function AuthRequired({
  children,
  fallback,
  loadingFallback,
  message = 'Please sign in to continue',
}: AuthRequiredProps) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      loadingFallback || (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-dark-400 text-sm">Checking authentication...</p>
          </div>
        </div>
      )
    );
  }

  if (!isLoggedIn) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-dark-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <p className="text-dark-300 mb-4">{message}</p>
            <SteamLoginButton size="md" />
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
