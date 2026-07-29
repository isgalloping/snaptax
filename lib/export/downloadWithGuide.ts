import { downloadTaxPackFile } from "@/lib/export/shareTaxPack";

export type DownloadedFileInfo = {
  fileName: string;
  file: File;
};

export function downloadWithGuide(
  file: File,
  opts?: { onDownloaded?: (info: DownloadedFileInfo) => void },
): void {
  downloadTaxPackFile(file);
  opts?.onDownloaded?.({ fileName: file.name, file });
}
