import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Receipt } from "@/lib/types";
import {
  classifyReceiptBucket,
  countReceiptBuckets,
  filterReceiptsByBucket,
  needsUserReview,
} from "./receiptBucket.ts";

function receipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "r1",
    status: "done",
    timestamp: new Date("2026-01-15T12:00:00Z"),
    ...overrides,
  };
}

describe("needsUserReview", () => {
  it("flags OTHER category as review", () => {
    assert.equal(
      needsUserReview(receipt({ category: "OTHER", amount: 10, taxAmount: 2 })),
      true,
    );
  });

  it("does not flag PERSONAL as review", () => {
    assert.equal(
      needsUserReview(
        receipt({
          category: "PERSONAL",
          amount: 10,
          taxAmount: 0,
          deductible: false,
        }),
      ),
      false,
    );
  });

  it("flags mid confidence as review", () => {
    assert.equal(
      needsUserReview(
        receipt({ category: "TOOLS", amount: 10, aiConfidence: 0.6 }),
      ),
      true,
    );
  });
});

describe("classifyReceiptBucket", () => {
  it("maps blurry to action", () => {
    assert.equal(classifyReceiptBucket(receipt({ status: "blurry" })), "action");
  });

  it("maps processing to processing", () => {
    assert.equal(
      classifyReceiptBucket(receipt({ status: "processing" })),
      "processing",
    );
  });

  it("maps sync stuck to processing", () => {
    assert.equal(
      classifyReceiptBucket(receipt({ status: "processing" }), { syncStuck: true }),
      "processing",
    );
  });

  it("maps OTHER done to review", () => {
    assert.equal(
      classifyReceiptBucket(
        receipt({ status: "done", category: "OTHER", amount: 5 }),
      ),
      "review",
    );
  });

  it("maps PERSONAL done to ready", () => {
    assert.equal(
      classifyReceiptBucket(
        receipt({
          status: "done",
          category: "PERSONAL",
          amount: 5,
          deductible: false,
        }),
      ),
      "ready",
    );
  });
});

describe("countReceiptBuckets", () => {
  it("counts buckets including stuck in processing", () => {
    const receipts = [
      receipt({ id: "a", status: "done", category: "TOOLS", amount: 10 }),
      receipt({ id: "b", status: "blurry" }),
      receipt({ id: "c", status: "processing" }),
    ];
    const counts = countReceiptBuckets(receipts, new Set(["c"]));
    assert.equal(counts.all, 3);
    assert.equal(counts.ready, 1);
    assert.equal(counts.action, 1);
    assert.equal(counts.processing, 1);
  });
});

describe("filterReceiptsByBucket", () => {
  it("filters action bucket", () => {
    const receipts = [
      receipt({ id: "a", status: "done", category: "TOOLS", amount: 10 }),
      receipt({ id: "b", status: "blurry" }),
    ];
    const filtered = filterReceiptsByBucket(receipts, "action", new Set());
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0]?.id, "b");
  });
});
