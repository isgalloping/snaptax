import { isIos } from "@/lib/client/platform/isIos";

export type HiddenBackgroundSyncInput = {
  hasDocument: boolean;
  documentHidden: boolean;
  navigatorOnline: boolean;
  ios: boolean;
};

export function evaluateHiddenBackgroundSync(
  input: HiddenBackgroundSyncInput,
): boolean {
  if (!input.hasDocument) return false;
  return input.documentHidden && input.navigatorOnline && !input.ios;
}

export function shouldRunHiddenBackgroundSync(): boolean {
  if (typeof document === "undefined") return false;
  return evaluateHiddenBackgroundSync({
    hasDocument: true,
    documentHidden: document.hidden,
    navigatorOnline: navigator.onLine,
    ios: isIos(),
  });
}
