# Snap1099 欧盟 & 美国合规与隐私设计

**日期：** 2026-06-05  
**状态：** 已实现（P0 合规 UI/法律文案）；**MVP 数据驻留以 PRODUCT-SPEC v1.2 为准**（美国单区域）；下文 R1/D1/geo API 为 **路线图**  
**依据：** `docs/product/PRODUCT-SPEC.md` v1.2（Canonical）· `docs/prd/0.0.1.md` · `docs/legal/privacy.md`

> **⚠️ MVP 覆盖声明（2026-06-06）**  
> **PRODUCT-SPEC v1.2** 取代本 ADR 中以下 MVP 行为：  
> - **数据驻留：** MVP **全部云端数据存美国**（知情同意 + Privacy §4），非 EU/US 分库。  
> - **Ghost 联网：** 未登录 + 在线 → **可调 OpenAI**（经服务端 API），非「登录前禁止上云」。  
> - **`data_region`：** 库字段默认 `us`；不做 EU 路由。  
> - **§2 分区域基础设施、`GET /api/geo/region`：** **路线图**，非 MVP 实施范围。  
> 合规 UI（U2）、法律文档结构、Delete Account 入口仍以本 ADR + PRODUCT-SPEC 为准。

---

## 1. 目标

上线后满足 **欧盟 GDPR** 与 **美国 CPRA/CCPA** 等隐私要求，降低法律与差评风险；在保持「零阻断 Ghost + 核心拍照零 Modal」前提下，通过 **U2 精简合规 UI** 完成知情同意与数据权利入口。

### 1.1 已锁定决策

| 决策点 | 选择 |
|--------|------|
| 市场 | 欧盟 + 美国 |
| 数据驻留 | **R1** — EU → Frankfurt；US → 美国区域（Virginia/Oregon 等） |
| 区域判定 | **D1+D3** — 登录前数据**仅存浏览器**；IP/语言 **候选区**；Google 登录后 **最终 `data_region`** 再上云 |
| 合规 UI | **U2** — Snap 脚注 + 设置页 Privacy & Data；**不含**首张票安全卡片、Paywall 勾选 |
| 法律文案交付 | **方案 1** — `docs/legal/` canonical + 公开路由 + App 内 Bottom Sheet |

---

## 2. 数据流架构

### 2.0 MVP 现行行为（PRODUCT-SPEC v1.2 · 以此为准）

| 场景 | 本地 | 云端（美国） | OpenAI |
|------|------|--------------|--------|
| 未登录 + 离线 | IndexedDB 队列 | 无 | 无 |
| 未登录 + 在线 | IndexedDB 备份 | Blob + Postgres（`ghost_id`） | **是** |
| 已登录 + 在线 | IndexedDB 缓存 | 同上，绑定 `user_id` | **是** |
| Google 登录 | — | Ghost 小票迁移/关联 | — |

- Ghost 登记：`POST /api/ghost/register` → HMAC Cookie（见 api-security ADR）；**不写** `snaptax_ghost_account`。  
- 合规触点：Snap 脚注 + Settings Privacy & Data + `/privacy` `/terms`（已实现）。  
- 用户字段 `data_region='us'` 固定；`data_region_locked_at` 在 Google 登录时写入。

### 2.1 Ghost / 未登录阶段（路线图 · 原 R1/D1 设计）

> **非 MVP。** 保留供 EU 分区域上线时参考。

```
用户拍照
  → IndexedDB（小票 + 照片）
  → 客户端 mock AI 或本地排队（禁止 OpenAI / Blob / Postgres）
  → localStorage: ghost_id, data_region_candidate
```

**D1 候选区域（不上云、不存 PII）：**

- 首次打开调用 `GET /api/geo/region`（Vercel Edge）
- 返回 `eu` | `us`；失败时按 `Accept-Language` 回退（EU 语言 → `eu`，否则 `us`）
- 写入 `localStorage.snap1099_region_candidate`

**合规意义：** 登录前无跨境持久化；EU 用户小票在确认区域前不进入 US 数据库。

### 2.2 Google 登录后（路线图 · 分区域版）

> **MVP：** 单美国 API；登录后 `data_region=us`；IndexedDB pending → 同一美国栈。

```
Google OAuth 成功
  → 确定 data_region（region_candidate 为主；与 Google locale 冲突时 Bottom Sheet 二选一，MVP 默认 candidate）
  → upsert snaptax_users.data_region + data_region_locked_at
  → insert snaptax_ghost_account
  → 批量上传 IndexedDB pending → 对应区域 API
  → 该区域栈内：Blob 存图 → OpenAI → Postgres
```

**禁止（分区域 MVP 时）：** 登录后仍向错误区域 API 写入（服务端校验 `user.data_region` vs 请求区域）。

### 2.3 分区域基础设施（R1 · 路线图）

| 组件 | EU | US |
|------|----|----|
| Postgres | Neon **Frankfurt** | Neon **US East/West** |
| Blob | Vercel Blob **EU** | Vercel Blob **US** |
| API / Hosting | Vercel Project EU 或 region 路由 | Vercel Project US |

**MVP 部署建议：**

- 两个 Vercel Project（或单 Project + Edge 路由 + 双 `DATABASE_URL`）
- 客户端环境变量：`NEXT_PUBLIC_API_EU`、`NEXT_PUBLIC_API_US`
- 登录后根据 `data_region` 选择 API base URL

**数据跨境（OpenAI）：**

- Privacy Policy 披露：登录后小票图像经 TLS 发送至 OpenAI API 做分类；引用 OpenAI DPA / 无训练政策
- EU 用户：优先 OpenAI 企业条款 + SCC；处理记录在 Privacy §3

---

## 3. 法律文档

### 3.1 文件结构

```
docs/legal/
├── privacy.md      # 从 docs/prd/privacy.md 迁移并修订
└── terms.md        # 新建 Terms of Service
```

公开路由（Next.js）：

- `/privacy` — 静态/MD 渲染 Privacy Policy
- `/terms` — Terms of Service

App 内 Bottom Sheet 与公开页 **同源文案**（避免双源漂移）。

### 3.2 Privacy Policy 必修订点（相对现有 `privacy.md`）

1. **登录前本地存储** — Ghost 阶段数据仅存在用户设备，不上传服务器  
2. **登录后区域驻留** — 按 `data_region` 存入 Frankfurt 或 US；不再暗示未登录即上云  
3. **子处理方清单** — Google OAuth、OpenAI Vision、Paddle、Vercel、Neon  
4. **用户权利** — 访问、导出、删除（Delete Account）；联系 **snaptax.lightxforge@gmail.com**，48h 内响应目标  
5. **零广告 / 不卖数据** — 保留现有 §5 表述  
6. **非税务建议免责声明** — 工具非 CPA/律师建议（可在 Terms 详述）

### 3.3 Terms of Service（新建）要点

- 服务描述（小票拍照、AI 归类、报税季导出）  
- 适用人群与地域；**非专业税务建议**  
- 账户与 Google 登录；Ghost 与换机数据丢失告知  
- Paddle 一次性付费、退款政策占位（按 Paddle 政策）  
- 责任限制、终止服务、适用法律（US 主体 + EU 用户 GDPR 权利不受影响）  
- 联系 snaptax.lightxforge@gmail.com

---

## 4. UI 规范（U2）

### 4.1 主界面 — 隐式同意脚注

**位置：** `SNAP RECEIPT` 按钮正下方（`SnapButton` / `docs/ui/ui.html`）

**文案（英文 UI，与 PRD 一致）：**

```
By snapping, you agree to our Terms & Privacy Policy.
```

**交互：**

- `Terms`、`Privacy Policy` 为链接，黄色下划线，热区 ≥ 44px  
- 点击 → **Bottom Sheet** 半屏展示法律文本；下滑或 BACK 关闭  
- **不阻断**拍照；首次打开 **无** Cookie/同意阻挡层  

### 4.2 设置页 — Privacy & Data 区块

**位置：** 「Your Industry」下方、「Tax Season Export」上方

| 入口 | 未登录 | 已登录 |
|------|--------|--------|
| Privacy Policy | Sheet / `/privacy` | 同左 |
| Terms of Service | Sheet / `/terms` | 同左 |
| Data storage | `On this device only until you sign in with Google` | `Stored in EU (Frankfurt)` 或 `Stored in US` |
| Contact | `snaptax.lightxforge@gmail.com` mailto | 同左 |
| Delete Account | 清本地数据 | 云 + 本地全删 |

**视觉：** 与现有设置页一致 — 黑底、 zinc 卡片、热区 ≥ 64px、无细灰字。

### 4.3 Delete Account

**组件：** Bottom Sheet 二次确认（**合规允许的 Sheet**，非居中 Modal）

| 状态 | 确认文案 | 动作 |
|------|----------|------|
| 未登录 | Clears all receipts on this device. Cannot be undone. | 清 IndexedDB + ghost localStorage → 主界面 |
| 已登录 | This is irreversible. All cloud receipts and account data will be permanently deleted. | `DELETE /api/users/me` → 清 Blob/DB → 清本地 → 主界面 |

**错误：** 底部非阻塞红字，可重试。

### 4.4 明确不做（U2 范围外）

- 首张票「Bank-Level Security」卡片（`0.0.1.update.md` §2.2）  
- Paywall 内换机风险勾选 + Google 灰色禁用（§2.3 节点 3）  
- 第三方 Cookie 横幅（MVP 无广告追踪；仅必要 session cookie）  

**Paywall / Google 门控：** 继续遵循 `0.0.1.md` §2.3–§2.4（Paddle、软/硬引导），不新增勾选步骤。

### 4.5 `docs/ui/ui.html` 更新

- 主界面：Snap 按钮下脚注 + 链接样式  
- 设置页 mock：Privacy & Data 五入口 + Data storage 一行  

---

## 5. 后端与 Schema

### 5.1 数据库增量

`snaptax_users` 新增：

| 列 | 类型 | 说明 |
|----|------|------|
| data_region | varchar(8) NOT NULL | `eu` \| `us`，登录时写入 |
| data_region_locked_at | timestamp(3) NOT NULL | 区域确认时间；MVP 不可改 |

同步：`db/init-table.sql`、`prisma/schema.prisma`、`DB-DESIGN-SPEC.md`。

### 5.2 API

| 端点 | 说明 |
|------|------|
| `GET /api/geo/region` | Edge；返回 `{ region: "eu" \| "us" }`；无 DB、无 cookie |
| `POST /api/auth/google` | 接收 `regionCandidate`；写入 `data_region`；触发 pending 上传 |
| `DELETE /api/users/me` | 删 user、receipts、Blob、entitlements、ghost_binding；幂等 |
| 现有 receipts API | 登录后才可调用；校验 session + 区域路由 |

### 5.3 客户端行为变更

- Ghost 阶段：**禁止**调用 upload/process API（与 D1+D3 一致）  
- 登录成功：`syncPendingReceipts()` → 正确区域 base URL  
- `HomeScreen` 在线 mock AI：仅登录后走服务端；未登录保持本地 processing 或 mock  

---

## 6. PRD / PRODUCT-SPEC 更新清单

### 6.1 `docs/prd/0.0.1.md` 新增 §2.5 隐私与合规

- U2 三入口（脚注、Settings Privacy & Data、Delete Account）  
- D1+D3 数据流一句话  
- R1 分区域一句  
- Modal 例外引用 §7  

### 6.2 `docs/product/PRODUCT-SPEC.md`

- 合规铁律：登录前不上云；EU/US 分驻；Delete Account 必须可达  
- §11 实现状态增合规项  
- 零 Modal 例外列表  

### 6.3 `.cursor/rules`

- `snap1099-product.mdc`：合规 UI 与 Delete Account  
- `snap1099-ui.mdc`：脚注与 Privacy 区块样式  
- 可选 `snap1099-compliance.mdc`：globs legal + privacy 相关组件  

---

## 7. 「零 Modal」例外（canonical）

| 场景 | UI 形态 |
|------|---------|
| Terms / Privacy 阅读 | Bottom Sheet |
| Delete Account 确认 | Bottom Sheet |
| Google 登录 / Paddle Paywall | Bottom Sheet（已有 PRD） |
| 区域冲突二选一（罕见） | Bottom Sheet |

**禁止：** 居中 Modal Dialog；登录前 Cookie 墙。

---

## 8. 测试与验收

| # | 验收项 |
|---|--------|
| 1 | 未登录拍照 → Network 无 POST receipts / OpenAI |
| 2 | 登录前 `/privacy`、`/terms` 可访问；脚注链接打开 Sheet |
| 3 | 登录后 Settings 显示正确 `Data storage` 区域文案 |
| 4 | Delete Account（未登录）清本地；（已登录）调 DELETE 且 Blob/DB 清空 |
| 5 | EU 测试账号数据仅出现在 EU Neon/Blob（手工或 staging 验证） |
| 6 | Privacy/Terms 英文文案含 GDPR、CPRA、子处理方、legal 邮箱 |

---

## 9. 实现分期建议

| 阶段 | 范围 |
|------|------|
| **P0** | 法律文档 + PRD/PRODUCT 更新 + UI 脚注 + Settings Privacy & Data + ui.html |
| **P1** | Delete Account API + 本地清除 + Sheet 确认 |
| **P2** | `data_region` schema + geo API + 登录后区域绑定 + 双区域部署 |
| **P3** | 登录后 sync pipeline；禁止 Ghost 上云 |

P0 可先做 UI/文档；P2/P3 与后端 MVP 同期。

---

## 10. 相关文档

- UX 参考（部分弃用）：`docs/prd/0.0.1.update.md` §三  
- 隐私政策草稿：`docs/prd/privacy.md` → 迁移至 `docs/legal/privacy.md`  
- 技术栈：`docs/tech/01-architecture.md`、`docs/tech/09-deployment-vercel.md`
