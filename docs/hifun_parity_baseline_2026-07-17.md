# Hifun 对标基线清单（2026-07-17）

本文件是改造前的只读盘点。此阶段不删除页面、不改变功能，只记录目标站与现有站的路由、内容和能力差异。

## 1. 目标站公开信息架构

来源：

- https://hifun.ai/zh/
- https://hifun.ai/zh/app/spicy-effects/
- https://hifun.ai/zh/app/img-editor/
- https://hifun.ai/zh/app/faceswap/
- https://hifun.ai/zh/app/sex-dress-up/
- https://hifun.ai/zh/app/sex-pose/
- https://hifun.ai/zh/app/img-to-video/
- https://hifun.ai/zh/my-creations/
- https://hifun.ai/zh/referral/
- https://hifun.ai/zh/pricing/
- https://hifun.ai/zh/blog/
- https://hifun.ai/zh/terms/
- https://hifun.ai/zh/privacy/
- https://hifun.ai/zh/cookie/

### 一级导航

- 图像工具
- 视频工具
- 购买积分
- 免费硬币
- 我的创作
- 登录

### 图像工具功能

- 图片编辑器：`/zh/app/img-editor/`
- AI 换脸：`/zh/app/faceswap/`
- 性感礼服：`/zh/app/sex-dress-up/`
- 性爱姿势：`/zh/app/sex-pose/`
- Nano Banana：`/zh/nano-banana/`
- 图像组合器：`/zh/image/image-combiner/`

### 视频工具功能

- 图片转视频：`/zh/app/img-to-video/`

### 特效入口

- 辣味特效目录：`/zh/app/spicy-effects/`
- 目录包含分类筛选、特效卡片、锁定/解锁状态，并进入对应生成页。

### 账户与商业页面

- 我的创作：`/zh/my-creations/`
- 推荐计划：`/zh/referral/`
- 购买积分：`/zh/pricing/`
- 博客：`/zh/blog/`
- Terms / Privacy / Cookie

## 2. 目标站生成页共同布局

目标站的工具页都采用同一结构：

1. 顶部固定导航。
2. 左侧窄面板：返回按钮、工具标题、上传区域、工具专属选项、提示词、积分/创建按钮。
3. 右侧大面板：生成结果；无结果时显示“暂无历史记录”。
4. 生成完成后在右侧回显图片或视频，并提供历史/下载等后续操作。
5. 入口通过路径追加实现：例如 `/zh/app/img-editor/`、`/zh/app/img-to-video/`，而不是把所有工具塞在同一个页面。

## 3. 目标站各功能字段清单

| 功能 | 必填/核心输入 | 专属控件 | 输出 | 目标站状态 |
|---|---|---|---|---|
| 图片编辑器 | 单张/多张图片、AI 提示 | 自动屏蔽、提示增强（产品说明） | 图片 | 10 积分 |
| AI 换脸 | 源面部、目标身体 | Face Swap / Head Swap | 图片 | 2 积分 |
| 性感礼服 | 参考图片 | 服饰类型卡片 | 图片 | 10 积分 |
| 性爱姿势 | 参考图片 | 姿势卡片、Custom Prompt | 图片 | 10 积分 |
| 图片转视频 | 参考图片 | 辣味效果选择、AI 提示 | 视频 | 40 积分 |
| 辣味特效 | 目录筛选 | 全部/最新/热门及内容分类、效果卡片 | 跳转到生成页 | 目录 |
| Nano Banana | 模型说明/入口 | 进入生成器 | 图片 | 产品介绍页 |
| 图像组合器 | 1~2 张参考图、提示 | 合并强度说明 | 图片 | 10 积分 |

## 4. 现有站公开入口盘点

现有仓库：`_repo/apps/web/`；GitHub Pages 入口：`https://jiang289140790-eng.github.io/open-video-studio/app.html`

### 现有主入口与工具

- `/app.html`：工具中心首页
- `/zh/image-tools/`：图像工具目录
- `/zh/video-tools/`：视频工具目录
- `/zh/app/image-editor/`
- `/zh/app/face-swap/`
- `/zh/app/outfit-studio/`
- `/zh/app/pose-generator/`
- `/zh/app/nano-banana/`
- `/zh/app/image-combiner/`
- `/zh/app/image-to-video/`
- `/zh/app/generate/`
- `/zh/app/characters/`
- `/zh/gallery/`
- `/zh/history/`
- `/zh/my-creations/`
- `/zh/pricing/`
- `/zh/free-coins/`
- `/zh/login/`

### 现有额外页面（暂不删除，后续只评估是否从公开导航移除）

`account、accounts、admin、analytics、assets、automation、calendar、campaigns、dashboard、pipeline、publishing、queue、settings、share、reset-password` 等管理/后台页面。

## 5. 初步差异结论

### 已有且可复用

- 图片编辑、换脸、服装/造型、姿势、Nano Banana、图像组合、图片转视频的独立页面文件。
- 图片转视频已有“选择视频特效”入口，实际连接的是 AutoDL/Zealman 实例上的 ComfyUI 网关。
- 首页、图像工具目录、视频工具目录、积分、免费积分、我的创作等基础页面。
- GitHub Pages 所需的多语言路径壳页面。

### 目标站有、现有站缺少或命名不一致

- `/zh/app/spicy-effects/` 辣味特效目录页。
- 目标站标准路径 `/zh/app/img-editor/`、`/zh/app/faceswap/`、`/zh/app/sex-dress-up/`、`/zh/app/sex-pose/`、`/zh/app/img-to-video/`；现有站使用 `image-editor`、`face-swap`、`outfit-studio`、`pose-generator` 等不同路径。
- 目标站统一的“左输入/右结果”简洁布局；现有页面普遍包含更多模型、参数、预检、队列和内部管理信息。
- 目标站的特效目录分类、卡片锁定状态与卡片到生成页的路径跳转。
- 目标站的工具页专属字段仍需逐页对齐（尤其上传数量、选项卡、提示词、积分、创建按钮和结果状态）。

### 现有站多出的公开能力

- 角色、历史、画廊、后台管理、队列、分析、资产、工作流等页面比目标站公开导航多。
- 这些页面不会在基线阶段直接删除；后续按“是否出现在目标站导航/是否被目标站页面跳转使用”决定隐藏、改为内部入口或保留。

## 6. 后续实施顺序（需用户确认后执行）

1. 先完成路由映射：目标路径优先，旧路径保留兼容跳转。
2. 对齐首页导航与两大目录页，只保留目标站公开入口。
3. 将每个生成页统一为目标站左输入/右结果布局。
4. 逐页绑定已登记的 AutoDL/Zealman 工作流 API；无法支持的字段在页面标记“当前 API 不支持”，不伪造成功。

当前已建立的核心绑定（页面内部 workflowId → 实例工作流名称）：

- `workflow-zealman-image-a01-v1` → `A01-文生图-Qwen2512高清放大`
- `workflow-zealman-video-g01-v1` / `workflow-hifun-image-to-video-v1` → `测试01-Wan2.2Remix-图生视频`
- `workflow-zealman-video-g03-v1` → `G03-图生视频-Wan2.2SmoothMix`
- `workflow-hifun-image-editor-v1` → `功能03-自然语言图片编辑（本地）`
- `workflow-hifun-face-swap-v1` → `功能01-授权虚构角色换脸（本地）`
- `workflow-hifun-outfit-v1` → `功能04-成年虚构角色换装（本地）`
- `workflow-hifun-pose-v1` → `功能05-人物姿势重构（本地）`
- `workflow-hifun-combiner-v1` → `功能02-多图智能合成（本地）`
- `workflow-hifun-upscale-v1` → `功能07-图片高清修复（本地）`
- `workflow-hifun-movie-closeup-v1` → `功能09-Wan2.2-电影近景特效（本地）`
- `workflow-hifun-adult-effects-v1` → `功能08-Wan2.2-4in1成人特效（本地）`

这些绑定只保存公开的工作流名称，不包含 API Token、SSH 密码或其他密钥。
5. 增加辣味特效目录及卡片跳转；成人内容只允许成年、虚构或明确授权素材，并保留平台审核规则。
6. 使用浏览器逐条验证首页→目录→生成页→结果回显→我的创作的跳转链路。
7. 最终复审：逐项对照本文件，输出已完成、欠缺、风险和未改动项。
