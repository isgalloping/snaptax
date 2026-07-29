# 主界面布局 Rebalance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 缩小 Snap 正方形按钮占用高度，Recent Receipts 占满剩余空间并展示全部小票可滚动。

**Architecture:** `HomeScreen` 统一 flex 分区（Header / Snap shrink-0 / Receipt flex-1）；`SnapButton` 缩小尺寸并移除 `flex-1`；`ReceiptList` 去掉 `35vh`  cap 与 3 条截断。

**Tech Stack:** Next.js 16 · React 19 · Tailwind CSS 4

**Spec:** [`2026-06-07-home-layout-rebalance-design.md`](../specs/2026-06-07-home-layout-rebalance-design.md)

---

## 文件结构

| 路径 | 变更 |
|------|------|
| `components/home/HomeScreen.tsx` | 布局：去掉 `justify-between`；Snap 区 wrapper；Receipt `flex-1 min-h-0` |
| `components/home/SnapButton.tsx` | 按钮/图标/文案尺寸；main 去 `flex-1` |
| `components/home/ReceiptList.tsx` | 去 `max-h-[35vh]`、`slice(0,3)`；`flex-1 min-h-0` |
| `docs/ui/ui.html` | 静态 mock 对齐 |
| `docs/product/PRODUCT-SPEC.md` | §3 底栏描述 |

---

### Task 1: HomeScreen 布局分区

**Files:**
- Modify: `components/home/HomeScreen.tsx`

- [ ] **Step 1:** 根容器改为 `flex h-full flex-col overflow-hidden`（去掉 `justify-between`）

- [ ] **Step 2:** 在 `TaxHeader` 与 `SnapButton` 外包一层 Snap 区：

```tsx
<div className="flex shrink-0 flex-col items-center max-h-[38vh] min-[568px]:max-h-[38vh] max-[567px]:max-h-[42vh] landscape:max-h-[45vh] overflow-hidden px-6 py-4">
  <SnapButton ... />
  {showSoftBanner && <GoogleSoftBanner ... />}
</div>
```

- [ ] **Step 3:** `ReceiptList` 外包 `div className="flex min-h-0 flex-1 flex-col"`，确保 Receipt 吃满剩余高度

- [ ] **Step 4:** 软引导横条从 Snap 区外移到 Snap wrapper 内（若 Step 2 已包含则跳过重复）

---

### Task 2: SnapButton 缩小

**Files:**
- Modify: `components/home/SnapButton.tsx`

- [ ] **Step 1:** `<main>` 去掉 `flex-1`，改为 `flex shrink-0 flex-col items-center`

- [ ] **Step 2:** 按钮 class 更新：

```tsx
className="flex aspect-square w-[min(240px,70vw)] cursor-pointer flex-col items-center justify-center rounded-3xl border-8 border-white bg-yellow-500 text-black shadow-2xl transition-all active:scale-95 active:bg-yellow-400"
```

- [ ] **Step 3:** `CameraIcon` → `h-16 w-16`；主文案 → `text-xl`

---

### Task 3: ReceiptList 全量滚动

**Files:**
- Modify: `components/home/ReceiptList.tsx`

- [ ] **Step 1:** footer 改为：

```tsx
<footer className="flex min-h-0 flex-1 flex-col rounded-t-3xl border-t-2 border-zinc-800 bg-zinc-900 p-6">
```

- [ ] **Step 2:** 删除 `const visible = receipts.slice(0, 3)`，直接 `receipts.map(...)`

- [ ] **Step 3:** 列表容器保持 `flex-1 overflow-y-auto space-y-3 pr-1`

---

### Task 4: 文档同步

**Files:**
- Modify: `docs/ui/ui.html`
- Modify: `docs/product/PRODUCT-SPEC.md`

- [ ] **Step 1:** `ui.html` body 去 `justify-between`；main 去 `flex-1`、按钮改 `w-[min(240px,70vw)]`、图标 `w-16 h-16`；footer 改 `flex-1 min-h-0` 去 `max-h-[35vh]`

- [ ] **Step 2:** PRODUCT-SPEC §3 底栏行改为：`底栏：Recent Receipts（三态 · 全量可滚动）`

---

### Task 5: 验证

- [ ] **Step 1:** `npm run build` — 通过

- [ ] **Step 2:** 本地 `npm run dev`，375×667 与 430×932 视口：
  - Snap 按钮约 240px 正方形
  - 添加 5+ mock/真实小票后 Receipt 区可滚动
  - 软引导出现时不遮挡 Receipt 滚动

---

## Spec 覆盖自检

| Spec 要求 | Task |
|-----------|------|
| Snap shrink-0 max-h | 1, 2 |
| 按钮 240px 正方形 | 2 |
| Receipt flex-1 全量 | 3 |
| 边界横屏/小屏 | 1 |
| 文档 | 4 |
| 验收 | 5 |
