"use client";

import { useMemo, useState } from "react";
import type { Receipt } from "@/lib/types";
import type { GoogleUser } from "@/lib/client/authStorage";
import { setSeasonPaid } from "@/lib/client/authStorage";
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
import {
  realExportReceipts,
  resolveTaxExportGateAction,
} from "@/lib/tax/exportGate";
import { markExportBlockedBanner } from "@/lib/settings/exportSampleState";
import { markSeasonExportDone } from "@/lib/settings/seasonExportState";
import type { IncomeCaptureKind } from "@/lib/export/incomeCapture";
import type { ExportFormat } from "@/lib/export/exportFilenames";
import type { TaxRegion } from "@/lib/tax/types";

interface UseTaxExportGateOptions {
  receipts: Receipt[];
  googleUser: GoogleUser | null;
  seasonPaid: boolean;
  currentSeason: string;
  userLockedRegion?: TaxRegion | null;
  onUserSignedIn?: (result: GoogleAuthResponse) => void;
  onPostLoginSync?: (taxRecalcQueued: number) => Promise<void>;
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
  userLockedRegion = null,
  onUserSignedIn,
  onPostLoginSync,
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
    const decision = resolveTaxExportGateAction({
      receipts: exportableReceipts,
      preparedReceipts: prepared,
      googleUserPresent: Boolean(googleUser),
      seasonPaid: false,
    });
    if (decision.kind === "empty") {
      showExportEmptyTip(copy.exportEngine.noDeductibleReceipts);
      return true;
    }
    return false;
  };

  const resolveSeasonPaid = async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    const paid = await fetchSeasonPaid(currentSeason).catch(() => false);
    setSeasonPaid(currentSeason, paid);
    return paid;
  };

  const prepareExportReceipts = async (): Promise<Receipt[] | undefined> => {
    if (onExportGatePrepare) {
      return (await onExportGatePrepare()) ?? undefined;
    }
    if (onPreExportPrepare) {
      return (await onPreExportPrepare("csv")) ?? undefined;
    }
    return undefined;
  };

  const finishExportGate = async (prepared?: Receipt[] | void) => {
    const preAuthDecision = resolveTaxExportGateAction({
      receipts: exportableReceipts,
      preparedReceipts: prepared,
      googleUserPresent: Boolean(googleUser),
      seasonPaid: false,
    });
    if (preAuthDecision.kind === "empty") {
      showExportEmptyTip(copy.exportEngine.noDeductibleReceipts);
      return;
    }
    if (preAuthDecision.kind === "google") {
      setGoogleSheet("hard-export");
      return;
    }

    const paid = await resolveSeasonPaid();
    const decision = resolveTaxExportGateAction({
      receipts: exportableReceipts,
      preparedReceipts: prepared,
      googleUserPresent: true,
      seasonPaid: paid,
    });
    if (decision.kind === "paywall") {
      setShowPaywall(true);
    } else if (decision.kind === "export") {
      openExportEngine(decision.receipts);
    }
  };

  const runPrepareWithLoading = async (
    fn: () => Promise<void>,
  ): Promise<void> => {
    setPreparingExport(true);
    try {
      await fn();
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

  const openExportAfterPrepare = async () => {
    setPaywallExporting(true);
    await runPrepareWithLoading(async () => {
      const prepared = await prepareExportReceipts();
      if (blockIfNoExportableReceipts(prepared)) return;
      openExportEngine(realExportReceipts(exportableReceipts, prepared));
    }).finally(() => setPaywallExporting(false));
  };

  const runExportGate = async () => {
    clearError();
    clearExportEmptyTip();
    if (!navigator.onLine) {
      setErrorMessage(copy.settings.export.offline);
      return;
    }

    await runPrepareWithLoading(async () => {
      const prepared = await prepareExportReceipts();
      if (prepared === undefined && blockIfNoExportableReceipts()) return;
      await finishExportGate(prepared);
    });
  };

  const handleGoogleSuccess = async (result: { taxRecalcQueued: number }) => {
    await onPostLoginSync?.(result.taxRecalcQueued);
    setGoogleSheet(null);
    await runPrepareWithLoading(async () => {
      const prepared = await prepareExportReceipts();
      await finishExportGate(prepared);
    });
  };

  const handleExportReceiptUpdated = (updated: Receipt) => {
    setExportEngineReceipts((prev) =>
      prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev,
    );
    onReceiptUpdated?.(updated);
  };

  const openPaywall = () => setShowPaywall(true);

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
            onExportPaymentComplete?.();
          }}
          onSeasonAlreadyPaid={async () => {
            setSeasonPaid(currentSeason, true);
            await refreshSeasonPaid?.();
            setShowPaywall(false);
            await openExportAfterPrepare();
          }}
        />
      )}

      {showExportSheet && (
        <ExportEngineSheet
          receipts={exportEngineReceipts ?? exportableReceipts}
          currentSeason={currentSeason}
          taxpayerName={googleUser?.name}
          userLockedRegion={userLockedRegion ?? undefined}
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
    continueExportAfterGoogleSignIn: handleGoogleSuccess,
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
