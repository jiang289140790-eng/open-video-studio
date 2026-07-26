# A01 真实图片生成闭环验收报告

日期：2026-07-26
唯一源码目录：`C:\Users\admin\Documents\工作流模型\_repo`
唯一工作流：`A01-文生图-Qwen2512高清放大`
最终状态：`BLOCKED`

> 本报告只验收 A01。没有把未执行的任务、演示数据或浏览器本地结果写成真实成功。

## 1. 只读审计结果

### 前端生成请求

- 通用生成页源码：`apps/web/generate.html`
- 请求编排：`apps/web/app.js`
- 真实请求使用 Supabase `ai` Edge Function：
  1. `create-generation-job`
  2. `process-generation-job`
- 前端原先存在浏览器演示成功分支、Fake Worker 回退和两条静态“最近结果”。
- 生产首页当前仍没有 active 图片效果入口；A01 通用生成页的本地修改尚未推送到 GitHub Pages。

### Supabase Edge Function

- 项目：`wyvswkxogkmywduhrhkw`
- Function：`ai`
- 验证方式：JWT 必须有效
- 本次部署前：v39
- 本次部署后：v40，状态 `ACTIVE`
- Zealman Token、Supabase 服务端密钥只从 Edge Function 环境变量读取，未写入浏览器代码或报告。

### 数据库

复用现有表，没有新增或破坏性修改表结构：

- `generation_jobs`
- `media_assets`
- `tools`
- `workflows`
- `credits`
- `credit_transactions`

字段映射：

|要求字段|现有字段|
|-|-|
|user_id|`generation_jobs.user_id`|
|workflow_id|`generation_jobs.workflow_id`|
|task_id|`generation_jobs.id`|
|prompt_id|`generation_jobs.input_params.providerPromptId`|
|status|`generation_jobs.status`|
|input_parameters|`generation_jobs.input_params`|
|output_url|`generation_jobs.result_url`，保存 Storage key|
|runtime|`generation_jobs.latency`，毫秒|
|error_summary|`generation_jobs.error_message`|
|created_at|`generation_jobs.created_at`|
|completed_at|`generation_jobs.completed_at`|

### Storage

- Bucket：`open-video-studio-assets`
- 类型：私有 Bucket
- 生成结果由 Edge Function 下载后重新上传到该 Bucket。
- 页面通过现有签名 URL 逻辑读取，不直接公开写入权限。

### Zealman / ComfyUI

- Zealman 健康检查：通过
- 配置接口：`/api/workflow/config/{workflowName}`
- 提交接口：`/api/workflow/generate`
- 查询接口：`/api/workflow/result?prompt_id=...`
- A01 模板共 20 个节点。
- 本次确认节点：

|参数|节点|类型|
|-|-|-|
|正向 prompt|187|`CLIPTextEncode`|
|seed|3|`KSampler`|
|width|515|`INTConstant`|
|height|516|`INTConstant`|
|输出|499|`SaveImage`|

### 演示模式与假结果

- 已从通用生成按钮路径删除浏览器 `setTimeout` 成功结果和管理员 Fake Worker 回退。
- 已删除生成页两条静态“最近结果”。
- 项目其他旧页面仍有历史演示数据代码；本任务未修改其他工作流或页面。

## 2. 本次实现

### A01 服务端白名单

- 工作流 ID 固定为 `workflow-zealman-image-a01-v1`。
- 工作流名称固定为 `A01-文生图-Qwen2512高清放大`。
- provider 固定为 `zealman_workflow`。
- 只允许以下输入：
  - prompt：最多 2,000 字符
  - seed：`0` 到 `4294967295`，或 `random`
  - resolution：`512x512`、`1024x1024`、`1280x720`、`720x1280`
- A01 不读取前端 `workflowOverrides`，不能注入任意 ComfyUI 节点。
- 服务端只写入节点 `187`、`3`、`515`、`516`。

### 状态、超时、重试和退款

- A01 状态使用：`queued` → `running` → `succeeded` / `failed`。
- 超时：300 秒。
- 自动重试：最多 1 次。
- 使用原子领取方式防止同一 queued job 被重复执行。
- 失败时写入 `failed`、`error_message`、`completed_at`，并调用现有自动退款逻辑。
- 成功时写入 `providerPromptId`、retry 次数、Storage key、运行耗时和完成时间。

### A01 数据登记

- `tools.slug = generate`
- `tools.credits_cost = 8`
- `tools.cost_per_run = 8`
- `workflows.workflow_id = workflow-zealman-image-a01-v1`
- `workflows.provider = zealman_workflow`
- `workflows.status = published`
- 输入 schema 禁止额外参数。

### 前端

- 图片生成默认路由到 A01。
- 增加尺寸和 seed 输入。
- 前端不保存或传递 Zealman 密钥。
- 失败时显示真实错误和退款信息，不再切换假生成。
- 成功结果继续复用现有 `media_assets` 同步、签名 URL、页面预览和“我的作品”读取逻辑。

## 3. 三次端到端测试

生产浏览器当前显示“登录”，登录弹窗已打开。Supabase 匿名登录返回
`anonymous_provider_disabled`，因此不能用匿名用户绕过真实认证。为避免伪造
user_id、积分、数据库和 Storage 记录，以下三次测试均未提交。

|测试|参数|前端提交|task_id|prompt_id|最终状态|耗时|输出|数据库|Storage|页面回传|我的作品|积分|
|-|-|-|-|-|-|-|-|-|-|-|-|-|
|1|固定 seed，512×512|否：无真实登录会话|—|—|`BLOCKED`|—|—|未写入|未写入|未验证|未验证|无变化|
|2|随机 seed，1280×720|否：无真实登录会话|—|—|`BLOCKED`|—|—|未写入|未写入|未验证|未验证|无变化|
|3|不同提示词，1280×720|否：无真实登录会话|—|—|`BLOCKED`|—|—|未写入|未写入|未验证|未验证|无变化|

连续三次完整闭环没有完成，因此不得标记 `E2E_VERIFIED`。

## 4. 工程验证

|检查|结果|
|-|-|
|`npm run typecheck`|通过|
|`npm run lint`|`BLOCKED`：`package.json` 没有 lint 脚本|
|`npm run build`|通过；Vite 有既存脚本标签和静态资源解析警告|
|`npm test`|失败：75 项中 62 通过、13 失败；失败集中在既存前端、价格、SEO断言，其中“浏览器演示标记”断言与本任务禁止假结果直接冲突|
|`git diff --check`|通过|

## 5. 变更和部署状态

- 本地修改：
  - `apps/web/app.js`
  - `apps/web/generate.html`
  - `supabase/functions/ai/index.ts`
- 生产 Supabase：
  - A01 tool/workflow 配置已写入。
  - `ai` Edge Function v40 已部署并为 `ACTIVE`。
- GitHub Pages：
  - 本次前端修改尚未 commit/push。
  - 线上首页仍是部署基线版本，尚不能从首页选择 A01。
- 工作树中 `supabase/functions/ai/index.ts` 和
  `supabase/functions/billing/index.ts` 在本任务开始前已有未提交修改；
  本次没有覆盖或回退这些用户改动。

## 6. 当前真实阻塞

1. 生产浏览器没有已登录用户，且匿名登录被关闭。
2. 无法在不伪造身份或绕过认证的情况下创建三次真实用户任务。
3. 前端源码尚未安全提交和部署；工作树包含大量此前未提交内容，不能把它们一起推送。
4. 项目没有 `lint` 脚本。
5. 完整测试套件存在 13 个既存/规则冲突失败。

## 7. 下一步只允许修复的问题

1. 用户在已打开的生产登录弹窗完成 Google、X 或 Discord 登录。
2. 只提交并部署 A01 前端相关文件，避免带入其他未提交内容。
3. 按本报告三组参数执行三次真实生成，逐次核验任务、prompt、Storage、
   数据库、页面回传、“我的作品”和积分。
4. 连续三次全部成功后，将本报告状态改为 `E2E_VERIFIED`；否则继续保持
   `BLOCKED` 并记录真实失败证据。
