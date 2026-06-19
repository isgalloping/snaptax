import type { Receipt } from "@/lib/types";
import type { UserCopy } from "@/lib/i18n";
import { formatCurrencyForRegion } from "@/lib/format";
import { fetchReceiptImageUrlCached } from "@/lib/client/receiptImageCache";
import { isPersistedReceiptId } from "@/lib/receipts/receiptId";
import { loadPhoto } from "@/lib/storage/receiptDb";
import { irsScheduleLineBadge } from "@/lib/tax/irsScheduleLabel";
import { isIncomeFormType } from "@/lib/export/incomeDocuments";

export type ReceiptDetailHero =
  | { kind: "processing" }
  | { kind: "blurry" }
  | {
      kind: "done";
      savedLabel: string;
      subtitle: string;
      muted?: boolean;
      incomeForm?: boolean;
    };

export type ResolvedReceiptImage =
  | { kind: "local"; src: string; revoke?: () => void }
  | { kind: "remote"; src: string; expiresAt: string }
  | { kind: "offline-placeholder" }
  | { kind: "missing" };

export function buildReceiptDetailHero(
  receipt: Receipt,
  heroCopy: UserCopy["receiptDetail"]["hero"],
): ReceiptDetailHero {
  if (receipt.status === "processing") return { kind: "processing" };
  if (receipt.status === "blurry") return { kind: "blurry" };

  const region = receipt.dataRegion ?? "us";
  const tax = receipt.taxAmount ?? 0;
  const currency = receipt.currency ?? (region === "eu" ? "EUR" : "USD");
  const formType = receipt.category?.toUpperCase().trim();

  if (isIncomeFormType(formType)) {
    const amount = receipt.amount ?? 0;
    return {
      kind: "done",
      savedLabel: formatCurrencyForRegion(amount, currency, region),
      subtitle: heroCopy.income1099.replace("{form}", formType ?? "1099"),
      incomeForm: true,
    };
  }

  if (receipt.deductible === false || tax <= 0) {
    return {
      kind: "done",
      savedLabel: formatCurrencyForRegion(0, currency, region),
      subtitle:
        region === "eu"
          ? heroCopy.personalEu
          : heroCopy.personalUs,
      muted: true,
    };
  }

  const formatted = formatCurrencyForRegion(tax, currency, region);
  const subtitle =
    region === "eu" ? heroCopy.addedVat : heroCopy.addedScheduleC;

  return {
    kind: "done",
    savedLabel: `-${formatted}`,
    subtitle,
  };
}

export function formatPartialMerchant(
  merchant: string | undefined,
  copy: Pick<UserCopy["receiptDetail"], "partialMerchantUnknown" | "partialMerchantUnclear">,
): string {
  if (!merchant?.trim()) return copy.partialMerchantUnknown;
  const trimmed = merchant.trim();
  if (trimmed.length <= 12) {
    return copy.partialMerchantUnclear.replace("{merchant}", trimmed);
  }
  return copy.partialMerchantUnclear.replace(
    "{merchant}",
    `${trimmed.slice(0, 12)}...`,
  );
}

function firstResolvedImage(
  tasks: Array<() => Promise<ResolvedReceiptImage | null>>,
): Promise<ResolvedReceiptImage | null> {
  if (tasks.length === 0) return Promise.resolve(null);
  return new Promise((resolve) => {
    let pending = tasks.length;
    let settled = false;
    for (const run of tasks) {
      void run()
        .then((result) => {
          if (settled) return;
          if (result && (result.kind === "local" || result.kind === "remote")) {
            settled = true;
            resolve(result);
            return;
          }
          pending -= 1;
          if (pending === 0) resolve(null);
        })
        .catch(() => {
          pending -= 1;
          if (!settled && pending === 0) resolve(null);
        });
    }
  });
}

export async function resolveReceiptImage(
  receipt: Receipt,
): Promise<ResolvedReceiptImage> {
  const persisted = isPersistedReceiptId(receipt.id);
  const online = typeof navigator === "undefined" || navigator.onLine;

  const tryRemote = async (): Promise<ResolvedReceiptImage | null> => {
    if (!persisted) return null;
    if (!online) return { kind: "offline-placeholder" };
    try {
      const { url, expiresAt } = await fetchReceiptImageUrlCached(receipt.id);
      return { kind: "remote", src: url, expiresAt };
    } catch {
      return null;
    }
  };

  const tryLocal = async (): Promise<ResolvedReceiptImage | null> => {
    const blob = await loadPhoto(receipt.id);
    if (!blob) return null;
    const src = URL.createObjectURL(blob);
    return { kind: "local", src, revoke: () => URL.revokeObjectURL(src) };
  };

  if (!online) {
    const local = await tryLocal();
    if (local) return local;
    return { kind: "offline-placeholder" };
  }

  const preferRemoteFirst =
    receipt.hasRemoteImage ||
    (persisted &&
      (receipt.status === "done" || receipt.status === "blurry"));

  if (preferRemoteFirst) {
    const winner = await firstResolvedImage([tryRemote, tryLocal]);
    if (winner) return winner;
    return { kind: "missing" };
  }

  const local = await tryLocal();
  if (local) return local;
  const remote = await tryRemote();
  if (remote) return remote;
  return { kind: "missing" };
}

export { irsScheduleLineBadge };
