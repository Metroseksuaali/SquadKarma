// src/utils/steam.ts
// Steam-related utility functions

/**
 * Validates a Steam64 ID format
 * Steam64 IDs are 17-digit numbers starting with 7656119
 */
export function isValidSteam64(steam64: string): boolean {
  if (!/^\d{17}$/.test(steam64)) {
    return false;
  }
  return steam64.startsWith('7656119');
}

/**
 * Extracts Steam64 ID from a Steam profile URL
 * Supports: 
 * - https://steamcommunity.com/profiles/76561198012345678
 * - https://steamcommunity.com/id/customname (requires API lookup)
 */
export function extractSteam64FromUrl(url: string): string | null {
  const profileMatch = url.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch) {
    return profileMatch[1];
  }
  return null;
}

/**
 * Formats a Steam64 ID for display (adds spaces for readability)
 */
export function formatSteam64(steam64: string): string {
  return steam64.replace(/(\d{4})(\d{4})(\d{4})(\d{5})/, '$1 $2 $3 $4');
}
