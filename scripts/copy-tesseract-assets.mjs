#!/usr/bin/env node
/**
 * Copies Tesseract worker + WASM core to public/tesseract for CSP-safe same-origin loading.
 * Fetches eng.traineddata.gz once if missing (postinstall / build).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public/tesseract");
const coreOut = path.join(publicRoot, "core");
const langOut = path.join(publicRoot, "lang");

const workerSrc = path.join(root, "node_modules/tesseract.js/dist/worker.min.js");
const coreSrc = path.join(root, "node_modules/tesseract.js-core");

const CORE_FILES = [
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-simd-lstm.wasm",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-lstm.wasm",
];

const ENG_DATA_URL =
  "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz";

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function main() {
  try {
    await fs.access(workerSrc);
  } catch {
    console.warn("copy-tesseract-assets: tesseract.js not installed, skipping");
    return;
  }

  await fs.mkdir(coreOut, { recursive: true });
  await fs.mkdir(langOut, { recursive: true });

  await copyFile(workerSrc, path.join(publicRoot, "worker.min.js"));

  for (const name of CORE_FILES) {
    const src = path.join(coreSrc, name);
    try {
      await fs.access(src);
      await copyFile(src, path.join(coreOut, name));
    } catch {
      console.warn(`copy-tesseract-assets: missing ${name}, skipping`);
    }
  }

  const langFile = path.join(langOut, "eng.traineddata.gz");
  try {
    await fs.access(langFile);
  } catch {
    console.log("copy-tesseract-assets: downloading eng.traineddata.gz …");
    const res = await fetch(ENG_DATA_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch eng traineddata: ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(langFile, buf);
  }

  console.log("copy-tesseract-assets: done → public/tesseract/");
}

main().catch((err) => {
  console.error("copy-tesseract-assets:", err);
  process.exit(1);
});
