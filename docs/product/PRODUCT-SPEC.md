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
| 布局 | **仅 2 逻辑页**；主界面 **固定 chrome**（TaxHeader + Snap + InlinePrivacy + WidgetPager）+ **可滚动内容区**（小票列表）；禁止整页 `body` 滚动，快门区始终可见 |

### 2.2 离线优先（PWA）

- 核心 UI 离线可开；弱网 **≤ 1.5s** 可操作  
- **离线：** 可拍照；小票 + 照片入 **IndexedDB**；保持 `Processing...`，**不调 OpenAI**  
- **联网（含未登录 Ghost）：** 本地 OCR Worker 生成 `ocrDraft`（离线亦可）；上传后服务端 **文本 GPT 分类**（Path A）或 **OpenAI Vision 兜底**（Path B，见 §2.3.1）  
- Service Worker 预缓存 `/` 及静态资源  

### 2.3 隐私、合规与数据存储（EU + US · MVP 美国驻留）

**法规目标：** GDPR + CPRA；通过 **知情同意 + Privacy 披露** 覆盖跨境处理。

#### 2.3.1 数据生命周期（Ghost → Google）

| 场景 | 本地 | 云端（美国） | OpenAI |
|------|------|--------------|--------|
| **未登录 + 离线** | IndexedDB 队列 | 无 | 无 |
| **未登录 + 在线** | IndexedDB 备份 + `ocrDraft` | Blob + Postgres（`ghost_id`） | **是** — 文本分类优先；Vision 兜底 |
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
| **相机界面脚注（snap 时）** | `By snapping, you agree to our Terms & Privacy Policy. Online processing stores data in the United States.`（`CameraOverlay` 底部；首页 Snap 按钮下与 Trust Bar 内均不重复） |
| **Trust Bar（常驻）** | 单行隐私 reassurance 条（`Your receipts stay private…` + 🛡）；**Learn more** → 全屏 Trust overlay（4 条信任点 + **Got it**），非居中 Modal、非首张票阻挡卡片 |
| **Terms / Privacy 链接** | Bottom Sheet 或 `/privacy` `/terms` |
| **Data Retention / Security** | Settings → Privacy & Data 链至 `/data-retention`、`/security` |
| **Settings → Data storage** | 固定：`Processed and stored in the United States. See Privacy Policy for international transfers.` |
| **Privacy Policy §6** | 国际传输与美国存储完整表述（canonical：`docs/legal/privacy.md`） |

**不做：** Cookie 追踪横幅 · 首张票安全卡片 · Paywall 勾选 · 首次打开阻挡弹窗  

**路线图（非 MVP）：** 欧盟本地驻留（Frankfurt）可在基础设施就绪后启用，需更新 Privacy 与用户通知。

#### 2.3.3 设置页 Privacy & Data

Privacy Policy · Terms · **Data Retention** · **Security** · **Data storage（美国）** · legal@snap1099.com · **Delete Account**（Sheet 确认；未登录清本地+Ghost 服务端数据；已登录 `DELETE /api/users/me`）

#### 2.3.4 子处理方（Privacy 必披露）

**OpenAI**（联网识别，含登录前）· **Paddle** · **Google** · **Vercel / Neon / Blob（美国）** — TLS 1.3；OpenAI API 无训练。

#### 2.3.5 用户权利

访问/导出 · Delete Account · legal@snap1099.com（**30 天**法定响应；**48 小时**内确认收悉）· DSR 内部流程见 `docs/ops/dsr-playbook.md`

### 2.4 账户与身份

- **唯一正式凭证：** Google（禁止手机号/密码注册）  
- **Ghost：** 零阻断启动；`ghost_id` 关联联网期间产生的小票  
- **静默绑定：** Google 登录后 Ghost ↔ User；小票与退税额无感延续  
- **换机：** 未 Google 登录则数据不可恢复 — **Settings Account** 与 **导出/多设备硬拦截** 提醒（首屏无登录横条）  

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
├── 固定区（不滚动）
│   ├── TaxHeader：Est. Tax Saved **photo hero 卡片**（`/photo/hero.png` + overlay）；**CPA/IRS Ready** Export + **ADD HOME** 安装（header-button 模式；64px 热区；主屏网格图标+短文案）+ Settings（无 Sync/Filter / 无盾牌）
│   ├── SnapButton：全宽黄 SNAP RECEIPT（合规脚注仅在相机界面）
│   ├── InlinePrivacy：Snap 下内联隐私条 + Learn more → privacy-trust overlay
│   └── WidgetPager：Need Action 有 ACTION 小票时固定第 2 位；报税季 + ACTION 时 CPA /IRS Ready 第 3 位
├── 滚动区（flex-1 min-h-0 overflow-y-auto）
│   └── 小票区：ReceiptFilterBar（ALL · READY · REVIEW · ACTION · PROCESSING）+ ReceiptList（RECENT RECEIPTS + Pull to refresh）
└── HomeOverlayHost（viewState 全屏 overlay，非新路由）
    ├── deadline-detail · missing-deductions · missing-deduction-item · privacy-trust
    └── `< BACK` 或 **Got it** 关闭；`view === "settings"` 仍为唯一第二逻辑页

设置/导出 (Settings)
├── [1] 账户区（未登录施压 headline + Continue with Google；已登录 Avatar 首字母 + 姓名 + Paid）
├── [2] 税务资产总览 v5（Est. Tax Saved · Receipts 计数 · Deductions；户外大字号；有值绿/零值灰；数据来自 HomeScreen）
├── [3] Export Tax Pack 卡片 v5（五态标题/CTA + 卡片内黄按钮；P0 截止 Apr 15 前 ≤7 天）
├── [4] Export 状态横幅（绿 sample ready / 红 export blocked）
├── [5] Share（3 头像 + WhatsApp/Facebook/More；无 Learn 链接）
├── [6] Preferences v5（72pt 行 + 彩色图标 + 通知 green pill → viewState 子页）
└── [7] Sign out（页底全宽按钮，仅已登录）
```

**Settings Export 卡片五态（P0 优先）：**

| 状态 | 标题 | CTA |
|------|------|-----|
| P0 已付费 + 距 Apr 15 ≤7 天 | Final Tax Pack Ready | Export Final Tax Pack |
| 未登录 | Unlock IRS Tax Pack | Preview Sample Export → Path A |
| 已登录未付费 | Export `{season}` IRS Tax Pack | Unlock for $49 → Paywall |
| 已付费未导出 | `{season}` IRS Tax Pack Unlocked | Download Tax Pack |
| 已付费已导出 | Tax Filing Ready | Export Again |

**Settings Export 门控（与 Home 区分）：**

| 入口 | Ghost（未登录） | 已登录未付费 | 已登录已付费 |
|------|----------------|-------------|-------------|
| **Settings Export** | **v3 Path A**：样例中间页 → Download CSV → Completed → VIEW STATUS 回主屏 + 绿色状态条 | `useTaxExportGate` → Paywall（天平 UI）；Maybe later → 红色 Export blocked 横幅 | Export Again |
| **Home Export**（TaxHeader · CPA Ready） | **不变** — 仍走完整 export 门控（硬拦截 Google / Paywall） | 同上 | 同上 |

> 设计：[2026-06-18-settings-v5-redesign-design.md](../superpowers/specs/2026-06-18-settings-v5-redesign-design.md) · v3 交互：[2026-06-17-settings-v3-redesign-design.md](../superpowers/specs/2026-06-17-settings-v3-redesign-design.md) · PRD：`docs/prd/settings.md`

### 3.1 连拍相机与 Post-Review

> 设计：[2026-06-08-batch-snap-camera-design.md](../superpowers/specs/2026-06-08-batch-snap-camera-design.md) · [2026-06-09-post-batch-review-flow-design.md](../superpowers/specs/2026-06-09-post-batch-review-flow-design.md) · [2026-06-10-camera-live-footer-ui-design.md](../superpowers/specs/2026-06-10-camera-live-footer-ui-design.md)

| 模式 | 行为 |
|------|------|
| **Live 连拍** | 快门不断流；每张即时写 IndexedDB |
| **Live Footer UI** | 白快门 + **300ms** 绿弧 cooldown · 黄 **⚡ FLASH DONE** · 深绿 **DONE & REVIEW** · Gallery 最新张黄框 |
| **⚡ FLASH DONE** | 跳过 review → 立即 flush + 回主屏（快车道） |
| **DONE & REVIEW** | 进入 postReview 严审 → 审完 flush |
| **BATCH 气泡** | batchPreview 轻量查看 → BACK 继续拍 |
| **postReview** | DELETE / RESNAP / Accept（严审沙盒） |
| **列表 Resnap** | 独立 single 模式（非 batch postReview） |
| **详情 DELETE/RESNAP** | 预览区 overlay；processing/blurry 即时删 + RESNAP；done 仅 DELETE + Sheet 确认 |

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

## 12. 产品里程碑 vs 代码（2026-06-13）

| 能力 | 产品设计 v1.2 | 代码 |
|------|---------------|------|
| 主界面 + 拍照 + 三态 | ✅ | ✅ |
| 未登录 **联网 OpenAI** | ✅ | ✅（本地 OCR + `classifyReceiptText`；Vision 兜底） |
| 美国存储 + 知情 UI | ✅ | ✅ |
| Google 软/硬引导 UI | ✅ | ✅（GIS + 后端绑定；T1 Nudge + T2 首次 Settings Sheet） |
| 蓝领新人引导（Aha onboarding） | ✅ | ✅（Hero Stage 0 + shadow/sandbox/Aha + Stage 1 SNAP focus ring） |
| 设置页账户区 + 多端 + Paywall UI | ✅ | ✅（Paddle.js Overlay；无 env 时阻断，不假成功） |
| Privacy §6 国际传输 + SCC/CPRA | ✅ | ✅（`docs/legal/privacy.md` 12 节；`/data-retention` `/security`） |
| Terms §6 Est. Tax Saved 免责 | ✅ | ✅（Settings Export 卡脚注） |
| DSR 30 天 SLA + playbook | ✅ | ✅（`docs/ops/dsr-playbook.md`） |
| Data Retention 文档 = 代码常量 | ✅ | ✅（`docs/legal/data-retention.md` · 18mo/90d/24h） |
| Security Baseline 控制矩阵 | ✅ | ✅（`docs/tech/SECURITY-BASELINE.md`） |
| WCAG 2.2 AA 核心路径 | ✅ | ✅（axe 0 critical/serious · `docs/accessibility/`） |
| Google + Ghost 绑定（后端） | ✅ | ✅ |
| Paddle（后端 Webhook） | ✅ | ✅（需配置 `PADDLE_*` / `NEXT_PUBLIC_PADDLE_*`） |
| Ghost 小票 API（美国） | ✅ | ✅（HMAC Cookie + 限流） |
| DB DDL + Prisma + UTC | ✅ | ✅ |
| 分区域省税 US/EU + R1 | ✅ | ✅（`SUM(tax_amount)` + `X-Tax-Region`） |
| 行业六选一 | ✅ | ✅（登录 API 回填；Ghost `localStorage`） |
| Home WidgetPager（Snap 下固定分页） | ✅ | ✅（等宽 3 卡/页，>3 左滑 + 分页点） |
| Home v2 筛选桶 + 列表展示 | ✅ | ✅（ALL/READY/REVIEW/ACTION/PROCESSING；绿/灰 tax；category + Line pill） |
| 本地 OCR + 双路径 AI（Phase 1） | ✅ | ✅（Worker OCR、`ocrDraft`、router、`biz.ocr` 日志；O3 ROI/EU parse） |

**Dev 限制（非产品偏离）：** 无 Upstash 时速率限制放行；无 Paddle env 时 Paywall 显示错误而非假付费。

---

## 13. Agent 检查清单

- [ ] **联网 Ghost** 是否走 OpenAI/API，而非仅 mock？  
- [ ] **离线** 是否不调 OpenAI、仅队列？  
- [ ] 脚注与 Settings 是否告知 **美国存储/处理**？  
- [ ] Privacy §6 与 `docs/legal/privacy.md` 一致？  
- [ ] Settings 是否链至 **Data Retention** / **Security**？  
- [ ] Export 卡是否含 **Est. Tax Saved 免责**？  
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
| [legal/privacy.md](../legal/privacy.md) | 隐私政策 canonical（英文） |
| [legal/data-retention.md](../legal/data-retention.md) | 数据保留政策 |
| [legal/security-incident.md](../legal/security-incident.md) | 安全与事件响应摘要 |
| [ops/dsr-playbook.md](../ops/dsr-playbook.md) | DSR 内部处理流程 |
| [tech/SECURITY-BASELINE.md](../tech/SECURITY-BASELINE.md) | 安全基线控制矩阵 |
| [accessibility/WCAG-22-AA-summary.md](../accessibility/WCAG-22-AA-summary.md) | WCAG 2.2 AA 符合性摘要 |
| [legal/privacy.fr.md](../legal/privacy.fr.md) | 隐私政策（法文） |
| [legal/privacy.de.md](../legal/privacy.de.md) | 隐私政策（德文） |
| [legal/terms.md](../legal/terms.md) | 服务条款（英文） |
| [legal/terms.fr.md](../legal/terms.fr.md) | 服务条款（法文） |
| [legal/terms.de.md](../legal/terms.de.md) | 服务条款（德文） |
| [prd/privacy.updated.md](../prd/privacy.updated.md) | §4 国际传输摘要 |
| [prd/0.0.1.md](../prd/0.0.1.md) | PRD §2.5 |
| [specs/2026-06-05-compliance-privacy-design.md](../superpowers/specs/2026-06-05-compliance-privacy-design.md) | 合规 ADR（v1.2 以本文为准覆盖分区域 MVP） |
| [specs/2026-06-05-api-security-design.md](../superpowers/specs/2026-06-05-api-security-design.md) | API 安全 ADR（Ghost HMAC、OpenAI、IDOR、限流） |
| [specs/2026-06-13-product-code-alignment-design.md](../superpowers/specs/2026-06-13-product-code-alignment-design.md) | 产品/代码全面对齐（2026-06-13） |
| [specs/2026-06-07-tax-savings-regional-design.md](../superpowers/specs/2026-06-07-tax-savings-regional-design.md) | 分区域省税 US/EU + R1 |
| [specs/2026-06-12-new-user-onboarding-design.md](../superpowers/specs/2026-06-12-new-user-onboarding-design.md) | 新人引导（业务分析 + T1/T2 软引导） |
| [specs/2026-06-07-mvp-master-roadmap-design.md](../superpowers/specs/2026-06-07-mvp-master-roadmap-design.md) | MVP 总路线图 |
| [plans/2026-06-07-mvp-master-implementation.md](../superpowers/plans/2026-06-07-mvp-master-implementation.md) | **MVP 总落地计划** |

**变更流程：** 产品决策 → **本文件** → PRD → `docs/legal/` → UI 文案（`lib/legal/content.ts`）
