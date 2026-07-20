import { existsSync, readFileSync } from "node:fs";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const aliases = [
  ["DATABASE_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL", "POSTGRES_URL"],
  ["GHOST_HMAC_SECRET", "SUPABASE_JWT_SECRET", "AUTH_SECRET"],
  ["AUTH_SECRET", "SUPABASE_JWT_SECRET", "GHOST_HMAC_SECRET"],
  ["NEXT_PUBLIC_GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_ID"],
  [
    "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN",
    "PADDLE_SNAPTAX_CLIENT_SIDE_TOKEN",
  ],
  ["PADDLE_API_KEY", "PADDLE_SNAPTAX_API_KEY"],
  ["PADDLE_PRICE_ID", "PADDLE_SNAPTAX_PRICE_KEY", "FOUNDER_LEVEL_DEFAULT"],
  [
    "NEXT_PUBLIC_PADDLE_PRICE_ID",
    "PADDLE_PRICE_ID",
    "FOUNDER_LEVEL_DEFAULT",
    "PADDLE_SNAPTAX_PRICE_KEY",
  ],
];

for (const [target, ...sources] of aliases) {
  if (process.env[target]) continue;
  for (const src of sources) {
    if (process.env[src]) {
      process.env[target] = process.env[src];
      break;
    }
  }
}
