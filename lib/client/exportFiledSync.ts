import { apiFetch } from "@/lib/client/ghostClient";
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      taxYear: params.taxYear,
      receiptIds: params.receiptIds,
    }),
  });
  if (res.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (res.status === 404) throw new Error("NOT_FOUND");
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
