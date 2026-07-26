# SYSTEM BASELINE — 2026-07-26

## 验收状态

`BLOCKED`

原因：系统盘 C: 可用空间为 **9.44 GB**，低于任务规定的 10 GB 强制停止线。发现后已立即停止后续线上查询、构建与真实生成测试。

## 唯一代码源

- 唯一仓库：`C:\Users\admin\Documents\工作流模型\_repo`
- 仓库路径核验：`C:\Users\admin\Documents\工作流模型\_repo`
- 当前分支：`main`
- 本地 HEAD：`e3c919ccfc8b9761c6ed1959e593400b96cbb9dc`
- origin/main：`e3c919ccfc8b9761c6ed1959e593400b96cbb9dc`
- 本地 HEAD 与 origin/main：一致
- origin fetch：`https://github.com/jiang289140790-eng/open-video-studio.git`
- origin push：`https://github.com/jiang289140790-eng/open-video-studio.git`
- GitHub Pages 当前部署 commit：`BLOCKED`（触发磁盘停止条件后未继续查询，不能用页面脚本哈希冒充部署 commit）

## Git 工作区状态

`git status --short --branch` 显示：

- 分支：`main...origin/main`
- 工作区不是干净状态。
- 已有多项前端、Edge Function、脚本和报告修改。
- 已有多项未跟踪文件，包括 Phase 1—12 报告、消费者组件、本地迁移和测试。
- 本任务未清理、覆盖、提交或推送这些既有修改。
- 本任务未修改 `remote-update`、旧 `open-video-studio` 副本或第二套仓库。
- 本任务未修改 `dist-web` 构建文件。

## 部署与运行基线

以下项目因强制停止条件未继续刷新查询，不能标记为已验证：

| 项目 | 状态 | 当前证据 |
|---|---|---|
| GitHub Pages 版本 | `BLOCKED` | 未取得部署 commit |
| Supabase 项目 | `BLOCKED` | 本轮未重新查询 |
| Supabase Edge Function 版本 | `BLOCKED` | 本轮未重新查询 |
| AutoDL 实例状态 | `BLOCKED` | 本轮未连接 |
| Zealman 工作流数量 | `BLOCKED` | 本轮未连接 |
| ComfyUI 版本 | `BLOCKED` | 本轮未连接 |
| GPU | `BLOCKED` | 本轮未连接 |
| 系统盘可用空间 | `BLOCKED` | C: 仅 9.44 GB |
| 数据盘可用空间 | `BLOCKED` | 停止后未继续查询 |

## 环境变量

为避免密钥泄露，停止条件触发后未读取环境文件内容，也未输出任何值。

允许在恢复验收后仅记录变量名称。当前名称清单状态：`BLOCKED`。

## 恢复验收的前置条件

1. 将 C: 可用空间提升到至少 10 GB；建议保留 15 GB 以上，以避免 npm 构建、浏览器缓存和媒体生成再次触发磁盘风险。
2. 不删除或覆盖当前脏工作区中的用户修改。
3. 清理空间后重新开始本任务，并首先重复：
   - 仓库路径核验
   - C: 可用空间核验
   - `git status`
   - 当前分支、HEAD、origin/main 与 Pages 部署 commit 核验
