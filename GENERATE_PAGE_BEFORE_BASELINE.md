# AI 图片生成页修改前基线

记录时间：2026-07-27（Asia/Shanghai）

状态：`IMPLEMENTED_LOCAL`

## 1. 仓库基线

- 唯一源码目录：`C:\Users\admin\Documents\工作流模型\_repo`
- 当前分支：`main`
- 当前 HEAD：`0c5c7b24207c82f8e8ecc319882775e090bb55a5`
- 远端：`origin https://github.com/jiang289140790-eng/open-video-studio.git`
- 修改前工作区：干净
- 线上入口：`https://jiang289140790-eng.github.io/open-video-studio/generate.html`

## 2. 当前页面源码与直接依赖

| 文件 | 作用 | 修改保护点 |
|---|---|---|
| `apps/web/generate.html` | 图片生成页静态入口、页面挂载点、脚本和简化页脚 | 不改变脚本加载顺序和真实服务入口 |
| `apps/web/generation-workspace.js` | 工具页状态、A01 表单、提交、轮询、结果和最近任务渲染 | 不改变 A01 服务端接口与工作流映射 |
| `apps/web/styles.css` | 页面、消费者 AppShell、生成工作区和响应式样式 | 只增加或调整图片生成页作用域样式 |
| `apps/web/api-service.js` | 根据 `workflow-map.json` 找到工作流，并优先调用 `window.__OVS_WORKFLOW_API__.generate` | 不修改 |
| `apps/web/app.js` | Supabase 会话、消费者 Header/Sidebar、全局操作和工作流桥接 | 不修改 |
| `apps/web/workflow-map.json` | 前端允许使用的工作流映射 | 不修改 |

## 3. 现有真实生成提交

- 页面提交函数：`submitGeneration()`，位于 `apps/web/generation-workspace.js`。
- 提交前调用 `getSubmitBlocker()`，校验：
  - 已登记且 active/published 的工作流；
  - 提示词至少 3 个字符；
  - 分辨率白名单；
  - Seed 为 `random` 或 `0—4294967295`；
  - 会话状态；
  - 登录用户积分余额；
  - 重复提交锁。
- 请求通过 `window.__OVS_API_SERVICE__.generate(toolId, params)` 发出。
- `api-service.js` 先加载 `workflow-map.json`，再调用 `window.__OVS_WORKFLOW_API__.generate`。
- 静态站没有可用服务端桥接时会真实报错，不伪造成功。
- 使用 idempotency key 防止重复创建，并保存在 sessionStorage。

## 4. 参数白名单基线

A01 当前前端仅允许：

- `prompt`
- `resolution`：`1024x1024`、`1280x720`、`720x1280`
- `aspectRatio`：由上述尺寸选项映射
- `outputCount`：固定 `1`
- `seed`：`random` 或无符号整数
- `privacy`：默认 `private`
- `idempotencyKey`

当前工作流不接受参考图片。前端不会给 A01 传任意 ComfyUI 节点、模型路径或底层字段。

## 5. 任务状态与轮询

- 活跃状态集合：
  - `uploading`
  - `queued`
  - `pending`
  - `processing`
  - `running`
  - `model_preparing`
  - `generating`
  - `post_processing`
  - `uploading_result`
  - `cancelling`
- `updatePolling()` 每 5 秒调用一次现有工作流状态接口，并重新读取数据库任务。
- 页面刷新通过 `sessionStorage` 中的最近任务 ID 与 `generation_jobs` 恢复当前任务。
- 数据库任务记录是页面状态的主要事实来源。

## 6. 当前结果渲染

- 结果入口：`renderResult()`。
- 统一映射为：
  - empty
  - queued
  - processing
  - completed
  - failed/restricted
  - cancelled
- 输出 URL 来自 `generation_jobs.result_url` 或 `output_assets` 的首个 URL。
- 已有图片 `error` 回退，会把破图替换为“预览暂不可用”占位。
- 当前不足：
  - `completed` 主要依据任务状态；
  - 有 URL 时尚未在渲染前执行资源可读性检查；
  - 无 URL 时仍进入 completed 分支并显示“任务已完成”说明；
  - 成功图片加载失败后只替换占位，任务视觉状态仍可能保持 completed。

## 7. 积分显示

- `renderAccountSummary()` 读取现有工具/工作流价格与用户积分余额。
- 登录用户显示预计积分和当前余额。
- 匿名访客显示本次免费体验。
- 余额不足时显示购买入口。
- 最终扣费、冻结和退款不由本页决定，本页仅展示现有服务端规则与记录。

## 8. 最近任务数据来源

- 登录用户数据来自 Supabase `generation_jobs`。
- 查询字段包含任务状态、结果 URL、输出资产、积分、错误、输入参数和时间。
- 当前生成页只显示最近 3 项。
- 完整历史进入“我的创作”。
- 退款状态通过 `credit_transactions` 核对。

## 9. 修改前页面状态

已经存在：

- AI 图片生成标题与轻量标签。
- 单一参数面板。
- 提示词输入和字数统计。
- 灵感示例弹窗。
- 三个真实比例选项。
- 生成数量固定 1 张。
- Seed 与隐私高级设置。
- 紧凑积分摘要。
- empty / queued / processing / completed / failed 状态。
- 最近 3 项任务。
- 简化工具页页脚。
- 390px 单列布局和无横向溢出。

本轮仍需完善：

- 左侧增加“创建图片”层级标题。
- 副标题改为指定文案。
- 增加“不支持参考图”的轻量提示。
- 比例选项由下拉框改成可视化比例按钮，同时保持原白名单尺寸。
- 灵感模板增加“风景与建筑”，每类提供 2 条中性模板。
- Seed 明确拆分“随机 / 自定义整数”交互。
- 积分不足文案显示缺口。
- 结果 URL 与图片加载状态影响最终成功视觉状态。
- 成功图片支持点击查看大图。
- 失败状态增加帮助入口。
- 最近任务进一步收敛为缩略图、状态和时间。
- 页脚补充消费者工具入口与联系方式，同时保持紧凑。

## 10. 重构禁止项

- 不修改 A01、Zealman、ComfyUI、Supabase 表结构、Edge Function 接口和扣费逻辑。
- 不新增工作流、演示结果、假进度或未支持参数。
- 不修改其他工具页面。

