"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Industry, Receipt } from "@/lib/types";
import { useAuthSession } from "@/lib/client/useAuthSession";
import { useIsOnline } from "@/lib/client/useIsOnline";
import { loadIndustry, saveIndustry } from "@/lib/client/authStorage";
import { ensureGhostSession } from "@/lib/client/ghostClient";
import { mergeOrphanGhostsOnLogin } from "@/lib/client/mergeOrphanGhosts";
import { ensureTaxRegionCandidate } from "@/lib/client/taxRegion";
import {
  apiReceiptToLocal,
  isDuplicateReceiptError,
  triggerReceiptProcess,
  uploadReceipt,
  type ApiReceipt,
} from "@/lib/client/receiptApi";
import { shouldRunHiddenBackgroundSync } from "@/lib/client/backgroundSyncGate";
import { flushReceiptEventBatch } from "@/lib/client/flushReceiptEventBatch";
import { schedulePhotoRetentionPurge } from "@/lib/client/photoRetentionJob";
import { scheduleReceiptEventRetentionPrune } from "@/lib/client/receiptEventRetention";
import { scheduleReceiptRetentionPrune } from "@/lib/client/receiptRetention";
import { scheduleReceiptSummaryVerify } from "@/lib/client/receiptSummaryVerify";
import { reconcileDuplicateReceipt } from "@/lib/client/reconcileDuplicateReceipt";
import { reconcileNonDoneWindow } from "@/lib/client/reconcileNonDoneWindow";
import {
  DUPLICATE_HIGHLIGHT_MS,
  duplicateNoticeCopy,
  scrollReceiptIntoView,
} from "@/lib/client/duplicateReceiptNotice";
import { prepareReceiptCapture } from "@/lib/client/prepareReceiptCapture";
import {
  flushSessionPendingUploads,
} from "@/lib/client/batchCaptureFlush";
import {
  isBatchOcrUploadDeferred,
  preloadOcrEngine,
  resumePendingOcrJobsFromStorage,
  scheduleOcrJob,
  setOcrCompleteHandler,
} from "@/lib/client/scheduleOcrJob";
import {
  deleteReceiptLocalAndRemote,
  flushPendingDeletes,
} from "@/lib/client/receiptDeleteFlow";
import { pollEntitlementReady, pollTaxRecalc } from "@/lib/client/authApi";
import { PaymentSuccessSheet } from "@/components/billing/PaymentSuccessSheet";
import { runPaymentSuccessFlow } from "@/lib/billing/runPaymentSuccessFlow";
import type {
  PaymentSuccessState,
  PaymentSuccessVariant,
} from "@/lib/billing/paymentSuccessTypes";
import { fetchFounderProgramClient } from "@/lib/founder/fetchFounderProgramClient";
import {
  prepareExportSync,
  prepareExportLocal,
  type ExportPrepareDeps,
} from "@/lib/client/exportPrepareFlow";
import type { ExportFormat } from "@/lib/export/exportFilenames";
import { restoreReceiptsFromCloud } from "@/lib/client/cloudRestoreFlow";
import {
  markCloudRestoreAttempted,
  shouldAutoRestoreFromCloud,
} from "@/lib/client/localDataLoss";
import { prefetchReceiptImageUrl } from "@/lib/client/receiptImageCache";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";
import { mergeServerReceiptsIntoLocal } from "@/lib/client/receiptSyncOrchestrator";
import {
  STARTUP_UNFILED_LIMIT,
  top100ByUpdatedAt,
  UI_RECEIPT_LIMIT,
} from "@/lib/client/receiptSync";
import {
  applyPhotoMissingState,
  captureKindForUpload,
  shouldSkipUploadAttempt,
} from "@/lib/client/receiptUploadFlow";
import {
  getBudget,
  isSyncStuck,
  recordWriteFailure,
  resetBudget,
  withFreshBudget,
} from "@/lib/client/receiptSyncBudget";
import { ProcessingQueue } from "@/lib/client/processingQueue";
import { ProcessingReceiptWatcher } from "@/lib/client/processingReceiptWatcher";
import { resolveHeaderTaxSaved } from "@/lib/client/resolveHeaderTaxSaved";
import { emitReceiptLifecycleEvent } from "@/lib/client/emitReceiptLifecycleEvent";
import {
  hasWorkerCatchUp,
  isWorkerSessionActive,
  mergeWorkerCatchUpFlags,
  type WorkerCatchUpFlags,
} from "@/lib/client/workerSessionGate";
import { utcNow } from "@/lib/time/utc";
import {
  deleteReceipt as deleteStoredReceipt,
  loadAllReceipts,
  loadPhoto,
  loadReceipt,
  loadRecentUnfiledReceipts,
  loadTopByUpdatedAt,
  saveReceipt,
  markRemoteSyncedPhotos,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import {
  readCurrentSeasonSummary,
} from "@/lib/storage/receiptSummary";
import type { ReceiptSeasonSummary } from "@/lib/storage/receiptSummaryTypes";
import { TaxHeader } from "./TaxHeader";
import { SnapButton, type SnapButtonHandle } from "./SnapButton";
import { ReceiptList } from "./ReceiptList";
import { InlinePrivacyNote } from "./InlinePrivacyNote";
import { HomeScrollRegion } from "./HomeScrollRegion";
import { WidgetStack } from "./widgets/WidgetStack";
import { FounderProgramSheet } from "./sheets/FounderProgramSheet";
import { waitForFounderActive } from "@/lib/founder/waitForFounderActive";
import {
  HomeOverlayHost,
  type HomeOverlay,
} from "./overlays/HomeOverlayHost";
import type { SettingsViewState } from "@/components/settings/settingsViewState";
import { useAppNavigation } from "@/lib/client/useAppNavigation";
import {
  confirmAppExit,
  mapNavKeyToTarget,
  restoreHomeNavTrap,
  type SnapNavKey,
} from "@/lib/client/appNavigationHistory";
import { LEGAL_RETURN_EVENT } from "@/lib/client/legalReturnNav";
import { shouldConfirmExitFromPopState } from "@/lib/client/homeExitGuard";
import { useHomeExitGuard } from "@/lib/client/useHomeExitGuard";
import { ExitConfirmSheet } from "@/components/home/ExitConfirmSheet";
import { computeHomeWidgets } from "@/lib/home/computeHomeWidgets";
import { sumDoneExpenses } from "@/lib/receipts/receiptStats";
import {
  filterReceiptsByBucket,
  countReceiptBuckets,
  type ReceiptListFilter,
} from "@/lib/receipts/receiptBucket";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { GoogleSignInSheet } from "@/components/auth/GoogleSignInSheet";
import type { SettingsTaxStats } from "@/components/settings/TaxOverviewPanel";
import { useTaxExportGate } from "@/components/export/useTaxExportGate";
import { ReceiptDetailSheet } from "@/components/receipts/ReceiptDetailSheet";
import { logStartupMarks } from "@/lib/landing/startupMetrics";
import { OnboardingOrchestrator } from "@/components/onboarding/OnboardingOrchestrator";
import { OnboardingSkipButton } from "@/components/onboarding/OnboardingSkipButton";
import { SnapFocusRing } from "@/components/onboarding/SnapFocusRing";
import { SnapTooltip } from "@/components/onboarding/SnapTooltip";
import { useOnboardingFlow } from "@/components/onboarding/useOnboardingFlow";
import { downloadOnboardingSampleCsv } from "@/lib/export/downloadOnboardingSampleCsv";
import {
  convertDemoReceiptAfterLogin,
  ensureConvertedDemoUploadReady,
  ensureOnboardingDemoDone,
} from "@/lib/onboarding/demoReceipt";
import {
  countDoneRealReceipts,
  GOOGLE_SOFT_NUDGE_MIN_DONE,
  markGoogleNudgeSessionShown,
  wasGoogleNudgeShownThisSession,
} from "@/lib/onboarding/googleSoftNudge";
import {
  GOOGLE_SOFT_DISMISSED_KEY,
  readOnboardFlag,
  writeOnboardFlag,
} from "@/lib/onboarding/onboardingStorage";
import { visibleReceiptsForOnboarding } from "@/lib/onboarding/onboardingReceipts";
import {
  currentTaxYear,
  taxYearDeductions,
  incomeFormsInTaxYear,
  totalIncomeGrossInTaxYear,
} from "@/lib/tax/taxYearStats";
import { clientTimeZone } from "@/lib/time/timeZone";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  type CameraReturnView,
  viewAfterCameraClose,
} from "@/lib/client/cameraReturnNavigation";

type View = "home" | "settings";

function deferAfterPaint(fn: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

function stuckIdsFromReceipts(receipts: StoredReceipt[]): Set<string> {
  return new Set(receipts.filter(isSyncStuck).map((r) => r.id));
}

export function HomeScreen() {
  const auth = useAuthSession();
  const { copy } = useI18n();
  const isOnline = useIsOnline();
  const [view, setView] = useState<View>("home");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [taxSaved, setTaxSaved] = useState<number | null>(null);
  const [seasonSummary, setSeasonSummary] = useState<ReceiptSeasonSummary | null>(
    null,
  );
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [requestSoftGoogleSheet, setRequestSoftGoogleSheet] = useState(false);
  const [googleNudgeVisible, setGoogleNudgeVisible] = useState(false);
  const [resnapId, setResnapId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [appHidden, setAppHidden] = useState(false);
  const [listSyncing, setListSyncing] = useState(false);
  const [listFilter, setListFilter] = useState<ReceiptListFilter>("all");
  const [syncStuckIds, setSyncStuckIds] = useState<Set<string>>(() => new Set());
  const [receiptNotice, setReceiptNotice] = useState<string | null>(null);
  const [highlightReceiptId, setHighlightReceiptId] = useState<string | null>(
    null,
  );
  const [seasonExportTick, setSeasonExportTick] = useState(0);
  const [homeOverlay, setHomeOverlay] = useState<HomeOverlay>(null);
  const [uploadReauthSheet, setUploadReauthSheet] = useState(false);
  const [founderSheetOpen, setFounderSheetOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccessState | null>(
    null,
  );
  const paymentSuccessRef = useRef<PaymentSuccessState | null>(null);
  const [founderRefreshTick, setFounderRefreshTick] = useState(0);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [settingsViewState, setSettingsViewState] =
    useState<SettingsViewState>("main");
  const scrollRef = useRef<HTMLDivElement>(null);
  const homeRootRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const watcherRef = useRef<ProcessingReceiptWatcher | null>(null);
  const queueRef = useRef<ProcessingQueue | null>(null);
  const flushPendingUploadsRef = useRef<
    (opts?: {
      batchCapture?: boolean;
      skipGhostEnsure?: boolean;
      force?: boolean;
    }) => Promise<void>
  >(async () => {});
  const flushPendingDeletesRef = useRef<() => Promise<void>>(async () => {});
  const uploadPendingInnerRef = useRef<
    (
      receipt: StoredReceipt,
      opts?: { batchCapture?: boolean },
    ) => Promise<void>
  >(async () => {});
  const uploadInFlightRef = useRef(new Set<string>());
  const [uploadInFlightIds, setUploadInFlightIds] = useState<Set<string>>(
    () => new Set(),
  );
  const batchFlushActiveRef = useRef(false);
  /** Receipt ids from batch camera — keep similar-dedup off until upload succeeds. */
  const batchSessionReceiptIdsRef = useRef(new Set<string>());
  const receiptsRef = useRef<Receipt[]>([]);
  const cameraOpenRef = useRef(false);
  const cameraReturnViewRef = useRef<CameraReturnView | null>(null);
  const pendingMergeRef = useRef<{
    receipts: Receipt[];
  } | null>(null);
  const pendingWorkerCatchUpRef = useRef<WorkerCatchUpFlags>({});
  const snapButtonRef = useRef<SnapButtonHandle>(null);
  const setTaxAnimatingRef = useRef<(value: boolean) => void>(() => {});

  const pulseTaxAnimating = useCallback(() => {
    setTaxAnimatingRef.current(true);
    window.setTimeout(() => setTaxAnimatingRef.current(false), 600);
  }, []);

  const applyPopTarget = useCallback(
    (target: {
      view: "home" | "settings";
      homeOverlay: HomeOverlay;
      settingsPage: SettingsViewState;
    }) => {
      setView(target.view);
      setHomeOverlay(target.homeOverlay);
      setSettingsViewState(target.settingsPage);
    },
    [],
  );

  const exitGuardEnabled = useMemo(
    () =>
      view === "home" &&
      homeOverlay == null &&
      !cameraOpen &&
      selectedReceipt == null,
    [view, homeOverlay, cameraOpen, selectedReceipt],
  );

  const openExitConfirm = useCallback(() => {
    setExitConfirmOpen(true);
  }, []);

  const interceptPopState = useCallback(
    (event: PopStateEvent) => {
      if (!exitGuardEnabled) return false;
      if (!shouldConfirmExitFromPopState(event.state, true)) return false;
      restoreHomeNavTrap();
      setExitConfirmOpen(true);
      return true;
    },
    [exitGuardEnabled],
  );

  const {
    navigateBack,
    pushOverlay,
    openSettings,
    pushSettingsPage,
    replaceSettingsPage,
  } = useAppNavigation({ onPopTarget: applyPopTarget, interceptPopState });

  useHomeExitGuard({
    enabled: exitGuardEnabled && !exitConfirmOpen,
    containerRef: homeRootRef,
    onEdgeSwipeExit: openExitConfirm,
  });

  const handleExitConfirmStay = useCallback(() => {
    setExitConfirmOpen(false);
  }, []);

  const handleExitConfirmExit = useCallback(() => {
    setExitConfirmOpen(false);
    confirmAppExit();
  }, []);

  const showOverlay = useCallback(
    (overlay: NonNullable<HomeOverlay>) => {
      setHomeOverlay(overlay);
      pushOverlay(overlay);
    },
    [pushOverlay],
  );

  const handleOpenSettings = useCallback(() => {
    setView("settings");
    setSettingsViewState("main");
    openSettings();
  }, [openSettings]);

  const handleSettingsViewStateChange = useCallback(
    (page: SettingsViewState) => {
      setSettingsViewState(page);
      pushSettingsPage(page);
    },
    [pushSettingsPage],
  );

  const handleSettingsReplacePage = useCallback(
    (page: SettingsViewState) => {
      setSettingsViewState(page);
      replaceSettingsPage(page);
    },
    [replaceSettingsPage],
  );

  useEffect(() => {
    const onLegalReturn = (event: Event) => {
      const key = (event as CustomEvent<SnapNavKey>).detail;
      if (!key) return;
      applyPopTarget(mapNavKeyToTarget(key));
    };
    window.addEventListener(LEGAL_RETURN_EVENT, onLegalReturn);
    return () => window.removeEventListener(LEGAL_RETURN_EVENT, onLegalReturn);
  }, [applyPopTarget]);

  useEffect(() => {
    receiptsRef.current = receipts;
  }, [receipts]);

  useEffect(() => {
    if (!auth.hydrated) return;
    if (auth.industry) {
      setIndustry(auth.industry);
      saveIndustry(auth.industry);
      return;
    }
    const localIndustry = loadIndustry();
    if (localIndustry) setIndustry(localIndustry);
  }, [auth.hydrated, auth.industry]);

  const handleIndustryChange = useCallback((value: Industry) => {
    setIndustry(value);
    saveIndustry(value);
  }, []);

  const handleSoftGuideDismiss = useCallback(() => {
    writeOnboardFlag(GOOGLE_SOFT_DISMISSED_KEY);
    setGoogleNudgeVisible(false);
  }, []);

  const handleGoogleNudgeDismiss = useCallback(() => {
    handleSoftGuideDismiss();
  }, [handleSoftGuideDismiss]);

  const handleGoogleNudgeClick = useCallback(() => {
    markGoogleNudgeSessionShown();
    setGoogleNudgeVisible(false);
    setRequestSoftGoogleSheet(true);
    setView("settings");
    setSettingsViewState("main");
    openSettings();
  }, [openSettings]);

  useEffect(() => {
    cameraOpenRef.current = cameraOpen;
  }, [cameraOpen]);

  const openIncomeCapture = useCallback((returnView: CameraReturnView) => {
    cameraReturnViewRef.current = returnView;
    setView("home");
    deferAfterPaint(() => {
      snapButtonRef.current?.openCamera();
    });
  }, []);

  const handleCameraOpenChange = useCallback((open: boolean) => {
    setCameraOpen(open);
    if (open) return;
    const returnView = cameraReturnViewRef.current;
    cameraReturnViewRef.current = null;
    const nextView = viewAfterCameraClose(returnView);
    if (nextView === "settings") {
      setView("settings");
    }
  }, []);

  useEffect(() => {
    paymentSuccessRef.current = paymentSuccess;
  }, [paymentSuccess]);

  const runPaymentSuccessPoll = useCallback(
    async (variant: PaymentSuccessVariant, seasonLabel: string) => {
      await runPaymentSuccessFlow({
        variant,
        season: seasonLabel,
        onPhaseChange: (phase) => {
          setPaymentSuccess((prev) => (prev ? { ...prev, phase } : prev));
          if (phase === "ready" && variant === "founder") {
            setFounderRefreshTick((tick) => tick + 1);
          }
        },
        onFounderNumber: (founderNumber) => {
          setPaymentSuccess((prev) => (prev ? { ...prev, founderNumber } : prev));
        },
        pollEntitlementReady,
        refreshSeasonPaid: auth.refreshSeasonPaid,
        waitForFounderActive: variant === "founder" ? waitForFounderActive : undefined,
        fetchFounderNumber:
          variant === "founder"
            ? async () => {
                const data = await fetchFounderProgramClient();
                return data?.user?.founderNumber ?? null;
              }
            : undefined,
      });
    },
    [auth.refreshSeasonPaid],
  );

  const openPaymentSuccess = useCallback(
    (variant: PaymentSuccessVariant, seasonLabel: string) => {
      setPaymentSuccess({
        open: true,
        variant,
        phase: "confirming",
        seasonLabel,
        founderNumber: null,
      });
      void runPaymentSuccessPoll(variant, seasonLabel);
    },
    [runPaymentSuccessPoll],
  );

  const handlePaymentSuccessClose = useCallback(() => {
    setPaymentSuccess((prev) => (prev ? { ...prev, open: false } : null));
  }, []);

  const handlePaymentSuccessRetry = useCallback(() => {
    const current = paymentSuccessRef.current;
    if (!current) return;
    setPaymentSuccess({
      ...current,
      phase: "confirming",
      open: true,
      founderNumber: null,
    });
    void runPaymentSuccessPoll(current.variant, current.seasonLabel);
  }, [runPaymentSuccessPoll]);

  const refreshTaxAndSummary = useCallback(async () => {
    const summary = await readCurrentSeasonSummary();
    setSeasonSummary(summary);
    setTaxSaved(summary.totalTaxSaved);
  }, []);

  const refreshTaxSaved = useCallback(
    (_next: Receipt[]) => {
      void refreshTaxAndSummary();
    },
    [refreshTaxAndSummary],
  );

  const applyMergeNow = useCallback(
    (merged: Receipt[]) => {
      setReceipts(merged);
      refreshTaxSaved(merged);
    },
    [refreshTaxSaved],
  );

  const applyMergeOrDefer = useCallback(
    (merged: Receipt[]) => {
      if (cameraOpenRef.current) {
        pendingMergeRef.current = { receipts: merged };
        return;
      }
      applyMergeNow(merged);
    },
    [applyMergeNow],
  );

  const queueWorkerCatchUp = useCallback((flags: Partial<WorkerCatchUpFlags>) => {
    pendingWorkerCatchUpRef.current = mergeWorkerCatchUpFlags(
      pendingWorkerCatchUpRef.current,
      flags,
    );
  }, []);

  useEffect(() => {
    if (cameraOpen || !pendingMergeRef.current) return;
    const pending = pendingMergeRef.current;
    pendingMergeRef.current = null;
    applyMergeNow(pending.receipts);
  }, [cameraOpen, applyMergeNow]);

  const syncFromServer = useCallback(
    async (
      local: StoredReceipt[],
      applyMode: "immediate" | "defer" = "defer",
      opts?: { force?: boolean },
    ): Promise<Receipt[]> => {
      if (!navigator.onLine) {
        applyMergeNow(local);
        return local;
      }
      if (
        !opts?.force &&
        applyMode === "defer" &&
        isWorkerSessionActive({ cameraOpen: cameraOpenRef.current })
      ) {
        queueWorkerCatchUp({ sync: true });
        const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT).catch(() =>
          top100ByUpdatedAt(local),
        );
        return visible;
      }
      try {
        const { visible } = await mergeServerReceiptsIntoLocal(local);
        if (applyMode === "immediate") {
          pendingMergeRef.current = null;
          applyMergeNow(visible);
        } else {
          applyMergeOrDefer(visible);
        }
        return visible;
      } catch {
        const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT).catch(() =>
          top100ByUpdatedAt(local),
        );
        applyMergeNow(visible);
        return visible;
      }
    },
    [applyMergeNow, applyMergeOrDefer, queueWorkerCatchUp],
  );

  const applyReceiptUpdate = useCallback(
    async (updated: StoredReceipt) => {
      let merged = updated;
      let priorStatus: StoredReceipt["status"] | undefined;
      setReceipts((prev) => {
        const existing = prev.find((r) => r.id === updated.id) as
          | StoredReceipt
          | undefined;
        priorStatus = existing?.status;
        merged = {
          ...updated,
          writeBudgetRemaining:
            updated.writeBudgetRemaining ?? existing?.writeBudgetRemaining,
        };
        const next = prev.map((r) => (r.id === merged.id ? merged : r));
        refreshTaxSaved(top100ByUpdatedAt(next as StoredReceipt[]));
        return top100ByUpdatedAt(next as StoredReceipt[]);
      });
      await saveReceipt(merged);

      if (
        priorStatus === "processing" &&
        merged.status === "done" &&
        merged.taxAmount != null
      ) {
        void emitReceiptLifecycleEvent(
          {
            receiptId: merged.id,
            type: "TAX_CALCULATED",
            payload: {
              status: merged.status,
              taxAmount: merged.taxAmount ?? null,
              category: merged.category ?? null,
            },
          },
          { cameraOpen: cameraOpenRef.current },
        );
      }

      if (merged.status === "done" && merged.taxAmount != null) {
        pulseTaxAnimating();
      }
    },
    [pulseTaxAnimating, refreshTaxSaved],
  );

  const applyFromApi = useCallback(
    async (api: ApiReceipt) => {
      const updated: StoredReceipt = {
        ...apiReceiptToLocal(api),
        pendingUpload: false,
      };
      await applyReceiptUpdate(updated);
    },
    [applyReceiptUpdate],
  );

  const enqueueReceipt = useCallback((id: string) => {
    setSyncStuckIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    queueRef.current?.enqueue(id);
  }, []);

  useEffect(() => {
    if (!receiptNotice) return;
    const timer = window.setTimeout(() => setReceiptNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [receiptNotice]);

  const persistUploadedReceipt = useCallback(
    async (prior: StoredReceipt, uploaded: ApiReceipt) => {
      const updated: StoredReceipt = {
        ...apiReceiptToLocal(uploaded),
        hasRemoteImage: true,
        pendingUpload: false,
        writeBudgetRemaining: getBudget(prior),
        photoMissing: undefined,
      };
      batchSessionReceiptIdsRef.current.delete(prior.id);
      setReceipts((prev) => {
        const next = top100ByUpdatedAt([
          updated,
          ...prev.filter((r) => r.id !== prior.id),
        ]);
        refreshTaxSaved(next);
        return next;
      });
      await saveReceipt(updated);
      await markRemoteSyncedPhotos([updated.id]);
      return updated;
    },
    [refreshTaxSaved],
  );

  const showDuplicateReceiptNotice = useCallback(
    (existingReceiptId: string, matchType: "exact" | "similar") => {
      setReceiptNotice(duplicateNoticeCopy(copy.home.receiptList, matchType));
      setHighlightReceiptId(existingReceiptId);
      window.setTimeout(() => setHighlightReceiptId(null), DUPLICATE_HIGHLIGHT_MS);
      requestAnimationFrame(() => scrollReceiptIntoView(existingReceiptId));
    },
    [copy.home.receiptList],
  );

  const handleDuplicateUpload = useCallback(
    async (
      localId: string,
      existingReceiptId: string,
      prior?: StoredReceipt,
      matchType: "exact" | "similar" = "exact",
    ) => {
      const updated = await reconcileDuplicateReceipt(
        localId,
        existingReceiptId,
        prior,
      );
      batchSessionReceiptIdsRef.current.delete(localId);
      batchSessionReceiptIdsRef.current.delete(existingReceiptId);
      setReceipts((prev) => {
        const next = top100ByUpdatedAt([
          updated,
          ...prev.filter(
            (r) => r.id !== localId && r.id !== existingReceiptId,
          ),
        ]);
        refreshTaxSaved(next);
        return next;
      });
      showDuplicateReceiptNotice(existingReceiptId, matchType);
      if (updated.status === "processing") {
        queueRef.current?.enqueue(updated.id);
      }
      return updated;
    },
    [showDuplicateReceiptNotice, refreshTaxSaved],
  );

  const uploadPendingInner = async (
    receipt: StoredReceipt,
    opts?: { batchCapture?: boolean },
  ) => {
    if (shouldSkipUploadAttempt(receipt)) return;
    if (uploadInFlightRef.current.has(receipt.id)) return;

    const latest = await loadReceipt(receipt.id);
    if (!latest?.pendingUpload || shouldSkipUploadAttempt(latest)) return;

    let photo: Blob | null = null;
    try {
      photo = await loadPhoto(latest.id);
    } catch {
      photo = null;
    }
    if (!photo) {
      const marked = applyPhotoMissingState(latest);
      await saveReceipt(marked);
      setReceipts((prev) => prev.map((r) => (r.id === marked.id ? marked : r)));
      setSyncStuckIds((prev) => new Set(prev).add(marked.id));
      return;
    }

    uploadInFlightRef.current.add(latest.id);
    setUploadInFlightIds(new Set(uploadInFlightRef.current));
    try {
      const uploaded = await uploadReceipt(
        photo,
        latest.id,
        latest.timestamp,
        captureKindForUpload(latest),
        latest.ocrDraft,
        {
          batchCapture:
            opts?.batchCapture === true ||
            batchFlushActiveRef.current ||
            batchSessionReceiptIdsRef.current.has(latest.id),
        },
      );
      const updated = await persistUploadedReceipt(latest, uploaded);
      if (updated.status === "done" && updated.taxAmount != null) {
        pulseTaxAnimating();
      }
      if (updated.status === "processing") {
        queueRef.current?.enqueue(updated.id);
      }
    } catch (err) {
      if (isDuplicateReceiptError(err)) {
        await handleDuplicateUpload(
          latest.id,
          err.existingReceiptId,
          latest,
          err.matchType,
        );
        return;
      }
      if (err instanceof Error && err.message === "GOOGLE_LOGIN_REQUIRED") {
        setUploadReauthSheet(true);
        return;
      }
      const failed = recordWriteFailure(latest);
      await saveReceipt(failed);
      setReceipts((prev) => prev.map((r) => (r.id === failed.id ? failed : r)));
      if (isSyncStuck(failed)) {
        setSyncStuckIds((prev) => new Set(prev).add(failed.id));
      }
      throw failed;
    } finally {
      uploadInFlightRef.current.delete(latest.id);
      setUploadInFlightIds(new Set(uploadInFlightRef.current));
    }
  };

  uploadPendingInnerRef.current = uploadPendingInner;

  const flushPendingUploads = useCallback(
    async (opts?: {
      batchCapture?: boolean;
      skipGhostEnsure?: boolean;
      force?: boolean;
    }) => {
    await ensureConvertedDemoUploadReady();
    if (
      !opts?.force &&
      !opts?.batchCapture &&
      isWorkerSessionActive({ cameraOpen: cameraOpenRef.current })
    ) {
      queueWorkerCatchUp({ flushUploads: true });
      return;
    }
    if (!opts?.skipGhostEnsure) {
      try {
        await ensureGhostSession();
      } catch {
        return;
      }
    }
    const stored = await loadAllReceipts();
    const pending = stored.filter(
      (r) => r.pendingUpload && !shouldSkipUploadAttempt(r),
    );
    for (const receipt of pending) {
      try {
        await uploadPendingInnerRef.current(receipt, opts);
      } catch {
        // budget updated in uploadPendingInner
      }
    }
  },
  [queueWorkerCatchUp],
  );

  flushPendingUploadsRef.current = flushPendingUploads;

  const runWorkerCatchUp = useCallback(async () => {
    if (isWorkerSessionActive({ cameraOpen: cameraOpenRef.current })) return;
    const flags = pendingWorkerCatchUpRef.current;
    if (!hasWorkerCatchUp(flags)) return;
    pendingWorkerCatchUpRef.current = {};
    if (!navigator.onLine) return;
    try {
      await ensureGhostSession();
    } catch {
      pendingWorkerCatchUpRef.current = mergeWorkerCatchUpFlags({}, flags);
      return;
    }
    if (flags.flushUploads) {
      await flushPendingUploadsRef.current({ force: true });
    }
    if (flags.flushDeletes) {
      await flushPendingDeletesRef.current();
    }
    if (flags.sync) {
      const stored = await loadAllReceipts();
      await syncFromServer(stored, "immediate", { force: true });
    }
    if (flags.reconcile) {
      void reconcileNonDoneWindow();
    }
    await flushReceiptEventBatch({
      cameraOpen: cameraOpenRef.current,
      force: true,
    }).catch(() => {});
  }, [syncFromServer]);

  useEffect(() => {
    if (cameraOpen) return;
    void runWorkerCatchUp();
  }, [cameraOpen, runWorkerCatchUp]);

  useEffect(() => {
    setOcrCompleteHandler((receiptId) => {
      void (async () => {
        if (!navigator.onLine) return;
        try {
          await ensureGhostSession();
        } catch {
          return;
        }
        const receipt = await loadReceipt(receiptId);
        if (!receipt?.pendingUpload || shouldSkipUploadAttempt(receipt)) return;
        if (uploadInFlightRef.current.has(receiptId)) return;
        if (batchFlushActiveRef.current) return;
        if (isWorkerSessionActive({ cameraOpen: cameraOpenRef.current })) return;
        if (isBatchOcrUploadDeferred(receiptId)) return;
        try {
          await uploadPendingInnerRef.current(receipt);
        } catch {
          // write budget updated in uploadPendingInner
        }
      })();
    });
    return () => setOcrCompleteHandler(null);
  }, []);

  const flushPendingDeletesCallback = useCallback(async () => {
    await flushPendingDeletes();
  }, []);

  flushPendingDeletesRef.current = flushPendingDeletesCallback;

  const runDeferredStartup = useCallback(
    (cancelled: () => boolean) => {
      if (!navigator.onLine) return;
      deferAfterPaint(() => {
        void (async () => {
          if (cancelled()) return;
          try {
            await ensureGhostSession();
          } catch {
            return;
          }
          if (cancelled()) return;
          if (await shouldAutoRestoreFromCloud()) {
            try {
              const result = await restoreReceiptsFromCloud({
                downloadImages: true,
              });
              await markCloudRestoreAttempted(result);
            } catch {
              // allow retry on next startup if restore fails
            }
          }
          if (cancelled()) return;
          if (isWorkerSessionActive({ cameraOpen: cameraOpenRef.current })) {
            queueWorkerCatchUp({
              flushUploads: true,
              flushDeletes: true,
              sync: true,
              reconcile: true,
            });
            return;
          }
          await flushPendingUploadsRef.current();
          if (cancelled()) return;
          await flushPendingDeletesRef.current();
          if (cancelled()) return;
          const storedAfter = await loadAllReceipts();
          const mergedAfter = await syncFromServer(storedAfter, "defer");
          if (cancelled()) return;
          const stuck = stuckIdsFromReceipts(
            mergedAfter.filter((r): r is StoredReceipt => true),
          );
          setSyncStuckIds((prev) => new Set([...prev, ...stuck]));
          queueRef.current?.bootstrapFromList(
            mergedAfter.filter((r) => !stuck.has(r.id)),
          );
          schedulePhotoRetentionPurge();
          scheduleReceiptRetentionPrune();
          scheduleReceiptEventRetentionPrune();
          scheduleReceiptSummaryVerify();
          void reconcileNonDoneWindow();
          void flushReceiptEventBatch({
            cameraOpen: cameraOpenRef.current,
          }).catch(() => {});
        })();
      });
    },
    [syncFromServer, queueWorkerCatchUp],
  );

  useEffect(() => {
    const applyWriteFailure = (id: string) => {
      const row = receiptsRef.current.find((r) => r.id === id) as
        | StoredReceipt
        | undefined;
      if (!row) return;
      const failed = recordWriteFailure(row);
      receiptsRef.current = receiptsRef.current.map((r) =>
        r.id === id ? failed : r,
      );
      setReceipts([...receiptsRef.current]);
      void saveReceipt(failed);
      if (isSyncStuck(failed)) {
        setSyncStuckIds((prev) => new Set(prev).add(id));
      }
    };

    const queue = new ProcessingQueue({
      onActivate: (id) => watcherRef.current?.watch(id),
      onBootstrapStale: (ids) => {
        setSyncStuckIds((prev) => {
          const next = new Set(prev);
          for (const id of ids) next.add(id);
          return next;
        });
      },
    });
    queueRef.current = queue;

    const watcher = new ProcessingReceiptWatcher({
      onReceiptUpdate: (api) => {
        void applyFromApi(api);
        queue.onSettled(api.id);
      },
      onReceiptStuck: (id) => {
        setSyncStuckIds((prev) => new Set(prev).add(id));
        queue.onSettled(id);
      },
      onSummaryRefresh: () => {
        void refreshTaxAndSummary();
      },
      getWriteBudget: (id) => {
        const r = receiptsRef.current.find((x) => x.id === id) as
          | StoredReceipt
          | undefined;
        return r ? getBudget(r) : 0;
      },
      onWriteFailure: applyWriteFailure,
    });
    watcherRef.current = watcher;

    return () => {
      queue.clear();
      watcher.dispose();
      queueRef.current = null;
      watcherRef.current = null;
    };
  }, [applyFromApi, refreshTaxAndSummary]);

  const handleRetrySync = useCallback(
    (id: string) => {
      void (async () => {
        const stored = await loadAllReceipts();
        const row = stored.find((r) => r.id === id);
        if (!row) return;

        const refreshed = resetBudget(row);
        await saveReceipt(refreshed);
        setSyncStuckIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setReceipts((prev) => prev.map((r) => (r.id === id ? refreshed : r)));

        if (refreshed.pendingUpload) {
          try {
            await uploadPendingInnerRef.current(refreshed);
          } catch {
            // budget updated in uploadPendingInner
          }
          return;
        }

        const result = await triggerReceiptProcess(id);
        if (result.ok === false && result.reason === "failed") {
          const failed = recordWriteFailure(refreshed);
          await saveReceipt(failed);
          setReceipts((prev) => prev.map((r) => (r.id === id ? failed : r)));
          if (isSyncStuck(failed)) {
            setSyncStuckIds((prev) => new Set(prev).add(id));
          }
          return;
        }
        enqueueReceipt(id);
        watcherRef.current?.tickOnce();
      })();
    },
    [enqueueReceipt],
  );

  const handleManualListSync = useCallback(async () => {
    if (!navigator.onLine || listSyncing) return;
    setListSyncing(true);
    try {
      const stored = await loadAllReceipts();
      await syncFromServer(stored, "immediate");
    } finally {
      setListSyncing(false);
    }
  }, [listSyncing, syncFromServer]);

  const handlePostLoginSync = useCallback(
    async (taxRecalcQueued: number) => {
      if (!navigator.onLine) return;
      try {
        await ensureGhostSession();
      } catch {
        return;
      }
      await mergeOrphanGhostsOnLogin();
      await flushPendingUploadsRef.current();
      await flushPendingDeletesRef.current();
      try {
        await flushReceiptEventBatch({ force: true });
      } catch {
        // Event sync is best-effort; receipt merge must still run after login.
      }
      const stored = await loadAllReceipts();
      const merged = await syncFromServer(stored, "immediate");
      const stuck = stuckIdsFromReceipts(merged as StoredReceipt[]);
      setSyncStuckIds((prev) => new Set([...prev, ...stuck]));
      queueRef.current?.bootstrapFromList(
        merged.filter((r) => !stuck.has(r.id)),
      );
      if (taxRecalcQueued > 0) {
        await pollTaxRecalc(taxRecalcQueued, async () => {
          const latest = await loadAllReceipts();
          await syncFromServer(latest, "immediate");
        });
      }
    },
    [syncFromServer],
  );

  const handlePostExportSync = useCallback(async () => {
    const stored = await loadAllReceipts();
    await syncFromServer(stored, "immediate");
    setSeasonExportTick((tick) => tick + 1);
  }, [syncFromServer]);

  const exportPrepareDeps = useCallback(
    (): ExportPrepareDeps => ({
      flushPendingUploads: () => flushPendingUploadsRef.current(),
      flushPendingDeletes: () => flushPendingDeletesRef.current(),
      loadAllReceipts,
      syncFromServer: (local) => syncFromServer(local, "immediate"),
      ensureGhostSession: async () => {
        await ensureGhostSession();
      },
    }),
    [syncFromServer],
  );

  const handleExportGatePrepare = useCallback(async () => {
    const local = await prepareExportLocal(exportPrepareDeps());
    setReceipts(top100ByUpdatedAt(local));
    return local;
  }, [exportPrepareDeps]);

  const handlePreExportPrepare = useCallback(
    async (format: ExportFormat) => {
      const isLocalFirst =
        format === "csv" ||
        format === "txf" ||
        format === "qif" ||
        format === "qbo" ||
        format === "cpa_pdf" ||
        format === "cpa_pack";
      if (isLocalFirst) {
        const local = await prepareExportLocal(exportPrepareDeps());
        setReceipts(top100ByUpdatedAt(local));
        return local;
      }
      const merged = await prepareExportSync(exportPrepareDeps());
      setReceipts(merged);
      return merged;
    },
    [exportPrepareDeps],
  );

  const taxExport = useTaxExportGate({
    receipts,
    googleUser: auth.googleUser,
    seasonPaid: auth.seasonPaid,
    currentSeason: auth.currentSeason,
    onUserSignedIn: auth.applyGoogleSignIn,
    onPostLoginSync: handlePostLoginSync,
    refreshSeasonPaid: auth.refreshSeasonPaid,
    onExportGatePrepare: handleExportGatePrepare,
    onPreExportPrepare: handlePreExportPrepare,
    onPostExportSync: handlePostExportSync,
    onReceiptUpdated: (updated) => {
      void applyReceiptUpdate(updated as StoredReceipt);
    },
    onSnap1099: () => openIncomeCapture(view),
    onExportPaymentComplete: () =>
      openPaymentSuccess("export", auth.currentSeason),
  });

  useEffect(() => {
    const handleOnline = () => {
      void (async () => {
        try {
          await ensureGhostSession();
        } catch {
          return;
        }
        runDeferredStartup(() => false);
      })();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [runDeferredStartup]);

  useEffect(() => {
    preloadOcrEngine();
  }, []);

  useEffect(() => {
    if (!navigator.onLine) return;

    const retryPending = () => {
      if (!navigator.onLine) return;
      if (
        document.visibilityState === "hidden" &&
        !shouldRunHiddenBackgroundSync()
      ) {
        return;
      }
      if (isWorkerSessionActive({ cameraOpen: cameraOpenRef.current })) {
        queueWorkerCatchUp({
          flushUploads: true,
          flushDeletes: true,
          reconcile: document.visibilityState === "visible",
        });
        return;
      }
      void flushPendingUploadsRef.current();
      void flushPendingDeletesRef.current();
      void flushReceiptEventBatch({
        cameraOpen: cameraOpenRef.current,
      }).catch(() => {});
      if (document.visibilityState === "visible") {
        void reconcileNonDoneWindow();
      }
    };

    const intervalId = window.setInterval(retryPending, 60_000);
    return () => window.clearInterval(intervalId);
  }, [queueWorkerCatchUp]);

  useEffect(() => {
    const onVisibility = () => setAppHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    onVisibility();
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const shouldPause =
      cameraOpen ||
      selectedReceipt != null ||
      view === "settings" ||
      appHidden ||
      homeOverlay != null;
    watcherRef.current?.setPaused(shouldPause);
  }, [cameraOpen, selectedReceipt, view, appHidden, homeOverlay]);

  const refreshListFromLocal = useCallback(async () => {
    const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT);
    setReceipts(visible);
    refreshTaxSaved(visible);
    setSyncStuckIds(stuckIdsFromReceipts(visible));
    return visible;
  }, [refreshTaxSaved]);

  const handleOnboardingPostLogin = useCallback(
    async (taxRecalcQueued: number) => {
      await handlePostLoginSync(taxRecalcQueued);
      await convertDemoReceiptAfterLogin();
      await ensureConvertedDemoUploadReady();
      await refreshListFromLocal();
    },
    [handlePostLoginSync, refreshListFromLocal],
  );

  const handleOnboardingRefreshReceipts = useCallback(async () => {
    await refreshListFromLocal();
  }, [refreshListFromLocal]);

  const onboarding = useOnboardingFlow({
    receipts,
    taxSaved,
    onRefreshReceipts: handleOnboardingRefreshReceipts,
    onGoogleSignIn: auth.signInWithGoogle,
    onGooglePostLogin: handleOnboardingPostLogin,
  });

  const {
    initializeOnboarding,
    resetOnboarding,
    skipOnboardingFlow,
    skipSoftGoogleSheet,
    displayTaxSaved,
    taxAnimating,
    setTaxAnimating,
    ahaCoachActive,
    dismissAhaCoach,
    completeAhaCoach,
    handleSnapIntent,
    orchestratorProps,
    onboardingStatus,
    onboardingInFlow,
  } = onboarding;

  const displayReceipts = useMemo(
    () => visibleReceiptsForOnboarding(receipts, onboardingStatus),
    [receipts, onboardingStatus],
  );

  const doneRealReceiptCount = useMemo(
    () => countDoneRealReceipts(receipts),
    [receipts],
  );

  const googleNudgeActivatedRef = useRef(false);

  useEffect(() => {
    if (view === "settings") {
      setGoogleNudgeVisible(false);
      return;
    }
    if (!auth.hydrated || auth.isSignedIn) {
      setGoogleNudgeVisible(false);
      return;
    }
    if (onboardingStatus !== "completed") {
      setGoogleNudgeVisible(false);
      return;
    }
    if (readOnboardFlag(GOOGLE_SOFT_DISMISSED_KEY)) {
      setGoogleNudgeVisible(false);
      return;
    }
    if (googleNudgeActivatedRef.current || wasGoogleNudgeShownThisSession()) {
      return;
    }
    if (doneRealReceiptCount < GOOGLE_SOFT_NUDGE_MIN_DONE) {
      return;
    }

    googleNudgeActivatedRef.current = true;
    markGoogleNudgeSessionShown();
    setGoogleNudgeVisible(true);
    const timer = window.setTimeout(() => setGoogleNudgeVisible(false), 10_000);
    return () => window.clearTimeout(timer);
  }, [
    auth.hydrated,
    auth.isSignedIn,
    doneRealReceiptCount,
    onboardingStatus,
    view,
  ]);

  const headerTaxSaved = useMemo(
    () =>
      resolveHeaderTaxSaved({
        displayTaxSaved,
        seasonTotalTaxSaved: seasonSummary?.totalTaxSaved,
        taxSavedFallback: taxSaved,
      }),
    [displayTaxSaved, seasonSummary, taxSaved],
  );

  const settingsTaxStats = useMemo((): SettingsTaxStats => {
    if (!seasonSummary) {
      const year = currentTaxYear();
      return {
        taxSaved: headerTaxSaved,
        receiptCount: displayReceipts.length,
        totalDeductions: taxYearDeductions(displayReceipts, year, clientTimeZone()),
        incomeFormCount: incomeFormsInTaxYear(displayReceipts, year, clientTimeZone()),
        totalIncomeGross: totalIncomeGrossInTaxYear(displayReceipts, year, clientTimeZone()),
      };
    }
    return {
      taxSaved: headerTaxSaved,
      receiptCount: seasonSummary.totalReceiptCount,
      totalDeductions: seasonSummary.totalDeductions,
      incomeFormCount: seasonSummary.incomeFormCount,
      totalIncomeGross: seasonSummary.totalIncomeGross,
    };
  }, [seasonSummary, displayReceipts, headerTaxSaved]);

  const widgetsData = useMemo(
    () => computeHomeWidgets(displayReceipts, headerTaxSaved, industry),
    [displayReceipts, headerTaxSaved, industry],
  );

  const actionCount = useMemo(
    () => countReceiptBuckets(displayReceipts, syncStuckIds).action,
    [displayReceipts, syncStuckIds],
  );

  const handleStartTracking = useCallback(() => {
    navigateBack();
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigateBack]);

  const handleDetailReceiptUpdate = useCallback(
    (updated: Receipt) => {
      void applyReceiptUpdate(updated as StoredReceipt);
      setSelectedReceipt((prev) =>
        prev?.id === updated.id ? { ...prev, ...updated } : prev,
      );
      if (updated.status !== "processing") {
        watcherRef.current?.unwatch(updated.id);
        queueRef.current?.onSettled(updated.id);
        setSyncStuckIds((prev) => {
          if (!prev.has(updated.id)) return prev;
          const next = new Set(prev);
          next.delete(updated.id);
          return next;
        });
      }
    },
    [applyReceiptUpdate],
  );

  const handleExportClick = useCallback(() => {
    if (onboardingStatus === "stage_3" || onboardingStatus === "stage_aha") {
      void (async () => {
        const demo = await ensureOnboardingDemoDone();
        await refreshListFromLocal();
        downloadOnboardingSampleCsv(demo);
        await completeAhaCoach();
      })();
      return;
    }
    taxExport.requestExport();
  }, [
    onboardingStatus,
    refreshListFromLocal,
    completeAhaCoach,
    taxExport,
  ]);

  const handleSettingsExport = useCallback(() => {
    taxExport.requestExport();
  }, [taxExport]);

  setTaxAnimatingRef.current = setTaxAnimating;

  useEffect(() => {
    performance.mark("startup:home-ready");
    logStartupMarks();

    let cancelled = false;

    void (async () => {
      try {
        ensureTaxRegionCandidate();
        await initializeOnboarding();
        if (cancelled) return;

        const hot = await loadRecentUnfiledReceipts(STARTUP_UNFILED_LIMIT);
        if (cancelled) return;

        setReceipts(hot);
        setSyncStuckIds(stuckIdsFromReceipts(hot));
        await refreshTaxAndSummary();

        await resumePendingOcrJobsFromStorage();
        if (cancelled) return;

        deferAfterPaint(async () => {
          if (cancelled) return;
          const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT);
          if (cancelled) return;
          setReceipts(visible);
          setSyncStuckIds(stuckIdsFromReceipts(visible));
        });

        if (navigator.onLine) {
          runDeferredStartup(() => cancelled);
        }
      } catch {
        const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT).catch(() => []);
        if (!cancelled) {
          setReceipts(visible);
          setSyncStuckIds(stuckIdsFromReceipts(visible));
          await refreshTaxAndSummary().catch(() => setTaxSaved(0));
          if (navigator.onLine) {
            runDeferredStartup(() => cancelled);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initializeOnboarding, refreshTaxAndSummary, runDeferredStartup]);

  const handleBatchShot = useCallback(
    async (file: File): Promise<string | null> => {
      const result = await prepareReceiptCapture(file);
      if (result.kind === "duplicate") {
        showDuplicateReceiptNotice(result.existingReceiptId, "exact");
        return null;
      }
      const { receipt } = result;
      batchSessionReceiptIdsRef.current.add(receipt.id);
      setReceipts((prev) => top100ByUpdatedAt([receipt, ...prev]));
      scheduleOcrJob(receipt.id);
      return receipt.id;
    },
    [showDuplicateReceiptNotice],
  );

  const handleBatchClose = useCallback(async (sessionIds: string[]) => {
    for (const id of sessionIds) {
      batchSessionReceiptIdsRef.current.add(id);
    }
    batchFlushActiveRef.current = true;
    try {
      await refreshListFromLocal();
      if (navigator.onLine && sessionIds.length > 0) {
        try {
          await ensureGhostSession();
          await flushSessionPendingUploads(sessionIds, () =>
            flushPendingUploadsRef.current({
              batchCapture: true,
              skipGhostEnsure: true,
            }),
          );
        } catch {
          // pending rows remain until next flush
        }
      }
    } finally {
      batchFlushActiveRef.current = false;
    }
  }, [refreshListFromLocal]);

  const handleBatchDone = useCallback(
    async (sessionIds: string[]) => {
      for (const id of sessionIds) {
        batchSessionReceiptIdsRef.current.add(id);
      }
      const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT);
      setReceipts(visible);
      refreshTaxSaved(visible);
      setSyncStuckIds(stuckIdsFromReceipts(visible));

      batchFlushActiveRef.current = true;
      try {
        if (navigator.onLine && sessionIds.length > 0) {
          try {
            await ensureGhostSession();
            await flushSessionPendingUploads(sessionIds, () =>
              flushPendingUploadsRef.current({
                batchCapture: true,
                skipGhostEnsure: true,
              }),
            );
          } catch {
            // Local pending rows remain until next flush
          }
        }
        const afterFlush = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT);
        setReceipts(afterFlush);
        refreshTaxSaved(afterFlush);
        setSyncStuckIds(stuckIdsFromReceipts(afterFlush));
        for (const id of sessionIds) {
          const row = afterFlush.find((r) => r.id === id);
          if (
            row &&
            row.status === "processing" &&
            !row.pendingUpload &&
            !row.isOnboardingDemo
          ) {
            queueRef.current?.enqueue(id);
          }
        }
      } finally {
        batchFlushActiveRef.current = false;
      }
    },
    [refreshTaxSaved],
  );

  const handleDeleteReceipt = useCallback(
    async (id: string) => {
      const existing = receiptsRef.current.find((r) => r.id === id);
      if (existing?.isOnboardingDemo) return;

      setReceipts((prev) => prev.filter((r) => r.id !== id));
      setSelectedReceipt((prev) => (prev?.id === id ? null : prev));
      watcherRef.current?.unwatch(id);
      queueRef.current?.onSettled(id);
      setSyncStuckIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await deleteReceiptLocalAndRemote(id);

      const visible = await loadTopByUpdatedAt(UI_RECEIPT_LIMIT);
      setReceipts(visible);
      refreshTaxSaved(visible);
    },
    [refreshTaxSaved],
  );

  const handleCapture = useCallback(
    async (file: File) => {
      const replaceId = resnapId;
      setResnapId(null);

      const result = await prepareReceiptCapture(file, { replaceId });
      if (result.kind === "duplicate") {
        showDuplicateReceiptNotice(result.existingReceiptId, "exact");
        return;
      }

      const { receipt: processingReceipt } = result;
      setReceipts((prev) => {
        const without = replaceId ? prev.filter((r) => r.id !== replaceId) : prev;
        return top100ByUpdatedAt([processingReceipt, ...without]);
      });
      scheduleOcrJob(processingReceipt.id);

      if (navigator.onLine) {
        void (async () => {
          try {
            await ensureGhostSession();
          } catch {
            return;
          }
          try {
            await uploadPendingInnerRef.current(processingReceipt);
          } catch {
            // budget updated in uploadPendingInner
          }
        })();
      }

      if (replaceId) {
        watcherRef.current?.unwatch(replaceId);
        queueRef.current?.onSettled(replaceId);
        setSyncStuckIds((prev) => {
          if (!prev.has(replaceId)) return prev;
          const next = new Set(prev);
          next.delete(replaceId);
          return next;
        });
      }
    },
    [resnapId, showDuplicateReceiptNotice],
  );

  const handleResnap = useCallback((id: string) => {
    setResnapId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    snapButtonRef.current?.openCamera();
  }, []);

  const handleNeedActionResnap = useCallback(() => {
    setListFilter("action");
    const actionReceipt = filterReceiptsByBucket(
      displayReceipts,
      "action",
      syncStuckIds,
    )[0];
    if (actionReceipt) handleResnap(actionReceipt.id);
  }, [displayReceipts, syncStuckIds, handleResnap]);

  const paymentSuccessOverlay =
    paymentSuccess?.open ? (
      <PaymentSuccessSheet
        state={paymentSuccess}
        onClose={handlePaymentSuccessClose}
        onDownloadTaxPack={() => {
          handlePaymentSuccessClose();
          taxExport.triggerExportAfterPayment();
        }}
        onRetry={handlePaymentSuccessRetry}
        onGotIt={handlePaymentSuccessClose}
        onNotNow={handlePaymentSuccessClose}
      />
    ) : null;

  if (view === "settings") {
    return (
      <>
      <SettingsScreen
        industry={industry}
        onIndustryChange={handleIndustryChange}
        viewState={settingsViewState}
        onViewStateChange={handleSettingsViewStateChange}
        onReplaceSettingsPage={handleSettingsReplacePage}
        onNavigateBack={navigateBack}
        onAccountDeleted={() => {
          void (async () => {
            setReceipts([]);
            setTaxSaved(null);
            setSeasonSummary(null);
            setSyncStuckIds(new Set());
            queueRef.current?.clear();
            watcherRef.current?.reset();
            setIndustry(null);
            auth.resetAfterAccountDelete();
            await resetOnboarding();
            await ensureGhostSession();
            await refreshListFromLocal();
            setView("home");
          })();
        }}
        skipSoftGoogleSheet={skipSoftGoogleSheet}
        googleUser={auth.googleUser}
        seasonPaid={auth.seasonPaid}
        currentSeason={auth.currentSeason}
        onRefreshSeasonPaid={auth.refreshSeasonPaid}
        onUserSignedIn={auth.applyGoogleSignIn}
        onPostLoginSync={handlePostLoginSync}
        onSignOut={auth.signOut}
        taxStats={settingsTaxStats}
        onRequestExport={handleSettingsExport}
        onContinueExportAfterGoogle={taxExport.continueExportAfterGoogleSignIn}
        exportBlockedTick={taxExport.exportBlockedTick}
        seasonExportTick={seasonExportTick}
        onboardingAha={
          onboardingStatus === "stage_3" || onboardingStatus === "stage_aha"
        }
        onSampleExportAhaComplete={completeAhaCoach}
        exportBusy={taxExport.paywallExporting || taxExport.preparingExport}
        exportError={taxExport.exportError}
        exportEmptyTip={taxExport.exportEmptyTip}
        exportEmptyTipKey={taxExport.exportEmptyTipKey}
        onExportEmptyTipDismiss={taxExport.clearExportEmptyTip}
        onSnap1099={() => openIncomeCapture("settings")}
        isSignedIn={auth.isSignedIn}
        authHydrated={auth.hydrated}
        requestSoftGoogleSheet={requestSoftGoogleSheet}
        onSoftGoogleSheetConsumed={() => setRequestSoftGoogleSheet(false)}
        onSoftGuideDismiss={handleSoftGuideDismiss}
        onRestored={() => void refreshListFromLocal()}
      />
      {taxExport.overlays}
      {paymentSuccessOverlay}
    </>
    );
  }

  return (
    <div
      ref={homeRootRef}
      className="relative flex h-full flex-col overflow-hidden bg-black font-sans text-white select-none"
    >
      <TaxHeader
        taxSaved={headerTaxSaved}
        totalExpenses={sumDoneExpenses(displayReceipts)}
        receiptCount={displayReceipts.length}
        animating={taxAnimating}
        ahaCoachActive={ahaCoachActive}
        onAhaCoachDismiss={dismissAhaCoach}
        onSettingsClick={handleOpenSettings}
        onExportClick={handleExportClick}
        exportBusy={taxExport.paywallExporting || taxExport.preparingExport}
        exportError={taxExport.exportError}
        googleNudgeVisible={googleNudgeVisible}
        onGoogleNudgeClick={handleGoogleNudgeClick}
        onGoogleNudgeDismiss={handleGoogleNudgeDismiss}
      />

      <div className="relative shrink-0 px-4 pb-1.5 pt-0">
        {onboardingStatus === "stage_1" && <SnapTooltip />}
        <div className="relative w-full">
          {onboardingStatus === "stage_1" && <SnapFocusRing />}
          <SnapButton
            ref={snapButtonRef}
            onCapture={handleCapture}
            onBatchShot={handleBatchShot}
            onBatchDone={handleBatchDone}
            onBatchClose={handleBatchClose}
            onReviewDelete={handleDeleteReceipt}
            resnapId={resnapId}
            onCameraOpenChange={handleCameraOpenChange}
            onSyncClick={handleManualListSync}
            onSettingsClick={handleOpenSettings}
            syncing={listSyncing}
            syncDisabled={!isOnline}
            onSnapIntent={handleSnapIntent}
          />
        </div>
      </div>

      <InlinePrivacyNote onLearnMore={() => showOverlay("privacy-trust")} />

      {receiptNotice && (
        <p
          className="mx-4 mb-2 rounded-xl border-2 border-yellow-500 bg-yellow-950 px-4 py-3 text-center text-sm font-bold text-yellow-400"
          role="status"
        >
          {receiptNotice}
        </p>
      )}

      <WidgetStack
        data={widgetsData}
        actionCount={actionCount}
        isSignedIn={auth.isSignedIn}
        authHydrated={auth.hydrated}
        founderRefreshTick={founderRefreshTick}
        onFounderOpen={() => setFounderSheetOpen(true)}
        onDeadlineDetails={() => showOverlay("deadline-detail")}
        onMissingReview={() => showOverlay("missing-deductions")}
        onProgressDetails={() => showOverlay("tax-year-detail")}
        onExport={handleExportClick}
        onNeedActionResnap={handleNeedActionResnap}
      />

      <HomeScrollRegion ref={scrollRef}>
        <ReceiptList
          receipts={displayReceipts}
          syncStuckIds={syncStuckIds}
          uploadInFlightIds={uploadInFlightIds}
          highlightReceiptId={highlightReceiptId}
          filter={listFilter}
          onFilterChange={setListFilter}
          filterBarRef={filterBarRef}
          ahaCoachActive={ahaCoachActive}
          onAhaCoachDismiss={dismissAhaCoach}
          onSelect={(receipt) => {
            if (isPersistedReceiptId(receipt.id)) {
              prefetchReceiptImageUrl(receipt.id, {
                hasRemoteImage: receipt.hasRemoteImage,
                pendingUpload: receipt.pendingUpload,
              });
            }
            setSelectedReceipt(receipt);
          }}
          onResnap={handleResnap}
          onRetrySync={handleRetrySync}
          onDelete={(id) => void handleDeleteReceipt(id)}
          onSyncClick={handleManualListSync}
          syncing={listSyncing}
          syncDisabled={!isOnline}
        />
      </HomeScrollRegion>

      {homeOverlay && (
        <HomeOverlayHost
          overlay={homeOverlay}
          widgetsData={widgetsData}
          industry={industry}
          onClose={navigateBack}
          onNavigate={(overlay) => {
            setHomeOverlay(overlay);
            if (overlay != null) {
              pushOverlay(overlay);
            }
          }}
          onStartTracking={handleStartTracking}
        />
      )}

      {orchestratorProps && (
        <OnboardingOrchestrator {...orchestratorProps} />
      )}

      {onboardingInFlow && (
        <OnboardingSkipButton onSkip={skipOnboardingFlow} />
      )}

      {selectedReceipt && (
        <ReceiptDetailSheet
          key={selectedReceipt.id}
          receipt={selectedReceipt}
          syncStuck={syncStuckIds.has(selectedReceipt.id)}
          onClose={() => setSelectedReceipt(null)}
          onResnap={handleResnap}
          onDeleteReceipt={handleDeleteReceipt}
          onRetrySync={handleRetrySync}
          onReceiptUpdate={handleDetailReceiptUpdate}
        />
      )}

      {taxExport.overlays}

      {paymentSuccessOverlay}

      {uploadReauthSheet && (
        <GoogleSignInSheet
          mode="hard-sync"
          onClose={() => setUploadReauthSheet(false)}
          onUserSignedIn={auth.applyGoogleSignIn}
          onSuccess={async (result) => {
            await handlePostLoginSync(result.taxRecalcQueued);
            setUploadReauthSheet(false);
            void flushPendingUploadsRef.current({ force: true });
          }}
        />
      )}

      {founderSheetOpen && (
        <FounderProgramSheet
          onClose={() => setFounderSheetOpen(false)}
          isSignedIn={auth.isSignedIn}
          onGoogleSignedIn={async (result) => {
            auth.applyGoogleSignIn(result);
          }}
          userEmail={auth.googleUser?.email}
          seasonLabel={auth.currentSeason}
          onProgramFull={() => {
            setFounderSheetOpen(false);
            setFounderRefreshTick((tick) => tick + 1);
          }}
          onPaid={() => openPaymentSuccess("founder", auth.currentSeason)}
        />
      )}

      <ExitConfirmSheet
        open={exitConfirmOpen}
        onStay={handleExitConfirmStay}
        onExit={handleExitConfirmExit}
      />
    </div>
  );
}
