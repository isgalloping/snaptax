import type { NextRequest } from "next/server";
import { baseLogEntry } from "@/lib/server/log/context";
import { logEvent } from "@/lib/server/log/logEvent";
import type { LogMeta, LogModule } from "@/lib/server/log/types";

type RouteContext = { params: Promise<Record<string, string>> };

type RouteHandler = (
  request: NextRequest,
  context: RouteContext,
) => Promise<Response>;

export function withRequestLog(
  module: LogModule,
  handler: RouteHandler,
  options?: { getActor?: (req: NextRequest) => Promise<import("@/lib/auth/getActor").Actor | null> },
): RouteHandler {
  return async (request, context) => {
    const start = Date.now();
    let actor: import("@/lib/auth/getActor").Actor | null = null;
    try {
      if (options?.getActor) {
        try {
          actor = await options.getActor(request);
        } catch {
          actor = null;
        }
      }
      const response = await handler(request, context);
      const status = response.status;
      logEvent({
        ...baseLogEntry(module, request, actor),
        level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
        success: status < 400,
        durationMs: Date.now() - start,
        httpStatus: status,
      });
      return response;
    } catch (err) {
      logEvent({
        ...baseLogEntry(module, request, actor),
        level: "error",
        success: false,
        durationMs: Date.now() - start,
        httpStatus: 500,
        meta: {
          errorCode: "INTERNAL",
          errorMessage:
            err instanceof Error ? err.message.slice(0, 120) : "unknown",
        } satisfies LogMeta,
      });
      throw err;
    }
  };
}
