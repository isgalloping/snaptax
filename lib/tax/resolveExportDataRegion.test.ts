import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveExportDataRegion } from "./resolveExportDataRegion.ts";
import type { Receipt } from "@/lib/types";

describe("resolveExportDataRegion", () => {
  it("prefers explicit region", () => {
    assert.equal(
      resolveExportDataRegion([{ id: "1", status: "done", dataRegion: "us" }], "eu"),
      "eu",
    );
  });

  it("reads region from receipts before defaulting to us", () => {
    const receipts: Receipt[] = [
      { id: "1", status: "done", timestamp: new Date(), dataRegion: "eu" },
    ];
    assert.equal(resolveExportDataRegion(receipts), "eu");
    assert.equal(resolveExportDataRegion([]), "us");
  });

  it("prefers signed-in user locked region over receipt snapshot", () => {
    assert.equal(
      resolveExportDataRegion(
        [{ id: "1", status: "done", timestamp: new Date(), dataRegion: "us" }],
        undefined,
        "eu",
      ),
      "eu",
    );
  });
});
