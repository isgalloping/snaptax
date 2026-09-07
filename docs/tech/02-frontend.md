# 02 — 前端架构

## 2.1 技术栈

- Next.js 16 App Router · React 19 · TypeScript · Tailwind 4
- Serwist PWA（`app/sw.ts`, `@serwist/turbopack`）
- IndexedDB（`lib/storage/receiptDb.ts`；object store **`snaptax_*`**，见 [DB-DESIGN-SPEC.md](./DB-DESIGN-SPEC.md) §2.2）

## 2.2 页面与组件

| 逻辑页 | 路由 | 组件入口 |
|--------|------|----------|
| **营销站** | `/`, `/pricing`, `/help` … | `app/(marketing)/` · `components/marketing/` |
| **产品 PWA** | **`/app`** | `app/(pwa)/app/page.tsx` → `StartupShell` / `HomeScreen` |
| 设置/导出 | 同 `/app` SPA 状态 `view=settings` | `components/settings/SettingsScreen.tsx` |

> PRD 要求 2 **逻辑页**（主界面 + 设置）；路由上营销与产品已拆分，**拍照主界面仅在 `/app`**。

## 2.2.1 PWA 安装架构

**Canonical：** [13-pwa-install-architecture.md](./13-pwa-install-architecture.md)

- Manifest：`short_name` **SnapTax** · `scope`/`start_url` **`/app`**
- 根 layout：`InstallCaptureScript`（全站捕获 install prompt）
- 营销：`MarketingInstallShell`（轻量 bar + header）
- 产品：`AppBrowserEntryGate`（Landing 后全屏门控，可跳过）
- 营销 CTA：`MarketingAppLink` 原生 `<a href="/app">`（Android WebAPK）

## 2.2.2 行业 SEO 落地页（`/tax-deductions/*`）

**意图：** 复用一套营销页组件，为具体工种发布 tax deduction checklist；页面只教育和转化，产品入口仍统一去 `/app`，不进入 PWA scope。

### 架构地图

| 层 | 路径 | 职责 |
|----|------|------|
| Registry | `lib/marketing/seo/industries.ts` | `PUBLISHED` 列表、`listPublishedIndustries()`、`getIndustryBySlug(slug)` |
| 类型 | `lib/marketing/seo/types.ts` | `IndustrySeoPage` schema；`presentation?: "default" \| "mockup"`；hero `visualLayout` |
| 单工种内容 | `lib/marketing/seo/industries/*.ts` | 文案、FAQ、deduction cards、素材路径、related trades |
| Index | `app/(marketing)/tax-deductions/page.tsx` → `TaxDeductionsIndex` | 列出 `listPublishedIndustries()` 返回的已发布工种 |
| 工种路由 | `app/(marketing)/tax-deductions/{slug}/page.tsx` | 薄路由：metadata + JSON-LD + `IndustrySeoPageView` |
| 页面组合器 | `components/marketing/seo/IndustrySeoPage.tsx` | 固定区块顺序：Hero → Deductions → How it works → Problems → Checklist → Built for → Examples → FAQ → CTA → Related trades → Disclaimer |
| Sitemap | `lib/marketing/seo/sitemapEntries.ts` + `app/sitemap.ts` | `/tax-deductions` priority `0.6`，每个工种 priority `0.7` |
| 素材清单 | `docs/seo/{slug}/ASSETS.md` + `public/marketing/seo/` | 记录 hero、phone、steps、OG、CTA 背景等文件 |

当前发布顺序（与测试一致）：`electrician`、`hvac`、`plumber`、`roofer`、`landscaper`。`electrician` 使用默认 presentation；`hvac`、`plumber`、`roofer`、`landscaper` 使用 `presentation: "mockup"` + `hero.visualLayout: "spotlight"`。

### 新增或修改工种 Checklist

1. 在 `lib/marketing/seo/industries/{slug}.ts` 新增 `IndustrySeoPage` 数据；只使用真实产品分类（如 `Tools`、`Truck Gas`、`Supplies`、`Equipment`、`Materials`、`Other`），不要发明 “Smart {trade} Categories”。
2. 在 `lib/marketing/seo/types.ts` 扩展 union（如需新 slug）和字段；避免在组件里写 `slug === "..."` 分支，优先使用 `presentation`、`visualLayout` 或可选字段。
3. 在 `lib/marketing/seo/industries.ts` 注册到 `PUBLISHED`；这会驱动 index 页。
4. 新增 `app/(marketing)/tax-deductions/{slug}/page.tsx`，模式同现有工种：`buildMarketingMetadata()`、`buildIndustryJsonLd()`、`IndustrySeoPageView`，找不到 registry 数据时 `notFound()`。
5. 在 `lib/marketing/seo/sitemapEntries.ts` 添加 sitemap entry，并同步更新 `sitemapEntries.test.ts`。
6. 将公开素材放在 `public/marketing/seo/`，并在 `docs/seo/{slug}/ASSETS.md` 记录尺寸/用途；mockup phone 和 steps PNG 需要透明 alpha（现有测试用 `sharp().metadata().hasAlpha` 校验）。
7. 更新/新增 `lib/marketing/seo/industries.test.ts`：发布顺序、metadata、区块数量、related trades、FAQ 约束、素材路径和 alpha 约束。

### 约束与常见坑

- CTA 必须使用 `MarketingAppLink`，保持原生 `<a href="/app">`；Android Chrome 依赖该行为触发 WebAPK link capture（详见 [13-pwa-install-architecture.md](./13-pwa-install-architecture.md)）。
- 工种页属于营销站：不要注册 Serwist，不要引入 `/app` 的 `PwaProvider` / install gate。
- `hero.secondaryHref` 必须指向页面内存在的 anchor：默认 electrician 用 `#how-it-works`，mockup 工种用 `#deductions`。
- `IndustrySeoPageView` 的区块顺序是共享契约；改顺序会同时影响所有工种。
- `examples` 可为空；组合器会跳过 `ExpenseExamples`，适合 mockup 工种只展示 checklist / cards。
- 每个工种的 `relatedTrades.links` 应链接到其他已发布工种，避免自链。

推荐验证：

```bash
npm run test:unit -- lib/marketing/seo/industries.test.ts lib/marketing/seo/sitemapEntries.test.ts lib/marketing/seo/jsonLd.test.ts lib/marketing/metadata.test.ts
```

## 2.3 客户端状态

```
HomeScreen
├── receipts[]        ← IndexedDB + API sync
├── taxSaved          ← 派生或 API
├── ghostSession      ← Cookie snap1099_ghost（POST /api/ghost/register）
├── authUser          ← Google session（snap1099_session）
├── entitlements      ← 本季 Paddle 权益
├── softBannerDismissed
└── view: home | settings
```

## 2.4 离线策略

| 操作 | 离线 | 在线 |
|------|------|------|
| 打开主界面 | SW 缓存 `/app` | 正常 |
| 拍照 | getUserMedia → **压缩 1280×960/q75** → OPFS + IDB meta | + 上传 API |
| 列表展示 | IndexedDB 本地 | merge API |
| AI 分类 | 本地 OCR + 队列（离线可跑 Worker） | upload → Path A 文本分类 / Path B Vision |
| Google 登录 | 不可用 | OAuth |
| Paddle 支付 | 不可用 | Overlay |
| 导出 | 不可用 | API |

### Sync Worker（目标实现）

1. `online` 事件 → `syncPendingReceipts()`
2. 每条：若 `localOnly` → `POST /api/receipts` → 更新 `serverId`
3. 失败 → 指数退避，UI 仍显示 Processing

### 本地图片（OPFS）

- IDB **`snaptax_receipt_photos`** 仅存元数据；full/thumb 密文在 **OPFS**（见 [12-local-image-storage-design.md](./12-local-image-storage-design.md)）
- 拍照压缩：4032×3024 量级 → **1280×960 内、JPEG 75%、200～300KB**
- 已同步 **≥90 天**：idle 任务删 OPFS 原图，保留缩略图；详情无 full 时走 signed URL

## 2.5 PWA 要求

- `app/manifest.ts`：standalone, portrait, theme `#000000`, **`short_name`: SnapTax**, **`scope`/`start_url`: `/app`**
- SW（Serwist）：**仅 `/app` 产品路由** 经 `PwaProvider` 注册 `/serwist/sw.js`
- SW 预缓存：`/app` + static chunks（见 `app/serwist/[path]/route.ts`）
- **API 写操作：** `app/sw.ts` 在 `defaultCache` 前注册 `POST/PUT/PATCH/DELETE` → `/api/*` 的 `NetworkOnly`
- 安装 UI：见 [13-pwa-install-architecture.md](./13-pwa-install-architecture.md)（`InstallPrompt` · `AppBrowserEntryGate` · 营销 shell）

## 2.6 UI 约束（摘自 PRODUCT-SPEC）

- 配色 #000 / #fff / #EAB308
- 热区 ≥ 64px，快门 > 96px
- 核心拍照 **零 Modal**
- 登录/Paywall 用 **底部滑出面板**

## 2.7 本地 OCR 调试（桌面）

客户端 OCR 在 `lib/ocr/` + `lib/workers/ocrWorker.ts`；`HomeScreen` 启动时 `preloadOcrEngine()` 预热 Worker。

桌面开发可选 env（**须重启 dev**）：

```bash
NEXT_PUBLIC_SKIP_LOCAL_OCR=1    # 跳过 Worker OCR → 仅服务端 Vision
NEXT_PUBLIC_OCR_MAX_EDGE=960    # 或缩小 OCR 输入
```

详见 [11-ocr-pipeline-design.md §10.1](./11-ocr-pipeline-design.md#101-本地桌面调试推荐写入-envlocal)。

## 2.8 第三方 Client SDK

| SDK | 用途 |
|-----|------|
| Google Identity Services | `Continue with Google` 按钮 |
| `@paddle/paddle-js` | Overlay checkout |

## 2.9 目录结构（目标）

```
components/
├── home/          # 主界面
├── settings/      # 设置/导出
├── camera/        # 相机 overlay
├── auth/          # Google 面板、软引导横条
├── billing/       # Paddle paywall
└── pwa/
lib/
├── client/        # ghost, sync, auth context
├── prisma.ts      # PrismaClient 单例
├── server/        # 业务逻辑（通过 prisma 访问 DB）
└── storage/       # receiptDb (IndexedDB)
prisma/
├── schema.prisma
└── migrations/
```
