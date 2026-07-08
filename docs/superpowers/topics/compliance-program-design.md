# Compliance Program — Topic Design

**Topic ID:** `compliance-program`  
**Status:** Consolidated · **program complete** (2026-06-30 · branch `0.4.2`)  
**Last verified:** 2026-07-08

---

## 1. Summary

Snap1099 **Option C** 合规程序：12 维主矩阵 **100% Implemented**（Frankfurt 区域托管为 documented waive）。六支柱 **P1–P6** + 四里程碑 **M0–M4** 交付法律、数据生命周期、安全基线、WCAG 2.2 AA、安全运营、DSR 治理。

**Foundation ADR（仍 active）：** [`2026-06-05-compliance-privacy-design.md`](../specs/2026-06-05-compliance-privacy-design.md) — MVP 隐私架构；PRODUCT-SPEC §2.3 美国驻留以 PRODUCT-SPEC 为准。

**Follow-up audit（仍 active）：** [`2026-07-08-us-legal-compliance-audit-design.md`](../specs/2026-07-08-us-legal-compliance-audit-design.md) — Paddle 审查、CPRA、SnapTax 品牌、operator 披露。

**Canonical legal truth：** `docs/legal/*.md` · `lib/legal/locales.ts` · App Legal Sheet / `/privacy` `/terms` 同源。

---

## 2. Canonical links

| Doc | Relevance |
|-----|-----------|
| [`docs/product/PRODUCT-SPEC.md`](../../product/PRODUCT-SPEC.md) | §2.3 合规 · 美国存储 |
| [`docs/legal/privacy.md`](../../legal/privacy.md) | Privacy Policy（12 节） |
| [`docs/legal/terms.md`](../../legal/terms.md) | Terms（12 节） |
| [`docs/legal/data-retention.md`](../../legal/data-retention.md) | 用户可读 retention |
| [`docs/legal/security-incident.md`](../../legal/security-incident.md) | 事件响应摘要 |
| [`docs/tech/SECURITY-BASELINE.md`](../../tech/SECURITY-BASELINE.md) | P3 技术基线 |
| [`docs/accessibility/WCAG-22-AA-summary.md`](../../accessibility/WCAG-22-AA-summary.md) | P4 VPAT-lite |
| [`docs/ops/dsr-playbook.md`](../../ops/dsr-playbook.md) | DSR 操作手册 |
| [`docs/ops/security-incident-response.md`](../../ops/security-incident-response.md) | IRP 完整版 |
| [`topics/delete-account-design.md`](./delete-account-design.md) | Erasure · retention 触发 |
| [`topics/settings-design.md`](./settings-design.md) | Privacy Center · Legal Sheet |

---

## 3. Domain mapping

| 通用清单 | Snap1099 等价 |
|----------|---------------|
| 语音转写最小数据 | 小票 **图像** + 可选 **OCR 文本**（`ocrDraft`） |
| AI 决策字段 | merchant / amount / category / status 由 AI 提取；**`tax_amount`** 由 `processReceiptTax` 公式写入 |
| 草稿 / 历史 | **processing** · IDB 队列 · **done** · Export · Postgres + Blob（美国） |
| 数据所有权 | Export / Delete Account；不卖用户数据 |

---

## 4. Master matrix (12 dimensions — all Implemented)

| # | 维度 | 证据 | 支柱 |
|---|------|------|------|
| 1 | Privacy by Design | Privacy §1 · locales · PRODUCT-SPEC §2.3 | P1,P2 |
| 2 | Security by Default | SECURITY-BASELINE.md | P3 |
| 3 | GDPR | Privacy §9 · 30-day SLA · dsr-playbook | P1,P6 |
| 4 | CCPA/CPRA | Privacy §8 · Do Not Sell | P1 |
| 5 | US 部署 + 跨境 | Privacy §6 DPF+SCC · Frankfurt deprecated | P1 |
| 6 | AI 隐私 | Privacy §4 · tax formula non-AI | P1,P3 |
| 7 | Disclaimer | Terms §6 · Export card | P1 |
| 8 | Terms of Service | terms.md 12 节 · en/fr/de | P1 |
| 9 | Privacy Policy | privacy.md · `/privacy` `/data-retention` `/security` | P1 |
| 10 | Data Retention | data-retention.md = code constants | P2 |
| 11 | Accessibility | axe 0 critical/serious · WCAG summary | P4 |
| 12 | Security incident | security-incident.md · IRP · tabletop | P5 |

**Waived:** EU Frankfurt 分区域 Postgres/Blob — US + DPF/SCC only。

---

## 5. Milestones

| ID | 名称 | 退出标准 |
|----|------|----------|
| **M0** | 矩阵冻结 | Matrix approved · Frankfurt deprecated |
| **M1** | Legal & DSR | Privacy/Terms 四语 · DSR playbook · UI links |
| **M2** | Data & Security | Retention doc · SECURITY-BASELINE |
| **M3** | Accessibility | axe audit · P0 fixes · VPAT-lite |
| **M4** | Security Ops | IRP · runbooks · tabletop · matrix closed |

---

## 6. P1 — Legal & Disclosures (M1)

- Privacy 12 节：ownership · categories · Ghost/Google · AI no-training · sub-processors · **US storage + DPF/SCC** · retention link · **Do Not Sell** · GDPR 权利 **30 天** · security · children · contact
- Terms 12 节：含 **Disclaimer & Tax Estimates**（Est. Tax Saved 非税务建议）
- UI：相机脚注 · Settings Privacy Center · Export 一行 disclaimer（非阻断 Modal）
- **Non-goals：** Cookie banner · 首拍 Modal 同意

---

## 7. P2 — Data Lifecycle (M2)

| 数据类型 | 位置 | 保留 |
|----------|------|------|
| 小票元数据 | IndexedDB | **18 个月** idle prune |
| 小票元数据 | Postgres | 账户存续；Delete **30 天内**硬删 |
| 原图 full | OPFS 加密 | 至上传或 **90 天** post-sync purge |
| Blob 图像 | Vercel Blob | 随 Delete Account cascade |
| Rate limit | Postgres | **24h** GC |
| API 日志 | Vercel | **90 天** 文档化 |

**可携带权：** Export Tax Pack = CSV/XLSX。

---

## 8. P3 — Security Baseline (M2)

| 控制 | 实现 |
|------|------|
| TLS 1.3 | Vercel HTTPS |
| AES-256 at rest | Neon / Blob |
| 本地图像 AES-GCM | OPFS + `aesGcm.ts` |
| Ghost HMAC | HttpOnly cookie |
| Receipt 归属 | `receiptWhereForActor` |
| Signed image URL | ≤15min |
| Rate limiting | Ghost/IP/User buckets |
| 日志脱敏 | email mask · no image bytes |

Deliverable：`docs/tech/SECURITY-BASELINE.md`。

---

## 9. P4 — Accessibility WCAG 2.2 AA (M3)

**Critical paths：** 启动 → Snap → 列表 · Receipt detail · Settings Privacy · Export/Paywall · Delete Account。

| WCAG | Snap1099 |
|------|----------|
| 1.4.3 Contrast | 黑/白/黄 AAA 加分 |
| 2.1 Keyboard | Snap · Settings · Export · Sheet |
| 2.5.8 Target size | ≥44px（核心 ≥64px） |
| 4.1.2 Name/Role/Value | aria-label · aria-live |

Process：axe-core · VoiceOver · VPAT-lite 摘要。

---

## 10. P5 — Security Operations (M4)

| 阶段 | SLA |
|------|-----|
| Triage | **4h** 分类 |
| Contain (P1) | **24h** |
| User notify (高风险) | **72h** |
| Post-mortem | 7 天内 |

Artifacts：`security-incident.md` · `ops/security-incident-response.md` · backup/rollback runbooks。

---

## 11. P6 — DSR & Governance (M1+)

| 权利 | 自助 | 人工 |
|------|------|------|
| Access | Export | 30 天 |
| Erasure | Delete Account | Ghost Delete |
| Portability | Export CSV/XLSX | — |

**Contact：** `snaptax.lightxforge@gmail.com` · In-app Delete / Export 自动满足部分请求。

---

## 12. Program non-goals

- EU 分区域 Postgres/Blob 基础设施
- SOC2 Type II
- Cookie 同意墙 / 核心流程 Modal 门控

---

## 13. Acceptance (program complete)

- [x] Master matrix 12 行均为 Implemented
- [x] 无 Privacy/Terms 与 PRODUCT-SPEC §2.3 冲突
- [x] 核心路径 WCAG 2.2 AA 审计归档
- [x] IRP 桌面演练 + security-incident.md 发布

---

## 14. Decision log

| Date | Old spec / plan | Superseded by |
|------|-----------------|---------------|
| 2026-06-30 | `archive/specs/2026-06-30-compliance-master-matrix.md` | **this topic** §4–§5 |
| 2026-06-30 | `archive/specs/2026-06-30-compliance-p1-legal.md` | **this topic** §6 |
| 2026-06-30 | `archive/specs/2026-06-30-compliance-p2-data-lifecycle.md` | **this topic** §7 |
| 2026-06-30 | `archive/specs/2026-06-30-compliance-p3-security-baseline.md` | **this topic** §8 |
| 2026-06-30 | `archive/specs/2026-06-30-compliance-p4-accessibility-wcag22-aa.md` | **this topic** §9 |
| 2026-06-30 | `archive/specs/2026-06-30-compliance-p5-security-operations.md` | **this topic** §10 |
| 2026-06-30 | `archive/specs/2026-06-30-compliance-p6-dsr-governance.md` | **this topic** §11 |
| 2026-06-30 | `archive/plans/2026-06-30-compliance-program.md` | implemented · **this topic** |
| 2026-07-08 | `archive/specs/2026-07-08-us-legal-compliance-audit-design.md` | **this topic** §15 |
| 2026-07-08 | `archive/plans/2026-07-08-us-legal-compliance-audit.md` | implemented · **this topic** §15 |

**Still active:** `2026-06-05-compliance-privacy-design.md`

---

## 15. US legal audit follow-up (2026-07-08)

Paddle merchant + CPRA launch readiness — **implemented** on `main`.

| Deliverable | Status |
|-------------|--------|
| Operator block (Gang Huang, Hong Kong) | ✅ all `docs/legal/*.md` |
| Public brand **SnapTax** | ✅ legal · marketing · manifest · i18n |
| `cookies.md` · `disclaimer.md` | ✅ `LegalMarkdownPage` routes |
| Policies hub + footer CPRA | ✅ Cookie · Disclaimer · **Do Not Sell** → `/privacy#no-sale` |
| `lib/legal/operator.ts` | ✅ |
| Technical `snap1099_*` cookies | ✅ unchanged · disclosed in cookies.md |
| Analytics | ✅ none deployed |

**Manual remaining:** production Paddle URL smoke · counsel sign-off (L4 out of scope).

**Spec:** `archive/specs/2026-07-08-us-legal-compliance-audit-design.md` · **this topic** §15
