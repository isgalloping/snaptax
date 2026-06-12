import type { Receipt } from "@/lib/types";
import { formatCurrencyForRegion } from "@/lib/format";
import { fetchReceiptImageUrl } from "@/lib/client/receiptApi";
import { loadPhoto } from "@/lib/storage/receiptDb";
import { irsScheduleLineBadge } from "@/lib/tax/irsScheduleLabel";

export type ReceiptDetailHero =
  | { kind: "processing" }
  | { kind: "blurry" }
  | {
      kind: "done";
      savedLabel: string;
      subtitle: string;
      muted?: boolean;
    };

export type ResolvedReceiptImage =
  | { kind: "local"; src: string; revoke?: () => void }
  | { kind: "remote"; src: string; expiresAt: string }
  | { kind: "offline-placeholder" }
  | { kind: "missing" };

export function buildReceiptDetailHero(receipt: Receipt): ReceiptDetailHero {
  if (receipt.status === "processing") return { kind: "processing" };
  if (receipt.status === "blurry") return { kind: "blurry" };

  const region = receipt.dataRegion ?? "us";
  const tax = receipt.taxAmount ?? 0;
  const currency = receipt.currency ?? (region === "eu" ? "EUR" : "USD");

  if (receipt.deductible === false || tax <= 0) {
    return {
      kind: "done",
      savedLabel: formatCurrencyForRegion(0, currency, region),
      subtitle:
        region === "eu"
          ? "Personal expense — no VAT recovery"
          : "Personal (Non-Deductible)",
      muted: true,
    };
  }

  const formatted = formatCurrencyForRegion(tax, currency, region);
  const subtitle =
    region === "eu"
      ? "✓ Added to VAT recovery"
      : "✓ Added to Schedule C Deduction";

  return {
    kind: "done",
    savedLabel: `-${formatted}`,
    subtitle,
  };
}

export function formatPartialMerchant(merchant: string | undefined): string {
  if (!merchant?.trim()) return "Unknown (Unclear)";
  const trimmed = merchant.trim();
  if (trimmed.length <= 12) return `${trimmed} (Unclear)`;
  return `${trimmed.slice(0, 12)}... (Unclear)`;
}

export async function resolveReceiptImage(
  receipt: Receipt,
): Promise<ResolvedReceiptImage> {
  if (receipt.hasRemoteImage) {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return { kind: "offline-placeholder" };
    }
    try {
      const { url, expiresAt } = await fetchReceiptImageUrl(receipt.id);
      return { kind: "remote", src: url, expiresAt };
    } catch {
      return { kind: "missing" };
    }
  }

  const blob = await loadPhoto(receipt.id);
  if (!blob) return { kind: "missing" };

  const src = URL.createObjectURL(blob);
  return { kind: "local", src, revoke: () => URL.revokeObjectURL(src) };
}

export { irsScheduleLineBadge };
