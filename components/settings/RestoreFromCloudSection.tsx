"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GoogleUser } from "@/lib/client/authStorage";
import type { GoogleAuthResponse } from "@/lib/client/authApi";
import { fetchSeasonPaid } from "@/lib/client/authApi";
import { restoreReceiptsFromCloud } from "@/lib/client/cloudRestoreFlow";
import { GoogleSignInSheet } from "@/components/auth/GoogleSignInSheet";
import { SyncInstructionsSheet } from "@/components/auth/SyncInstructionsSheet";
import { settingsVisual } from "@/lib/ui/settingsVisual";

type RestoreState = "idle" | "restoring" | "success" | "error";

interface RestoreFromCloudSectionProps {
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  currentSeason: string;
  onUserSignedIn?: (result: GoogleAuthResponse) => void;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
  onRestored?: () => void | Promise<void>;
  onPaymentRequired?: () => void;
}

function CloudRestoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 shrink-0 text-zinc-300"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9M9 18l3 3 3-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RestoreFromCloudSection({
  googleUser,
  seasonPaid,
  currentSeason,
  onUserSignedIn,
  onPostLoginSync,
  onRestored,
  onPaymentRequired,
}: RestoreFromCloudSectionProps) {
  const [state, setState] = useState<RestoreState>("idle");
  const [restoredCount, setRestoredCount] = useState(0);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator !== "undefined" && navigator.onLine,
  );
  const [showGoogleSheet, setShowGoogleSheet] = useState(false);
  const [syncInstructionsEmail, setSyncInstructionsEmail] = useState<string | null>(
    null,
  );
  const signedInEmailRef = useRef<string | null>(null);

  useEffect(() => {
    const syncOnline = () =>
      setIsOnline(typeof navigator !== "undefined" && navigator.onLine);
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  const ensureSeasonPaid = useCallback(async (): Promise<boolean> => {
    if (seasonPaid) return true;
    if (navigator.onLine) {
      const paid = await fetchSeasonPaid(currentSeason).catch(() => false);
      if (paid) return true;
    }
    onPaymentRequired?.();
    return false;
  }, [currentSeason, onPaymentRequired, seasonPaid]);

  const runRestore = useCallback(async () => {
    if (!isOnline || state === "restoring") return;

    setState("restoring");
    setRestoredCount(0);

    try {
      const { restoredCount: count } = await restoreReceiptsFromCloud({
        downloadImages: true,
        onProgress: () => {},
      });
      setRestoredCount(count);
      setState("success");
      await onRestored?.();
    } catch (err) {
      if (err instanceof Error && err.message === "PAYMENT_REQUIRED") {
        onPaymentRequired?.();
        setState("idle");
        return;
      }
      setState("error");
    }
  }, [isOnline, onPaymentRequired, onRestored, state]);

  const handleRestoreTap = useCallback(() => {
    if (!isOnline || state === "restoring") return;
    if (!googleUser) {
      setShowGoogleSheet(true);
      return;
    }
    void (async () => {
      if (!(await ensureSeasonPaid())) return;
      await runRestore();
    })();
  }, [ensureSeasonPaid, googleUser, isOnline, runRestore, state]);

  const handleGoogleSuccess = async (result: { taxRecalcQueued: number }) => {
    await onPostLoginSync?.(result.taxRecalcQueued);
    setShowGoogleSheet(false);
    if (!(await ensureSeasonPaid())) return;
    const email = signedInEmailRef.current;
    signedInEmailRef.current = null;
    if (email) {
      showSyncInstructions(email);
    }
  };

  const handleUserSignedIn = (result: GoogleAuthResponse) => {
    onUserSignedIn?.(result);
    signedInEmailRef.current = result.user.email;
  };

  const showSyncInstructions = (email: string) => {
    setSyncInstructionsEmail(email);
  };

  const statusMessage =
    !isOnline
      ? "Go online to restore"
      : state === "restoring"
        ? "Restoring…"
        : state === "success"
          ? `Restored ${restoredCount} receipts`
          : state === "error"
            ? "Restore failed. Try again."
            : null;

  const buttonDisabled = !isOnline || state === "restoring";

  return (
    <section className="mb-4">
      <p className={settingsVisual.sectionHeading}>Data &amp; sync</p>
      <div className={settingsVisual.preferences.container}>
        <button
          type="button"
          disabled={buttonDisabled}
          onClick={handleRestoreTap}
          className={`${settingsVisual.preferences.row} disabled:opacity-60`}
        >
          <CloudRestoreIcon />
          <span className="min-w-0 flex-1 text-sm font-bold text-white">
            Restore from cloud
          </span>
        </button>

        {statusMessage && (
          <p
            className={`border-t border-zinc-800 px-4 py-3 text-center text-sm font-bold ${
              state === "error" ? "text-red-500" : "text-yellow-400"
            }`}
            role="status"
          >
            {statusMessage}
          </p>
        )}
      </div>

      {showGoogleSheet && (
        <GoogleSignInSheet
          mode="hard-sync"
          onClose={() => setShowGoogleSheet(false)}
          onUserSignedIn={handleUserSignedIn}
          onSuccess={handleGoogleSuccess}
        />
      )}

      {syncInstructionsEmail && (
        <SyncInstructionsSheet
          email={syncInstructionsEmail}
          onClose={() => setSyncInstructionsEmail(null)}
        />
      )}
    </section>
  );
}
