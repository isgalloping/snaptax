export function securityHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV === "development";
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isDev ? ["'unsafe-eval'"] : []),
    "https://accounts.google.com",
    "https://cdn.paddle.com",
    "https://*.paddle.com",
  ].join(" ");

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com https://cdn.paddle.com",
    "connect-src 'self' https://*.paddle.com https://accounts.google.com https://oauth2.googleapis.com https://*.vercel-storage.com https://vitals.vercel-insights.com",
    "frame-src https://buy.paddle.com https://*.paddle.com https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://cdn.paddle.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(self), geolocation=()",
    "Content-Security-Policy": csp,
  };
}
