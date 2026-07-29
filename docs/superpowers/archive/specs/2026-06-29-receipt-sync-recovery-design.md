# 小票同步、1.5 年一致性与云端恢复 — Design

**Date:** 2026-06-29  
**Status:** Approved (design)  
**Phase:** B — after [receipt-summary-local-design](./2026-06-29-receipt-summary-local-design.md) (Phase A)

**References:** [`DB-DESIGN-SPEC.md`](../../tech/DB-DESIGN-SPEC.md) · [`12-local-image-storage-design.md`](../../tech/12-local-image-storage-design.md) · [`2026-06-19-receipt-lifecycle-sync-redesign-design.md`](./2026-06-19-receipt-lifecycle-sync-redesign-design.md) · [`03-api.md`](../../tech/03-api.md)

---

## 1. Problem

1. 手机环境不确定（清缓存、换机、IDB 损坏）导致**本地丢失**；服务端 PostgreSQL + Blob 为 **1.5 年内完整备份**。
2. 本地未丢失时，**非 done** 小票（processing / blurry）可能与服务端 AI 结果不一致。
3. 切应用后台时，Android/Desktop 应继续 upload/OCR；**iOS** 受系统 suspend 限制，不能依赖 hidden flush。
4. `GET /api/receipts?limit=100` 无法拉取 1.5 年全量（单季可达 ~500 张）。
5. CPA / Export 依赖**本地 OPFS 压缩图**；恢复不能只拉 meta。

---

## 2. Goals & non-goals

### Goals

| # | 目标 |
|---|------|
| G1 | **删除不可恢复**：离线/在线删除**成功**（含服务端 DELETE）后，不提供 undo |
| G2 | **本地丢失快速恢复**：自动 + 设置手动「从云端恢复」，拉取 **1.5 年** meta + **re-download 压缩图 → OPFS** |
| G3 | **本地未丢失**：对最近 **50 条非 done** 与服务端对账，不一致以**服务端为准**写本地（`pendingUpload` 仍优先） |
| G4 | **1.5 年最终一致**：服务端保留 1.5 年；本地 idle prune 超 18 个月 receipt + OPFS |
| G5 | **后台 sync**：OCR 在 Web Worker；upload/merge 在 `document.hidden` 时执行，**iOS 除外** |
| G6 | 恢复/对账后触发 Phase A **`rebuildCurrentSeasonSummary`** |

### Non-goals

- 服务端 soft-delete / trash（删除成功即永久）
- 恢复 tombstone 内已删 id（用户 intentional delete）
- Background Sync API（Phase B 用主线程 + 回前台 retry）
- 修改 OCR Path A/B 流水线（已存在）

---

## 3. Locked decisions

| 主题 | 选择 |
|------|------|
| 删除 vs 恢复 | 删除成功 **不可恢复**；恢复仅 **本地丢失** 且服务端仍有行 |
| 恢复触发 | **B**：本地 0 条 + 已登录 → **自动静默**；设置页 **「Restore from cloud」** 手动 |
| 恢复范围 | 1.5 年（18 calendar months from `captured_at` / `timestamp`） |
| 恢复图片 | **必须** download → 客户端压缩规范（1280/q75）→ encrypt → OPFS + photo meta |
| 对账窗口 | 最近 **50** 条，`status !== 'done'`，按 `updatedAt desc` |
| 冲突默认 | **服务端权威**写本地；例外：`pendingUpload=true` 本地行不被远端覆盖（现有 merge） |
| 后台 hidden flush | **C 修订**：Android/Desktop ✅；**iOS ❌**（回前台再 flush） |
| OCR 在 hidden | Web Worker 可继续至 OS suspend；不保证 iOS 完成 |

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Startup / Settings                                         │
│  ├─ detectLocalDataLoss() → auto restore (1.5y)             │
│  └─ manual "Restore from cloud"                             │
├─────────────────────────────────────────────────────────────┤
│  Steady state (local OK)                                    │
│  └─ reconcileNonDoneWindow(50) on idle / foreground         │
├─────────────────────────────────────────────────────────────┤
│  Background (non-iOS, document.hidden)                      │
│  ├─ flushPendingUploads / mergeServerReceipts               │
│  └─ OCR Worker (all platforms, best-effort)                 │
├─────────────────────────────────────────────────────────────┤
│  Retention (idle)                                           │
│  ├─ prune receipts + OPFS > 18 months                       │
│  └─ 90d OPFS full purge (existing)                          │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
   IndexedDB + OPFS              PostgreSQL + Vercel Blob
   (working set 1.5y)            (authoritative backup 1.5y)
```

---

## 5. Local data loss detection

| 条件 | 动作 |
|------|------|
| `loadAllReceipts().length === 0` 且 actor 已登录 / 有 Ghost 历史 | **自动 restore**（一次 per session，写 `system_meta.cloud_restore_attempted`） |
| 用户点击 Settings **Restore from cloud** | 强制 restore（可显示进度） |
| 本地有数据 | 不自动 restore；走 §6 对账 |

**不恢复：** `deleted_receipt_ids` 中且服务端已 404 的 id；在线删除成功过的 id。

---

## 6. Cloud restore pipeline

### 6.1 New API（必须）

```
GET /api/receipts/sync?since=<ISO8601>&cursor=<opaque>&limit=50
```

| 参数 | 说明 |
|------|------|
| `since` | 默认 now − 18 months UTC |
| `cursor` | keyset pagination（`updatedAt` + `id`） |
| `limit` | max 50 per page |

Response:

```typescript
{
  receipts: SerializedReceipt[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

Auth：现有 Ghost / Google actor；`receiptWhereForActor`。

**不**返回 Blob bytes；图片走 §6.3。

### 6.2 Meta merge

- 分页 loop 直到 `hasMore=false`
- 每页：`unionMergeLWW` 规则，**pendingUpload 优先**；新 restore 行 `pendingUpload=false`
- 不 resurrect tombstone 且服务端 DELETE 的 id

### 6.3 Image re-download

对 `hasRemoteImage=true` 且本地无 OPFS full（或 restore 强制）：

```
GET /api/receipts/:id/image → signed URL
  → fetch blob
  → compressReceiptImage (1280/q75) if needed
  → savePhotoCompressed → OPFS + snaptax_receipt_photos meta
  → markRemoteSyncedPhotos
```

- 并发：≤3 并行 download（可配置），避免阻塞 UI
- 目标量级：单季 ≤500 张；分批 + 进度（Settings restore UI）
- 失败：标记 `photoMissing`，列表 thumb 占位；用户可 ↻ 重试

### 6.4 Post-restore

- `rebuildCurrentSeasonSummary()`
- Toast / Settings：「Restored N receipts」

---

## 7. Non-done reconcile (50 window)

**Trigger：** app foreground + online + idle（≥30s）；非 WorkerSession active（相机未开）。

**Algorithm：**

1. Local：`queryByStatus` 排除 done，或 filter `status !== 'done'`，sort `updatedAt desc`，take **50**
2. Server：`POST /api/receipts/reconcile` body `{ ids: string[] }` **或** 扩展现有 GET bulk（实现选型见 plan）
3. For each id：若本地 `pendingUpload` → skip
4. Else if server row newer / field diff on status, amount, taxAmount, merchant, category → **write local from server**
5. `rebuildCurrentSeasonSummary()` if any write

**Done 行：** 不在此窗口；done 一致性靠 upload 成功 + merge list + export filed PATCH。

---

## 8. Background sync (hidden flush)

| 平台 | `document.hidden` 行为 |
|------|------------------------|
| Android PWA / Desktop | `flushPendingUploads`, `flushPendingDeletes`, `mergeServerReceiptsIntoLocal`（limited） |
| **iOS Safari / iOS PWA** | **不** hidden flush；仅 OCR Worker best-effort |
| 全平台 foreground | 现有 deferred startup + 60s retry |

Detection：`lib/client/platform/isIos.ts`（或现有 UA / `navigator.userAgent` + `standalone` 启发式）。

**ProcessingReceiptWatcher：** hidden 时仍 **pause**（UI poll）；upload/merge 与 watcher 分离。

---

## 9. 1.5 year retention

| 层 | 规则 |
|----|------|
| Server PG + Blob | 保留 **≥18 months**（运维/job；MVP 可不 prune server） |
| Local IDB | idle `pruneReceiptsOlderThan(18mo)`：receipt + photo meta + OPFS dir |
| Local OPFS full | 已同步 **90 天** purge full 留 thumb（现有） |
| Tombstones | prune 时删除 >18mo 的 deleted_receipt_ids 条目 |

Prune **不**阻塞首屏；`requestIdleCallback` + startup delay ≥30s。

---

## 10. Module boundaries (new / adapt)

| 模块 | 职责 |
|------|------|
| `lib/client/localDataLoss.ts` | detect + auto restore gate |
| `lib/client/cloudRestoreFlow.ts` | paginated restore + image queue |
| `lib/client/reconcileNonDoneWindow.ts` | 50-row reconcile |
| `lib/client/backgroundSyncGate.ts` | hidden flush + iOS guard |
| `lib/client/receiptRetention.ts` | 18mo prune（扩展现有 photo retention job 编排） |
| `app/api/receipts/sync/route.ts` | paginated sync API |
| `components/settings/RestoreFromCloudSection.tsx` | 手动恢复 + 进度 |

Adapt：`HomeScreen`, `receiptSyncOrchestrator`, `receiptDeleteFlow`（prune 不删 pendingUpload）。

---

## 11. OCR / 省税（优化 2）

**不实现。** 已有：

- Client：`scheduleOcrJob` → Tesseract Worker → `ocrDraft`
- Server：`routeStandardReceiptTax` Path A/B

Phase B 仅保证 restore 后 re-upload 仍带 `ocrDraft`（若本地有）；restore 从 server 拉 meta 已含 `taxAmount` 时无需重跑 OCR。

---

## 12. Testing

| 测试 | 断言 |
|------|------|
| `cloudRestoreFlow.test.ts` | 分页 merge；tombstone 不复活 |
| `reconcileNonDoneWindow.test.ts` | pendingUpload skip；server wins |
| `backgroundSyncGate.test.ts` | iOS hidden → no flush |
| `receiptRetention.test.ts` | 18mo prune；pendingUpload 保留 |
| API integration | sync cursor 无重复/遗漏 |

---

## 13. Acceptance

1. 清 IDB + 登录 → 自动 restore 1.5y 内服务端小票；OPFS 有压缩图；Export 不依赖实时 signed URL。
2. Settings「Restore from cloud」可手动触发；显示 N/M 进度。
3. 在线删除成功的小票 **不会**被 restore 带回。
4. 本地有数据时，processing 行与服务端不一致 → idle 对账后本地更新。
5. Android hidden 时 pending upload 继续；iOS hidden **无** upload network（DevTools 可验证）。
6. 18mo+ 本地 receipt idle prune；服务端仍可查（若未做 server prune）。

---

## 14. Relationship to lifecycle redesign draft

[2026-06-19-receipt-lifecycle-sync-redesign-design.md](./2026-06-19-receipt-lifecycle-sync-redesign-design.md) 仍为 **Draft**。本 spec **锁定**：

- 50 非 done 对账窗口（与其 C6 50-row 部分对齐）
- 18mo retention（C3）
- 服务端权威 + 本地 1.5y working set（用户 grilling 结论）

**未采纳**（除非后续单独立项）：done lock 禁止 merge 覆盖、export 纯 local-first 不读 server PG、write budget 3。

---

## 15. Related

- Phase A：[2026-06-29-receipt-summary-local-design.md](./2026-06-29-receipt-summary-local-design.md)
