/**
 * Replication Service
 *
 * Handles node-to-node vote replication
 */

export {
  syncFromAllNodes,
  startReplicationSync,
  addTrustedNode,
  removeTrustedNode,
  listTrustedNodes,
} from './sync.js';
