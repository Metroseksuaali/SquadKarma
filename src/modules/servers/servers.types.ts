// src/modules/servers/servers.types.ts
// Type definitions for servers module

/**
 * Server response type for API
 */
export interface ServerResponse {
  id: string;
  name: string;
  ip: string;
  port: number;
  isActive: boolean;
  playerCount?: number;
}

/**
 * Server with player count (extended)
 */
export interface ServerWithPlayers extends ServerResponse {
  players?: PlayerOnServer[];
}

/**
 * Player currently on a server
 */
export interface PlayerOnServer {
  steam64: string;
  lastKnownName: string;
}
