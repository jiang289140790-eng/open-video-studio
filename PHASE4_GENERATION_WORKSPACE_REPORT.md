# Phase 4 — Generation Tool Workspace Framework

## 任务范围

本阶段仅统一消费者前台生成工具页框架、上传体验、积分摘要、任务状态、历史与隐私设置。

未修改：

- ComfyUI / RunningHub / AutoDL 工作流
- 具体模型参数
- 生成服务端执行逻辑
- Supabase 数据库结构、RLS 或 Storage 策略
- 支付与真实积分扣减逻辑

## 一、现状审计与根因

### 页面现状

本阶段覆盖：

- 图片编辑器：`apps/web/image-editor.html`
- AI 换脸：`apps/web/face-swap.html`
- 性感礼服：`apps/web/outfit-studio.html`
- 性爱姿势：`apps/web/pose-generator.html`
- 图片转视频：`apps/web/image-to-video.html`
- 通用工具入口：`apps/web/tool.html`

### 原问题

1. 不同工具页各自维护上传框、参数、结果区域，结构和状态不一致。
2. 结果区主要是“暂无历史记录”空容器，无法表达排队、生成、成功、失败或取消。
3. 上传后缺少统一的文件名、格式、尺寸、大小、删除和替换反馈。
4. 页面长期展示硬编码或演示积分，无法区分未登录、价格未配置和积分不足。
5. 没有统一的任务恢复、轮询和重复提交保护。
6. 部分页面把“工作流已发布”等同于“可以生成”，但生产数据中的价格、输入输出契约尚未配置完整。

### 根因

- 工具页没有共享的 GenerationToolPage 状态机与组件契约。
- 上传、积分和任务状态由各页面临时处理，缺少统一的数据适配层。
- 页面没有以现有 `generation_jobs` 为任务真相来源。
- 空结果区和前端演示状态被当作完整生成体验。

## 二、生产数据审计

本阶段只读检查了当前 Supabase 项目，未执行迁移或写入。

### 复用的现有结构

- `generation_jobs`
- `media_assets`
- `user_creations`
- `credits`
- `credit_transactions`
- `tools`
- `workflows`

没有创建重复的任务、积分或作品表。

### 安全状态

本阶段涉及的核心表均已启用 RLS。任务查询、取消和作品保存仍通过当前登录用户及既有策略约束；前端没有加入 `service_role`、支付密钥或模型密钥。

### 当前可生成性结论

- 生产目录存在 `image-editor`、`face-swap`、`image-to-video` 三个工具记录。
- 当前工具价格为 `0`，工作流输入/输出 schema 为空。
- `outfit-studio`、`pose-generator` 尚无完整目录映射。
- 因此页面明确显示“价格配置中 / 工作流配置中”，不会把 `0` 当作免费，也不会误导为真实可提交。
- 只有同时满足以下条件才允许提交：
  - 已登录
  - 素材校验通过
  - 正积分价格已配置
  - 用户积分充足
  - 工作流状态为 `active`
  - 存在工作流 ID
  - 输入与输出 schema 均非空

## 三、实现内容

### 1. 统一 GenerationToolPage

新增：

- `apps/web/generation-workspace.js`

统一结构：

```text
GenerationToolPage
├── ToolHeader
├── InputPanel
│   ├── AssetUploader
│   ├── ParameterPanel
│   ├── CreditSummary
│   └── SubmitAction
└── ResultWorkspace
    └── RecentTasks
```

桌面端为左侧输入、右侧结果；移动端上下排列，并让提交操作保持可见。

### 2. AssetUploader

支持状态：

- `idle`
- `uploading`
- `uploaded`
- `validating`
- `invalid`
- `ready`
- `failed`

上传后显示：

- 缩略图
- 文件名
- 像素尺寸
- MIME 格式
- 文件大小
- 单项删除
- 全部删除
- 替换素材

当前校验：

- JPEG / PNG / WebP
- 单张最大 20 MB
- 最小边 256px
- 最大边 8192px
- 各工具最少/最多图片数量
- AI 换脸需要两张图片
- 支持浏览器 FaceDetector 时执行人脸检测；浏览器不支持时明确标记为等待服务端校验，不伪造检测结果

### 3. 积分摘要

显示：

- 当前操作消耗
- 当前积分余额
- 免费积分
- 积分不足购买入口
- 未登录时“登录后查看”

价格只有在数据库中存在大于零的明确配置时才展示。当前未完整配置的工具显示“价格配置中”。

### 4. ResultWorkspace 状态机

支持：

- `empty`
- `queued`
- `processing`
- `completed`
- `failed`
- `cancelled`

行为：

- 排队：显示任务编号、创建时间、积分与允许条件下的取消操作。
- 生成中：只展示服务端返回的真实进度；没有进度值时使用不确定状态，不自行递增百分比。
- 成功：支持预览、下载、保存、再次生成、复制参数、分享和图片转视频入口。
- 失败：展示用户可理解原因、真实退款记录、修改输入和重试。
- 取消：展示取消状态并提示核对退款记录。

### 5. 任务历史与刷新恢复

- 从 `generation_jobs` 查询当前用户最近任务。
- 关联 `credit_transactions` 判断真实退款。
- 未登录显示“登录后查看任务记录”。
- 无记录时提供下一步说明，不只显示空白容器。
- 使用本地任务引用恢复最近任务，并重新从数据库读取状态。
- 活跃任务按固定间隔轮询数据库。
- 页面离开时，如果仍在上传或任务活跃，提示用户确认。

### 6. 隐私与表单

- 默认私密。
- “公开”在公开作品能力未完成前禁用。
- 提交按钮根据缺失条件禁用并显示原因。
- 提交期间加锁，防止连续点击。
- 生成请求携带 idempotency key，并在当前会话保存。
- 前端不伪造进度、成功结果、退款或作品记录。

## 四、修改文件

| 文件 | 修改内容 |
|---|---|
| `apps/web/generation-workspace.js` | 新增统一工具页、上传、积分、任务状态、历史、恢复和本地验收状态 |
| `apps/web/tool.html` | 改为统一工具页容器 |
| `apps/web/image-editor.html` | 接入统一工作台 |
| `apps/web/face-swap.html` | 接入统一工作台 |
| `apps/web/outfit-studio.html` | 接入统一工作台 |
| `apps/web/pose-generator.html` | 接入统一工作台 |
| `apps/web/image-to-video.html` | 接入统一工作台 |
| `apps/web/styles.css` | 新增桌面/移动端工作台、上传器、状态、历史样式 |
| `scripts/copy-web-assets.mjs` | 构建时复制统一工作台脚本 |

## 五、验收结果

### 页面检查

| 页面 | 统一框架 | 默认私密 | 工作流保护 | 无横向滚动 |
|---|---:|---:|---:|---:|
| 图片编辑器 | 通过 | 通过 | 通过 | 通过 |
| AI 换脸 | 通过 | 通过 | 通过 | 通过 |
| 性感礼服 | 通过 | 通过 | 通过 | 通过 |
| 性爱姿势 | 通过 | 通过 | 通过 | 通过 |
| 图片转视频 | 通过 | 通过 | 通过 | 通过 |

### 状态模拟

验收状态仅在 `localhost` / `127.0.0.1` 且显式传入 QA 参数时生效，不会进入 GitHub Pages 生产体验，也不会写数据库。

| 场景 | 结果 |
|---|---|
| 未登录 | 显示“登录后查看”，提交禁用 |
| 已登录、100 积分、消耗 12 | 正确显示余额与消耗；素材未上传时仍禁用 |
| 已登录、3 积分、消耗 12 | 显示积分不足与购买入口 |
| 上传失败 | 上传器进入 `failed` 并给出重新选择说明 |
| 排队 | 显示 `queued`、任务编号和创建时间 |
| 生成中 | 显示 `processing` 与验收状态提供的进度 |
| 成功 | 显示 `completed`；无结果 URL 时明确提示核对作品 |
| 失败退款 | 显示失败原因与“已退回 12 积分” |
| 取消 | 显示 `cancelled` 与退款核对说明 |

### 响应式

- 1440×900：左右双栏，无横向滚动。
- 390×844：单栏，无横向滚动，提交区固定且保留安全区。
- 430×932：单栏，无横向滚动，侧边栏和全局操作仅各一套。

### 截图

- `docs/screenshots/phase4-generation-workspace/image-editor-1440.png`
- `docs/screenshots/phase4-generation-workspace/processing-1440.png`
- `docs/screenshots/phase4-generation-workspace/failed-refund-1440.png`
- `docs/screenshots/phase4-generation-workspace/image-to-video-390.png`

## 六、未完成项与依赖

1. **真实生成提交仍被安全禁用**
   - 原因：生产工作流不是 `active`，价格为 0，输入/输出 schema 为空。
   - 依赖：后续任务为每个工具完成真实工作流、正积分价格与 schema 配置。

2. **真实 Storage 上传**
   - 当前阶段在浏览器完成本地选择、预览与校验；真实上传由现有生成提交适配器在满足所有条件后执行。
   - 依赖：后续在不改变当前上传状态机的前提下对接生产 Storage / API。

3. **人脸检测兼容性**
   - 仅支持 FaceDetector 的浏览器可本地检测；其余浏览器需要服务端检测。

4. **公开作品**
   - 当前默认私密，公开选项禁用，避免误导。
   - 依赖：公开作品、审核和可见性策略真实上线。

5. **服务端幂等保证**
   - 前端已生成并传递 idempotency key。
   - 依赖：生成 API 必须按同一 key 拒绝重复创建，前端不能单独保证跨设备幂等。

6. **真实成功/失败全链路**
   - 当前没有 active workflow，因此未创建真实收费任务，也未伪造生产结果。
   - 后续必须在测试账户、明确价格和退款规则下验证服务端全链路。

## 七、下一任务依赖

建议下一阶段按工具逐个完成以下配置，不改动本阶段通用组件：

1. 确认真实 `tool_slug` 与 `workflow_id` 映射。
2. 配置正积分价格。
3. 配置输入、输出 schema。
4. 将工作流状态从测试状态切换为 `active` 前先完成手动成功运行。
5. 验证 Storage 上传、幂等创建、轮询、取消、成功作品保存和失败退款。
