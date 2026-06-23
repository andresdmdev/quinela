/**
 * Converts a UTC ISO string to a Date object representing UTC-5 (Caracas time).
 */
export function toUtcMinus5(dateUtc: string | Date): Date {
  const date: Date = typeof dateUtc === 'string' ? new Date(dateUtc) : dateUtc;
  const utcTimestamp: number = date.getTime();
  const offsetMilliseconds: number = 5 * 60 * 60 * 1000;
  return new Date(utcTimestamp - offsetMilliseconds);
}

/**
 * Formats a date to a readable string in Spanish for the Venezuela timezone.
 */
export function formatUtcMinus5(dateUtc: string | Date): string {
  const date: Date = toUtcMinus5(dateUtc);
  return date.toLocaleString('es-VE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

/**
 * Returns the current date and time in UTC-5.
 */
export function nowUtcMinus5(): Date {
  return toUtcMinus5(new Date());
}
