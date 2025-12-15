import { prisma } from '../../db/client.js';
import { ParsedSessionEvent, SessionEventType } from './types.js';

/**
 * Session Manager
 *
 * Manages player sessions in the database based on parsed log events.
 * Handles both JOIN and DISCONNECT events.
 */

export class SessionManager {
  private serverId: string;

  constructor(serverId: string) {
    this.serverId = serverId;
  }

  /**
   * Handle a parsed log event
   */
  async handleEvent(event: ParsedSessionEvent): Promise<void> {
    switch (event.type) {
      case SessionEventType.JOIN:
        await this.handleJoin(event);
        break;
      case SessionEventType.DISCONNECT:
        await this.handleDisconnect(event);
        break;
      default:
        console.warn(`Unknown event type: ${event.type}`);
    }
  }

  /**
   * Handle player join event
   */
  private async handleJoin(event: ParsedSessionEvent): Promise<void> {
    try {
      // Check if there's an existing open session for this player
      const existingSession = await prisma.session.findFirst({
        where: {
          steam64: event.steam64,
          serverId: this.serverId,
          leftAt: null, // Session is still open
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      if (existingSession) {
        // Player joined but has an open session - this shouldn't happen normally
        // Close the old session at the same time as the new join
        console.warn(
          `Player ${event.playerName} (${event.steam64}) joined but has an open session. Closing old session.`
        );

        await prisma.session.update({
          where: { id: existingSession.id },
          data: { leftAt: event.timestamp },
        });
      }

      // Create new session
      const session = await prisma.session.create({
        data: {
          steam64: event.steam64,
          playerName: event.playerName,
          joinedAt: event.timestamp,
          leftAt: null,
          serverId: this.serverId,
        },
      });

      console.log(`✅ Player joined: ${event.playerName} (${event.steam64}) - Session #${session.id}`);
    } catch (error) {
      console.error('Error handling join event:', error);
      throw error;
    }
  }

  /**
   * Handle player disconnect event
   */
  private async handleDisconnect(event: ParsedSessionEvent): Promise<void> {
    try {
      // Find the most recent open session for this player
      const session = await prisma.session.findFirst({
        where: {
          steam64: event.steam64,
          serverId: this.serverId,
          leftAt: null, // Session is still open
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });

      if (!session) {
        // No open session found - this can happen if we started watching mid-game
        console.warn(
          `Player ${event.playerName} (${event.steam64}) disconnected but no open session found. Creating closed session.`
        );

        // Create a session that's already closed (we don't know when they joined)
        // Use disconnect time minus 5 minutes as a fallback join time
        const estimatedJoinTime = new Date(event.timestamp.getTime() - (5 * 60 * 1000));

        await prisma.session.create({
          data: {
            steam64: event.steam64,
            playerName: event.playerName,
            joinedAt: estimatedJoinTime,
            leftAt: event.timestamp,
            serverId: this.serverId,
          },
        });

        return;
      }

      // Update session with disconnect time
      await prisma.session.update({
        where: { id: session.id },
        data: { leftAt: event.timestamp },
      });

      // Calculate session duration
      const durationMs = event.timestamp.getTime() - session.joinedAt.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);

      console.log(
        `👋 Player left: ${event.playerName} (${event.steam64}) - Session #${session.id} - Duration: ${durationMinutes} min`
      );
    } catch (error) {
      console.error('Error handling disconnect event:', error);
      throw error;
    }
  }

  /**
   * Get currently online players
   */
  async getOnlinePlayers() {
    return await prisma.session.findMany({
      where: {
        serverId: this.serverId,
        leftAt: null,
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });
  }

  /**
   * Get session statistics
   */
  async getStats() {
    const totalSessions = await prisma.session.count({
      where: { serverId: this.serverId },
    });

    const activeSessions = await prisma.session.count({
      where: {
        serverId: this.serverId,
        leftAt: null,
      },
    });

    const uniquePlayers = await prisma.session.groupBy({
      by: ['steam64'],
      where: { serverId: this.serverId },
    });

    return {
      totalSessions,
      activeSessions,
      uniquePlayers: uniquePlayers.length,
    };
  }

  /**
   * Close all open sessions
   * Useful when shutting down or handling log rotation
   */
  async closeAllOpenSessions(timestamp?: Date): Promise<void> {
    const closeTime = timestamp ?? new Date();

    const result = await prisma.session.updateMany({
      where: {
        serverId: this.serverId,
        leftAt: null,
      },
      data: {
        leftAt: closeTime,
      },
    });

    console.log(`Closed ${result.count} open sessions`);
  }
}
