import openid from 'openid';
import type { OpenIdError } from 'openid';
import crypto from 'crypto';
import { config } from '../config/env.js';
import { prisma } from '../db/client.js';

/**
 * Pending authentication sessions
 * Maps state token to Discord user ID
 */
const pendingAuth = new Map<string, { discordId: string, timestamp: number }>();

/**
 * Steam ID regex pattern
 */
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

/**
 * Generate Steam OpenID authentication URL with state token
 */
export async function generateSteamAuthUrl(discordId: string): Promise<{ authUrl: string, state: string }> {
  // Generate state token for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');

  // Create callback URL with state parameter
  const callbackUrlWithState = `${config.steam.callbackUrl}?state=${state}`;

  // Create a relying party instance with the state-included callback
  const relyingParty = new openid.RelyingParty(
    callbackUrlWithState,
    config.steam.callbackUrl.replace('/auth/steam/callback', ''),
    true, // Use stateless verification
    false, // Don't use associations
    []
  );

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

        // Store pending authentication with state token
        pendingAuth.set(state, {
          discordId,
          timestamp: Date.now(),
        });

        // Clean up old pending auths (older than 10 minutes)
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        for (const [key, value] of pendingAuth.entries()) {
          if (value.timestamp < tenMinutesAgo) {
            pendingAuth.delete(key);
          }
        }

        resolve({ authUrl, state });
      }
    );
  });
}

/**
 * Verify Steam OpenID callback
 */
export async function verifySteamCallback(requestUrl: string): Promise<string | null> {
  // Create a relying party for verification
  // We use the base callback URL without query params for verification
  const baseCallbackUrl = config.steam.callbackUrl.split('?')[0] || config.steam.callbackUrl;
  const realm = baseCallbackUrl.replace('/auth/steam/callback', '');
  const relyingParty = new openid.RelyingParty(
    baseCallbackUrl,
    realm,
    true,
    false,
    []
  );

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
 * Get Discord ID from state token
 */
export function getDiscordIdFromState(state: string): string | null {
  const pending = pendingAuth.get(state);
  if (!pending) return null;

  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  if (pending.timestamp < tenMinutesAgo) {
    pendingAuth.delete(state);
    return null;
  }

  return pending.discordId;
}

/**
 * Clean up pending auth after successful link
 */
export function cleanupPendingAuth(state: string): void {
  pendingAuth.delete(state);
}
