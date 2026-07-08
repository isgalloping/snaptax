import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import { buildLocalCpaExportContext } from "@/lib/export/buildLocalCpaExportContext";

function expenseReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "00000000-0000-0000-0000-000000000001",
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

function incomeReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "00000000-0000-0000-0000-000000000002",
    status: "done",
    amount: 1200,
    merchant: "Acme Corp",
    category: "1099-NEC",
    incomeTaxYear: 2026,
    taxAmount: 0,
    deductible: false,
    timestamp: new Date("2026-04-12T12:00:00.000Z"),
    ...overrides,
  };
}

describe("buildLocalCpaExportContext", () => {
  it("builds audit and income rows for the tax year", () => {
    const ctx = buildLocalCpaExportContext(
      [expenseReceipt(), incomeReceipt()],
      2026,
      "UTC",
    );
    assert.equal(ctx.yearReceiptCount, 2);
    assert.equal(ctx.incomeRows.length, 1);
    assert.equal(ctx.incomeRows[0]?.formType, "1099-NEC");
    assert.equal(ctx.auditRows.length, 1);
    assert.match(ctx.auditRows[0]?.receiptArchivePath ?? "", /Shell.*\.jpg$/);
  });

  it("skips receipts outside the tax year", () => {
    const ctx = buildLocalCpaExportContext(
      [expenseReceipt()],
      2025,
      "UTC",
    );
    assert.equal(ctx.yearReceiptCount, 0);
    assert.equal(ctx.auditRows.length, 0);
  });

  it("sorts receipts by capture time ascending for audit order", () => {
    const later = expenseReceipt({
      id: "00000000-0000-0000-0000-000000000003",
      merchant: "Later Shop",
      timestamp: new Date("2026-06-01T12:00:00.000Z"),
    });
    const earlier = expenseReceipt({
      id: "00000000-0000-0000-0000-000000000004",
      merchant: "Earlier Shop",
      timestamp: new Date("2026-04-01T12:00:00.000Z"),
    });
    const ctx = buildLocalCpaExportContext(
      [later, earlier],
      2026,
      "UTC",
    );
    assert.equal(ctx.auditRows.length, 2);
    assert.equal(ctx.auditRows[0]?.merchant, "Earlier Shop");
    assert.equal(ctx.auditRows[0]?.auditIndex, "001");
    assert.equal(ctx.auditRows[1]?.merchant, "Later Shop");
    assert.equal(ctx.auditRows[1]?.auditIndex, "002");
  });
});
