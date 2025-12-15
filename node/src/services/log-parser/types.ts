/**
 * Types for Squad log parsing
 */

/**
 * Player session event types
 */
export enum SessionEventType {
  JOIN = 'JOIN',
  DISCONNECT = 'DISCONNECT',
}

/**
 * Parsed player session event from Squad logs
 */
export interface ParsedSessionEvent {
  type: SessionEventType;
  steam64: string;
  playerName: string;
  timestamp: Date;
  rawLine: string; // Original log line for debugging
}

/**
 * Log parser configuration
 */
export interface LogParserConfig {
  logFilePath: string;
  serverId: string;
  watchInterval?: number; // How often to check for changes (ms)
}

/**
 * Session tracking state
 */
export interface PlayerSession {
  steam64: string;
  playerName: string;
  joinedAt: Date;
  leftAt?: Date;
  serverId: string;
}
