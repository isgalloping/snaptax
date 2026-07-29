# Compliance P6 — DSR & Governance

**Date:** 2026-06-30  
**Status:** Approved (design)  
**Parent:** [`2026-06-30-compliance-master-matrix.md`](./2026-06-30-compliance-master-matrix.md)  
**Milestone:** M1 (process) · ongoing (operations)

---

## 1. Goal

**Data Subject Request (DSR)** 流程满足 GDPR + CPRA：**30 天内响应**（可延长至 60 天并告知原因）。

---

## 2. Request channels

| 渠道 | 处理 |
|------|------|
| **snaptax.lightxforge@gmail.com** | 主渠道 |
| **In-app Delete Account** | 自动满足删除权 |
| **In-app Export** | 自动满足访问/可携带（报税季 Export） |

---

## 3. Request types & handling

| 权利 | 自助 | 人工 DSR |
|------|------|----------|
| **Access** | Export + App 内查看 | 核实身份后发 Export 或摘要 |
| **Rectification** | Receipt detail 编辑（若产品支持）/ 联系 support 更正 | 30 天 |
| **Erasure** | Delete Account | Ghost-only：Delete 清 local + server ghost data |
| **Portability** | Export CSV/XLSX | 同 Export |
| **Restrict processing** | 暂停 sync（离线模式说明） | 账户 flag（若请求） |
| **Object** | 停止使用 App / Delete Account | 记录 opt-out |

---

## 4. Identity verification

- Google 账户：回复至注册 email  
- Ghost-only：需提供 Ghost 会话证明或 receipt 样本（最小验证）

---

## 5. Governance

| 项 | 规则 |
|----|------|
| Legal 变更 | Privacy/Terms 更新 → `Last Updated` + 重大变更 App 内 one-line（Settings） |
| 子处理方变更 | Privacy §5 更新 + 30 天前通知（重大） |
| 合规 Owner | 指定角色（文档化，非代码） |
| 年度审查 | Master Matrix 复核 Q2 |

---

## 6. Deliverables

- `docs/ops/dsr-playbook.md`（内部）  
- Privacy §9 程序摘要  
- 邮件模板：ack / complete / extend  

---

## 7. Acceptance

1. 模拟 3 类 DSR（access / delete / portability）走通 playbook  
2. Privacy 承诺 **30-day response**  
3. 无 48h-only 与 30-day 冲突（48h = ack 目标，30d = 完成）
