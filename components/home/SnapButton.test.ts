import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginFallbackFileSelection,
  runFallbackFileCapture,
} from "./SnapButton.tsx";

describe("SnapButton gallery fallback", () => {
  it("starts fallback selection without closing the camera first", () => {
    const events: string[] = [];
    const inputRef = {
      current: {
        click: () => events.push("click"),
      } as HTMLInputElement,
    };

    beginFallbackFileSelection({
      inputRef,
      markPending: () => events.push("pending"),
      clearStream: () => events.push("clear-stream"),
      armCancelCleanup: () => events.push("arm-cancel-cleanup"),
    });

    assert.deepEqual(events, [
      "pending",
      "clear-stream",
      "arm-cancel-cleanup",
      "click",
    ]);
  });

  it("closes the camera only after fallback capture finishes", async () => {
    const events: string[] = [];
    let finishCapture!: () => void;
    const captureDone = new Promise<void>((resolve) => {
      finishCapture = resolve;
    });
    const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });

    const run = runFallbackFileCapture(
      file,
      async () => {
        events.push("capture-start");
        await captureDone;
        events.push("capture-done");
      },
      () => events.push("close-camera"),
    );

    await Promise.resolve();
    assert.deepEqual(events, ["capture-start"]);

    finishCapture();
    await run;

    assert.deepEqual(events, [
      "capture-start",
      "capture-done",
      "close-camera",
    ]);
  });
});
