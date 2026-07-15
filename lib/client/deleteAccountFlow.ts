import {
  deleteAccountApi,
  fetchAuthMe,
  type AuthMeResponse,
} from "@/lib/client/authApi";
import { type GoogleUser, loadGoogleUser } from "@/lib/client/authStorage";
import {
  ensureGhostSession,
  getClientOrphanGhostPossession,
  type ClientOrphanGhostPossession,
} from "@/lib/client/ghostClient";
import {
  clearLocalAppData,
  hasPendingLocalWipe,
  markPendingLocalWipe,
} from "@/lib/storage/clearLocalData";

export class DeleteAccountOfflineError extends Error {
  readonly code = "OFFLINE" as const;

  constructor() {
    super("OFFLINE");
    this.name = "DeleteAccountOfflineError";
  }
}

export class DeleteAccountSessionExpiredError extends Error {
  readonly code = "SESSION_EXPIRED" as const;

  constructor() {
    super("SESSION_EXPIRED");
    this.name = "DeleteAccountSessionExpiredError";
  }
}

/** Cloud erase succeeded; local wipe failed — retry finishLocalWipeAfterAccountDelete. */
export class DeleteAccountLocalClearError extends Error {
  readonly code = "LOCAL_CLEAR_FAILED" as const;

  constructor() {
    super("LOCAL_CLEAR_FAILED");
    this.name = "DeleteAccountLocalClearError";
  }
}

export type DeleteAccountRoute = "user" | "ghost";

export type DeleteAccountFlowDeps = {
  isOnline?: () => boolean;
  fetchAuthMe?: () => Promise<AuthMeResponse>;
  loadGoogleUser?: () => GoogleUser | null;
  ensureGhostSession?: () => Promise<string>;
  getClientOrphanGhostPossession?: (
    currentGhostId: string,
  ) => ClientOrphanGhostPossession[];
  deleteAccountApi?: (
    useUserApi: boolean,
    orphanGhosts: ClientOrphanGhostPossession[],
  ) => Promise<void>;
  clearLocalAppData?: () => Promise<void>;
  hasPendingLocalWipe?: () => boolean;
  markPendingLocalWipe?: () => void;
  localClearAttempts?: number;
};

export async function resolveDeleteRoute(
  fetchMe: () => Promise<AuthMeResponse> = fetchAuthMe,
  readGoogleUser: () => GoogleUser | null = loadGoogleUser,
): Promise<DeleteAccountRoute> {
  const me = await fetchMe();
  if (me.user != null) return "user";
  if (readGoogleUser() != null) {
    throw new DeleteAccountSessionExpiredError();
  }
  return "ghost";
}

/** @deprecated Use resolveDeleteRoute */
export async function resolveDeleteUsesUserApi(
  fetchMe: () => Promise<AuthMeResponse> = fetchAuthMe,
): Promise<boolean> {
  const route = await resolveDeleteRoute(fetchMe, () => null);
  return route === "user";
}

async function clearLocalWithRetry(
  clearLocal: () => Promise<void>,
  attempts: number,
): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await clearLocal();
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("LOCAL_CLEAR_FAILED");
}

/** Finish device wipe when cloud delete already succeeded. */
export async function finishLocalWipeAfterAccountDelete(
  deps: Pick<DeleteAccountFlowDeps, "clearLocalAppData" | "localClearAttempts"> = {},
): Promise<void> {
  const clearLocal = deps.clearLocalAppData ?? clearLocalAppData;
  const attempts = deps.localClearAttempts ?? 3;
  try {
    await clearLocalWithRetry(clearLocal, attempts);
  } catch {
    throw new DeleteAccountLocalClearError();
  }
}

export async function deleteAccountAndLocalData(
  deps: DeleteAccountFlowDeps = {},
): Promise<void> {
  const isOnline =
    deps.isOnline ??
    (() => typeof navigator !== "undefined" && navigator.onLine);
  const fetchMe = deps.fetchAuthMe ?? fetchAuthMe;
  const readGoogleUser = deps.loadGoogleUser ?? loadGoogleUser;
  const ensureGhost =
    deps.ensureGhostSession ?? (() => ensureGhostSession());
  const readOrphans =
    deps.getClientOrphanGhostPossession ?? getClientOrphanGhostPossession;
  const deleteApi = deps.deleteAccountApi ?? deleteAccountApi;
  const clearLocal = deps.clearLocalAppData ?? clearLocalAppData;
  const checkPending = deps.hasPendingLocalWipe ?? hasPendingLocalWipe;
  const markPending = deps.markPendingLocalWipe ?? markPendingLocalWipe;
  const attempts = deps.localClearAttempts ?? 3;

  if (checkPending()) {
    await finishLocalWipeAfterAccountDelete({
      clearLocalAppData: clearLocal,
      localClearAttempts: attempts,
    });
    return;
  }

  if (!isOnline()) {
    throw new DeleteAccountOfflineError();
  }

  const me = await fetchMe();
  let route: DeleteAccountRoute;
  if (me.user != null) {
    route = "user";
  } else if (readGoogleUser() != null) {
    throw new DeleteAccountSessionExpiredError();
  } else {
    route = "ghost";
  }

  let currentGhostId = me.ghostId ?? "";
  if (route === "ghost") {
    currentGhostId = await ensureGhost();
  }

  const orphanGhosts = readOrphans(currentGhostId);

  try {
    await deleteApi(route === "user", orphanGhosts);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message === "GOOGLE_LOGIN_REQUIRED"
    ) {
      throw new DeleteAccountSessionExpiredError();
    }
    throw err;
  }

  markPending();
  try {
    await clearLocalWithRetry(clearLocal, attempts);
  } catch {
    throw new DeleteAccountLocalClearError();
  }
}

export function isDeleteAccountOfflineError(
  err: unknown,
): err is DeleteAccountOfflineError {
  return err instanceof DeleteAccountOfflineError;
}

export function isDeleteAccountSessionExpiredError(
  err: unknown,
): err is DeleteAccountSessionExpiredError {
  return err instanceof DeleteAccountSessionExpiredError;
}

export function isDeleteAccountLocalClearError(
  err: unknown,
): err is DeleteAccountLocalClearError {
  return err instanceof DeleteAccountLocalClearError;
}
