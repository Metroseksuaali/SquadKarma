import { prisma } from '../db/client.js';
import { z } from 'zod';
import crypto from 'crypto';

/**
 * Node registration data
 */
export interface NodeRegistration {
  guildId: string;
  serverId: string;
  serverName: string;
  apiUrl: string;
  apiKey: string;
  registeredBy: string;
}

/**
 * Validation schema for API URL
 */
const apiUrlSchema = z.string().url().startsWith('https://');

/**
 * Validation schema for API key
 */
const apiKeySchema = z.string().min(32, 'API key must be at least 32 characters');

/**
 * Register a new node for a guild
 */
export async function registerNode(data: NodeRegistration): Promise<void> {
  // Validate inputs
  const validatedUrl = apiUrlSchema.parse(data.apiUrl);
  const validatedKey = apiKeySchema.parse(data.apiKey);

  // Encrypt API key before storing
  const encryptedKey = encryptApiKey(validatedKey);

  // Check if node already exists for this guild
  const existing = await prisma.nodeRegistry.findUnique({
    where: { guildId: data.guildId },
  });

  if (existing) {
    // Update existing registration
    await prisma.nodeRegistry.update({
      where: { guildId: data.guildId },
      data: {
        serverId: data.serverId,
        serverName: data.serverName,
        apiUrl: validatedUrl,
        apiKey: encryptedKey,
        registeredBy: data.registeredBy,
        isActive: true,
        registeredAt: new Date(),
      },
    });
    console.log(`📝 Updated node registration for guild ${data.guildId}`);
  } else {
    // Create new registration
    await prisma.nodeRegistry.create({
      data: {
        guildId: data.guildId,
        serverId: data.serverId,
        serverName: data.serverName,
        apiUrl: validatedUrl,
        apiKey: encryptedKey,
        registeredBy: data.registeredBy,
        isActive: true,
      },
    });
    console.log(`✅ Registered new node for guild ${data.guildId}`);
  }
}

/**
 * Get node configuration by guild ID
 */
export async function getNodeByGuild(guildId: string) {
  const node = await prisma.nodeRegistry.findUnique({
    where: { guildId },
  });

  if (!node) {
    return null;
  }

  // Decrypt API key
  const decryptedKey = decryptApiKey(node.apiKey);

  return {
    ...node,
    apiKey: decryptedKey,
  };
}

/**
 * Get node for a guild (without decrypting API key)
 */
export async function getNodeForGuild(guildId: string) {
  return prisma.nodeRegistry.findUnique({
    where: { guildId },
  });
}

/**
 * Deactivate a node registration
 */
export async function deactivateNode(guildId: string): Promise<void> {
  await prisma.nodeRegistry.update({
    where: { guildId },
    data: { isActive: false },
  });
  console.log(`🔴 Deactivated node for guild ${guildId}`);
}

/**
 * Unregister (delete) a node registration
 */
export async function unregisterNode(guildId: string): Promise<void> {
  await prisma.nodeRegistry.delete({
    where: { guildId },
  });
  console.log(`🗑️ Unregistered node for guild ${guildId}`);
}

/**
 * Get all active nodes
 */
export async function getAllActiveNodes() {
  return prisma.nodeRegistry.findMany({
    where: { isActive: true },
  });
}

/**
 * Health check a node's API
 */
export async function healthCheckNode(guildId: string): Promise<boolean> {
  const node = await getNodeByGuild(guildId);
  if (!node) {
    return false;
  }

  try {
    const response = await fetch(`${node.apiUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${node.apiKey}`,
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const isHealthy = response.ok;

    // Update last health check timestamp
    await prisma.nodeRegistry.update({
      where: { guildId },
      data: { lastHealthCheck: new Date() },
    });

    return isHealthy;
  } catch (error) {
    console.error(`Health check failed for guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Periodic health check for all nodes
 */
export async function healthCheckAllNodes(): Promise<void> {
  const nodes = await getAllActiveNodes();

  console.log(`🏥 Running health checks for ${nodes.length} node(s)...`);

  for (const node of nodes) {
    const isHealthy = await healthCheckNode(node.guildId);
    if (!isHealthy) {
      console.warn(`⚠️ Node ${node.serverId} (${node.guildId}) is unhealthy`);
    }
  }
}

/**
 * Simple encryption for API keys (AES-256-GCM)
 * In production, use environment variable for encryption key
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'squad-karma-bot-encryption-key-change-in-production!!';

function encryptApiKey(apiKey: string): string {
  // Derive a proper 32-byte key from the encryption key
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptApiKey(encryptedData: string): string {
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const [ivHex, authTagHex, encrypted] = parts;
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Missing encryption components');
  }

  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
