import { issueSignedToken, presignUrl } from "@vercel/blob";
import { blobCommandOptions } from "@/lib/server/blob";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

/** Seven-day presigned URLs for CPA / TurboTax CSV audit trails. */
const EXPORT_IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function buildExportReceiptImageUrl(
  pathname: string,
): Promise<string> {
  try {
    const validUntil = Date.now() + EXPORT_IMAGE_TTL_MS;
    const blobOpts = blobCommandOptions();
    const signedToken = await issueSignedToken({
      ...blobOpts,
      pathname,
      operations: ["get"],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(signedToken, {
      operation: "get",
      pathname,
      access: "private",
      validUntil,
    });
    return presignedUrl;
  } catch {
    return "";
  }
}

export async function enrichExportRowsWithImageUrls(
  rows: ExportExpenseRow[],
): Promise<ExportExpenseRow[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      receiptImageUrl: row.imagePathname
        ? await buildExportReceiptImageUrl(row.imagePathname)
        : "",
    })),
  );
}
