/**
 * Tests for Squad log parser
 */

import { parseLogLine, parseLogLines, isValidEvent } from '../src/services/log-parser/parser.js';
import { SessionEventType } from '../src/services/log-parser/types.js';

describe('Squad Log Parser', () => {
  describe('parseLogLine', () => {
    it('should parse player connected event', () => {
      const line = '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: JohnDoe (76561198012345678)';
      const event = parseLogLine(line);

      expect(event).not.toBeNull();
      expect(event?.type).toBe(SessionEventType.JOIN);
      expect(event?.steam64).toBe('76561198012345678');
      expect(event?.playerName).toBe('JohnDoe');
      expect(event?.timestamp).toBeInstanceOf(Date);
    });

    it('should parse player disconnected event', () => {
      const line = '[2024.12.05-15.30.00:456][789]LogSquad: Player disconnected: JaneSmith (76561198087654321)';
      const event = parseLogLine(line);

      expect(event).not.toBeNull();
      expect(event?.type).toBe(SessionEventType.DISCONNECT);
      expect(event?.steam64).toBe('76561198087654321');
      expect(event?.playerName).toBe('JaneSmith');
    });

    it('should handle player names with spaces', () => {
      const line = '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: John Doe The Great (76561198012345678)';
      const event = parseLogLine(line);

      expect(event).not.toBeNull();
      expect(event?.playerName).toBe('John Doe The Great');
    });

    it('should handle player names with special characters', () => {
      const line = '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: [CL4N] Player™ (76561198012345678)';
      const event = parseLogLine(line);

      expect(event).not.toBeNull();
      expect(event?.playerName).toBe('[CL4N] Player™');
    });

    it('should return null for non-player log lines', () => {
      const line = '[2024.12.05-14.00.00:001][  0]LogInit: Display: Running Engine for game: SquadGame';
      const event = parseLogLine(line);

      expect(event).toBeNull();
    });

    it('should return null for lines without valid timestamp', () => {
      const line = 'Player connected: JohnDoe (76561198012345678)';
      const event = parseLogLine(line);

      expect(event).toBeNull();
    });

    it('should reject invalid Steam64 IDs', () => {
      const line = '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: JohnDoe (12345678901234567)';
      const event = parseLogLine(line);

      expect(event).toBeNull();
    });

    it('should parse timestamp correctly', () => {
      const line = '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: JohnDoe (76561198012345678)';
      const event = parseLogLine(line);

      expect(event?.timestamp).toEqual(new Date('2024-12-05T14:23:15.123Z'));
    });
  });

  describe('parseLogLines', () => {
    it('should parse multiple log lines', () => {
      const lines = [
        '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: JohnDoe (76561198012345678)',
        '[2024.12.05-14.00.00:001][  0]LogInit: Display: Running Engine for game: SquadGame',
        '[2024.12.05-15.30.00:456][789]LogSquad: Player disconnected: JaneSmith (76561198087654321)',
      ];

      const events = parseLogLines(lines);

      expect(events).toHaveLength(2);
      expect(events[0]?.type).toBe(SessionEventType.JOIN);
      expect(events[1]?.type).toBe(SessionEventType.DISCONNECT);
    });

    it('should filter out invalid events', () => {
      const lines = [
        '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: JohnDoe (12345678901234567)', // Invalid Steam64
        '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: JaneSmith (76561198087654321)', // Valid
      ];

      const events = parseLogLines(lines);

      expect(events).toHaveLength(1);
      expect(events[0]?.playerName).toBe('JaneSmith');
    });
  });

  describe('isValidEvent', () => {
    it('should validate correct events', () => {
      const event = {
        type: SessionEventType.JOIN,
        steam64: '76561198012345678',
        playerName: 'JohnDoe',
        timestamp: new Date(),
        rawLine: '[2024.12.05-14.23.15:123][456]LogSquad: Player connected: JohnDoe (76561198012345678)',
      };

      expect(isValidEvent(event)).toBe(true);
    });

    it('should reject events with invalid Steam64', () => {
      const event = {
        type: SessionEventType.JOIN,
        steam64: '12345678901234567',
        playerName: 'JohnDoe',
        timestamp: new Date(),
        rawLine: '',
      };

      expect(isValidEvent(event)).toBe(false);
    });

    it('should reject events with empty player name', () => {
      const event = {
        type: SessionEventType.JOIN,
        steam64: '76561198012345678',
        playerName: '',
        timestamp: new Date(),
        rawLine: '',
      };

      expect(isValidEvent(event)).toBe(false);
    });

    it('should reject events with future timestamp', () => {
      const futureDate = new Date(Date.now() + (10 * 60 * 1000)); // 10 minutes in future

      const event = {
        type: SessionEventType.JOIN,
        steam64: '76561198012345678',
        playerName: 'JohnDoe',
        timestamp: futureDate,
        rawLine: '',
      };

      expect(isValidEvent(event)).toBe(false);
    });
  });
});
