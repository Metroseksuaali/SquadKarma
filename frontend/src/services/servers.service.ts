// src/services/servers.service.ts
// Server-related API calls

import api from './api';
import type { Server, Player } from '@/types';

export const serversService = {
  // Get all active servers
  async getServers(): Promise<Server[]> {
    const response = await api.get<Server[]>('/servers');
    return response.data;
  },

  // Get single server
  async getServer(id: string): Promise<Server> {
    const response = await api.get<Server>(`/servers/${id}`);
    return response.data;
  },

  // Get players on a server
  async getServerPlayers(serverId: string): Promise<Player[]> {
    const response = await api.get<Player[]>(`/servers/${serverId}/players`);
    return response.data;
  },
};
