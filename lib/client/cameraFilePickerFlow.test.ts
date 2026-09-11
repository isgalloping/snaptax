import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  beginCameraFilePickerFlow,
  cancelCameraFilePickerFlow,
  createCameraFilePickerFlowState,
  finishCameraFilePickerFlow,
} from "./cameraFilePickerFlow";

function requireCallback(value: (() => void) | null): () => void {
  if (typeof value !== "function") {
    throw new Error("Expected callback to be set");
  }
  return value;
}

describe("cameraFilePickerFlow", () => {
  it("captures the selected file before closing the camera session", async () => {
    const events: string[] = [];
    const state = createCameraFilePickerFlowState();
    const input = {
      click: () => events.push("click"),
    };

    const started = beginCameraFilePickerFlow(state, {
      input,
      onClose: () => events.push("close"),
      addFocusListener: () => () => events.push("cleanup-focus"),
    });

    assert.equal(started, true);
    assert.equal(state.active, true);

    const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });
    await finishCameraFilePickerFlow(state, file, {
      onCapture: async (selected) => {
        events.push(`capture:${selected.name}`);
      },
    });

    assert.deepEqual(events, [
      "click",
      "cleanup-focus",
      "capture:receipt.jpg",
      "close",
    ]);
    assert.equal(state.active, false);
  });

  it("closes and cleans up when the picker is canceled", () => {
    const events: string[] = [];
    let focusListener: (() => void) | null = null;
    let cancelTimer: (() => void) | null = null;
    const state = createCameraFilePickerFlowState();

    beginCameraFilePickerFlow(state, {
      input: { click: () => events.push("click") },
      onClose: () => events.push("close"),
      addFocusListener: (listener) => {
        focusListener = listener;
        return () => events.push("cleanup-focus");
      },
      setCancelTimeout: (listener) => {
        cancelTimer = listener;
        return "timer";
      },
      clearCancelTimeout: () => {
        cancelTimer = null;
      },
    });

    assert.equal(state.active, true);
    requireCallback(focusListener)();
    assert.equal(state.active, true);
    requireCallback(cancelTimer)();

    assert.deepEqual(events, ["click", "cleanup-focus", "close"]);
    assert.equal(state.active, false);
  });

  it("does not run a scheduled cancel after a file was selected", async () => {
    const events: string[] = [];
    let focusListener: (() => void) | null = null;
    let cancelTimer: (() => void) | null = null;
    const state = createCameraFilePickerFlowState();

    beginCameraFilePickerFlow(state, {
      input: { click: () => events.push("click") },
      onClose: () => events.push("close"),
      addFocusListener: (listener) => {
        focusListener = listener;
        return () => events.push("cleanup-focus");
      },
      setCancelTimeout: (listener) => {
        cancelTimer = listener;
        return "timer";
      },
      clearCancelTimeout: () => {
        events.push("clear-timer");
        cancelTimer = null;
      },
    });

    requireCallback(focusListener)();
    const scheduledCancel = requireCallback(cancelTimer);

    const file = new File(["receipt"], "receipt.jpg", { type: "image/jpeg" });
    await finishCameraFilePickerFlow(state, file, {
      onCapture: async () => {
        events.push("capture");
      },
    });
    scheduledCancel();

    assert.deepEqual(events, [
      "click",
      "clear-timer",
      "cleanup-focus",
      "capture",
      "close",
    ]);
    assert.equal(state.active, false);
  });

  it("allows explicit cancellation without a focus event", () => {
    const events: string[] = [];
    const state = createCameraFilePickerFlowState();

    beginCameraFilePickerFlow(state, {
      input: { click: () => events.push("click") },
      onClose: () => events.push("close"),
      addFocusListener: () => () => events.push("cleanup-focus"),
    });

    assert.equal(cancelCameraFilePickerFlow(state), true);
    assert.equal(cancelCameraFilePickerFlow(state), false);
    assert.deepEqual(events, ["click", "cleanup-focus", "close"]);
  });
});
