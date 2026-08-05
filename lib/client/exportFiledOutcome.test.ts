import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyExportFiledSync } from "./exportFiledOutcome.ts";

describe("applyExportFiledSync", () => {
  it("marks filed locally when sync succeeds", async () => {
    const marked: unknown[] = [];

    const result = await applyExportFiledSync({
      taxYear: "2026",
      receiptIds: ["receipt-1"],
      syncFiled: async () => ({
        taxSeason: "2026",
        taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
        filedCount: 1,
        receiptIds: ["receipt-1"],
      }),
      markFiledLocal: async (params) => {
        marked.push(params);
      },
    });

    assert.equal(result.filedSyncFailed, false);
    assert.equal(result.localFiledFailed, false);
    assert.equal(result.filed?.filedCount, 1);
    assert.equal(marked.length, 1);
  });

  it("returns filedSyncFailed without throwing on sync errors", async () => {
    const result = await applyExportFiledSync({
      taxYear: "2026",
      receiptIds: ["receipt-1"],
      syncFiled: async () => {
        throw new Error("EXPORT_FILED_SYNC_FAILED");
      },
      markFiledLocal: async () => {
        throw new Error("should not mark local");
      },
    });

    assert.equal(result.filedSyncFailed, true);
    assert.equal(result.localFiledFailed, false);
    assert.equal(result.filed, null);
  });

  it("returns localFiledFailed when server filed but IDB write fails", async () => {
    const result = await applyExportFiledSync({
      taxYear: "2026",
      receiptIds: ["receipt-1"],
      syncFiled: async () => ({
        taxSeason: "2026",
        taxSeasonDate: new Date("2026-07-08T12:00:00.000Z"),
        filedCount: 1,
        receiptIds: ["receipt-1"],
      }),
      markFiledLocal: async () => {
        throw new Error("IDB_WRITE_FAILED");
      },
    });

    assert.equal(result.filedSyncFailed, false);
    assert.equal(result.localFiledFailed, true);
    assert.equal(result.filed?.filedCount, 1);
  });

  it("rethrows payment failures", async () => {
    await assert.rejects(
      () =>
        applyExportFiledSync({
          taxYear: "2026",
          receiptIds: ["receipt-1"],
          syncFiled: async () => {
            throw new Error("PAYMENT_REQUIRED");
          },
          markFiledLocal: async () => {},
        }),
      /PAYMENT_REQUIRED/,
    );
  });

  it("returns filedSyncFailed for NO_RECEIPTS without throwing", async () => {
    const result = await applyExportFiledSync({
      taxYear: "2026",
      receiptIds: ["receipt-1"],
      syncFiled: async () => {
        throw new Error("NO_RECEIPTS");
      },
      markFiledLocal: async () => {
        throw new Error("should not mark local");
      },
    });

    assert.equal(result.filedSyncFailed, true);
    assert.equal(result.localFiledFailed, false);
    assert.equal(result.filed, null);
  });
});
