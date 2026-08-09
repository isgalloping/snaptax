# Export 向导移除 1099 卡 — 设计

**日期：** 2026-08-09  
**状态：** 已批准

## 背景

1099 拍照入口在 Settings `TaxExportCard` 与 Export Step 2 底部重复。用户已在 Settings 完成收入表单采集；Export 向导应聚焦格式选择与导出。

## 范围

| 项 | 决策 |
|---|---|
| Export Step 2 | **删除**底部「1099 INCOME FORMS」卡及 NEC/K 按钮 |
| Settings | **保留** `TaxExportCard` Snap 1099-NEC/K |
| 数据/导出 | 不变；已拍 1099 仍计入 `incomeFormsLabel` 与 Audit Pack |

## 实现

- `ExportEngineSheet`：移除 1099 卡 JSX、`onSnap1099` prop、`setPendingIncomeCapture` 调用
- `useTaxExportGate`：移除 `onSnap1099` 选项与传递
- `HomeScreen`：移除 `useTaxExportGate({ onSnap1099 })`；保留 `SettingsScreen onSnap1099`
- i18n：删除 `exportEngine.snap1099Title/Hint/NecButton/KButton`（保留 `settings.taxExportCard.snap1099Nec/K`）

## 非目标

- 不改 Export I-01/I-02 等待项
- 不改 Settings 1099 UX
