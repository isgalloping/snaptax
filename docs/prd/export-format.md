1. 必做补充：官方 Schedule C 镜像 PDF（可视化对账单）
这是对蓝领工人最直观、最能给他们带来“安全感”的格式。

为什么需要： 1099 自雇人士在报税时，核心就是要填写 IRS 的 Schedule C（Form 1040 独资企业损益表）。很多独立报税工具（比如这两年极火、完全免费的 FreeTaxUSA）不支持导入奇怪的 CSV，但它们会按 Schedule C 的类目一门一门地问用户。

如何实现： 导出一个直观的 PDF，其类目排版、顺序甚至编号完全像素级模仿官方 Schedule C 的 Part II (Expenses) 结构（例如：Line 9 是 Car & Truck, Line 18 是 Office Expense）。

用户体验： 用户把 PDF 打印出来或在手机上打开，对着免费报税软件，看到 Line 9 填 Line 9，看到 Line 18 填 Line 18。5 分钟无脑抄完，体验绝佳。

2. 格式升级：QuickBooks (QBO / QIF / OFX) 格式
用于承接那些打算从你这里把数据迁移到更正规记账软件的用户。

为什么需要： Intuit 旗下的 QuickBooks 是美国几乎所有老牌 CPA 必用的记账软件。如果工人们年底发现今年赚了大钱，决定不自己报了，要把一年的收据流水扔给传统 CPA，CPA 往往会说：“把你的 QuickBooks 数据导给我。”

技术落地： 支持导出 .QBO (QuickBooks Online) 或通用的 .QIF / .OFX 金融数据格式。这能让 SnapTax 瞬间具备与其他主流记账生态对话的能力。

3. 图片打包：收据原图压缩包（Receipts ZIP Audit Trail）
这是对抗 IRS 审计（Audit）的终极防御大杀器。

为什么需要： 蓝领工人最怕什么？怕被 IRS 抽查审计。 哪怕在软件里导入了 CSV，如果 IRS 来查，用户必须拿出每一笔开销的原始小票（Receipt）证明。

技术落地： 当用户点击导出时，系统生成一个打包好的 receipts.zip。

关键细节： 压缩包内部的图片命名必须与 CSV 报告中的条目一一对应（例如：2025_02_14_HomeDepot_34.50.jpg）。

文案杀伤力： “为您导出整年抵税清单的同时，打包生成一份『IRS防审计收据凭证包』。一旦被抽查，把 ZIP 直接甩给审计员即可。”

📋 最终 SnapTax 导出面板功能矩阵（建议）
为了保持首屏的干净和“Industrial Rugged（工业硬朗）”的高对比度风格，你的导出下载页面可以做成极简的大按钮分类：

[  📄 导出 IRS 规范 Schedule C 对账单 (PDF)  ]  --> 适合全网免费报税工具，对着直接手填
[  📊 导出 TurboTax 专用导入文件 (.TXF)    ]  --> 适合 TurboTax / H&R Block 桌面版
[  📥 导出 会计师标准对账表 (.CSV / Excel)   ]  --> 适合发给自己的 CPA 帮着报
[  📦 下载 1099 防审计收据原图凭证包 (.ZIP)   ]  --> 留底防抽查
这样，无论用户是用最贵的 TurboTax，还是完全免费的 FreeTaxUSA，抑或是找村头的土会计，SnapTax 都能完美适配，不需要再为没有对接 IRS 而感到心虚。