import { spawnSync } from "node:child_process";
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
    if (!val) continue;
    if (!process.env[key]) process.env[key] = val;
  }
}

const envFile = process.argv[2];
if (envFile) {
  loadEnvFile(envFile);
} else {
  loadEnvFile(".env");
  loadEnvFile(".env.local");
}

const directUrl =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL;

if (!directUrl) {
  console.error(
    "[migrate-deploy] Missing database URL. Set POSTGRES_URL_NON_POOLING (recommended) or DATABASE_URL.",
  );
  if (envFile) {
    console.error(`[migrate-deploy] Checked env file: ${envFile}`);
  } else {
    console.error("[migrate-deploy] Checked process env and .env / .env.local");
  }
  process.exit(1);
}

process.env.DATABASE_URL = directUrl;

const source = envFile ?? (process.env.VERCEL ? "Vercel env" : ".env.local");
console.log(`[migrate-deploy] Applying migrations (${source}, direct connection)`);

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
