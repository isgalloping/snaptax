import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { beginCameraFilePickerFlow } from "./cameraFilePickerFlow.ts";

class FakeFileInput extends EventTarget {
  files: File[] | null = null;
  value = "";
  clickCount = 0;

  click() {
    this.clickCount += 1;
  }
}

class FakeWindowTarget extends EventTarget {
  private callbacks: Array<() => void> = [];

  setTimeout(callback: () => void) {
    this.callbacks.push(callback);
    return this.callbacks.length;
  }

  runTimers() {
    const pending = [...this.callbacks];
    this.callbacks = [];
    for (const callback of pending) callback();
  }
}

describe("beginCameraFilePickerFlow", () => {
  it("closes only after the selected gallery file has been captured", async () => {
    const input = new FakeFileInput();
    const windowTarget = new FakeWindowTarget();
    const events: string[] = [];
    input.files = [new File(["receipt"], "receipt.jpg", { type: "image/jpeg" })];

    beginCameraFilePickerFlow({
      input: input as unknown as HTMLInputElement,
      windowTarget,
      onCapture: async (file) => {
        events.push(`capture:${file.name}`);
        assert.deepEqual(events, ["capture:receipt.jpg"]);
      },
      onClose: () => {
        events.push("close");
      },
    });

    assert.equal(input.clickCount, 1);
    input.dispatchEvent(new Event("change"));
    await Promise.resolve();
    await Promise.resolve();

    assert.deepEqual(events, ["capture:receipt.jpg", "close"]);
    assert.equal(input.value, "");
  });

  it("closes when the file picker returns without a selected file", () => {
    const input = new FakeFileInput();
    const windowTarget = new FakeWindowTarget();
    let closeCount = 0;

    beginCameraFilePickerFlow({
      input: input as unknown as HTMLInputElement,
      windowTarget,
      onCapture: async () => {
        throw new Error("capture should not run when no file was selected");
      },
      onClose: () => {
        closeCount += 1;
      },
    });

    windowTarget.dispatchEvent(new Event("focus"));
    windowTarget.runTimers();

    assert.equal(input.clickCount, 1);
    assert.equal(closeCount, 1);
  });
});
