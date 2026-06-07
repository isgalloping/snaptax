import { PrismaClient } from "@prisma/client";
import { applyEnvAliases, getDatabaseUrl } from "@/lib/server/env";

applyEnvAliases();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const databaseUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl
      ? { datasources: { db: { url: databaseUrl } } }
      : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
