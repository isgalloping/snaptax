import { ZipArchive } from "archiver";
import { get } from "@vercel/blob";
import { PassThrough } from "node:stream";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";
import type { ExportIncomeRow } from "@/lib/export/incomeDocuments";
import { blobCommandOptions } from "@/lib/server/blob";

export type CpaPackImageStats = {
  imagesIncluded: number;
  imagesEligible: number;
};

export type CpaPackResult = {
  buffer: Buffer;
  imageStats: CpaPackImageStats;
};

export type CpaPackProgress = {
  phase: "images";
  completed: number;
  total: number;
};

const IMAGE_FETCH_CONCURRENCY = 5;

type ImagePackRow = {
  imagePathname: string;
  archivePath: string;
};

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

async function fetchImageBuffer(pathname: string): Promise<Buffer | null> {
  try {
    const result = await get(pathname, {
      access: "private",
      ...blobCommandOptions(),
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return streamToBuffer(result.stream);
  } catch {
    return null;
  }
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

export async function buildCpaPackZip(
  detailCsv: string,
  summaryPdf: Buffer,
  expenseRows: ExportExpenseRow[],
  incomeRows: ExportIncomeRow[] = [],
  taxYear: string,
  onProgress?: (progress: CpaPackProgress) => void,
): Promise<CpaPackResult> {
  const archive = new ZipArchive({ zlib: { level: 6 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  const expenseImages: ImagePackRow[] = expenseRows
    .filter((row) => row.imagePathname && row.receiptArchivePath)
    .map((row) => ({
      imagePathname: row.imagePathname!,
      archivePath: row.receiptArchivePath,
    }));
  const incomeImages: ImagePackRow[] = incomeRows
    .filter((row) => row.imagePathname && row.incomeArchivePath)
    .map((row) => ({
      imagePathname: row.imagePathname!,
      archivePath: row.incomeArchivePath,
    }));
  const imageRows = [...incomeImages, ...expenseImages];
  let imagesIncluded = 0;

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(stream);
  archive.append(summaryPdf, { name: `${taxYear}_Tax_Report_Summary.pdf` });
  archive.append(detailCsv, { name: `${taxYear}_Tax_Report_Data.csv` });

  let completed = 0;
  const fetched = await mapWithConcurrency(
    imageRows,
    IMAGE_FETCH_CONCURRENCY,
    async (row) => {
      const image = await fetchImageBuffer(row.imagePathname);
      completed += 1;
      onProgress?.({ phase: "images", completed, total: imageRows.length });
      return { row, image };
    },
  );

  for (const { row, image } of fetched) {
    if (!image) continue;
    imagesIncluded += 1;
    archive.append(image, { name: row.archivePath });
  }

  await archive.finalize();
  const buffer = await done;
  return {
    buffer,
    imageStats: {
      imagesIncluded,
      imagesEligible: imageRows.length,
    },
  };
}
