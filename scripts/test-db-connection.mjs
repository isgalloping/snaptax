import { existsSync, readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

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

loadEnvFile(".env.local");

function withParams(url, extra) {
  if (!url) return url;
  return url.includes("?") ? `${url}&${extra}` : `${url}?${extra}`;
}

const candidates = [
  ["POSTGRES_PRISMA_URL (6543 pooler)", process.env.POSTGRES_PRISMA_URL],
  ["POSTGRES_URL_NON_POOLING (5432 pooler)", process.env.POSTGRES_URL_NON_POOLING],
  [
    "5432 pooler + connect_timeout=60",
    withParams(process.env.POSTGRES_URL_NON_POOLING, "connect_timeout=60"),
  ],
  [
    "direct db host constructed",
    process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD && process.env.POSTGRES_HOST
      ? `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE ?? "postgres"}?sslmode=require`
      : null,
  ],
  [
    "local snaptax",
    "postgresql://snaptax:snaptax@localhost:5432/snaptax?schema=public",
  ],
];

for (const [label, url] of candidates) {
  if (!url) {
    console.log(`${label}: (missing)`);
    continue;
  }
  const host = url.match(/@([^/:?]+)/)?.[1] ?? "?";
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    const rows = await prisma.$queryRaw`SELECT 1 AS ok`;
    console.log(`${label} @ ${host}: OK`, rows);
  } catch (err) {
    const lines =
      err instanceof Error
        ? err.message.split("\n").filter((l) => l.trim())
        : [String(err)];
    console.log(`${label} @ ${host}: FAIL`);
    for (const line of lines.slice(0, 6)) console.log(`  ${line}`);
  } finally {
    await prisma.$disconnect();
  }
}
