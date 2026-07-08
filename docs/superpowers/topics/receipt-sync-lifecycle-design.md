# Receipt Sync & Lifecycle — Topic Design

**Topic ID:** `receipt-sync-lifecycle`  
**Status:** Consolidated · implemented (Phase A/B shipped; lifecycle redesign draft partially deferred)  
**Last verified:** 2026-07-08

---

## 1. Summary

Snap1099 小票生命周期分三层：**AI 状态**（`processing` | `done` | `blurry`）、**同步面**（`pendingUpload`、write budget、merge window、tombstone delete）、**报税面**（`taxSeason` / `taxSeasonDate` filed 标记 + `snaptax_receipts_summary` 聚合）。

**本地优先：** Phase 0 从 IndexedDB 即时渲染（30 unfiled 热加载 → top 100 UI）；Phase 2 延迟 merge 服务端 top 100。Ghost 注册幂等；空 remote **永不**删本地。单票 write budget（默认 **5**）统一 upload + `/process`；用尽 → `syncStuck` + Tap to Retry。Orchestrator 移除 window prune，watcher 改单票 `GET /api/receipts/:id`。

**Phase A（summary）：** `snaptax_receipts_summary` 维护当前税季 `unfiledTaxSaved` / `totalReceiptCount`；写路径 delta + idle watermark rebuild。

**Phase B（recovery）：** 本地丢失 → 分页 `GET /api/receipts/sync` + OPFS 重下压缩图；稳态 idle 对账最近 50 条非 `done`；18 月 idle prune；Android/Desktop hidden flush（iOS 除外）。

**Deferred（lifecycle redesign draft，未 ship）：** WorkerSession 门控、budget 3、UI/sync window 50、done 业务字段锁、export 纯 local-first 不读 server PG、Event Queue / `POST /api/sync/events`。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | 离线拍照、Est. Tax Saved、Export filed |
| [`docs/tech/06-receipt-ai-pipeline.md`](../../tech/06-receipt-ai-pipeline.md) | AI 状态机、poll/watcher、budget |
| [`docs/tech/11-ocr-pipeline-design.md`](../../tech/11-ocr-pipeline-design.md) | OCR Path A/B；§16 第二阶段 sync 路线图 |
| [`docs/tech/DB-DESIGN-SPEC.md`](../../tech/DB-DESIGN-SPEC.md) §2.2 | IDB stores `snaptax_*`、summary store |
| [`docs/tech/12-local-image-storage-design.md`](../../tech/12-local-image-storage-design.md) | OPFS 压缩图、90d full purge、18mo prune |
| [`docs/tech/03-api.md`](../../tech/03-api.md) | Receipt CRUD、sync/reconcile API |
| [`lib/storage/receiptDb.ts`](../../../lib/storage/receiptDb.ts) | IDB schema、queries、write hooks |
| [`lib/client/receiptSyncOrchestrator.ts`](../../../lib/client/receiptSyncOrchestrator.ts) | merge + persist + top-100 visible |
| [`lib/client/receiptSyncBudget.ts`](../../../lib/client/receiptSyncBudget.ts) | `MAX_WRITE_BUDGET = 5` |
| [`lib/storage/receiptSummary.ts`](../../../lib/storage/receiptSummary.ts) | Season summary delta/rebuild |
| [`lib/client/cloudRestoreFlow.ts`](../../../lib/client/cloudRestoreFlow.ts) | 1.5y cloud restore |
| [`lib/client/reconcileNonDoneWindow.ts`](../../../lib/client/reconcileNonDoneWindow.ts) | 50-row non-done reconcile |
| [`lib/client/receiptRetention.ts`](../../../lib/client/receiptRetention.ts) | 18-month idle prune |
| [`lib/receipts/filedStatus.ts`](../../../lib/receipts/filedStatus.ts) | `isReceiptFiled` |

---

## 3. Decisions

### 3.1 AI status lifecycle

```text
processing ──Vision OK──► done
         └──Vision fail──► blurry
         └──Vision error──► processing (retry via POST /process)

blurry ──resnap──► processing
```

| Decision | Detail |
|----------|--------|
| **Upload 韧性** | Vision 失败仍 **201** `{ status: "processing", processFailed: true }`；Blob + DB 已持久化 |
| **`/process` 重试** | 200 processing on Vision fail；poll 超时自动触发一次 `/process` |
| **Mount / online** | `flushPendingUploads` on mount when online；60s interval pending retry |
| **Resume** | `resumeProcessingReceipts` after hydrate + sync |

Server: Blob **before** DB on upload（避免 orphan row）。

### 3.2 Sync worker & write budget

| Decision | Detail |
|----------|--------|
| **Budget scope** | Upload `POST /receipts` + analysis `POST /process` 共用 **`writeBudgetRemaining`**（默认 **5**） |
| **Free ops** | `GET /api/receipts` poll、manual header ↻ list sync |
| **Exhaustion** | `syncStuck` → Tap to Retry resets budget → immediate retry |
| **Watcher** | Single active id FIFO；pause on camera/sheet/settings/hidden |
| **Poll upgrade** | Active id via **`GET /api/receipts/:id`**（404 → unwatch）；settle 后 one list GET for tax header |
| **Photo missing** | `loadPhoto` null/error → `photoMissing` + budget 0 → **Tap to resnap**（not retry upload） |

**Modules:** `processingReceiptWatcher.ts` · `receiptApi.ts` · `receiptUploadFlow.ts` · `HomeScreen.tsx`

### 3.3 Ghost reconcile & safe merge

| Decision | Detail |
|----------|--------|
| **Ghost register** | Idempotent — reuse valid cookie; mint only when missing/expired |
| **Empty remote** | **Never** delete local synced rows |
| **User actor prune** | Only when `actor.kind === "user"` **and** `remote.length > 0` — delete local ids ∉ remote (not pendingUpload) |
| **Ghost actor** | No sync-driven delete |
| **Post-login** | `flushPendingUploads` → `syncFromServer(immediate)` → optional `pollTaxRecalc` |
| **Persist merge** | Upsert all merged rows to IndexedDB after successful fetch |

**Deletion convergence (hardening):** tombstones + `flushPendingDeletes` only — **no** top-100 window prune.

### 3.4 Sliding window & IndexedDB queries

| Constant | Value | Use |
|----------|-------|-----|
| `STARTUP_UNFILED_LIMIT` | 30 | Phase 0-fast first paint (unfiled only) |
| `UI_RECEIPT_LIMIT` | **100** | UI list + server merge fetch |
| `RECEIPT_SYNC_LIMIT` | 100 | alias for API `limit` |

| Decision | Detail |
|----------|--------|
| **Retention model** | Full IDB corpus — no sliding delete on sync |
| **Merge** | `unionMergeLWW` — `pendingUpload` local wins; LWW on `updatedAtMs` |
| **Indexes** | `byUpdatedAt`, `byFiledUpdatedAt`, `byFiledStatus`, etc. (IDB v2+) |
| **Outside window** | Rows stay in IDB; not re-fetched from server until updated |

### 3.5 Filed & summary rules

**Filed:** `taxSeason` **and** `taxSeasonDate` both set (`isReceiptFiled`).

| Metric | Rule |
|--------|------|
| **Est. Tax Saved (UI)** | `snaptax_receipts_summary.unfiledTaxSaved` — current season, `done` & unfiled |
| **Settings receiptCount** | `totalReceiptCount` — all statuses in current tax year (not UI 100 window) |
| **Export filed write** | Server `updateMany` on export success — see [`export-pipeline-design.md`](./export-pipeline-design.md) |
| **Summary hooks** | `saveReceipt` / `deleteReceipt` / `persistMergedReceipts` / export filed batch |
| **Verify** | Idle watermark ≥30s → `rebuildCurrentSeasonSummary()` if drift |

**Note:** Export filed 标记 **不减少** UI 中 done 张数；仅 `unfiledTaxSaved` 扣减（与 export topic 一致）。

### 3.6 Cloud restore & recovery (Phase B)

| Trigger | Action |
|---------|--------|
| Local 0 rows + signed in | Auto silent restore (once per session) |
| Settings **Restore from cloud** | Manual paginated restore + progress |
| Steady state | `reconcileNonDoneWindow(50)` on foreground idle |

**Restore pipeline:** `GET /api/receipts/sync?since=&cursor=&limit=50` → merge (pendingUpload wins) → re-download images → OPFS 1280/q75 → `rebuildCurrentSeasonSummary()`.

**Non-done reconcile:** Server authoritative unless `pendingUpload=true`.

**Background:** Android/Desktop `document.hidden` may flush upload/merge; **iOS excluded**.

**Retention:** Local idle prune receipts + OPFS > **18 months**; synced full image purge > **90 days** (keep thumb).

### 3.7 Startup phases

```text
Phase 0-fast: loadRecentUnfiled(30) + sum from summary → render (no network)
Phase 0-full: loadTopByUpdatedAt(100) → expand list
Phase 2:      ghost + flush + fetchReceiptList(100) → orchestrator merge → watcher bootstrap
Phase 3 idle: summary verify · retention prune · photo 90d purge (≥30s delay)
```

Camera open → defer merge (existing); **not** full WorkerSession gate (deferred).

---

## 4. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-07 | `receipt-sliding-window-sync-design` | indexeddb-receipt-query (window/tax rules) + hardening (no prune) |
| 2026-06-07 | `receipt-sync-budget-design` | **this topic** (budget **5** shipped; draft 3 not adopted) |
| 2026-06-07 | `receipt-sync-ghost-reconcile-design` | **this topic** |
| 2026-06-07 | `receipt-pipeline-resilience-design` | **this topic** + `06-receipt-ai-pipeline` |
| 2026-06-10 | `indexeddb-receipt-query-design` | summary-local (header reads) + **this topic** |
| 2026-06-14 | `receipt-sync-hardening-design` | **this topic** |
| 2026-06-14 | `receipt-upload-stuck-fix-design` | **this topic** |
| 2026-06-19 | `receipt-lifecycle-sync-redesign-design` | **Draft** — WorkerSession/done lock/window 50/local export deferred; retention/reconcile concepts → sync-recovery |
| 2026-06-29 | `receipt-summary-local-design` | **this topic** (Phase A) |
| 2026-06-29 | `receipt-sync-recovery-design` | **this topic** (Phase B) |

**Partial supersede:** [`topics/settings-design.md`](./settings-design.md) §6 — alignment logic active; summary store replaces scan-based header.

---

## 5. Out of scope

- Receipt **list/detail UI** tweaks (`receipt-list-*`, `receipt-detail-*`, duplicate-detection) — stay active specs
- Event Queue / `POST /api/sync/events` / Postgres Event Store — Phase 2 OCR roadmap §16
- WorkerSession full gate — lifecycle redesign draft only
- Export pack generation — [`export-pipeline-design.md`](./export-pipeline-design.md)
- Server-side orphan ghost merge job

---

## 6. Archive index

| File | Role |
|------|------|
| [`archive/specs/2026-06-07-receipt-sync-budget-design.md`](../archive/specs/2026-06-07-receipt-sync-budget-design.md) | Write budget 5, syncStuck, header ↻ |
| [`archive/specs/2026-06-07-receipt-sync-ghost-reconcile-design.md`](../archive/specs/2026-06-07-receipt-sync-ghost-reconcile-design.md) | Idempotent ghost, safe reconcile |
| [`archive/specs/2026-06-07-receipt-sliding-window-sync-design.md`](../archive/specs/2026-06-07-receipt-sliding-window-sync-design.md) | Local-first, 100 window, LWW |
| [`archive/specs/2026-06-07-receipt-pipeline-resilience-design.md`](../archive/specs/2026-06-07-receipt-pipeline-resilience-design.md) | 201 on Vision fail, client `/process` |
| [`archive/specs/2026-06-10-indexeddb-receipt-query-design.md`](../archive/specs/2026-06-10-indexeddb-receipt-query-design.md) | IDB v2 indexes, filed filter |
| [`archive/specs/2026-06-14-receipt-sync-hardening-design.md`](../archive/specs/2026-06-14-receipt-sync-hardening-design.md) | Remove window prune, orchestrator |
| [`archive/specs/2026-06-14-receipt-upload-stuck-fix-design.md`](../archive/specs/2026-06-14-receipt-upload-stuck-fix-design.md) | photoMissing, Blob-before-DB |
| [`archive/specs/2026-06-19-receipt-lifecycle-sync-redesign-design.md`](../archive/specs/2026-06-19-receipt-lifecycle-sync-redesign-design.md) | Draft — deferred WorkerSession/done lock |
| [`archive/specs/2026-06-29-receipt-summary-local-design.md`](../archive/specs/2026-06-29-receipt-summary-local-design.md) | `snaptax_receipts_summary` Phase A |
| [`archive/specs/2026-06-29-receipt-sync-recovery-design.md`](../archive/specs/2026-06-29-receipt-sync-recovery-design.md) | Cloud restore, reconcile, retention Phase B |

---

## 7. Implemented plans

| Plan | Status |
|------|--------|
| [`archive/plans/2026-06-07-receipt-sync-budget.md`](../archive/plans/2026-06-07-receipt-sync-budget.md) | Done |
| [`archive/plans/2026-06-07-receipt-sync-ghost-reconcile.md`](../archive/plans/2026-06-07-receipt-sync-ghost-reconcile.md) | Done |
| [`archive/plans/2026-06-07-receipt-sliding-window-sync.md`](../archive/plans/2026-06-07-receipt-sliding-window-sync.md) | Done |
| [`archive/plans/2026-06-10-indexeddb-receipt-query.md`](../archive/plans/2026-06-10-indexeddb-receipt-query.md) | Done |
| [`archive/plans/2026-06-29-receipt-summary-local.md`](../archive/plans/2026-06-29-receipt-summary-local.md) | Done |
| [`archive/plans/2026-06-29-receipt-sync-recovery.md`](../archive/plans/2026-06-29-receipt-sync-recovery.md) | Done |
