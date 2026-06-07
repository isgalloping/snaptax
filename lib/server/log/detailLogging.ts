export function isDetailedErrorLogging(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  return process.env.VERCEL_ENV === "preview";
}
