import { AsyncLocalStorage } from "node:async_hooks";
import type { Actor } from "@/lib/auth/getActor";
import type { LogModule } from "@/lib/server/log/types";

export type RequestLogStore = {
  module: LogModule;
  request: Request;
  actor: Actor | null;
  pendingError: unknown | null;
};

const storage = new AsyncLocalStorage<RequestLogStore>();

export function runWithRequestLogContext<T>(
  store: RequestLogStore,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(store, fn);
}

export function getRequestLogStore(): RequestLogStore | undefined {
  return storage.getStore();
}

export function setPendingError(err: unknown): void {
  const store = storage.getStore();
  if (store) store.pendingError = err;
}
