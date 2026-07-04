import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  clearPendingIncomeCapture,
  peekPendingIncomeCapture,
  parseCaptureKindHeader,
  setPendingIncomeCapture,
} from "@/lib/export/incomeCapture";

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

function withSessionStorage(storage: MemoryStorage) {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: storage as Storage,
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

describe("income capture session handoff", () => {
  it("can read a pending capture kind without consuming it", () => {
    withSessionStorage(new MemoryStorage());
    setPendingIncomeCapture("1099-NEC");

    assert.equal(peekPendingIncomeCapture(), "1099-NEC");
    assert.equal(peekPendingIncomeCapture(), "1099-NEC");

    clearPendingIncomeCapture();
    assert.equal(peekPendingIncomeCapture(), null);
  });
});

describe("parseCaptureKindHeader", () => {
  it("accepts only supported 1099 capture kinds", () => {
    assert.equal(parseCaptureKindHeader("1099-NEC"), "1099-NEC");
    assert.equal(parseCaptureKindHeader("1099-K"), "1099-K");
    assert.equal(parseCaptureKindHeader("1099-MISC"), null);
    assert.equal(parseCaptureKindHeader(null), null);
  });
});
