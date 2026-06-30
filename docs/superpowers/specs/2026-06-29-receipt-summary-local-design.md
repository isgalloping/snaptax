# 本地小票汇总表（snaptax_receipts_summary）— Design

**Date:** 2026-06-29  
**Status:** Approved (design)  
**Phase:** A — implement before [receipt-sync-recovery-design](./2026-06-29-receipt-sync-recovery-design.md) (Phase B)

**References:** [`DB-DESIGN-SPEC.md`](../../tech/DB-DESIGN-SPEC.md) §2.2 · [`12-local-image-storage-design.md`](../../tech/12-local-image-storage-design.md) · [`2026-06-07-tax-savings-regional-design.md`](./2026-06-07-tax-savings-regional-design.md) · [`2026-06-19-receipt-lifecycle-sync-redesign-design.md`](./2026-06-19-receipt-lifecycle-sync-redesign-design.md) (partial overlap; filed/merge rules **this spec wins** for summary)

---

## 1. Problem

1. **顶栏 Est. Tax Saved** 每次调用 `sumUnfiledLocalTaxSavedIndexed()`，对 `snaptax_receipts` 索引 reduce；小票增多后启动/刷新成本上升。
2. **设置页 Tax Overview** 从可见列表（最多 100 条）`useMemo` 统计，`receiptCount` / deductions 与全量本地库不一致。
3. 未来需要按 **抵扣分类**、**季度** 扩展统计，不宜在 UI 层重复扫表。

---

## 2. Goals & non-goals

### Goals

| # | 目标 |
|---|------|
| G1 | 新增 IndexedDB store **`snaptax_receipts_summary`**，维护**当前税季**聚合指标 |
| G2 | 顶栏 / 设置只读 summary，禁止生产 UI 全表 scan |
| G3 | **写路径增量** + 启动 idle **watermark 校验**（不一致则 rebuild 当年桶） |
| G4 | Schema 预留 **`byCategory`** / **`byQuarter`**，Phase A 不写入，统计公式与现网 `taxYearStats` 一致 |
| G5 | **`totalReceiptCount`** = 当年全部 status（done / processing / blurry），与 Settings 语义一致 |
| G6 | Summary 跟 **本地 receipt 行**重算；服务端 merge 写回本地后触发 delta/rebuild（服务端为 1.5 年权威备份，见 Phase B spec） |

### Non-goals (Phase A)

- 历史税季 UI（蓝领不关注；不读旧桶）
- 按分类/季度的 UI 展示（仅 schema 预留）
- 服务端 PG 汇总表
- 修改 OCR / 省税 Path A/B（已存在，见 §8 验收）

---

## 3. Locked decisions

| 主题 | 选择 |
|------|------|
| Store 名 | `snaptax_receipts_summary` |
| IDB 版本 | v6 → **v7**（创建 store + bootstrap） |
| 活跃范围 | **仅当前税季**一行（`scopeKey = "{taxYear}"`） |
| taxYear 规则 | `effectiveReceiptTaxYear`（1099 收入票用 `incomeTaxYear`，否则 `receiptTaxYear(timestamp)`）— 复用 `lib/tax/taxYearStats.ts` |
| unfiledTaxSaved | `status=done` 且 **未 filed**（`!(taxSeason && taxSeasonDate)`）的 `SUM(tax_amount)` |
| totalReceiptCount | 当年 **所有 status** 计数 |
| filed 后 merge | **跟 receipt 行重算** summary；Export 时 unfiledTaxSaved 扣减；服务端 merge 改 taxAmount 时 **允许** summary 更新 |
| 一致性 | 写路径 hook + idle watermark 校验 → **rebuild 当年桶** |
| 实现方案 | **独立 store + receiptDb 写 hook**（非 Worker） |

---

## 4. Data model

### 4.1 Object store

| 项 | 值 |
|----|-----|
| 名称 | `snaptax_receipts_summary` |
| keyPath | `scopeKey`（string） |
| Phase A 行数 | 1（当前税季） |

### 4.2 Row: `ReceiptSeasonSummary`

```typescript
type ReceiptSeasonSummary = {
  scopeKey: string;           // "2026"
  taxYear: number;            // 2026
  unfiledTaxSaved: number;
  totalReceiptCount: number;  // all statuses in tax year
  totalDeductions: number;    // taxYearDeductions formula
  incomeFormCount: number;
  totalIncomeGross: number;
  byCategory?: Record<string, { deductions: number; count: number }>;
  byQuarter?: Record<1 | 2 | 3 | 4, {
    unfiledTaxSaved: number;
    totalReceiptCount: number;
  }>;
  lastUpdatedMs: number;
};
```

Phase A：`byCategory` / `byQuarter` **省略或空**；rebuild 不填充。

### 4.3 System meta watermark

Key: `receipt_summary_watermark` in `snaptax_system_meta`

```typescript
{
  maxUpdatedAtMs: number;
  receiptCountInCurrentSeason: number;
  schemaVersion: 1;
}
```

Idle 校验（≥30s，`requestIdleCallback`）：比对 watermark 与当年 receipt 聚合；漂移 → `rebuildCurrentSeasonSummary()`。

---

## 5. Delta rules

`applyReceiptSummaryDelta(prev, next)` — 仅当 receipt 的 **effective taxYear === 当前税季** 时更新 summary。

| 事件 | unfiledTaxSaved | totalReceiptCount | deductions / income |
|------|-----------------|-------------------|---------------------|
| insert（当年） | +taxAmount if done & !filed | +1 | 重算字段 |
| status → done | +taxAmount if !filed | 不变（已计数） | 重算 |
| taxAmount 变更 | ±差值 if done & !filed | 不变 | 重算 |
| Export filed | −taxAmount | 不变 | 重算（deductions 仍含 filed done） |
| delete（当年） | 反向 | −1 | 重算 |
| 跨年 receipt | 旧年不计入 Phase A 行 | — | — |

**filed 判定：** `isReceiptFiled(receipt)`（`taxSeason` + `taxSeasonDate` 均有值）。

---

## 6. Module boundaries

| 模块 | 职责 |
|------|------|
| `lib/storage/idbStores.ts` | `IDB_STORE_RECEIPT_SUMMARY` 常量 |
| `lib/storage/receiptSummary.ts` | read / delta / rebuild / watermark |
| `lib/storage/receiptSummaryDelta.ts` | `computeDelta(prev, next)` |
| `lib/client/receiptSummaryVerify.ts` | idle verify + schedule |
| `lib/storage/receiptDb.ts` | `saveReceipt` / `deleteReceipt` 后调用 delta |
| `lib/tax/taxYearStats.ts` | **唯一** deductions/income 公式来源 |

### 6.1 Write hooks（须全覆盖）

- `receiptDb.saveReceipt`
- `receiptDb.deleteReceipt`
- `persistMergedReceipts`（每行 merge 后）
- Export filed 批量更新本地
- v7 migration：`rebuildCurrentSeasonSummary` 全量 bootstrap

### 6.2 Public read API

```typescript
readCurrentSeasonSummary(): Promise<ReceiptSeasonSummary>
readCurrentSeasonUnfiledTaxSaved(): Promise<number>
```

---

## 7. UI changes

| 位置 | 现况 | 目标 |
|------|------|------|
| HomeScreen / TaxHeader | `sumUnfiledLocalTaxSavedIndexed()` | `readCurrentSeasonUnfiledTaxSaved()` |
| SettingsTaxStats | 可见 100 条 `useMemo` | `readCurrentSeasonSummary()` |
| `receiptCount` | `displayReceipts.length` | `totalReceiptCount`（当年全 status） |

保留 `sumUnfiledLocalTaxSavedIndexed` **仅测试 / verify 对照**，生产 UI 禁止调用。

---

## 8. OCR / 省税路径（优化 2 — 不实现）

**已满足。** 客户端 Tesseract → `ocrDraft` → upload → `routeStandardReceiptTax`：

- Path A：`classifyReceiptText` + `computeTaxAmount`
- Path B：`shouldUseVisionFallback` → Vision

Phase A 验收：现有测试 + 上传带 `ocrDraft` 时 `aiRaw.extractionSource = local_ocr` 仍成立。

---

## 9. Migration (v6 → v7)

1. `onupgradeneeded`：create `snaptax_receipts_summary`
2. `system_meta.receipt_summary_bootstrap = "pending"`
3. 首次 `openDb` 成功后 idle：`rebuildCurrentSeasonSummary` + watermark
4. 更新 `DB-DESIGN-SPEC.md` §2.2 store 注册表

---

## 10. Testing

| 测试 | 断言 |
|------|------|
| `receiptSummaryDelta.test.ts` | done / filed / delete / taxAmount delta |
| `receiptSummaryVerify.test.ts` | watermark 漂移 → rebuild 一致 |
| 对照 | `rebuildCurrentSeasonSummary` === 当年全表 scan 旧逻辑 |
| filed + merge | 服务端 taxAmount 写回本地后 summary 更新 |

---

## 11. Acceptance

1. DevTools → `snaptax_receipts_summary` 有当前年一行；顶栏刷新不触发全表 `byFiledStatus` scan（Network/Performance 可观测）。
2. Settings Receipts = 当年 **totalReceiptCount**（含 processing），与本地库 count 一致（非 UI 100 窗口）。
3. Export 后顶栏 unfiledTaxSaved 下降；done 总张数不变。
4. 单元测试通过；`npm run test:unit` 无回归。

---

## 12. Related

- Phase B：[2026-06-29-receipt-sync-recovery-design.md](./2026-06-29-receipt-sync-recovery-design.md)
- Supersedes：本 spec 中 filed/summary 规则优先于 lifecycle redesign draft 中「done lock 不影响 summary」的隐含假设
