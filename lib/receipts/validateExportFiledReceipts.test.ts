import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stubSnaptaxReceipt } from "@/lib/receipts/snaptaxReceiptStub";
import {
  assertReceiptsMatchExportTaxYear,
  receiptIdsInExportTaxYear,
} from "@/lib/receipts/validateExportFiledReceipts";

describe("validateExportFiledReceipts", () => {
  it("accepts expense receipts in the export tax year", () => {
    const receipt = stubSnaptaxReceipt({
      id: "00000000-0000-0000-0000-000000000001",
      capturedAt: new Date("2026-03-15T12:00:00.000Z"),
      category: "SUPPLIES",
    });
    assert.doesNotThrow(() =>
      assertReceiptsMatchExportTaxYear({
        receipts: [receipt],
        receiptIds: [receipt.id],
        taxYear: 2026,
        timeZone: "UTC",
      }),
    );
  });

  it("rejects receipts outside the export tax year", () => {
    const receipt = stubSnaptaxReceipt({
      id: "00000000-0000-0000-0000-000000000002",
      capturedAt: new Date("2026-03-15T12:00:00.000Z"),
    });
    assert.throws(
      () =>
        assertReceiptsMatchExportTaxYear({
          receipts: [receipt],
          receiptIds: [receipt.id],
          taxYear: 2025,
          timeZone: "UTC",
        }),
      /INVALID_EXPORT_TAX_YEAR/,
    );
  });

  it("uses income tax year from aiRaw for 1099 forms", () => {
    const receipt = stubSnaptaxReceipt({
      id: "00000000-0000-0000-0000-000000000003",
      capturedAt: new Date("2026-03-15T12:00:00.000Z"),
      category: "1099-NEC",
      aiRaw: { document_kind: "1099-NEC", tax_year: 2025 },
    });
    const ids = receiptIdsInExportTaxYear([receipt], 2025, "UTC");
    assert.equal(ids.has(receipt.id), true);
    assert.throws(
      () =>
        assertReceiptsMatchExportTaxYear({
          receipts: [receipt],
          receiptIds: [receipt.id],
          taxYear: 2026,
          timeZone: "UTC",
        }),
      /INVALID_EXPORT_TAX_YEAR/,
    );
  });
});
