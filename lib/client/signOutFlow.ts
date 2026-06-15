import { signOutApi } from "@/lib/client/authApi";
import { ensureGhostSession } from "@/lib/client/ghostClient";

export class SignOutOfflineError extends Error {
  readonly code = "OFFLINE" as const;

  constructor() {
    super("OFFLINE");
    this.name = "SignOutOfflineError";
  }
}

export type SignOutFlowDeps = {
  isOnline?: () => boolean;
  signOutApi?: () => Promise<void>;
  ensureGhostSession?: () => Promise<void>;
};

export async function signOutAndResetSession(
  deps: SignOutFlowDeps = {},
): Promise<void> {
  const isOnline =
    deps.isOnline ??
    (() => typeof navigator !== "undefined" && navigator.onLine);
  const signOut = deps.signOutApi ?? signOutApi;
  const ensureGhost =
    deps.ensureGhostSession ?? (() => ensureGhostSession());

  if (!isOnline()) {
    throw new SignOutOfflineError();
  }

  await signOut();
  await ensureGhost();
}

export function isSignOutOfflineError(
  err: unknown,
): err is SignOutOfflineError {
  return err instanceof SignOutOfflineError;
}
