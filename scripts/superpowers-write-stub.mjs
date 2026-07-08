#!/usr/bin/env node
/**
 * Write archive stub after git mv.
 * Usage (topic):
 *   node scripts/superpowers-write-stub.mjs \
 *     docs/superpowers/specs/OLD.md \
 *     topics/onboarding-aha-design.md \
 *     archive/specs/OLD.md \
 *     "Onboarding hero countdown"
 * Usage (tech canonical — e.g. pwa-install):
 *   node scripts/superpowers-write-stub.mjs \
 *     docs/superpowers/specs/OLD.md \
 *     tech/13-pwa-install-architecture.md \
 *     archive/specs/OLD.md \
 *     "PWA install prompt" \
 *     --tech
 */
import { writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const techMode = args.includes("--tech");
const filtered = args.filter((a) => a !== "--tech");
const [activePath, truthRel, archiveRel, title] = filtered;
if (!activePath || !truthRel || !archiveRel || !title) {
  console.error(
    "Usage: superpowers-write-stub.mjs <activePath> <truthRel> <archiveRel> <title> [--tech]",
  );
  process.exit(1);
}

const depth = activePath.split("/").length - 3;
const up = "../".repeat(Math.max(1, depth));
const truthLink = `${up}${truthRel.replace(/^\.\.\//, "")}`;
const archiveLink = `${up}${archiveRel.replace(/^\.\.\//, "")}`;
const truthLabel = truthRel.split("/").pop();

const statusLine = techMode
  ? "> **Status:** Archived · canonical truth in tech doc"
  : "> **Status:** Archived · superseded by consolidated topic spec";

const body = `# [Archived] ${title}

${statusLine}  
> **Current truth:** [${truthLabel}](${truthLink})  
> **Full text:** [${archiveRel.split("/").pop()}](${archiveLink})

Do not use this stub for implementation decisions.
`;

await writeFile(activePath, body, "utf8");
console.log(`Wrote stub: ${activePath}`);
