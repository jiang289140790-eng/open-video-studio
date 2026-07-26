# VIDEO_GENERATION_E2E_REPORT

日期：2026-07-26
最终状态：**BLOCKED**

> 只有连续 3 次“前端上传 → Supabase → Edge Function → Zealman / ComfyUI → MP4 → Storage → 数据库 → 页面播放 → 我的创作”全部成功，才允许标记 `E2E_VERIFIED`。本次生产页面没有已登录用户会话，因此没有绕过认证创建任务，也没有伪造测试结果。

## 1. 唯一工作流范围

- Zealman 原工作流：`测试01-Wan2.2Remix-图生视频`
- 正式产品映射：`G20-图生视频-Wan2.2Remix-v1`
- workflow_id：`workflow-zealman-video-g20-v1`
- Provider：`zealman_workflow`
- 原 Zealman / ComfyUI 工作流：**未修改**
- 未接入：LTX、WanAnimate、首尾帧、成人工作流、数字人、音频驱动

## 2. 已核验的真实节点映射

|参数|节点|规则|
|-|-|-|
|提示词|`119:text`|3–1000 字符|
|随机种子|`142:seed`|0–4294967295，或服务端随机|
|长边分辨率|`144:value`|512 / 768 / 1024|
|输入图片|`145:image`|服务端上传到 ComfyUI|
|视频时长|`153:Number`|2 / 3 / 4 / 5 / 6 / 8 / 10 秒|
|输出|`150`|固定 24fps、H.264 MP4、yuv420p|

除以上白名单外，G20 不接受客户端节点覆盖；底层模型、LoRA、采样器和其他节点不能由浏览器修改。

## 3. 实现状态

### 前端（IMPLEMENTED_LOCAL / BUILD_PASSED）

- 单图输入。
- MIME 白名单：JPEG、PNG、WebP。
- 最大文件：10 MB。
- 图片边长：256–4096 px。
- 上传前解码校验。
- 输入写入私有 `source-assets` Bucket。
- 媒体资产记录保存文件大小、宽高和 Bucket。
- 正式 G20 映射替换旧 G01 前端默认映射。
- G20 不再向服务端传任意 `workflowOverrides`。
- 支持固定/随机 seed。
- 支持 `succeeded`、`timed_out` 状态恢复。

本地源码尚未 Git push，因此这些前端修改当前未部署到 GitHub Pages。

### Supabase / Edge（DEPLOYED / API_VERIFIED）

- Supabase 项目：`wyvswkxogkmywduhrhkw`
- Edge Function：`ai`
- 已部署版本：**v41**
- 状态：`ACTIVE`
- `verify_jwt=true`
- G20 参数在服务端二次白名单校验。
- 只接受当前用户拥有的 `media_assets` 输入。
- 服务端重新生成私有输入文件的短期签名 URL，不信任客户端 URL。
- 超时：360 秒。
- 失败最多重试 1 次。
- 状态：`queued` → `running` → `uploading` → `succeeded`；异常为 `failed` 或 `timed_out`。
- Storage 写入或 `media_assets` 写入失败时不会标记成功。
- MP4 保存前验证：
  - Content-Type 必须为 `video/mp4`
  - 文件不能小于 1 KB
  - MP4 `ftyp` 文件签名必须存在
- 用户任务只保存友好错误摘要。
- 技术错误写入管理员可读的 `audit_logs`。
- 保存总耗时、GPU 运行时间字段、24fps、H.264、时长、分辨率、积分成本。
- 使用 idempotency key 生成稳定任务 ID，避免重复创建同一任务。

### 数据登记（API_VERIFIED）

- `tools.slug=image-to-video`
- `tools.workflow_id=workflow-zealman-video-g20-v1`
- 积分：24
- `workflows.name=G20-图生视频-Wan2.2Remix-v1`
- `workflows.status=published`
- 输入、输出 schema 已登记。
- 数据库的状态约束不接受 `active`，因此保留生产合法值 `published`；前端与 Edge 同时把 `published` 视为可用的生产工作流。

## 4. 三次端到端测试

生产页面检查地址：

`https://jiang289140790-eng.github.io/open-video-studio/app.html`

浏览器可见状态：Header 显示“登录”，登录弹窗打开；没有真实用户 Session。

### 测试 1：最低分辨率、最短时长

- 输入文件：未上传
- 计划参数：512 长边、2 秒、24fps、随机 seed
- task_id：无
- prompt_id：无
- 最终状态：**BLOCKED**
- 总耗时：无
- 推理耗时：无
- 输出 fps：无
- 视频时长：无
- 文件大小：无
- 编码：无
- 可播放：未测试
- 页面回传：未测试
- 数据库写入：无
- 我的创作：未测试
- 失败/重试：未发起
- 阻塞原因：生产页面未登录；没有绕过 Supabase Auth。

### 测试 2：正常分辨率、固定 seed

- 输入文件：未上传
- 计划参数：1024 长边、5 秒、24fps、固定 seed
- task_id：无
- prompt_id：无
- 最终状态：**BLOCKED**
- 其余生成指标：无
- 阻塞原因：同测试 1。

### 测试 3：正常分辨率、随机 seed

- 输入文件：未上传
- 计划参数：1024 长边、5 秒、24fps、随机 seed
- task_id：无
- prompt_id：无
- 最终状态：**BLOCKED**
- 其余生成指标：无
- 阻塞原因：同测试 1。

数据库复核：

- G20 `generation_jobs`：0
- G20 `media_assets`：0

因此没有真实 MP4、页面播放证据或“我的创作”记录，不能标记 `E2E_VERIFIED`。

## 5. 代码验证

|检查|结果|
|-|-|
|`npm run typecheck`|通过|
|`npm run lint`|BLOCKED：项目没有 `lint` script|
|`npm run build`|通过；保留已有静态脚本和资源解析警告|
|`npm test`|75 项：62 通过、13 失败|
|G20 前端 Edge 路由测试|通过|
|`git diff --check`|通过|
|Edge 部署编译|通过，v41 ACTIVE|

13 个失败为现有静态页面、价格页和 SEO 断言；本次出现的旧 G01 映射断言已更新为 G20 并通过。本任务没有扩展范围修复其他历史失败。

## 6. 修改文件

- `apps/web/app.js`
- `apps/web/generation-workspace.js`
- `apps/web/workflow-map.json`
- `supabase/functions/ai/index.ts`
- `tests/ai-provider-config.test.ts`
- `VIDEO_GENERATION_E2E_REPORT.md`

## 7. 当前阻塞与下一步唯一允许事项

1. 在生产站完成真实用户登录。
2. 将本次前端源码按现有发布流程部署到 GitHub Pages。
3. 使用合规、已授权的单张测试图片依次执行上述三组参数。
4. 对每个结果运行实际 MP4 播放/ffprobe 验证，并核对 Storage、`generation_jobs`、`media_assets` 和“我的创作”。

在上述三次闭环完成前，状态保持 **BLOCKED**。
