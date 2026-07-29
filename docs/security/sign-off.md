# SnapTax 上线前法务 Sign-off 指南

> Version: v1.0
> Status: Pre-Launch
> Last Updated: 2026-07-12

---

# 一、是否必须律师 Sign-off？

## 结论

对于 SnapTax 这种：

- 面向美国/欧洲用户
- AI 处理税务数据
- Paddle Merchant of Record
- 美国云存储
- 涉及 CPRA / GDPR

**法律审查（Legal Review）非常建议进行。**

但是：

> **第一版 MVP 并不需要花费大量预算让律师参与整个产品设计。**

推荐采用：

> **Limited Legal Review Memo（有限范围法律审查）**

而不是：

- ❌ 全流程法务介入
- ❌ 数十页法律意见书
- ❌ 企业级 Compliance Audit

---

# 二、建议律师输出内容

建议律师完成以下内容：

## 1. Legal Review Memo（推荐）

标题：

```
SnapTax Pre-Launch Legal Compliance Review Memorandum
```

内容示例：

```text
Reviewed Items

✓ Privacy Policy

✓ Terms of Service

✓ Refund Policy

✓ Cookie Policy

✓ AI Data Processing Disclosure

✓ Tax Disclaimer

✓ Paddle Merchant of Record

✓ Data Retention Policy

✓ California Privacy Rights (CPRA)

✓ International Data Transfer

Conclusion

Based on the information provided,
the reviewed documents are reasonably
aligned with applicable consumer SaaS
privacy and ecommerce requirements
for launch.

Limitations

This review does not constitute
tax advice.

This review does not guarantee
future regulatory changes.
```

律师签字：

```text
Attorney Name

Law Firm

Date
```

即可。

---

# 三、逐项法律检查

---

## 1. Privacy Policy ⭐⭐⭐⭐⭐

优先级：

> 必须律师审核

涉及内容：

### 数据收集

- Receipt Images
- Income Records
- Expense Categories
- Email
- Device Information

---

### AI 数据处理

需要说明：

```text
SnapTax uses third-party AI providers
to process receipt information.

Customer data is processed only for
providing the requested service.

We do not use customer data
to train AI models.
```

---

### 国际数据传输

目前架构：

```
User
↓
Vercel (US hosting)
↓
OpenAI (receipt analysis API)
```

律师需要确认：

- GDPR
- SCC
- CPRA

是否满足要求。

---

### 第三方 Processor

例如：

| 服务 | Provider |
|-------|----------|
| Hosting | Vercel |
| Database | Supabase / Neon |
| AI | OpenAI |
| Payment | Paddle |

Privacy Policy 中保持一致。

---

## 2. Terms of Service ⭐⭐⭐⭐⭐

必须律师审核。

### 最大风险

用户误认为：

> SnapTax 提供报税服务。

所以必须声明：

```text
SnapTax is not a tax preparation service.

SnapTax does not provide tax advice.

SnapTax does not establish
a CPA-client relationship.
```

---

### Marketing 文案

避免：

❌

```
Maximize your tax deduction
```

建议：

✅

```
Organize expenses

Prepare tax records

Estimate deductible expenses
```

---

## 3. Refund Policy ⭐⭐⭐⭐

必须与 Paddle 保持一致。

当前商业模式：

```
One-time Purchase

Per Tax Season

No Subscription

No Auto Renewal
```

因此：

不要写：

```
Cancel Anytime
```

建议：

```
Customers may request
a refund within 14 days
of purchase.
```

并确保：

Paddle Dashboard

↓

Refund Policy

↓

Website

三者一致。

---

## 4. Cookie Policy ⭐⭐⭐

如果：

没有：

- Google Ads
- Meta Pixel
- Tracking

那么：

可以仅保留：

```text
We only use essential cookies
required for authentication
and security.
```

无需复杂 Cookie Banner。

---

## 5. Tax Disclaimer ⭐⭐⭐⭐⭐

这是 SnapTax 风险最高部分。

Dashboard：

```
Estimated Tax Saved
```

可以继续使用。

但是必须增加：

```text
This amount is an estimate only.

It does not constitute
tax advice.

Actual tax savings depend
on your personal tax situation.
```

---

## 6. Data Retention ⭐⭐⭐⭐

例如：

```
Receipt Data

18 Months

Deleted Account

30 days (cloud deletion target; see data-retention.md)
```

Privacy Policy

数据库

帮助中心

三者必须一致。

例如：

```text
We retain receipt records
for up to 18 months.

Deleted accounts
are permanently removed
within 30 days (target).
```

---

## 7. Paddle Dashboard ⭐⭐⭐⭐⭐

重点检查：

| 项目 | 是否一致 |
|-------|-----------|
| Company Name | ✅ |
| Support Email | ✅ |
| Privacy URL | ✅ |
| Terms URL | ✅ |
| Refund Policy | ✅ |
| Pricing | ✅ |
| Currency | ✅ |

这是 Paddle 最常见审核点。

---

## 8. California Privacy Rights（CPRA）⭐⭐⭐⭐⭐

建议律师确认。

至少提供：

```
California Privacy Rights
```

包括：

用户可以：

- Request Access
- Request Correction
- Request Deletion
- Data Portability

联系方式：

```
privacy@snaptax.xxx
```

---

# 四、上线法律文件目录

建议：

```
/legal

├── Privacy Policy
├── Terms of Service
├── Refund Policy
├── Cookie Policy
├── AI Data Processing Disclosure
├── Tax Disclaimer
├── California Privacy Notice
├── Data Retention Policy
└── Legal Review Memo.pdf
```

---

# 五、律师费用建议

第一版：

推荐：

Startup SaaS Lawyer

Privacy Lawyer

US Solo Attorney

需求：

```
We need a limited legal review
for a consumer SaaS product.

Please review:

• Privacy Policy

• Terms of Service

• Refund Policy

• AI Disclosure

• Tax Disclaimer

• CPRA Compliance

Please provide
a written Legal Review Memo.
```

预计费用：

```
1000 USD

~

3000 USD
```

即可。

无需：

- 企业 Compliance Audit
- SOC2 审计
- 全流程法律顾问

---

# 六、SnapTax 推荐上线方案

## 第一阶段（当前）

律师：

✅ Limited Legal Review Memo

自己完成：

- Privacy Policy
- Terms
- Refund Policy
- Cookie Policy
- AI Disclosure
- Tax Disclaimer
- CPRA Notice

---

## 第二阶段（获得市场验证）

补充：

- GDPR DPA
- SCC
- Security Whitepaper
- Vendor List
- Incident Response
- Enterprise Compliance

---

## 第三阶段（规模化）

根据业务增长：

- 外部法律顾问
- 年度法律审查
- SOC2
- ISO27001
- 企业客户合规

---

# 七、最终建议

对于 SnapTax 当前阶段：

**建议采用"有限法律审查（Limited Legal Review）+ 完整法律文档 + 合规检查清单"的组合方案。**

原因：

- MVP 需要快速验证市场。
- 控制法律成本。
- 满足 Paddle、支付平台及用户对基础合规的要求。
- 保留后续升级空间。

核心风险主要集中在：

1. AI 处理税务数据
2. 税务免责声明（避免被视为税务建议）
3. 隐私与数据处理（CPRA / GDPR）
4. Paddle 支付配置一致性
5. 跨境数据传输说明

建议在正式上线前完成一次律师 Limited Legal Review，并获得书面 Legal Review Memo，以便后续面对支付平台审核、应用商店审核、企业合作或投资尽调时提供合规证明。