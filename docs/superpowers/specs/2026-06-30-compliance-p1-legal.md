# Compliance P1 — Legal & Disclosures

**Date:** 2026-06-30  
**Status:** Approved (design)  
**Parent:** [`2026-06-30-compliance-master-matrix.md`](./2026-06-30-compliance-master-matrix.md)  
**Milestone:** M1

---

## 1. Goal

扩写 **Privacy Policy** 与 **Terms of Service**（en / fr / de），覆盖 GDPR、CPRA、US 跨境、AI 原则、Disclaimer；与 App Legal Sheet、`/privacy`、`/terms` **同源**。

---

## 2. Privacy Policy — target outline

| § | 标题 | 内容要点 |
|---|------|----------|
| 1 | Privacy by Design & Data Ownership | 最小采集；用户拥有业务数据；我们仅处理员 |
| 2 | What We Collect | 类别表（图像、元数据、账户、支付元数据、技术日志摘要） |
| 3 | Ghost vs Google Account | 现有 §1–2 升级 |
| 4 | AI Processing | OpenAI Vision/OCR；**不用于模型训练**；最小字段；`tax_amount` 服务端公式 |
| 5 | Sub-Processors | 现有表格 + DPA/DPF 引用 |
| 6 | Storage & International Transfers | **美国统一部署**；EU 用户知情；**TLS 1.3 + AES-256**；**EU-U.S. DPF** + **SCC** 作为补充机制 |
| 7 | Data Retention | 摘要 + 链接 [`data-retention.md`](../../legal/data-retention.md) |
| 8 | No Sale / CPRA | **We do not sell your personal information**；Categories collected/disclosed；12 个月 lookback 说明 |
| 9 | Your Rights (GDPR & CPRA) | 访问、更正、删除、可携带、限制、反对；**30 天内响应**；联系 legal@ |
| 10 | Security | 摘要 + 链接 incident 摘要 |
| 11 | Children | 不面向 13 岁以下 |
| 12 | Changes & Contact | 更新通知；legal@snap1099.com |

---

## 3. Terms of Service — target outline

| § | 标题 |
|---|------|
| 1 | Agreement & Service Description |
| 2 | Eligibility & Acceptable Use |
| 3 | Accounts (Ghost / Google) |
| 4 | Subscriptions & Payments (Paddle；报税季 Export) |
| 5 | Intellectual Property |
| 6 | **Disclaimer & Tax Estimates**（Est. Tax Saved 非税务建议；Export 不保证 IRS 接受） |
| 7 | Limitation of Liability |
| 8 | Indemnification |
| 9 | Termination & Suspension |
| 10 | Dispute Resolution / Governing Law |
| 11 | Privacy Reference |
| 12 | Contact |

---

## 4. Files to modify

| File | Action |
|------|--------|
| `docs/legal/privacy.md` | Expand per §2 |
| `docs/legal/privacy.fr.md` · `privacy.de.md` | Mirror structure |
| `docs/legal/terms.md` | Expand per §3 |
| `docs/legal/terms.fr.md` · `terms.de.md` | Mirror |
| `lib/legal/locales.ts` | Keys if new sections need UI snippets |
| `docs/prd/0.0.1.update.md` | Mark EU Frankfurt § **deprecated** → link Privacy §6 |
| `docs/product/PRODUCT-SPEC.md` §2.3 | Cross-ref new Privacy § numbers |

**Non-goals:** Cookie banner；首拍 Modal 同意

---

## 5. UI disclosure (no new modals)

- 相机界面脚注（已有）
- Settings → Privacy & Data（已有入口）
- Export / Paywall：一行 Disclaimer 链到 Terms §6（Inline 或 Sheet，非阻断 Modal）

---

## 6. Acceptance

1. Privacy 含 GDPR 六项权利 + **30-day response**
2. CPRA：**Do Not Sell** + categories table
3. US deployment + SCC/DPF 同段表述，四语一致
4. AI：no training + Snap1099 OCR/Vision 边界
5. Terms ≥12 节；Disclaimer 覆盖 Est. Tax Saved
6. Legal Sheet 与 `/privacy` `/terms` 渲染同一 markdown 源
