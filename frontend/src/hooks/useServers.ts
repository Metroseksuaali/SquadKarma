// src/hooks/useServers.ts
// Server-related hooks

import { useQuery } from '@tanstack/react-query';
import { serversService } from '@/services/servers.service';

export function useServers() {
  return useQuery({
    queryKey: ['servers'],
    queryFn: serversService.getServers,
  });
}

export function useServer(serverId: string) {
  return useQuery({
    queryKey: ['servers', serverId],
    queryFn: () => serversService.getServer(serverId),
    enabled: !!serverId,
  });
}

export function useServerPlayers(serverId: string) {
  return useQuery({
    queryKey: ['servers', serverId, 'players'],
    queryFn: () => serversService.getServerPlayers(serverId),
    enabled: !!serverId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
