"use client";

import { useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import { isSeasonPaid, setSeasonPaid } from "@/lib/client/authStorage";
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
import { hasExportableReceipts } from "@/lib/tax/exportGate";

interface UseTaxExportGateOptions {
  receipts: Receipt[];
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  currentSeason: string;
  onUserSignedIn?: (result: GoogleAuthResponse) => void;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
  onSeasonPaid: () => void;
  refreshSeasonPaid?: () => Promise<void>;
  onPreExportPrepare?: () => Promise<Receipt[] | void>;
  onPostExportSync?: () => Promise<void>;
  onReceiptUpdated?: (receipt: Receipt) => void;
}

export function useTaxExportGate({
  receipts,
  googleUser,
  seasonPaid: _seasonPaid,
  currentSeason,
  onUserSignedIn,
  onPostLoginSync,
  onSeasonPaid,
  refreshSeasonPaid,
  onPreExportPrepare,
  onPostExportSync,
  onReceiptUpdated,
}: UseTaxExportGateOptions) {
  const { copy } = useI18n();
  const [googleSheet, setGoogleSheet] = useState<GoogleSignInMode | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportEmptyTip, setExportEmptyTip] = useState<string | null>(null);
  const [exportEmptyTipKey, setExportEmptyTipKey] = useState(0);
  const [paywallExporting, setPaywallExporting] = useState(false);
  const [preparingExport, setPreparingExport] = useState(false);

  const clearError = () => setErrorMessage(null);

  const clearExportEmptyTip = () => setExportEmptyTip(null);

  const showExportEmptyTip = (message: string) => {
    setErrorMessage(null);
    setExportEmptyTip(message);
    setExportEmptyTipKey((key) => key + 1);
  };

  const openExportEngine = () => {
    clearError();
    setShowExportSheet(true);
  };

  const exportableReceipts = useMemo(
    () => receipts.filter((r) => !r.isOnboardingDemo),
    [receipts],
  );

  const blockIfNoExportableReceipts = (prepared?: Receipt[] | void) => {
    const list = prepared !== undefined ? prepared : exportableReceipts;
    const exportable = list.filter((r) => !r.isOnboardingDemo);
    if (!hasExportableReceipts(exportable)) {
      showExportEmptyTip(copy.exportEngine.noDeductibleReceipts);
      return true;
    }
    return false;
  };

  const resolveSeasonPaid = async (): Promise<boolean> => {
    if (navigator.onLine) {
      const paid = await fetchSeasonPaid(currentSeason).catch(() => false);
      setSeasonPaid(currentSeason, paid);
      return paid;
    }
    return isSeasonPaid(currentSeason);
  };

  const openExportAfterPrepare = async () => {
    if (!onPreExportPrepare) {
      if (blockIfNoExportableReceipts()) return;
      openExportEngine();
      return;
    }
    setPreparingExport(true);
    try {
      const prepared = await onPreExportPrepare();
      if (blockIfNoExportableReceipts(prepared)) return;
      openExportEngine();
    } catch (err) {
      if (err instanceof Error && err.message === "EXPORT_OFFLINE") {
        setErrorMessage(copy.settings.export.offline);
      } else {
        setErrorMessage(copy.settings.export.failed);
      }
    } finally {
      setPreparingExport(false);
    }
  };

  const runExportGate = async () => {
    clearError();
    clearExportEmptyTip();
    if (!googleUser) {
      setGoogleSheet("hard-export");
      return;
    }
    const paid = await resolveSeasonPaid();
    if (paid) {
      await openExportAfterPrepare();
    } else {
      setShowPaywall(true);
    }
  };

  const handleGoogleSuccess = async (result: { taxRecalcQueued: number }) => {
    await onPostLoginSync?.(result.taxRecalcQueued);
    setGoogleSheet(null);
    const paid = await resolveSeasonPaid();
    if (paid) {
      await openExportAfterPrepare();
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
            setPaywallExporting(true);
            try {
              await pollEntitlementReady(currentSeason, 30_000);
              setShowPaywall(false);
              await openExportAfterPrepare();
              await refreshSeasonPaid?.();
            } catch {
              setShowPaywall(false);
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
          onPreExportPrepare={onPreExportPrepare}
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
    exportEmptyTip,
    exportEmptyTipKey,
    clearExportEmptyTip,
    paywallExporting,
    preparingExport,
    overlays,
  };
}
