#!/usr/bin/env node
/**
 * Verify active docs do not treat archived superpowers specs/plans as current truth.
 *
 * Usage: node scripts/check-superpowers-doc-links.mjs
 * Exit 0 = OK, 1 = violations found.
 */
import { readFile, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const SUPER = join(ROOT, "docs/superpowers");
const ARCHIVE_SPECS = join(SUPER, "archive/specs");
const ARCHIVE_PLANS = join(SUPER, "archive/plans");

const ALLOWLIST = new Set([
  "docs/superpowers/plans/2026-07-07-superpowers-doc-consolidation.md",
  "docs/superpowers/specs/2026-07-07-superpowers-doc-consolidation-design.md",
]);

const REDIRECT_MARKERS = [
  "docs/superpowers/topics/",
  "superpowers/topics/",
  "../topics/",
  "./topics/",
  "docs/tech/13-pwa-install-architecture.md",
  "tech/13-pwa-install-architecture.md",
  "../tech/13-pwa-install-architecture.md",
];

async function listMd(dir) {
  try {
    const names = await readdir(dir);
    return names.filter((n) => n.endsWith(".md"));
  } catch {
    return [];
  }
}

async function isStub(filePath) {
  try {
    const head = await readFile(filePath, "utf8");
    return head.startsWith("# [Archived]");
  } catch {
    return false;
  }
}

function rel(p) {
  return p.replace(ROOT + "/", "");
}

function hasRedirect(content) {
  return REDIRECT_MARKERS.some((m) => content.includes(m));
}

/** @type {{ kind: string, name: string, activePath: string }[]} */
const archived = [];

for (const name of await listMd(ARCHIVE_SPECS)) {
  archived.push({
    kind: "specs",
    name,
    activePath: `docs/superpowers/specs/${name}`,
  });
}

for (const name of await listMd(ARCHIVE_PLANS)) {
  archived.push({
    kind: "plans",
    name,
    activePath: `docs/superpowers/plans/${name}`,
  });
}

/** @type {{ file: string, archived: string, line: number, text: string }[]} */
const violations = [];

for (const item of archived) {
  const patterns = [
    item.activePath,
    `superpowers/${item.kind}/${item.name}`,
    item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ];

  let rgOut = "";
  try {
    rgOut = execSync(
      `rg -n --glob '!docs/superpowers/archive/**' --glob '!node_modules/**' --glob '!.git/**' -e '${patterns[0]}' -e '${patterns[1]}' .`,
      { cwd: ROOT, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
    );
  } catch (err) {
    if (err.status === 1) continue;
    throw err;
  }

  for (const line of rgOut.split("\n").filter(Boolean)) {
    const m = line.match(/^([^:]+):(\d+):(.*)$/);
    if (!m) continue;
    const [, filePath, lineNo, text] = m;
    const fileRel = rel(filePath.startsWith("./") ? join(ROOT, filePath.slice(2)) : filePath);

    if (fileRel.includes("docs/superpowers/archive/")) continue;
    if (ALLOWLIST.has(fileRel)) continue;
    if (await isStub(join(ROOT, fileRel))) continue;

    const fullContent = await readFile(join(ROOT, fileRel), "utf8");
    if (hasRedirect(fullContent)) continue;

    violations.push({
      file: fileRel,
      archived: item.activePath,
      line: Number(lineNo),
      text: text.trim(),
    });
  }
}

if (violations.length === 0) {
  console.log(
    `OK: no stale superpowers links (${archived.length} archived items checked)`,
  );
  process.exit(0);
}

console.error(`Found ${violations.length} stale superpowers reference(s):\n`);
for (const v of violations) {
  console.error(`${v.file}:${v.line} → ${v.archived}`);
  console.error(`  ${v.text}\n`);
}
process.exit(1);
