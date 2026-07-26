# VIDEO TOOL PAGE ACCEPTANCE

日期：2026-07-26
范围：消费者前台「图片转视频」页面
页面：`apps/web/image-to-video.html`
唯一工作流映射：`G20-图生视频-Wan2.2Remix-v1`
workflow_id：`workflow-zealman-video-g20-v1`

## 1. 验收结论

|项目|状态|说明|
|-|-|-|
|页面实现|IMPLEMENTED_LOCAL|视频工具页已收敛为单一 G20 图片转视频能力。|
|类型检查|BUILD_PASSED|`npm run typecheck` 通过。|
|生产构建|BUILD_PASSED|`npm run build` 通过。|
|桌面页面检查|BUILD_PASSED|1920px 页面正常渲染，无横向溢出。|
|移动页面检查|BUILD_PASSED|390×844 页面正常渲染，无横向溢出。|
|真实视频 E2E|BLOCKED|仓库中的 `VIDEO_GENERATION_E2E_REPORT.md` 仍为 `BLOCKED`；没有连续三次真实 MP4、Storage、数据库、页面播放和“我的创作”证据。|
|生产可创建状态|BLOCKED|遵守“不把未完成真实验证的工作流显示为可生成”，创建按钮保持禁用并显示真实原因。|

本次不修改 Supabase 数据库结构、Edge Function、Zealman/ComfyUI 工作流和积分扣减逻辑。

## 2. 原问题与根因

1. 视频效果列表同时包含通用占位、电影近景、SmoothMix、第一人称和姿势等未接入工作流，容易让用户误以为这些工作流可用。
2. 页面参数完全依赖线上 workflow schema；数据库不可读取或 schema 尚未返回时，时长、尺寸和 Seed 会消失。
3. G20 服务端只接受提示词、图片、时长、长边尺寸、Seed 和固定 24fps，但原页面把镜头运动、循环、人脸稳定等其他工作流参数混在同一选择器中。
4. 上传文案显示 20 MB，与 G20 服务端 10 MB 限制不一致。
5. 视频参数没有清晰区分基础参数和高级参数。
6. 页面已有真实任务状态和播放器逻辑，但没有明确标注当前唯一工作流以及真实 E2E 门禁。

## 3. 修改文件

### `apps/web/generation-workspace.js`

- 视频效果数据仅保留 G20 图片转视频。
- 移除视频页的多工作流效果选择弹层。
- LTX、WanAnimate、SmoothMix、成人特效及其他工作流不再作为可用选项出现。
- 增加 G20 固定参数定义：
  - 时长：2、3、4、5、6、8、10 秒
  - 尺寸（长边）：512、768、1024 px
  - Seed：`random` 或 0—4294967295
  - FPS：固定 24
- 增加 Seed 前端格式校验。
- 增加高级参数折叠区。
- 根据工作流 schema 决定是否显示负面提示词；当前 G20 未公开该参数，因此只显示明确说明，不发送假参数。
- 视频上传限制文案改为 10 MB。
- 积分区改为“预计积分”，当前 G20 基础价格显示 24 积分。
- 成功结果操作区增加“我的创作”入口。
- 保留已有真实任务状态：
  - queued
  - running / processing
  - model_preparing
  - generating
  - post_processing
  - uploading_result
  - succeeded / completed
  - failed
  - timed_out
  - cancelled
- 保留服务端进度映射；没有服务端百分比时显示不确定进度，不伪造精确百分比。
- 保留 MP4 播放器、下载、再次生成、使用新描述重试、复制参数、分享和任务恢复。

### `apps/web/styles.css`

- 增加单一 G20 工作流摘要样式。
- 增加高级参数折叠区样式。
- 保持桌面双栏和移动端单栏布局。

### `apps/web/image-to-video.html`

- 核对页面标题和单一工具入口，未增加第二套页面。

## 4. 必需页面元素验收

|要求|结果|证据|
|-|-|-|
|图片上传|通过|JPG/PNG/WebP；页面显示 10 MB；实际校验使用视频专用 10 MB 限制。|
|提示词|通过|视频描述字段，最长 1200 字符。|
|负面提示词|按能力处理|G20 服务端白名单没有负面提示词节点，页面明确说明不支持，不伪造输入。|
|时长|通过|2/3/4/5/6/8/10 秒。|
|尺寸|通过|长边 512/768/1024 px。|
|Seed|通过|高级参数内展示，支持 random 和合法整数。|
|高级参数折叠区|通过|使用原生 `details/summary`，可键盘操作。|
|预计积分|通过|显示 24 积分；仍以服务端账单为准。|
|创建按钮|通过但受门禁|当前因真实 E2E 报告为 BLOCKED 而禁用。|
|排队状态|通过|本地状态验收显示“任务正在排队”。|
|生成进度|通过|显示服务端阶段和服务端进度；无百分比时显示不确定进度。|
|失败状态|通过|显示用户可理解错误和退款核对信息，不暴露完整 ComfyUI 堆栈。|
|视频播放器|代码通过，真实播放阻塞|成功且有结果 URL 时渲染 `<video controls playsinline preload="metadata">`；当前无真实 MP4 证据。|
|下载|通过|成功且有结果 URL 时提供下载。|
|再次生成|通过|成功/失败结果均提供重试入口。|
|我的创作入口|通过|最近任务区和成功结果操作区均提供入口。|

## 5. 状态覆盖检查

通过本地只读 QA 状态检查：

- `queued`：结果区为 `queued`，显示“任务正在排队”。
- `running + generating`：结果区为 `processing`，显示“正在生成”和服务端阶段。
- `failed + refund`：结果区为 `failed`，显示失败原因和“已退回积分”状态。

这些只验证 UI 状态映射，不作为真实生成或真实退款证据。

## 6. 响应式与截图

- 桌面端：1920px，`scrollWidth === clientWidth`。
- 手机端：390×844，`scrollWidth === clientWidth === 390`。
- 页面没有横向滚动。

截图：

- `artifacts/video-tools/image-to-video-desktop.png`
- `artifacts/video-tools/image-to-video-mobile-390.png`

## 7. 工程验证

|命令|结果|
|-|-|
|`node --check apps/web/generation-workspace.js`|通过|
|`npm run typecheck`|通过|
|`npm run lint`|BLOCKED：项目没有 `lint` script|
|`npm run build`|通过；保留项目已有静态脚本和资源路径警告|
|`npm test`|BLOCKED：75 项中 59 通过、16 失败|
|`git diff --check`|通过|

16 个失败为已有静态页面、价格、SEO 和旧页面契约断言；本次未扩大范围修改这些模块。

## 8. 未完成项

1. `VIDEO_GENERATION_E2E_REPORT.md` 仍没有三次真实闭环成功证据。
2. 没有可验证的真实 MP4，无法验收生产播放器、下载和“我的创作”回传。
3. 当前创建按钮保持禁用；只有三次真实闭环完成并更新 E2E 证据后，才能把 G20 标记为可创建。
4. 项目缺少 `lint` 命令。
5. 全量测试仍有 16 个与本任务无关的历史失败。

## 9. 下一任务依赖

只允许修复真实 G20 E2E 阻塞：

1. 使用真实登录用户执行三次 G20 生成。
2. 核验 MP4 可播放、Storage 对象、数据库记录、页面回传和“我的创作”。
3. 核验积分冻结、成功扣费和失败退款。
4. 三次全部通过后，再将 G20 的 `e2eVerified` 和效果状态切换为可创建。
