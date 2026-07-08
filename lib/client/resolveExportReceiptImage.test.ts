import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveExportReceiptImageBlob } from "@/lib/client/resolveExportReceiptImage";

const RECEIPT_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("resolveExportReceiptImageBlob", () => {
  it("prefers local OPFS blob", async () => {
    const local = new Blob(["local-bytes"], { type: "image/jpeg" });
    const result = await resolveExportReceiptImageBlob(RECEIPT_ID, {
      loadPhoto: async () => local,
      fetchRemoteBlob: async () => {
        throw new Error("should not fetch remote");
      },
    });
    assert.equal(result?.source, "local");
    assert.equal(await result?.blob.text(), "local-bytes");
  });

  it("falls back to remote when local missing", async () => {
    const remote = new Blob(["remote-bytes"], { type: "image/jpeg" });
    const result = await resolveExportReceiptImageBlob(RECEIPT_ID, {
      loadPhoto: async () => null,
      fetchRemoteBlob: async () => remote,
    });
    assert.equal(result?.source, "remote");
    assert.equal(await result?.blob.text(), "remote-bytes");
  });

  it("returns null when no image is available", async () => {
    const result = await resolveExportReceiptImageBlob(RECEIPT_ID, {
      loadPhoto: async () => null,
      fetchRemoteBlob: async () => null,
    });
    assert.equal(result, null);
  });

  it("falls back to remote when local load throws", async () => {
    const remote = new Blob(["remote-bytes"], { type: "image/jpeg" });
    const result = await resolveExportReceiptImageBlob(RECEIPT_ID, {
      loadPhoto: async () => {
        throw new Error("OPFS decrypt failed");
      },
      fetchRemoteBlob: async () => remote,
    });
    assert.equal(result?.source, "remote");
    assert.equal(await result?.blob.text(), "remote-bytes");
  });
});
