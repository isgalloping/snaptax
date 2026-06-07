import type { NextRequest } from "next/server";
import { buildErrorMeta, mapErrorToResponse } from "@/lib/api/errors";
import { baseLogEntry } from "@/lib/server/log/context";
import { isDetailedErrorLogging } from "@/lib/server/log/detailLogging";
import { logEvent } from "@/lib/server/log/logEvent";
import {
  getRequestLogStore,
  runWithRequestLogContext,
} from "@/lib/server/log/requestLogContext";
import type { LogMeta, LogModule } from "@/lib/server/log/types";

type RouteContext = { params: Promise<Record<string, string>> };

type RouteHandler = (
  request: NextRequest,
  context: RouteContext,
) => Promise<Response>;

function logHttpResponse(
  module: LogModule,
  request: NextRequest,
  actor: import("@/lib/auth/getActor").Actor | null,
  response: Response,
  durationMs: number,
) {
  const status = response.status;
  const store = getRequestLogStore();
  const pendingError = store?.pendingError;
  let meta: LogMeta | undefined;

  if (status >= 500 && pendingError) {
    meta = buildErrorMeta(pendingError);
    if (isDetailedErrorLogging()) {
      const requestId = baseLogEntry(module, request, actor).requestId;
      console.error(`[requestId=${requestId}]`, pendingError);
    }
  }

  logEvent({
    ...baseLogEntry(module, request, actor),
    level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
    success: status < 400,
    durationMs,
    httpStatus: status,
    meta,
  });
}

export function withRequestLog(
  module: LogModule,
  handler: RouteHandler,
  options?: { getActor?: (req: NextRequest) => Promise<import("@/lib/auth/getActor").Actor | null> },
): RouteHandler {
  return async (request, context) => {
    const start = Date.now();
    let actor: import("@/lib/auth/getActor").Actor | null = null;

    return runWithRequestLogContext(
      { module, request, actor: null, pendingError: null },
      async () => {
        try {
          if (options?.getActor) {
            try {
              actor = await options.getActor(request);
            } catch {
              actor = null;
            }
          }
          const store = getRequestLogStore();
          if (store) store.actor = actor;

          const response = await handler(request, context);
          logHttpResponse(module, request, actor, response, Date.now() - start);
          return response;
        } catch (err) {
          const response = mapErrorToResponse(err);
          logHttpResponse(module, request, actor, response, Date.now() - start);
          return response;
        }
      },
    );
  };
}
