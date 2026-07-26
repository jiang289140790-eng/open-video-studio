# Phase 2 — Effect Media and Card System 报告

日期：2026-07-26
项目：Luravyn / open-video-studio 消费者前台
范围：效果卡片、封面媒体、加载状态、错误回退、媒体路径、悬停视频、可用状态

## 1. 修改文件

### 新增

- `apps/web/effect-catalog.js`
  - 建立 25 条效果与工具的统一数据目录。
  - 统一字段：`id`、`slug`、`name`、`category`、`media_type`、`thumbnail_url`、`poster_url`、`preview_video_url`、`workflow_id`、`workflow_status`、`status`、`visual_style`、积分、标签、路由和说明。
- `apps/web/effect-card-system.js`
  - 新增 `EffectMedia`、`EffectCard`、`MediaSkeleton`、`MediaErrorFallback`、`VideoHoverPreview`。
  - 新增 GitHub Pages/Supabase/外部媒体 URL 解析与安全回退。
- `scripts/generate-effect-media-audit.mjs`
  - 可重复生成效果资源审计结果。
- `EFFECT_MEDIA_AUDIT.json`
  - 包含完整效果清单、资源来源、重复封面、外部 URL、本地媒体哈希、Storage 状态和限制。

### 修改

- `apps/web/tools-data.js`
  - 首页工具与分类改为从统一目录派生。
  - 移除将动漫封面重复用于写实效果的映射。
- `apps/web/spicy-effects-data.js`
  - 辣味效果改为从统一目录派生，并保留中文筛选标签。
- `apps/web/app.html`
  - 首页 Hero、快捷工具和分类卡统一使用新媒体与卡片组件。
- `apps/web/spicy-effects.html`
  - 辣味效果列表统一使用 `EffectCard`。
- `apps/web/pose-generator.html`
  - 姿势选择项接入统一效果数据和媒体错误回退。
- `apps/web/outfit-studio.html`
  - 服装选择项接入统一效果数据和媒体错误回退。
- `apps/web/video-tools.html`
  - 旧视频卡在运行时升级为统一效果卡片。
- `apps/web/ai-effects.html`
  - 旧效果卡在运行时升级为统一效果卡片。
- `apps/web/styles.css`
  - 新增稳定宽高比、Skeleton、错误占位、标签、状态、卡片正文、选择项和移动端样式。
- `scripts/copy-web-assets.mjs`
  - 构建时复制统一效果目录和卡片系统。

## 2. 原问题与根因

### 黑色空卡和破图

- 多个页面依赖空 URL、无效媒体或外部热链，失败后没有统一错误状态。
- 视频卡未区分 poster 和视频播放状态。
- 页面各自实现卡片，加载与错误处理不一致。

### 路径问题

- 历史代码把 GitHub Pages 子路径当成站点根路径处理。
- 旧页面存在 38 个 `img.hifun.ai` 媒体热链，无法保证 CORS、生命周期和授权稳定性。
- 生产媒体没有统一阻止 Windows 本地路径、`file:///` 和 localhost。

### 重复和误导封面

- 12 张 `ovs-home-*.png` 插画曾被重复引用 3—5 次。
- 这些素材为动漫风格，却被分配给写实成人、动作和视频效果，视觉语义不匹配。
- 同一素材跨多个效果复用，不能证明实际输出。

### 可用状态错误

- `workflow_id` 存在不等于工作流已可运行。
- 当前静态工作流登记均为 `requires_server_config`/`unconfigured`，但旧卡片仍可能呈现可生成意图。
- Supabase 中只有 3 条 tools、3 条 workflows；工作流 schema 为空，不能确认真实 active。

## 3. 资源审计结果

- 统一目录：25 条。
- 已确认 active workflow：0 条。
- `preview_only`：25 条。
- 独立预览媒体：0 条。
- 本地静态媒体：12 个 PNG，均记录 SHA256 和尺寸。
- 旧重复封面：每张被引用 3—5 次。
- 外部媒体引用：66 个。
  - `img.hifun.ai`：38 个。
  - `luravyn.com`：28 个品牌/页面资源引用。
- 生产源码中的 Windows 本地路径、`file:///`、localhost 媒体路径：0。
- Supabase Storage：
  - `open-video-studio-assets`：私有，0 对象。
  - `source-assets`：私有，0 对象。

完整逐条结果见 `EFFECT_MEDIA_AUDIT.json`。

## 4. 实现内容

### 统一媒体组件

- 图片加载期间显示有动画的骨架，不显示纯黑区域。
- 加载失败或 URL 缺失时显示统一图标和“预览准备中”。
- 图片使用 `loading="lazy"`、`decoding="async"` 和真实 `alt`。
- 视频组件使用 `muted`、`playsInline`、`loop`、`preload="metadata"`。
- 桌面端悬停开始播放，并在 4 秒后停止；移出恢复 poster。
- 移动端不绑定批量悬停播放。
- 卡片媒体区使用固定宽高比，避免加载抖动。

### 路径与安全

- 相对资源根据 GitHub Pages 仓库 base path 解析。
- 生产环境拒绝 Windows 绝对路径、`file:` 和 localhost。
- 同源、`blob:`、`data:image`、`data:video` 可按规则使用。
- Supabase 只消费已存在的公开 URL 或签名 URL，不开放写入口。
- 其他外部域名默认不进入效果卡，失败时显示非误导占位。

### 状态规则

- 只有同时满足以下条件才视为 active：
  - `status === "active"`
  - 有 `workflow_id`
  - `workflow_status === "active"`
- `preview_only` 可查看详情，但状态为“即将上线”。
- `disabled` 默认不渲染。
- 没有确认 active workflow 的卡片绝不显示“立即生成”。
- 当前 25 条记录全部按真实状态展示为“即将上线”。

### 数据清理

- 不再随机用动漫图代表真人写实效果。
- 25 条记录均增加 `visual_style`，当前登记为 `realistic`。
- 缺少独立封面的条目统一标记 `missing_independent_preview`。
- 旧封面重复次数保留在审计 JSON，方便后续补资源时逐项处理。

## 5. 浏览器验证结果

逐页检查：

| 页面 | 卡片/选项 | 错误占位 | 破图 | 黑色空媒体 | 无工作流却显示生成 |
|---|---:|---:|---:|---:|---:|
| 首页 | 25 | 26（含 Hero） | 0 | 0 | 0 |
| 辣味效果 | 10 | 10 | 0 | 0 | 0 |
| 姿势生成器 | 4 | 4 | 0 | 0 | 0 |
| 性感装扮 | 6 | 6 | 0 | 0 | 0 |
| 视频工具 | 38 | 38 | 0 | 0 | 0 |
| AI 特效/效果弹层 | 10 | 10 | 0 | 0 | 0 |

响应式检查：

| 尺寸 | 横向页面滚动 | 卡片高度一致 | 移动端自动播放 |
|---|---:|---:|---:|
| 1920×1080 | 否 | 是 | 不适用 |
| 1440×900 | 否 | 是 | 不适用 |
| 390×844 | 否 | 是 | 0 |
| 430×932 | 否 | 是 | 0 |

截图：

- `docs/screenshots/phase2-effect-media/homepage-1440.png`
- `docs/screenshots/phase2-effect-media/spicy-effects-1440.png`
- `docs/screenshots/phase2-effect-media/spicy-effects-390.png`
- `docs/screenshots/phase2-effect-media/pose-generator-390.png`

## 6. 工程验证

- `npm run typecheck`：通过。
- `npm run build`：通过。
- `git diff --check`：通过。
- 构建产物已包含 `effect-catalog.js` 和 `effect-card-system.js`。
- Vite 对传统非 module 脚本给出提示，但构建成功，复制脚本已负责发布这些文件。
- 旧 CSS 中仍保留 `home-assets` 引用，因此 Vite 继续输出运行时解析提示；本阶段涉及的统一效果卡不再使用这些引用。

## 7. 未完成项

### 真实封面资源

当前 Supabase Storage 无对象，统一目录也没有独立预览 URL。为避免伪造效果，全部使用“预览准备中”。

依赖：

- 经授权的真实效果 poster/thumbnail。
- 对应效果的视觉风格确认。
- Storage 中可读取的 public 或 signed URL。

### Hover 视频端到端播放

播放器行为已经完成，移动端不自动播放已验证；但目前 `preview_video_url` 数量为 0，无法用真实资源验证桌面端 3—5 秒悬停播放。

依赖：

- 经授权、可跨域读取的 MP4/WebM 预览。
- 对应 poster。

### Active workflow

当前没有工作流满足 active 判定，因此没有卡片显示“立即生成”。这符合“不把没有真实 active workflow 的效果显示为可生成”的项目规则。

依赖：

- 后端确认工作流处于 active。
- 完整输入/输出 schema。
- 生产环境成功测试记录。

## 8. 风险与下一任务依赖

- 外部热链可能失效或存在授权风险；后续应迁移到自有受控 Storage。
- 私有 Storage 需要后端或 Edge Function 生成短时 signed URL，不应在前端暴露可写权限。
- Supabase 审计发现若干与本阶段无关的业务表存在 RLS 安全建议；本任务未修改数据库，应在独立安全任务中处理。
- 新媒体上架前应补齐来源、授权、内容分级、风格和 workflow active 证明。
