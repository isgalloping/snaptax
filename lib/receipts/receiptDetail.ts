import type { Receipt } from "@/lib/types";
import { formatCurrencyForRegion } from "@/lib/format";
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
): Promise<{ src: string | null; revoke?: () => void }> {
  if (receipt.imageUrl) {
    return { src: receipt.imageUrl };
  }

  const blob = await loadPhoto(receipt.id);
  if (!blob) return { src: null };

  const src = URL.createObjectURL(blob);
  return { src, revoke: () => URL.revokeObjectURL(src) };
}

export { irsScheduleLineBadge };
