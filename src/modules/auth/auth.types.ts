// src/modules/auth/auth.types.ts
// Type definitions for Steam authentication

/**
 * User object returned by node-steam-openid
 */
export interface SteamUser {
  steamid: string;
  username: string;
  name: string;
  profile: {
    url: string;
    background?: {
      static: string | null;
      movie: string | null;
    };
  };
  avatar: {
    small: string;
    medium: string;
    large: string;
  };
  _json: Record<string, unknown>;
}

/**
 * Authenticated user stored in session
 */
export interface SessionUser {
  id: string;
  steam64: string;
  displayName: string;
  avatarUrl: string | null;
  isBanned: boolean;
}

/**
 * API response for /auth/me
 */
export interface AuthMeResponse {
  authenticated: boolean;
  user: SessionUser | null;
}

/**
 * API response for successful login
 */
export interface LoginSuccessResponse {
  message: string;
  user: SessionUser;
}
