# Snap1099 Compliance Master Matrix

**Date:** 2026-06-30  
**Status:** Approved (design)  
**Scope:** Option C — 清单 12 维 **100% 可审计覆盖**（法律 + 技术披露 + WCAG 2.2 AA + 安全运营）  
**Program:** 6 支柱子 Spec（P1–P6）+ 4 里程碑（M0–M4）

**Canonical product rules:** [`PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) §2.3 · [`2026-06-05-compliance-privacy-design.md`](./2026-06-05-compliance-privacy-design.md)（MVP 美国驻留以 PRODUCT-SPEC 为准）

---

## 1. Domain mapping（清单 → Snap1099）

| 通用清单表述 | Snap1099 等价 |
|--------------|---------------|
| 语音转写最小数据 | 小票 **图像** + 可选 **OCR 文本**（`ocrDraft`）；不上传无关字段 |
| 发票编号/金额/状态 AI 决策 | **merchant / amount / category / status** 由 AI **提取**；**`tax_amount`** 由服务端 `processReceiptTax` → `computeTaxAmount` **公式写入**，AI 不单独改账或触发 Export/filed |
| 草稿 / 历史报价 / 发票 | **processing** 小票 · **IndexedDB 队列** · **done** 小票 · **Export 包** · **Postgres + Blob（美国）** |
| 用户数据所有权 | 用户可随时 Export / Delete Account；我们不转售数据 |

---

## 2. Master matrix（12 维）

| # | 维度 | 现状（2026-06-30） | 缺口 | 目标状态 | 验收标准 | 支柱 | 里程碑 |
|---|------|-------------------|------|----------|----------|------|--------|
| 1 | **Privacy by Design** | Ghost 最小采集；Privacy §1；无 GPS/联系人 | 缺成文「数据所有权」；OPFS 加密与 Privacy 未完全对齐 | 数据流图 + Privacy/Terms 一致声明 | Privacy §1 含 ownership；Settings Data storage 与实现一致；PRODUCT-SPEC §2.3 勾选 | P1,P2 | M1 |
| 2 | **Security by Default** | TLS；云端 AES；OPFS AES-GCM；OAuth；Paddle 签名校验；HMAC Ghost | — | `SECURITY-BASELINE.md` + 代码对照表 | 子处理方 + 传输/静态加密 + 认证方式可审计 | P3 | **M2 ✓** |
| 3 | **GDPR** | 访问/导出/删除；legal@ 48h 目标 | 缺更正、可携带、限制处理、反对；**30 天** SLA；无 DSR 流程 | Privacy §6 全权利 + DSR 流程 | 模拟 4 类 DSR 可在 30 天内闭环（含模板回复） | P1,P6 | M1 |
| 4 | **CCPA/CPRA** | §5 不卖数据 | 缺 **Categories** 表、12 个月披露、明确 **Do Not Sell** 语句（即使 N/A） | Privacy 新 § + CPRA 附录 | 含 categories collected/disclosed/sold(无)；California 用户可读 | P1 | M1 |
| 5 | **US 部署 + 跨境** | Privacy §4 美国 + DPF | **SCC 未明示**；`prd/0.0.1.update.md` Frankfurt 冲突 | US 统一部署说明 + DPF **及** SCC 后备表述 | 四语 Privacy 一致；deprecated 旧 Frankfurt 文案 | P1 | M0,M1 |
| 6 | **AI 隐私** | OpenAI 不训练（§3） | 缺 Snap1099 专用 AI 原则（OCR/Vision 边界） | Privacy §3 + PRODUCT §5.1 交叉引用 | 文档明确：不训练、最小字段、tax 公式非 AI 决策 | P1,P3 | M1 |
| 7 | **Disclaimer** | Terms §6；Est. 非税务建议 | Terms 过短；Export/Paywall 免责未系统化 | Terms 扩章 + UI 关键触点 | Terms 含 AS IS、责任上限、非 CPA 建议；Export 页可见 | P1 | M1 |
| 8 | **Terms of Service** | `terms.md` 8 节骨架 | 缺完整订阅/IP/终止/争议解决 | Terms ≥12 节（见 P1） | en/fr/de 同步；Legal Sheet 同源 | P1 | M1 |
| 9 | **Privacy Policy** | en/fr/de + 路由 | 缺 Retention/Incident 引用；权利不全 | 正式版 Privacy（见 P1 目录） | 四语结构一致；与 `/privacy` 渲染一致 | P1 | M1 |
| 10 | **Data Retention** | 代码：18mo 小票、90d OPFS、rate-limit GC 24h | — | `docs/legal/data-retention.md` + Privacy 链接 | 文档周期 = 代码常量；Delete Account 说明 | P2 | **M2 ✓** |
| 11 | **Accessibility** | 黑黄 AAA 配色； scattered `aria-*` | **未** WCAG 2.2 AA 程序；无键盘/读屏/大字体策略 | P4 审计 + 修复 P0 路径 | 核心流程 axe 0 critical；VPAT 摘要 1 页 | P4 | M3 |
| 12 | **Security incident** | 结构化日志 | 无 72h 通知、IRP、备份/回滚 Runbook | P5 ops 文档 + 对外摘要 | 桌面演练 1 次；`security-incident.md` 公开承诺 | P5 | M4 |

---

## 3. Milestones

| ID | 名称 | 退出标准 |
|----|------|----------|
| **M0** | 矩阵冻结 | 本文件 Approved；Frankfurt 冲突标注 deprecated |
| **M1** | Legal & DSR | P1 + P6 实现；Privacy/Terms 四语更新 |
| **M2** | Data & Security | P2 + P3；Retention 文档与代码对齐 |
| **M3** | Accessibility | P4 核心路径 WCAG 2.2 AA |
| **M4** | Security Ops | P5 IRP + 72h 模板 + 演练记录 |

---

## 4. Sub-spec index

| Spec | Path |
|------|------|
| P1 Legal & Disclosures | [`2026-06-30-compliance-p1-legal.md`](./2026-06-30-compliance-p1-legal.md) |
| P2 Data Lifecycle | [`2026-06-30-compliance-p2-data-lifecycle.md`](./2026-06-30-compliance-p2-data-lifecycle.md) |
| P3 Security Baseline | [`2026-06-30-compliance-p3-security-baseline.md`](./2026-06-30-compliance-p3-security-baseline.md) |
| P4 Accessibility | [`2026-06-30-compliance-p4-accessibility-wcag22-aa.md`](./2026-06-30-compliance-p4-accessibility-wcag22-aa.md) |
| P5 Security Operations | [`2026-06-30-compliance-p5-security-operations.md`](./2026-06-30-compliance-p5-security-operations.md) |
| P6 DSR & Governance | [`2026-06-30-compliance-p6-dsr-governance.md`](./2026-06-30-compliance-p6-dsr-governance.md) |

---

## 5. Non-goals (this program)

- EU 分区域 Postgres/Blob（Frankfurt）基础设施 — 另立项；本程序仅 US 部署 + 跨境法律机制
- SOC2 Type II 认证
- Cookie 同意墙 / 核心流程 Modal 门控（违反 PRODUCT 铁律）

---

## 6. Acceptance (program complete)

1. Master matrix 12 行均有 **Implemented** 或 **Waived（ documented rationale）** 状态
2. 无 Privacy/Terms 与 PRODUCT-SPEC §2.3 冲突
3. 核心用户路径 WCAG 2.2 AA 审计报告归档
4. IRP 桌面演练记录（内部）+ 对外 `security-incident.md` 发布
