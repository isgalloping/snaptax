# 08 — Excel 导出

## 8.1 触发条件

1. 有效 Google session
2. `season_entitlements` 本季 `paid = true`
3. `POST /api/export/tax-pack`

## 8.2 请求体

```json
{ "taxYear": "2025", "format": "csv" | "cpa_pack" | "cpa_pdf" | "txf" | "qif" | "qbo" | "xlsx" }
```

`taxYear` 缺省为 UTC **日历年**（`defaultExportTaxYear()`）；Paddle **售卖季** 为 `currentTaxSeason()`（1–4 月当年、5–12 月次年）。ExportEngine Step 1 用 `pickDefaultExportTaxYear` 优先本季 filing year。按用户时区（`X-Time-Zone`）过滤 `snap_at` / `captured_at` 所在日历年。

Canonical 业务规范：`docs/biz/export/` · 设计 topic：`docs/superpowers/topics/export-pipeline-design.md`

## 8.3 输出格式

| format | 文件名 | 说明 |
|--------|--------|------|
| `csv`（默认） | `SnapTax-{year}-TurboTax-Expenses.csv` | TurboTax 8 列（无 BOM） |
| `cpa_pack` | `SnapTax-{year}-Audit-Trail.zip` | P&L PDF + 按 Line 分目录收据 + Detail CSV |
| `cpa_pdf` | `SnapTax-{year}-Schedule-C-Mirror.pdf` | P&L 摘要（含 Income + Expenses） |
| `txf` | `SnapTax-{year}-Expenses.txf` | TXF V042 费用块（无里程汇总） |
| `qif` | `SnapTax-{year}-QuickBooks.qif` | QuickBooks/Quicken QIF（仅 deductible 行；负金额 `T`） |
| `qbo` | `SnapTax-{year}-QuickBooks-Online.qbo` | QuickBooks Online Web Connect OFX（DEBIT `STMTTRN`；稳定 `FITID`） |
| `xlsx` | `SnapTax-{year}-Tax-Pack.xlsx` | 兼容旧版 Excel |

### TurboTax CSV（`format=csv`）

UTF-8 **无 BOM**。`Amount` = 合规抵扣额（已乘 Business %）。

| 列 | 说明 |
|----|------|
| Date | `YYYY-MM-DD`（用户时区） |
| Merchant | merchant |
| Category | 人类可读科目（如 Supplies） |
| Amount | 合规抵扣额 |
| Schedule C Line | `Line 9` / `Line 22` 等 |
| Tax Deductible | Yes / No |
| Business % | `100%` / `70%` 等 |
| Receipt_Image_URL | `REC_{date}_{merchant}_{amount}.jpg` 短别名 |

### CPA Audit Pack（`format=cpa_pack`）

```
00_READ_ME_Summary.pdf
02_Expenses_Receipts_Book/Line_{NN}_{Name}/REC_*.jpg
Expenses-Detail.csv
```

不含 `03_Mileage_Log.csv`。`01_Income_Documents/` 来自 **Snap 1099** 拍摄（1099-NEC / 1099-K）。

### TXF（`format=txf`）

- 头 `V042` + 每条费用 `^` 块（TD / P / D / M / $）
- **不含** TD 2214 里程汇总行
- 非 deductible 行跳过

### QuickBooks QIF（`format=qif` · M4b · 2026-07-11）

- 头 `!Type:Cash` + `!Account:SnapTax Expenses`
- 每条费用：`D`（MM/DD/YYYY）· `T`（负抵扣额）· `P`（商户）· `LJob Expenses:{category} (Line N)` · `M`（`SNPTX{receiptId}` + 可选 notes）· `^`
- **仅** deductible 且 `exportAmount > 0` 的行（与 audit 口径一致）
- 客户端默认 **本地 IDB** 构建（`buildLocalTaxPack`）；`POST /api/export/tax-pack` 为 fallback

### QuickBooks Online QBO（`format=qbo` · M4c · 2026-07-12）

- OFX SGML 头 + `<INTU.BID>3000</INTU.BID>`（Web Connect）
- 每条费用：`<TRNTYPE>DEBIT` · `<DTPOSTED>`（YYYYMMDD000000）· `<TRNAMT>`（负抵扣额）· `<FITID>`（`SNPTX{receiptId}`）· `<NAME>`（商户 ≤32 字符）· `<MEMO>`（`Line N - Category` + 可选 notes）
- **仅** deductible 且 `exportAmount > 0` 的行（与 QIF / audit 口径一致）
- 客户端默认 **本地 IDB** 构建；`POST /api/export/tax-pack` 为 fallback

### 1099 Income 拍摄（M2b）

- Export 格式步骤 → **Snap 1099 Form** → 打开相机，`X-Capture-Kind: 1099-NEC` 上传
- Vision 专用 prompt 提取 payer / amount / form_type
- CPA Pack：`01_Income_Documents/1099_NEC_{Payer}_{date}.jpg` + P&L Part I

**Expenses-Detail.csv 列**

| 列 | 说明 |
|----|------|
| Date | ISO date |
| Merchant | merchant |
| Amount | 原始账单金额 |
| Category | 人类可读科目 |
| Schedule C Line | Line 短标签 |
| Tax Deductible | Yes / No |
| Business % | 比例 |
| Deductible Amount | 合规抵扣额 |
| Tax Saved (Est.) | `tax_amount` |
| Notes | Meals 商业目的等 |
| Receipt ID | UUID |
| Receipt Image URL | ZIP 内相对路径（同 REC 命名） |

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

## 8.4 实现

- 库：**ExcelJS**（Node 兼容）
- 生成：Serverless Function 内内存构建
- 交付：**方案 B** — `Response` 直接返回 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` 二进制流

## 8.5 客户端分享

```typescript
const file = new File([blob], filename, { type: blob.type })
if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file], title: 'SnapTax Tax Pack' })
} else {
  // trigger explicit download via Save to Phone — never fallback download on share failure
}
```

分享取消（`AbortError`）不视为错误。`canShare` 为 false 或 share 失败时 **不** 自动下载；Step 4 提供 **Save to Phone**（`<a download>`）与条件可用的 **Share** 按钮。

## 8.6 重复导出

- 无次数限制（本季 entitlement 内）
- 每次导出包含 **当前全部** `status=done` 小票（含 Export 后新拍的）
- 导出后标记 `tax_season` + `tax_season_date`（幂等，用于审计与 filed 状态；**不**减少 UI Est. Tax Saved）
- 导出成功后记录 `biz.export` 日志（`taxSeason`, `receiptCount`）

## 8.7 错误

| 场景 | HTTP | 客户端提示 |
|------|------|-----------|
| 未付费 | 402 PAYMENT_REQUIRED | 弹出 Paywall |
| 无 done 小票 | 422 NO_RECEIPTS | "No completed receipts to export. Snap some receipts first!" |
| 生成失败 | 500 | "Export failed. Please try again." |
| 离线 | — (前端拦截) | "You're offline. Connect to export." |

## 8.8 Local-first filed（csv / txf / qif / qbo / cpa_pdf / cpa_pack）

本地 pack 构建完成后，客户端调用 **`POST /api/export/filed`** 写 filed 元数据（全部可见 format 共用；`xlsx` 仍由 `tax-pack` 一并写入）。

**Auth：** Google user + 本季 `season_entitlements.paid=true`（与 tax-pack 相同）

**请求体：**

```json
{ "taxYear": "2026" }
```

**Headers：** `X-Time-Zone`（IANA，与 tax-pack 相同）

**行为：** Server 查询该用户全部 `status=done` 小票（含 bound ghost），按 `filterReceiptsByTaxYear` 过滤 `taxYear`，幂等 `updateMany` 写 `taxSeason` + `taxSeasonDate`。返回 filed 的 id 列表供客户端更新 IDB。

**响应：**

```json
{
  "taxSeason": "2026",
  "taxSeasonDate": "2026-07-08T15:00:00.000Z",
  "filedCount": 12,
  "receiptIds": ["uuid", "..."]
}
```

| 场景 | HTTP |
|------|------|
| 未付费 | 402 PAYMENT_REQUIRED |
| 该税年无 done 小票 | 422 NO_RECEIPTS |
| 未登录 | 401 UNAUTHORIZED |
