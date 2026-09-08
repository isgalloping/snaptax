export type CameraFilePickerCaptureHandler = (
  file: File,
) => void | Promise<void>;

interface CameraFilePickerFlowOptions {
  openPicker: () => void;
  setCameraOpen: (open: boolean) => void;
  onClose?: () => void;
  addWindowFocusListener?: (listener: () => void) => () => void;
  scheduleCancelCheck?: (callback: () => void) => unknown;
  clearCancelCheck?: (handle: unknown) => void;
}

export interface CameraFilePickerFlow {
  openFromCameraFallback: () => void;
  openFromClosedCamera: () => void;
  handleFileSelected: (
    file: File | null | undefined,
    capture: CameraFilePickerCaptureHandler,
  ) => Promise<void>;
  closeIfActive: () => void;
  isActive: () => boolean;
}

function defaultAddWindowFocusListener(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("focus", listener, { once: true });
  return () => window.removeEventListener("focus", listener);
}

function defaultScheduleCancelCheck(callback: () => void) {
  return globalThis.setTimeout(callback, 200);
}

function defaultClearCancelCheck(handle: unknown) {
  globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>);
}

export function createCameraFilePickerFlow({
  openPicker,
  setCameraOpen,
  onClose,
  addWindowFocusListener = defaultAddWindowFocusListener,
  scheduleCancelCheck = defaultScheduleCancelCheck,
  clearCancelCheck = defaultClearCancelCheck,
}: CameraFilePickerFlowOptions): CameraFilePickerFlow {
  let active = false;
  let selectionStarted = false;
  let removeFocusListener: (() => void) | null = null;
  let cancelCheckHandle: unknown = null;

  const cleanupCancelWatch = () => {
    removeFocusListener?.();
    removeFocusListener = null;
    if (cancelCheckHandle !== null) {
      clearCancelCheck(cancelCheckHandle);
      cancelCheckHandle = null;
    }
  };

  const closeIfActive = () => {
    if (!active) return;
    active = false;
    selectionStarted = false;
    cleanupCancelWatch();
    onClose?.();
    setCameraOpen(false);
  };

  const armCancelWatch = () => {
    cleanupCancelWatch();
    removeFocusListener = addWindowFocusListener(() => {
      cancelCheckHandle = scheduleCancelCheck(() => {
        cancelCheckHandle = null;
        if (!selectionStarted) {
          closeIfActive();
        }
      });
    });
  };

  const open = (signalOpen: boolean) => {
    closeIfActive();
    active = true;
    selectionStarted = false;
    if (signalOpen) {
      setCameraOpen(true);
    }
    armCancelWatch();
    try {
      openPicker();
    } catch (error) {
      closeIfActive();
      throw error;
    }
  };

  return {
    openFromCameraFallback: () => open(false),
    openFromClosedCamera: () => open(true),
    handleFileSelected: async (file, capture) => {
      if (!file) {
        closeIfActive();
        return;
      }

      if (!active) {
        await capture(file);
        return;
      }

      selectionStarted = true;
      cleanupCancelWatch();
      try {
        await capture(file);
      } finally {
        closeIfActive();
      }
    },
    closeIfActive,
    isActive: () => active,
  };
}
