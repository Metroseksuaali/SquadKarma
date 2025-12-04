// src/utils/format.ts
// Formatting utilities

/**
 * Format Steam64 ID for display
 */
export function formatSteam64(steam64: string): string {
  return steam64.replace(/(\d{4})(\d{4})(\d{4})(\d{5})/, '$1 $2 $3 $4');
}

/**
 * Format reputation ratio as percentage
 */
export function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Format seconds to human readable time
 */
export function formatCooldown(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateString);
}
