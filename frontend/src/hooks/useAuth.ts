// src/hooks/useAuth.ts
// Authentication hook

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    login: () => window.location.href = authService.getSteamLoginUrl(),
    logout: () => logoutMutation.mutate(),
  };
}
