import type { StoredReceipt } from "@/lib/storage/receiptDb";
import {
  loadPhoto,
  loadReceipt,
  savePhoto,
  saveReceipt,
} from "@/lib/storage/receiptDb";
import { utcNow } from "@/lib/time/utc";

export const ONBOARDING_DEMO_RECEIPT_ID = "onboarding-demo-receipt";
export const ONBOARDING_DEMO_TAX_SAVED = 28.5;
export const ONBOARDING_DEMO_AMOUNT = 193.12;
export const DEMO_SAMPLE_IMAGE_URL = "/onboarding/sample-builder-depot.png";

export function createShadowDemoReceipt(): StoredReceipt {
  const now = utcNow();
  return {
    id: ONBOARDING_DEMO_RECEIPT_ID,
    status: "processing",
    merchant: "SAMPLE: Builder Depot",
    amount: ONBOARDING_DEMO_AMOUNT,
    taxAmount: 0,
    currency: "USD",
    dataRegion: "us",
    deductible: true,
    isOnboardingDemo: true,
    subtitle: "Pending Test",
    timestamp: now,
    updatedAt: now,
  };
}

export function completeDemoReceipt(receipt: StoredReceipt): StoredReceipt {
  const now = utcNow();
  return {
    ...receipt,
    status: "done",
    taxAmount: ONBOARDING_DEMO_TAX_SAVED,
    subtitle: "COMPLETE",
    updatedAt: now,
  };
}

export async function attachDemoSamplePhoto(): Promise<boolean> {
  if (typeof fetch === "undefined") return false;
  try {
    const res = await fetch(DEMO_SAMPLE_IMAGE_URL);
    if (!res.ok) return false;
    const blob = await res.blob();
    await savePhoto(ONBOARDING_DEMO_RECEIPT_ID, blob);
    return true;
  } catch {
    return false;
  }
}

export async function convertDemoReceiptAfterLogin(): Promise<void> {
  const demo = await loadReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  if (!demo) return;

  const online = typeof navigator !== "undefined" && navigator.onLine;
  if (online) {
    const attached = await attachDemoSamplePhoto();
    await saveReceipt({
      ...demo,
      isOnboardingDemo: false,
      pendingUpload: attached,
    });
    return;
  }

  await saveReceipt({ ...demo, isOnboardingDemo: false });
}

/** After offline login, attach sample photo when back online so flush can upload. */
export async function ensureConvertedDemoUploadReady(): Promise<void> {
  const demo = await loadReceipt(ONBOARDING_DEMO_RECEIPT_ID);
  if (!demo || demo.isOnboardingDemo || demo.hasRemoteImage) return;

  const online = typeof navigator !== "undefined" && navigator.onLine;
  if (!online) return;

  const hasPhoto = (await loadPhoto(ONBOARDING_DEMO_RECEIPT_ID)) != null;
  if (!hasPhoto) {
    const attached = await attachDemoSamplePhoto();
    if (!attached) return;
  }

  if (!demo.pendingUpload) {
    await saveReceipt({ ...demo, pendingUpload: true });
  }
}
