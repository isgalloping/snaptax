const PLACEHOLDER_SECRETS = new Set([
  "abc",
  "changeme",
  "placeholder",
  "your_webhook_secret",
]);

export function isPaddleWebhookSecretPlaceholder(secret: string): boolean {
  const normalized = secret.trim().toLowerCase();
  return PLACEHOLDER_SECRETS.has(normalized);
}
