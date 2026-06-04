/**
 * Format a calorie value as an integer string.
 * Returns empty string for null/undefined.
 */
export function fmtCal(value: number | null | undefined): string {
  if (value == null) return "";
  return value.toFixed(0);
}

/**
 * Format a macro gram value (protein, carbs, fat, fiber) to one decimal.
 * Returns empty string for null/undefined.
 */
export function fmtGrams(value: number | null | undefined): string {
  if (value == null) return "";
  return value.toFixed(1);
}

/**
 * Format a duration in seconds to a human-readable string.
 * e.g. 45 -> "45s", 120 -> "2 min", 125 -> "2m 5s", 3661 -> "1h 1m 1s"
 */
export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    const parts = [`${h}h`];
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.join(" ");
  }
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
}
