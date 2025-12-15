/**
 * Replication Sync Service
 *
 * Periodically syncs votes with trusted nodes using a pull model:
 * 1. Query each trusted node for votes since last sync
 * 2. Import new votes using the replication API
 * 3. Track last sync timestamp per node
 */

import { prisma } from '../../db/client.js';
import { config } from '../../config/env.js';

/**
 * Last sync timestamps per node (in-memory cache)
 */
const lastSyncTimestamps = new Map<string, Date>();

/**
 * Sync votes from a single trusted node
 */
async function syncFromNode(node: {
  nodeId: string;
  apiUrl: string;
}): Promise<{ inserted: number; duplicates: number; errors: number }> {
  const results = { inserted: 0, duplicates: 0, errors: 0 };

  try {
    // Get last sync timestamp for this node (default to 24 hours ago)
    let lastSync = lastSyncTimestamps.get(node.nodeId);
    if (!lastSync) {
      lastSync = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Fetch votes from the node
    const response = await fetch(
      `${node.apiUrl}/api/replicate/votes/since/${lastSync.toISOString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.replication.secret}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch votes from ${node.nodeId}: ${response.status}`);
      return results;
    }

    const data = await response.json() as {
      nodeId: string;
      votesCount: number;
      votes: Array<{
        voterSteam64: string;
        targetSteam64: string;
        direction: 'UP' | 'DOWN';
        reasonCategory: string;
        voterSessionId: number;
        targetSessionId: number;
        createdAt: string;
        sourceNodeId: string;
      }>;
    };

    if (data.votesCount === 0) {
      // No new votes, update sync timestamp
      lastSyncTimestamps.set(node.nodeId, new Date());
      return results;
    }

    console.log(`📥 Received ${data.votesCount} votes from ${node.nodeId}`);

    // Process each vote
    for (const vote of data.votes) {
      try {
        // Check for duplicates (conflict resolution: first vote wins)
        const voteTimestamp = new Date(vote.createdAt);
        const oneHourBefore = new Date(voteTimestamp.getTime() - 60 * 60 * 1000);
        const oneHourAfter = new Date(voteTimestamp.getTime() + 60 * 60 * 1000);

        const existingVote = await prisma.vote.findFirst({
          where: {
            voterSteam64: vote.voterSteam64,
            targetSteam64: vote.targetSteam64,
            createdAt: {
              gte: oneHourBefore,
              lte: oneHourAfter,
            },
          },
        });

        if (existingVote) {
          results.duplicates++;
          continue;
        }

        // Find or create sessions for the vote
        let voterSession = await prisma.session.findFirst({
          where: {
            steam64: vote.voterSteam64,
            serverId: vote.sourceNodeId,
            joinedAt: {
              gte: oneHourBefore,
              lte: oneHourAfter,
            },
          },
        });

        if (!voterSession) {
          voterSession = await prisma.session.create({
            data: {
              steam64: vote.voterSteam64,
              playerName: `Player-${vote.voterSteam64.substring(0, 8)}`,
              serverId: vote.sourceNodeId,
              joinedAt: new Date(vote.createdAt),
              leftAt: new Date(vote.createdAt),
            },
          });
        }

        let targetSession = await prisma.session.findFirst({
          where: {
            steam64: vote.targetSteam64,
            serverId: vote.sourceNodeId,
            joinedAt: {
              gte: oneHourBefore,
              lte: oneHourAfter,
            },
          },
        });

        if (!targetSession) {
          targetSession = await prisma.session.create({
            data: {
              steam64: vote.targetSteam64,
              playerName: `Player-${vote.targetSteam64.substring(0, 8)}`,
              serverId: vote.sourceNodeId,
              joinedAt: new Date(vote.createdAt),
              leftAt: new Date(vote.createdAt),
            },
          });
        }

        // Create the replicated vote
        await prisma.vote.create({
          data: {
            voterSteam64: vote.voterSteam64,
            targetSteam64: vote.targetSteam64,
            direction: vote.direction,
            reasonCategory: vote.reasonCategory,
            voterSessionId: voterSession.id,
            targetSessionId: targetSession.id,
            replicatedFrom: vote.sourceNodeId,
            createdAt: new Date(vote.createdAt),
          },
        });

        results.inserted++;
      } catch (error) {
        console.error(`Failed to import vote from ${node.nodeId}:`, error);
        results.errors++;
      }
    }

    // Update last sync timestamp
    lastSyncTimestamps.set(node.nodeId, new Date());

    // Update node's lastSeenAt
    await prisma.trustedNode.update({
      where: { nodeId: node.nodeId },
      data: { lastSeenAt: new Date() },
    });

    return results;
  } catch (error) {
    console.error(`Error syncing from node ${node.nodeId}:`, error);
    return results;
  }
}

/**
 * Sync votes from all trusted nodes
 */
export async function syncFromAllNodes(): Promise<void> {
  const trustedNodes = await prisma.trustedNode.findMany({
    where: { isActive: true },
  });

  if (trustedNodes.length === 0) {
    console.log('📭 No trusted nodes configured for replication');
    return;
  }

  console.log(`🔄 Starting replication sync with ${trustedNodes.length} trusted node(s)...`);

  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (const node of trustedNodes) {
    const results = await syncFromNode(node);
    totalInserted += results.inserted;
    totalDuplicates += results.duplicates;
    totalErrors += results.errors;
  }

  console.log(`✅ Replication sync complete: ${totalInserted} inserted, ${totalDuplicates} duplicates, ${totalErrors} errors`);
}

/**
 * Start periodic replication sync
 * @param intervalMs - Sync interval in milliseconds (default: 5 minutes)
 */
export function startReplicationSync(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
  console.log(`🔄 Starting replication sync service (interval: ${intervalMs / 1000}s)`);

  // Run initial sync after a short delay
  setTimeout(() => {
    syncFromAllNodes().catch(console.error);
  }, 10000); // 10 second delay for startup

  // Then run periodically
  return setInterval(() => {
    syncFromAllNodes().catch(console.error);
  }, intervalMs);
}

/**
 * Add a trusted node to the database
 */
export async function addTrustedNode(nodeId: string, nodeName: string, apiUrl: string): Promise<void> {
  await prisma.trustedNode.upsert({
    where: { nodeId },
    create: {
      nodeId,
      nodeName,
      apiUrl,
      isActive: true,
    },
    update: {
      nodeName,
      apiUrl,
      isActive: true,
    },
  });
  console.log(`✅ Added trusted node: ${nodeName} (${nodeId})`);
}

/**
 * Remove a trusted node from the database
 */
export async function removeTrustedNode(nodeId: string): Promise<void> {
  await prisma.trustedNode.update({
    where: { nodeId },
    data: { isActive: false },
  });
  console.log(`🗑️ Removed trusted node: ${nodeId}`);
}

/**
 * List all trusted nodes
 */
export async function listTrustedNodes(): Promise<Array<{
  nodeId: string;
  nodeName: string;
  apiUrl: string;
  isActive: boolean;
  lastSeenAt: Date | null;
}>> {
  return prisma.trustedNode.findMany({
    select: {
      nodeId: true,
      nodeName: true,
      apiUrl: true,
      isActive: true,
      lastSeenAt: true,
    },
  });
}
