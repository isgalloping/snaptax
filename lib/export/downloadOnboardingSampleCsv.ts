import { sampleTurboTaxCsvFilename } from "@/lib/export/exportFilenames";
import type { Receipt } from "@/lib/types";
import { clientTimeZone } from "@/lib/time/timeZone";
import { defaultExportTaxYear } from "@/lib/tax/season";
import { buildLocalTurboTaxCsv } from "./buildLocalTurboTaxCsv";
import { downloadTaxPackFile } from "./shareTaxPack";

export function downloadOnboardingSampleCsv(demoReceipt: Receipt): void {
  const taxYear = Number(defaultExportTaxYear());
  const timeZone = clientTimeZone();
  const csv = buildLocalTurboTaxCsv([demoReceipt], taxYear, timeZone);
  const file = new File(
    [csv],
    sampleTurboTaxCsvFilename(taxYear),
    { type: "text/csv;charset=utf-8" },
  );
  downloadTaxPackFile(file);
}
