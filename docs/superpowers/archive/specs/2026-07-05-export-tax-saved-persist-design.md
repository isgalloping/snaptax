# Export 后 Est. Tax Saved 保持累计 — Design

**Date:** 2026-07-05  
**Status:** Approved (design)  
**Scope:** 用户导出小票后，首屏 Hero 与 Settings **Est. Tax Saved** 不应归零；本税年累计省税在导出后继续展示，新拍小票继续累加

**References:** [`PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) §5.1 · [`08-export.md`](../../tech/08-export.md) §8.6 · [`2026-06-29-receipt-summary-local-design.md`](./2026-06-29-receipt-summary-local-design.md) · [`2026-06-30-tax-saved-header-settings-alignment-design.md`](./2026-06-30-tax-saved-header-settings-alignment-design.md) · `snap1099-tax.mdc`

---

## 1. Problem

用户完成 **Export Tax Pack** 后：

| UI | 导出前 | 导出后（现网） | 用户期望 |
|----|--------|----------------|----------|
| Est. Tax Saved（首屏 + Settings） | 有值 | **$0.00** | **不变** |
| Receipts | 13 | 13 | 不变 |
| Deductions | $119.93 | $119.93 | 不变 |

根因：本地 `snaptax_receipts_summary.unfiledTaxSaved` 只统计 **未 filed** 的 done 小票。导出成功后服务端写入 `taxSeason` + `taxSeasonDate`，sync 回本地后 summary 扣减，顶栏归零。

这与 `Deductions` / `Receipts` 行为不一致（后两者统计全部 done 小票，不受 filed 影响），造成「导出了但成就被清空」的负面体验。

**产品决策（已确认）：** 选项 **A** — 导出不减；导出后新拍小票**继续累加**到本税年 Est. Tax Saved。

---

## 2. Goals & non-goals

### Goals

| # | 目标 |
|---|------|
| G1 | Est. Tax Saved = 当前税年 `status=done` 的 **`SUM(tax_amount)`**，**含已 filed 小票** |
| G2 | 导出成功后，首屏与 Settings 数字**不变** |
| G3 | 导出后新拍 done 小票，数字**继续增加** |
| G4 | 首屏与 Settings **同值同口径**（延续 `resolveHeaderTaxSaved`） |
| G5 | 已导出用户升级后，summary **rebuild** 恢复正确累计值 |

### Non-goals

- 修改导出 API 的 filed 写入（保留审计 / 幂等）
- 修改服务端 `GET /api/receipts` 的 `taxSavedEstimate`（仍 unfiled，UI 不消费）
- Settings 增加「已导出」状态文案（可 follow-up）
- 历史税季 UI

---

## 3. Locked decision

**方案 A — `totalTaxSaved` 替代 `unfiledTaxSaved` 作为 UI 展示真源**

- Summary 字段 **`unfiledTaxSaved` 重命名为 `totalTaxSaved`**
- 聚合公式：**去掉 `isReceiptFiled` 过滤**；`status=done` → 计入 `tax_amount`
- **保留** export filed 标记（`taxSeason` + `taxSeasonDate`），仅与 UI 省税展示解耦
- `RECEIPT_SUMMARY_SCHEMA_VERSION` **+1**，触发 watermark 校验 → rebuild 修复存量用户

**Rejected:**

- 仅改公式保留 `unfiledTaxSaved` 字段名 — 语义误导，易复发
- 停止 export filed 写入 — 丢失审计，与 `08-export.md` 冲突

---

## 4. Product semantics

| 指标 | 口径 |
|------|------|
| **Est. Tax Saved** | 当前税年（`effectiveReceiptTaxYear`）全部 `done` 小票 `SUM(tax_amount)` |
| **导出** | 交付动作；**不减少**展示数字 |
| **Export 后新小票** | 正常增量更新 `totalTaxSaved` |
| **filed** | 服务端/本地行状态；用于审计、日志、未来对账；**不参与** UI 省税扣减 |
| **Deductions** | 不变（已与 filed 无关） |

与 PRODUCT-SPEC §5.1 直读一致：`SUM(tax_amount)` for `status=done`，scoped 到当前税年。

---

## 5. Data flow

```
receipt write / merge / delete / export sync (filed flags)
        │
        ▼
receiptSummaryDelta — totalTaxSaved contribution:
  done → taxAmount (ignore filed)
        │
        ▼
snaptax_receipts_summary.totalTaxSaved
        │
        ▼
readCurrentSeasonSummary()
        │
        ├─► setTaxSaved(summary.totalTaxSaved)
        ├─► resolveHeaderTaxSaved({ seasonTotalTaxSaved })
        │
        ├─► TaxHeader (hero)
        └─► Settings TaxOverviewPanel
```

### 5.1 Export filed transition

| 事件 | `totalTaxSaved` delta | `totalDeductions` |
|------|----------------------|-------------------|
| receipt → done | +taxAmount | +deduction |
| export marks filed | **0**（不再扣减） | 0 |
| taxAmount 变更（done） | ±差值 | 重算 |
| 新拍 done（导出后） | +taxAmount | +deduction |

---

## 6. Code changes

| 文件 | 变更 |
|------|------|
| `lib/storage/receiptSummaryTypes.ts` | `unfiledTaxSaved` → `totalTaxSaved`；`RECEIPT_SUMMARY_SCHEMA_VERSION` 1→2；`byQuarter` 子字段同步 |
| `lib/storage/receiptSummaryDelta.ts` | `unfiledTaxContribution` 去掉 `isReceiptFiled`；delta 字段重命名 |
| `lib/storage/receiptSummary.ts` | build/apply/read 全用 `totalTaxSaved`；`readCurrentSeasonTotalTaxSaved()` |
| `lib/storage/receiptSummaryDelta.test.ts` | filed 仍计入；export 过渡 delta=0 |
| `lib/storage/receiptSummary.test.ts` | 更新断言 |
| `lib/storage/receiptDbClearLocalData.test.ts` | 更新字段名 |
| `lib/client/resolveHeaderTaxSaved.ts` | `seasonUnfiledTaxSaved` → `seasonTotalTaxSaved` |
| `lib/client/resolveHeaderTaxSaved.test.ts` | 参数重命名 |
| `components/home/HomeScreen.tsx` | `summary.totalTaxSaved` |
| `components/home/OfflineHomeShell.tsx` | 同上 |
| `docs/tech/08-export.md` §8.6 | filed 用途改为审计/幂等，非 UI 扣减 |
| 修订引用 spec | 删除「Export filed 后下降」验收 |

**保留不变：**

- `app/api/export/tax-pack/route.ts` filed `updateMany`
- `lib/receipts/filedStatus.ts`
- `lib/client/receiptApi.ts` / `sumUnfiledLocalTaxSavedIndexed`（测试/对账，生产 UI 禁止）

---

## 7. Migration

1. Bump `RECEIPT_SUMMARY_SCHEMA_VERSION` to `2`
2. 现有 IDB 行仍含 `unfiledTaxSaved` 键 — watermark 校验见 version mismatch → `rebuildCurrentSeasonSummary()`
3. Rebuild 从 receipt 行全量重算 `totalTaxSaved`（新公式）
4. 已导出用户首次打开升级版本后，Est. Tax Saved 自动恢复为正确累计值

**向后兼容（单次读取）：** rebuild 路径不依赖旧字段；若读旧行且 version 未 bump，由 idle verify 触发 rebuild。

---

## 8. Error handling

| 场景 | 行为 |
|------|------|
| Summary 未 bootstrap | `$0`；与现网一致 |
| Export sync 延迟 | filed 写入不影响 `totalTaxSaved`；无 UI 闪烁 |
| Summary / receipt 漂移 | watermark rebuild（现网机制） |
| Onboarding demo | `displayTaxSaved` 覆盖仍优先；与 summary 无关 |

---

## 9. Testing

| 类型 | 内容 |
|------|------|
| Unit | `computeSummaryDelta`：done+filed 计入 `totalTaxSaved` |
| Unit | export filed 过渡（unfiled→filed）：`totalTaxSaved` delta = 0 |
| Unit | `resolveHeaderTaxSaved` 使用 `seasonTotalTaxSaved` |
| Unit | `buildSeasonSummaryFromReceipts` 混合 filed/unfiled |
| Manual | 有省税 → Export → 首屏 === Settings，均不变 |
| Manual | Export 后再拍 1 张 → 两栏同步增加 |
| Manual | 升级后已导出用户 → rebuild 后数字恢复 |

---

## 10. Acceptance

1. 导出完成后，首屏 Est. Tax Saved === Settings Est. Tax Saved，且与导出前相差 ≤ $0.01
2. 导出后新 done 小票使两者同步增加
3. `totalTaxSaved` 公式 = 当前税年 done `SUM(tax_amount)`，不检查 filed
4. Export API 仍写入 filed 字段
5. 存量用户升级后 rebuild 恢复正确累计值

---

## 11. Follow-up (out of scope)

- Settings 在已导出季显示 subtle「Exported」状态（不影响数字）
- Server `taxSavedEstimate` 增加税年过滤用于 drift 对账 UI
