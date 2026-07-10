import { Zip, ZipPassThrough } from "fflate";
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

type IncrementalZip = {
  addStoredFile: (name: string, data: Uint8Array) => void;
  finish: () => Promise<Uint8Array[]>;
};

function createIncrementalZip(): IncrementalZip {
  const chunks: Uint8Array[] = [];
  let resolveDone!: (chunks: Uint8Array[]) => void;
  let rejectDone!: (err: Error) => void;
  const done = new Promise<Uint8Array[]>((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const zip = new Zip((err, chunk, final) => {
    if (err) {
      rejectDone(err);
      return;
    }
    if (chunk) chunks.push(chunk);
    if (final) resolveDone(chunks);
  });

  return {
    addStoredFile(name: string, data: Uint8Array) {
      const entry = new ZipPassThrough(name);
      zip.add(entry);
      entry.push(data, true);
    },
    finish() {
      zip.end();
      return done;
    },
  };
}

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

  const incremental = createIncrementalZip();
  incremental.addStoredFile(
    `${taxYear}_Tax_Report_Summary.pdf`,
    summaryPdf,
  );
  incremental.addStoredFile(
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
      incremental.addStoredFile(
        row.archivePath,
        await blobToUint8Array(image),
      );
    },
  );

  const chunks = await incremental.finish();
  return {
    chunks,
    imageStats: {
      imagesIncluded,
      imagesEligible: imageRows.length,
    },
  };
}
