#!/usr/bin/env node
/**
 * Write archive stub after git mv.
 * Usage:
 *   node scripts/superpowers-write-stub.mjs \
 *     docs/superpowers/specs/OLD.md \
 *     topics/onboarding-aha-design.md \
 *     archive/specs/OLD.md \
 *     "Onboarding hero countdown"
 */
import { writeFile } from "node:fs/promises";

const [activePath, topicRel, archiveRel, title] = process.argv.slice(2);
if (!activePath || !topicRel || !archiveRel || !title) {
  console.error(
    "Usage: superpowers-write-stub.mjs <activePath> <topicRel> <archiveRel> <title>",
  );
  process.exit(1);
}

const depth = activePath.split("/").length - 3;
const up = "../".repeat(Math.max(1, depth));
const topicLink = `${up}${topicRel.replace(/^\.\.\//, "")}`;
const archiveLink = `${up}${archiveRel.replace(/^\.\.\//, "")}`;

const body = `# [Archived] ${title}

> **Status:** Archived · superseded by consolidated topic spec  
> **Current truth:** [${topicRel.split("/").pop()}](${topicLink})  
> **Full text:** [${archiveRel.split("/").pop()}](${archiveLink})

Do not use this stub for implementation decisions.
`;

await writeFile(activePath, body, "utf8");
console.log(`Wrote stub: ${activePath}`);
