/**
 * Formats a UTC ISO string to a readable string in Spanish for the Venezuela timezone (UTC-5).
 * Uses Intl.DateTimeFormat with America/Caracas for accurate timezone conversion.
 */
export function formatUtcMinus5(dateUtc: string | Date): string {
  const date: Date = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;

  return new Intl.DateTimeFormat('es-VE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Caracas'
  }).format(date);
}

/**
 * Converts a UTC ISO string to a Date object representing the moment in the Venezuela timezone (UTC-5).
 * Useful when the Date object itself must be interpreted in local time, e.g. for lock-time comparisons.
 */
export function toUtcMinus5(dateUtc: string | Date): Date {
  const date: Date = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
  const offsetMilliseconds: number = 5 * 60 * 60 * 1000;
  return new Date(date.getTime() - offsetMilliseconds);
}

/**
 * Returns the current date and time in UTC-5.
 */
export function nowUtcMinus5(): Date {
  return toUtcMinus5(new Date());
}
