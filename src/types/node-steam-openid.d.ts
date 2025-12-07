// src/types/node-steam-openid.d.ts
// Type declarations for node-steam-openid

declare module 'node-steam-openid' {
  interface SteamAuthOptions {
    realm: string;
    returnUrl: string;
    apiKey: string;
  }

  interface SteamAvatar {
    small?: string;
    medium?: string;
    large?: string;
  }

  interface SteamUserResponse {
    steamid: string;
    username?: string;
    name?: string;
    avatar?: SteamAvatar;
    profileUrl?: string;
  }

  class SteamAuth {
    constructor(options: SteamAuthOptions);
    getRedirectUrl(): Promise<string>;
    authenticate(req: unknown): Promise<SteamUserResponse>;
  }

  export default SteamAuth;
}
