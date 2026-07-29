# 导出格式重构设计（方案 C v2）

> **状态：** Approved（范围已确认）  
> **日期：** 2026-06-19  
> **Canonical 业务规范：** `docs/biz/export/`  
> **前置：** Export Engine v2 · Share 二次下载修复 · PDF serverless 修复

---

## 1. 目标

将 TurboTax CSV、CPA Audit Pack、TXF 三格式统一到 **单一行模型 + 集中 mapping 层**，对齐 `docs/biz/export/` 业务 demo，并明确 MVP 边界。

| 格式 | 输出 | MVP |
|------|------|-----|
| TurboTax CSV | `Snap1099-{year}-TurboTax-Expenses.csv` | M1 |
| CPA Audit Pack | `Snap1099-{year}-CPA-Audit-Pack.zip` | M2 |
| TXF | `Snap1099-{year}-Expenses.txf` | M3 |

---

## 2. 范围确认（产品决策）

### 2.1 纳入

| 项 | 说明 |
|----|------|
| **Expenses 按 Line 分目录** | `02_Expenses_Receipts_Book/Line_{NN}_{Name}/REC_*.jpg` |
| **P&L Summary PDF** | `00_READ_ME_Summary.pdf`；MVP **仅 Expenses 段**（Income 占位文案） |
| **TurboTax 7+1 列** | 7 列 biz 标准 + **保留 `Receipt_Image_URL`**（短别名/相对路径，见 §4.3） |
| **行级业务规则** | 0 抵扣 → Personal；Meals Notes；去重（`export-biz.md` §细节说明） |
| **01_Income_Documents** | 通过 **年底拍 1099 税表** 模式采集（新 capture 类型，M2b） |

### 2.2 明确不做

| 项 | 说明 |
|----|------|
| **`03_Mileage_Log.csv`** | 产品无 GPS 里程模块；**永久 Out of scope** |
| **TXF TD 2214 里程汇总行** | 同上 |
| **P&L Part I 实数 Income** | 依赖 1099 拍摄模式；MVP Summary 注明 *Expenses only* |
| **SSN / NAICS 自动填充** | 用户/CPA 手工；PDF 模板留空位 |

---

## 3. Gap 与修正（相对现实现）

| 维度 | 现实现 | 目标 |
|------|--------|------|
| TurboTax 列 | 6 列 + BOM | **8 列**（7 biz + `Receipt_Image_URL`），**无 BOM** |
| Amount 语义 | 原始 `amount` | **合规抵扣额**（已乘 Business %） |
| Category | `Line 22: Supplies` | 人类可读名 `Supplies` / `Office Expenses` |
| Schedule C Line | 合并在 IRS_Category | 独立列 `Line 18` |
| Business % | 无 | `100%` / `70%` / `80%` |
| 图片 URL | 7 天 presigned Blob（数百字符） | **REC 别名或 ZIP 内相对路径** |
| CPA ZIP | 扁平 `receipts/` + txt summary | 分 Line 目录 + P&L PDF + 规范 REC 命名 |
| TXF | 无 | V042 + TD 块 |
| Income 文件夹 | 无 | M2b：1099 拍摄 → `01_Income_Documents/` |

---

## 4. 统一数据模型

### 4.1 `ExportExpenseRow`（扩展）

在现有 `lib/tax/exportRows.ts` 基础上，mapping 层产出：

| 字段 | 用途 |
|------|------|
| `categoryDisplay` | TurboTax `Category` 列（人类可读） |
| `scheduleCLine` | `Line 9` / `Line 18`（不含科目名） |
| `taxDeductible` | `Yes` / `No` |
| `businessPercent` | `100%` / `70%`（展示用；Amount 已为乘后值） |
| `receiptAlias` | `REC_{YYYYMMDD}_{Merchant}_{Amount}.jpg` |
| `receiptArchivePath` | ZIP 内完整相对路径 |
| `notes` | Meals 商业目的等 |

**行级规则（`buildExportExpenseRow`）：**

- `deductibleAmount === 0` → `categoryDisplay = Personal`，`scheduleCLine` 空或 N/A，`taxDeductible = No`
- MEALS → `notes` 必填或默认提示 CPA 补全
- 同商户同金额同日期 → 导出前去重（或 Notes 标记 duplicate review）

### 4.2 Mapping 层

新模块 `lib/export/mapping/`：

| 文件 | 职责 |
|------|------|
| `exportCategoryMapping.ts` | App category → Line / 显示名 / ZIP 文件夹名 |
| `receiptNaming.ts` | `buildReceiptAlias()`、`buildReceiptArchivePath()` |
| `scheduleCLabels.ts` | Line 短标签与 P&L 行汇总 |

Golden 文件（测试基准）：

- `docs/biz/export/TurboTax-format.csv`
- `docs/biz/export/cpa-audit-specs.txt`
- `docs/biz/export/txf-format.txt`
- `docs/biz/export/P&LSummary.md`

### 4.3 `Receipt_Image_URL` 策略（已确认）

遵循 `export-biz.md` §细节说明：

> 保留收据（Receipt_Image_URL）：确保在最终打包给 CPA 时，最后一列的收据图片链接或原图是真实对应且可以打开的。

**原则：用短别名替代长 presigned URL。**

| 导出场景 | `Receipt_Image_URL` 值 | 可打开性 |
|----------|-------------------------|----------|
| **CPA Audit Pack（ZIP 内 CSV）** | ZIP 根相对路径，如 `02_Expenses_Receipts_Book/Line_22_Supplies/REC_20250315_HomeDepot_125.50.jpg` | CPA 解压后 Excel 可点击相对路径打开同包内图片 |
| **独立 TurboTax CSV** | 仅别名 `REC_20250315_HomeDepot_125.50.jpg` | 作为与 CPA 包内文件的 **交叉引用**；完整原图请导出 CPA Pack |
| **CPA Pack 内嵌图片** | 磁盘文件名 = `receiptAlias`（非 `IMG_0023.png` / 非 UUID） | 与 CSV 列一致 |

**实现要点：**

- 废弃 CSV 中的 7 天 Blob presigned URL（`lib/export/receiptImageUrl.ts` 仅用于 PDF 内链等仍需 HTTP 的场景，或改为短链 API 后续 PR）
- `buildCpaPackZip`：`archive.append(image, { name: row.receiptArchivePath })`
- 同一张收据在 ZIP 内 **只存一份**；CSV 行指向该路径
- Merchant 段 sanitize：`[^a-zA-Z0-9]` → 删除，长度上限 40（与现 `safeReceiptFilename` 类似）

**别名格式：**

```
REC_{YYYYMMDD}_{MerchantSanitized}_{AmountWith2Decimals}.jpg
```

示例：`REC_20250315_HomeDepot_125.50.jpg`

---

## 5. TurboTax CSV（M1）

### 5.1 列定义

```csv
Date,Merchant,Category,Amount,Schedule C Line,Tax Deductible,Business %,Receipt_Image_URL
2026-03-15,Home Depot,Supplies,125.50,Line 22,Yes,100%,REC_20260315_HomeDepot_125.50.jpg
```

| 列 | 规则 |
|----|------|
| Date | `YYYY-MM-DD`（用户时区） |
| Merchant | 商户名 |
| Category | mapping 人类可读名 |
| Amount | **合规抵扣额**（`deductibleAmount`） |
| Schedule C Line | `Line 9` 等（不含科目文字） |
| Tax Deductible | `Yes` / `No` |
| Business % | `100%` / `70%` / `80%` |
| Receipt_Image_URL | §4.3 别名或相对路径 |

### 5.2 编码

- **UTF-8 或 ASCII，禁止 BOM**（TurboTax 批量导入要求）
- RFC 4180 转义

### 5.3 共用 builder

- Server：`buildTurboTaxCsv()` in `lib/tax/exportCsv.ts`
- Client preview：`buildLocalTurboTaxCsv()` 同一套列与规则（离线无 URL 时 URL 列空）

---

## 6. CPA Audit Pack（M2）

### 6.1 MVP 目录结构（M2a）

```
Snap1099-2025-CPA-Audit-Pack.zip
├── 00_READ_ME_Summary.pdf          # Expenses-only P&L + 说明 Income 需 1099 拍摄
├── 02_Expenses_Receipts_Book/
│   ├── Line_09_Car_and_Truck/
│   │   └── REC_20260402_ChevronGas_45.00.jpg
│   ├── Line_18_Office_Expenses/
│   │   ├── REC_20260115_OpenAI_20.00.jpg
│   │   └── REC_20260201_Vercel_40.00.jpg
│   └── Line_22_Supplies/
│       └── REC_20260315_HomeDepot_125.50.jpg
└── Expenses-Detail.csv             # FULL 列（含 Notes、Receipt_Image_URL 相对路径）
```

**不包含：** `03_Mileage_Log.csv`、`01_Income_Documents/`（M2a）

### 6.2 1099 Income（M2b — 年底拍 1099 模式）

| 项 | 设计 |
|----|------|
| 触发 | 用户选择「拍摄 1099 税表」或 Settings/Export 内 Income 入口 |
| 存储 | 新 receipt 类型或 `documentKind: "1099-NEC" \| "1099-K"` |
| ZIP 路径 | `01_Income_Documents/1099_NEC_{Payer}.pdf` 或 `1099_NEC_{Payer}_{YYYYMMDD}.jpg` |
| P&L | Part I Income 行填入汇总；凭证数量对齐 |

依赖 AI 从 1099 表提取 payer / amount（与现有 Vision 流水线一致）。

### 6.3 移除/替代

- 删除扁平 `receipts/` 目录
- `Summary-by-Line.txt` → 合并进 `00_READ_ME_Summary.pdf`（P&LSummary 模板）

---

## 7. TXF（M3）

对齐 `docs/biz/export/txf-format.txt`：

- 头：`V042`
- 每条：`^` 分隔；`TD` 码；`P` 商户；`D` `MM/DD/YYYY`；`M` 备注；`$` 金额
- **不含** 里程汇总行（TD 2214）
- API：`format: "txf"`；ExportEngine 第四选项

Category → TD 映射表先覆盖现有 8 类 + demo 3 条；完整表后续 PR（PDF 核对）。

---

## 8. 里程碑

| 阶段 | 交付 |
|------|------|
| **M0** | 本 spec + `lib/export/mapping/*` + golden 测试夹具 + 更新 `docs/tech/08-export.md` |
| **M1** | TurboTax 8 列、无 BOM、Business %、REC 别名 URL、golden test |
| **M2a** | CPA ZIP 新结构、REC 命名、Expenses-only P&L PDF、Detail CSV 相对路径 |
| **M2b** | 1099 拍摄模式 + `01_Income_Documents/` + P&L Income 实数 |
| **M3** | TXF builder + API + UI |

---

## 9. 测试

| 类型 | 内容 |
|------|------|
| Golden | TurboTax 行与 `TurboTax-format.csv` 逐列对比（允许 Merchant 大小写） |
| Golden | ZIP 目录树与 `cpa-audit-specs.txt` 一致（无 Mileage） |
| Unit | `buildReceiptAlias` sanitize、去重、0 抵扣 → Personal |
| Unit | CSV 无 BOM 头 `\uFEFF` |
| Integration | `POST /api/export/tax-pack` 各 format 快照 |

---

## 10. ExportEngine UI

| format | 卡片文案 | 文件 |
|--------|----------|------|
| `csv` | CSV for TurboTax | `.csv` |
| `cpa_pack` | CPA Audit Pack | `.zip` |
| `cpa_pdf` | Summary PDF（保留，内容对齐 00_READ_ME） | `.pdf` |
| `txf` | TXF for Tax Software（M3） | `.txf` |

---

## 11. 参考

- `docs/biz/export/export-biz.md` — TurboTax / CPA 细节说明
- `docs/biz/export/TurboTax-format.csv`
- `docs/biz/export/cpa-audit-specs.txt`（实施时 **去掉** `03_Mileage_Log.csv` 行）
- `docs/biz/export/P&LSummary.md`
- `docs/biz/export/txf-format.txt`
- 现实现：`lib/tax/exportCsv.ts`、`lib/export/buildCpaPack.ts`、`lib/export/receiptImageUrl.ts`
