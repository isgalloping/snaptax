"use client";

import { useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import {
  fetchSeasonPaid,
  pollEntitlementReady,
  type GoogleAuthResponse,
} from "@/lib/client/authApi";
import {
  GoogleSignInSheet,
  type GoogleSignInMode,
} from "@/components/auth/GoogleSignInSheet";
import { PaywallSheet } from "@/components/settings/PaywallSheet";
import { ExportEngineSheet } from "@/components/export/ExportEngineSheet";
import { useI18n } from "@/components/i18n/I18nProvider";

interface UseTaxExportGateOptions {
  receipts: Receipt[];
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  currentSeason: string;
  onUserSignedIn?: (result: GoogleAuthResponse) => void;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
  onSeasonPaid: () => void;
  refreshSeasonPaid?: () => Promise<void>;
  onPostExportSync?: () => Promise<void>;
  onReceiptUpdated?: (receipt: Receipt) => void;
}

export function useTaxExportGate({
  receipts,
  googleUser,
  seasonPaid,
  currentSeason,
  onUserSignedIn,
  onPostLoginSync,
  onSeasonPaid,
  refreshSeasonPaid,
  onPostExportSync,
  onReceiptUpdated,
}: UseTaxExportGateOptions) {
  const { copy } = useI18n();
  const [googleSheet, setGoogleSheet] = useState<GoogleSignInMode | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paywallExporting, setPaywallExporting] = useState(false);

  const clearError = () => setErrorMessage(null);

  const openExportEngine = () => {
    clearError();
    setShowExportSheet(true);
  };

  const exportableReceipts = useMemo(
    () => receipts.filter((r) => !r.isOnboardingDemo),
    [receipts],
  );

  const runExportGate = async () => {
    clearError();
    if (!googleUser) {
      setGoogleSheet("hard-export");
      return;
    }
    const paid = await fetchSeasonPaid(currentSeason).catch(() => seasonPaid);
    if (paid) {
      openExportEngine();
    } else {
      setShowPaywall(true);
    }
  };

  const handleGoogleSuccess = async (result: { taxRecalcQueued: number }) => {
    await onPostLoginSync?.(result.taxRecalcQueued);
    setGoogleSheet(null);
    const paid = await fetchSeasonPaid(currentSeason).catch(() => seasonPaid);
    if (paid) {
      openExportEngine();
    } else {
      setShowPaywall(true);
    }
  };

  const overlays = (
    <>
      {googleSheet && (
        <GoogleSignInSheet
          mode={googleSheet}
          onClose={() => setGoogleSheet(null)}
          onUserSignedIn={onUserSignedIn}
          onSuccess={handleGoogleSuccess}
          onFailure={(msg) => {
            setErrorMessage(msg);
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
            setPaywallExporting(true);
            try {
              const ready = await pollEntitlementReady(currentSeason);
              if (!ready) {
                setErrorMessage(copy.settings.export.paymentConfirmed);
                return;
              }
              openExportEngine();
              refreshSeasonPaid?.();
            } catch {
              setErrorMessage(copy.settings.export.failedAfterPayment);
            } finally {
              setPaywallExporting(false);
            }
          }}
        />
      )}

      {showExportSheet && (
        <ExportEngineSheet
          receipts={exportableReceipts}
          onClose={() => setShowExportSheet(false)}
          onExported={async () => {
            await refreshSeasonPaid?.();
            await onPostExportSync?.();
          }}
          onPaymentRequired={() => {
            setShowPaywall(true);
          }}
          onReceiptUpdated={onReceiptUpdated}
        />
      )}
    </>
  );

  return {
    requestExport: () => void runExportGate(),
    exportError: errorMessage,
    paywallExporting,
    overlays,
  };
}
