一、 TurboTax 兼容性标准数据 Demo 格式
TurboTax 这一类自动化报税软件，核心需要的是高度结构化的字段，以便软件系统能够自动读取、识别并将金额填入正确的税表格子中。最通用的格式是标准的 CSV（逗号分隔值） 格式。

1. 软件导入标准 CSV 源码 Demo
   代码段
   Date,Merchant,Category,Amount,Schedule C Line,Tax Deductible,Business %
   2026-01-15,OpenAI,Office Expenses,20.00,Line 18,Yes,100%
   2026-02-10,Google Domains,Advertising,12.50,Line 8,Yes,100%
   2026-03-01,Verizon Wireless,Utilities,70.00,Line 25,Yes,70%
   2026-03-15,Home Depot,Supplies,125.50,Line 22,Yes,100%
   2026-04-02,Chevron Gas,Car & Truck,45.00,Line 9,Yes,80%
2. 软件对接关键要素解析
   Schedule C Line：这一列是自动化导入的核心。软件（如 TurboTax）会直接根据 Line 18、Line 8 等标识，自动把该行金额归类到对应的官方报税大类中。

Business %（商业使用比例）：如果是公私混用的支出（如 Verizon 手机话费），Amount（金额）字段必须是已经乘以该比例后的合规抵扣额（即原始账单 $100 × 70% = $70），软件才能正确计税。

二、 CPA 线下交付层标准数据 Demo 格式
与软件不同，线下专业的 CPA（注册会计师） 不需要成百上千条琐碎的原始流水。CPA 需要的是一份清晰的年度损益摘要（P&L Sheet），用来快速誊抄到他们的职业报税系统（如 UltraTax CS）中，同时他们需要一份结构化的审计包（Audit-Ready Package）以备 IRS 抽查。

1. CPA 年度损益摘要（P&L Summary）Markdown Demo
   Markdown
# 2025 年度自雇业务损益摘要 (Schedule C P&L Summary)

**纳税人姓名:** John Doe  
**社会安全号 (SSN):** ***-**-6789  
**业务名称:** John Doe Tech Consulting  
**主要业务/职业:** Residential Construction & Repairs  
**NAICS 行业代码:** 236118 (住宅改建与维修承包商)  
**申报税年:** 2025 税季

---

### Part I: Income (总收入汇总)
| Schedule C 行号 | 税务科目 (Tax Category) | 年度累计总额 (USD) | 凭证/表单数量 | 备注说明 |
| :--- | :--- | :--- | :--- | :--- |
| **Line 1** | Gross receipts or sales | $64,800.00 | 12 张 (1099-NEC) | 包含所有 1099 表及现金总收款 |
| **Line 7** | **Gross Income (自雇总收入)** | **$64,800.00** | **12** | **自雇总毛利收入底数** |

### Part II: Expenses (商业开支扣除额汇总)
| Schedule C 行号 | 税务科目 (Tax Category) | 年度累计总额 (USD) | 收据凭证数量 | 备注说明 |
| :--- | :--- | :--- | :--- | :--- |
| **Line 9** | Car and truck expenses | $4,154.00 | 1 (6,200 英里) | 基于 GPS 自动行车里程追踪的标准里程折算 |
| **Line 11** | Contract labor | $3,500.00 | 2 | 支付给临时帮工或分包商的工钱 |
| **Line 18** | Office expenses | $2,450.00 | 34 | 办公费与软件订阅（含行业工具、云服务） |
| **Line 22** | Supplies | $5,450.00 | 8 | 商业耗材与硬件，含五金建材、生产工具等 |
| **Line 25** | Utilities | $840.00 | 12 | 通信网费，含手机话费按 70% 商业比例分摊 |
| **Line 27a** | Other expenses | $420.00 | 4 | 劳保用品（安全帽、劳保鞋）与商业工伤险 |
| **-** | **Total Expenses** | **$16,814.00** | **61** | **总合规商业扣除额 (SUM Line 8-27a)** |

---

### Summary: Net Profit (自雇净利润)
| 指标 | 计算公式 | 金额 (USD) | CPA 录入指引 |
| :--- | :--- | :--- | :--- |
| **Net Profit (or Loss)** | Gross Income - Total Expenses | **$47,986.00** | **直接誊抄至 Schedule C Line 31** |

*注：本摘要所有金额均保留两位小数以供 CPA 精确核对。相关的原始发票和收据索引已按行号分类打包在对应的交付审计包中。*
2. CPA 审计级交付包（ZIP 目录规范）
   除了上面的损益摘要，提供给 CPA 的文件包应当包含如下高度标准化的目录结构，方便会计师的助理批量复核原始票据：

Plaintext
├── [00_READ_ME_Summary.pdf]          <-- 上述年度财务损益总表与税盾摘要
├── [01_Income_Documents]             <-- 所有的收入证明（1099-NEC、1099-K 电子原件）
│   ├── 1099_NEC_ClientA.pdf
│   └── 1099_K_Stripe.pdf
├── [02_Expenses_Receipts_Book]       <-- 按 Schedule C 科目分门别类的票据归档（内含已重命名的收据原图）
│   ├── Line_09_Car_and_Truck/
│   ├── Line_18_Office_Expenses/
│   │   ├── REC_20250115_OpenAI_20.00.jpg   <-- 规范命名：[日期]_[商户]_[金额]
│   │   └── REC_20250201_Vercel_40.00.jpg
│   └── Line_22_Supplies/
│       └── REC_20250315_HomeDepot_125.50.jpg
└── [03_Mileage_Log.csv]              <-- 详细的 GPS 行车记录日志明细（包含每次行程的商业目的备注）

## 细节说明
针对 TurboTax 导出：文件编码必须强制指定为 UTF-8 或 ASCII（不带 BOM 头），否则 TurboTax 批量导入时极易出现“无法识别文件格式”的底层错误。

针对 CPA 导出：收据图片的重命名至关重要。系统在打包时，自动将类似 IMG_0023.png 的文件名转换为 REC_20250315_HomeDepot_125.50.jpg，能让 CPA 的好感度直接拉满，也是此类财务软件的核心产品壁垒。



清理 0.00 抵扣项： 把所有抵扣额为 0 的记录，分类直接改为 Personal，不要打上 Line 22/27a 的标签。

剔除重复账目： 核实两笔 $193.12 的 Builder Depot 是否为误拍重复，如果是，删掉一笔。

补全备注（Notes）： 增加一列 Notes（商业目的），特别是针对吃饭（Meals）的开支，写上“与某某客户谈工程”。

保留收据（Receipt_Image_URL）： 确保在最终打包给 CPA 时，最后一列的收据图片链接或原图是真实对应且可以打开的。