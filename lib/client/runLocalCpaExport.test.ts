import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runLocalCpaExport } from "./runLocalCpaExport.ts";
import type { Receipt } from "@/lib/types";

const RECEIPT_ID = "00000000-0000-0000-0000-000000000001";

function expenseReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: RECEIPT_ID,
    status: "done",
    amount: 80,
    merchant: "Shell",
    category: "VEHICLE",
    taxAmount: 20,
    deductible: true,
    timestamp: new Date("2026-04-10T12:00:00.000Z"),
    ...overrides,
  };
}

describe("runLocalCpaExport", () => {
  it("builds cpa_pdf and syncs filed metadata", async () => {
    let marked = false;
    const result = await runLocalCpaExport(
      {
        receipts: [expenseReceipt()],
        taxYear: 2026,
        timeZone: "UTC",
        format: "cpa_pdf",
        taxpayerName: "Jane Contractor",
      },
      {
        buildPdf: async () => new TextEncoder().encode("%PDF-test"),
        syncFiled: async () => ({
          taxSeason: "2026",
          taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
          filedCount: 1,
          receiptIds: [RECEIPT_ID],
        }),
        markFiledLocal: async () => {
          marked = true;
        },
      },
    );

    assert.equal(result.file.type, "application/pdf");
    assert.match(result.file.name, /Schedule-C-Mirror\.pdf$/);
    assert.equal(result.meta.receiptCount, 1);
    assert.equal(marked, true);
  });

  it("builds cpa_pack with image stats in meta", async () => {
    const result = await runLocalCpaExport(
      {
        receipts: [expenseReceipt()],
        taxYear: 2026,
        timeZone: "UTC",
        format: "cpa_pack",
      },
      {
        buildPdf: async () => new TextEncoder().encode("%PDF-test"),
        buildPack: async () => ({
          buffer: new TextEncoder().encode("PK\x03\x04"),
          imageStats: { imagesIncluded: 1, imagesEligible: 2 },
        }),
        syncFiled: async () => ({
          taxSeason: "2026",
          taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
          filedCount: 1,
          receiptIds: [RECEIPT_ID],
        }),
        markFiledLocal: async () => {},
      },
    );

    assert.equal(result.file.type, "application/zip");
    assert.equal(result.meta.imagesIncluded, 1);
    assert.equal(result.meta.imagesEligible, 2);
    assert.equal(result.meta.imagesMissing, 1);
  });

  it("throws NO_RECEIPTS when no audit content", async () => {
    await assert.rejects(
      () =>
        runLocalCpaExport({
          receipts: [expenseReceipt({ status: "processing" })],
          taxYear: 2026,
          timeZone: "UTC",
          format: "cpa_pdf",
        }),
      (err: Error) => err.message === "NO_RECEIPTS",
    );
  });
});
