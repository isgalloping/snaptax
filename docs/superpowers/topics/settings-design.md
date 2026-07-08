# Settings Screen — Topic Design

**Topic ID:** `settings`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08

---

## 1. Summary

Snap1099 **第二逻辑页**：`view === "settings"`，无独立路由。主屏通过 `viewState` 子页（Language / Industry / Notifications / Privacy Center / Ghost export flow）在同一壳内导航。

**视觉演进：** v1 PRD 块状重构 → **v3** 交互（viewState、Path A 样例导出、Paywall UI）→ **v5** 户外可读 Summary + Export 五态卡片 → 木匠背景 + 白底 Google CTA → Share 折叠 PrefRow → Privacy Center Markdown 扩展。

**数据一致性：** 首屏 `TaxHeader` 与 Settings `TaxOverviewPanel` 共用 `resolveHeaderTaxSaved()` + `readCurrentSeasonSummary()`；**禁止**在线用 API `taxSavedEstimate` 覆盖 UI。

**相关 topic：** Export 门控与 filed 语义见 [`export-pipeline-design.md`](./export-pipeline-design.md)；T2 soft Google Sheet 见 [`onboarding-aha-design.md`](./onboarding-aha-design.md)。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | §3 设置 IA · Export 五态 · Account |
| [`docs/prd/settings.md`](../../prd/settings.md) | PRD 原文 |
| [`docs/ui/snaptax-setting-ui-v5.png`](../../ui/snaptax-setting-ui-v5.png) | v5 mockup |
| [`components/settings/SettingsScreen.tsx`](../../../components/settings/SettingsScreen.tsx) | viewState 宿主 |
| [`components/settings/SettingsPageShell.tsx`](../../../components/settings/SettingsPageShell.tsx) | 全页背景壳 |
| [`components/settings/TaxOverviewPanel.tsx`](../../../components/settings/TaxOverviewPanel.tsx) | Summary 三列 |
| [`components/settings/TaxExportCard.tsx`](../../../components/settings/TaxExportCard.tsx) | Export 五态 |
| [`components/settings/ShareAppSection.tsx`](../../../components/settings/ShareAppSection.tsx) | Share 折叠 |
| [`components/settings/PrivacyDataSection.tsx`](../../../components/settings/PrivacyDataSection.tsx) | Privacy Center |
| [`lib/client/resolveHeaderTaxSaved.ts`](../../../lib/client/resolveHeaderTaxSaved.ts) | 首屏 ↔ Settings 对齐 |
| [`lib/client/maskEmail.ts`](../../../lib/client/maskEmail.ts) | 邮箱脱敏 |

---

## 3. Main screen layout (final)

`viewState === "main"` 块顺序（自上而下）：

1. `SettingsHeader` — `< BACK` · `SETTINGS` · `EN | FR | DE`
2. `SettingsAccountBlock` — 未登录压力态 / 已登录紧凑态
3. `TaxOverviewPanel` — Est. Tax Saved · Receipts · Deductions
4. `TaxExportCard` — 五态 Export 卡 + `ExportStatusBanner`
5. `SettingsPreferencesList` — **Preferences & Actions**（Language · Industry · Notifications · Privacy Center）
6. `ShareAppSection` — **Share & Refer**（PrefRow 折叠，内联三渠道）
7. Sign out footer（仅已登录）

**Spacing：** section gap ~16px；卡片内 ~8px。

`SettingsPageShell`：全页 `public/photo/settings-bg.png` + 暗色 overlay；主屏与子页共用。

---

## 4. viewState navigation

| State | Trigger | Dismiss |
|-------|---------|---------|
| `main` | default | — |
| `language` | Preferences → Language | `< BACK` |
| `industry` | Preferences → Your Industry | `< BACK` |
| `notifications` | Preferences → Notification Settings | `< BACK` |
| `privacy-center` | Preferences → Privacy & Security Center | `< BACK` / **Got it** |
| `sample-export` | Ghost Export P1 | `< BACK` / flow complete |
| `export-completed` | Sample CSV downloaded | **View status** → main |

无 `/settings/*` 路由；`< BACK` 在子页返回 `main`，在 `main` 返回 Home。

---

## 5. Account block

### Unsigned

- Headline：`Not signed in · Data lost if you change phones`
- **白底** `ContinueWithGoogleButton`（仅 Settings 未登录态；GIS Sheet 内按钮不变）
- 点击 → `GoogleSignInSheet` soft/hard

### Signed-in

- 48px  initials avatar（名前两字母大写）
- Name + **masked email**（`abc***@domain.com` — 见 §6）
- `{season} Tax Season · Paid ✓`（已付费）
- Sign out **不在** account 块 — 在页脚

### Google soft gates (T2)

- 首次进 Settings：`SETTINGS_VISITED_KEY` + 300ms → soft Sheet
- Onboarding 进行中：`skipSoftGoogleSheet=true` 跳过
- Dismiss：`GOOGLE_SOFT_DISMISSED_KEY` 全局一次

---

## 6. Tax Overview (`TaxOverviewPanel`)

| Column | Display | Color |
|--------|---------|-------|
| Est. Tax Saved | `formatCurrency(taxSaved)`；null → `$—` | >0 green · else zinc |
| Receipts | **数字 only**（无 `Snapped` 后缀） | count >0 green |
| Deductions | `formatCurrency(totalDeductions)` | >0 green |

Props：`SettingsTaxStats` from `HomeScreen`（与首屏同源）。

### Header ↔ Settings alignment

```typescript
resolveHeaderTaxSaved({
  displayTaxSaved,           // onboarding override
  seasonTotalTaxSaved: seasonSummary?.totalTaxSaved,
  taxSavedFallback: taxSaved,
});
```

- UI **不再**消费 `GET /api/receipts` 的 `taxSavedEstimate`
- Onboarding：`displayTaxSaved` 同步首屏 demo 值
- Export filed 后 tax saved **不归零**（见 export-pipeline topic §3.6）

---

## 7. Export Tax Pack card (five states)

优先级自上而下（首匹配）：

| P | Condition | Title | CTA | Action |
|---|-----------|-------|-----|--------|
| **P0** | Signed-in + paid + ≤7d to Apr 15 | Final Tax Pack Ready | Export Final Tax Pack | ExportEngineSheet |
| P1 | Not signed-in | Unlock IRS Tax Pack | Preview Sample Export | `sample-export` |
| P2 | Signed-in + unpaid | Export {season} IRS Tax Pack | Unlock for $49 | Paywall |
| P3 | Paid + not exported this season | {season} IRS Tax Pack Unlocked | Download Tax Pack | ExportEngineSheet |
| P4 | Paid + exported this season | Tax Filing Ready | Export Again | ExportEngineSheet |

Helpers：`lib/settings/filingDeadline.ts` · `lib/settings/seasonExportState.ts`（`snap1099_tax_pack_exported_{season}`）。

**Ghost Path A：** sample-export → Download CSV → export-completed → 绿色 `ExportStatusBanner`。

**Home Export：** 独立门控 — 与 Settings Export 区分（见 PRODUCT-SPEC §3）。

---

## 8. Share section

- 位于 **Preferences 下方**
- 折叠 PrefRow：`Share App & Refer Friends` + chevron
- 展开：WhatsApp · Facebook · More（62px 品牌色按钮）
- Handlers：`shareApp.ts`（无 referral 后端）
- **已移除：** avatars 三列 tile、Hero/Message preview、Copy Link、Learn how it works

---

## 9. Privacy & Data (grill-me 2026-07-04)

| Decision | Choice |
|----------|--------|
| Retention/Security | LegalSheet 展示 **完整 Markdown**（`GET /api/legal/document?file=`） |
| Legal links | **仅** Privacy Center；Preferences 内不重复 |
| All policies | 行链至 **`/policies`** 全页；Back = `router.back()` fallback `/` |
| i18n | Retention/Security Markdown **英文 only**；非 en-US 显示 notice |
| G1–G4 | Data storage 可点 · Contact DSR · Markdown 内链 · Security Related links |

Sub-page：`privacy-center` → `PrivacyDataSection` + `PrivacyCenterSubPage`。

---

## 10. Preferences

- 分组卡片 · 72pt 行 · 彩色图标
- Notifications：localStorage toggles + green `{n} on` pill；无 Web Push
- Privacy Center 行 → `privacy-center` viewState

---

## 11. Acceptance criteria

| ID | Criterion |
|----|-----------|
| AC-1 | 主屏块顺序与 §3 一致 |
| AC-2 | Ghost Settings Export → 样例 CSV，无 Paywall |
| AC-3 | 已登录 Export 走 Paywall / Export Again |
| AC-4 | 首屏 Est. Tax Saved === Settings（同 `resolveHeaderTaxSaved`） |
| AC-5 | Receipts 列仅数字 |
| AC-6 | 未登录白底 Google CTA + 木匠背景 |
| AC-7 | Share 在 Preferences 下、三渠道可用 |
| AC-8 | Privacy Center Markdown + `/policies` 链 |
| AC-9 | T2 首次 Settings soft Sheet（onboarding 外） |

---

## 12. Out of scope

- Referral 后端 / 推送通知
- Settings deep-link Back（D2/D3 已拒）
- FR/DE retention/security Markdown（E3 deferred）
- PWA Before/After chrome（独立 spec）

---

## 13. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-16 | `archive/specs/2026-06-16-settings-email-mask-design.md` | **this topic** §5–§6 |
| 2026-06-17 | `archive/specs/2026-06-17-settings-redesign-design.md` | v3/v5 · **this topic** |
| 2026-06-17 | `archive/specs/2026-06-17-settings-v3-redesign-design.md` | **this topic** §4–§7 |
| 2026-06-18 | `archive/specs/2026-06-18-settings-v5-redesign-design.md` | **this topic** §3–§7 |
| 2026-06-19 | `archive/specs/2026-06-19-settings-google-button-bg-design.md` | **this topic** §3–§5 |
| 2026-06-19 | `archive/specs/2026-06-19-settings-share-section-design.md` | **this topic** §8 |
| 2026-06-19 | `archive/specs/2026-06-19-settings-share-layout-design.md` | **this topic** §3–§8 |
| 2026-06-19 | `archive/specs/2026-06-19-settings-summary-receipts-count-design.md` | **this topic** §6 |
| 2026-06-30 | `archive/specs/2026-06-30-tax-saved-header-settings-alignment-design.md` | **this topic** §6 |
| 2026-07-04 | `archive/specs/2026-07-04-settings-privacy-data-grill-design.md` | **this topic** §9 |

**Plans archived:** `2026-06-17-settings-redesign` · `settings-v3-redesign` · `settings-v5-redesign` · `tax-saved-header-settings-alignment` · `settings-privacy-data-grill`.
