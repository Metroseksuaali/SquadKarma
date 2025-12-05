import openid from 'openid';
import type { OpenIdError } from 'openid';
import { config } from '../config/env.js';
import { prisma } from '../db/client.js';

/**
 * Steam OpenID Relying Party
 */
const relyingParty = new openid.RelyingParty(
  config.steam.callbackUrl,
  config.steam.callbackUrl.replace('/auth/steam/callback', ''),
  true, // Use stateless verification
  false, // Don't use associations
  []
);

/**
 * Pending authentication sessions
 * Maps Discord user ID to verification URL
 */
const pendingAuth = new Map<string, { url: string, timestamp: number }>();

/**
 * Steam ID regex pattern
 */
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

/**
 * Generate Steam OpenID authentication URL
 */
export async function generateSteamAuthUrl(discordId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    relyingParty.authenticate(
      'https://steamcommunity.com/openid',
      false,
      (error: OpenIdError | null, authUrl: string | null) => {
        if (error) {
          reject(error);
          return;
        }

        if (!authUrl) {
          reject(new Error('Failed to generate auth URL'));
          return;
        }

        // Store pending authentication
        pendingAuth.set(discordId, {
          url: authUrl,
          timestamp: Date.now(),
        });

        // Clean up old pending auths (older than 10 minutes)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        for (const [key, value] of pendingAuth.entries()) {
          if (value.timestamp < tenMinutesAgo) {
            pendingAuth.delete(key);
          }
        }

        resolve(authUrl);
      }
    );
  });
}

/**
 * Verify Steam OpenID callback
 */
export async function verifySteamCallback(requestUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    relyingParty.verifyAssertion(requestUrl, (error: OpenIdError | null, result?: { authenticated: boolean; claimedIdentifier?: string }) => {
      if (error || !result || !result.authenticated) {
        resolve(null);
        return;
      }

      // Extract Steam64 ID from claimed identifier
      const match = result.claimedIdentifier?.match(STEAM_ID_PATTERN);
      if (!match || !match[1]) {
        resolve(null);
        return;
      }

      const steam64 = match[1];
      resolve(steam64);
    });
  });
}

/**
 * Link Discord account to Steam account
 */
export async function linkDiscordToSteam(
  discordId: string,
  steam64: string
): Promise<void> {
  // Check if Steam64 is already linked to another Discord account
  const existing = await prisma.userLink.findUnique({
    where: { steam64 },
  });

  if (existing && existing.discordId !== discordId) {
    throw new Error('This Steam account is already linked to another Discord account');
  }

  // Upsert the link
  await prisma.userLink.upsert({
    where: { discordId },
    create: {
      discordId,
      steam64,
      verified: true,
    },
    update: {
      steam64,
      verified: true,
      linkedAt: new Date(),
    },
  });

  // Clean up pending auth
  pendingAuth.delete(discordId);
}

/**
 * Get Steam64 for a Discord user
 */
export async function getSteam64ForDiscord(discordId: string): Promise<string | null> {
  const link = await prisma.userLink.findUnique({
    where: { discordId },
  });

  return link?.steam64 || null;
}

/**
 * Unlink Discord account from Steam
 */
export async function unlinkDiscordFromSteam(discordId: string): Promise<boolean> {
  try {
    await prisma.userLink.delete({
      where: { discordId },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user link information
 */
export async function getUserLink(discordId: string) {
  return prisma.userLink.findUnique({
    where: { discordId },
  });
}

/**
 * Check if a pending auth exists and is still valid
 */
export function hasPendingAuth(discordId: string): boolean {
  const pending = pendingAuth.get(discordId);
  if (!pending) return false;

  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  return pending.timestamp >= tenMinutesAgo;
}
