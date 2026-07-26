# Phase 6 — Face Swap, Outfit and Pose Tools

## 1. 任务范围

本阶段只调整消费者前台的 AI 换脸、服装变换、姿势生成工具，以及三者共用的效果选择弹层。未修改积分扣减规则、订单、RLS、数据库结构、模型工作流执行逻辑或 AI Marketing Studio。

## 2. 修改前审计

### 2.1 页面与代码来源

| 项目 | 当前来源 | 审计结果 |
|---|---|---|
| 三个工具页面 | `apps/web/face-swap.html`、`outfit-studio.html`、`pose-generator.html` | 都挂载同一个 `generation-workspace.js` |
| 页面行为 | `apps/web/generation-workspace.js` | 原先三个页面共用单一上传区和提示词，没有角色化输入 |
| 静态工作流映射 | `apps/web/workflow-map.json` | 换脸映射只有通用 `image`，服装与姿势只有 `image + effect` |
| 生产工具数据 | Supabase `tools` / `workflows`（只读检查） | 只有 `face-swap` 工具记录；其工作流状态为 published，且 input/output schema 为空 |
| 服装、姿势生产工具 | Supabase（只读检查） | 当前没有 `outfit-studio`、`pose-generator` 工具记录 |
| 效果预设 | `apps/web/effect-catalog.js` / 前端目录 | 有服装和姿势名称，但均无独立预览、无 active workflow |
| 预览资源 | `apps/web/home-assets` | 没有可验证为对应服装/姿势效果的独立预览，不能随机借用 |

### 2.2 根因

1. `TOOL_DEFINITIONS` 只用 `minFiles/maxFiles` 区分素材数量，无法表达“源人脸”和“目标图片”。
2. 服装与姿势页面没有各自的模式状态，均落入“上传图片 + 填写提示词”的通用路径。
3. 现有工作流 schema 不足以证明两张换脸图片、参考服装、预设 ID 等参数会被消费。
4. 预设数据没有独立媒体与 active workflow；如果直接开放提交会误导用户。
5. 服务端此前只保存通用 prompt 和基础生成参数，无法审计前端选择的工具模式和预设。

## 3. 实现内容

### 3.1 AI 换脸

- 建立“源人脸 → 目标图片”双槽位，不再使用含糊的多文件上传。
- 每个槽位独立执行格式、大小、分辨率和浏览器人脸检测。
- 浏览器不支持 `FaceDetector` 时明确显示“需要服务端校验”，不伪造检测成功。
- 目标图检测到多人脸时显示编号选择，保存 `targetFaceIndex`。
- 显示上传顺序、角色含义、素材授权与隐私提示。
- 只有工作流 schema 同时公开源人脸和目标图片输入时才允许提交。
- “保留发型、保留表情、融合强度”只在工作流 schema 明确支持时显示。

### 3.2 服装变换

- 拆分为“服装预设 / 参考服装 / 自定义描述”三种模式。
- 参考服装输入只有在工作流 schema 明确支持时开放。
- 预设为视觉卡片，数据包含：
  - `effect_id`
  - `preview`
  - `prompt_template`
  - `workflow_id`
  - `credit_cost`
  - `status`
- 现有无预览或无 active workflow 的预设显示“预览准备中 / 即将上线”，不能确认或提交。
- 当前分类严格来自现有目录数据：日常、正装、内衣、自定义；未凭空加入没有数据的泳装或角色扮演。

### 3.3 姿势生成

- 拆分为“简单模式 / 自定义模式”。
- 简单模式只选择视觉姿势预设，不强制填写描述。
- 自定义模式显示姿势描述、人物角度和镜头。
- 预设记录单人/双人、正面/侧面/背面等字段；当前只展示已有目录可以支持的单人条目。
- 没有 active workflow 的姿势只能查看，不能提交。

### 3.4 通用 EffectPickerModal

- 支持搜索、分类、热门、最新、视觉卡片、积分、可用状态和确认。
- 无媒体时显示统一“预览准备中”，不显示纯黑卡、不伪造效果图。
- 支持关闭按钮、遮罩关闭和 Escape 关闭。
- 未选择或所选效果不可用时禁用确认。

### 3.5 错误与参数安全

- 前端将网络、积分、工作流、人脸检测和内容审核错误转换为用户可理解文案。
- 不向页面显示服务端堆栈；未知错误最多显示第一行并限制长度。
- 服务端只白名单保存：
  - `toolMode`
  - `effectId`
  - `effectPromptTemplate`
  - `faceSwap`
  - `poseAngle`
  - `camera`
- 未加入任何密钥、service role、模型密钥或前端敏感配置。
- 未修改现有退款流程；失败页继续读取现有积分交易记录显示退款状态。

## 4. 修改文件

| 文件 | 修改内容 |
|---|---|
| `apps/web/generation-workspace.js` | 三类专用工具状态、双素材换脸、服装/姿势模式、EffectPickerModal、提交阻断与友好错误 |
| `apps/web/styles.css` | Phase 6 双素材布局、模式切换、视觉卡片弹层、移动端样式 |
| `supabase/functions/ai/index.ts` | 白名单保存 Phase 5/6 标准化输入参数，不改工作流执行 |

## 5. 验证结果

### 自动检查

| 检查 | 结果 |
|---|---|
| `node --check apps/web/generation-workspace.js` | 通过 |
| `npm run typecheck` | 通过 |
| `npm run build` | 通过 |
| `git diff --check` | 通过 |
| 页面脚本错误 | 未发现运行时 error；仅 Vite 连接 debug 日志 |

构建仍会输出项目原有的非 module script 与 home-assets 运行时解析提醒；没有因此失败，本阶段未扩大范围处理。

### 页面与交互

| 验收项 | 结果 |
|---|---|
| 换脸双角色槽位 | 通过 |
| 源人脸 → 目标图视觉顺序 | 通过 |
| 工作流未公开双输入时阻止提交 | 通过 |
| 工作流支持时显示换脸高级参数 | 通过（本地能力状态） |
| 服装三种模式 | 通过 |
| 参考服装按 schema 开关 | 通过 |
| 服装预设视觉弹层 | 通过 |
| 姿势简单/自定义模式 | 通过 |
| 姿势角度与镜头 | 通过 |
| 搜索、分类、热门、最新 | 通过 |
| 无 active workflow 不可确认 | 通过 |
| 生产状态无误导性“可生成” | 通过；服装和姿势全部保持“即将上线” |
| 真实文件选择与服务端人脸检测 | 需手动联调，见未完成项 |
| 真实生成成功/失败 | 未执行，因为生产工作流不满足 active + schema 条件 |

### 截图

- `docs/screenshots/phase6-face-swap.jpg`
- `docs/screenshots/phase6-outfit-picker.jpg`
- `docs/screenshots/phase6-pose-picker.jpg`

截图中的“可用”预设仅来自 localhost 的 `qaSpecial=full` 能力模拟，用于验证交互；该模拟不会在 GitHub Pages 生产域名启用。生产状态已另行检查，均显示“即将上线”。

## 6. 未完成项

1. **换脸真实两图生成未接通**
   - 原因：当前生产 workflow input/output schema 为空；静态映射只有一个通用图片输入。
   - 依赖：发布真正支持 `source_face` 与 `target_image` 的 active workflow，并登记明确 input/output schema、积分价格。

2. **目标图多人脸服务端选择未联调**
   - 原因：当前没有可调用的换脸工作流和服务端人脸框数据。
   - 依赖：后端返回稳定的人脸数量/坐标，并接受 `targetFaceIndex`。

3. **服装与姿势生产生成未开放**
   - 原因：生产 `tools` 中没有对应工具；当前预设无真实预览、无 active workflow。
   - 依赖：登记工具、工作流、积分、合法预览资源和许可证信息。

4. **真实本地文件选择未由自动浏览器完成**
   - 原因：当前页面控制接口不提供文件选择能力。
   - 手动验收：分别选择源人脸、目标图、人物图、参考服装，检查缩略图、文件信息、删除/替换、人脸校验和提交按钮状态。

5. **未执行生产部署与 GitHub push**
   - 符合任务边界；本阶段只完成本地实现与构建验证。

## 7. 下一任务依赖

1. 为三个工具提供已手动成功运行的生产工作流。
2. 在 `tools/workflows` 中登记非零积分、active 状态、完整 input/output schema。
3. 为每个服装和姿势预设提供合法、可追溯、非误导性的独立预览资源。
4. 确认 API bridge 对 `roleAssets` 的上传与 URL 映射，尤其是换脸双图和参考服装。
5. 完成真人授权、未成年人禁止、内容审核和失败退款的端到端测试。
