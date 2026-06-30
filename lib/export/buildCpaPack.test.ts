import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  getGlobalDispatcher,
  MockAgent,
  setGlobalDispatcher,
} from "undici";
import { buildCpaPackZip } from "@/lib/export/buildCpaPack";
import type { ExportIncomeRow } from "@/lib/export/incomeDocuments";
import type { ExportExpenseRow } from "@/lib/tax/exportRows";

const originalBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
const originalDispatcher = getGlobalDispatcher();

function sampleExpenseRow(
  overrides: Partial<ExportExpenseRow> = {},
): ExportExpenseRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    date: "03/15/2026",
    dateIso: "2026-03-15",
    merchant: "Home Depot",
    amount: 125.5,
    category: "SUPPLIES",
    irsSchedule: "Schedule C - Line 22 (Supplies)",
    irsLine: "Line 22",
    deductibleAmount: 125.5,
    deductible: true,
    taxSaved: 31.38,
    notes: "",
    imagePathname: "receipts/home-depot.jpg",
    receiptImageUrl: "",
    categoryDisplay: "Supplies",
    scheduleCLine: "Line 22",
    taxDeductible: "Yes",
    businessPercent: "100%",
    exportAmount: 125.5,
    receiptAlias: "REC_20260315_HomeDepot_125.50.jpg",
    receiptArchivePath:
      "02_Expenses_Receipts_Book/Line_22_Supplies/REC_20260315_HomeDepot_125.50.jpg",
    ...overrides,
  };
}

function sampleIncomeRow(overrides: Partial<ExportIncomeRow> = {}): ExportIncomeRow {
  return {
    id: "00000000-0000-0000-0000-000000000002",
    dateIso: "2026-01-31",
    payer: "Acme Contracting",
    amount: 4800,
    formType: "1099-NEC",
    taxYear: 2025,
    imagePathname: "receipts/acme-1099.jpg",
    incomeArchivePath: "01_Income_Documents/1099_NEC_Acme_20260131.jpg",
    ...overrides,
  };
}

function zipContains(buffer: Buffer, name: string): boolean {
  return buffer.includes(Buffer.from(name));
}

afterEach(() => {
  if (originalBlobToken == null) {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  } else {
    process.env.BLOB_READ_WRITE_TOKEN = originalBlobToken;
  }
  setGlobalDispatcher(originalDispatcher);
});

function installBlobImageMock() {
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_teststore_secret";
  const agent = new MockAgent();
  agent.disableNetConnect();
  const blobOrigin = agent.get(
    "https://teststore.private.blob.vercel-storage.com",
  );
  blobOrigin
    .intercept({ method: "GET", path: "/receipts/acme-1099.jpg" })
    .reply(200, "income-image");
  blobOrigin
    .intercept({ method: "GET", path: "/receipts/home-depot.jpg" })
    .reply(200, "expense-image");
  setGlobalDispatcher(agent);
}

describe("buildCpaPackZip", () => {
  it("uses CPA handoff paths for income and expense images", async () => {
    const progress: { completed: number; total: number }[] = [];
    installBlobImageMock();

    const result = await buildCpaPackZip(
      "Date,Merchant,Amount\r\n2026-03-15,Home Depot,125.50",
      Buffer.from("%PDF-1.7\nsummary"),
      [sampleExpenseRow()],
      [sampleIncomeRow()],
      (event) => progress.push({ completed: event.completed, total: event.total }),
    );

    assert.ok(zipContains(result.buffer, "00_READ_ME_Summary.pdf"));
    assert.ok(zipContains(result.buffer, "Expenses-Detail.csv"));
    assert.ok(
      zipContains(
        result.buffer,
        "01_Income_Documents/1099_NEC_Acme_20260131.jpg",
      ),
    );
    assert.ok(
      zipContains(
        result.buffer,
        "02_Expenses_Receipts_Book/Line_22_Supplies/REC_20260315_HomeDepot_125.50.jpg",
      ),
    );
    assert.equal(zipContains(result.buffer, "Summary-by-Line.txt"), false);
    assert.equal(zipContains(result.buffer, "receipts/acme-1099.jpg"), false);
    assert.equal(zipContains(result.buffer, "receipts/home-depot.jpg"), false);
    assert.equal(result.imageStats.imagesEligible, 2);
    assert.equal(result.imageStats.imagesIncluded, 2);
    assert.deepEqual(progress, [
      { completed: 1, total: 2 },
      { completed: 2, total: 2 },
    ]);
  });
});
