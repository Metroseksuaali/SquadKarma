import { ParsedSessionEvent, SessionEventType } from './types.js';
import { isValidSteam64 } from '../../utils/steam.js';

/**
 * Squad Log Parser
 *
 * Parses Squad server log files to extract player join/disconnect events.
 *
 * Based on research from SquadJS and other Squad log parsing tools:
 * - Join events: "Join succeeded: PlayerName" or "Player connected: PlayerName (Steam64)"
 * - Disconnect events: "Player disconnected: PlayerName (Steam64)"
 * - Timestamp format: [YYYY.MM.DD-HH.MM.SS:mmm]
 */

/**
 * Regex patterns for parsing Squad log lines
 */
const LOG_PATTERNS = {
  // Timestamp: [2024.12.05-14.23.15:123]
  timestamp: /^\[(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2}):(\d{3})\]/,

  // Player connected: PlayerName (76561198012345678)
  playerConnected: /Player connected: (.+?) \((\d{17})\)/,

  // Player disconnected: PlayerName (76561198012345678)
  playerDisconnected: /Player disconnected: (.+?) \((\d{17})\)/,

  // Join succeeded: PlayerName (backup pattern, may not have Steam64)
  joinSucceeded: /Join succeeded: (.+?)$/,
};

/**
 * Parse timestamp from Squad log line
 *
 * @param line - Raw log line
 * @returns Parsed Date object or null if invalid
 */
function parseTimestamp(line: string): Date | null {
  const match = line.match(LOG_PATTERNS.timestamp);
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second, millisecond] = match;

  // TypeScript strict null check - these should never be undefined due to regex, but type system doesn't know that
  if (!year || !month || !day || !hour || !minute || !second || !millisecond) {
    return null;
  }

  try {
    // Create UTC date from components
    const date = new Date(Date.UTC(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Months are 0-indexed
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10),
      parseInt(millisecond, 10)
    ));

    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Parse a single Squad log line for player events
 *
 * @param line - Raw log line
 * @returns Parsed event or null if line doesn't contain a player event
 */
export function parseLogLine(line: string): ParsedSessionEvent | null {
  // First, extract timestamp
  const timestamp = parseTimestamp(line);
  if (!timestamp) {
    return null; // Not a valid log line
  }

  // Check for player connected event
  const connectedMatch = line.match(LOG_PATTERNS.playerConnected);
  if (connectedMatch) {
    const [, playerName, steam64] = connectedMatch;

    // TypeScript strict null checks
    if (!playerName || !steam64) {
      return null;
    }

    if (!isValidSteam64(steam64)) {
      console.warn(`Invalid Steam64 in log line: ${steam64}`);
      return null;
    }

    return {
      type: SessionEventType.JOIN,
      steam64,
      playerName: playerName.trim(),
      timestamp,
      rawLine: line,
    };
  }

  // Check for player disconnected event
  const disconnectedMatch = line.match(LOG_PATTERNS.playerDisconnected);
  if (disconnectedMatch) {
    const [, playerName, steam64] = disconnectedMatch;

    // TypeScript strict null checks
    if (!playerName || !steam64) {
      return null;
    }

    if (!isValidSteam64(steam64)) {
      console.warn(`Invalid Steam64 in log line: ${steam64}`);
      return null;
    }

    return {
      type: SessionEventType.DISCONNECT,
      steam64,
      playerName: playerName.trim(),
      timestamp,
      rawLine: line,
    };
  }

  // No player event found in this line
  return null;
}

/**
 * Parse multiple log lines
 *
 * @param lines - Array of raw log lines
 * @returns Array of parsed events
 */
export function parseLogLines(lines: string[]): ParsedSessionEvent[] {
  const events: ParsedSessionEvent[] = [];

  for (const line of lines) {
    const event = parseLogLine(line);
    if (event) {
      events.push(event);
    }
  }

  return events;
}

/**
 * Validate parsed event
 *
 * Additional validation beyond basic parsing
 */
export function isValidEvent(event: ParsedSessionEvent): boolean {
  // Check Steam64 is valid
  if (!isValidSteam64(event.steam64)) {
    return false;
  }

  // Check player name is not empty
  if (!event.playerName || event.playerName.trim().length === 0) {
    return false;
  }

  // Check timestamp is valid
  if (isNaN(event.timestamp.getTime())) {
    return false;
  }

  // Check timestamp is not in the future (with 5 minute tolerance)
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
  if (event.timestamp.getTime() > fiveMinutesFromNow) {
    return false;
  }

  return true;
}
