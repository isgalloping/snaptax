#!/usr/bin/env node
/**
 * Scan docs/superpowers and emit MANIFEST.csv
 * Usage: node scripts/classify-superpowers-docs.mjs > docs/superpowers/MANIFEST.csv
 */
import { readdir, readFile } from "node:fs/promises";
import { join, basename } from "node:path";

const ROOT = join(process.cwd(), "docs/superpowers");

/** @type {Record<string, string>} */
const TOPIC_PATTERNS = {
  "onboarding-aha": /onboarding|aha-moment/i,
  "home-dashboard": /home-|widget-|tax-header-hero|need-action-widget/i,
  "export-pipeline": /export-/i,
  "delete-account": /delete-account/i,
  "receipt-sync-lifecycle": /receipt-(sync|lifecycle|sliding|pipeline|upload-stuck|summary-local|sync-recovery)/i,
  "capture-pipeline": /batch-receipt-review|post-batch-review|capture-immediate-list/i,
  "settings": /settings-(redesign|v3|v5|email-mask|google-button|share|summary|privacy-data)|tax-saved-header-settings-alignment/i,
  "compliance-program": /compliance-(master|p[1-6]|program)/i,
  "pwa-install": /pwa-|android-pwa|webapk/i,
  "founder-program-widget": /founder-|hide-missing-deductions/i,
  "camera-live-footer": /camera-live-footer|resnap-shutter/i,
  "app-navigation-history": /swipe-back|app-navigation-history/i,
  "foundation-adr": /2026-06-05-|logging-design|tax-savings-regional|mvp-master/i,
};

function isArchiveStub(content) {
  return content.startsWith("# [Archived]");
}

function inferTopic(filename) {
  for (const [topic, re] of Object.entries(TOPIC_PATTERNS)) {
    if (re.test(filename)) return topic;
  }
  return "other";
}

function inferLayer(relPath, content) {
  if (relPath.startsWith("archive/")) return "archive";
  if (relPath.startsWith("topics/")) return "consolidated";
  if (isArchiveStub(content)) return "stub";
  if (/supersedes|superseded|Partially superseded|DEPRECATED/i.test(content)) {
    return "consolidate-candidate";
  }
  if (relPath.includes("2026-06-05-") || relPath.includes("logging-design")) {
    return "foundation-adr";
  }
  return "active";
}

async function walk(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  /** @type {string[]} */
  const files = [];
  for (const e of entries) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (e.name === "node_modules") continue;
      files.push(...(await walk(join(dir, e.name), rel)));
    } else if (e.name.endsWith(".md") || e.name.endsWith(".csv")) {
      if (e.name === "MANIFEST.csv") continue;
      files.push(rel);
    }
  }
  return files;
}

function csvEscape(s) {
  return `"${String(s).replace(/"/g, '""')}"`;
}

const files = await walk(ROOT);
console.log("path,kind,topic,layer,status,canonical_ref");

for (const rel of files.sort()) {
  const full = join(ROOT, rel);
  const content = await readFile(full, "utf8");
  const kind = rel.startsWith("plans/") || rel.includes("/plans/")
    ? "plan"
    : rel.startsWith("specs/") || rel.includes("/specs/")
      ? "spec"
      : rel.startsWith("topics/")
        ? "topic"
        : "other";
  const topic = inferTopic(basename(rel));
  const layer = inferLayer(rel, content);
  const status =
    layer === "stub"
      ? "archived-stub"
      : layer === "consolidate-candidate"
        ? "consolidate"
        : layer === "foundation-adr"
          ? "keep-active"
          : layer === "archive"
            ? "archived"
            : layer === "consolidated"
              ? "topic"
              : "active";
  const canonical =
    topic === "pwa-install"
      ? "docs/tech/13-pwa-install-architecture.md"
      : topic === "export-pipeline"
        ? "docs/tech/08-export.md"
        : "";
  console.log(
    [
      csvEscape(rel),
      csvEscape(kind),
      csvEscape(topic),
      csvEscape(layer),
      csvEscape(status),
      csvEscape(canonical),
    ].join(","),
  );
}
