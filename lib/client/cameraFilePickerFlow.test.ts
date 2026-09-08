import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createCameraFilePickerFlow } from "./cameraFilePickerFlow.ts";

function file(name = "receipt.jpg") {
  return new File(["receipt"], name, { type: "image/jpeg" });
}

describe("createCameraFilePickerFlow", () => {
  it("closes fallback camera only after the selected file is captured", async () => {
    const events: string[] = [];
    const flow = createCameraFilePickerFlow({
      openPicker: () => events.push("picker"),
      setCameraOpen: (open) => events.push(`camera:${open}`),
    });

    flow.openFromCameraFallback();
    await flow.handleFileSelected(file(), async () => {
      events.push("capture:start");
      await Promise.resolve();
      events.push("capture:done");
    });

    assert.deepEqual(events, ["picker", "capture:start", "capture:done", "camera:false"]);
  });

  it("signals direct picker open and clears it when the user cancels", () => {
    const events: string[] = [];
    const focus = { listener: undefined as (() => void) | undefined };
    const cancel = { check: undefined as (() => void) | undefined };
    const flow = createCameraFilePickerFlow({
      openPicker: () => events.push("picker"),
      setCameraOpen: (open) => events.push(`camera:${open}`),
      addWindowFocusListener: (listener) => {
        focus.listener = listener;
        return () => {
          focus.listener = undefined;
        };
      },
      scheduleCancelCheck: (callback) => {
        cancel.check = callback;
        return callback;
      },
      clearCancelCheck: () => {
        cancel.check = undefined;
      },
    });

    flow.openFromClosedCamera();
    focus.listener?.();
    cancel.check?.();

    assert.deepEqual(events, ["camera:true", "picker", "camera:false"]);
    assert.equal(flow.isActive(), false);
  });

  it("does not treat file selection as cancellation while capture is pending", async () => {
    const events: string[] = [];
    const focus = { listener: undefined as (() => void) | undefined };
    const cancel = { check: undefined as (() => void) | undefined };
    let finishCapture!: () => void;
    const captureFinished = new Promise<void>((resolve) => {
      finishCapture = resolve;
    });
    const flow = createCameraFilePickerFlow({
      openPicker: () => events.push("picker"),
      setCameraOpen: (open) => events.push(`camera:${open}`),
      addWindowFocusListener: (listener) => {
        focus.listener = listener;
        return () => {
          focus.listener = undefined;
        };
      },
      scheduleCancelCheck: (callback) => {
        cancel.check = callback;
        return callback;
      },
      clearCancelCheck: () => {
        cancel.check = undefined;
      },
    });

    flow.openFromCameraFallback();
    focus.listener?.();
    const selected = flow.handleFileSelected(file(), async () => {
      events.push("capture:start");
      await captureFinished;
      events.push("capture:done");
    });
    cancel.check?.();
    assert.deepEqual(events, ["picker", "capture:start"]);

    finishCapture();
    await selected;

    assert.deepEqual(events, ["picker", "capture:start", "capture:done", "camera:false"]);
  });
});
