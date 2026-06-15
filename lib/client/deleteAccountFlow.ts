import {
  deleteAccountApi,
  fetchAuthMe,
  type AuthMeResponse,
} from "@/lib/client/authApi";
import { ensureGhostSession } from "@/lib/client/ghostClient";
import { clearLocalAppData } from "@/lib/storage/clearLocalData";

export class DeleteAccountOfflineError extends Error {
  readonly code = "OFFLINE" as const;

  constructor() {
    super("OFFLINE");
    this.name = "DeleteAccountOfflineError";
  }
}

export type DeleteAccountFlowDeps = {
  isOnline?: () => boolean;
  fetchAuthMe?: () => Promise<AuthMeResponse>;
  ensureGhostSession?: () => Promise<void>;
  deleteAccountApi?: (useUserApi: boolean) => Promise<void>;
  clearLocalAppData?: () => Promise<void>;
};

export async function resolveDeleteUsesUserApi(
  fetchMe: () => Promise<AuthMeResponse> = fetchAuthMe,
): Promise<boolean> {
  const me = await fetchMe();
  return me.user != null;
}

export async function deleteAccountAndLocalData(
  deps: DeleteAccountFlowDeps = {},
): Promise<void> {
  const isOnline =
    deps.isOnline ??
    (() => typeof navigator !== "undefined" && navigator.onLine);
  const fetchMe = deps.fetchAuthMe ?? fetchAuthMe;
  const ensureGhost =
    deps.ensureGhostSession ?? (() => ensureGhostSession());
  const deleteApi = deps.deleteAccountApi ?? deleteAccountApi;
  const clearLocal = deps.clearLocalAppData ?? clearLocalAppData;

  if (!isOnline()) {
    throw new DeleteAccountOfflineError();
  }

  const useUserApi = await resolveDeleteUsesUserApi(fetchMe);

  if (!useUserApi) {
    await ensureGhost();
  }

  await deleteApi(useUserApi);
  await clearLocal();
}

export function isDeleteAccountOfflineError(
  err: unknown,
): err is DeleteAccountOfflineError {
  return err instanceof DeleteAccountOfflineError;
}
