import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canShareTaxPackFile,
  shareTaxPackFile,
} from "./shareTaxPack.ts";

function withNavigator(
  stubs: Partial<Navigator>,
  fn: () => void | Promise<void>,
): void | Promise<void> {
  const original = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { ...original, ...stubs },
  });
  try {
    return fn();
  } finally {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: original,
    });
  }
}

describe("shareTaxPack", () => {
  it("canShareTaxPackFile returns false without navigator.share", () => {
    withNavigator({ share: undefined }, () => {
      const file = new File(["zip"], "pack.zip", { type: "application/zip" });
      assert.equal(canShareTaxPackFile(file), false);
    });
  });

  it("canShareTaxPackFile uses navigator.canShare when available", () => {
    withNavigator(
      {
        share: () => Promise.resolve(),
        canShare: () => false,
      },
      () => {
        const file = new File(["zip"], "pack.zip", { type: "application/zip" });
        assert.equal(canShareTaxPackFile(file), false);
      },
    );
  });

  it("shareTaxPackFile returns unsupported when canShare is false", async () => {
    await withNavigator(
      {
        share: () => Promise.resolve(),
        canShare: () => false,
      },
      async () => {
        const file = new File(["zip"], "pack.zip", { type: "application/zip" });
        const result = await shareTaxPackFile(file, "Snap1099", "Export");
        assert.equal(result, "unsupported");
      },
    );
  });

  it("shareTaxPackFile returns shared on success", async () => {
    await withNavigator(
      {
        share: () => Promise.resolve(),
        canShare: () => true,
      },
      async () => {
        const file = new File(["csv"], "pack.csv", { type: "text/csv" });
        const result = await shareTaxPackFile(file, "Snap1099", "Export");
        assert.equal(result, "shared");
      },
    );
  });

  it("shareTaxPackFile returns cancelled on AbortError", async () => {
    await withNavigator(
      {
        canShare: () => true,
        share: () =>
          Promise.reject(new DOMException("Aborted", "AbortError")),
      },
      async () => {
        const file = new File(["csv"], "pack.csv", { type: "text/csv" });
        const result = await shareTaxPackFile(file, "Snap1099", "Export");
        assert.equal(result, "cancelled");
      },
    );
  });

  it("shareTaxPackFile returns failed without downloading on other errors", async () => {
    await withNavigator(
      {
        canShare: () => true,
        share: () =>
          Promise.reject(new DOMException("Not allowed", "NotAllowedError")),
      },
      async () => {
        const file = new File(["zip"], "pack.zip", { type: "application/zip" });
        const result = await shareTaxPackFile(file, "Snap1099", "Export");
        assert.equal(result, "failed");
      },
    );
  });
});
