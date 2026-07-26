# Production Smoke Test Report

测试日期：2026-07-19（Asia/Shanghai）
项目：`open-video-studio`  生产环境：GitHub Pages + Supabase 项目 `wyvswkxogkmywduhrhkw`

## 结论

本次冒烟测试结果：**部分通过，不能判定为全链路通过**。

- 前端三个页面：通过（HTTP 200）。
- Supabase 数据库连接：通过；`profiles`、`agent_tasks`、`tools`、`workflows` 可访问。
- `content_metrics`：未找到，相关指标读取无法通过。
- Edge Functions：`ai`、`admin` 已部署且启用 JWT；`platform` 不存在。
- Google OAuth 实际登录：未执行（生产环境当前没有用户，会触发外部授权流程）；因此无法确认 OAuth 后 profile 创建。
- Agent Task 实际登录用户链路：未执行。数据库中当前 `auth.users=0`，无法创建归属真实用户的任务。

## 1. 前端页面

| 页面 | 地址 | 结果 |
|---|---|---|
| Growth Dashboard | `https://jiang289140790-eng.github.io/open-video-studio/growth-dashboard.html` | HTTP 200 |
| Admin | `https://jiang289140790-eng.github.io/open-video-studio/admin.html` | HTTP 200 |
| App | `https://jiang289140790-eng.github.io/open-video-studio/app.html` | HTTP 200 |

## 2. Supabase 数据读取

通过已连接的 Supabase 项目执行只读查询：

| 表 | 是否存在 | 当前行数 | 结果 |
|---|---:|---:|---|
| `profiles` | 是 | 0 | 可读取 |
| `agent_tasks` | 是 | 0 | 可读取 |
| `tools` | 是 | 3 | 可读取 |
| `workflows` | 是 | 3 | 可读取 |
| `content_metrics` | 否 | — | 未通过 |

另外确认：`auth.users` 当前为 0 条，`profiles` 当前为 0 条；已存在 `auth.users` 到 `private.sync_auth_user_profile()` 的同步触发器定义。

## 3. 用户登录与 Profile

本次没有实际点击 Google OAuth，也没有创建测试用户，原因是：

1. 生产项目当前 `auth.users` 为空，没有可用于登录后验证的账号。
2. OAuth 会跳转到第三方授权页面，不在无用户确认的情况下执行真实授权。
3. 仓库内的 `verify:oauth` 脚本在当前本地环境中未配置 `SUPABASE_URL`、`SUPABASE_ANON_KEY`，只能作为本地配置检查，不能代替线上 OAuth 登录。

状态：**待人工生产登录验证**。

## 4. Agent Task

已确认 `agent_tasks` 表结构和状态约束包含：

- `pending`
- `running`
- `completed`
- `failed`

尝试写入临时任务时，数据库按设计要求 `user_id` 必须引用真实 `auth.users`，而当前没有任何生产用户，因此未创建孤立测试数据，也未污染生产库。

状态：**数据库层通过；真实用户创建、刷新保持、执行状态变化待登录后验证**。

## 5. Workflow 关联

当前无法完成真实 Workflow 任务，因为：

- 没有生产用户会话；
- 没有可用的真实 Agent Task；
- 没有在本次测试中发起真实生成任务。

代码和数据库层面保留 `agentTaskId` 关联字段，实际 `pending → running → completed/failed` 需要登录后执行一次真实 Workflow 才能确认。

## 6. Edge Functions

| Function | Supabase 部署状态 | 未认证请求 | 结果 |
|---|---|---:|---|
| `ai` | ACTIVE，JWT 开启 | HTTP 401 | 通过，鉴权生效 |
| `admin` | ACTIVE，JWT 开启 | HTTP 401 | 通过，鉴权生效 |
| `platform` | 不存在 | HTTP 404 | 未通过 |
| `billing` | ACTIVE，JWT 开启 | HTTP 401 | 通过，鉴权生效 |

HTTP 401 在这里是预期结果，表示函数存在并拒绝未认证请求；不是函数故障。

## 未完成项与下一步

1. 建立或迁移 `content_metrics` 表，并配置 RLS/Data API 权限。
2. 使用真实生产账号完成一次 Google OAuth，确认 `auth.users` 和 `profiles` 同步创建。
3. 登录后创建一个 Agent Task，刷新页面确认持久化，再执行一次真实 Workflow，验证任务状态和 `agentTaskId`。
4. 明确 `platform` 是否应该存在；如果产品确实需要该函数，需要单独部署对应 Edge Function（本报告未修改代码）。

本次未修改业务代码、登录代码、数据库结构或 Edge Function。
