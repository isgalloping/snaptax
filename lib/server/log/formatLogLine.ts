import type { LogEntry, LogMeta } from "@/lib/server/log/types";

function escapeValue(value: string): string {
  if (/[\s="\\]/.test(value)) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return value;
}

function append(parts: string[], key: string, value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === "") return;
  parts.push(`${key}=${escapeValue(String(value))}`);
}

export function formatLogLine(entry: LogEntry): string {
  const parts: string[] = [];
  append(parts, "ts", entry.ts);
  append(parts, "level", entry.level);
  append(parts, "module", entry.module);
  append(parts, "success", entry.success);
  append(parts, "durationMs", entry.durationMs);
  append(parts, "requestId", entry.requestId);
  append(parts, "method", entry.method);
  append(parts, "route", entry.route);
  append(parts, "httpStatus", entry.httpStatus);
  append(parts, "userId", entry.userId);
  append(parts, "ghostId", entry.ghostId);
  append(parts, "email", entry.email);
  append(parts, "authChannel", entry.authChannel);

  const meta: LogMeta = entry.meta ?? {};
  for (const [key, value] of Object.entries(meta)) {
    append(parts, key, value as string | number | boolean);
  }

  return parts.join(" ");
}
