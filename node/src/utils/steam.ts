/**
 * Steam64 ID validation and utility functions
 */

/**
 * Validates a Steam64 ID
 *
 * Steam64 IDs are 17-digit numbers that start with "7656119"
 *
 * @param steam64 - The Steam64 ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidSteam64(steam64: string): boolean {
  // Must be exactly 17 digits
  if (!/^\d{17}$/.test(steam64)) {
    return false;
  }

  // Must start with 7656119
  if (!steam64.startsWith('7656119')) {
    return false;
  }

  return true;
}

/**
 * Extract Steam64 from various Steam URL formats
 *
 * Supports:
 * - https://steamcommunity.com/profiles/76561198012345678
 * - https://steamcommunity.com/id/username (requires API call - not implemented)
 * - Direct Steam64 ID
 *
 * @param input - Steam URL or Steam64 ID
 * @returns Steam64 ID or null if not found/invalid
 */
export function extractSteam64(input: string): string | null {
  // Clean up input
  const cleaned = input.trim();

  // Check if it's already a valid Steam64 ID
  if (isValidSteam64(cleaned)) {
    return cleaned;
  }

  // Try to extract from Steam profile URL
  const profileMatch = cleaned.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profileMatch && profileMatch[1]) {
    const steam64 = profileMatch[1];
    if (isValidSteam64(steam64)) {
      return steam64;
    }
  }

  return null;
}

/**
 * Format Steam64 for display
 * Returns the ID with spaces for readability: "7656 1198 0123 45678"
 */
export function formatSteam64(steam64: string): string {
  if (!isValidSteam64(steam64)) {
    return steam64;
  }

  return steam64.replace(/(\d{4})(\d{4})(\d{4})(\d{5})/, '$1 $2 $3 $4');
}

/**
 * Get Steam Community profile URL from Steam64
 */
export function getSteamProfileUrl(steam64: string): string {
  return `https://steamcommunity.com/profiles/${steam64}`;
}

/**
 * Steam64 validation error messages
 */
export const Steam64Errors = {
  INVALID_FORMAT: 'Steam64 ID must be a 17-digit number',
  INVALID_PREFIX: 'Steam64 ID must start with 7656119',
  NOT_FOUND: 'Could not extract Steam64 ID from input',
} as const;
