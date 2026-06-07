const IANA_TIME_ZONE_PATTERN = /^[A-Za-z0-9_+\/-]{1,64}$/;

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!IANA_TIME_ZONE_PATTERN.test(timeZone) || timeZone.includes("..")) {
    return false;
  }
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Parse `X-Time-Zone` from export requests; falls back to UTC. */
export function parseRequestTimeZone(header: string | null): string {
  if (!header) return "UTC";
  const trimmed = header.trim();
  return isValidIanaTimeZone(trimmed) ? trimmed : "UTC";
}

/** Browser IANA timezone (client-only). */
export function clientTimeZone(): string {
  if (typeof Intl === "undefined") return "UTC";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return tz && isValidIanaTimeZone(tz) ? tz : "UTC";
}
