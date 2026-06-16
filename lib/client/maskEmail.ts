/** Settings UI: first 3 local chars + *** + @domain (e.g. isg***@gmail.com). */
export function maskEmailForDisplay(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!local || !domain) return "***";

  const prefix = local.length >= 3 ? local.slice(0, 3) : local;
  return `${prefix}***@${domain}`;
}
