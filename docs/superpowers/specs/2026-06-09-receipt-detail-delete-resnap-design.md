# Receipt Detail DELETE / RESNAP — Design

**Date:** 2026-06-09  
**Status:** Implemented  
**References:** processing detail mockup (ORIGINAL RECEIPT CAPTURE overlay), `docs/prd/resnap.detail.md`  
**Related:** [`2026-06-07-receipt-detail-zoom-design.md`](./2026-06-07-receipt-detail-zoom-design.md)

## Problem

用户点进小票详情后，processing / blurry 态无法当场删图或重拍；done 态无法删除错误入账小票。blurry 的 RESNAP 仅在 Sheet 顶部黄条，与参考图「预览区叠加操作钮」不一致。

## Approved decisions

| 主题 | 选择 |
|------|------|
| processing / blurry | **DELETE + RESNAP**（预览区叠加红圆钮） |
| done | **仅 DELETE**（无 RESNAP，避免误触重算） |
| UI | 预览区 overlay（对齐参考图） |
| DELETE 确认 | processing/blurry **即时**；done **Bottom Sheet 确认** |
| blurry 顶部黄 RESNAP | **移除**，统一到预览区 |
| 列表卡片 blurry RESNAP | **保留**（快捷入口） |

---

## UI

### processing / blurry

```
ORIGINAL RECEIPT CAPTURE
┌─────────────────────────────┐
│     receipt preview         │
│   [DELETE]    [RESNAP]      │  ← overlay, homeVisual.reviewControl
│              TAP TO ZOOM ↘  │
└─────────────────────────────┘
```

- 按钮 `e.stopPropagation()`，不触发 zoom
- zoom：点图片非按钮区域
- 触控 ≥ 56px（`h-14 w-14`）

### done

- 同上区域，**仅 DELETE**（单钮，居中或偏左）
- 点 DELETE → `ReceiptDeleteConfirmSheet`

### Done 确认 Sheet

```
Delete this receipt?
This removes it from your deductions.

[ Cancel ]    [ Delete ]
```

- 样式对齐 Bottom Sheet 惯例（`LegalSheet` 结构）
- Delete  destructive 红系按钮

---

## State × Actions

| 状态 | DELETE | RESNAP | DELETE 确认 |
|------|--------|--------|-------------|
| processing | ✓ | ✓ | 即时 |
| blurry | ✓ | ✓ | 即时 |
| done | ✓ | ✗ | Sheet |

---

## Data flow

```typescript
// HomeScreen — new
handleDeleteReceipt(id: string): Promise<void>
  1. watcher.unwatch(id); queue.onSettled(id)
  2. deleteStoredReceipt(id)
  3. if online: deleteReceiptRemote(id) // 404 OK
  4. setReceipts filter; refreshTaxSaved; clear syncStuck
  5. setSelectedReceipt(null)

// ReceiptDetailSheet
onDelete → processing/blurry: await onDeleteReceipt; onClose()
         → done: setShowDeleteConfirm(true)

onResnap → onClose(); onResnap(id)  // unchanged
```

- processing 删除：中断上传/分析队列
- 离线：删 IDB；remote best-effort when online
- 失败：Sheet 内或底部非阻塞红字，无 Modal

---

## Components

| 文件 | 动作 |
|------|------|
| `components/receipts/ReceiptCaptureActions.tsx` | **新建** DELETE + optional RESNAP |
| `components/receipts/ReceiptDeleteConfirmSheet.tsx` | **新建** done 确认 |
| `components/receipts/ReceiptCaptureSection.tsx` | overlay slot + `showResnap` |
| `components/receipts/ReceiptDetailSheet.tsx` | 接线；删 blurry 顶栏 RESNAP |
| `components/home/HomeScreen.tsx` | `handleDeleteReceipt` + prop |

**不改：** batch `ReceiptReviewControls`、连拍 postReview 流程。

---

## Out of scope

- 列表左滑删除
- done 态 RESNAP / 重新 Vision 分析
- 删除 Undo toast

---

## Acceptance

1. processing 详情：预览 overlay 有 DELETE + RESNAP；DELETE 即时删并关 Sheet
2. blurry 详情：同上；无顶部黄 RESNAP
3. done 详情：仅 DELETE；Sheet 确认后删
4. RESNAP → single 相机替换（现有 `handleResnap`）
5. zoom 仍可用（非按钮区域）
6. 删 done 小票后 Tax Saved 更新
7. `npx next build` 通过
