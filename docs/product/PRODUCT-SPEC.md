# Snap1099 产品规范 (Product Spec)

> **版本：** v1.2 MVP · Canonical 产品设计文档  
> **读者：** 产品、设计、研发、测试、Cursor Agent  
> **原则：** 本文是可执行的决策摘要；完整交互文案见 [PRD](../prd/0.0.1.md) §2.5；法律全文见 [legal/privacy.md](../legal/privacy.md)（含 [privacy.updated.md](../prd/privacy.updated.md) 国际传输条款）。

---

## 1. 产品定位

面向 **欧盟与美国** 自雇/合同工（含北美 **1099**）的 PWA：**拍照即走**，联网时 **OpenAI 识别小票**，报税季 **Paddle 一次性付费** 导出 Excel。

| 项 | 说明 |
|----|------|
| 市场 | **欧盟（GDPR）** + **美国（CPRA/CCPA 等）** |
| 形态 | PWA（Serwist），离线优先 |
|  monetization | 零广告；仅报税季导出付费；**不卖用户数据** |
| **MVP 云存储** | **美国单区域**（用户知情同意）；欧盟分区域为路线图 |
| 哲学 | 聪明在后台，傻瓜在前台 |

---

## 2. 不可违反的铁律

### 2.1 视觉与交互（工地环境）

| 规则 | 要求 |
|------|------|
| 配色 | 纯黑 `#000000`、纯白 `#FFFFFF`、高亮黄 `#EAB308`（WCAG AAA） |
| 热区 | 可点击 ≥ 64×64px；拍照等核心按钮 > 96px |
| 反馈 | 按钮 `active:scale-95` |
| 核心流程零 Modal | 拍照链路禁止「是否确定/是否清晰」弹窗；错误用底部非阻塞红字 |
| **合规 Sheet 例外** | Terms/Privacy/US 告知、Delete Account、Google/Paddle — **仅 Bottom Sheet** |
| 布局 | **仅 2 逻辑页**；主界面三段式单屏，禁止全局滚动 |

### 2.2 离线优先（PWA）

- 核心 UI 离线可开；弱网 **≤ 1.5s** 可操作  
- **离线：** 可拍照；小票 + 照片入 **IndexedDB**；保持 `Processing...`，**不调 OpenAI**  
- **联网（含未登录 Ghost）：** 调用服务端 API → **OpenAI Vision** 识别小票（见 §2.3.1）  
- Service Worker 预缓存 `/` 及静态资源  

### 2.3 隐私、合规与数据存储（EU + US · MVP 美国驻留）

**法规目标：** GDPR + CPRA；通过 **知情同意 + Privacy 披露** 覆盖跨境处理。

#### 2.3.1 数据生命周期（Ghost → Google）

| 场景 | 本地 | 云端（美国） | OpenAI |
|------|------|--------------|--------|
| **未登录 + 离线** | IndexedDB 队列 | 无 | 无 |
| **未登录 + 在线** | IndexedDB 备份 | Blob + Postgres（`ghost_id`） | **是** — 识别小票 |
| **已登录 + 在线** | IndexedDB 缓存 | 同上，绑定 `user_id` | **是** |
| **Google 登录** | — | Ghost 小票 **迁移/关联** 至 Google 账户 | — |

**要点：**

- 联网识别是核心体验：**不要求先登录** 即可 AI 分类（与 PRD 三态列表一致）。  
- 身份数据（邮箱/姓名）**仅** Google 登录后收集。  
- **MVP 全部云端数据存美国**（Vercel / Neon / Blob US）；不在欧盟单独驻留。  
- 欧盟用户：通过脚注 + Privacy §4 **明确告知** 数据在美国处理；依赖 **TLS 1.3、AES-256（at rest）** 及子处理方 **EU-U.S. Data Privacy Framework** 等机制（见 [privacy.updated.md](../prd/privacy.updated.md)）。

#### 2.3.2 用户知情与同意（U2 + 美国存储）

| 触点 | 文案/行为 |
|------|-----------|
| **Snap 脚注（常驻）** | `By snapping, you agree to our Terms & Privacy Policy. Online processing stores data in the United States.` |
| **Terms / Privacy 链接** | Bottom Sheet 或 `/privacy` `/terms` |
| **Settings → Data storage** | 固定：`Processed and stored in the United States. See Privacy Policy for international transfers.` |
| **Privacy Policy §4** | 国际传输与美国存储完整表述（canonical：`docs/legal/privacy.md`） |

**不做：** Cookie 追踪横幅 · 首张票安全卡片 · Paywall 勾选 · 首次打开阻挡弹窗  

**路线图（非 MVP）：** 欧盟本地驻留（Frankfurt）可在基础设施就绪后启用，需更新 Privacy 与用户通知。

#### 2.3.3 设置页 Privacy & Data

Privacy Policy · Terms · **Data storage（美国）** · legal@snap1099.com · **Delete Account**（Sheet 确认；未登录清本地+Ghost 服务端数据；已登录 `DELETE /api/users/me`）

#### 2.3.4 子处理方（Privacy 必披露）

**OpenAI**（联网识别，含登录前）· **Paddle** · **Google** · **Vercel / Neon / Blob（美国）** — TLS 1.3；OpenAI API 无训练。

#### 2.3.5 用户权利

访问/导出 · Delete Account · legal@snap1099.com（48h 目标响应）

### 2.4 账户与身份

- **唯一正式凭证：** Google（禁止手机号/密码注册）  
- **Ghost：** 零阻断启动；`ghost_id` 关联联网期间产生的小票  
- **静默绑定：** Google 登录后 Ghost ↔ User；小票与退税额无感延续  
- **换机：** 未 Google 登录则数据不可恢复 — 软引导、设置、Paywall **三处**提醒  

### 2.5 API 与安全铁律

> 完整设计：[2026-06-05-api-security-design.md](../superpowers/specs/2026-06-05-api-security-design.md)

| 规则 | 要求 |
|------|------|
| OpenAI | **仅服务端**；未登录 Ghost 联网识别须走 API，但受 HMAC + 限流保护 |
| Ghost 认证 | 服务端签发 HMAC token（Cookie）；**禁止**裸信任客户端 UUID |
| 绑定后写权限 | Google 登录后小票写/删 **须 Session** |
| 上传 | JPEG/PNG、≤5MB；Blob **私有** + 短期 signed URL |
| 授权 | 所有小票 API 校验归属；他人资源返回 **404** |
| 滥用 | Ghost 10 张/小时；IP 与 OpenAI 熔断（MVP P0） |
| 密钥 | 不进客户端、不进日志、不进 Git |

---

## 3. 信息架构

```
主界面 (Home)
├── 顶栏：Est. Tax Saved + 设置
├── 中栏：SNAP RECEIPT
├── 合规脚注（Terms / Privacy / US processing）
├── 可选：Google 软引导横条
└── 底栏：Recent Receipts（三态 · 全量可滚动）

设置/导出 (Settings)
├── 账户状态区
├── 行业六选一
├── Privacy & Data（含 US storage 说明）
├── View on All Devices
└── Export IRS Tax Pack
```

---

## 4. 身份与登录门控

（与 v1.1 相同：Ghost 启动 · 软引导 · 硬拦截 · Google 面板）

### 4.4 登录后

Google 成功 → 绑定 Ghost → 迁移小票 → **若登录锁定区 ≠ Ghost 语言候选区** 则 OpenAI 重算，否则跳过重算

---

## 5. 小票状态机

| 状态 | 表现 | 触发 |
|------|------|------|
| **A Processing** | 黄字 + `Uploading` | 拍完立即 |
| **B Done** | 金额 + 商户 + 标签 | **联网** OpenAI 完成（未登录亦可） |
| **C Blurry** | 红字 Tap to resnap | 识别失败 |

- **离线：** 保持 A，入队；**联网后** 上传并调 OpenAI → B/C  
- **在线 Ghost：** 拍完即走 API 流水线，不 mock  

### 5.1 Est. Tax Saved（分区域省税估算）

> **Canonical：** [2026-06-07-tax-savings-regional-design.md](../superpowers/specs/2026-06-07-tax-savings-regional-design.md)

| 项 | 规则 |
|----|------|
| 顶栏数字 | **`SUM(tax_amount)`**（`status=done`）；禁止客户端硬编码 `×0.25` |
| **US** | \(\sum(\text{amount} \times \text{deduction\_ratio}) \times 25\%\)；科目比例由 OpenAI + IRS 兜底表 |
| **EU** | 可抵扣商业小票：**`tax_amount = vat_amount`**（进项 VAT） |
| **OpenAI** | **所有** `tax_amount` 变更须经 **Vision 读图** → Zod → 服务端公式；禁止无 Vision 重算 |
| **登录后** | 锁定 `users.data_region`；**与 Ghost 语言候选区一致 → 不重算**；不一致 → OpenAI 重算历史小票（`taxRecalcQueued`） |
| 区域 R1 | Ghost：`Accept-Language` → `snap1099_region_candidate` → Header **`X-Tax-Region`** |
| 存储 | `snaptax_receipts.tax_amount` + **`data_region` 冗余**；细节进 `ai_raw` |
|  disclaimer | **Est.** — 非税务建议（Terms） |

**说明：** `data_region` = 税法计算辖区；MVP 云端物理驻留仍 **美国单库**（§2.3）。

---

## 6. 付费（Paddle · 按报税季）

（与 v1.1 相同：$49 · Paddle Overlay · Export Again · 换机警告）

---

## 7. 行业分类

6 选 1；AI 可猜测默认项。

---

## 8. 服务端数据模型（产品摘要）

> [DB-DESIGN-SPEC.md](../tech/DB-DESIGN-SPEC.md) · `db/init-table.sql`

| 表 | 职责 |
|----|------|
| `snaptax_users` | OAuth 用户；MVP 可保留 `data_region=us` 或暂省略分域 |
| `snaptax_ghost_account` | Ghost ↔ User 一对一 |
| `snaptax_receipts` | 小票；**未登录** 挂 `ghost_id`；含 **`tax_amount`**、**`data_region`** |
| `snaptax_season_entitlements` | Paddle 报税季权益 |

**MVP 约束：** 单区域美国部署；Ghost 小票 API 须 **HMAC Ghost token**（见 §2.5）。

---

## 9. 异常与反呆（摘要）

断网排队 · 私人消费标 Non-Deductible · AI/API 失败底部红字可重试 · Delete Account Sheet

---

## 10. KPI

首屏 ≤1.5s · 拍照放弃率 ≤5% · Google 绑定 ≥40% · Paddle 转化监控

---

## 11. 技术栈（MVP）

Next.js 16 · React 19 · Tailwind 4 · Serwist · **PostgreSQL（美国）** · Prisma · **Vercel Blob（美国）** · **OpenAI Vision** · Paddle · Google OAuth  

---

## 12. 产品里程碑 vs 代码（2026-06）

| 能力 | 产品设计 v1.2 | 代码 |
|------|---------------|------|
| 主界面 + 拍照 + 三态 | ✅ | ✅（AI 仍为 client mock，待接 API） |
| 未登录 **联网 OpenAI** | ✅ | ❌ |
| 美国存储 + 知情 UI | ✅ | ✅ |
| Google 软/硬引导 UI | ✅ | ✅（mock GIS；待真实 OAuth） |
| 设置页账户区 + 多端 + Paywall UI | ✅ | ✅（Paddle mock） |
| Privacy §4 国际传输 | ✅ | ✅ |
| Google + Ghost 绑定（后端） | ✅ | ❌ |
| Paddle（后端 Webhook） | ✅ | ❌ |
| Ghost 小票 API（美国） | ✅ | ❌ |
| DB DDL + Prisma + UTC | ✅ | ✅ |
| 分区域省税 US/EU + R1 | ✅ | ❌（代码仍 ×0.25 mock） |

---

## 13. Agent 检查清单

- [ ] **联网 Ghost** 是否走 OpenAI/API，而非仅 mock？  
- [ ] **离线** 是否不调 OpenAI、仅队列？  
- [ ] 脚注与 Settings 是否告知 **美国存储/处理**？  
- [ ] Privacy §4 与 `privacy.updated.md` 一致？  
- [ ] 未登录小票是否用 `ghost_id` 写美国云？  
- [ ] Google 登录后是否迁移 Ghost 数据？  
- [ ] Ghost 是否用 **HMAC token**，而非裸 `X-Ghost-Id`？  
- [ ] OpenAI / Blob 是否 **仅服务端**、Blob 是否私有？  
- [ ] 顶栏是否 **SUM(tax_amount)**，且 **仅 OpenAI Vision 路径** 更新 `tax_amount`？  
- [ ] Google 登录后 **仅 region 不一致** 时是否排队 OpenAI 重算？  

---

## 14. 文档索引

| 文档 | 用途 |
|------|------|
| [legal/privacy.md](../legal/privacy.md) | 隐私政策 canonical |
| [prd/privacy.updated.md](../prd/privacy.updated.md) | §4 国际传输摘要 |
| [prd/0.0.1.md](../prd/0.0.1.md) | PRD §2.5 |
| [specs/2026-06-05-compliance-privacy-design.md](../superpowers/specs/2026-06-05-compliance-privacy-design.md) | 合规 ADR（v1.2 以本文为准覆盖分区域 MVP） |
| [specs/2026-06-05-api-security-design.md](../superpowers/specs/2026-06-05-api-security-design.md) | API 安全 ADR（Ghost HMAC、OpenAI、IDOR、限流） |
| [specs/2026-06-06-product-tech-code-consistency-audit.md](../superpowers/specs/2026-06-06-product-tech-code-consistency-audit.md) | 产品/技术/代码一致性审计 |
| [specs/2026-06-07-tax-savings-regional-design.md](../superpowers/specs/2026-06-07-tax-savings-regional-design.md) | 分区域省税 US/EU + R1 |
| [specs/2026-06-07-mvp-master-roadmap-design.md](../superpowers/specs/2026-06-07-mvp-master-roadmap-design.md) | MVP 总路线图 |
| [plans/2026-06-07-mvp-master-implementation.md](../superpowers/plans/2026-06-07-mvp-master-implementation.md) | **MVP 总落地计划** |

**变更流程：** 产品决策 → **本文件** → PRD → `docs/legal/` → UI 文案（`lib/legal/content.ts`）
