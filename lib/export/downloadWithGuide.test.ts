import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { downloadWithGuide } from "./downloadWithGuide";

describe("downloadWithGuide", () => {
  it("invokes onDownloaded with file info after download", () => {
    const originalDocument = globalThis.document;
    const originalUrl = globalThis.URL;
    const anchor = {
      href: "",
      download: "",
      click() {},
      remove() {},
    } as HTMLAnchorElement;

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        body: { appendChild() {} },
        createElement() {
          return anchor;
        },
      },
    });
    Object.defineProperty(globalThis, "URL", {
      configurable: true,
      value: {
        ...originalUrl,
        createObjectURL() {
          return "blob:snap1099-export";
        },
        revokeObjectURL() {},
      },
    });

    try {
      const file = new File(["csv"], "SnapTax-2025.csv", { type: "text/csv" });
      let called: { fileName: string; file: File } | null = null;

      downloadWithGuide(file, {
        onDownloaded: (info) => {
          called = info;
        },
      });

      assert.ok(called);
      assert.equal(called!.fileName, "SnapTax-2025.csv");
      assert.equal(called!.file, file);
    } finally {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: originalDocument,
      });
      Object.defineProperty(globalThis, "URL", {
        configurable: true,
        value: originalUrl,
      });
    }
  });
});
