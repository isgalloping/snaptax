import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { setPendingIncomeCapture } from "@/lib/export/incomeCapture";
import { resolveReceiptCaptureKind } from "./receiptCaptureIntent.ts";

const originalSessionStorageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

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

function installSessionStorage() {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: new MemoryStorage() as Storage,
  });
}

afterEach(() => {
  if (originalSessionStorageDescriptor) {
    Object.defineProperty(
      globalThis,
      "sessionStorage",
      originalSessionStorageDescriptor,
    );
  } else {
    Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

describe("resolveReceiptCaptureKind", () => {
  it("keeps the active income capture kind when it is still mounted", () => {
    installSessionStorage();
    setPendingIncomeCapture("1099-K");

    assert.equal(resolveReceiptCaptureKind("1099-NEC"), "1099-NEC");
  });

  it("recovers pending income capture after gallery fallback closes the camera", () => {
    installSessionStorage();
    setPendingIncomeCapture("1099-K");

    assert.equal(resolveReceiptCaptureKind(null), "1099-K");
  });
});
