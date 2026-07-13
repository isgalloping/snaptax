import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runLocalTaxExport } from "./runLocalTaxExport.ts";
import type { Receipt } from "@/lib/types";

const BUSINESS_RECEIPT_ID = "00000000-0000-0000-0000-000000000001";
const PERSONAL_RECEIPT_ID = "00000000-0000-0000-0000-000000000002";

function expenseReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: BUSINESS_RECEIPT_ID,
    status: "done",
    amount: 125.5,
    merchant: "Home Depot",
    category: "SUPPLIES",
    taxAmount: 30,
    deductible: true,
    timestamp: new Date("2026-03-15T12:00:00.000Z"),
    ...overrides,
  };
}

describe("runLocalTaxExport", () => {
  it("builds QBO from deductible rows and marks filed receipts from the server result", async () => {
    const order: string[] = [];
    const marked: unknown[] = [];

    const result = await runLocalTaxExport(
      {
        receipts: [
          expenseReceipt(),
          expenseReceipt({
            id: PERSONAL_RECEIPT_ID,
            merchant: "Personal Store",
            category: "PERSONAL",
            deductible: false,
            taxAmount: 0,
          }),
        ],
        taxYear: 2026,
        timeZone: "UTC",
        format: "qbo",
      },
      {
        syncFiled: async (params) => {
          order.push("syncFiled");
          assert.deepEqual(params, { taxYear: "2026" });
          return {
            taxSeason: "2026",
            taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
            filedCount: 2,
            receiptIds: [BUSINESS_RECEIPT_ID, PERSONAL_RECEIPT_ID],
          };
        },
        markFiledLocal: async (params) => {
          order.push("markFiledLocal");
          marked.push(params);
        },
      },
    );

    const content = await result.file.text();

    assert.deepEqual(order, ["syncFiled", "markFiledLocal"]);
    assert.deepEqual(marked, [
      {
        receiptIds: [BUSINESS_RECEIPT_ID, PERSONAL_RECEIPT_ID],
        taxSeason: "2026",
        taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
      },
    ]);
    assert.equal(result.file.type, "application/x-ofx;charset=utf-8");
    assert.match(result.file.name, /QuickBooks-Online\.qbo$/);
    assert.equal(result.meta.receiptCount, 2);
    assert.match(content, /<DTSERVER>20260708120000<\/DTSERVER>/);
    assert.match(content, /<NAME>Home Depot<\/NAME>/);
    assert.doesNotMatch(content, /Personal Store/);
  });

  it("throws NO_RECEIPTS before syncing filed metadata when QIF has no deductible rows", async () => {
    await assert.rejects(
      () =>
        runLocalTaxExport(
          {
            receipts: [
              expenseReceipt({
                category: "PERSONAL",
                deductible: false,
                taxAmount: 0,
              }),
            ],
            taxYear: 2026,
            timeZone: "UTC",
            format: "qif",
          },
          {
            syncFiled: async () => {
              throw new Error("should not sync empty QIF exports");
            },
          },
        ),
      (err: Error) => err.message === "NO_RECEIPTS",
    );
  });

  it("throws NO_RECEIPTS before syncing filed metadata when TXF has no deductible rows", async () => {
    await assert.rejects(
      () =>
        runLocalTaxExport(
          {
            receipts: [
              expenseReceipt({
                category: "PERSONAL",
                deductible: false,
                taxAmount: 0,
              }),
            ],
            taxYear: 2026,
            timeZone: "UTC",
            format: "txf",
          },
          {
            syncFiled: async () => {
              throw new Error("should not sync empty TXF exports");
            },
          },
        ),
      (err: Error) => err.message === "NO_RECEIPTS",
    );
  });
});
