# Superpowers 文档合并与分层索引 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Agent/newcomer doc noise by introducing a three-layer model (canonical → topic consolidations → archive), starting with Phase 0 classification/index and then one-PR-per-topic consolidations.

**Architecture:** Add `docs/superpowers/README.md` + `MANIFEST.csv` as the navigation layer; consolidate completed multi-spec topics into `topics/*.md`; move superseded bodies to `archive/` with ≤10-line stubs at original paths. Do **not** merge plans into specs. PWA defers to `docs/tech/13-pwa-install-architecture.md`.

**Tech Stack:** Markdown, git mv, ripgrep, optional Node script for MANIFEST + link checks.

**Spec:** `docs/superpowers/specs/2026-07-07-superpowers-doc-consolidation-design.md`

> **Executed (2026-07-08):** Phase 0–3 complete via PRs [#112](https://github.com/isgalloping/snaptax/pull/112) and [#114](https://github.com/isgalloping/snaptax/pull/114). Founder follow-ups: [#115](https://github.com/isgalloping/snaptax/pull/115), [#116](https://github.com/isgalloping/snaptax/pull/116). Step checkboxes below are a historical execution log.

---

## File map (created / modified)

| Path | Responsibility |
|------|----------------|
| `docs/superpowers/README.md` | Layer model, topic table, archive checklist |
| `docs/superpowers/MANIFEST.csv` | Machine-readable classification of all superpowers docs |
| `docs/superpowers/topics/*.md` | Consolidated topic specs (Phase 1) |
| `docs/superpowers/archive/specs/` | Archived spec bodies |
| `docs/superpowers/archive/plans/` | Archived plan bodies |
| `scripts/classify-superpowers-docs.mjs` | Generate/update MANIFEST.csv |
| `scripts/superpowers-write-stub.mjs` | Write stub at old path after git mv |
| `scripts/check-superpowers-doc-links.mjs` | Phase 2: verify active refs (optional CI) |
| `docs/product/README.md` | Point to superpowers README + topics |
| `AGENTS.md` | Agent read order for superpowers |
| `docs/product/PRODUCT-SPEC.md` §13–§14 | Agent checklist + doc index |

---

## Phase 0 — Classification & index (no file moves)

### Task 0: Scaffold directories

**Files:**
- Create: `docs/superpowers/topics/.gitkeep`
- Create: `docs/superpowers/archive/specs/.gitkeep`
- Create: `docs/superpowers/archive/plans/.gitkeep`

- [ ] **Step 1: Create archive/topic dirs**

```bash
mkdir -p docs/superpowers/topics
mkdir -p docs/superpowers/archive/specs
mkdir -p docs/superpowers/archive/plans
touch docs/superpowers/topics/.gitkeep
touch docs/superpowers/archive/specs/.gitkeep
touch docs/superpowers/archive/plans/.gitkeep
```

- [ ] **Step 2: Verify**

```bash
ls -la docs/superpowers/topics docs/superpowers/archive/specs docs/superpowers/archive/plans
```

Expected: three directories with `.gitkeep`

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/topics/.gitkeep docs/superpowers/archive/specs/.gitkeep docs/superpowers/archive/plans/.gitkeep
git commit -m "docs: scaffold superpowers topics and archive directories"
```

---

### Task 1: MANIFEST generator script

**Files:**
- Create: `scripts/classify-superpowers-docs.mjs`

- [ ] **Step 1: Create script**

```javascript
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
  "pwa-install": /pwa-|android-pwa|webapk/i,
  "foundation-adr": /2026-06-05-|logging-design|tax-savings-regional|mvp-master/i,
};

function inferTopic(filename) {
  for (const [topic, re] of Object.entries(TOPIC_PATTERNS)) {
    if (re.test(filename)) return topic;
  }
  return "other";
}

function inferLayer(relPath, content) {
  if (relPath.startsWith("archive/")) return "archive";
  if (relPath.startsWith("topics/")) return "consolidated";
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
    layer === "consolidate-candidate"
      ? "consolidate"
      : layer === "foundation-adr"
        ? "keep-active"
        : layer === "archive"
          ? "archived"
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
```

- [ ] **Step 2: Generate MANIFEST**

```bash
node scripts/classify-superpowers-docs.mjs > docs/superpowers/MANIFEST.csv
wc -l docs/superpowers/MANIFEST.csv
```

Expected: header + ~220 rows

- [ ] **Step 3: Spot-check Phase 1 topics**

```bash
rg '^"specs/.*onboarding' docs/superpowers/MANIFEST.csv | head -5
rg 'delete-account' docs/superpowers/MANIFEST.csv
```

Expected: onboarding rows have `topic,"onboarding-aha"`; delete-account rows tagged

- [ ] **Step 4: Commit**

```bash
git add scripts/classify-superpowers-docs.mjs docs/superpowers/MANIFEST.csv
git commit -m "docs: add superpowers MANIFEST generator and initial CSV"
```

---

### Task 2: Superpowers README

**Files:**
- Create: `docs/superpowers/README.md`

- [ ] **Step 1: Write README**

Create `docs/superpowers/README.md` with this content (update counts from MANIFEST after generation):

```markdown
# Superpowers 文档索引

> **不要**默认遍历 `specs/` 全目录。先读 Layer 0，再读相关 topic 终稿。

## 三层模型

```
Layer 0  Canonical     docs/product/PRODUCT-SPEC.md · docs/tech/*
Layer 1  Consolidated   docs/superpowers/topics/*.md
Layer 2  Archive        docs/superpowers/archive/**
         Active         docs/superpowers/specs/ · plans/  （进行中 ADR）
```

## Phase 1 主题（合并目标）

| Topic | 终稿 | Canonical |
|-------|------|-----------|
| onboarding-aha | [topics/onboarding-aha-design.md](./topics/onboarding-aha-design.md) | PRODUCT-SPEC §12 蓝领新人引导 |
| home-dashboard | [topics/home-dashboard-design.md](./topics/home-dashboard-design.md) | PRODUCT-SPEC §2.1 布局 |
| export-pipeline | [topics/export-pipeline-design.md](./topics/export-pipeline-design.md) | [docs/tech/08-export.md](../tech/08-export.md) |
| delete-account | [topics/delete-account-design.md](./topics/delete-account-design.md) | PRODUCT-SPEC § 合规 |
| receipt-sync-lifecycle | [topics/receipt-sync-lifecycle-design.md](./topics/receipt-sync-lifecycle-design.md) | docs/tech/06-* |
| pwa-install | — | **[docs/tech/13-pwa-install-architecture.md](../tech/13-pwa-install-architecture.md)** |

Status: Phase 0 complete · Phase 1 pending · See [MANIFEST.csv](./MANIFEST.csv)

## Agent 读法

| 场景 | 读什么 |
|------|--------|
| 改产品行为 | PRODUCT-SPEC → docs/tech |
| 改主题实现 | `topics/<topic>-design.md` |
| 新功能 | 新建 `specs/YYYY-MM-DD-*-design.md` |
| 考古 | `archive/`（显式要求时） |

## 归档 checklist（feature 完成后）

1. PRODUCT-SPEC §12 ✅
2. supersede 链有唯一现行行为
3. 无 open plan 依赖 active spec 路径
4. 写/更新 `topics/<topic>-design.md` + Decision log
5. `git mv` spec/plan → `archive/`
6. 原路径写 stub（见 design spec §5.2）
7. `rg` 更新引用；更新本 README 状态

**Design:** [specs/2026-07-07-superpowers-doc-consolidation-design.md](./specs/2026-07-07-superpowers-doc-consolidation-design.md)
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/README.md
git commit -m "docs: add superpowers README with three-layer index"
```

---

### Task 3: Stub writer script (used in Phase 1)

**Files:**
- Create: `scripts/superpowers-write-stub.mjs`

- [ ] **Step 1: Create script**

```javascript
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

const depth = activePath.split("/").length - 3; // docs/superpowers/specs/file
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
```

- [ ] **Step 2: Dry-run stub shape**

```bash
node scripts/superpowers-write-stub.mjs \
  /tmp/stub-test.md \
  topics/onboarding-aha-design.md \
  archive/specs/2026-06-14-onboarding-hero-countdown-design.md \
  "Onboarding hero countdown"
cat /tmp/stub-test.md
rm /tmp/stub-test.md
```

Expected: ≤10 lines, `[Archived]` header, two links

- [ ] **Step 3: Commit**

```bash
git add scripts/superpowers-write-stub.mjs
git commit -m "docs: add superpowers archive stub writer script"
```

---

### Task 4: Update product README & AGENTS

**Files:**
- Modify: `docs/product/README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Add superpowers section to docs/product/README.md**

After the Agent/自动化 table, add:

```markdown
## Superpowers 文档（迭代 ADR）

- **索引入口：** [`docs/superpowers/README.md`](../superpowers/README.md) — 三层模型 + 主题终稿
- **勿默认扫** `docs/superpowers/specs/`；改 onboarding / home / export 等先读对应 `topics/*`
- **分类表：** [`docs/superpowers/MANIFEST.csv`](../superpowers/MANIFEST.csv)
```

Demote items 6–7 in the priority table with note: `(legacy path — prefer topics/ or tech/13 after consolidation)`

- [ ] **Step 2: Add to AGENTS.md under Key paths or new subsection**

```markdown
### Superpowers docs

- Index: `docs/superpowers/README.md` (read before scanning `specs/`)
- Topic consolidations: `docs/superpowers/topics/`
- Do **not** iterate all 150+ specs; use MANIFEST.csv or README topic table
```

- [ ] **Step 3: Commit**

```bash
git add docs/product/README.md AGENTS.md
git commit -m "docs: point Agent entry to superpowers README and topics layer"
```

---

### Task 5: Phase 0 verification

- [ ] **Step 1: Count active specs**

```bash
find docs/superpowers/specs -name '*.md' | wc -l
find docs/superpowers/plans -name '*.md' | wc -l
```

Expected: ~151 specs, ~67 plans (unchanged — no moves in Phase 0)

- [ ] **Step 2: Confirm no accidental moves**

```bash
test ! -f docs/superpowers/archive/specs/2026-06-12-new-user-onboarding-design.md && echo OK
```

Expected: `OK`

---

## Phase 1 — One PR per topic

**Shared workflow per topic PR:**

1. Read all listed specs + related code paths; draft `topics/<topic>-design.md` (6-section template from design spec §2.2)
2. For each spec/plan file: `git mv` to `archive/` → run stub script at old path
3. `rg 'docs/superpowers/specs/<basename>'` — update **active** refs only
4. Update `docs/superpowers/README.md` topic row: `Status: consolidated YYYY-MM-DD`
5. Regenerate MANIFEST: `node scripts/classify-superpowers-docs.mjs > docs/superpowers/MANIFEST.csv`
6. Single commit/PR per topic

---

### Task 6: Topic `delete-account` (PR #1)

**Files:**
- Create: `docs/superpowers/topics/delete-account-design.md`
- Move → archive:
  - `specs/2026-06-14-delete-account-full-cleanup-design.md`
  - `specs/2026-06-14-delete-account-cleanup-hardening-design.md`
  - `specs/2026-07-03-delete-account-server-cleanup-design.md`
  - `plans/2026-07-03-delete-account-server-cleanup.md`
- Stubs at original spec/plan paths
- Modify: refs in active docs pointing to above paths

**Canonical:** PRODUCT-SPEC §12 DSR/delete · `docs/legal/privacy.md`

- [ ] **Step 1: Read source specs and code**

```bash
rg -l "deleteAccount|delete-account|DeleteAccount" lib app components --glob '*.ts' --glob '*.tsx' | head -10
```

Read: `app/api/account/delete/route.ts` (or equivalent), settings delete sheet.

- [ ] **Step 2: Write topic doc** — include Decision log:

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-14 | full-cleanup | hardening |
| 2026-06-14 | hardening | server-cleanup |
| 2026-07-03 | server-cleanup | **topic终稿** |

Decisions to capture: local IDB wipe, server cascade, Blob delete, rate limit, 30d DSR SLA link.

- [ ] **Step 3: Archive + stub each file**

```bash
TOPIC=topics/delete-account-design.md
for f in \
  docs/superpowers/specs/2026-06-14-delete-account-full-cleanup-design.md \
  docs/superpowers/specs/2026-06-14-delete-account-cleanup-hardening-design.md \
  docs/superpowers/specs/2026-07-03-delete-account-server-cleanup-design.md; do
  base=$(basename "$f")
  git mv "$f" "docs/superpowers/archive/specs/$base"
  node scripts/superpowers-write-stub.mjs "$f" "$TOPIC" "archive/specs/$base" "Delete account $(echo $base | sed 's/-design.md//')"
done
git mv docs/superpowers/plans/2026-07-03-delete-account-server-cleanup.md docs/superpowers/archive/plans/
# Write plan stub manually (4 lines) at old plan path pointing to topic + archive
```

- [ ] **Step 4: Update references**

```bash
rg 'delete-account-(full-cleanup|cleanup-hardening|server-cleanup)' docs .cursor AGENTS.md --glob '*.md' --glob '*.mdc'
```

Replace active links with `topics/delete-account-design.md` where appropriate.

- [ ] **Step 5: Regenerate MANIFEST + commit**

```bash
node scripts/classify-superpowers-docs.mjs > docs/superpowers/MANIFEST.csv
git add -A
git commit -m "docs: consolidate delete-account specs into topic archive"
```

---

### Task 7: Topic `export-pipeline` (PR #2)

**Specs to archive (11; exclude onboarding sample export — stays in onboarding topic):**

- `2026-06-11-export-optimization-bugfix-design.md`
- `2026-06-12-tax-export-engine-v2-design.md`
- `2026-06-14-export-logic-hardening-design.md`
- `2026-06-15-export-empty-receipts-ux-design.md`
- `2026-06-15-export-empty-tip-ux-design.md`
- `2026-06-19-export-formats-refactor-design.md`
- `2026-06-19-export-pdf-serverless-fix-design.md`
- `2026-06-19-export-share-download-fix-design.md`
- `2026-07-04-export-formats-enhancement-design.md`
- `2026-07-05-export-tax-saved-persist-design.md`

Plus completed plans matching `plans/*export*`.

**Canonical:** `docs/tech/08-export.md` — topic must cross-ref, not duplicate API contract.

- [ ] **Step 1–5:** Same workflow as Task 6; verify `app/api/export/tax-pack/route.ts` matches topic decisions (season gate, formats, filed marking).

---

### Task 8: Topic `onboarding-aha` (PR #3 — largest)

**Specs to archive (20):**

All files matching `docs/superpowers/specs/*onboarding*` and `*aha-moment*` listed in spec §4.

**Plans to archive:**

- `plans/2026-06-13-aha-moment-onboarding.md`
- `plans/2026-06-14-onboarding-*.md` (7 files)

**Keep cross-ref:** `2026-06-14-onboarding-stage-aha-sample-export-design.md` — archive under onboarding topic (export sample is onboarding stage, not export-pipeline).

**Update PRODUCT-SPEC §14:** replace link to `2026-06-12-new-user-onboarding-design.md` → `topics/onboarding-aha-design.md`

- [ ] **Step 1–5:** Same workflow; topic Summary must state Hero Stage 0, sandbox, Aha coach, optional signup, T1/T2 gates from partial-supersede chain.

---

### Task 9: Topic `home-dashboard` (PR #4)

**Include specs:**

- All `*home-*` (12 files from grep)
- Widget specs except founder-specific (Phase 2): `home-widget-pager`, `need-action-widget-slot`, `widget-cover-*` (5 files)
- `2026-06-18-tax-header-hero-card-design.md`

**Exclude (Phase 2 / separate topic):** `founder-*-widget*`, `hide-missing-deductions-widget`

- [ ] **Step 1–5:** Same workflow; align with PRODUCT-SPEC §2.1 fixed chrome + WidgetPager.

---

### Task 10: Topic `receipt-sync-lifecycle` (PR #5)

**Include specs:**

- `2026-06-07-receipt-sync-*` (4 files)
- `2026-06-07-receipt-pipeline-resilience-design.md`
- `2026-06-10-indexeddb-receipt-query-design.md`
- `2026-06-14-receipt-sync-hardening-design.md`
- `2026-06-14-receipt-upload-stuck-fix-design.md`
- `2026-06-19-receipt-lifecycle-sync-redesign-design.md`
- `2026-06-29-receipt-sync-recovery-design.md`
- `2026-06-29-receipt-summary-local-design.md`

**Exclude:** list UI tweaks (`receipt-list-*`, `receipt-detail-*`, duplicate-detection) — keep active unless clearly in supersede chain of lifecycle redesign.

- [ ] **Step 1–5:** Same workflow; canonical refs to `docs/tech/06-receipt-ai-pipeline.md`, `11-ocr-pipeline-design.md`.

---

### Task 11: Topic `pwa-install` (PR #6 — no new topic file)

**Action:** Archive superseded PWA specs; stubs point to **`docs/tech/13-pwa-install-architecture.md`** (not `topics/`).

**Specs to archive (8):**

- `2026-06-10-pwa-cross-browser-install-design.md`
- `2026-06-10-pwa-cross-context-installed-design.md`
- `2026-06-10-pwa-install-prompt-design.md`
- `2026-06-10-pwa-install-ui-modes-design.md`
- `2026-06-10-pwa-manual-install-ack-design.md`
- `2026-06-10-pwa-safari-manual-sheet-dismiss-design.md`
- `2026-06-19-android-pwa-standalone-launch-design.md`
- `2026-07-06-pwa-snaptax-label-app-entry-gate-design.md`

**Stub variant** — use canonical tech path as Current truth:

```markdown
> **Current truth:** [13-pwa-install-architecture.md](../../tech/13-pwa-install-architecture.md)
```

**Update:** `.cursor/rules/snap1099-pwa.mdc`, `docs/product/README.md` item 7, PRODUCT-SPEC §14 — ensure all point to `tech/13`, not archived spec paths.

- [ ] **Step 1–5:** Archive + stub; **do not** create `topics/pwa-install-design.md`.

---

## Phase 2 — Link checker & PRODUCT-SPEC §13

### Task 12: Link check script

**Files:**
- Create: `scripts/check-superpowers-doc-links.mjs`
- Modify: `package.json` (optional script `lint:docs`)

- [ ] **Step 1: Implement checker**

Script logic:
1. List all stubs in `docs/superpowers/specs/` starting with `# [Archived]`
2. For each archived basename, `rg` repo for old path; fail if match in **non-archive, non-stub** files without also mentioning `topics/` or `tech/13`
3. Exit 1 on violations

- [ ] **Step 2: Run after Phase 1**

```bash
node scripts/check-superpowers-doc-links.mjs
```

Expected: exit 0

- [ ] **Step 3: Commit**

```bash
git add scripts/check-superpowers-doc-links.mjs package.json
git commit -m "docs: add superpowers doc link checker"
```

---

### Task 13: PRODUCT-SPEC §13 checklist

**Files:**
- Modify: `docs/product/PRODUCT-SPEC.md` §13

- [ ] **Step 1: Add checklist items**

```markdown
- [ ] 改 onboarding / home / export / delete / receipt sync / PWA 前是否先读 `docs/superpowers/topics/*` 或 `docs/tech/13`？
- [ ] 新 spec 完成后是否更新 topic 终稿或 MANIFEST（见 superpowers README checklist）？
```

- [ ] **Step 2: Update §14 doc index** — replace individual superpowers links with:

```markdown
| [superpowers/README.md](../superpowers/README.md) | 迭代 ADR 索引 + topic 终稿 |
| [superpowers/topics/](../superpowers/topics/) | 主题合并终稿（onboarding, export, …） |
```

- [ ] **Step 3: Commit**

```bash
git add docs/product/PRODUCT-SPEC.md
git commit -m "docs: add superpowers topic layer to Agent checklist and doc index"
```

---

## Phase 3 — Maintenance (ongoing)

- [ ] New feature spec merged → if belongs to existing topic, update topic + Decision log in same PR
- [ ] Quarterly: run `classify-superpowers-docs.mjs`; review `status=consolidate` rows
- [x] Phase 2 backlog: founder widget topic, camera footer chain, navigation/history (PR #114)
- [x] `npm run lint:docs` link checker (Phase 2, PR #112)
- [x] Optional Phase 4 topic merges: **capture-pipeline** ✅ · **settings** ✅ · **compliance-program** ✅ · **landing → onboarding-aha** ✅

---

## Success verification (after Phase 1)

```bash
# Active spec count dropped
find docs/superpowers/specs -name '*.md' ! -exec head -1 {} \; -print 2>/dev/null | wc -l
# Stubs present
rg -l '^\# \[Archived\]' docs/superpowers/specs | wc -l

# Onboarding: one topic file exists
test -f docs/superpowers/topics/onboarding-aha-design.md && echo OK

# Link check
node scripts/check-superpowers-doc-links.mjs

# Agent entry
test -f docs/superpowers/README.md && echo OK
```

**Targets:** active specs ≤ 100; onboarding topic replaces ~20 spec reads; zero broken active refs.

---

## Spec coverage self-review

| Spec section | Plan task |
|--------------|-----------|
| §2 Three-layer model | Task 2 README, Task 0 dirs |
| §3 Merge criteria | Task 5+ checklists in README |
| §4 Phase 1 topics | Tasks 6–11 |
| §5 Archive/stub | Task 3 script, Tasks 6–11 |
| §6 Agent read order | Tasks 2, 4, 13 |
| §7 Phased execution | Phase 0–3 tasks |
| §9 Success metrics | Success verification block |
| §10 Out of scope | Not in plan (correct) |

No TBD placeholders in task steps.
