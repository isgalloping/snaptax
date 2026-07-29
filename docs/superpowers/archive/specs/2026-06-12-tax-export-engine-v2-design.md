# 税季导出引擎 v2 设计

> **状态：** Implemented  
> **日期：** 2026-06-12  
> **范围：** 导出 API、三步 Bottom Sheet、IRS 映射、CSV / CPA ZIP

---

## 1. 目标

面向美国 1099 自雇承包商，在税季提供：

1. **税年选择** — 按用户时区 Jan 1–Dec 31 过滤小票  
2. **双轨导出** — CSV（TurboTax）/ CPA Audit Pack（ZIP + 小票图）  
3. **IRS Schedule C 映射** — 含 50% 餐费抵扣重算  

---

## 2. API

`POST /api/export/tax-pack`

```json
{ "taxYear": "2025", "format": "csv" | "cpa_pack" | "xlsx" }
```

门控：Google session + `currentTaxSeason()` entitlement。查询全部 `status=done`，按税年过滤。

---

## 3. 交互

`ExportEngineSheet` 三步 Bottom Sheet；入口：主屏 Export 按钮 + Settings。

`useTaxExportGate` 统一 Google / Paddle / 导出 Sheet 门控。

---

## 4. 文件

| 路径 | 职责 |
|------|------|
| `lib/tax/taxYearStats.ts` | 客户端税年统计 |
| `lib/tax/exportRows.ts` | 导出行 + IRS 重算 |
| `lib/tax/exportCsv.ts` | CSV / Summary 文本 |
| `lib/export/buildCpaPack.ts` | CPA ZIP |
| `components/export/ExportEngineSheet.tsx` | 三步 UI |
