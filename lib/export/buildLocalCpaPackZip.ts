import { zipSync } from "fflate";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import type { ExportIncomeRow } from "@/lib/export/incomeDocuments";

export type LocalCpaPackImageStats = {
  imagesIncluded: number;
  imagesEligible: number;
};

export type LocalCpaPackProgress = {
  phase: "images";
  completed: number;
  total: number;
};

export type LocalCpaPackResult = {
  buffer: Uint8Array;
  imageStats: LocalCpaPackImageStats;
};

const IMAGE_FETCH_CONCURRENCY = 5;

type ImagePackRow = {
  receiptId: string;
  archivePath: string;
};

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]!, index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

/** Browser-compatible CPA audit ZIP (fflate); images resolved via receipt id. */
export async function buildLocalCpaPackZip(
  detailCsv: string,
  summaryPdf: Uint8Array,
  auditRows: ExportExpenseRow[],
  incomeRows: ExportIncomeRow[],
  taxYear: string,
  resolveImage: (receiptId: string) => Promise<Blob | null>,
  onProgress?: (progress: LocalCpaPackProgress) => void,
): Promise<LocalCpaPackResult> {
  const incomeImages: ImagePackRow[] = incomeRows
    .filter((row) => row.incomeArchivePath)
    .map((row) => ({
      receiptId: row.id,
      archivePath: row.incomeArchivePath,
    }));
  const expenseImages: ImagePackRow[] = auditRows
    .filter((row) => row.receiptArchivePath)
    .map((row) => ({
      receiptId: row.id,
      archivePath: row.receiptArchivePath,
    }));
  const imageRows = [...incomeImages, ...expenseImages];

  const files: Record<string, Uint8Array> = {
    [`${taxYear}_Tax_Report_Summary.pdf`]: summaryPdf,
    [`${taxYear}_Tax_Report_Data.csv`]: new TextEncoder().encode(detailCsv),
  };

  let imagesIncluded = 0;
  let completed = 0;
  const fetched = await mapWithConcurrency(
    imageRows,
    IMAGE_FETCH_CONCURRENCY,
    async (row) => {
      const image = await resolveImage(row.receiptId);
      completed += 1;
      onProgress?.({ phase: "images", completed, total: imageRows.length });
      return { row, image };
    },
  );

  for (const { row, image } of fetched) {
    if (!image) continue;
    imagesIncluded += 1;
    files[row.archivePath] = await blobToUint8Array(image);
  }

  const buffer = zipSync(files, { level: 6 });
  return {
    buffer,
    imageStats: {
      imagesIncluded,
      imagesEligible: imageRows.length,
    },
  };
}
