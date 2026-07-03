import {
  deleteAccountApi,
  fetchAuthMe,
  type AuthMeResponse,
} from "@/lib/client/authApi";
import { type GoogleUser, loadGoogleUser } from "@/lib/client/authStorage";
import { ensureGhostSession } from "@/lib/client/ghostClient";
import { clearLocalAppData } from "@/lib/storage/clearLocalData";

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

export type DeleteAccountRoute = "user" | "ghost";

export type DeleteAccountFlowDeps = {
  isOnline?: () => boolean;
  fetchAuthMe?: () => Promise<AuthMeResponse>;
  loadGoogleUser?: () => GoogleUser | null;
  ensureGhostSession?: () => Promise<void>;
  deleteAccountApi?: (useUserApi: boolean) => Promise<void>;
  clearLocalAppData?: () => Promise<void>;
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
  const deleteApi = deps.deleteAccountApi ?? deleteAccountApi;
  const clearLocal = deps.clearLocalAppData ?? clearLocalAppData;

  if (!isOnline()) {
    throw new DeleteAccountOfflineError();
  }

  const route = await resolveDeleteRoute(fetchMe, readGoogleUser);

  if (route === "ghost") {
    await ensureGhost();
  }

  await deleteApi(route === "user");
  await clearLocal();
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
