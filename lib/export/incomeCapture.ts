const CAPTURE_KIND_KEY = "snap1099_capture_kind";

export type IncomeCaptureKind = "1099-NEC" | "1099-K";

export function setPendingIncomeCapture(kind: IncomeCaptureKind): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(CAPTURE_KIND_KEY, kind);
}

export function peekPendingIncomeCapture(): IncomeCaptureKind | null {
  if (typeof sessionStorage === "undefined") return null;
  const value = sessionStorage.getItem(CAPTURE_KIND_KEY);
  if (value === "1099-NEC" || value === "1099-K") return value;
  return null;
}

export function clearPendingIncomeCapture(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(CAPTURE_KIND_KEY);
}

export function parseCaptureKindHeader(
  header: string | null,
): IncomeCaptureKind | null {
  if (header === "1099-NEC" || header === "1099-K") return header;
  return null;
}
