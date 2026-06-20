# Receipt Duplicate Detection — Design

**Date:** 2026-06-17  
**Status:** Approved (design)  
**Scope:** 同一张小票扫描两次 → **识别并提醒用户**；本地 exact 拦截 + 服务端 dedup 兜底 + UX 加强  
**Product constraints:** 核心拍照零 Modal；黑/白/黄视觉；热区 ≥64px  

**Related:**

- 服务端去重（已实现）：`lib/receipts/receiptUploadService.ts`、`lib/receipts/imageFingerprint.ts`
- 客户端 409 reconcile（已实现）：`lib/client/reconcileDuplicateReceipt.ts`、`components/home/HomeScreen.tsx`
- 产品规范：`docs/product/PRODUCT-SPEC.md`

---

## Summary

用户可能误将同一张物理小票拍两次。当前系统**仅在上传完成后**通过服务端 `content_sha256` / dHash 返回 409，客户端 merge 并显示 4 秒黄条。缺口：拍照瞬间会新增重复列表行；离线无法检测；提醒不滚动、不高亮已有条目。

本 spec 采用 **双层检测**：

1. **Layer 1（拍照瞬间，本地 exact SHA256）** — 压缩后与 IDB 已有 receipt 比对，命中则**不新增行**，立即提醒并高亮已有条目。
2. **Layer 2（上传，服务端 exact + similar）** — 保留现有 409 逻辑，加强文案区分与高亮行为。

**MVP 明确不做：** 本地 similar（dHash）匹配 — 留给服务端；重复检测 Modal；跨设备本地预判。

---

## Problem statement

| 现象 | 根因 |
|------|------|
| 连扫两次出现两条 `Scanning` / `UPLOADING` | `handleCapture` 每次 `randomUUID()`，无本地 fingerprint |
| 离线重复小票无法提醒 | `StoredReceipt` 无 `contentSha256`，IDB 无索引 |
| 用户未感知「已存在」 | 黄条在 Trust Bar 下，无 scroll / 行高亮 |
| 换角度同一张小票 | 压缩后 bytes 不同 → 仅服务端 similar 可捕 |

---

## Approved decisions

| # | 决策 | 结论 |
|---|------|------|
| 1 | 本地 vs 服务端分工 | **本地仅 exact SHA256**；**similar 仅服务端** |
| 2 | 重复时列表行为 | **不新增行**；upload 409 仍 merge 到已有条目 |
| 3 | 提醒时机 | **拍照瞬间 + 上传兜底**（用户已确认） |
| 4 | UI 形式 | 黄条 + 已有条目 pulse 高亮 + scrollIntoView；**零 Modal** |

---

## Architecture

```text
                    ┌─────────────────────────────────────┐
                    │           User snaps photo           │
                    └─────────────────┬───────────────────┘
                                      │
                    compressReceiptImage (same as upload)
                                      │
                    contentSha256 (Web Crypto, browser)
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
        local exact match                              no match
     (IDB contentSha256 index)                              │
              │                                               │
    ┌─────────▼─────────┐                         ┌───────────▼──────────┐
    │ Notice + highlight │                         │ savePhoto + saveReceipt │
    │ scroll to existing │                         │ store contentSha256     │
    │ NO new list row    │                         │ OCR + upload queue      │
    └────────────────────┘                         └───────────┬──────────┘
                                                                 │
                                                    POST /api/receipts
                                                                 │
                              ┌──────────────────────────────────┴────────────────────┐
                              │                                                   │
                         201 created                                          409 DUPLICATE
                              │                                                   │
                         normal merge                              reconcileDuplicateReceipt
                                                                    + notice (exact/similar copy)
                                                                    + highlight existing row
```

---

## Layer 1 — Local exact dedup (capture time)

### Fingerprint algorithm

- **Input:** JPEG bytes from `compressReceiptImage` — **必须与上传 FormData 中 `file` 字节一致**。
- **Algorithm:** SHA-256 hex lowercase，与 `lib/receipts/imageFingerprint.ts` 中 Node `contentSha256` 同结果。
- **Implementation:** 新增 `lib/receipts/clientContentSha256.ts`（浏览器 `crypto.subtle.digest`）；单测与 Node 版交叉验证同一 fixture。

### When to compute

在 `savePhoto`（或等价单一入口）压缩完成后、加密写入 OPFS/IDB **之前**：

```ts
const { blob, contentSha256 } = await compressAndFingerprint(file);
```

### Local lookup

- 新增 `findLocalDuplicateBySha(receipts, sha, excludeId?)` 纯函数。
- 查询范围：当前 Ghost/User 下 **未 filed** 的本地 receipt（与 `loadTopByUpdatedAt` / unfiled 语义一致）。
- **Resnap：** `excludeId === replaceId`，避免替换自身误判。
- **Onboarding demo：** `isOnboardingDemo` 条目不参与查重、也不作为 match 目标。

### On duplicate (capture)

1. **不**调用 `savePhoto` / `saveReceipt` / `scheduleOcrJob`。
2. 调用 `showDuplicateNotice({ existingReceiptId, matchType: "exact" })`：
   - 设置黄条文案（exact copy）
   - `highlightReceiptId` state → 列表行 2s 黄色边框 pulse
   - `scrollIntoView({ block: "center" })` 已有条目
3. Batch 模式：`onBatchShot` / `handleBatchShot` 同样走 compress → hash → 查重；命中则**不**加入 session thumbs。

### On success (new receipt)

- `StoredReceipt.contentSha256 = sha` 持久化到 IDB。
- IDB 新增索引 `contentSha256`（**非 unique** — legacy 行可为空）。

---

## Layer 2 — Server dedup (upload time)

**不变：** `findExactDuplicate` → 409 `matchType: exact`；`findSimilarDuplicate` → 409 `matchType: similar`。

**加强客户端：**

| `matchType` | 黄条文案 (en-US) |
|-------------|------------------|
| `exact` | `This receipt is already in your list.`（现有） |
| `similar` | `This looks like a receipt you already snapped.`（新增） |

`handleDuplicateUpload` / upload catch 路径在 reconcile 后同样触发 highlight + scroll（与 Layer 1 共用 helper）。

---

## Data model

### StoredReceipt

```ts
// lib/types.ts or StoredReceipt extension
contentSha256?: string; // hex, set after first successful compress+save
```

### IndexedDB

- Store: `receipts`（现有）
- 新索引: `contentSha256` on `contentSha256` field
- Upgrade: 在 `receiptDb` open/version bump 中 `createIndex`；已有 `ConstraintError` 防护模式沿用

### Legacy backfill (non-blocking)

- 无 `contentSha256` 的旧 receipt：**不阻塞** Layer 1 MVP。
- 可选 follow-up：upload 前或 lazy migration 从 OPFS 读压缩图算 hash 写回（Out of scope for MVP implementation plan item 1）。

---

## UX specification

### Notice banner

- 位置：现有 `receiptNotice` 区域（Trust Bar 上方），黄底黑边，4s 自动消失。
- `role="status"` 保留。

### List row highlight

- 目标行：`ring-2 ring-yellow-500` + 可选 `animate-pulse` 2s
- 不影响 `active:scale-95` 点击反馈
- state: `highlightReceiptId: string | null`，timeout 清除

### Zero Modal

- 重复检测**不得**打开 Sheet / Dialog / 阻断相机 overlay（除现有相机权限等系统层）。

---

## Edge cases

| Scenario | Expected behavior |
|----------|-------------------|
| 离线连扫同一张 | Layer 1 拦截 |
| 第一次还在 uploading，再扫同图 | Layer 1 拦截（hash 已写入第一条） |
| 换角度 / 不同裁剪同小票 | Layer 1 可能漏；Layer 2 similar 409 + similar 文案 |
| 另一设备已上传同图 | 仅 Layer 2（本地无该 hash） |
| Resnap 同 ID 换图 | exclude self；新图 hash 不同则正常替换 |
| Batch 多张含一张重复 | 仅重复那张拦截，其余正常 |
| P2002 竞态无 `existingReceiptId` | 保留现有 `resolveUniqueConflictUpload` 兜底 |

---

## Files to touch (implementation hint)

| Area | Files |
|------|-------|
| Browser SHA256 | `lib/receipts/clientContentSha256.ts`, test |
| Local lookup | `lib/receipts/localDuplicate.ts`, test |
| IDB schema | `lib/storage/receiptDb.ts`, `lib/types.ts` |
| Photo pipeline | `lib/storage/crypto/photoStore.ts` or `savePhoto` wrapper |
| Home capture | `components/home/HomeScreen.tsx`, `SnapButton.tsx` (batch) |
| Upload UX | `handleDuplicateUpload`, shared `useDuplicateNotice` or helper |
| i18n | `lib/i18n/locales/en-US.ts` — `duplicateReceiptSimilar` |
| Offline shell | `OfflineHomeShell.tsx` — same capture dedup path |

---

## Testing

| Test | Assert |
|------|--------|
| `clientContentSha256` vs Node `contentSha256` | 同一 `Buffer`/fixture → 相同 hex |
| `findLocalDuplicateBySha` | 命中 / excludeId / demo 排除 |
| Capture integration (unit or component) | 重复 file → 列表长度不变，notice 文案，highlight id |
| Upload 409 similar | `duplicateReceiptSimilar` 文案 + reconcile |

---

## Out of scope

- 本地 dHash / similar 匹配
- 重复小票「仍要添加」强制入口
- 跨 Ghost 账户 dedup
- Event Store / sync 层 duplicate 事件（Phase 2 lifecycle）

---

## Success criteria

1. 同一张 JPEG **连扫两次**（在线或离线）：列表始终只有 **一条**，第二次出现黄条 + 高亮已有行。
2. 上传阶段 exact/similar 409 仍 merge，且用户看到对应文案与高亮。
3. 核心 Snap 流程无 Modal；符合 PRODUCT-SPEC 两页结构。
4. 单元测试覆盖 browser/Node SHA256 一致性与 local lookup。
