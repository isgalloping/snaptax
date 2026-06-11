# 08 — Excel 导出

## 8.1 触发条件

1. 有效 Google session
2. `season_entitlements` 本季 `paid = true`
3. `POST /api/export/tax-pack`

## 8.2 输出格式

**文件名：** `Snap1099-{taxSeason}-Tax-Pack.xlsx`

**Sheet: Expenses**

| 列 | 说明 |
|----|------|
| Date | `snap_at` or `captured_at` in user's timezone (`X-Time-Zone`); US `MM/DD/YYYY`, EU `DD/MM/YYYY` |
| Merchant | merchant |
| Amount | amount USD |
| Category | category |
| Deductible | Yes/No |
| Tax Saved | `tax_amount` |
| IRS Schedule | `irsScheduleLabel(category)` — maps to Schedule C line references |
| Notes | 空或 AI notes |

**Sheet: Summary**

| 字段 | 值 |
|------|-----|
| Tax Season | 2026 |
| Total Expenses | sum |
| Est. Deductible | sum deductible |
| Est. Tax Saved | sum tax_amount |
| Industry | user.industry |
| Data Region | user.data_region |
| Exported At | local timestamp (`X-Time-Zone`); US 12h, EU 24h |

> MVP 满足 CPA / TurboTax 手动导入；列顺序对标 IRS Schedule C 常见字段（非官方 XML）。

## 8.3 实现

- 库：**ExcelJS**（Node 兼容）
- 生成：Serverless Function 内内存构建
- 交付：**方案 B** — `Response` 直接返回 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` 二进制流

## 8.4 客户端分享

```typescript
const res = await fetch('/api/export/tax-pack', { method: 'POST' })
const blob = await res.blob()
const file = new File([blob], filename, { type: blob.type })
await navigator.share({ files: [file], title: 'Snap1099 Tax Pack' })
```

分享取消（`AbortError`）不视为错误；其他 share 失败回退 `<a download>` 下载。

## 8.5 重复导出

- 无次数限制（本季 entitlement 内）
- 每次导出包含 **当前全部** `status=done` 小票（含 Export 后新拍的）
- 导出后标记 `tax_season` + `tax_season_date`（幂等，用于 Est. Tax Saved 排除已归档小票）
- 导出成功后记录 `biz.export` 日志（`taxSeason`, `receiptCount`）

## 8.6 错误

| 场景 | HTTP | 客户端提示 |
|------|------|-----------|
| 未付费 | 402 PAYMENT_REQUIRED | 弹出 Paywall |
| 无 done 小票 | 422 NO_RECEIPTS | "No completed receipts to export. Snap some receipts first!" |
| 生成失败 | 500 | "Export failed. Please try again." |
| 离线 | — (前端拦截) | "You're offline. Connect to export." |
