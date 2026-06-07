import type { Actor } from "@/lib/auth/getActor";
import { maskEmail } from "@/lib/server/log/mask";
import type { LogEntry, LogModule } from "@/lib/server/log/types";

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function buildLogActor(actor: Actor | null): Pick<
  LogEntry,
  "userId" | "ghostId" | "email" | "authChannel"
> {
  if (!actor) {
    return { userId: null, ghostId: null, email: null, authChannel: null };
  }
  if (actor.kind === "user") {
    return {
      userId: actor.userId,
      ghostId: actor.ghostId ?? null,
      email: actor.email ? maskEmail(actor.email) : null,
      authChannel: "google",
    };
  }
  return {
    userId: null,
    ghostId: actor.ghostId,
    email: null,
    authChannel: null,
  };
}

export function baseLogEntry(
  module: LogModule,
  request: Request,
  actor: Actor | null,
): Pick<LogEntry, "ts" | "module" | "requestId" | "method" | "route"> &
  Pick<LogEntry, "userId" | "ghostId" | "email" | "authChannel"> {
  return {
    ts: new Date().toISOString(),
    module,
    requestId: getRequestId(request),
    method: request.method,
    route: new URL(request.url).pathname,
    ...buildLogActor(actor),
  };
}
