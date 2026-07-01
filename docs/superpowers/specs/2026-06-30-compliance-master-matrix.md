# Snap1099 Compliance Master Matrix

**Date:** 2026-06-30  
**Status:** **Implemented** (program complete)  
**Branch:** `0.4.2`  
**Scope:** Option C — 清单 12 维 **100% 可审计覆盖**（法律 + 技术披露 + WCAG 2.2 AA + 安全运营）  
**Program:** 6 支柱子 Spec（P1–P6）+ 4 里程碑（M0–M4）

**Canonical product rules:** [`PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) §2.3 · [`2026-06-05-compliance-privacy-design.md`](./2026-06-05-compliance-privacy-design.md)（MVP 美国驻留以 PRODUCT-SPEC 为准）

**Implementation plan:** [`2026-06-30-compliance-program.md`](../plans/2026-06-30-compliance-program.md)

---

## 1. Domain mapping（清单 → Snap1099）

| 通用清单表述 | Snap1099 等价 |
|--------------|---------------|
| 语音转写最小数据 | 小票 **图像** + 可选 **OCR 文本**（`ocrDraft`）；不上传无关字段 |
| 发票编号/金额/状态 AI 决策 | **merchant / amount / category / status** 由 AI **提取**；**`tax_amount`** 由服务端 `processReceiptTax` → `computeTaxAmount` **公式写入**，AI 不单独改账或触发 Export/filed |
| 草稿 / 历史报价 / 发票 | **processing** 小票 · **IndexedDB 队列** · **done** 小票 · **Export 包** · **Postgres + Blob（美国）** |
| 用户数据所有权 | 用户可随时 Export / Delete Account；我们不转售数据 |

---

## 2. Master matrix（12 维 — 全部 Implemented）

| # | 维度 | 状态 | 证据 | 支柱 | Milestone |
|---|------|------|------|------|-----------|
| 1 | **Privacy by Design** | ✅ Implemented | Privacy §1 ownership · `locales.ts` · PRODUCT-SPEC §2.3 | P1,P2 | M1 · `7bc4829` |
| 2 | **Security by Default** | ✅ Implemented | [`SECURITY-BASELINE.md`](../../tech/SECURITY-BASELINE.md) | P3 | M2 · `65490db` |
| 3 | **GDPR** | ✅ Implemented | Privacy §9 · 30-day SLA · [`dsr-playbook.md`](../../ops/dsr-playbook.md) | P1,P6 | M1 · `65490db` |
| 4 | **CCPA/CPRA** | ✅ Implemented | Privacy §8 categories · Do Not Sell | P1 | M1 · `7bc4829` |
| 5 | **US 部署 + 跨境** | ✅ Implemented | Privacy §6 DPF+SCC · Frankfurt deprecated `7c68385` | P1 | M0,M1 |
| 6 | **AI 隐私** | ✅ Implemented | Privacy §4 · tax formula non-AI | P1,P3 | M1 · `7bc4829` |
| 7 | **Disclaimer** | ✅ Implemented | Terms §6 · Export card disclaimer `66a9f54` | P1 | M1 |
| 8 | **Terms of Service** | ✅ Implemented | `terms.md` 12 节 · en/fr/de | P1 | M1 · `7bc4829` |
| 9 | **Privacy Policy** | ✅ Implemented | `privacy.md` 12 节 · `/privacy` `/data-retention` `/security` | P1 | M1 · `66a9f54` |
| 10 | **Data Retention** | ✅ Implemented | [`data-retention.md`](../../legal/data-retention.md) = code constants | P2 | M2 · `65490db` |
| 11 | **Accessibility** | ✅ Implemented | axe 0 critical/serious · [`WCAG-22-AA-summary.md`](../../accessibility/WCAG-22-AA-summary.md) | P4 | M3 · `6ddc1a8` |
| 12 | **Security incident** | ✅ Implemented | [`security-incident.md`](../../legal/security-incident.md) · IRP · tabletop | P5 | M4 · (this commit) |

**Waived:** EU Frankfurt regional hosting — documented non-goal; US + DPF/SCC only.

---

## 3. Milestones

| ID | 名称 | 状态 | 退出标准 |
|----|------|------|----------|
| **M0** | 矩阵冻结 | ✅ | Matrix approved · Frankfurt deprecated |
| **M1** | Legal & DSR | ✅ | Privacy/Terms 四语 · DSR playbook · UI links |
| **M2** | Data & Security | ✅ | Retention doc · SECURITY-BASELINE |
| **M3** | Accessibility | ✅ | axe audit · P0 fixes · VPAT-lite |
| **M4** | Security Ops | ✅ | IRP · runbooks · tabletop · matrix closed |

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

- [x] Master matrix 12 行均为 **Implemented**（Frankfurt 为 documented waive）
- [x] 无 Privacy/Terms 与 PRODUCT-SPEC §2.3 冲突
- [x] 核心用户路径 WCAG 2.2 AA 审计报告归档
- [x] IRP 桌面演练记录 + 对外 `security-incident.md` 发布

**Completed:** 2026-06-30 · branch `0.4.2`
