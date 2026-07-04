import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveReceiptListVisualState } from "./receiptListVisualState.ts";

describe("resolveReceiptListVisualState", () => {
  const processing = {
    status: "processing" as const,
    pendingUpload: true,
  };

  it("shows analyzing when pending but not uploading", () => {
    const r = resolveReceiptListVisualState(processing, {
      syncStuck: false,
      uploadInFlight: false,
    });
    assert.equal(r.pill, "analyzing");
    assert.equal(r.state, "analyzing");
  });

  it("shows uploading only when upload in flight", () => {
    const r = resolveReceiptListVisualState(processing, {
      syncStuck: false,
      uploadInFlight: true,
    });
    assert.equal(r.pill, "uploading");
    assert.equal(r.state, "uploading");
  });

  it("shows paused when sync stuck", () => {
    const r = resolveReceiptListVisualState(processing, {
      syncStuck: true,
      uploadInFlight: true,
    });
    assert.equal(r.pill, "paused");
  });

  it("shows analyzing when processing on server (no pending upload)", () => {
    const r = resolveReceiptListVisualState(
      { status: "processing", pendingUpload: false },
      { syncStuck: false, uploadInFlight: false },
    );
    assert.equal(r.pill, "analyzing");
  });
});
