import { sampleTurboTaxCsvFilename } from "@/lib/export/exportFilenames";
import type { Receipt } from "@/lib/types";
import { clientTimeZone } from "@/lib/time/timeZone";
import { defaultExportTaxYear } from "@/lib/tax/season";
import { buildLocalTurboTaxCsv } from "./buildLocalTurboTaxCsv";
import {
  downloadWithGuide,
  type DownloadedFileInfo,
} from "./downloadWithGuide";

export function buildOnboardingSampleFile(demoReceipt: Receipt): File {
  const taxYear = Number(defaultExportTaxYear());
  const timeZone = clientTimeZone();
  const csv = buildLocalTurboTaxCsv([demoReceipt], taxYear, timeZone);
  return new File([csv], sampleTurboTaxCsvFilename(taxYear), {
    type: "text/csv;charset=utf-8",
  });
}

export function downloadOnboardingSampleCsv(
  demoReceipt: Receipt,
  opts?: { onDownloaded?: (info: DownloadedFileInfo) => void },
): void {
  downloadWithGuide(buildOnboardingSampleFile(demoReceipt), opts);
}
