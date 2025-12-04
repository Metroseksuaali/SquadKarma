// src/hooks/useReputation.ts
// Reputation-related hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playersService } from '@/services/players.service';
import { votesService } from '@/services/votes.service';
import type { VoteFormData } from '@/types';

export function useReputation(steam64: string) {
  return useQuery({
    queryKey: ['reputation', steam64],
    queryFn: () => playersService.getReputation(steam64),
    enabled: !!steam64,
  });
}

export function useReasonCategories() {
  return useQuery({
    queryKey: ['reason-categories'],
    queryFn: votesService.getReasonCategories,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useVoteCooldown(targetSteam64: string) {
  return useQuery({
    queryKey: ['cooldown', targetSteam64],
    queryFn: () => votesService.checkCooldown(targetSteam64),
    enabled: !!targetSteam64,
  });
}

export function useCreateVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: VoteFormData) => votesService.createVote(data),
    onSuccess: (_, variables) => {
      // Invalidate reputation query
      queryClient.invalidateQueries({ queryKey: ['reputation', variables.targetSteam64] });
      // Invalidate cooldown query
      queryClient.invalidateQueries({ queryKey: ['cooldown', variables.targetSteam64] });
    },
  });
}
