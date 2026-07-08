import { apiFetch } from "@/lib/client/ghostClient";
import { clientTimeZone } from "@/lib/time/timeZone";
import { parseUtcISOString } from "@/lib/time/utc";

export type ExportFiledSyncResult = {
  taxSeason: string;
  taxSeasonDate: Date;
  filedCount: number;
};

export async function syncExportFiledToServer(params: {
  taxYear: string;
  receiptIds: string[];
}): Promise<ExportFiledSyncResult> {
  const res = await apiFetch("/api/export/filed", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Time-Zone": clientTimeZone(),
    },
    body: JSON.stringify({
      taxYear: params.taxYear,
      receiptIds: params.receiptIds,
    }),
  });
  if (res.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (res.status === 422) throw new Error("INVALID_EXPORT_TAX_YEAR");
  if (!res.ok) throw new Error("EXPORT_FILED_SYNC_FAILED");

  const data = (await res.json()) as {
    taxSeason: string;
    taxSeasonDate: string;
    filedCount: number;
  };
  return {
    taxSeason: data.taxSeason,
    taxSeasonDate: parseUtcISOString(data.taxSeasonDate),
    filedCount: data.filedCount,
  };
}
