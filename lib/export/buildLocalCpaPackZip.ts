import { startCpaPackZipSession } from "@/lib/client/cpaPackZipWorkerClient";
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
  /** fflate ZIP segments; pass to `new Blob(chunks)` without merging. */
  chunks: Uint8Array[];
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

  const zipSession = startCpaPackZipSession();
  try {
    await zipSession.addStoredFile(
      `${taxYear}_Tax_Report_Summary.pdf`,
      summaryPdf,
    );
    await zipSession.addStoredFile(
      `${taxYear}_Tax_Report_Data.csv`,
      new TextEncoder().encode(detailCsv),
    );

    let imagesIncluded = 0;
    let completed = 0;
    await mapWithConcurrency(
      imageRows,
      IMAGE_FETCH_CONCURRENCY,
      async (row) => {
        const image = await resolveImage(row.receiptId);
        completed += 1;
        onProgress?.({ phase: "images", completed, total: imageRows.length });
        if (!image) return;
        imagesIncluded += 1;
        await zipSession.addStoredFile(
          row.archivePath,
          await blobToUint8Array(image),
        );
      },
    );

    const chunks = await zipSession.finish();
    return {
      chunks,
      imageStats: {
        imagesIncluded,
        imagesEligible: imageRows.length,
      },
    };
  } catch (err) {
    zipSession.abort();
    throw err;
  }
}
