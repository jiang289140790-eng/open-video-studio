# D18 工作流生产验收报告

工作流：`D18-klein9b真人剧制造机-多图编辑`
候选顺序：第一批第 1 个
测试日期：2026-07-26
实例：`autodl-pro-7841f4d2206a`
最终状态：`BLOCKED`

> 本轮已完成 AutoDL 单机推理与连续稳定性验证，但尚未完成后端注册、前端接入、Storage/数据库闭环和消费者端 E2E，因此不得向普通用户灰度开放。

## 1. 本轮范围

本轮只测试 D18，没有处理其他候选工作流，没有清理模型或缓存，没有修改：

- AutoDL 原工作流 JSON
- Supabase 数据库结构
- Supabase Edge Function
- 消费者前端
- 现有 A01/G20 生成链路

## 2. 实例基线

|项目|结果|
|-|-|
|GPU|NVIDIA GeForce RTX 5090，32,607 MiB|
|ComfyUI|`127.0.0.1:6006`，运行正常|
|Zealman API|`127.0.0.1:6008`，运行正常|
|系统盘|30 GB；测试结束约 1.87 GB 可用，95% 使用率|
|停止阈值|本轮人工授权跳过 10 GB 建议阈值；低于 500 MB、服务异常或连续两次同类失败时停止|
|清理操作|未执行|

系统盘空间仍然偏低。虽然本轮没有触发停止阈值，但不适合直接转入长期生产运行。

## 3. 静态依赖与参数映射

### 3.1 已确认模型

- `Qwen3.6-35B-A3B-UD-Q2_K_XL.gguf`
- `Qwen3.6-35B-A3B-mmproj-BF16.gguf`
- `flux/flux-2-klein-9b.safetensors`
- `qwen_3_8b_fp8mixed.safetensors`
- `flux2-vae.safetensors`
- `seedvr2_ema_3b_fp16.safetensors`
- `ema_vae_fp16.safetensors`

上述模型在当前实例中可被工作流实际加载；D18 依赖使用共享模型库软链接，没有为本轮重复下载模型。

### 3.2 已验证输入和输出节点

|用途|节点/字段|本轮值|
|-|-|-|
|提示词|`1072:positive`|两名成年虚构女性进入明亮现代电影片场|
|参考图 1|`1103:image` / `1103:enabled`|`x1.png` / `true`|
|参考图 2|`1104:image` / `1104:enabled`|`x2.png` / `true`|
|其余参考图|`1105`、`1106`、`1112`、`1117`|全部禁用|
|宽高|`1232:width` / `1232:height`|512 / 512|
|批量|`1232:batch_size`|1|
|采样种子|`1102:867:seed`|逐次变化|
|放大输出|`1240:resolution` / `max_resolution`|512 / 512|
|保存节点|`1243`|PNG 输出|

本轮通过服务端已有 Zealman 工作流接口提交完整 workflow template；浏览器端没有接触实例密钥。

## 4. 测试样本

输入为实例现有的两张非露骨、成年虚构角色参考图：

- `x1.png`
- `x2.png`

提示词：

> 将参考图1和参考图2中的两名成年虚构女性置于明亮现代电影片场中并肩站立，保持各自面部、发型和服装特征，构图自然，写实摄影，非色情内容。

## 5. 真实运行结果

### 5.1 最小样本

|字段|结果|
|-|-|
|prompt_id|`0b15fffb-e68b-43dd-b8d1-8c6528145015`|
|seed|`26072601`|
|ComfyUI 状态|`success`|
|运行时间|140.524 秒（含冷启动/首次加载）|
|输出|`d18_acceptance_minimal_00001_.png`|
|文件|503,958 bytes，512×512 PNG，可解码|
|SHA256|`7120017d247d2dfa207c6804501907471612544bb38e727b1f43097b5e93d242`|
|质量判定|未通过：画面接近两张参考图左右拼接，片场编辑意图不足|
|证据|`artifacts/d18_acceptance_minimal_00001_.png`|

该次只能计为“技术执行成功”，不能计入连续三次有效质量成功。

### 5.2 连续三次有效测试

|测试|prompt_id|seed|状态|耗时|峰值显存|输出文件|文件大小|质量|
|-|-|-:|-|-:|-:|-|-:|-|
|有效测试 1|`b92cb66a-60c1-4a58-8a58-c24e321e75f1`|26072602|success|54.175 秒|采样峰值 29,958 MiB|`d18_acceptance_run2_00001_.png`|445,385 bytes|通过|
|有效测试 2|`e559be64-3bae-401b-94df-1f425a3e13a8`|26072603|success|50.719 秒|29,926 MiB（89 个样本）|`d18_acceptance_run3_00001_.png`|422,718 bytes|通过|
|有效测试 3|`2223b4c8-5d75-4bfe-8f71-4076b44d6c9e`|26072604|success|50.016 秒|29,926 MiB（69 个样本）|`d18_acceptance_run4_00001_.png`|451,423 bytes|通过|

三次输出均：

- 由 ComfyUI 最终保存节点写出
- Zealman `/api/workflow/result` 返回 `pending: false`
- ComfyUI history 返回 `status_str: success`
- 为 512×512 PNG
- 可由 Pillow 完整解码
- 人工查看可打开
- 包含两名参考角色
- 完成了明亮现代片场、并肩站立的主要编辑意图

证据文件：

- `artifacts/d18_acceptance_run2_00001_.png`
- `artifacts/d18_acceptance_run3_00001_.png`
- `artifacts/d18_acceptance_run4_00001_.png`

### 5.3 稳定性与资源结论

- 有效连续成功率：3/3
- 有效三次平均推理时间：51.637 秒
- 首次冷运行时间：140.524 秒
- 已记录峰值显存：约 29.96 GB
- 32 GB 显卡余量很小，不建议提高分辨率或并发量后直接上线
- 未发生自动重试
- 未发生 ComfyUI 或 Zealman 服务错误
- 未触发 500 MB 磁盘停止阈值

## 6. 成本记录

本轮可确认的资源成本：

- 四次 GPU 运行累计约 295.434 秒
- 其中有效连续三次累计约 154.910 秒

实例没有向当前接口返回货币费用或平台计费明细，因此不能伪造人民币、美元或积分成本。正式灰度前仍需将 GPU 时间映射到实际实例单价和消费者积分价格。

## 7. 十二项生产验收状态

|序号|验收项|状态|说明|
|-:|-|-|-|
|1|静态依赖检查|通过|模型和关键节点存在，实际加载成功|
|2|API 参数映射检查|通过（AutoDL）|两图、提示词、seed、尺寸和输出节点已验证|
|3|AutoDL 最小样本测试|通过（技术）|输出可用，但首个样本语义质量不通过|
|4|连续 3 次成功|通过|第 2、3、4 次连续技术与语义均通过|
|5|显存记录|通过|峰值约 29.96 GB|
|6|运行时间记录|通过|50.016–54.175 秒；冷运行 140.524 秒|
|7|输出验证|通过|PNG 可解码、可查看，编辑意图符合|
|8|后端注册|`BLOCKED`|本轮范围禁止修改后端；尚无 D18 专用服务端白名单|
|9|前端接入|`BLOCKED`|本轮范围禁止修改前端；未开放创建按钮|
|10|消费者 E2E|`BLOCKED`|未经过 Edge Function、Storage、数据库和“我的创作”|
|11|成本记录|部分通过|GPU 时间已记录，货币/积分成本未知|
|12|灰度启用|`BLOCKED`|完整 E2E、计价和磁盘风险尚未解决|

## 8. 未完成项与风险

1. 系统盘只剩约 1.87 GB，不适合长期生产运行。
2. 峰值显存接近 30 GB，32 GB GPU 不宜直接提高分辨率或并发。
3. D18 尚未建立面向普通用户的多图参数白名单。
4. 尚未注册到 Supabase Edge Function / AI Gateway。
5. 尚未上传结果到 Supabase Storage。
6. 尚未写入生成任务、积分和“我的创作”记录。
7. 尚未进行页面回传、刷新恢复、失败退款和多用户隔离测试。
8. 实际货币成本和积分定价未知。
9. A01/G20 核心链路现有报告仍未达到完整 `E2E_VERIFIED`。

## 9. 结论

D18 的 AutoDL 工作流推理阶段已经取得真实证据：

- 静态依赖：通过
- AutoDL API 映射：通过
- 最小技术样本：通过
- 连续三次有效输出：通过
- 显存、耗时、文件完整性：已记录
- 后端注册：未执行
- 前端接入：未执行
- 消费者端 E2E：未执行
- 灰度开放：禁止

因此当前只能判定为：

`AutoDL 单机验收通过；生产接入仍为 BLOCKED`

`production_enabled = false`

下一步只允许在人工确认后，为 D18 建立服务端白名单和测试环境注册；在完整 E2E 通过前不得向普通用户显示“可生成”。

## 10. 生产接入更新（2026-07-26）

本节记录后续获得人工确认后完成的接入，不改写上面的 AutoDL 单机验收历史结论。

### 10.1 已实施

- `IMPLEMENTED_LOCAL`：新增正式工作流 ID `workflow-zealman-image-d18-v1`。
- `IMPLEMENTED_LOCAL`：消费者多图页限制为正好 2 张图片，每张 JPG/PNG/WebP、最大 10 MB、边长 256—4096px。
- `IMPLEMENTED_LOCAL`：两张图片先上传至私有 `source-assets`，浏览器只提交资产 ID，不直连 AutoDL。
- `IMPLEMENTED_LOCAL`：Edge Function 按当前用户核验两项资产的所有权、类型、尺寸、大小和 Storage bucket。
- `IMPLEMENTED_LOCAL`：D18 仅允许写入已验证节点：
  - `1072.positive`
  - `1103.image`
  - `1104.image`
  - `1102:867.seed`
  - `1232.width/height/batch_size`
  - `1240.seed/resolution/max_resolution/batch_size`
  - `1243.filename_prefix`
- `IMPLEMENTED_LOCAL`：固定 512×512、batch size 1，并关闭 `1105`、`1106`、`1112`、`1117` 四个未使用输入。
- `IMPLEMENTED_LOCAL`：超时 300 秒，最多自动重试 1 次；失败使用可理解提示并沿用现有积分退款逻辑。
- `IMPLEMENTED_LOCAL`：结果必须通过 PNG/JPEG/WebP 文件签名检查，再写入 Supabase Storage 和 `media_assets`。
- `DEPLOYED`：Supabase `ai` Edge Function 已发布为版本 42，JWT 校验保持开启。
- `DEPLOYED`：Supabase 已登记 `image-combiner` 与 D18 工作流，16 积分，`visibility=unlisted`、`featured=false`。

### 10.2 验证

- `BUILD_PASSED`：`npm run typecheck`
- `BUILD_PASSED`：`npm run build`
- `BUILD_PASSED`：D18/AI 定向测试 6/6
- `BUILD_PASSED`：相关文件 `git diff --check`
- `BLOCKED`：项目没有 `npm run lint` 脚本。
- `BLOCKED`：完整 `npm test` 仍有 16 个既有前端、价格与 SEO 断言失败；D18 定向测试没有失败。
- `BLOCKED`：本地开发进程没有配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`，无法在本地浏览器建立真实登录会话。
- `BLOCKED`：Git 工作区在本次任务前已有大量未提交改动，同一批核心文件包含其他窗口的修改，因此未自动提交或推送，避免把无关改动一并发布。
- `BLOCKED`：尚未使用真实登录用户从网站完成“上传两图 → 扣积分 → Edge Function → D18 → Storage → 页面结果 → 我的创作”的完整 E2E。

当前状态：

- 服务端白名单与数据库登记：`DEPLOYED`
- 消费者前端源码：`IMPLEMENTED_LOCAL`
- GitHub Pages 前端：`BLOCKED`
- 完整消费者 E2E：`BLOCKED`
- 普通用户公开启用：`production_enabled = false`
