"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Industry, Receipt } from "@/lib/types";
import { useAuthSession } from "@/lib/client/useAuthSession";
import { ensureGhostSession } from "@/lib/client/ghostClient";
import { ensureTaxRegionCandidate } from "@/lib/client/taxRegion";
import {
  apiReceiptToLocal,
  fetchReceiptList,
  sumLocalTaxSaved,
  triggerReceiptProcess,
  uploadReceipt,
  type ApiReceipt,
} from "@/lib/client/receiptApi";
import { pollTaxRecalc } from "@/lib/client/authApi";
import {
  persistMergedReceipts,
  remoteReceiptsToLocal,
  top100ByUpdatedAt,
  unionMergeLWW,
} from "@/lib/client/receiptSync";
import {
  getBudget,
  isSyncStuck,
  recordWriteFailure,
  resetBudget,
  withFreshBudget,
} from "@/lib/client/receiptSyncBudget";
import { ProcessingQueue } from "@/lib/client/processingQueue";
import { ProcessingReceiptWatcher } from "@/lib/client/processingReceiptWatcher";
import { utcNow } from "@/lib/time/utc";
import {
  deleteReceipt as deleteStoredReceipt,
  loadPhoto,
  loadReceipts,
  savePhoto,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { TaxHeader } from "./TaxHeader";
import { SnapButton, type SnapButtonHandle } from "./SnapButton";
import { ReceiptList } from "./ReceiptList";
import { sumDoneExpenses } from "@/lib/receipts/receiptStats";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { ReceiptDetailSheet } from "@/components/receipts/ReceiptDetailSheet";

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
  const [view, setView] = useState<View>("home");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [taxSaved, setTaxSaved] = useState<number | null>(null);
  const [taxAnimating, setTaxAnimating] = useState(false);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [resnapId, setResnapId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [appHidden, setAppHidden] = useState(false);
  const [listSyncing, setListSyncing] = useState(false);
  const [syncStuckIds, setSyncStuckIds] = useState<Set<string>>(() => new Set());
  const watcherRef = useRef<ProcessingReceiptWatcher | null>(null);
  const queueRef = useRef<ProcessingQueue | null>(null);
  const flushPendingUploadsRef = useRef<() => Promise<void>>(async () => {});
  const uploadPendingInnerRef = useRef<
    (receipt: StoredReceipt) => Promise<void>
  >(async () => {});
  const receiptsRef = useRef<Receipt[]>([]);
  const cameraOpenRef = useRef(false);
  const pendingMergeRef = useRef<{
    receipts: Receipt[];
    taxSavedEstimate?: number;
  } | null>(null);
  const snapButtonRef = useRef<SnapButtonHandle>(null);

  useEffect(() => {
    receiptsRef.current = receipts;
  }, [receipts]);

  useEffect(() => {
    cameraOpenRef.current = cameraOpen;
  }, [cameraOpen]);

  const refreshTaxSaved = useCallback((next: Receipt[], apiEstimate?: number) => {
    if (apiEstimate != null && navigator.onLine) {
      setTaxSaved(apiEstimate);
    } else {
      setTaxSaved(sumLocalTaxSaved(next));
    }
  }, []);

  const applyMergeNow = useCallback(
    (merged: Receipt[], taxSavedEstimate?: number) => {
      setReceipts(merged);
      refreshTaxSaved(merged, taxSavedEstimate);
    },
    [refreshTaxSaved],
  );

  const applyMergeOrDefer = useCallback(
    (merged: Receipt[], taxSavedEstimate?: number) => {
      if (cameraOpenRef.current) {
        pendingMergeRef.current = { receipts: merged, taxSavedEstimate };
        return;
      }
      applyMergeNow(merged, taxSavedEstimate);
    },
    [applyMergeNow],
  );

  useEffect(() => {
    if (cameraOpen || !pendingMergeRef.current) return;
    const pending = pendingMergeRef.current;
    pendingMergeRef.current = null;
    applyMergeNow(pending.receipts, pending.taxSavedEstimate);
  }, [cameraOpen, applyMergeNow]);

  const syncFromServer = useCallback(
    async (
      local: StoredReceipt[],
      applyMode: "immediate" | "defer" = "defer",
    ): Promise<Receipt[]> => {
      if (!navigator.onLine) {
        applyMergeNow(local);
        return local;
      }
      try {
        const { receipts: remote, taxSavedEstimate } = await fetchReceiptList();
        const fullMerged = unionMergeLWW(
          local,
          remoteReceiptsToLocal(remote),
        );
        await persistMergedReceipts(fullMerged, local);
        const visible = top100ByUpdatedAt(fullMerged);
        if (applyMode === "immediate") {
          pendingMergeRef.current = null;
          applyMergeNow(visible, taxSavedEstimate);
        } else {
          applyMergeOrDefer(visible, taxSavedEstimate);
        }
        return visible;
      } catch {
        applyMergeNow(top100ByUpdatedAt(local));
        return top100ByUpdatedAt(local);
      }
    },
    [applyMergeNow, applyMergeOrDefer],
  );

  const applyReceiptUpdate = useCallback(
    async (updated: StoredReceipt, apiEstimate?: number) => {
      let merged = updated;
      setReceipts((prev) => {
        const existing = prev.find((r) => r.id === updated.id) as
          | StoredReceipt
          | undefined;
        merged = {
          ...updated,
          writeBudgetRemaining:
            updated.writeBudgetRemaining ?? existing?.writeBudgetRemaining,
        };
        const next = prev.map((r) => (r.id === merged.id ? merged : r));
        refreshTaxSaved(top100ByUpdatedAt(next as StoredReceipt[]), apiEstimate);
        return top100ByUpdatedAt(next as StoredReceipt[]);
      });
      await saveReceipt(merged);

      if (merged.status === "done" && merged.taxAmount != null) {
        setTaxAnimating(true);
        setTimeout(() => setTaxAnimating(false), 600);
      }
    },
    [refreshTaxSaved],
  );

  const applyFromApi = useCallback(
    async (api: ApiReceipt, apiEstimate?: number) => {
      const updated: StoredReceipt = {
        ...apiReceiptToLocal(api),
        pendingUpload: false,
      };
      await applyReceiptUpdate(updated, apiEstimate);
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

  const uploadPendingInner = async (receipt: StoredReceipt) => {
    if (isSyncStuck(receipt)) return;

    const photo = await loadPhoto(receipt.id);
    if (!photo) return;

    try {
      const uploaded = await uploadReceipt(photo, receipt.timestamp);
      await deleteStoredReceipt(receipt.id);
      await savePhoto(uploaded.id, photo);
      const updated: StoredReceipt = {
        ...apiReceiptToLocal(uploaded),
        pendingUpload: false,
        writeBudgetRemaining: getBudget(receipt),
      };
      setReceipts((prev) => {
        const next = [updated, ...prev.filter((r) => r.id !== receipt.id)];
        refreshTaxSaved(top100ByUpdatedAt(next));
        return top100ByUpdatedAt(next);
      });
      await saveReceipt(updated);

      if (updated.status === "processing") {
        queueRef.current?.enqueue(updated.id);
      }
    } catch {
      const failed = recordWriteFailure(receipt);
      await saveReceipt(failed);
      setReceipts((prev) => prev.map((r) => (r.id === failed.id ? failed : r)));
      if (isSyncStuck(failed)) {
        setSyncStuckIds((prev) => new Set(prev).add(failed.id));
      }
      throw failed;
    }
  };

  uploadPendingInnerRef.current = uploadPendingInner;

  const flushPendingUploads = useCallback(async () => {
    const stored = await loadReceipts();
    const pending = stored.filter(
      (r) => r.pendingUpload && !isSyncStuck(r),
    );
    for (const receipt of pending) {
      try {
        await uploadPendingInnerRef.current(receipt);
      } catch {
        // budget updated in uploadPendingInner
      }
    }
  }, []);

  flushPendingUploadsRef.current = flushPendingUploads;

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
          await flushPendingUploadsRef.current();
          if (cancelled()) return;
          const storedAfter = await loadReceipts();
          const mergedAfter = await syncFromServer(storedAfter, "defer");
          if (cancelled()) return;
          const stuck = stuckIdsFromReceipts(
            mergedAfter.filter((r): r is StoredReceipt => true),
          );
          setSyncStuckIds((prev) => new Set([...prev, ...stuck]));
          queueRef.current?.bootstrapFromList(
            mergedAfter.filter((r) => !stuck.has(r.id)),
          );
        })();
      });
    },
    [syncFromServer],
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
      onTaxSaved: (estimate) => {
        setReceipts((prev) => {
          refreshTaxSaved(prev, estimate);
          return prev;
        });
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
  }, [applyFromApi, refreshTaxSaved]);

  const handleRetrySync = useCallback(
    (id: string) => {
      void (async () => {
        const stored = await loadReceipts();
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
      const stored = await loadReceipts();
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
      await flushPendingUploadsRef.current();
      const stored = await loadReceipts();
      const merged = await syncFromServer(stored, "immediate");
      const stuck = stuckIdsFromReceipts(merged as StoredReceipt[]);
      setSyncStuckIds((prev) => new Set([...prev, ...stuck]));
      queueRef.current?.bootstrapFromList(
        merged.filter((r) => !stuck.has(r.id)),
      );
      if (taxRecalcQueued > 0) {
        await pollTaxRecalc(taxRecalcQueued, async () => {
          const latest = await loadReceipts();
          await syncFromServer(latest, "immediate");
        });
      }
    },
    [syncFromServer],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        ensureTaxRegionCandidate();
        const stored = await loadReceipts();
        if (cancelled) return;

        const visible = top100ByUpdatedAt(stored);
        setSyncStuckIds(stuckIdsFromReceipts(stored));
        setReceipts(visible);
        refreshTaxSaved(visible);
        setHydrated(true);

        if (navigator.onLine) {
          runDeferredStartup(() => cancelled);
        }
      } catch {
        const stored = await loadReceipts().catch(() => []);
        if (!cancelled) {
          const visible = top100ByUpdatedAt(stored);
          setReceipts(visible);
          setSyncStuckIds(stuckIdsFromReceipts(stored));
          refreshTaxSaved(visible);
          setHydrated(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshTaxSaved, runDeferredStartup, syncFromServer]);

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
    if (!navigator.onLine) return;

    const retryPending = () => {
      if (!navigator.onLine || document.visibilityState === "hidden") return;
      void flushPendingUploadsRef.current();
    };

    const intervalId = window.setInterval(retryPending, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

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
      appHidden;
    watcherRef.current?.setPaused(shouldPause);
  }, [cameraOpen, selectedReceipt, view, appHidden]);

  const handleCapture = useCallback(
    async (file: File) => {
      const replaceId = resnapId;
      setResnapId(null);

      if (replaceId) {
        setReceipts((prev) => prev.filter((r) => r.id !== replaceId));
        await deleteStoredReceipt(replaceId);
        watcherRef.current?.unwatch(replaceId);
        queueRef.current?.onSettled(replaceId);
        setSyncStuckIds((prev) => {
          if (!prev.has(replaceId)) return prev;
          const next = new Set(prev);
          next.delete(replaceId);
          return next;
        });
      }

      const id = crypto.randomUUID();
      const snapAt = utcNow();
      const processingReceipt: StoredReceipt = withFreshBudget({
        id,
        status: "processing",
        merchant: "Scanning",
        timestamp: snapAt,
        updatedAt: snapAt,
        pendingUpload: !navigator.onLine,
      });

      setReceipts((prev) => top100ByUpdatedAt([processingReceipt, ...prev]));
      await savePhoto(id, file);
      await saveReceipt(processingReceipt);

      if (!navigator.onLine) return;

      try {
        await ensureGhostSession();
        const uploaded = await uploadReceipt(file, snapAt);
        await deleteStoredReceipt(id);
        const serverId = uploaded.id;
        await savePhoto(serverId, file);
        const updated: StoredReceipt = {
          ...apiReceiptToLocal(uploaded),
          pendingUpload: false,
          writeBudgetRemaining: getBudget(processingReceipt),
        };
        setReceipts((prev) => {
          const next = [updated, ...prev.filter((r) => r.id !== id)];
          refreshTaxSaved(top100ByUpdatedAt(next));
          return top100ByUpdatedAt(next);
        });
        await saveReceipt(updated);

        if (updated.status === "done" && updated.taxAmount != null) {
          setTaxAnimating(true);
          setTimeout(() => setTaxAnimating(false), 600);
        }

        if (updated.status === "processing") {
          enqueueReceipt(updated.id);
        }
      } catch {
        const failed = recordWriteFailure(processingReceipt);
        await saveReceipt({ ...failed, pendingUpload: true });
        setReceipts((prev) =>
          prev.map((r) => (r.id === id ? { ...failed, pendingUpload: true } : r)),
        );
        if (isSyncStuck(failed)) {
          setSyncStuckIds((prev) => new Set(prev).add(id));
        }
      }
    },
    [resnapId, enqueueReceipt, refreshTaxSaved],
  );

  const handleResnap = useCallback((id: string) => {
    setResnapId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    snapButtonRef.current?.openCamera();
  }, []);

  if (!hydrated || !auth.hydrated) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-yellow-400">
        <p className="text-lg font-bold">Loading…</p>
      </div>
    );
  }

  if (view === "settings") {
    return (
      <SettingsScreen
        industry={industry}
        onIndustryChange={setIndustry}
        onBack={() => setView("home")}
        onLocalDataCleared={() => {
          setReceipts([]);
          setTaxSaved(null);
          setSyncStuckIds(new Set());
          queueRef.current?.clear();
          watcherRef.current?.reset();
          setView("home");
        }}
        googleUser={auth.googleUser}
        seasonPaid={auth.seasonPaid}
        currentSeason={auth.currentSeason}
        onSignInWithGoogle={auth.signInWithGoogle}
        onPostLoginSync={handlePostLoginSync}
        onSeasonPaid={auth.markSeasonPaid}
        refreshSeasonPaid={auth.refreshSeasonPaid}
        isSignedIn={auth.isSignedIn}
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-black font-sans text-white select-none">
      <TaxHeader
        taxSaved={taxSaved}
        totalExpenses={sumDoneExpenses(receipts)}
        receiptCount={receipts.length}
        animating={taxAnimating}
        onSettingsClick={() => setView("settings")}
        onSyncClick={handleManualListSync}
        syncing={listSyncing}
        syncDisabled={!navigator.onLine}
      />

      <div className="shrink-0 px-4 py-2">
        <SnapButton
          ref={snapButtonRef}
          onCapture={handleCapture}
          resnapId={resnapId}
          onCameraOpenChange={setCameraOpen}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <ReceiptList
          receipts={receipts}
          syncStuckIds={syncStuckIds}
          onSelect={(receipt) => setSelectedReceipt(receipt)}
          onResnap={handleResnap}
          onRetrySync={handleRetrySync}
          onSyncClick={handleManualListSync}
          syncing={listSyncing}
          syncDisabled={!navigator.onLine}
        />
      </div>

      {selectedReceipt && (
        <ReceiptDetailSheet
          receipt={selectedReceipt}
          syncStuck={syncStuckIds.has(selectedReceipt.id)}
          onClose={() => setSelectedReceipt(null)}
          onResnap={handleResnap}
          onRetrySync={handleRetrySync}
          onReceiptUpdate={(updated) => {
            setReceipts((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
            );
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
          }}
        />
      )}
    </div>
  );
}
