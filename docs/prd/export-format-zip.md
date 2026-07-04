# SnapTax 安全底牌：收据原图压缩包设计规范 (Receipts ZIP Audit Trail)

在北美做自雇/1099 蓝领财税工具，最核心的底层痛点是**对抗 IRS（美国国税局）的抽查审计（Audit）**。

IRS 规定：纳税人必须保留至少 **3 年**的原始消费凭证（小票/收据原图）。光有一张 Excel 表格是不够的，如果被抽查，拿不出原始小票，抵税额会被直接作废并面临罚款。

SnapTax 导出的 `.zip` 压缩包就是用户的“终极安全底牌”。该功能的设计核心是：**让压缩包内的图片命名、目录结构，与导出的 CSV/PDF 报告实现“像素级点对点穿透”**，让审计员一目了然，无懈可击。

---

## 1. 压缩包目录结构设计

为了让结构最清晰，压缩包内部采用**“按 IRS 官方 Schedule C 行号建卷宗”**的二级目录逻辑：

```text
snaptax_2025_audit_trail.zip
├── 📄 2025_Tax_Report_Summary.pdf           # 像素级镜像对账单PDF (打包带入)
├── 📊 2025_Tax_Report_Data.csv              # 标准数据表格 (打包带入)
├── 📁 Line_09_Car_and_truck_expenses/        # 车辆卡车费用卷宗
│   ├── 🖼️ 20250214_Shell_Gas_$75.50_001.jpg
│   └── 🖼️ 20251102_AutoZone_$120.00_002.jpg
├── 📁 Line_17_Legal_and_professional/        # 专业服务费卷宗
│   └── 🖼️ 20260401_SnapTax_SaaS_$49.00_003.jpg
└── 📁 Line_22_Supplies/                      # 耗材卷宗
    └── 🖼️ 20251025_HomeDepot_$340.00_004.jpg