import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { setPendingIncomeCapture } from "@/lib/export/incomeCapture";
import { apiReceiptFromUploadResponse, uploadReceipt } from "./receiptApi.ts";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const receiptId = "00000000-0000-0000-0000-000000000001";

afterEach(() => {
  Reflect.deleteProperty(globalThis, "fetch");
  Reflect.deleteProperty(globalThis, "sessionStorage");
});

function installSessionStorage() {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: new MemoryStorage() as Storage,
  });
}

function installUploadFetchRecorder(
  seen: { input?: string | URL | Request; init?: RequestInit },
) {
  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async (input: string | URL | Request, init?: RequestInit) => {
      seen.input = input;
      seen.init = init;
      return new Response(
        JSON.stringify({
          id: receiptId,
          status: "processing",
          taxAmount: 0,
          dataRegion: "us",
        }),
        { status: 201 },
      );
    },
  });
}

describe("apiReceiptFromUploadResponse", () => {
  it("maps slim 201 upload body without requiring GET", () => {
    const snapAt = new Date("2026-06-14T12:00:00.000Z");
    const receipt = apiReceiptFromUploadResponse(
      {
        id: "server-id",
        status: "processing",
        taxAmount: 0,
        dataRegion: "us",
        processFailed: true,
      },
      snapAt,
    );

    assert.equal(receipt.id, "server-id");
    assert.equal(receipt.status, "processing");
    assert.equal(receipt.taxAmount, 0);
    assert.equal(receipt.dataRegion, "us");
    assert.equal(receipt.hasImage, true);
    assert.equal(receipt.snapAt, "2026-06-14T12:00:00.000Z");
    assert.equal(receipt.merchant, null);
  });

  it("maps full 201 upload body with merchant and category", () => {
    const receipt = apiReceiptFromUploadResponse({
      id: "server-id",
      status: "done",
      taxAmount: 2.95,
      dataRegion: "us",
      merchant: "Home Depot",
      category: "OTHER",
      amount: 14.75,
      capturedAt: "2026-06-16T12:00:00.000Z",
      updatedAt: "2026-06-16T12:00:05.000Z",
      hasImage: true,
    });

    assert.equal(receipt.merchant, "Home Depot");
    assert.equal(receipt.category, "OTHER");
    assert.equal(receipt.amount, 14.75);
    assert.equal(receipt.updatedAt, "2026-06-16T12:00:05.000Z");
  });
});

describe("uploadReceipt", () => {
  it("sends explicit income capture kind as X-Capture-Kind", async () => {
    const seen: { input?: string | URL | Request; init?: RequestInit } = {};
    installUploadFetchRecorder(seen);

    await uploadReceipt(new Blob(["receipt"]), receiptId, undefined, "1099-K");

    assert.equal(seen.input, "/api/receipts");
    assert.equal(seen.init?.method, "POST");
    assert.equal(
      (seen.init?.headers as Record<string, string>)["X-Capture-Kind"],
      "1099-K",
    );
  });

  it("consumes pending income capture kind for the next upload only", async () => {
    const seen: { input?: string | URL | Request; init?: RequestInit } = {};
    installSessionStorage();
    installUploadFetchRecorder(seen);
    setPendingIncomeCapture("1099-NEC");

    await uploadReceipt(new Blob(["receipt"]), receiptId);

    assert.equal(
      (seen.init?.headers as Record<string, string>)["X-Capture-Kind"],
      "1099-NEC",
    );

    await uploadReceipt(new Blob(["receipt"]), receiptId);

    assert.equal(
      (seen.init?.headers as Record<string, string>)["X-Capture-Kind"],
      undefined,
    );
  });
});
