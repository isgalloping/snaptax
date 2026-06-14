import { ipAddress } from "@vercel/functions";

export function clientIpFromHeaders(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;

  return "127.0.0.1";
}

export function clientIp(request: Request): string {
  if (process.env.VERCEL === "1") {
    const vercelIp = ipAddress(request);
    if (vercelIp) return vercelIp;
  }

  return clientIpFromHeaders(request.headers);
}
