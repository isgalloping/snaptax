# 主界面布局 rebalance — Snap 缩小 · Receipt 全量滚动

**日期：** 2026-06-07  
**状态：** 已批准  
**影响：** `HomeScreen` · `SnapButton` · `ReceiptList` · `docs/ui/ui.html` · PRODUCT-SPEC §3

---

## 背景

主界面 Snap 拍照区占用过大（`SnapButton` 使用 `flex-1` + `max-w-sm` 正方形），Recent Receipts 被限制在 `max-h-[35vh]` 且仅渲染 3 条，下拉查看历史小票体验差。

## 已确认决策

| 决策点 | 选择 |
|--------|------|
| Snap 按钮形态 | **A** — 保持大正方形黄色 CTA，仅缩小尺寸与占用高度 |
| Recent Receipts | **A3** — 占满 Snap 区以下全部剩余空间，显示全部小票、列表内滚动 |
| 实现方案 | **固定 Snap 区 + Receipt `flex-1`**（方案 1） |

---

## 布局架构

```
┌─────────────────────────────┐
│ TaxHeader（固定）             │
├─────────────────────────────┤
│ Snap Zone（shrink-0）         │
│   max-h ~38vh，内容垂直居中    │
│   正方形按钮 max ~240px       │
│   ComplianceFootnote        │
│   [GoogleSoftBanner 可选]    │
├─────────────────────────────┤
│ Recent Receipts（flex-1）    │
│   min-h-0 + overflow-y-auto   │
│   全部 receipts，可滚动        │
└─────────────────────────────┘
```

- `HomeScreen`：`flex flex-col h-full overflow-hidden`；**不再**用 `justify-between` 把 Receipt 挤成窄条。
- Snap 区：**不得** `flex-1`；`shrink-0` + `max-h-[38vh]`（极小屏 `max-h-[42vh]`）。
- Receipt 区：`flex-1 min-h-0`；内部列表 `overflow-y-auto`。

---

## Snap 按钮规格（方案 A）

| 属性 | 现值 | 新值 |
|------|------|------|
| 容器 | `flex-1 justify-center` | `shrink-0 py-4`，无 `flex-1` |
| 按钮 | `w-full max-w-sm aspect-square` | `w-[min(240px,70vw)] aspect-square` |
| 图标 | `h-24 w-24` | `h-16 w-16` |
| 主文案 | `text-2xl` | `text-xl` |
| 边框 | `border-8` | 保持 |

热区仍远大于 64px 最小触控要求；相机 Overlay 与合规脚注行为不变。

---

## Recent Receipts 规格（方案 A3）

| 变更 | 说明 |
|------|------|
| 去掉 `max-h-[35vh]` | footer 改为 `flex-1 min-h-0 flex flex-col` |
| 去掉 `receipts.slice(0, 3)` | 渲染 **全部** `receipts` |
| 滚动 | 列表容器 `flex-1 overflow-y-auto` |
| 三态卡片 | Processing / Done / Blurry 逻辑不变 |

---

## 边界情况

| 场景 | 处理 |
|------|------|
| Google 软引导横条 | 仍在 Snap 区内、脚注下方；不占 Receipt 滚动高度 |
| 极小屏（≤568px） | Snap `max-h-[42vh]`；Receipt 至少保留 ~30vh 可滚动 |
| 横屏 | Snap `max-h-[45vh]`；Receipt 仍 `flex-1` |
| 空列表 | 保留现有 empty copy |

---

## 文档同步

- `docs/ui/ui.html`：Snap main 去 `flex-1`、按钮缩小；footer 去 `max-h-[35vh]`、改为 `flex-1 min-h-0`
- `docs/product/PRODUCT-SPEC.md` §3：底栏由「三态 + 限 3 条」改为「三态 + 全量可滚动」

---

## 验收标准

1. iPhone SE / 14 Pro Max 上 Recent Receipts 可视区域明显大于现版。
2. 10+ 条小票时底栏可流畅滚动查看全部。
3. Snap 仍为正方形黄色主 CTA，点击区域约 240px。
4. 合规脚注、相机 Overlay、软引导横条行为不变。

---

## 范围外（YAGNI）

- Snap 改为横向紧凑按钮（方案 B）
- Receipt 分页 / 「View all」二级页
- 动效或 haptic 变更
