import { formatLogLine } from "@/lib/server/log/formatLogLine";
import type { LogEntry } from "@/lib/server/log/types";

export function logEvent(entry: LogEntry): void {
  console.log(formatLogLine(entry));
}
