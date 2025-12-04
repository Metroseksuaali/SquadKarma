// src/modules/auth/auth.service.ts
// Steam authentication business logic

import SteamAuth from 'node-steam-openid';
import { prisma } from '../../db/client.js';
import { env } from '../../config/env.js';
import type { SteamUser, SessionUser } from './auth.types.js';

// Initialize Steam OpenID client
const steam = new SteamAuth({
  realm: env.STEAM_REALM,
  returnUrl: env.STEAM_RETURN_URL,
  apiKey: env.STEAM_API_KEY,
});

/**
 * Get the Steam login redirect URL
 */
export async function getRedirectUrl(): Promise<string> {
  return steam.getRedirectUrl();
}

/**
 * Authenticate user from Steam callback
 * Creates or updates user in database
 */
export async function authenticateUser(
  req: unknown
): Promise<SessionUser> {
  // Authenticate with Steam
  const steamUser = await steam.authenticate(req) as SteamUser;

  // Create or update user in database
  const user = await prisma.user.upsert({
    where: { steam64: steamUser.steamid },
    update: {
      displayName: steamUser.username || steamUser.name,
      avatarUrl: steamUser.avatar?.large || steamUser.avatar?.medium || null,
      lastLogin: new Date(),
    },
    create: {
      steam64: steamUser.steamid,
      displayName: steamUser.username || steamUser.name,
      avatarUrl: steamUser.avatar?.large || steamUser.avatar?.medium || null,
    },
  });

  return {
    id: user.id,
    steam64: user.steam64,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isBanned: user.isBanned,
  };
}

/**
 * Get user by Steam64 ID
 */
export async function getUserBySteam64(
  steam64: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { steam64 },
  });

  if (!user) return null;

  return {
    id: user.id,
    steam64: user.steam64,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isBanned: user.isBanned,
  };
}
