# Founder Program Widget — Topic Design

**Topic ID:** `founder-program-widget`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08 (#115 lapsed → DEFAULT)

---

## 1. Summary

Snap1099 **Founder Program** 以 Home WidgetPager **第一页全宽** 营销卡 + **FounderProgramSheet**（Bottom Sheet，非核心 Modal）呈现。前 50 位 **Google 登录后 Paddle 付款成功** 的用户锁定 tier 价（SUPER #1–10 · EARLY #11–30 · FOUNDER #31–50）；第 51+ 或满员走 **DEFAULT** 季价。定价来自 **Vercel Flags + Paddle Price ID**，禁止硬编码 $49。

**Widget 文案（蓝领导向）：** `FIRST 50 ONLY` · `{price} export this season` · `{remaining} spots left` · `See deal >`；禁止 forever / lifetime / priority support 等未履约卖点。

**交互：** 折叠单态卡片 → tap → Sheet（Guest：英文自定义 Google + Not now；已登录：Claim my spot — {price} + Not now）→ Paddle。**Google 不占席**；仅 webhook 成功分配 `founder_number`。

**可见性：** flag off · 满员 · `founderStatus === active` · **`currentSeasonEntitled`** → 隐藏 Widget；Settings 显示 Founder Badge（active only）。

**Missing Deductions：** `SHOW_MISSING_DEDUCTIONS_WIDGET = false` — 绿卡从 pager 移除，计算与 overlay 代码保留。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | §12 Founder row · §6 按季付费 |
| [`docs/prd/marketing-0.0.1.md`](../../prd/marketing-0.0.1.md) | 营销 PRD 原文 |
| [`docs/superpowers/topics/home-dashboard-design.md`](./home-dashboard-design.md) | WidgetPager 分页 · Need Action 排序 |
| [`lib/founder/`](../../../lib/founder/) | tiers · visibility · resolveDisplayTier |
| [`lib/server/founderProgram.ts`](../../../lib/server/founderProgram.ts) | program state · checkout SKU tier |
| [`lib/server/founderConfig.ts`](../../../lib/server/founderConfig.ts) | Flags → tier prices |
| [`app/api/founder/program/route.ts`](../../../app/api/founder/program/route.ts) | GET program |
| [`components/home/widgets/FounderProgramWidget.tsx`](../../../components/home/widgets/FounderProgramWidget.tsx) | 营销卡 |
| [`components/home/sheets/FounderProgramSheet.tsx`](../../../components/home/sheets/FounderProgramSheet.tsx) | Sheet + Paddle |
| [`lib/home/buildWidgetPages.ts`](../../../lib/home/buildWidgetPages.ts) | `buildWidgetPageKeys` · pager 分页 |

---

## 3. Decisions

### 3.1 Billing & tiers

| Decision | Detail |
|----------|--------|
| **计费** | 按 **报税季** 一次性 SKU；本季 Export 无限次 |
| **SKU tiers** | `FOUNDER_LEVEL_SUPER` · `EARLY` · `FOUNDER` · `DEFAULT` |
| **占席** | 仅 webhook 成功且 skuTier ∈ {SUPER, EARLY, FOUNDER} → `assignFounderSeat` |
| **Google** | Paddle 前硬门控；登录 **不占席** |
| **Renewal** | Active founder 续费 **locked tier**；**lapsed 续费 DEFAULT**（`founder_tier` 仅历史） |
| **Flags** | `founderProgramEnabled` · `founderPrice*Cents` · env `PADDLE_PRICE_ID_FOUNDER_*` |

### 3.2 Widget visibility (`isFounderWidgetVisible`)

```typescript
// lib/founder/visibility.ts
enabled && claimedCount < 50
  && founderStatus !== "active"
  && !currentSeasonEntitled
```

`WidgetStack` 从 `GET /api/founder/program` 取 `user.currentSeasonEntitled`。

### 3.3 Pager layout (Option B)

- **Page 1：** `founder` @ 100% 宽（单独一页）
- **Page 2+：** deadline / needAction / progress / cpa 按 `chunkPages(3)` 分页
- `buildWidgetPages`: `showFounder && keys[0]==="founder"` → `[["founder"], ...chunkPages(rest)]`

### 3.4 Widget copy & scarcity

| Layer | Copy |
|-------|------|
| Label | `FIRST 50 ONLY` |
| Main | `{priceUsd} export this season` via `resolveDisplayTier` |
| Scarcity | `{remaining} spots left`；`remaining ≤ 10` → 红色 urgent |
| CTA | `See deal >` |
| Loading | `Lock export price · first 50` |
| NEW badge | `snaptax_founder_widget_seen` localStorage；首次可见 dismiss |

Sheet title: **`First 50 Deal`** · CTA `Claim my spot — {price}` · `Offer ends when {total} spots are gone`

### 3.5 FounderProgramSheet UX (方案 3)

- Guest：优惠块 + `ContinueWithGoogleButton`（GIS invisible overlay）+ **Not now**
- Signed in：Claim CTA + Not now
- **Not now** = `onClose`；Widget 仍可见；不占席
- 文案禁令：❌ become a Founder / login locks spot · ✅ claim your spot / pay / export this season
- Checkout 前 re-fetch program；`FOUNDER_PROGRAM_FULL` → `programFull` 文案
- 付后 `waitForFounderActive` poll → refresh Widget

### 3.6 API `GET /api/founder/program`

返回 `seatsTotal=50` · `claimedCount` · `remaining` · `programOpen` · `tiers`（server-resolved prices）· `user`（founderStatus/tier/number/currentSeasonEntitled）。Ghost 可读公开席位；user 字段需 session。

### 3.7 Hide Missing Deductions

```typescript
// lib/home/buildWidgetPages.ts
export const SHOW_MISSING_DEDUCTIONS_WIDGET = false;
```

`effectiveHasMissing` 门控 pager；`computeMissingDeductions` 与 overlay 组件 **保留**。

### 3.8 Lapsed founder pricing

**Implemented (2026-07-08, #115):** `resolveFounderCheckoutSkuTier` 与 `resolveDisplayTier` 仅对 `founderStatus === "active"` 返回 locked `founderTier`；**lapsed** 走 **DEFAULT** 季价（checkout + Widget/Sheet 展示一致）。`founder_tier` / `founder_number` 保留作历史与 Badge；Widget 对 lapsed 仍可见直至本季付费或满员。

```typescript
// lib/server/founderProgram.ts · lib/founder/resolveDisplayTier.ts
if (user?.founderNumber != null && user.founderStatus === "active" && user.founderTier != null) {
  return user.founderTier; // checkout / display
}
// lapsed → fall through to DEFAULT
```

### 3.9 Season lapse transition (implemented 2026-07-08)

**Rule:** `founder_number` 非空且 **无** 当前 `currentTaxSeason()` entitlement → 有效状态 **`lapsed`**（即使 DB 仍为 `active`）。

- 计算：`lib/server/founderSeasonStatus.ts` → `resolveEffectiveFounderStatus`
- 应用：`getFounderProgramState` 返回有效状态；若与 DB 不一致则 **lazy persist**（无 cron）
- 本季付费后（webhook + entitlement）→ 有效 **`active`**；Settings Badge 恢复；Widget 隐藏

### 3.10 Payment success (Founder variant)

Paddle 付后 **`PaymentSuccessSheet`**（`variant: founder`）— 与 Export 共用 orchestrator，见 [`export-pipeline-design.md`](./export-pipeline-design.md) §3.5。

```text
checkout.completed → close FounderProgramSheet → confirming
  → finalizeFounderPurchase + waitForFounderActive
  → ready: "You're a Super Founder!" · Super Founder #{n} · primary "Got it"
```

---

## 4. User flow

```text
[Widget visible]
  tap → FounderProgramSheet
    Guest → Continue with Google → SignedOffer
    Signed → Claim my spot — $X → Paddle (founderPurchase: true)
    Not now → close (Widget remains)
  webhook success → founderStatus=active → Widget hidden → Settings Badge

[Settings Export]
  resolveSeasonOfferFromState / resolveFounderCheckoutSkuTier (same tier rules)
  assignFounderSeat on non-DEFAULT webhook
```

---

## 5. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-30 | `archive/specs/2026-06-30-founder-program-widget-design.md` | **this topic** (core program) |
| 2026-07-02 | `archive/specs/2026-07-02-founder-widget-pager-layout-design.md` | **this topic** §3.3 |
| 2026-07-02 | `archive/specs/2026-07-02-founder-widget-copy-design.md` | **this topic** §3.4 |
| 2026-07-02 | `archive/specs/2026-07-02-hide-missing-deductions-widget-design.md` | **this topic** §3.7 |
| 2026-07-03 | `archive/specs/2026-07-03-founder-widget-marking-v1-design.md` | **this topic** §3.4–3.5 (marking v1 禁令) |
| 2026-07-03 | `archive/specs/2026-07-03-founder-google-pay-decouple-design.md` | **this topic** §3.5–3.6 |
| 2026-07-04 | `archive/specs/2026-07-04-payment-success-sheet-design.md` | **this topic** §3.10 · export-pipeline §3.5 |

---

## 6. Archive index

### Specs (6)

| File | Role |
|------|------|
| [`archive/specs/2026-06-30-founder-program-widget-design.md`](../archive/specs/2026-06-30-founder-program-widget-design.md) | 主 spec — Widget · API · SKU · Badge |
| [`archive/specs/2026-07-02-founder-widget-pager-layout-design.md`](../archive/specs/2026-07-02-founder-widget-pager-layout-design.md) | Founder 全宽 Page 1 |
| [`archive/specs/2026-07-02-founder-widget-copy-design.md`](../archive/specs/2026-07-02-founder-widget-copy-design.md) | 蓝领文案 + resolveDisplayTier |
| [`archive/specs/2026-07-02-hide-missing-deductions-widget-design.md`](../archive/specs/2026-07-02-hide-missing-deductions-widget-design.md) | 隐藏 Find More Savings 卡 |
| [`archive/specs/2026-07-03-founder-widget-marking-v1-design.md`](../archive/specs/2026-07-03-founder-widget-marking-v1-design.md) | marking-0.1.v1 收敛 |
| [`archive/specs/2026-07-03-founder-google-pay-decouple-design.md`](../archive/specs/2026-07-03-founder-google-pay-decouple-design.md) | Google/付 decouple · entitled 隐藏 |

### Plans (1)

| Plan | Status |
|------|--------|
| [`archive/plans/2026-06-30-founder-program-widget.md`](../archive/plans/2026-06-30-founder-program-widget.md) | Done |

---

## 7. Implemented plans

- [`archive/plans/2026-06-30-founder-program-widget.md`](../archive/plans/2026-06-30-founder-program-widget.md) — Waves F0–F5：domain · DB · API · Widget · Sheet · Badge · Paywall alignment
