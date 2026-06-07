import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

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

function listMigrationNames() {
  const dir = join("prisma", "migrations");
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(join(dir, entry.name, "migration.sql")),
    )
    .map((entry) => entry.name)
    .sort();
}

function runMigrateDeploy() {
  return spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "pipe",
    encoding: "utf8",
    env: process.env,
  });
}

function emitOutput(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

let result = runMigrateDeploy();
emitOutput(result);

if (result.status === 0) {
  process.exit(0);
}

const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
if (output.includes("P3005")) {
  console.log(
    "[migrate-deploy] P3005: existing schema detected, baselining prisma migrations",
  );
  for (const name of listMigrationNames()) {
    console.log(`[migrate-deploy] migrate resolve --applied ${name}`);
    const resolve = spawnSync(
      "npx",
      ["prisma", "migrate", "resolve", "--applied", name],
      { stdio: "pipe", encoding: "utf8", env: process.env },
    );
    emitOutput(resolve);
    if (resolve.status !== 0) {
      process.exit(resolve.status ?? 1);
    }
  }
  console.log("[migrate-deploy] Retrying migrate deploy after baseline");
  result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });
}

process.exit(result.status ?? 1);
