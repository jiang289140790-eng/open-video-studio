# SPECIAL IMAGE TOOLS READINESS REPORT

日期：2026-07-26
审计范围：AI 换脸、换装、姿势重构、多图合成、自然语言编辑
代码源：`C:\Users\admin\Documents\工作流模型\_repo`

## 1. 判定标准

- `workflow_validated`：工作流不仅有名称映射，还已核对可执行 workflow JSON、输入节点、输出节点、依赖资源，并至少有真实成功运行证据。
- `frontend_ready`：独立页面、上传、参数、结果区、任务状态、错误状态、历史入口和禁用状态可以正常显示。
- `backend_ready`：服务端能够按该工具的真实输入结构安全上传全部素材、白名单映射节点、提交、轮询、保存结果和记录错误；仅有通用 Zealman 调用器不算完成。
- `e2e_verified`：已有真实用户从前端到 Edge Function、Zealman/ComfyUI、Storage、数据库、页面结果和“我的创作”的完整成功证据。
- `production_enabled`：生产创建按钮已经允许提交。只有前四项满足后才可以为 `true`。

## 2. 总体结论

|工具|workflow_validated|frontend_ready|backend_ready|e2e_verified|production_enabled|
|-|-|-|-|-|-|
|AI 换脸|false|true|false|false|false|
|换装|false|true|false|false|false|
|姿势重构|false|true|false|false|false|
|多图合成|false|true|false|false|false|
|自然语言编辑|false|true|false|false|false|

五项功能目前均为“页面已准备、真实生成未开放”。本次未将任何功能标记为可生成。

## 3. 映射清单

|工具|前端 slug|workflow_id|Zealman 工作流名称|本地映射状态|
|-|-|-|-|-|
|AI 换脸|`face-swap`|`workflow-hifun-face-swap-v1`|`功能01-授权虚构角色换脸（本地）`|`requires_server_config`|
|换装|`outfit-studio`|`workflow-hifun-outfit-v1`|`功能04-成年虚构角色换装（本地）`|`requires_server_config`|
|姿势重构|`pose-generator`|`workflow-hifun-pose-v1`|`功能05-人物姿势重构（本地）`|`requires_server_config`|
|多图合成|`image-combiner`|`workflow-hifun-combiner-v1`|`功能02-多图智能合成（本地）`|`requires_server_config`|
|自然语言编辑|`image-editor`|`workflow-hifun-image-editor-v1`|`功能03-自然语言图片编辑（本地）`|`requires_server_config`|

映射来源：

- `apps/web/workflow-map.json`
- `supabase/functions/ai/index.ts` 中的 `resolveZealmanWorkflowName`
- `apps/web/app.js` 中的前端工具目录和 workflow binding

这些映射只能证明“名称已登记”，不能证明节点映射、模型依赖、输入数量、输出节点或真实生成成功。

## 4. 分项审计

### 4.1 AI 换脸

状态：

- `workflow_validated: false`
- `frontend_ready: true`
- `backend_ready: false`
- `e2e_verified: false`
- `production_enabled: false`

前端证据：

- 独立页面：`apps/web/face-swap.html`
- 已提供源人脸和目标图片两个独立槽位。
- 已提供素材顺序提示、人脸校验状态、目标多人脸选择占位、任务状态、失败状态和历史区域。
- 页面实测显示“即将上线”，创建按钮禁用。

后端阻塞：

- 浏览器桥接层只把 `params.file` 作为一个上传文件处理；源人脸与目标图片的 `roleAssets` 没有形成两个服务端资产输入。
- Edge Function 对此工作流使用通用 `applyZealmanPrompt` / `applyZealmanOverrides`，没有换脸专用节点白名单。
- 未找到源脸节点、目标图节点、目标人脸索引和输出节点的已验证映射。
- 未找到真实成功任务、结果资产和“我的创作”证据。

### 4.2 换装

状态：

- `workflow_validated: false`
- `frontend_ready: true`
- `backend_ready: false`
- `e2e_verified: false`
- `production_enabled: false`

前端证据：

- 独立页面：`apps/web/outfit-studio.html`
- 已提供人物图上传、服装预设/参考服装/自定义模式、视觉预设弹层、提示词、结果区和任务状态。
- 没有 active workflow 的预设不能提交。
- 页面实测显示“即将上线”，创建按钮禁用。

后端阻塞：

- 参考服装属于第二张素材，但当前通用桥接层只上传主 `file`，没有把参考服装安全转换为第二个服务端资产。
- `effectId`、服装预设和参考服装没有换装专用节点白名单。
- 通用 `workflowOverrides` 不能替代已验证的 ComfyUI 节点映射。
- 未找到真实端到端生成证据。

### 4.3 姿势重构

状态：

- `workflow_validated: false`
- `frontend_ready: true`
- `backend_ready: false`
- `e2e_verified: false`
- `production_enabled: false`

前端证据：

- 独立页面：`apps/web/pose-generator.html`
- 已提供简单模式、自定义模式、姿势视觉弹层、角度、镜头、提示词、状态区和历史区。
- 没有 active workflow 的姿势预设不能提交。
- 页面实测显示“即将上线”，创建按钮禁用。

后端阻塞：

- `effectId`、姿势角度和镜头值会进入前端参数对象，但没有对应的姿势专用服务端白名单节点映射。
- Edge Function 的通用 Zealman 分支只保证提示词写入和可选 overrides，不证明姿势控制节点真实可用。
- 未找到姿势参考图、ControlNet/姿势节点或输出节点的验证记录。
- 未找到真实端到端生成证据。

### 4.4 多图合成

状态：

- `workflow_validated: false`
- `frontend_ready: true`
- `backend_ready: false`
- `e2e_verified: false`
- `production_enabled: false`

前端证据：

- 独立页面：`apps/web/image-combiner.html`
- 已支持 2—4 张素材的页面上传、提示词、状态、结果和最近任务区域。
- 页面实测显示“即将上线”，创建按钮禁用。

后端阻塞：

- 页面会提交 `files` 数组，但 `window.__OVS_WORKFLOW_API__.generate` 只读取第一个 `params.file`。
- 其余参考图片没有上传为服务端资产，也没有主图/参考图角色映射。
- 未找到多输入节点和输出节点的白名单验证。
- 未找到真实多图端到端成功证据。

### 4.5 自然语言编辑

状态：

- `workflow_validated: false`
- `frontend_ready: true`
- `backend_ready: false`
- `e2e_verified: false`
- `production_enabled: false`

前端证据：

- 独立页面：`apps/web/image-editor.html`
- 已提供单图/多图模式、快捷编辑、自定义提示词、提示词历史、结果状态和最近任务。
- 工作流 schema 不支持多图槽位时，页面会自动隐藏对应输入。
- `TOOL_DEFINITIONS.image-editor.e2eVerified` 已为 `false`。
- 页面实测显示“即将上线”，创建按钮禁用。

后端阻塞：

- 单图和提示词可以进入通用 Zealman 调用路径，但尚未验证自然语言编辑工作流的输入图节点、提示词节点和输出节点。
- 快捷操作的 `operation` 字段没有自然语言编辑专用服务端白名单映射证据。
- 多图编辑槽位仍受同一“只上传第一个 file”问题影响。
- 本地映射状态为 `requires_server_config`，且没有真实端到端成功记录。

## 5. 生产门禁检查

本次统一确认五个工具都包含：

```text
e2eVerified: false
```

`hasConfiguredWorkflow()` 会优先检查该标记。即使 Supabase 中误把工具或 workflow 标成 `active` / `published`，页面也不会启用创建按钮。

浏览器逐页检查结果：

|页面|工作流状态文案|创建按钮|上传区|提示词|结果区|最近任务|
|-|-|-|-|-|-|-|
|AI 换脸|即将上线|禁用|有|有|有|有|
|换装|即将上线|禁用|有|有|有|有|
|姿势重构|即将上线|禁用|有|有|有|有|
|多图合成|即将上线|禁用|有|有|有|有|
|自然语言编辑|即将上线|禁用|有|有|有|有|

创建按钮统一显示：

`即将上线：工作流尚未完成真实验证`

## 6. 配置不一致与风险

1. `apps/web/app.js` 的默认工具目录把这些工具写成 `published`，但 `workflow-map.json` 明确为 `requires_server_config`。工具目录的“已发布”不能作为生产可生成证据。
2. Edge Function 内存在工作流名称 fallback 映射，但缺少五个工具各自的专用输入节点白名单。
3. 多图、换脸和参考服装需要多素材上传；当前浏览器桥只处理第一张文件。
4. 姿势、服装预设等业务参数没有验证其最终写入了正确 ComfyUI 节点。
5. 没有任何一项有连续真实 E2E 成功报告。
6. 未直接读取生产 Supabase 的 tools/workflows 行；本报告以仓库内映射、服务端代码和已有验收报告为证据。即使生产数据库状态更宽松，前端硬门禁仍会阻止创建。

## 7. 后续开放条件

每个工具必须分别完成以下事项后，才能更新对应布尔状态：

1. 导出并备份实际 workflow JSON。
2. 核对全部输入节点、输出节点、自定义节点、模型和 LoRA。
3. 为服务端建立工具专用白名单参数映射，禁止客户端任意节点覆盖。
4. 多素材工具必须把每张素材保存为当前用户拥有的 Storage / media asset。
5. 完成上传、任务、输出、Storage、数据库、“我的创作”和积分退款闭环。
6. 连续执行至少三次真实端到端测试。
7. 通过后依次更新：
   - `workflow_validated: true`
   - `backend_ready: true`
   - `e2e_verified: true`
   - 最后才允许 `production_enabled: true`

## 8. 本次修改

- `apps/web/generation-workspace.js`
  - 为 AI 换脸、换装、姿势重构补齐 `e2eVerified: false` 硬门禁。
- `SPECIAL_IMAGE_TOOLS_READINESS_REPORT.md`
  - 新增本审计报告。

未修改：

- Supabase 数据库结构
- Edge Function 生成逻辑
- Zealman / ComfyUI 工作流
- 积分规则
- Storage
- 任何工具的生产启用状态
