import { receiptUpdatedAt } from "@/lib/client/receiptSync";
import { computeSummaryDelta } from "@/lib/storage/receiptSummaryDelta";
import type {
  ReceiptSeasonSummary,
  ReceiptSummaryWatermark,
} from "@/lib/storage/receiptSummaryTypes";
import {
  RECEIPT_SUMMARY_SCHEMA_VERSION,
  RECEIPT_SUMMARY_WATERMARK_KEY,
} from "@/lib/storage/receiptSummaryTypes";
import {
  loadAllReceipts,
  warmReceiptDb,
  type StoredReceipt,
} from "@/lib/storage/receiptDb";
import {
  IDB_LEGACY_SYSTEM_META,
  IDB_STORE_RECEIPT_SUMMARY,
  IDB_STORE_SYSTEM_META,
} from "@/lib/storage/idbStores";
import {
  countReceiptsInTaxYearAllStatuses,
  currentTaxYear,
  effectiveReceiptTaxYear,
} from "@/lib/tax/taxYearStats";
import { clientTimeZone } from "@/lib/time/timeZone";

export function scopeKeyForTaxYear(taxYear: number): string {
  return String(taxYear);
}

function emptySeasonSummary(taxYear: number): ReceiptSeasonSummary {
  return {
    scopeKey: scopeKeyForTaxYear(taxYear),
    taxYear,
    unfiledTaxSaved: 0,
    totalReceiptCount: 0,
    totalDeductions: 0,
    incomeFormCount: 0,
    totalIncomeGross: 0,
    lastUpdatedMs: Date.now(),
  };
}

function clampSummary(summary: ReceiptSeasonSummary): ReceiptSeasonSummary {
  return {
    ...summary,
    unfiledTaxSaved: Math.max(0, summary.unfiledTaxSaved),
    totalReceiptCount: Math.max(0, summary.totalReceiptCount),
    totalDeductions: Math.max(0, summary.totalDeductions),
    incomeFormCount: Math.max(0, summary.incomeFormCount),
    totalIncomeGross: Math.max(0, summary.totalIncomeGross),
  };
}

function systemMetaStoreName(db: IDBDatabase): string {
  return db.objectStoreNames.contains(IDB_STORE_SYSTEM_META)
    ? IDB_STORE_SYSTEM_META
    : IDB_LEGACY_SYSTEM_META;
}

function summaryStoreExists(db: IDBDatabase): boolean {
  return db.objectStoreNames.contains(IDB_STORE_RECEIPT_SUMMARY);
}

async function readSummaryRow(
  db: IDBDatabase,
  scopeKey: string,
): Promise<ReceiptSeasonSummary | null> {
  if (!summaryStoreExists(db)) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_SUMMARY, "readonly");
    const request = tx.objectStore(IDB_STORE_RECEIPT_SUMMARY).get(scopeKey);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve((request.result as ReceiptSeasonSummary | undefined) ?? null);
    };
  });
}

async function putSummaryRow(
  db: IDBDatabase,
  summary: ReceiptSeasonSummary,
): Promise<void> {
  if (!summaryStoreExists(db)) return;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE_RECEIPT_SUMMARY, "readwrite");
    const request = tx.objectStore(IDB_STORE_RECEIPT_SUMMARY).put(summary);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function readSystemMetaValue<T>(
  db: IDBDatabase,
  key: string,
): Promise<T | null> {
  const store = systemMetaStoreName(db);
  if (!db.objectStoreNames.contains(store)) return null;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const request = tx.objectStore(store).get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const row = request.result as { key: string; value: T } | undefined;
      resolve(row?.value ?? null);
    };
  });
}

async function writeSystemMetaValue<T>(
  db: IDBDatabase,
  key: string,
  value: T,
): Promise<void> {
  const store = systemMetaStoreName(db);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const request = tx.objectStore(store).put({ key, value });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export function buildSeasonSummaryFromReceipts(
  receipts: StoredReceipt[],
  taxYear: number,
  timeZone: string,
): ReceiptSeasonSummary {
  let unfiledTaxSaved = 0;
  let totalReceiptCount = 0;
  let totalDeductions = 0;
  let incomeFormCount = 0;
  let totalIncomeGross = 0;

  for (const receipt of receipts) {
    const delta = computeSummaryDelta(null, receipt, taxYear, timeZone);
    unfiledTaxSaved += delta.unfiledTaxSaved;
    totalReceiptCount += delta.totalReceiptCount;
    totalDeductions += delta.totalDeductions;
    incomeFormCount += delta.incomeFormCount;
    totalIncomeGross += delta.totalIncomeGross;
  }

  return clampSummary({
    scopeKey: scopeKeyForTaxYear(taxYear),
    taxYear,
    unfiledTaxSaved,
    totalReceiptCount,
    totalDeductions,
    incomeFormCount,
    totalIncomeGross,
    lastUpdatedMs: Date.now(),
  });
}

export function computeWatermarkFromReceipts(
  receipts: StoredReceipt[],
  taxYear: number,
  timeZone: string,
): ReceiptSummaryWatermark {
  let maxUpdatedAtMs = 0;
  for (const receipt of receipts) {
    if (effectiveReceiptTaxYear(receipt, timeZone) !== taxYear) continue;
    maxUpdatedAtMs = Math.max(
      maxUpdatedAtMs,
      receiptUpdatedAt(receipt).getTime(),
    );
  }
  return {
    maxUpdatedAtMs,
    receiptCountInCurrentSeason: countReceiptsInTaxYearAllStatuses(
      receipts,
      taxYear,
      timeZone,
    ),
    schemaVersion: RECEIPT_SUMMARY_SCHEMA_VERSION,
  };
}

export async function readSummaryWatermark(
  db: IDBDatabase,
): Promise<ReceiptSummaryWatermark | null> {
  return readSystemMetaValue<ReceiptSummaryWatermark>(
    db,
    RECEIPT_SUMMARY_WATERMARK_KEY,
  );
}

export async function writeSummaryWatermark(db: IDBDatabase): Promise<void> {
  const timeZone = clientTimeZone();
  const taxYear = currentTaxYear(timeZone);
  const receipts = await loadAllReceipts();
  const watermark = computeWatermarkFromReceipts(receipts, taxYear, timeZone);
  await writeSystemMetaValue(db, RECEIPT_SUMMARY_WATERMARK_KEY, watermark);
}

export async function readCurrentSeasonSummary(): Promise<ReceiptSeasonSummary> {
  const timeZone = clientTimeZone();
  const taxYear = currentTaxYear(timeZone);
  const db = await warmReceiptDb();
  const row = await readSummaryRow(db, scopeKeyForTaxYear(taxYear));
  return row ?? emptySeasonSummary(taxYear);
}

export async function readCurrentSeasonUnfiledTaxSaved(): Promise<number> {
  const summary = await readCurrentSeasonSummary();
  return summary.unfiledTaxSaved;
}

export async function applyReceiptSummaryDelta(
  db: IDBDatabase,
  prev: StoredReceipt | null,
  next: StoredReceipt | null,
): Promise<void> {
  if (!summaryStoreExists(db)) return;

  const timeZone = clientTimeZone();
  const taxYear = currentTaxYear(timeZone);
  const scopeKey = scopeKeyForTaxYear(taxYear);
  const delta = computeSummaryDelta(prev, next, taxYear, timeZone);
  const base = (await readSummaryRow(db, scopeKey)) ?? emptySeasonSummary(taxYear);

  const updated = clampSummary({
    ...base,
    unfiledTaxSaved: base.unfiledTaxSaved + delta.unfiledTaxSaved,
    totalReceiptCount: base.totalReceiptCount + delta.totalReceiptCount,
    totalDeductions: base.totalDeductions + delta.totalDeductions,
    incomeFormCount: base.incomeFormCount + delta.incomeFormCount,
    totalIncomeGross: base.totalIncomeGross + delta.totalIncomeGross,
    lastUpdatedMs: Date.now(),
  });

  await putSummaryRow(db, updated);
  await writeSummaryWatermark(db);
}

export async function rebuildCurrentSeasonSummary(
  db: IDBDatabase,
): Promise<ReceiptSeasonSummary> {
  const timeZone = clientTimeZone();
  const taxYear = currentTaxYear(timeZone);
  const receipts = await loadAllReceipts();
  const summary = buildSeasonSummaryFromReceipts(receipts, taxYear, timeZone);
  await putSummaryRow(db, summary);
  await writeSummaryWatermark(db);
  return summary;
}
