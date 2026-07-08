import { apiFetch } from "@/lib/client/ghostClient";
import { clientTimeZone } from "@/lib/time/timeZone";
import { parseUtcISOString } from "@/lib/time/utc";

export type ExportFiledSyncResult = {
  taxSeason: string;
  taxSeasonDate: Date;
  filedCount: number;
  receiptIds: string[];
};

const FILED_SYNC_TIMEOUT_MS = 90_000;

export async function syncExportFiledToServer(params: {
  taxYear: string;
}): Promise<ExportFiledSyncResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FILED_SYNC_TIMEOUT_MS);

  try {
    const res = await apiFetch("/api/export/filed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Time-Zone": clientTimeZone(),
      },
      body: JSON.stringify({ taxYear: params.taxYear }),
      signal: controller.signal,
    });
    if (res.status === 402) throw new Error("PAYMENT_REQUIRED");
    if (res.status === 422) {
      const errBody = (await res.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;
      if (errBody?.error?.code === "NO_RECEIPTS") {
        throw new Error("NO_RECEIPTS");
      }
      throw new Error("INVALID_EXPORT_TAX_YEAR");
    }
    if (!res.ok) throw new Error("EXPORT_FILED_SYNC_FAILED");

    const data = (await res.json()) as {
      taxSeason: string;
      taxSeasonDate: string;
      filedCount: number;
      receiptIds: string[];
    };
    return {
      taxSeason: data.taxSeason,
      taxSeasonDate: parseUtcISOString(data.taxSeasonDate),
      filedCount: data.filedCount,
      receiptIds: data.receiptIds,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("EXPORT_TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
