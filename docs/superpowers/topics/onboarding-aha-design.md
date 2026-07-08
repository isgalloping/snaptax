# Onboarding & Aha Moment — Topic Design

**Topic ID:** `onboarding-aha`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08

---

## 1. Summary

Snap1099 新人引导分两层：**冷启动 Landing**（`LandingRouter`）与 **主屏 in-app 教程**（`OnboardingOrchestrator`）。首次用户走 **Hero Stage 0** → shadow/sandbox **$28.50 Aha** → **`stage_aha` coach** → 样例导出或 dismiss → `completed`；回访用户仅播 **`data_stream`**（2.4s min / 5s soft max）。

**产品哲学：** 前台傻瓜、后台聪明 — 5 秒内证明能省钱，**不强制 Google**（Export / 多端硬门控不变）。旧 SnapCoach / 3rd-receipt Nudge / 首次设置 soft Sheet 在 onboarding 路径中 **禁用**；教程完成后，**T2 首次进设置 soft Sheet** 与 **T1 第 3 张 done 顶栏 Nudge** 对未登录用户生效。

**Demo 小票：** 固定 ID `onboarding-demo-receipt`；`stage_1` 列表 **空**（无 shadow 卡）；沙盒快门后才出现 COMPLETE 样本（Builder Depot $193.12 → tax $28.50）。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | §12 蓝领新人引导 / Aha onboarding；§14 门控 |
| [`docs/prd/onboarding.md`](../../prd/onboarding.md) | PRD 引导原文 |
| [`docs/ui/onboarding.png`](../../ui/onboarding.png) | 视觉 mockup |
| [`lib/onboarding/`](../../../lib/onboarding/) | 状态机、demo receipt、skip |
| [`components/onboarding/`](../../../components/onboarding/) | Orchestrator、coach、sandbox |
| [`components/landing/LandingRouter.tsx`](../../../components/landing/LandingRouter.tsx) | Hero vs data_stream 分支 |
| [`components/home/HomeScreen.tsx`](../../../components/home/HomeScreen.tsx) | 主集成点 |
| [`docs/superpowers/topics/export-pipeline-design.md`](./export-pipeline-design.md) | 正常导出门控（onboarding 样例导出除外） |

---

## 3. Layered user flow

```text
[Cold start — LandingRouter]
  read onboarding_status (IDB authority + localStorage mirror)
    ├─ not_started     → HeroWelcomeLanding (Stage 0)
    ├─ completed       → DataStreamLanding
    └─ stage_*         → skip landing (variant "none") → HomeScreen resume

[Stage 0 — Hero]
  1.5s CTA ready · 5s auto-advance · button countdown 5→1
  Let's Go / auto → commitHeroLandingStart() → stage_1 → LANDING_CTA_EVENT

[HomeScreen — stage_1 … stage_aha]
  stage_1   Empty list · $0.00 · SnapTooltip + SnapFocusRing heartbeat
            SNAP tap → stage_2 (sandbox sheet)
  stage_2   SandboxCameraSheet (Builder Depot preset, no getUserMedia)
            Shutter → ensureOnboardingDemoDone() → stage_3
  stage_3   Odometer $0→$28.50 ≤300ms · snackbar · haptic
            ~400ms → stage_aha
  stage_aha Coach halos: tax block · demo COMPLETE card · Export (emphasized)
            Export tap OR coach dismiss → completed
            SNAP → real camera (allowed)
  Skip      Any stage_* → delete demo + completed (one tap, no confirm)

[Post-completed]
  Cold start → data_stream only
  Real SNAP / export gates / T2 soft Sheet (if eligible)
  No tutorial UI; shouldSkipLegacyCoaches(status !== not_started)
```

---

## 4. State machine

```typescript
type OnboardingStatus =
  | "not_started"    // Stage 0 not dismissed
  | "stage_1"        // SNAP coach; empty list
  | "stage_2"        // sandbox sheet open
  | "stage_3"        // Aha animation (~600ms)
  | "stage_aha"      // coach halos + sample export window
  | "stage_4"        // legacy — migrate → stage_aha on read
  | "deferred_login" // legacy — migrate → completed on read
  | "completed";
```

| Event | From | To |
|-------|------|-----|
| Legacy user w/ real receipts | — | `completed` |
| Hero Let's Go / 5s auto | `not_started` | `stage_1` |
| SNAP tap | `stage_1` | `stage_2` |
| Sandbox shutter | `stage_2` | `stage_3` |
| Aha sequence end | `stage_3` | `stage_aha` |
| Export / coach dismiss / Skip | `stage_aha` | `completed` |
| Legacy `stage_4` read | `stage_4` | `stage_aha` |
| Legacy `deferred_login` read | `deferred_login` | `completed` |

**Persistence:** IndexedDB `system_meta.onboarding_status`  
**Mirror:** `localStorage.snap1099_onboarding_status`（冷启动同步读）

**Active onboarding:** `status.startsWith("stage_")` → `isOnboardingActive()`  
**SNAP gate:** `isSnapGateActive()` → **always false**（已移除 deferred_login 拦截）

---

## 5. Decisions

### 5.1 Landing (`LandingRouter` + Hero Stage 0)

| Decision | Detail |
|----------|--------|
| **首次冷启动** | `HeroWelcomeLanding` — 蓝领 Hero + 绿勾清单 + Let's Go |
| **回访** | `DataStreamLanding` only |
| **Resume mid-tutorial** | `variant === "none"` — 跳过 Stage 0，直接主屏 |
| **CTA 就绪** | `HERO_CTA_READY_MS = 1500` |
| **自动推进** | `HERO_AUTO_ADVANCE_MS = 5000`；按钮倒计时 5→1 |
| **Session lock** | `heroLandingSession` 阻止 poll 提前 exit |
| **装饰圆点** | 已移除（仅按钮倒计时反馈） |
| **资产** | `/onboarding/onboarding-hero.png` |

**Modules:** `lib/landing/landingVariant.ts` · `lib/landing/heroLandingTiming.ts` · `components/landing/HeroWelcomeLanding.tsx`

### 5.2 Stage 1 — Shadow coach (empty list)

| Decision | Detail |
|----------|--------|
| **列表** | **空** — `visibleReceiptsForOnboarding` 过滤 `isOnboardingDemo && processing` |
| **顶栏** | `0 receipt` · `$0.00`（`displayTaxSaved` override） |
| **IDB** | `stage_1` 不 seed demo；`commitHeroLandingStart` purge 遗留 shadow |
| **SNAP 引导** | `SnapTooltip` + `SnapFocusRing` heartbeat（`snap-coach-heartbeat`） |
| **SNAP tap** | `resolveSnapIntent` → open sandbox；**不**走真实相机 |

### 5.3 Stage 2 — Sandbox camera

| Decision | Detail |
|----------|--------|
| **载体** | `SandboxCameraSheet` Bottom Sheet（非居中 Modal） |
| **画面** | 静态 Builder Depot `/onboarding/sample-builder-depot.png` |
| **API** | **无** OpenAI / Blob / `getUserMedia` |
| **快门** | 黄按钮 + `snap-focus-ring__pulse` + tooltip |
| **完成** | `ensureOnboardingDemoDone()` → `stage_3` |

**Demo fields（完成后）：** merchant `SAMPLE: Builder Depot` · amount $193.12 · tax $28.50 · status `done` · subtitle `COMPLETE`

### 5.4 Stage 3 — Aha moment

| Decision | Detail |
|----------|--------|
| **Odometer** | `TaxSavedOdometer` $0→$28.50 in 300ms |
| **Snackbar** | “You just saved $28.50!” ~3s |
| **Haptic** | `navigator.vibrate(200)` where supported |
| **Transition** | 400ms → `stage_aha`（effect deps `[status]` only + ref guards） |
| **Repair** | `ensureOnboardingDemoDone()` on entry（防 stale processing） |

### 5.5 Stage_aha — Coach + sample export

| Decision | Detail |
|----------|--------|
| **Google Sheet** | **已移除** — 无 `stage_4` signup sheet |
| **Coach zones** | `TaxHeader` tax block（`px-2.5 py-2`）· demo card · Export btn |
| **Export 强调** | `CoachPulseOverlay variant="export"` + `border-yellow-400` |
| **Dismiss** | Tap tax block or demo card → `completeAhaCoach()` → `completed` |
| **Export tap** | Home `handleExportClick` → `downloadOnboardingSampleCsv` → `completed` |
| **Settings Export** | Ghost → `sample-export` 子页；下载后 `onSampleExportAhaComplete` |
| **SNAP** | **允许**真实相机 |
| **样例文件** | `Snap1099-SAMPLE-TurboTax-{year}.csv` via `buildLocalTurboTaxCsv` |
| **正常导出** | `completed` 后走 `useTaxExportGate`（demo 排除） |

**Note:** Export 按钮点击 **不**先 dismiss coach；下载与 `completed` 原子完成。

### 5.6 Skip button

| Decision | Detail |
|----------|--------|
| **位置** | 固定左下 `bottom-4 left-4` · `z-[60]` |
| **交互** | 一键 Skip，无确认 |
| **动作** | `skipOnboarding()` — delete demo + photo → `completed` |
| **可见** | `onboardingInFlow`（`stage_1` … `stage_aha`） |

### 5.7 Google soft gates（new-user-onboarding 遗留）

| Gate | 状态 | 行为 |
|------|------|------|
| **T1 — 第 3 张 done Nudge** | ✅ 已实现 | TaxHeader 一次性横幅 → Settings + soft Sheet；10s 自动消失 |
| **T2 — 首次进设置 soft Sheet** | ✅ 已实现 | `SETTINGS_VISITED_KEY` + 300ms → `GoogleSignInSheet mode=soft` |
| **Onboarding 期间 T2** | **跳过** | `skipSoftGoogleSheet=true` when `status !== completed` |
| **Dismiss** | `GOOGLE_SOFT_DISMISSED_KEY` — 全局一次 Not now |
| **硬门控** | Export / View on All Devices — 不变，不可跳过 |

**Removed for onboarding path:** SnapCoachBanner · FirstReceiptCoach · GoogleBackupNudge · onboarding-signup sheet · `deferred_login` SNAP intercept

### 5.8 Demo receipt rules

| Rule | Detail |
|------|--------|
| **ID** | `onboarding-demo-receipt`（幂等） |
| **Flag** | `isOnboardingDemo?: boolean` — 非第四列表态 |
| **Export** | 排除直至 `convertDemoReceiptAfterLogin()` |
| **Login 后** | Ghost↔Google bind · attach sample photo · `pendingUpload` if online |
| **Delete account** | `resetOnboarding()` 冷启动 |

### 5.9 Cross-end & offline

| Scenario | Behavior |
|----------|----------|
| Web completed + install PWA | Session sync; no tutorial |
| Offline sandbox | 纯本地 mock；无 API |
| IDB unavailable | Fail open — 跳过教程 |
| `OfflineHomeShell` | 共用 `useOnboardingFlow` |

---

## 6. Architecture

| Path | Role |
|------|------|
| `lib/onboarding/onboardingState.ts` | Status R/W, migration, `commitHeroLandingStart` |
| `lib/onboarding/demoReceipt.ts` | Seed / complete / `ensureOnboardingDemoDone` |
| `lib/onboarding/onboardingReceipts.ts` | `visibleReceiptsForOnboarding` |
| `lib/onboarding/onboardingStorage.ts` | Legacy flags + status mirror |
| `lib/onboarding/skipOnboarding.ts` | Skip → delete demo + completed |
| `components/onboarding/useOnboardingFlow.ts` | Hook — display tax, coach, skip soft sheet |
| `components/onboarding/OnboardingOrchestrator.tsx` | Stage 2/3 dispatcher |
| `components/onboarding/SnapFocusRing.tsx` | Stage 1 heartbeat overlay |
| `components/onboarding/SandboxCameraSheet.tsx` | Stage 2 sheet |
| `components/onboarding/CoachPulseOverlay.tsx` | Stage_aha halos |
| `components/onboarding/OnboardingSkipButton.tsx` | Skip CTA |
| `lib/export/downloadOnboardingSampleCsv.ts` | Sample CSV download |

**Modified:** `HomeScreen` · `OfflineHomeShell` · `TaxHeader` · `ReceiptListCard` · `SettingsScreen` · `receiptDb` (`system_meta`)

---

## 7. Storage keys

| Key | Store | Purpose |
|-----|-------|---------|
| `onboarding_status` | IDB `system_meta` | 状态机权威 |
| `snap1099_onboarding_status` | localStorage | 冷启动 mirror |
| `snap1099_google_soft_dismissed` | localStorage | T2 dismiss |
| `snap1099_settings_visited` | localStorage | T2 首次标记 |
| Legacy coach flags | localStorage | 迁移 → `completed` if real receipts exist |

---

## 8. Acceptance criteria (current)

| ID | Criterion |
|----|-----------|
| AC-1 | 首次冷启动：Hero Stage 0 → stage_1 空列表 + SNAP coach |
| AC-2 | 沙盒快门：≤300ms odometer + snackbar + COMPLETE 卡 |
| AC-3 | stage_aha：三处 coach halo；Export 视觉最重 |
| AC-4 | Export（主屏或设置样例页）下载 CSV → `completed` |
| AC-5 | Coach dismiss / Skip → `completed`；无 Google Sheet |
| AC-6 | 回访冷启动：仅 data_stream；无教程 UI |
| AC-7 | `completed` 后：真实 SNAP；正常 export gate |
| AC-8 | Onboarding 中：T2 soft Sheet 不弹 |
| AC-9 | `completed` 后第 3 张真实 `done` 小票：TaxHeader T1 Nudge 一次/会话；点击 → Settings soft Sheet |

---

## 9. Out of scope

- Sign in with Apple
- Bottom tab navigation
- Sandbox 调用 OpenAI / 真相机
- Server-side onboarding status
- Onboarding 内 Paddle / 付费

---

## 10. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-12 | `archive/specs/2026-06-12-new-user-onboarding-design.md` | aha-moment (P2–P5) + **this topic** (T1/T2/P0/P7 遗留) |
| 2026-06-13 | `archive/specs/2026-06-13-aha-moment-onboarding-design.md` | 2026-06-14 remediation chain → **this topic** |
| 2026-06-14 | `archive/specs/2026-06-14-aha-moment-onboarding-remediation-design.md` | **this topic** |
| 2026-06-14 | `archive/specs/2026-06-14-aha-moment-onboarding-followup-audit.md` | **this topic** |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-optional-signup-design.md` | stage_aha + sample-export（移除 stage_4） |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-stage-aha-sample-export-design.md` | **this topic** §5.5 |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-hero-first-visit-design.md` | **this topic** §5.1 |
| 2026-06-14 | Hero timing chain (auto-advance → countdown → 5s dwell → remove-dots) | **this topic** §5.1 |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-stage1-empty-receipt-list-design.md` | **this topic** §5.2 |
| 2026-06-14 | Snap focus ring → heartbeat → sandbox shutter coach | **this topic** §5.2–5.3 |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-aha-coach-highlights-design.md` | stage_aha（非 stage_3/4） |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-stage3-aha-transition-fix-design.md` | Orchestrator ref-based effect |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-demo-receipt-repair-design.md` | `ensureOnboardingDemoDone` |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-tax-header-coach-padding-design.md` | **this topic** §5.5 |
| 2026-06-14 | `archive/specs/2026-06-14-onboarding-skip-button-design.md` | **this topic** §5.6 |

**Partial supersede:** `2026-06-12-new-user-onboarding` 的 P0 Landing、P6 设置深度、P7 硬门控仍有效；P5 T1/T2 仅 T2 活跃。

---

## 11. Archive index

### Specs (20)

| File | Role |
|------|------|
| [`archive/specs/2026-06-12-new-user-onboarding-design.md`](../archive/specs/2026-06-12-new-user-onboarding-design.md) | 业务分析 + T1/T2 软引导 + P0–P7 旅程 |
| [`archive/specs/2026-06-13-aha-moment-onboarding-design.md`](../archive/specs/2026-06-13-aha-moment-onboarding-design.md) | Aha 主 spec — shadow/sandbox/Aha/signup |
| [`archive/specs/2026-06-14-aha-moment-onboarding-remediation-design.md`](../archive/specs/2026-06-14-aha-moment-onboarding-remediation-design.md) | 代码审查修复 |
| [`archive/specs/2026-06-14-aha-moment-onboarding-followup-audit.md`](../archive/specs/2026-06-14-aha-moment-onboarding-followup-audit.md) | 二次审查 |
| [`archive/specs/2026-06-14-onboarding-optional-signup-design.md`](../archive/specs/2026-06-14-onboarding-optional-signup-design.md) | Later → completed；移除 SNAP gate |
| [`archive/specs/2026-06-14-onboarding-stage-aha-sample-export-design.md`](../archive/specs/2026-06-14-onboarding-stage-aha-sample-export-design.md) | stage_aha + 样例 CSV |
| [`archive/specs/2026-06-14-onboarding-hero-first-visit-design.md`](../archive/specs/2026-06-14-onboarding-hero-first-visit-design.md) | Hero Stage 0 vs data_stream |
| [`archive/specs/2026-06-14-onboarding-hero-auto-advance-design.md`](../archive/specs/2026-06-14-onboarding-hero-auto-advance-design.md) | 3s auto-advance |
| [`archive/specs/2026-06-14-onboarding-hero-countdown-design.md`](../archive/specs/2026-06-14-onboarding-hero-countdown-design.md) | 按钮倒计时 + session lock |
| [`archive/specs/2026-06-14-onboarding-hero-5s-dwell-design.md`](../archive/specs/2026-06-14-onboarding-hero-5s-dwell-design.md) | 5s dwell |
| [`archive/specs/2026-06-14-onboarding-hero-remove-dots-design.md`](../archive/specs/2026-06-14-onboarding-hero-remove-dots-design.md) | 移除装饰圆点 |
| [`archive/specs/2026-06-14-onboarding-stage1-empty-receipt-list-design.md`](../archive/specs/2026-06-14-onboarding-stage1-empty-receipt-list-design.md) | stage_1 空列表 |
| [`archive/specs/2026-06-14-onboarding-snap-focus-ring-design.md`](../archive/specs/2026-06-14-onboarding-snap-focus-ring-design.md) | SNAP focus ring |
| [`archive/specs/2026-06-14-onboarding-snap-focus-heartbeat-design.md`](../archive/specs/2026-06-14-onboarding-snap-focus-heartbeat-design.md) | Heartbeat 修订 |
| [`archive/specs/2026-06-14-onboarding-sandbox-shutter-coach-design.md`](../archive/specs/2026-06-14-onboarding-sandbox-shutter-coach-design.md) | 沙盒快门 coach |
| [`archive/specs/2026-06-14-onboarding-aha-coach-highlights-design.md`](../archive/specs/2026-06-14-onboarding-aha-coach-highlights-design.md) | Coach halos |
| [`archive/specs/2026-06-14-onboarding-stage3-aha-transition-fix-design.md`](../archive/specs/2026-06-14-onboarding-stage3-aha-transition-fix-design.md) | stage_3→stage_aha 修复 |
| [`archive/specs/2026-06-14-onboarding-demo-receipt-repair-design.md`](../archive/specs/2026-06-14-onboarding-demo-receipt-repair-design.md) | Demo self-heal |
| [`archive/specs/2026-06-14-onboarding-tax-header-coach-padding-design.md`](../archive/specs/2026-06-14-onboarding-tax-header-coach-padding-design.md) | Tax header padding |
| [`archive/specs/2026-06-14-onboarding-skip-button-design.md`](../archive/specs/2026-06-14-onboarding-skip-button-design.md) | Skip 按钮 |

### Plans (7)

| Plan | Status |
|------|--------|
| [`archive/plans/2026-06-13-aha-moment-onboarding.md`](../archive/plans/2026-06-13-aha-moment-onboarding.md) | Done |
| [`archive/plans/2026-06-14-onboarding-hero-5s-dwell.md`](../archive/plans/2026-06-14-onboarding-hero-5s-dwell.md) | Done |
| [`archive/plans/2026-06-14-onboarding-optional-signup.md`](../archive/plans/2026-06-14-onboarding-optional-signup.md) | Done |
| [`archive/plans/2026-06-14-onboarding-pr-split.md`](../archive/plans/2026-06-14-onboarding-pr-split.md) | Done |
| [`archive/plans/2026-06-14-onboarding-skip-button.md`](../archive/plans/2026-06-14-onboarding-skip-button.md) | Done |
| [`archive/plans/2026-06-14-onboarding-snap-focus-ring.md`](../archive/plans/2026-06-14-onboarding-snap-focus-ring.md) | Done |
| [`archive/plans/2026-06-14-onboarding-tax-header-coach-padding.md`](../archive/plans/2026-06-14-onboarding-tax-header-coach-padding.md) | Done |
