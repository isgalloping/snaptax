# SnapTax 财务数据导出：QuickBooks 兼容格式规范 (.QBO / .QIF / .OFX)

为了实现与北美最主流的财务软件 Intuit QuickBooks 以及传统 CPA（注册会计师）工作流的无缝对接，SnapTax 需要支持将会计科目（Category）和流水数据导出为标准的金融交换格式。

根据技术实现的难易程度与功能侧重点，推荐优先实现 **.QIF**（最易生成）或 **.OFX/.QBO**（集成度最高）格式。

---

## 1. 三种格式的选择与权衡

| 格式后缀 | 格式全称 | 独立开发接入建议 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **.QIF** | **Quicken Interchange Format** | **⭐⭐⭐⭐⭐ 强烈推荐优先做**<br>纯文本格式，用简单的字符串拼接即可生成，极其轻量。 | 几乎所有版本的 QuickBooks、Quicken 均支持无缝直接导入。 |
| **.OFX** | **Open Financial Exchange** | **⭐⭐⭐ 选做（备选）**<br>基于 SGML/XML 架构的国际金融标准。格式相对严格。 | 适合发给使用专业财税系统的老派 CPA 会计师。 |
| **.QBO** | **QuickBooks Online Web Connect** | **⭐⭐ 选做（有生态野心时做）**<br>本质上是 OFX 格式的变体，带有 QuickBooks 专属的特殊标签（如 `<INTU.BID>`）。 | 用户可以直接在 QuickBooks 网页版中将其当做“虚拟银行流水”直接导入绑定。 |

---

## 2. QIF (Quicken Interchange Format) 详细格式规范

QIF 是最适合独立开发者快速交付的格式。它是一个纯文本文件，每一行用一个特定字符开头，代表不同的财务字段，最后以 `^` 符号结束一笔交易。

### 📄 QIF 文件内容模版与示例

在 SnapTax 中，导出的 `.qif` 文件内容应严格遵循以下结构：

```text
!Type:Cash
D12/14/2025
T-75.50
PShell Gas
LJob Expenses:Car & Truck (Line 9)
MTruck Fuel
^
D10/25/2025
T-340.00
PHome Depot
LJob Expenses:Supplies (Line 22)
MDeWalt Drill
^