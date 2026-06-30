# Est. Tax Saved 首屏 ↔ Settings 对齐 — Design

**Date:** 2026-06-30  
**Status:** Approved (design)  
**Scope:** 在线场景下首屏 `TaxHeader` 与 Settings `TaxOverviewPanel` 的 **Est. Tax Saved** 数值不一致

**References:** [`2026-06-29-receipt-summary-local-design.md`](./2026-06-29-receipt-summary-local-design.md) · [`2026-06-07-tax-savings-regional-design.md`](./2026-06-07-tax-savings-regional-design.md) · [`PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) §5.1

---

## 1. Problem

用户在线 sync 后，首屏 **Est. Tax Saved** 与 Settings **Est. Tax Saved** 不一致。

| UI | 当前数据源 | 聚合范围 |
|----|-----------|----------|
| 首屏 `TaxHeader` | `displayTaxSaved ?? taxSaved`；在线时 `taxSaved` ← 服务端 `taxSavedEstimate` | 该 actor **全部** unfiled done 小票（**不限税年**） |
| Settings `TaxOverviewPanel` | `seasonSummary.unfiledTaxSaved` | **当前税季** unfiled done（本地 IDB summary） |

Phase A 已将 Settings 切到 `snaptax_receipts_summary`，但 `HomeScreen.refreshTaxAndSummary` 仍保留历史逻辑：**在线优先 API aggregate**，导致双真源。

典型触发：本地存在**上一税季**未 filed 小票，或 sync 后 summary 与 server aggregate 口径不同。

---

## 2. Goal & non-goals

### Goals

| # | 目标 |
|---|------|
| G1 | 首屏与 Settings 的 Est. Tax Saved **同值、同口径**（当前税季 unfiled `SUM(tax_amount)`） |
| G2 | 完成 Phase A 遗留：`readCurrentSeasonSummary()` 为 UI **唯一展示真源** |
| G3 | Onboarding demo 覆盖仍仅作用于**展示层**，首屏与 Settings **同步** |

### Non-goals

- 修改 `GET /api/receipts` 的 `taxSavedEstimate` 聚合 SQL（保留字段，UI 不再消费）
- 首屏 Receipts 副行 / Deductions 对齐（另 spec）
- 历史税季 UI

---

## 3. Locked decision

**方案 A — 单一本地 summary 为展示真源（已批准）**

```
displayTaxSaved ?? seasonSummary.unfiledTaxSaved
```

- **禁止**在线 sync / watcher 用 `taxSavedEstimate` 写入 UI state
- `taxSavedEstimate` 保留于 API 响应，供未来 drift 对账或 telemetry，**不进 React tax display state**

---

## 4. Data flow

```
receipt write / merge / delete
        │
        ▼
snaptax_receipts_summary (current tax year)
        │
        ▼
readCurrentSeasonSummary()
        │
        ├─► setSeasonSummary(summary)
        ├─► setTaxSaved(summary.unfiledTaxSaved)   // 始终 summary，无 apiEstimate 分支
        │
        ├─► TaxHeader: displayTaxSaved ?? taxSaved
        │
        └─► SettingsTaxStats.taxSaved: displayTaxSaved ?? seasonSummary.unfiledTaxSaved
```

### 4.1 Onboarding

| Stage | `displayTaxSaved` | 首屏 & Settings |
|-------|-------------------|-----------------|
| `stage_1` | `0` | 均显示 `$0` |
| `stage_aha` | demo `taxAmount` 或 `ONBOARDING_DEMO_TAX_SAVED` | 均显示 demo 值 |
| `completed` | `null` → 读 summary | 均显示 `unfiledTaxSaved` |

Settings 不再在 onboarding 期间单独读 summary 而忽略 `displayTaxSaved`。

### 4.2 `taxSavedEstimate` 降级

| 调用点 | 变更 |
|--------|------|
| `refreshTaxAndSummary(apiEstimate?)` | 移除 `apiEstimate` 参数；始终 `setTaxSaved(summary.unfiledTaxSaved)` |
| `refreshTaxSaved(_next, apiEstimate?)` | 同上，签名简化为无 estimate |
| `applyMergeNow` / `applyReceiptUpdate` / `applyFromApi` | 停止向 refresh 传递 estimate |
| `ProcessingReceiptWatcher.onTaxSaved` | 改为 `void refreshTaxAndSummary()`（re-read summary after settle） |
| `mergeServerReceiptsIntoLocal` | 仍返回 `taxSavedEstimate`（API 不变）；调用方忽略 UI 用途 |

---

## 5. Code changes

| 文件 | 变更 |
|------|------|
| `components/home/HomeScreen.tsx` | 简化 refresh；统一 `settingsTaxStats.taxSaved`；watcher callback |
| `components/home/OfflineHomeShell.tsx` | 若存在 estimate 路径则对齐（当前已只用 summary，核对即可） |
| `lib/client/processingReceiptWatcher.ts` | `onTaxSaved` 语义改为「触发 summary 刷新」；可选 rename callback |

**`settingsTaxStats` 统一公式：**

```typescript
const headerTaxSaved = displayTaxSaved ?? seasonSummary?.unfiledTaxSaved ?? taxSaved;

// settingsTaxStats.taxSaved = headerTaxSaved（summary 未 bootstrap 时 fallback 同 Phase A）
```

---

## 6. Error handling

| 场景 | 行为 |
|------|------|
| Summary store 未 bootstrap | `readCurrentSeasonSummary()` 返回空桶 → `$0`；与 Phase A fallback 一致 |
| Summary verify rebuild 中 | 展示上一帧 state；rebuild 完成后 refresh 一次 |
| 离线 | 与在线相同路径（已无 API 覆盖） |
| API `taxSavedEstimate` 与 summary 漂移 | **不阻塞 UI**；可选 dev-only `console.debug` 当 `|delta| > 0.01` |

---

## 7. Testing

| 类型 | 内容 |
|------|------|
| Unit | `refreshTaxAndSummary` 在传入 mock apiEstimate 时仍 set summary 值（若保留过渡参数则测忽略行为） |
| Unit | `settingsTaxStats` / header 共用 derived `headerTaxSaved` helper 测试 |
| Manual | 在线：造跨税年 unfiled 小票 → 首屏 === Settings |
| Manual | Onboarding stage_aha → 进 Settings → Est. Tax Saved 与首屏 demo 一致 |
| Manual | Export filed 后 → 两者同步下降 |

---

## 8. Acceptance

1. 在线 sync 后，首屏 Est. Tax Saved === Settings Est. Tax Saved（±$0.01 四舍五入）
2. 口径 = 当前税季 unfiled done `SUM(tax_amount)`（与 `snap1099-tax.mdc` 一致，scoped 到税季）
3. 生产 UI 路径不再调用 `setTaxSaved(apiEstimate)`
4. Onboarding 期间首屏与 Settings 同步 demo 覆盖

---

## 9. Follow-up (out of scope)

- 首屏 Receipts 计数 / tracked 副行与 Settings Receipts / Deductions 对齐（Phase A spec §7 剩余项）
- Server `taxSavedEstimate` 增加 `taxSeason` 过滤（若未来需要 server-side 对账）
