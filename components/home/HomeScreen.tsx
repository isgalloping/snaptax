"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Industry, Receipt } from "@/lib/types";
import { useAuthSession } from "@/lib/client/useAuthSession";
import { ensureGhostSession } from "@/lib/client/ghostClient";
import { ensureTaxRegionCandidate } from "@/lib/client/taxRegion";
import {
  apiReceiptToLocal,
  fetchReceiptList,
  pollReceiptUntilSettled,
  sumLocalTaxSaved,
  uploadReceipt,
} from "@/lib/client/receiptApi";
import { utcNow } from "@/lib/time/utc";
import {
  deleteReceipt as deleteStoredReceipt,
  loadPhoto,
  loadReceipts,
  savePhoto,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { GoogleSignInSheet } from "@/components/auth/GoogleSignInSheet";
import { TaxHeader } from "./TaxHeader";
import { SnapButton } from "./SnapButton";
import { ReceiptList } from "./ReceiptList";
import { GoogleSoftBanner } from "./GoogleSoftBanner";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

type View = "home" | "settings";

function mergeReceipts(local: StoredReceipt[], remote: Receipt[]): Receipt[] {
  const byId = new Map<string, Receipt>();
  for (const r of remote) byId.set(r.id, r);
  for (const r of local) {
    if (r.pendingUpload || !byId.has(r.id)) byId.set(r.id, r);
  }
  return [...byId.values()].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
}

export function HomeScreen() {
  const auth = useAuthSession();
  const [view, setView] = useState<View>("home");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [taxSaved, setTaxSaved] = useState<number | null>(null);
  const [taxAnimating, setTaxAnimating] = useState(false);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [hasOpenedSettings, setHasOpenedSettings] = useState(false);
  const [showGoogleSheet, setShowGoogleSheet] = useState(false);
  const [resnapId, setResnapId] = useState<string | null>(null);
  const pollingRef = useRef<Set<string>>(new Set());

  const completedCount = receipts.filter((r) => r.status === "done").length;
  const showSoftBanner =
    auth.hydrated &&
    !auth.isSignedIn &&
    !auth.softBannerDismissed &&
    (completedCount >= 3 || hasOpenedSettings);

  const refreshTaxSaved = useCallback((next: Receipt[], apiEstimate?: number) => {
    if (apiEstimate != null && navigator.onLine) {
      setTaxSaved(apiEstimate);
    } else {
      setTaxSaved(sumLocalTaxSaved(next));
    }
  }, []);

  const syncFromServer = useCallback(async (local: StoredReceipt[]) => {
    if (!navigator.onLine) {
      setReceipts(local);
      refreshTaxSaved(local);
      return;
    }
    try {
      const { receipts: remote, taxSavedEstimate } = await fetchReceiptList();
      const merged = mergeReceipts(local, remote.map(apiReceiptToLocal));
      setReceipts(merged);
      refreshTaxSaved(merged, taxSavedEstimate);
    } catch {
      setReceipts(local);
      refreshTaxSaved(local);
    }
  }, [refreshTaxSaved]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        ensureTaxRegionCandidate();
        if (navigator.onLine) {
          await ensureGhostSession();
        }
        const stored = await loadReceipts();
        if (cancelled) return;
        await syncFromServer(stored);
      } catch {
        const stored = await loadReceipts().catch(() => []);
        if (!cancelled) {
          setReceipts(stored);
          refreshTaxSaved(stored);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshTaxSaved, syncFromServer]);

  const applyReceiptUpdate = useCallback(
    async (updated: StoredReceipt, apiEstimate?: number) => {
      setReceipts((prev) => {
        const next = prev.map((r) => (r.id === updated.id ? updated : r));
        refreshTaxSaved(next, apiEstimate);
        return next;
      });
      await saveReceipt(updated);

      if (updated.status === "done" && updated.taxAmount != null) {
        setTaxAnimating(true);
        setTimeout(() => setTaxAnimating(false), 600);
      }
    },
    [refreshTaxSaved],
  );

  const pollReceipt = useCallback(
    async (id: string) => {
      if (pollingRef.current.has(id)) return;
      pollingRef.current.add(id);
      try {
        const result = await pollReceiptUntilSettled(id);
        const updated: StoredReceipt = {
          ...apiReceiptToLocal(result),
          pendingUpload: false,
        };
        const list = await fetchReceiptList().catch(() => null);
        await applyReceiptUpdate(updated, list?.taxSavedEstimate);
      } catch {
        // keep processing state; user can resnap
      } finally {
        pollingRef.current.delete(id);
      }
    },
    [applyReceiptUpdate],
  );

  const uploadPending = useCallback(
    async (receipt: StoredReceipt) => {
      const photo = await loadPhoto(receipt.id);
      if (!photo) return;

      const uploaded = await uploadReceipt(photo, receipt.timestamp);
      await deleteStoredReceipt(receipt.id);
      await savePhoto(uploaded.id, photo);
      const updated: StoredReceipt = {
        ...apiReceiptToLocal(uploaded),
        pendingUpload: false,
      };
      setReceipts((prev) => [
        updated,
        ...prev.filter((r) => r.id !== receipt.id),
      ]);
      await saveReceipt(updated);
      const list = await fetchReceiptList().catch(() => null);
      refreshTaxSaved(
        [updated, ...(await loadReceipts()).filter((r) => r.id !== receipt.id && r.id !== uploaded.id)],
        list?.taxSavedEstimate,
      );

      if (updated.status === "processing") {
        void pollReceipt(updated.id);
      }
    },
    [pollReceipt, refreshTaxSaved],
  );

  const flushPendingUploads = useCallback(async () => {
    const stored = await loadReceipts();
    const pending = stored.filter((r) => r.pendingUpload);
    for (const receipt of pending) {
      try {
        await uploadPending(receipt);
      } catch {
        // remain queued
      }
    }
  }, [uploadPending]);

  useEffect(() => {
    const handleOnline = () => {
      void (async () => {
        try {
          await ensureGhostSession();
        } catch {
          return;
        }
        await flushPendingUploads();
        const stored = await loadReceipts();
        await syncFromServer(stored);
      })();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [flushPendingUploads, syncFromServer]);

  const handleCapture = useCallback(
    async (file: File) => {
      const replaceId = resnapId;
      setResnapId(null);

      if (replaceId) {
        setReceipts((prev) => prev.filter((r) => r.id !== replaceId));
        await deleteStoredReceipt(replaceId);
      }

      const id = crypto.randomUUID();
      const snapAt = utcNow();
      const processingReceipt: StoredReceipt = {
        id,
        status: "processing",
        merchant: "Scanning",
        timestamp: snapAt,
        pendingUpload: !navigator.onLine,
      };

      setReceipts((prev) => [processingReceipt, ...prev]);
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
        };
        setReceipts((prev) => [
          updated,
          ...prev.filter((r) => r.id !== id),
        ]);
        await saveReceipt(updated);

        if (updated.status === "done" && updated.taxAmount != null) {
          setTaxAnimating(true);
          setTimeout(() => setTaxAnimating(false), 600);
        }
        const list = await fetchReceiptList().catch(() => null);
        refreshTaxSaved(
          [
            updated,
            ...(await loadReceipts()).filter((r) => r.id !== id && r.id !== serverId),
          ],
          list?.taxSavedEstimate,
        );

        if (updated.status === "processing") {
          void pollReceipt(updated.id);
        }
      } catch {
        await saveReceipt({ ...processingReceipt, pendingUpload: true });
      }
    },
    [resnapId, applyReceiptUpdate, pollReceipt],
  );

  const handleResnap = useCallback((id: string) => {
    setResnapId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSoftBannerOpen = () => {
    setShowGoogleSheet(true);
  };

  const handleSoftGoogleSuccess = async () => {
    const result = await auth.signInWithGoogle();
    setShowGoogleSheet(false);
    if (result.taxRecalcQueued > 0) {
      const stored = await loadReceipts();
      await syncFromServer(stored);
    }
  };

  const handleSoftNotNow = () => {
    auth.dismissSoftBanner();
    setShowGoogleSheet(false);
  };

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
          setView("home");
        }}
        googleUser={auth.googleUser}
        seasonPaid={auth.seasonPaid}
        currentSeason={auth.currentSeason}
        onSignInWithGoogle={auth.signInWithGoogle}
        onSeasonPaid={auth.markSeasonPaid}
        refreshSeasonPaid={auth.refreshSeasonPaid}
        isSignedIn={auth.isSignedIn}
      />
    );
  }

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden bg-black font-sans text-white select-none">
      <TaxHeader
        taxSaved={taxSaved}
        animating={taxAnimating}
        onSettingsClick={() => {
          setHasOpenedSettings(true);
          setView("settings");
        }}
      />

      <SnapButton onCapture={handleCapture} resnapId={resnapId} />

      {showSoftBanner && (
        <GoogleSoftBanner onSignIn={handleSoftBannerOpen} />
      )}

      <ReceiptList receipts={receipts} onResnap={handleResnap} />

      {showGoogleSheet && (
        <GoogleSignInSheet
          mode="soft"
          onClose={handleSoftNotNow}
          onSuccess={handleSoftGoogleSuccess}
        />
      )}
    </div>
  );
}
