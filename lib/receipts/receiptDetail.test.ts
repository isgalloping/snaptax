import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import { buildReceiptDetailHero } from "@/lib/receipts/receiptDetail";

const heroCopy = {
  personalEu: "Personal expense — no VAT recovery",
  personalUs: "Personal (Non-Deductible)",
  addedVat: "✓ Added to VAT recovery",
  addedScheduleC: "✓ Added to Schedule C Deduction",
  income1099: "{form} income",
};

function receipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "r1",
    status: "done",
    timestamp: new Date("2025-06-01T12:00:00.000Z"),
    amount: 64800,
    category: "1099-NEC",
    merchant: "Acme Corp",
    deductible: false,
    taxAmount: 0,
    currency: "USD",
    dataRegion: "us",
    ...overrides,
  };
}

describe("buildReceiptDetailHero", () => {
  it("shows gross income hero for 1099-NEC instead of personal", () => {
    const hero = buildReceiptDetailHero(receipt(), heroCopy);
    assert.equal(hero.kind, "done");
    if (hero.kind !== "done") return;
    assert.equal(hero.incomeForm, true);
    assert.match(hero.savedLabel, /\$64,800|\$64800/);
    assert.equal(hero.subtitle, "1099-NEC income");
    assert.equal(hero.muted, undefined);
  });

  it("still shows personal hero for zero-tax non-income receipts", () => {
    const hero = buildReceiptDetailHero(
      receipt({
        category: "PERSONAL",
        amount: 25,
        deductible: false,
        taxAmount: 0,
      }),
      heroCopy,
    );
    assert.equal(hero.kind, "done");
    if (hero.kind !== "done") return;
    assert.equal(hero.muted, true);
    assert.equal(hero.subtitle, heroCopy.personalUs);
    assert.equal(hero.incomeForm, undefined);
  });
});
