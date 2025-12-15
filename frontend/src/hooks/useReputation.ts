// src/hooks/useReputation.ts
// Reputation-related hooks with proper auth error handling

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { playersService } from '@/services/players.service';
import { votesService } from '@/services/votes.service';
import { useAuth } from './useAuth';
import type { VoteFormData } from '@/types';

/**
 * Fetch reputation data for a player.
 * This is public data - works without authentication.
 */
export function useReputation(steam64: string) {
  return useQuery({
    queryKey: ['reputation', steam64],
    queryFn: () => playersService.getReputation(steam64),
    enabled: !!steam64,
  });
}

/**
 * Fetch available reason categories for voting.
 * This is public data - works without authentication.
 */
export function useReasonCategories() {
  return useQuery({
    queryKey: ['reason-categories'],
    queryFn: votesService.getReasonCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/**
 * Check vote cooldown status for a target player.
 * Requires authentication - will fail gracefully if not logged in.
 */
export function useVoteCooldown(targetSteam64: string) {
  const { isLoggedIn } = useAuth();

  return useQuery({
    queryKey: ['cooldown', targetSteam64],
    queryFn: () => votesService.checkCooldown(targetSteam64),
    enabled: !!targetSteam64 && isLoggedIn,
    retry: false, // Don't retry auth failures
  });
}

interface UseCreateVoteCallbacks {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onAuthError?: () => void;
}

/**
 * Create a vote mutation with proper auth error handling.
 * 
 * @example
 * ```tsx
 * const voteMutation = useCreateVote({
 *   onSuccess: () => toast.success('Vote submitted!'),
 *   onAuthError: () => toast.error('Please log in to vote'),
 * });
 * ```
 */
export function useCreateVote(callbacks?: UseCreateVoteCallbacks) {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuth();

  return useMutation({
    mutationFn: async (data: VoteFormData) => {
      // Pre-check authentication to provide better error message
      if (!isLoggedIn) {
        throw new Error('Authentication required to submit a vote');
      }
      return votesService.createVote(data);
    },
    onSuccess: (_, variables) => {
      // Invalidate reputation query to show updated scores
      queryClient.invalidateQueries({ queryKey: ['reputation', variables.targetSteam64] });
      // Invalidate cooldown query to reflect new cooldown period
      queryClient.invalidateQueries({ queryKey: ['cooldown', variables.targetSteam64] });
      // Call user's success callback
      callbacks?.onSuccess?.();
    },
    onError: (error: Error | AxiosError) => {
      // Check if this is an auth error
      const isAuthError =
        (error instanceof AxiosError && error.response?.status === 401) ||
        error.message === 'Authentication required to submit a vote';

      if (isAuthError) {
        // Auth state already invalidated by API interceptor
        callbacks?.onAuthError?.();
      } else {
        callbacks?.onError?.(error);
      }
    },
  });
}
