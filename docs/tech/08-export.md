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
| Notes | 空或 AI notes |

**Sheet: Summary**

| 字段 | 值 |
|------|-----|
| Tax Season | 2026 |
| Total Expenses | sum |
| Est. Deductible | sum deductible |
| Industry | user.industry |
| Exported At | local timestamp (`X-Time-Zone`); US 12h, EU 24h |

> MVP 满足 CPA / TurboTax 手动导入；列顺序对标 IRS Schedule C 常见字段（非官方 XML）。

## 8.3 实现

- 库：**ExcelJS**（Node 兼容）
- 生成：Serverless Function 内内存构建
- 交付：
  - **方案 A：** 写 Vercel Blob temporary → signed URL（1h TTL）
  - **方案 B：** `Response` stream `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

推荐 **B** 简单场景；大文件用 A。

## 8.4 客户端分享

```typescript
const res = await fetch('/api/export/tax-pack', { method: 'POST' })
const blob = await res.blob()
const file = new File([blob], filename, { type: blob.type })
await navigator.share({ files: [file], title: 'Snap1099 Tax Pack' })
```

## 8.5 重复导出

- 无次数限制（本季 entitlement 内）
- 每次导出包含 **当前全部** done 状态小票（含 Export 后新拍的）
- 不记录单次导出日志（MVP）；可选 audit 表后续加

## 8.6 错误

| 场景 | HTTP |
|------|------|
| 未付费 | 402 PAYMENT_REQUIRED |
| 无小票 | 422 + 提示先拍照 |
| 生成失败 | 500 |
