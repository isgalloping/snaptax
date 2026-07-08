"use client";

import { useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import { isSeasonPaid, setSeasonPaid } from "@/lib/client/authStorage";
import {
  fetchSeasonPaid,
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
import { markExportBlockedBanner } from "@/lib/settings/exportSampleState";
import { markSeasonExportDone } from "@/lib/settings/seasonExportState";
import type { IncomeCaptureKind } from "@/lib/export/incomeCapture";
import type { ExportFormat } from "@/lib/export/exportFilenames";

interface UseTaxExportGateOptions {
  receipts: Receipt[];
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  currentSeason: string;
  onUserSignedIn?: (result: GoogleAuthResponse) => void;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
  onSeasonPaid: () => void;
  refreshSeasonPaid?: () => Promise<void>;
  /** Gate open: flush + local IDB (default path for local-first export). */
  onExportGatePrepare?: () => Promise<Receipt[] | void>;
  /** Generate step: format-aware prep before building the pack. */
  onPreExportPrepare?: (format: ExportFormat) => Promise<Receipt[] | void>;
  onPostExportSync?: () => Promise<void>;
  onReceiptUpdated?: (receipt: Receipt) => void;
  onSnap1099?: (kind: IncomeCaptureKind) => void;
  onExportPaymentComplete?: () => void;
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
  onExportGatePrepare,
  onPreExportPrepare,
  onPostExportSync,
  onReceiptUpdated,
  onSnap1099,
  onExportPaymentComplete,
}: UseTaxExportGateOptions) {
  const { copy } = useI18n();
  const [googleSheet, setGoogleSheet] = useState<GoogleSignInMode | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [exportEngineReceipts, setExportEngineReceipts] = useState<Receipt[] | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportEmptyTip, setExportEmptyTip] = useState<string | null>(null);
  const [exportEmptyTipKey, setExportEmptyTipKey] = useState(0);
  const [paywallExporting, setPaywallExporting] = useState(false);
  const [preparingExport, setPreparingExport] = useState(false);
  const [exportBlockedTick, setExportBlockedTick] = useState(0);

  const clearError = () => setErrorMessage(null);

  const clearExportEmptyTip = () => setExportEmptyTip(null);

  const showExportEmptyTip = (message: string) => {
    setErrorMessage(null);
    setExportEmptyTip(message);
    setExportEmptyTipKey((key) => key + 1);
  };

  const openExportEngine = (receiptsOverride?: Receipt[]) => {
    clearError();
    setExportEngineReceipts(receiptsOverride ?? null);
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
    if (!onExportGatePrepare && !onPreExportPrepare) {
      if (blockIfNoExportableReceipts()) return;
      openExportEngine();
      return;
    }
    setPreparingExport(true);
    try {
      const prepared = onExportGatePrepare
        ? await onExportGatePrepare()
        : await onPreExportPrepare!("csv");
      if (blockIfNoExportableReceipts(prepared)) return;
      const list = (prepared ?? exportableReceipts).filter(
        (r) => !r.isOnboardingDemo,
      );
      openExportEngine(list);
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

  const handleExportReceiptUpdated = (updated: Receipt) => {
    setExportEngineReceipts((prev) =>
      prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev,
    );
    onReceiptUpdated?.(updated);
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
          onDismissWithoutPay={() => {
            markExportBlockedBanner();
            setExportBlockedTick((tick) => tick + 1);
          }}
          onClose={() => setShowPaywall(false)}
          onPaid={() => {
            onSeasonPaid();
            onExportPaymentComplete?.();
          }}
        />
      )}

      {showExportSheet && (
        <ExportEngineSheet
          receipts={exportEngineReceipts ?? exportableReceipts}
          currentSeason={currentSeason}
          onClose={() => {
            setShowExportSheet(false);
            setExportEngineReceipts(null);
          }}
          onPreExportPrepare={onPreExportPrepare}
          onExported={async () => {
            markSeasonExportDone(currentSeason);
            await refreshSeasonPaid?.();
            await onPostExportSync?.();
          }}
          onPaymentRequired={() => {
            setShowPaywall(true);
          }}
          onReceiptUpdated={handleExportReceiptUpdated}
          onSnap1099={(kind) => {
            setShowExportSheet(false);
            onSnap1099?.(kind);
          }}
        />
      )}
    </>
  );

  return {
    requestExport: () => void runExportGate(),
    triggerExportAfterPayment: () => void openExportAfterPrepare(),
    exportError: errorMessage,
    exportEmptyTip,
    exportEmptyTipKey,
    clearExportEmptyTip,
    paywallExporting,
    preparingExport,
    exportBlockedTick,
    overlays,
  };
}
