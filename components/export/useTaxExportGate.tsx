"use client";

import { useState } from "react";
import type { Receipt } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import {
  fetchSeasonPaid,
  pollEntitlementReady,
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
  onSignInWithGoogle: () => Promise<{ user: GoogleUser; taxRecalcQueued: number }>;
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
  onSignInWithGoogle,
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

  const handleGoogleSuccess = async () => {
    const { taxRecalcQueued } = await onSignInWithGoogle();
    await onPostLoginSync?.(taxRecalcQueued);
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
          onSuccess={handleGoogleSuccess}
          onFailure={(msg) => {
            setErrorMessage(msg);
            setGoogleSheet(null);
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
          receipts={receipts}
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
