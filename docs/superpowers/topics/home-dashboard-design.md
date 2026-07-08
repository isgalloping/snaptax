# Home Dashboard — Topic Design

**Topic ID:** `home-dashboard`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08

---

## 1. Summary

Snap1099 主界面是 **2 逻辑页** 之一：固定 chrome（TaxHeader + Snap + InlinePrivacy + WidgetPager）+ **可滚动** 小票列表。快门区始终可见；核心拍照 **零 Modal**。顶栏 **Est. Tax Saved** = `SUM(tax_amount)`（`status=done`）；Export 走 `useTaxExportGate` 硬门控（见 [export-pipeline-design.md](./export-pipeline-design.md)）。

**固定 chrome 顺序：** 照片 Hero TaxHeader → 全宽黄色 Snap → 单行隐私说明 → WidgetPager →（滚动区）Filter tabs + RECENT RECEIPTS 列表。

**WidgetPager：** 每页最多 3 卡等宽分页；>3 时横向 swipe + 黄点指示。ACTION 桶有小票时 **Need Action** 固定第 2 位；报税季 CPA /IRS Ready 在 ACTION 存在时为第 3 位，否则第 4 位。**Founder** 启用时 Page 1 全宽（见 [`founder-program-widget-design.md`](./founder-program-widget-design.md)）。**Missing Deductions** 当前 `SHOW_MISSING_DEDUCTIONS_WIDGET = false`（见 [`founder-program-widget-design.md`](./founder-program-widget-design.md) §3.7）。

**离开确认：** 仅 Home 根屏（无 overlay / sheet）在边缘 swipe 或系统返回将退出 PWA 时弹出 Bottom Sheet。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | §2.1 布局 · §5.1 Est. Tax Saved |
| [`docs/ui/snaptax-home-ui.v2.png`](../../ui/snaptax-home-ui.v2.png) | v2 主屏 mockup |
| [`components/home/`](../../../components/home/) | HomeScreen、TaxHeader、Snap、列表、Widget |
| [`lib/home/buildWidgetPages.ts`](../../../lib/home/buildWidgetPages.ts) | Widget 排序与分页 |
| [`lib/receipts/receiptBucket.ts`](../../../lib/receipts/receiptBucket.ts) | 五桶 filter |
| [`lib/ui/homeVisual.ts`](../../../lib/ui/homeVisual.ts) | Hero / pager 视觉 token |
| [`docs/superpowers/topics/export-pipeline-design.md`](./export-pipeline-design.md) | Export 门控 |
| [`docs/superpowers/topics/onboarding-aha-design.md`](./onboarding-aha-design.md) | Aha coach 与 TaxHeader padding |

---

## 3. Layout architecture

```text
┌─ Fixed (no scroll) ─────────────────────────────────────┐
│ TaxHeader — photo hero card, CPA/IRS + Settings + Install│
│ SnapButton — full-width yellow SNAP RECEIPT              │
│ InlinePrivacyNote — one line + Learn more                │
│ WidgetPager — insight cards (≤3 per page)               │
├─ Scroll region (flex-1 min-h-0 overflow-y-auto) ────────┤
│ ReceiptFilterBar — ALL · READY · REVIEW · ACTION · PROC  │
│ List header — RECENT RECEIPTS · Pull to refresh          │
│ ReceiptList — cards (green/gray tax, category + Line)    │
└─────────────────────────────────────────────────────────┘
```

| Zone | Rule |
|------|------|
| Root | `flex h-full flex-col overflow-hidden` — **禁止**整页 body 滚动 |
| Fixed chrome | `shrink-0` — TaxHeader、Snap 区、InlinePrivacy、WidgetPager |
| Scroll | `HomeScrollRegion` — 仅 filter + list |
| Overlays | `HomeOverlayHost` — deadline / missing / privacy-trust 等全屏 overlay，非新路由 |

**Retired from home:** 独立 `TrustBar`（由 `InlinePrivacyNote` 取代）；Header Sync/Filter 按钮；Google 绑定横幅；v2 黑卡 + shield 英雄区。

---

## 4. Decisions

### 4.1 TaxHeader + Hero photo card

| Decision | Detail |
|----------|--------|
| Shell | `rounded-2xl border border-zinc-800 overflow-hidden` — **无** `bg-zinc-900` 实底 |
| Background | `/photo/hero.png` + 三层叠放：photo → `heroOverlay`（左暗角 + 底 fade）→ `heroTint`（品牌黄 wash） |
| Position | `bg-cover bg-no-repeat bg-[85%_center]` — 工人肖像在右侧 |
| Height | **内容驱动**（`py-3`）；**无** `min-h-[132px]` / `max-h-[24vh]` |
| Left column | `ESTIMATED TAX SAVED` · `text-4xl font-black text-yellow-400` · `{n} receipts • ${total} tracked` |
| Shield | **已移除** — 无 `TaxShieldIcon` |
| Actions | 右上：**CPA /IRS Ready**（`useTaxExportGate`）· **Settings** · 可选 **ADD HOME**（PWA install） |
| CPA label | `aria-label` + widget：`CPA /IRS Ready`；可见短 caption：`CPA /IRS` |
| Est. Tax Saved | 服务端 `tax_amount` 汇总；禁止客户端 `amount×0.25` |

**Modules:** `components/home/TaxHeader.tsx` · `lib/ui/homeVisual.ts` (`heroCard`, `heroImage`, `heroOverlay`, `heroTint`)

### 4.2 Snap button

| Decision | Detail |
|----------|--------|
| Shape | 全宽矩形 `h-[140px] max-h-[18vh] rounded-2xl border-4 border-white bg-yellow-500` |
| Label | `SNAP RECEIPT` + `CameraIcon`；`active:scale-95` |
| Compliance | Terms 脚注 **仅** `CameraOverlay`；主屏无重复 |
| Onboarding | `stage_1`：`SnapFocusRing` + `SnapTooltip` 锚定 Snap 区 |
| Camera | 零 Modal 拍照链；batch / resnap / gallery fallback 不变 |

**Modules:** `components/home/SnapButton.tsx` · `components/camera/*`

### 4.3 Inline privacy

| Decision | Detail |
|----------|--------|
| Position | Snap 正下方固定区 |
| Copy | `IRS never sees your receipts. Your data is private and secure.` |
| Learn more | → `privacy-trust` overlay |
| Style | `text-[10px] text-zinc-400`；链接 `text-green-400/90` |
| Offline | `OfflineHomeShell` 同文案；Learn more 可禁用 |

**Module:** `components/home/InlinePrivacyNote.tsx`

### 4.4 WidgetPager

| Decision | Detail |
|----------|--------|
| Zone | 固定于 InlinePrivacy 下方；列表滚动时 **不动** |
| Pagination | `buildWidgetPages` — 每页 max 3；1/2/3 卡分别 100% / 50% / 33.3% 等宽 |
| >3 widgets | 横向 `scroll-snap`；黄点 `#EAB308`；**无** smooth-scroll carousel |
| Card height | `h-[104px] rounded-2xl`；`active:scale-[0.98]` |
| Widgets | Deadline（常显）· Progress（常显）· Missing（门控关闭）· Need Action · CPA /IRS Ready · Founder（见 [`founder-program-widget-design.md`](./founder-program-widget-design.md)） |

**Widget order (`buildWidgetPageKeys`):**

| Missing | ACTION | CPA | Order |
|---------|--------|-----|-------|
| — | — | — | Deadline · Progress |
| — | — | ✓ | Deadline · Progress · CPA |
| — | ✓ | — | Deadline · **Need Action** · Progress |
| — | ✓ | ✓ | Deadline · **Need Action** · **CPA** · Progress |
| ✓ | ✓ | ✓ | Missing · **Need Action** · **CPA** · Deadline · Progress |

`actionCount` = `countReceiptBuckets(…).action`（`blurry` + `photoMissing`）。

**Cover Flow 实验（2026-06-18）：** `widget-cover-*` 系列 spec 描述的三卡 Cover Flow 旋转动画 **未保留**于现行代码；现行实现为 **分页 WidgetPager**（`WidgetPager.tsx`）。

**Modules:** `components/home/widgets/WidgetPager.tsx` · `WidgetStack.tsx` · `lib/home/buildWidgetPages.ts` · `lib/home/computeHomeWidgets.ts`

### 4.5 Receipt filter tabs

| Tab | Color | Rule |
|-----|-------|------|
| ALL | Yellow | 全部小票 |
| READY | Green | `done` && !`needsUserReview` |
| REVIEW | Yellow | `done` && `needsUserReview` |
| ACTION | Red | `blurry` \|\| `photoMissing` |
| PROCESSING | Zinc | `processing`；sync stuck 含 ⚠️ |

**AI confidence 三档**（服务端 `receiptVision`）：

| Confidence | Status | Bucket |
|------------|--------|--------|
| `< 0.5` | `blurry` | ACTION |
| `0.5 – 0.69` | `done` | REVIEW |
| `≥ 0.7` | `done` | READY（若其他 review 规则通过） |

**Module:** `lib/receipts/receiptBucket.ts` · `components/home/ReceiptFilterBar.tsx`

### 4.6 Receipt list display

| Element | Rule |
|---------|------|
| Title | **RECENT RECEIPTS** + 右侧 Pull to refresh |
| Tax amount | 可抵扣且 `taxAmount > 0` → 绿色 `-{amount}`；否则 `$0.00` 灰色 |
| Subtitle | `{time} · {categoryDisplay}` + 独立 IRS Line pill（Line 22 / 24b / N/A） |
| Icons | 左列 emoji（`receiptListIcon.ts`）— 处理中 / 模糊 / 分类 |
| Compact | `space-y-1.5` · `p-2.5` 卡片 — 首屏 ≥3 张可见 |
| List DELETE | **blurry / processing / paused / photo-missing** 卡片显示红色 **DELETE**（≥48px 高）；**done** 无列表删除（仅详情 + confirm sheet）；即时删除、无 Modal；复用 `handleDeleteReceipt` |

**Modules:** `components/home/ReceiptList.tsx` · `ReceiptListCard.tsx` · `lib/receipts/receiptCategoryDisplay.ts`

### 4.7 PWA install button (TaxHeader)

| Decision | Detail |
|----------|--------|
| Trigger | `pwaInstall.mode === "header-button"` |
| UI | 网格 + 下箭头图标 + 短标签 **ADD HOME** |
| Touch | 所有 header action ≥ **64px** |
| Flow | 仍调用 `pwaInstall.install()`；底栏 install bar 不变 |

### 4.8 Exit confirm (Home root only)

| Decision | Detail |
|----------|--------|
| Scope | `view=home` && 无 overlay && 无 blocking sheet |
| UI | **Bottom Sheet**（非居中 Modal）— STAY / EXIT |
| Edge swipe | 仅左右 **24px** 边缘区；水平位移 ≥ **60px** |
| System back | 第一次 trap back 无 sheet；第二次将退出 app 时弹 sheet |
| Excluded | Settings、overlay、Widget 中心区横向滑动、相机 / 详情 sheet |

**Modules:** `lib/client/useHomeExitGuard.ts` · `lib/client/homeExitGuard.ts` · `components/home/ExitConfirmSheet.tsx`

---

## 5. Home overlays (viewState)

| Overlay | Trigger |
|---------|---------|
| `deadline-detail` | Tax Deadline widget |
| `missing-deductions` | Missing widget（当前隐藏） |
| `tax-year-detail` | Progress widget |
| `privacy-trust` | InlinePrivacy Learn more |
| `missing-deduction-item` | Missing 列表项 |

Dismiss：`< BACK` 或 overlay 内 CTA。`view=settings` 仍为第二逻辑页。

---

## 6. Out of scope / Phase 2

| Item | Spec / note |
|------|-------------|
| Founder Program widget | [`founder-program-widget-design.md`](./founder-program-widget-design.md) — consolidated 2026-07-08 |
| Hide Missing Deductions | [`founder-program-widget-design.md`](./founder-program-widget-design.md) §3.7 — `SHOW_MISSING_DEDUCTIONS_WIDGET=false` |
| Cover Flow carousel | 已 supersede 为分页 WidgetPager |
| Hamburger / 2×2 grid / PDF export | v2 mockup 排除项 |
| Settings 页 | 非本 topic |

---

## 7. Decision log

| Date | Archived spec | Supersedes |
|------|---------------|------------|
| 2026-06-07 | `home-compact-layout` | Snap 矩形快门 + 紧凑列表 + emoji 图标 |
| 2026-06-07 | `home-hero-photo` | Hero 三层叠放资产与定位 |
| 2026-06-07 | `home-layout-rebalance` | flex 分区 rebalance |
| 2026-06-07 | `home-remove-google-banner` | 移除 Google 绑定顶栏 |
| 2026-06-07 | `home-ui-redesign` / `home-visual-redesign` | 早期视觉迭代 → v2 |
| 2026-06-17 | `home-dashboard-redesign` | TrustBar + widget 数据层（后调整为 InlinePrivacy + 固定 pager） |
| 2026-06-17 | `home-v2-first-screen` | 五桶 filter、Need Action 4th slot、confidence 三档、列表展示 |
| 2026-06-17 | `home-header-snap-spacing` | 内容驱动 header 高度；TrustBar → 后由 InlinePrivacy 取代 |
| 2026-06-18 | `tax-header-hero-card` | 黑卡+shield → 照片 hero card |
| 2026-06-18 | `home-widget-pager` | 固定区分页 pager（取代 scroll 区内 carousel） |
| 2026-06-18 | `need-action-widget-slot` | Need Action #2 + CPA /IRS 标签 |
| 2026-06-18 | `widget-cover-*` (4) | Cover Flow 实验；**现行代码用 WidgetPager** |
| 2026-06-19 | `home-exit-confirm` | Home 根屏离开确认 |
| 2026-06-19 | `home-install-button` | ADD HOME 安装按钮 |
| 2026-06-19 | `receipt-list-bad-delete` | 列表 bad-state 一键 DELETE（§4.6） |

---

## 8. Archive index

### Specs (18)

| File | Role |
|------|------|
| [`archive/specs/2026-06-07-home-compact-layout-design.md`](../archive/specs/2026-06-07-home-compact-layout-design.md) | 紧凑首屏 |
| [`archive/specs/2026-06-07-home-hero-photo-design.md`](../archive/specs/2026-06-07-home-hero-photo-design.md) | Hero 照片资产 |
| [`archive/specs/2026-06-07-home-layout-rebalance-design.md`](../archive/specs/2026-06-07-home-layout-rebalance-design.md) | 布局 rebalance |
| [`archive/specs/2026-06-07-home-remove-google-banner-design.md`](../archive/specs/2026-06-07-home-remove-google-banner-design.md) | 移除 Google banner |
| [`archive/specs/2026-06-07-home-ui-redesign-design.md`](../archive/specs/2026-06-07-home-ui-redesign-design.md) | UI 重设计 |
| [`archive/specs/2026-06-07-home-visual-redesign-design.md`](../archive/specs/2026-06-07-home-visual-redesign-design.md) | 视觉重设计 |
| [`archive/specs/2026-06-17-home-dashboard-redesign-design.md`](../archive/specs/2026-06-17-home-dashboard-redesign-design.md) | Dashboard shell + widget 数据 |
| [`archive/specs/2026-06-17-home-header-snap-spacing-design.md`](../archive/specs/2026-06-17-home-header-snap-spacing-design.md) | Header–Snap 间距 |
| [`archive/specs/2026-06-17-home-v2-first-screen-design.md`](../archive/specs/2026-06-17-home-v2-first-screen-design.md) | v2 首屏主 spec |
| [`archive/specs/2026-06-18-home-widget-pager-design.md`](../archive/specs/2026-06-18-home-widget-pager-design.md) | 分页 WidgetPager |
| [`archive/specs/2026-06-18-need-action-widget-slot-design.md`](../archive/specs/2026-06-18-need-action-widget-slot-design.md) | Need Action 排序 |
| [`archive/specs/2026-06-18-tax-header-hero-card-design.md`](../archive/specs/2026-06-18-tax-header-hero-card-design.md) | 照片 hero card |
| [`archive/specs/2026-06-18-widget-cover-flow-animation-design.md`](../archive/specs/2026-06-18-widget-cover-flow-animation-design.md) | Cover Flow 动画（已废弃实现） |
| [`archive/specs/2026-06-18-widget-cover-placement-stability-design.md`](../archive/specs/2026-06-18-widget-cover-placement-stability-design.md) | Cover Flow 稳定性 |
| [`archive/specs/2026-06-18-widget-cover-smooth-rotation-design.md`](../archive/specs/2026-06-18-widget-cover-smooth-rotation-design.md) | Cover Flow 平滑旋转 |
| [`archive/specs/2026-06-18-widget-cover-triple-slot-design.md`](../archive/specs/2026-06-18-widget-cover-triple-slot-design.md) | Cover Flow 三槽 |
| [`archive/specs/2026-06-19-home-exit-confirm-design.md`](../archive/specs/2026-06-19-home-exit-confirm-design.md) | 离开确认 |
| [`archive/specs/2026-06-19-home-install-button-design.md`](../archive/specs/2026-06-19-home-install-button-design.md) | 安装按钮 |
| [`archive/specs/2026-06-19-receipt-list-bad-delete-design.md`](../archive/specs/2026-06-19-receipt-list-bad-delete-design.md) | 列表 bad-state DELETE |

### Plans (8)

| Plan | Status |
|------|--------|
| [`archive/plans/2026-06-07-home-layout-rebalance.md`](../archive/plans/2026-06-07-home-layout-rebalance.md) | Done |
| [`archive/plans/2026-06-07-home-visual-redesign.md`](../archive/plans/2026-06-07-home-visual-redesign.md) | Done |
| [`archive/plans/2026-06-17-home-dashboard-redesign.md`](../archive/plans/2026-06-17-home-dashboard-redesign.md) | Done |
| [`archive/plans/2026-06-17-home-v2-first-screen.md`](../archive/plans/2026-06-17-home-v2-first-screen.md) | Done |
| [`archive/plans/2026-06-18-home-widget-pager.md`](../archive/plans/2026-06-18-home-widget-pager.md) | Done |
| [`archive/plans/2026-06-18-tax-header-hero-card.md`](../archive/plans/2026-06-18-tax-header-hero-card.md) | Done |
| [`archive/plans/2026-06-18-widget-cover-flow-animation.md`](../archive/plans/2026-06-18-widget-cover-flow-animation.md) | Done (superseded by pager) |
| [`archive/plans/2026-06-19-home-exit-confirm.md`](../archive/plans/2026-06-19-home-exit-confirm.md) | Done |
| [`archive/plans/2026-06-19-receipt-list-bad-delete.md`](../archive/plans/2026-06-19-receipt-list-bad-delete.md) | Done |
