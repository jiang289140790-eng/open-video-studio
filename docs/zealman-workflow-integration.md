# ZEALMAN 工作流 API 接入记录

## 当前服务

- 面板地址由服务端环境变量 `ZEALMAN_PANEL_BASE_URL` 提供，不写入前端。
- 服务端使用 `ZEALMAN_API_TOKEN`，密钥不进入仓库、网页或日志。
- 已核验接口：`GET /api/health`、`GET /api/workflow/list`、`GET /api/workflow/config/{workflowName}`。
- 工作流提交和轮询由 Supabase Edge Function `ai` 完成：`/api/workflow/generate`、`/api/workflow/result?prompt_id=...`。

## 前端工具映射

映射文件：`apps/web/workflow-map.json`。其中 `workflowId` 是站内稳定标识，`workflowName` 是 ZEALMAN 面板中的工作流名称。浏览器只调用 `api-service.js`，不会接触 ZEALMAN 凭据。

已从当前面板验证配置模板可读取的工具：

- image-editor → 功能03-自然语言图片编辑（本地）
- face-swap → 功能01-授权虚构角色换脸（本地）
- outfit-studio → 功能04-成年虚构角色换装（本地）
- pose-generator → 功能05-人物姿势重构（本地）
- image-combiner → 功能02-多图智能合成（本地）
- image-upscale → 功能07-图片高清修复（本地）
- image-to-video → 测试01-Wan2.2Remix-图生视频
- undress-video → WAN-NSFW-Undress
- adult-effects → 功能08-Wan2.2-4in1成人特效（本地）
- movie-closeup → 功能09-Wan2.2-电影近景特效（本地）
- smooth-video → G03-图生视频-Wan2.2SmoothMix
- digital-human → J11-LTX2.3高清超自然电商数字人

## 输入处理

- 提示词会写入工作流的正向文本节点；可用 `ZEALMAN_PROMPT_NODE_ID` 指定节点。
- 浏览器选择的图片先由服务端上传到 ZEALMAN 的 ComfyUI 文件接口，再写入第一个图片加载节点。
- `workflowOverrides` 只允许按节点 ID 写入字符串、数字和布尔值，便于后续接入种子、尺寸、LoRA 权重等明确参数。
- 服务端会轮询任务并从结果中返回输出 URL；失败或超时会返回明确错误并执行已有积分退款逻辑。
