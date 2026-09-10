import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCameraFilePickerFlow } from "./cameraFilePickerFlow.ts";

class FakeFocusTarget {
  private focusListener: (() => void) | null = null;

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type !== "focus") return;
    this.focusListener =
      typeof listener === "function" ? () => listener(new Event("focus")) : null;
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (type !== "focus" || !this.focusListener) return;
    if (typeof listener === "function") {
      this.focusListener = null;
    }
  }

  fireFocus() {
    this.focusListener?.();
  }
}

function fileInputWith(file?: File) {
  let clickCount = 0;
  return {
    get clickCount() {
      return clickCount;
    },
    value: "selected",
    files: file ? [file] : [],
    click() {
      clickCount += 1;
    },
  } as unknown as HTMLInputElement & { readonly clickCount: number };
}

describe("createCameraFilePickerFlow", () => {
  it("keeps the camera session open until the selected file is captured", async () => {
    const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });
    const input = fileInputWith(file);
    const events: string[] = [];
    let resolveCapture!: () => void;
    const captureDone = new Promise<void>((resolve) => {
      resolveCapture = resolve;
    });
    const flow = createCameraFilePickerFlow({
      getInput: () => input,
      onOpen: () => events.push("open"),
      onCapture: async () => {
        events.push("capture-start");
        await captureDone;
        events.push("capture-done");
      },
      onClose: () => events.push("close"),
    });

    flow.open();
    assert.deepEqual(events, ["open"]);
    assert.equal(input.clickCount, 1);

    const change = flow.handleChange({
      currentTarget: input,
      target: input,
    } as unknown as Parameters<typeof flow.handleChange>[0]);
    await Promise.resolve();

    assert.deepEqual(events, ["open", "capture-start"]);
    resolveCapture();
    await change;

    assert.deepEqual(events, ["open", "capture-start", "capture-done", "close"]);
    assert.equal(input.value, "");
  });

  it("closes the active picker session when focus returns without a file", async () => {
    const input = fileInputWith();
    const focusTarget = new FakeFocusTarget();
    const events: string[] = [];
    const flow = createCameraFilePickerFlow({
      getInput: () => input,
      getFocusTarget: () => focusTarget,
      cancelDelayMs: 0,
      onOpen: () => events.push("open"),
      onCapture: () => {
        events.push("capture");
      },
      onClose: () => events.push("close"),
    });

    flow.open();
    focusTarget.fireFocus();
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.deepEqual(events, ["open", "close"]);
  });
});
