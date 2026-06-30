export function isIosUserAgent(userAgent: string): boolean {
  return /iPad|iPhone|iPod/.test(userAgent);
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return isIosUserAgent(navigator.userAgent);
}
