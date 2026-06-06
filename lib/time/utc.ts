/**
 * UTC time helpers — canonical for persistence and API payloads.
 * DB: TIMESTAMPTZ(3). IndexedDB/API: ISO 8601 with Z.
 * Display: use local timezone in formatters only (e.g. formatReceiptTime).
 */

/** Current instant. JS Date is UTC internally; use this instead of bare `new Date()`. */
export function utcNow(): Date {
  return new Date();
}

/** ISO 8601 UTC string with milliseconds, e.g. `2026-06-05T11:30:00.000Z`. */
export function toUtcISOString(date: Date = utcNow()): string {
  return date.toISOString();
}

const UTC_ISO_PATTERN = /(?:Z|[+-]\d{2}:\d{2})$/;

/** Parse ISO 8601 string that includes UTC `Z` or explicit offset. */
export function parseUtcISOString(iso: string): Date {
  const trimmed = iso.trim();
  if (!UTC_ISO_PATTERN.test(trimmed)) {
    throw new Error(`Expected UTC ISO 8601 with timezone suffix: ${iso}`);
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${iso}`);
  }
  return date;
}

/** Milliseconds offset from now (negative = past). */
export function utcDaysAgo(days: number): Date {
  return new Date(utcNow().getTime() - days * 86_400_000);
}
