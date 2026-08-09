#!/usr/bin/env node
/**
 * Corner flood-fill: turn near-black canvas into transparent alpha.
 * Does not color-key interior dark UI pixels.
 *
 * Usage:
 *   node scripts/seo-knockout-near-black.mjs <png> [<png>...]
 *   node scripts/seo-knockout-near-black.mjs --threshold=14 path.png
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
let threshold = 14;
const files = [];
for (const a of args) {
  if (a.startsWith("--threshold=")) {
    threshold = Number(a.slice("--threshold=".length));
  } else {
    files.push(a);
  }
}
if (files.length === 0) {
  console.error("Usage: node scripts/seo-knockout-near-black.mjs [--threshold=14] <png>...");
  process.exit(1);
}

function isNearBlack(r, g, b, t) {
  return r <= t && g <= t && b <= t;
}

async function knockout(file) {
  const abs = path.resolve(file);
  const { data, info } = await sharp(abs)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) throw new Error(`${file}: expected 4 channels, got ${channels}`);

  const visited = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let qh = 0;
  let qt = 0;

  const seeds = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  for (const [sx, sy] of seeds) {
    const si = sy * width + sx;
    if (visited[si]) continue;
    const off = si * 4;
    if (!isNearBlack(data[off], data[off + 1], data[off + 2], threshold)) continue;
    visited[si] = 1;
    qx[qt] = sx;
    qy[qt] = sy;
    qt++;
  }

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;
    const i = y * width + x;
    const o = i * 4;
    data[o + 3] = 0;
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      if (visited[ni]) continue;
      const no = ni * 4;
      if (!isNearBlack(data[no], data[no + 1], data[no + 2], threshold)) continue;
      visited[ni] = 1;
      qx[qt] = nx;
      qy[qt] = ny;
      qt++;
    }
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(abs);
  const meta = await sharp(abs).metadata();
  console.log(`ok ${file} hasAlpha=${meta.hasAlpha} size=${meta.width}x${meta.height}`);
}

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error(`missing: ${f}`);
    process.exit(1);
  }
  await knockout(f);
}
