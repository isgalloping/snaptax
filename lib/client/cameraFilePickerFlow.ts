export interface CameraFilePickerFlow {
  dispose: () => void;
}

type FilePickerInput = Pick<
  HTMLInputElement,
  "addEventListener" | "click" | "files" | "removeEventListener" | "value"
>;

type FilePickerWindowTarget = {
  addEventListener: Window["addEventListener"];
  removeEventListener: Window["removeEventListener"];
  setTimeout: Window["setTimeout"];
};

interface CameraFilePickerFlowOptions {
  input: FilePickerInput | null | undefined;
  onCapture: (file: File) => void | Promise<void>;
  onClose: () => void;
  windowTarget?: FilePickerWindowTarget;
}

export function beginCameraFilePickerFlow({
  input,
  onCapture,
  onClose,
  windowTarget = typeof window === "undefined" ? undefined : window,
}: CameraFilePickerFlowOptions): CameraFilePickerFlow | null {
  if (!input) return null;

  let active = true;

  const cleanup = () => {
    if (!active) return;
    active = false;
    input.removeEventListener("change", handleChange);
    windowTarget?.removeEventListener("focus", handleWindowFocus);
  };

  const close = () => {
    if (!active) return;
    cleanup();
    onClose();
  };

  const handleChange = () => {
    if (!active) return;
    const file = input.files?.[0] ?? null;
    input.value = "";
    if (!file) {
      close();
      return;
    }

    void Promise.resolve(onCapture(file)).finally(close);
  };

  const handleWindowFocus = () => {
    windowTarget?.setTimeout(() => {
      if (!active || input.files?.length) return;
      close();
    }, 0);
  };

  input.addEventListener("change", handleChange);
  windowTarget?.addEventListener("focus", handleWindowFocus);
  input.click();

  return { dispose: cleanup };
}
