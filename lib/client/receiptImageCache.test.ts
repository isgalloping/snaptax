import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  clearReceiptImageCache,
  fetchReceiptImageUrlCached,
  peekCachedReceiptImageUrl,
  prefetchReceiptImageUrl,
} from "./receiptImageCache.ts";

const RECEIPT_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("receiptImageCache", () => {
  afterEach(() => {
    clearReceiptImageCache();
  });

  it("peekCachedReceiptImageUrl returns null when empty", () => {
    assert.equal(peekCachedReceiptImageUrl(RECEIPT_ID), null);
  });

  it("fetchReceiptImageUrlCached dedupes concurrent requests", async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      const expiresAt = new Date(Date.now() + 900_000).toISOString();
      return { url: "https://example.com/receipt.jpg", expiresAt };
    };

    const [a, b] = await Promise.all([
      fetchReceiptImageUrlCached(RECEIPT_ID, { fetchUrl: fetchImpl }),
      fetchReceiptImageUrlCached(RECEIPT_ID, { fetchUrl: fetchImpl }),
    ]);

    assert.equal(calls, 1);
    assert.equal(a.url, b.url);
    assert.equal(peekCachedReceiptImageUrl(RECEIPT_ID), a.url);
  });

  it("prefetchReceiptImageUrl is no-op when cache is warm", async () => {
    const expiresAt = new Date(Date.now() + 900_000).toISOString();
    await fetchReceiptImageUrlCached(RECEIPT_ID, {
      fetchUrl: async () => ({
        url: "https://example.com/cached.jpg",
        expiresAt,
      }),
    });

    let calls = 0;
    prefetchReceiptImageUrl(RECEIPT_ID, {
      fetchUrl: async () => {
        calls += 1;
        return { url: "x", expiresAt };
      },
    });
    assert.equal(calls, 0);
  });
});
