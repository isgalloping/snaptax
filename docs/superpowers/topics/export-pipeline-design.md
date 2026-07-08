# Export Pipeline — Topic Design

**Topic ID:** `export-pipeline`  
**Status:** Consolidated · implemented  
**Last verified:** 2026-07-08

---

## 1. Summary

Snap1099 导出是 **唯一付费转化路径**（$49/税季 Paddle）。硬门控：**有效 Google session** + 本季 `season_entitlements.paid=true`；离线时客户端拦截，不调用 API。

交互：`useTaxExportGate` 统一主屏 Export 与 Settings 入口 → `ExportEngineSheet` 三步 Bottom Sheet（税年 → 格式 → 生成/分享）。导出前 **`prepareExportSync`** 刷 pending upload/delete 并 immediate sync，保证 Step 1 计数与服务器一致。

**格式（API 契约见 `docs/tech/08-export.md`，不在此重复）：**

| format | 输出 | UI |
|--------|------|-----|
| `cpa_pdf` | Schedule C mirror PDF | 第 1 按钮 |
| `txf` | TXF V042 | 第 2 按钮 |
| `csv` | TurboTax 8 列 CSV | 第 3 按钮 |
| `cpa_pack` | Audit-Trail ZIP | 第 4 按钮 |
| `xlsx` | 旧版 Excel | **UI 隐藏**，API 保留 |

**Filed 标记：** 导出成功后服务端幂等写入 `taxSeason` + `taxSeasonDate`（审计/幂等）；**不减少** UI Est. Tax Saved（`totalTaxSaved` = 本税年全部 `done` 的 `SUM(tax_amount)`）。

**空状态：** 零 `done` 小票 → gate 阻断 + Settings 黄条 5s 淡出提示；Step 1 选中年份无小票 → 红字提示 + CONTINUE 可点并显示同文案。

**分享：** Step 4 主操作 **Save to Phone**；仅 `navigator.canShare({ files })` 为真时显示 Share；分享失败/取消 **不** 自动下载。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | Export 硬门控、Paddle、Est. Tax Saved |
| [`docs/tech/08-export.md`](../../tech/08-export.md) | **API 契约** — `POST /api/export/tax-pack` 请求体、格式表、错误码 |
| [`docs/biz/export/`](../../biz/export/) | TurboTax / CPA / TXF 业务 golden 文件 |
| [`app/api/export/tax-pack/route.ts`](../../../app/api/export/tax-pack/route.ts) | 服务端导出入口 |
| [`lib/export/`](../../../lib/export/) | 格式 builder、mapping、分享 |
| [`components/export/`](../../../components/export/) | ExportEngineSheet、useTaxExportGate |

---

## 3. Decisions

### 3.1 Client gate (`useTaxExportGate`)

```text
Export tap (Home / Settings)
  → [离线] copy.settings.export.offline
  → prepareExportSync (flush upload → flush delete → immediate sync)
  → hasExportableReceipts? 否 → noDeductibleReceipts + ExportEmptyTip（Settings）
  → Google signed in? 否 → Google sign-in sheet
  → season paid? 否 → PaywallSheet
  → openExportEngine()
```

| Decision | Detail |
|----------|--------|
| **硬门控** | Google session + 本季 paid；Export / View on All Devices 不可跳过 |
| **Pre-sync** | `lib/client/exportPrepareFlow.ts` — gate 打开前 + generate 前各跑一次 |
| **Paid cache** | `refreshSeasonPaid` 镜像 API；`paid=false` 清 localStorage；gate 不用 stale fallback |
| **Sign-out** | 清除本季 paid localStorage，避免下一 Ghost 继承 |
| **支付成功** | `checkout.completed` → 轮询 entitlement ≤15s → 再导出；超时提示点 Export Again |
| **Export Again** | 本季无限次；每次含 **全部** `status=done` 小票（含已 filed） |

**UI：** `components/export/useTaxExportGate.tsx` · `components/export/ExportEngineSheet.tsx` · `components/settings/SettingsScreen.tsx`

### 3.2 Server route (`POST /api/export/tax-pack`)

| Decision | Detail |
|----------|--------|
| **Auth** | `actor.kind === "user"`；Ghost → 401 |
| **Entitlement** | `currentTaxSeason()` + `snaptax_season_entitlements.paid`；否则 402 |
| **Receipt scope** | `userAccountReceiptFilter(userId, boundGhostId)` + `status: "done"`（含 bound-ghost 孤儿票） |
| **Tax year** | `filterReceiptsByTaxYear` + `X-Time-Zone` |
| **Filed write** | 导出后 `updateMany` 写 `taxSeason`/`taxSeasonDate`（幂等） |
| **Logging** | 成功 `biz.export`（`taxSeason`, `receiptCount`） |
| **PDF** | `maxDuration=60`；PDFKit bundling；失败 `PDF_GENERATION_FAILED` |
| **Images** | 缺 Blob 跳过；`X-Export-Images-*` 响应头 |

**Pipeline（cpa_pdf / cpa_pack）：**

```text
buildExportExpenseRow → finalizeExportRows
  → auditEligibleRows → assignAuditTrailMeta
  → buildScheduleCMirrorPdf / buildAuditDetailCsv / buildCpaPackZip
```

Income：`buildExportIncomeRow` → PDF Part I + ZIP `01_Income_Documents/`（不进 audit Index）。

### 3.3 Formats architecture

| Layer | Module |
|-------|--------|
| Row model | `lib/tax/exportRows.ts` — `ExportExpenseRow` |
| Finalize | `lib/export/mapping/finalizeExportRows.ts` |
| Mapping | `lib/export/mapping/exportCategoryMapping.ts`, `receiptNaming.ts`, `auditImageNaming.ts` |
| Schedule C | `lib/export/scheduleCLines.ts` |
| CSV | `lib/tax/exportCsv.ts` — TurboTax 8 列、无 BOM |
| TXF | `lib/export/buildTxf.ts` |
| PDF | `lib/export/buildScheduleCMirrorPdf.ts` — Part II Line 8–27a + `$0.00` 空行 |
| ZIP | `lib/export/buildCpaPack.ts` — `Snap1099-{year}-Audit-Trail.zip` |
| Share | `lib/export/shareTaxPack.ts` — `shared \| cancelled \| unsupported \| failed` |

**Audit 口径：** Personal / 零抵扣 **排除** 于 PDF appendix、ZIP 费用图、Detail CSV、Index；TurboTax CSV 仍含 Personal（既有行为）。

**Out of scope（永久）：** `03_Mileage_Log.csv`、TXF TD 2214 里程行、QBO/OFX。

### 3.4 Empty states UX

| Scenario | Behavior |
|----------|----------|
| 零 done 小票 | Gate 不打开 sheet；Settings `ExportEmptyTip` 黄条 5s fade |
| Step 1 选中年份空 | 红字 hint；CONTINUE 可点 → 同 `noDeductibleReceipts` 文案 |
| 默认税年 | `pickDefaultExportTaxYear` — 首个有小票的年份 |
| POST 422 | `NO_RECEIPTS` 专用文案 |

**Modules：** `lib/tax/exportGate.ts` · `components/export/ExportEmptyTip.tsx`

### 3.5 Payment success flow

```text
PaywallSheet checkout.completed
  → onPaid: local mark + close paywall
  → pollEntitlementReady(season, 15s)
  → ready → shareTaxPack / ExportEngine generate
  → timeout → "Payment confirmed. Tap Export Again to download."
```

`PaywallSheet` Paddle init 用 `useRef(onPaid)`，避免重复初始化。

### 3.6 Est. Tax Saved persist

导出 filed 标记与 UI 省税展示 **解耦**：

- `snaptax_receipts_summary.totalTaxSaved` = 本税年全部 `done` 的 `SUM(tax_amount)`
- Export sync 写 filed → `totalTaxSaved` delta = 0
- `RECEIPT_SUMMARY_SCHEMA_VERSION` bump 触发 rebuild

---

## 4. Decision log

| Date | Old spec | Superseded by |
|------|----------|---------------|
| 2026-06-11 | `archive/specs/2026-06-11-export-optimization-bugfix-design.md` | logic-hardening + formats chain |
| 2026-06-12 | `archive/specs/2026-06-12-tax-export-engine-v2-design.md` | formats-refactor |
| 2026-06-14 | `archive/specs/2026-06-14-export-logic-hardening-design.md` | formats-refactor |
| 2026-06-15 | `archive/specs/2026-06-15-export-empty-receipts-ux-design.md` | **this topic doc** |
| 2026-06-15 | `archive/specs/2026-06-15-export-empty-tip-ux-design.md` | **this topic doc** |
| 2026-06-19 | `archive/specs/2026-06-19-export-share-download-fix-design.md` | **this topic doc** |
| 2026-06-19 | `archive/specs/2026-06-19-export-pdf-serverless-fix-design.md` | formats-enhancement |
| 2026-06-19 | `archive/specs/2026-06-19-export-formats-refactor-design.md` | formats-enhancement（CPA 结构部分） |
| 2026-07-04 | `archive/specs/2026-07-04-export-formats-enhancement-design.md` | **this topic doc** |
| 2026-07-05 | `archive/specs/2026-07-05-export-tax-saved-persist-design.md` | **this topic doc** |

**Partial supersede:** [`topics/settings-design.md`](./settings-design.md) §6 — alignment active; export filed 后 tax saved 不归零见 **this topic** §3.6。

---

## 5. Out of scope

- Onboarding 样例 CSV 导出（见 [`onboarding-aha-design.md`](./onboarding-aha-design.md) §5.5）
- QIF / QBO / OFX（M4b follow-up）
- 导出审计表、Blob signed URL 交付（方案 A）
- `currentTaxSeason()` 5–12 月返回下一年（待产品决策）
- Sandbox fallback 创建真实 entitlement

---

## 6. Archive index

| File | Role |
|------|------|
| [`archive/specs/2026-06-11-export-optimization-bugfix-design.md`](../archive/specs/2026-06-11-export-optimization-bugfix-design.md) | Export Again 全量 done、支付竞态、错误区分、分享取消 |
| [`archive/specs/2026-06-12-tax-export-engine-v2-design.md`](../archive/specs/2026-06-12-tax-export-engine-v2-design.md) | 三步 ExportEngine、双轨 CSV/CPA |
| [`archive/specs/2026-06-14-export-logic-hardening-design.md`](../archive/specs/2026-06-14-export-logic-hardening-design.md) | prepareExportSync、userAccountReceiptFilter、paid cache |
| [`archive/specs/2026-06-15-export-empty-receipts-ux-design.md`](../archive/specs/2026-06-15-export-empty-receipts-ux-design.md) | Gate 阻断、默认税年、Step 1 空年提示 |
| [`archive/specs/2026-06-15-export-empty-tip-ux-design.md`](../archive/specs/2026-06-15-export-empty-tip-ux-design.md) | Settings 黄条 5s fade |
| [`archive/specs/2026-06-19-export-formats-refactor-design.md`](../archive/specs/2026-06-19-export-formats-refactor-design.md) | ExportExpenseRow、M1–M3 格式统一 |
| [`archive/specs/2026-06-19-export-pdf-serverless-fix-design.md`](../archive/specs/2026-06-19-export-pdf-serverless-fix-design.md) | PDFKit serverless bundling |
| [`archive/specs/2026-06-19-export-share-download-fix-design.md`](../archive/specs/2026-06-19-export-share-download-fix-design.md) | canShare 门控、Save to Phone |
| [`archive/specs/2026-07-04-export-formats-enhancement-design.md`](../archive/specs/2026-07-04-export-formats-enhancement-design.md) | M4a Schedule C mirror + Audit ZIP |
| [`archive/specs/2026-07-05-export-tax-saved-persist-design.md`](../archive/specs/2026-07-05-export-tax-saved-persist-design.md) | totalTaxSaved、export 不减 UI 省税 |

---

## 7. Implemented plans

| Plan | Status |
|------|--------|
| [`archive/plans/2026-06-11-export-optimization-bugfix.md`](../archive/plans/2026-06-11-export-optimization-bugfix.md) | Done |
| [`archive/plans/2026-06-14-export-logic-hardening.md`](../archive/plans/2026-06-14-export-logic-hardening.md) | Done |
| [`archive/plans/2026-07-04-export-formats-enhancement-m4a.md`](../archive/plans/2026-07-04-export-formats-enhancement-m4a.md) | Done |
| [`archive/plans/2026-07-05-export-tax-saved-persist.md`](../archive/plans/2026-07-05-export-tax-saved-persist.md) | Done |
