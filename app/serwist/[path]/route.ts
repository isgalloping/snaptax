import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

/** Turbopack bootstrap workers must not be precached — they throw without dev params. */
function filterTurbopackBootstrapWorkers<
  T extends { url: string },
>(entries: T[]): T[] {
  return entries.filter((entry) => !entry.url.includes("turbopack-worker-"));
}

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/", revision },
      { url: "/offline", revision },
    ],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
    manifestTransforms: [
      async (entries) => ({
        manifest: filterTurbopackBootstrapWorkers(entries),
        warnings: [],
      }),
    ],
  });
