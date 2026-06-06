"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Industry, Receipt } from "@/lib/types";
import {
  INITIAL_TAX_SAVED,
  createSeedReceipts,
  mockProcessReceipt,
} from "@/lib/mockReceipts";
import { utcNow } from "@/lib/time/utc";
import {
  deleteReceipt as deleteStoredReceipt,
  loadReceipts,
  savePhoto,
  saveReceipt,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import { TaxHeader } from "./TaxHeader";
import { SnapButton } from "./SnapButton";
import { ReceiptList } from "./ReceiptList";
import { RegisterBanner } from "./RegisterBanner";
import { RegisterSheet } from "./RegisterSheet";
import { SettingsScreen } from "@/components/settings/SettingsScreen";

type View = "home" | "settings";

const PROCESSING_DELAY_MS = 2500;

function calcTaxSaved(receipts: Receipt[]): number {
  return receipts.reduce((sum, receipt) => {
    if (receipt.status === "done" && receipt.amount) {
      return sum + receipt.amount * 0.25;
    }
    return sum;
  }, 0);
}

export function HomeScreen() {
  const [view, setView] = useState<View>("home");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [taxSaved, setTaxSaved] = useState<number | null>(null);
  const [taxAnimating, setTaxAnimating] = useState(false);
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [registered, setRegistered] = useState(false);
  const [hasOpenedSettings, setHasOpenedSettings] = useState(false);
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);
  const [resnapId, setResnapId] = useState<string | null>(null);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const completedCount = receipts.filter((r) => r.status === "done").length;
  const showRegisterBanner =
    !registered && (completedCount >= 3 || hasOpenedSettings);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const stored = await loadReceipts();
        if (cancelled) return;

        if (stored.length > 0) {
          setReceipts(stored);
          setTaxSaved(calcTaxSaved(stored));
        } else {
          const seed = createSeedReceipts();
          setReceipts(seed);
          setTaxSaved(INITIAL_TAX_SAVED);
          await Promise.all(seed.map((receipt) => saveReceipt(receipt)));
        }
      } catch {
        const seed = createSeedReceipts();
        if (!cancelled) {
          setReceipts(seed);
          setTaxSaved(INITIAL_TAX_SAVED);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const bumpTaxSaved = useCallback((amount: number) => {
    setTaxSaved((prev) => (prev ?? 0) + amount);
    setTaxAnimating(true);
    setTimeout(() => setTaxAnimating(false), 600);
  }, []);

  const finishProcessing = useCallback(
    async (id: string) => {
      const result = mockProcessReceipt();

      setReceipts((prev) => {
        const next = prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...result,
                timestamp: utcNow(),
                pendingUpload: false,
              }
            : r,
        );
        return next;
      });

      const updated: StoredReceipt = {
        id,
        ...result,
        timestamp: utcNow(),
        pendingUpload: false,
      };
      await saveReceipt(updated);

      if (result.status === "done" && result.amount) {
        bumpTaxSaved(result.amount * 0.25);
      }

      timersRef.current.delete(id);
    },
    [bumpTaxSaved],
  );

  const scheduleProcessing = useCallback(
    (id: string) => {
      const existingTimer = timersRef.current.get(id);
      if (existingTimer) clearTimeout(existingTimer);

      if (!navigator.onLine) return;

      const timer = setTimeout(() => {
        void finishProcessing(id);
      }, PROCESSING_DELAY_MS);
      timersRef.current.set(id, timer);
    },
    [finishProcessing],
  );

  useEffect(() => {
    const handleOnline = () => {
      receipts
        .filter((receipt) => receipt.status === "processing")
        .forEach((receipt) => scheduleProcessing(receipt.id));
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [receipts, scheduleProcessing]);

  const handleCapture = useCallback(
    async (file: File) => {
      const replaceId = resnapId;
      setResnapId(null);

      if (replaceId) {
        setReceipts((prev) => prev.filter((r) => r.id !== replaceId));
        const existingTimer = timersRef.current.get(replaceId);
        if (existingTimer) clearTimeout(existingTimer);
        timersRef.current.delete(replaceId);
        await deleteStoredReceipt(replaceId);
      }

      const id = crypto.randomUUID();
      const processingReceipt: StoredReceipt = {
        id,
        status: "processing",
        merchant: "Scanning",
        timestamp: utcNow(),
        pendingUpload: !navigator.onLine,
      };

      setReceipts((prev) => [processingReceipt, ...prev]);
      await savePhoto(id, file);
      await saveReceipt(processingReceipt);
      scheduleProcessing(id);
    },
    [resnapId, scheduleProcessing],
  );

  const handleResnap = useCallback((id: string) => {
    setResnapId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (!hydrated) {
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

      {showRegisterBanner && (
        <RegisterBanner onRegister={() => setShowRegisterSheet(true)} />
      )}

      <ReceiptList receipts={receipts} onResnap={handleResnap} />

      {showRegisterSheet && (
        <RegisterSheet
          onClose={() => setShowRegisterSheet(false)}
          onComplete={() => {
            setRegistered(true);
            setShowRegisterSheet(false);
          }}
        />
      )}
    </div>
  );
}
