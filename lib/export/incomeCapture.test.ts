import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearPendingIncomeCapture,
  peekPendingIncomeCapture,
  setPendingIncomeCapture,
} from "./incomeCapture.ts";

function withSessionStorage(fn: () => void): void {
  const original = globalThis.sessionStorage;
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem(key: string) {
        return values.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        values.set(key, value);
      },
      removeItem(key: string) {
        values.delete(key);
      },
    },
  });
  try {
    fn();
  } finally {
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: original,
    });
  }
}

describe("incomeCapture", () => {
  it("can read a pending capture kind without consuming it", () => {
    withSessionStorage(() => {
      setPendingIncomeCapture("1099-NEC");

      assert.equal(peekPendingIncomeCapture(), "1099-NEC");
      assert.equal(peekPendingIncomeCapture(), "1099-NEC");

      clearPendingIncomeCapture();
      assert.equal(peekPendingIncomeCapture(), null);
    });
  });
});
