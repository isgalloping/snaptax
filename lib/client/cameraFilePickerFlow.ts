type CameraFilePickerInput = Pick<HTMLInputElement, "click">;

type CancelTimer = unknown;

export interface CameraFilePickerFlowState {
  active: boolean;
  cleanupFocus: (() => void) | null;
  cancelTimer: CancelTimer | null;
  clearCancelTimeout: ((timer: CancelTimer) => void) | null;
  onClose: (() => void) | null;
}

export function createCameraFilePickerFlowState(): CameraFilePickerFlowState {
  return {
    active: false,
    cleanupFocus: null,
    cancelTimer: null,
    clearCancelTimeout: null,
    onClose: null,
  };
}

function defaultAddFocusListener(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("focus", listener, { once: true });
  return () => window.removeEventListener("focus", listener);
}

function defaultSetCancelTimeout(
  listener: () => void,
  delayMs: number,
): ReturnType<typeof globalThis.setTimeout> {
  return globalThis.setTimeout(listener, delayMs);
}

function defaultClearCancelTimeout(timer: CancelTimer): void {
  globalThis.clearTimeout(timer as ReturnType<typeof globalThis.setTimeout>);
}

function clearPendingCancelTimer(state: CameraFilePickerFlowState) {
  if (state.cancelTimer != null && state.clearCancelTimeout) {
    state.clearCancelTimeout(state.cancelTimer);
  }
  state.cancelTimer = null;
}

function clearPendingCancel(state: CameraFilePickerFlowState) {
  clearPendingCancelTimer(state);
  state.clearCancelTimeout = null;
}

function resetCameraFilePickerFlow(state: CameraFilePickerFlowState) {
  clearPendingCancel(state);
  state.cleanupFocus?.();
  state.active = false;
  state.cleanupFocus = null;
  state.onClose = null;
}

export function beginCameraFilePickerFlow(
  state: CameraFilePickerFlowState,
  options: {
    input: CameraFilePickerInput | null;
    onClose: () => void;
    addFocusListener?: (listener: () => void) => () => void;
    setCancelTimeout?: (listener: () => void, delayMs: number) => CancelTimer;
    clearCancelTimeout?: (timer: CancelTimer) => void;
    cancelDelayMs?: number;
  },
): boolean {
  if (!options.input) return false;

  resetCameraFilePickerFlow(state);
  state.active = true;
  state.onClose = options.onClose;

  const setCancelTimeout = options.setCancelTimeout ?? defaultSetCancelTimeout;
  const clearCancelTimeout =
    options.clearCancelTimeout ?? defaultClearCancelTimeout;
  state.clearCancelTimeout = clearCancelTimeout;
  state.cleanupFocus = (options.addFocusListener ?? defaultAddFocusListener)(
    () => {
      clearPendingCancelTimer(state);
      state.cancelTimer = setCancelTimeout(
        () => {
          state.cancelTimer = null;
          if (state.active) {
            cancelCameraFilePickerFlow(state);
          }
        },
        options.cancelDelayMs ?? 250,
      );
    },
  );

  options.input.click();
  return true;
}

export async function finishCameraFilePickerFlow(
  state: CameraFilePickerFlowState,
  file: File | null,
  options: {
    onCapture: (file: File) => void | Promise<void>;
  },
): Promise<boolean> {
  if (!state.active) {
    if (file) await options.onCapture(file);
    return false;
  }

  const onClose = state.onClose;
  resetCameraFilePickerFlow(state);

  try {
    if (file) {
      await options.onCapture(file);
    }
  } finally {
    onClose?.();
  }

  return true;
}

export function cancelCameraFilePickerFlow(
  state: CameraFilePickerFlowState,
): boolean {
  if (!state.active) return false;

  const onClose = state.onClose;
  resetCameraFilePickerFlow(state);
  onClose?.();
  return true;
}
