"use client";

import { useState } from "react";
import type { Industry } from "@/lib/types";
import { INDUSTRIES } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import { exportTaxPack, fetchSeasonPaid } from "@/lib/client/authApi";
import { apiFetch } from "@/lib/client/ghostClient";
import { AccountStatusBlock } from "@/components/auth/AccountStatusBlock";
import { GoogleSignInSheet, type GoogleSignInMode } from "@/components/auth/GoogleSignInSheet";
import { SyncInstructionsSheet } from "@/components/auth/SyncInstructionsSheet";
import { PrivacyDataSection } from "@/components/settings/PrivacyDataSection";
import { PaywallSheet } from "@/components/settings/PaywallSheet";

interface SettingsScreenProps {
  industry: Industry | null;
  onIndustryChange: (industry: Industry) => void;
  onBack: () => void;
  onLocalDataCleared?: () => void;
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  currentSeason: string;
  isSignedIn: boolean;
  onSignInWithGoogle: () => Promise<{ user: GoogleUser; taxRecalcQueued: number }>;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
  onSeasonPaid: () => void;
  refreshSeasonPaid?: () => Promise<void>;
}

export function SettingsScreen({
  industry,
  onIndustryChange,
  onBack,
  onLocalDataCleared,
  googleUser,
  seasonPaid,
  currentSeason,
  isSignedIn,
  onSignInWithGoogle,
  onPostLoginSync,
  onSeasonPaid,
  refreshSeasonPaid,
}: SettingsScreenProps) {
  const [googleSheet, setGoogleSheet] = useState<GoogleSignInMode | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSyncHelp, setShowSyncHelp] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingAfterSignIn, setPendingAfterSignIn] = useState<
    "export" | "sync" | null
  >(null);

  const clearError = () => setErrorMessage(null);

  const shareExportFile = async () => {
    const file = await exportTaxPack(currentSeason);
    if (navigator.share) {
      await navigator
        .share({
          files: [file],
          title: `Snap1099 Tax Pack ${currentSeason}`,
          text: "Your IRS-ready expense export",
        })
        .catch(() => {});
    } else {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const runAfterGoogleSignIn = async (action: "export" | "sync") => {
    if (action === "export") {
      const paid = await fetchSeasonPaid(currentSeason).catch(() => seasonPaid);
      if (paid) {
        try {
          await shareExportFile();
        } catch {
          setErrorMessage("Export failed. Please try again.");
        }
      } else {
        setShowPaywall(true);
      }
    } else {
      setShowSyncHelp(true);
    }
  };

  const handleGoogleSuccess = async () => {
    const { taxRecalcQueued } = await onSignInWithGoogle();
    await onPostLoginSync?.(taxRecalcQueued);
    setGoogleSheet(null);
    if (pendingAfterSignIn) {
      await runAfterGoogleSignIn(pendingAfterSignIn);
      setPendingAfterSignIn(null);
    }
  };

  const requireGoogle = (mode: GoogleSignInMode, after: "export" | "sync") => {
    clearError();
    if (googleUser) {
      void runAfterGoogleSignIn(after);
      return;
    }
    setPendingAfterSignIn(after);
    setGoogleSheet(mode);
  };

  const handleViewAllDevices = () => {
    requireGoogle("hard-sync", "sync");
  };

  const handleExport = () => {
    requireGoogle("hard-export", "export");
  };

  const handleExportAgain = async () => {
    clearError();
    try {
      await shareExportFile();
    } catch (err) {
      if (err instanceof Error && err.message === "PAYMENT_REQUIRED") {
        setShowPaywall(true);
      } else {
        setErrorMessage("Export failed. Please try again.");
      }
    }
  };

  const handleIndustryChange = async (value: Industry) => {
    onIndustryChange(value);
    if (isSignedIn && navigator.onLine) {
      await apiFetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: value }),
      }).catch(() => {});
    }
  };

  return (
    <div className="flex h-full flex-col bg-black text-white">
      <header className="flex items-center border-b-4 border-yellow-500 bg-zinc-900 p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-16 min-w-16 items-center justify-center rounded-xl border-2 border-zinc-600 bg-zinc-800 px-4 text-sm font-black uppercase tracking-wider transition-transform active:scale-95"
        >
          &lt; BACK
        </button>
        <h1 className="ml-4 text-lg font-black uppercase tracking-wider">
          Settings
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <AccountStatusBlock
          googleUser={googleUser}
          seasonPaid={seasonPaid}
          seasonLabel={currentSeason}
          onSignIn={() => {
            clearError();
            setGoogleSheet("soft");
          }}
        />

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            Your Industry
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {INDUSTRIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void handleIndustryChange(item.id)}
                className={`min-h-16 rounded-xl border-2 p-4 text-left text-sm font-bold transition-transform active:scale-95 ${
                  industry === item.id
                    ? "border-yellow-500 bg-yellow-950 text-yellow-400"
                    : "border-zinc-600 bg-zinc-800 text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            Multi-Device
          </h2>
          <button
            type="button"
            onClick={handleViewAllDevices}
            className="w-full min-h-16 rounded-xl border-2 border-zinc-600 bg-zinc-800 p-4 text-left text-sm font-bold text-white transition-transform active:scale-95"
          >
            View on All Devices
          </button>
        </section>

        <PrivacyDataSection
          isSignedIn={isSignedIn}
          onLocalDataCleared={onLocalDataCleared}
        />

        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
            Tax Season Export
          </h2>
          <button
            type="button"
            onClick={seasonPaid ? () => void handleExportAgain() : handleExport}
            className="w-full min-h-16 rounded-xl border-4 border-white bg-yellow-500 py-4 text-lg font-black uppercase tracking-wider text-black transition-transform active:scale-95"
          >
            {seasonPaid ? "Export Again" : "Export IRS Tax Pack"}
          </button>
        </section>

        {errorMessage && (
          <p className="mt-4 text-center text-sm font-bold text-red-500" role="alert">
            {errorMessage}
          </p>
        )}
      </div>

      {googleSheet && (
        <GoogleSignInSheet
          mode={googleSheet}
          onClose={() => {
            setGoogleSheet(null);
            setPendingAfterSignIn(null);
          }}
          onSuccess={handleGoogleSuccess}
          onFailure={(msg) => {
            setErrorMessage(msg);
            setGoogleSheet(null);
            setPendingAfterSignIn(null);
          }}
        />
      )}

      {showPaywall && googleUser && (
        <PaywallSheet
          seasonLabel={currentSeason}
          userId={googleUser.email}
          onClose={() => setShowPaywall(false)}
          onPaid={async () => {
            onSeasonPaid();
            setShowPaywall(false);
            try {
              await shareExportFile();
            } catch {
              setErrorMessage("Export failed after payment. Try Export Again.");
            }
          }}
        />
      )}

      {showSyncHelp && googleUser && (
        <SyncInstructionsSheet
          email={googleUser.email}
          onClose={() => setShowSyncHelp(false)}
        />
      )}
    </div>
  );
}
