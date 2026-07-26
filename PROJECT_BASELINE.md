# Open Video Studio 项目基线

基线日期：2026-07-26

## 1. 唯一源码

| 项目 | 状态 | 基线 |
|---|---|---|
| 唯一源码目录 | `IMPLEMENTED_LOCAL` | `C:\Users\admin\Documents\工作流模型\_repo` |
| 当前目录 | `IMPLEMENTED_LOCAL` | `C:\Users\admin\Documents\工作流模型\_repo` |
| 当前分支 | `PUSHED` | `main` |
| 本地 commit | `PUSHED` | `b049c817c18c34b8f6856c6a7f6556ece4a2f7c1` |
| origin/main commit | `PUSHED` | `b049c817c18c34b8f6856c6a7f6556ece4a2f7c1` |
| origin | `PUSHED` | `https://github.com/jiang289140790-eng/open-video-studio.git` |

未修改以下位置：

- `remote-update`
- 其他 `open-video-studio` 副本
- `dist-web` 中的构建结果（验证命令会重新生成该忽略目录，但没有将其作为源码修改或提交）
- AutoDL 工作流
- Supabase 数据库结构

## 2. GitHub Pages 基线

| 项目 | 状态 | 基线 |
|---|---|---|
| Pages 构建类型 | `DEPLOYED` | GitHub Actions workflow |
| 触发分支 | `DEPLOYED` | `main`、`production-mvp`；当前线上部署来自 `main` |
| 当前部署 commit | `DEPLOYED` | `b049c817c18c34b8f6856c6a7f6556ece4a2f7c1` |
| 部署 Workflow | `DEPLOYED` | `.github/workflows/deploy-pages.yml` |
| 部署 Run | `DEPLOYED` | `30195176257` |
| 线上入口 | `ONLINE_VERIFIED` | `https://jiang289140790-eng.github.io/open-video-studio/app.html` |

GitHub Pages API 显示 `build_type=workflow`。虽然 Pages API 的兼容字段显示 `source.branch=main`、`source.path=/docs`，但当前实际部署不直接发布 `/docs`：

1. Actions 检出触发 commit。
2. 使用 Node 24。
3. 执行 `npm ci`。
4. 执行 `npm run build`。
5. `vite.config.ts` 从 `apps/web` 构建。
6. 输出到仓库根目录下的 `dist-web`。
7. `actions/upload-pages-artifact@v3` 上传 `dist-web`。
8. `actions/deploy-pages@v4` 发布该 artifact。

因此线上 `app.html` 的实际源码来源是：

`main@b049c817...` → `apps/web/app.html` 及其依赖 → `npm run build` → `dist-web/app.html` → Pages artifact。

线上浏览器只读核验结果：

- 标题：`AI 图片与视频生成 | Luravyn`
- 主标题：`上传一张图片，选择效果，开始创作`
- 检测到首页上传区域。
- 检测到热门效果区域。
- 检测到线上 `effect-catalog.js` 和 `effect-card-system.js`。

据此，当前线上入口状态为 `ONLINE_VERIFIED`。

## 3. 构建与发布命令

### 本地安装

```powershell
npm install
```

### 类型检查

```powershell
npm run typecheck
```

### 构建

```powershell
npm run build
```

实际内容：

```text
node scripts/repair-css-encoding.mjs
tsc -p tsconfig.json
vite build
node scripts/copy-web-assets.mjs
```

### 测试

```powershell
npm test
```

### 发布

当前没有单独的本地 Pages 发布脚本。标准发布方式是：

```powershell
git push origin main
```

推送后自动触发 `.github/workflows/deploy-pages.yml`。

可手动重新触发已存在的 workflow：

```powershell
gh workflow run deploy-pages.yml --ref main
```

## 4. 主要页面路由

### 消费者入口

| 页面 | 根页面 | 主要线上路由 |
|---|---|---|
| 首页/工具首页 | `app.html` | `/open-video-studio/app.html`、`/open-video-studio/zh/app/` |
| 首页门户 | `index.html` | `/open-video-studio/` |
| 辣味效果 | `spicy-effects.html` | `/open-video-studio/zh/app/spicy-effects/` |
| 图片工具 | `image-tools.html` | `/open-video-studio/zh/image-tools/` |
| 视频工具 | `video-tools.html` | `/open-video-studio/zh/video-tools/` |
| 图片编辑器 | `image-editor.html` | `/open-video-studio/zh/app/image-editor/` |
| AI 换脸 | `face-swap.html` | `/open-video-studio/zh/app/face-swap/` |
| 服装变换 | `outfit-studio.html` | `/open-video-studio/zh/app/outfit-studio/` |
| 姿势生成 | `pose-generator.html` | `/open-video-studio/zh/app/pose-generator/` |
| 图片转视频 | `image-to-video.html` | `/open-video-studio/zh/app/image-to-video/` |
| 脱衣视频入口 | `undress-video.html` | `/open-video-studio/zh/app/undress-video/` |
| 图片组合 | `image-combiner.html` | `/open-video-studio/zh/app/image-combiner/` |
| Nano Banana | `nano-banana.html` | `/open-video-studio/zh/app/nano-banana/` |
| AI 效果 | `ai-effects.html` | `/open-video-studio/zh/ai-effects/` |
| 通用生成 | `generate.html` | `/open-video-studio/zh/app/generate/` |
| 我的作品 | `my-creations.html` | `/open-video-studio/zh/my-creations/` |
| 历史记录 | `history.html` | `/open-video-studio/zh/history/` |
| 素材 | `assets.html` | `/open-video-studio/zh/assets/` |
| 角色 | `characters.html` | `/open-video-studio/zh/characters/` |
| 作品探索 | `gallery.html` | `/open-video-studio/zh/gallery/` |
| 价格 | `pricing.html` | `/open-video-studio/zh/pricing/` |
| 免费积分 | `free-coins.html` | `/open-video-studio/zh/free-coins/` |
| 推荐好友 | `referral.html` | `/open-video-studio/zh/referral/` |
| 登录 | `signin.html` | `/open-video-studio/zh/login/` |
| 重置密码 | `reset-password.html` | `/open-video-studio/zh/reset-password/` |
| 分享 | `share.html` | `/open-video-studio/share.html` |

### 内容与法律页面

- `blog.html`
- `terms.html`
- `privacy.html`
- `cookie.html`

### 运营与管理页面

以下页面仍在同一仓库，但不属于消费者首屏导航：

- `admin.html`
- `dashboard.html`
- `growth-dashboard.html`
- `accounts.html`
- `campaigns.html`
- `ai-studio.html`
- `pipeline.html`
- `queue.html`
- `calendar.html`
- `analytics.html`
- `publishing.html`
- `automation.html`
- `settings.html`

## 5. 环境变量名称

仅记录名称，不记录值。

### 浏览器公开配置

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_STORAGE_BUCKET`
- `VITE_GOOGLE_OAUTH_READY`
- `VITE_DISCORD_OAUTH_READY`
- `VITE_X_OAUTH_READY`
- `VITE_TELEGRAM_OAUTH_READY`
- `VITE_TELEGRAM_BOT_USERNAME`
- `VITE_TELEGRAM_AUTH_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_BILLING_ENABLED`
- `VITE_PAYPAL_CLIENT_ID`

### Supabase与应用服务端

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `APP_URL`
- `AUTH_ALLOWED_REDIRECT_ORIGINS`
- `NODE_ENV`

### 支付

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BILLING_ENABLED`
- `STRIPE_MODE`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`
- `PAYPAL_ENVIRONMENT`

### 登录

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_AUTH_MAX_AGE_SECONDS`

### Zealman / ComfyUI

- `ZEALMAN_API_TOKEN`
- `ZEALMAN_PANEL_BASE_URL`
- `ZEALMAN_COMFY_BASE_URL`
- `ZEALMAN_IMAGE_WORKFLOW`
- `ZEALMAN_VIDEO_WORKFLOW`
- `ZEALMAN_DIGITAL_HUMAN_WORKFLOW`
- `ZEALMAN_SMOOTH_VIDEO_WORKFLOW`
- `ZEALMAN_PROMPT_NODE_ID`
- `ZEALMAN_MAX_POLLS`
- `ZEALMAN_POLL_INTERVAL_MS`
- `ZEALMAN_WORKFLOW_MAP_JSON`
- `COMFYUI_BASE_URL`
- `COMFYUI_ROOT`

### 其他 AI 服务

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`
- `QWEN_VISION_SITE_API_KEY`
- `QWEN_VISION_ENDPOINT`
- `QWEN_VISION_MODEL`
- `QIANWEN_API_KEY`
- `QIANWEN_BASE_URL`
- `QIANWEN_IMAGE_ENDPOINT`
- `QIANWEN_IMAGE_MODEL`
- `QIANWEN_VIDEO_ENDPOINT`
- `QIANWEN_VIDEO_MODEL`
- `QIANWEN_MAX_POLLS`
- `QIANWEN_POLL_INTERVAL_MS`
- `LIBLIB_ACCESS_KEY`
- `LIBLIB_SECRET_KEY`
- `LIBLIB_BASE_URL`
- `LIBLIB_IMAGE_MODEL`
- `LIBLIB_TEXT2IMG_TEMPLATE_UUID`
- `LIBLIB_MAX_POLLS`
- `LIBLIB_POLL_INTERVAL_MS`
- `FAL_API_KEY`
- `RUNPOD_API_KEY`
- `CIVITAI_API_TOKEN`
- `HF_TOKEN`

### 本地资产服务

- `AI_ASSET_DB_PATH`
- `ASSET_STORAGE_DIR`
- `AI_PROVIDER_DEFAULT`
- `AI_PROVIDER_ROLLOUT_MODE`
- `AI_PROVIDER_TIMEOUT_MS`

## 6. 当前验证结果

| 验证 | 状态 | 结果 |
|---|---|---|
| `npm install` | `IMPLEMENTED_LOCAL` | 成功，依赖已是最新 |
| `npm run typecheck` | `BUILD_PASSED` | 成功 |
| `npm run lint` | `BLOCKED` | `package.json` 没有 `lint` script |
| `npm run build` | `BUILD_PASSED` | 成功 |
| `npm test` | `BLOCKED` | 75 项中 63 项通过、12 项失败 |
| `git diff --check` | `BUILD_PASSED` | 成功 |
| GitHub Pages Actions | `DEPLOYED` | Run `30195176257` 成功 |
| 线上页面 | `ONLINE_VERIFIED` | 已真实读取页面标题、主标题和首页组件 |

## 7. 当前已知阻塞问题

1. `BLOCKED`：没有 `npm run lint` 对应脚本。
2. `BLOCKED`：完整测试 12 项失败，主要集中在旧静态前端契约、支付配置和 SEO 元数据。
3. `BLOCKED`：Vite 构建警告显示多个普通 `<script>` 无法参与模块打包。
4. `BLOCKED`：12 个 `home-assets` 路径在构建期无法解析，只能留到运行时。
5. `BLOCKED`：系统盘 C: 当前可用空间约 8.48 GB，继续产生缓存和媒体文件存在风险。
6. `BLOCKED`：Supabase `ai` 与 `billing` Edge Function 源码有未提交修改，尚未进入当前线上 Pages commit。
7. `BLOCKED`：本地存在未提交数据库迁移；本任务禁止修改或应用数据库结构。
8. `BLOCKED`：当前工作区包含大量报告、截图和测试文件，尚未确认哪些需要进入版本库。

## 8. 当前未提交修改

### 已修改但未提交

- `supabase/functions/ai/index.ts`
- `supabase/functions/billing/index.ts`

### 未跟踪文件/目录

- Phase 1—12 与生产核验报告
- `SYSTEM_BASELINE_2026-07-26.md`
- `CORE_GENERATION_E2E_ACCEPTANCE.md`
- `EFFECT_MEDIA_AUDIT.json`
- `PERFORMANCE_REAL_DATA_REPORT.md`
- `PRODUCTION_*_REPORT.md`
- `artifacts/`
- `docs/screenshots/`
- `reports/`
- `scripts/generate-effect-media-audit.mjs`
- 两项 performance migrations
- 三项 2026-07-26 消费者 migrations
- `tests/pricing-config.test.js`
- `tests/reward-program.test.js`
- `tests/visual-design-system.test.js`
- 本文件和 `PROJECT_BASELINE_REPORT.md`

这些既有修改在本任务中没有被清理、提交、推送或覆盖。
