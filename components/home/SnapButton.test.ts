import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginGalleryFallbackSelection,
  runGalleryFallbackCapture,
} from "./SnapButton.tsx";

describe("runGalleryFallbackCapture", () => {
  it("marks fallback selection pending before opening the file picker", () => {
    const pending = { current: false };
    const events: string[] = [];

    beginGalleryFallbackSelection(pending, {
      click: () => events.push(`click:pending=${String(pending.current)}`),
    });

    assert.equal(pending.current, true);
    assert.deepEqual(events, ["click:pending=true"]);
  });

  it("waits for the fallback file capture before closing the camera", async () => {
    const events: string[] = [];
    const file = new Blob(["receipt"], { type: "image/jpeg" }) as File;

    await runGalleryFallbackCapture(file, {
      onCapture: async () => {
        events.push("capture:start");
        await Promise.resolve();
        events.push("capture:complete");
      },
      closeCamera: () => events.push("camera:close"),
      isBatchMode: false,
      endBatchCaptureDefer: () => events.push("batch:end"),
    });

    assert.deepEqual(events, [
      "capture:start",
      "capture:complete",
      "camera:close",
    ]);
  });

  it("releases batch OCR deferral after fallback capture closes", async () => {
    const events: string[] = [];
    const file = new Blob(["receipt"], { type: "image/jpeg" }) as File;

    await runGalleryFallbackCapture(file, {
      onCapture: () => events.push("capture"),
      closeCamera: () => events.push("camera:close"),
      isBatchMode: true,
      endBatchCaptureDefer: () => events.push("batch:end"),
    });

    assert.deepEqual(events, ["capture", "camera:close", "batch:end"]);
  });
});
