import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SnaptaxReceipt } from "@prisma/client";
import { serializeReceipt } from "@/lib/receipts/serialize";
import { stubSnaptaxReceipt } from "@/lib/receipts/snaptaxReceiptStub";

describe("serializeReceipt", () => {
  it("does not expose aiRaw on expense receipts", () => {
    const body = serializeReceipt(
      stubSnaptaxReceipt({
        amount: 100 as unknown as SnaptaxReceipt["amount"],
        merchantName: "Shell",
        category: "TOOLS",
        taxAmount: 12.5 as unknown as SnaptaxReceipt["taxAmount"],
      }),
    ) as Record<string, unknown>;
    assert.equal("aiRaw" in body, false);
    assert.equal(body.incomeTaxYear, null);
  });

  it("exposes incomeTaxYear for 1099 without full aiRaw", () => {
    const body = serializeReceipt(
      stubSnaptaxReceipt({
        category: "1099-NEC",
        merchantName: "Acme Corp",
        taxAmount: 0 as unknown as SnaptaxReceipt["taxAmount"],
        deductible: false,
        aiRaw: { document_kind: "1099-NEC", payer: "Acme Corp", tax_year: 2024 },
      }),
    );
    assert.equal(body.incomeTaxYear, 2024);
    assert.equal("aiRaw" in body, false);
  });
});
