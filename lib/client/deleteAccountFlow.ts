import { deleteAccountApi } from "@/lib/client/authApi";
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
  ensureGhostSession?: () => Promise<void>;
  deleteAccountApi?: (isSignedIn: boolean) => Promise<void>;
  clearLocalAppData?: () => Promise<void>;
};

export async function deleteAccountAndLocalData(
  isSignedIn: boolean,
  deps: DeleteAccountFlowDeps = {},
): Promise<void> {
  const isOnline =
    deps.isOnline ??
    (() => typeof navigator !== "undefined" && navigator.onLine);
  const ensureGhost =
    deps.ensureGhostSession ?? (() => ensureGhostSession());
  const deleteApi = deps.deleteAccountApi ?? deleteAccountApi;
  const clearLocal = deps.clearLocalAppData ?? clearLocalAppData;

  if (!isOnline()) {
    throw new DeleteAccountOfflineError();
  }

  if (!isSignedIn) {
    await ensureGhost();
  }

  await deleteApi(isSignedIn);
  await clearLocal();
}

export function isDeleteAccountOfflineError(
  err: unknown,
): err is DeleteAccountOfflineError {
  return err instanceof DeleteAccountOfflineError;
}
