type FocusTarget = Pick<Window, "addEventListener" | "removeEventListener">;

interface FilePickerChangeEvent {
  currentTarget: HTMLInputElement;
  target: HTMLInputElement;
}

export interface CameraFilePickerFlowOptions {
  getInput: () => HTMLInputElement | null;
  getFocusTarget?: () => FocusTarget | null;
  cancelDelayMs?: number;
  onOpen: () => void;
  onCapture: (file: File) => void | Promise<void>;
  onClose: () => void;
}

export interface CameraFilePickerFlow {
  open: () => void;
  handleChange: (event: FilePickerChangeEvent) => Promise<void>;
  close: () => void;
  updateOptions: (nextOptions: CameraFilePickerFlowOptions) => void;
  isOpen: () => boolean;
}

function defaultFocusTarget(): FocusTarget | null {
  if (typeof window === "undefined") return null;
  return window;
}

export function createCameraFilePickerFlow(
  initialOptions: CameraFilePickerFlowOptions,
): CameraFilePickerFlow {
  let options = initialOptions;
  let active = false;
  let captureInFlight = false;
  let focusTarget: FocusTarget | null = null;
  let focusListener: (() => void) | null = null;
  let cancelTimer: ReturnType<typeof setTimeout> | null = null;

  const clearCancelTimer = () => {
    if (cancelTimer == null) return;
    clearTimeout(cancelTimer);
    cancelTimer = null;
  };

  const detachFocusListener = () => {
    if (!focusTarget || !focusListener) return;
    focusTarget.removeEventListener("focus", focusListener);
    focusTarget = null;
    focusListener = null;
  };

  const close = () => {
    if (!active) return;
    active = false;
    captureInFlight = false;
    clearCancelTimer();
    detachFocusListener();
    options.onClose();
  };

  const scheduleCancelClose = () => {
    clearCancelTimer();
    cancelTimer = setTimeout(() => {
      cancelTimer = null;
      if (!active || captureInFlight) return;
      close();
    }, options.cancelDelayMs ?? 250);
  };

  const attachFocusListener = () => {
    detachFocusListener();
    focusTarget = options.getFocusTarget?.() ?? defaultFocusTarget();
    if (!focusTarget) return;
    focusListener = scheduleCancelClose;
    focusTarget.addEventListener("focus", focusListener);
  };

  return {
    open() {
      if (active) return;
      active = true;
      options.onOpen();
      attachFocusListener();

      const input = options.getInput();
      if (!input) {
        close();
        return;
      }
      input.click();
    },

    async handleChange(event) {
      const input = event.currentTarget ?? event.target;
      const file = input.files?.[0] ?? null;
      clearCancelTimer();

      if (!file) {
        input.value = "";
        close();
        return;
      }

      captureInFlight = true;
      try {
        await options.onCapture(file);
      } finally {
        input.value = "";
        close();
      }
    },

    close,

    updateOptions(nextOptions) {
      options = nextOptions;
    },

    isOpen() {
      return active;
    },
  };
}
