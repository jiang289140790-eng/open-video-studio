# Production Fix Report

日期：2026-07-19
项目：`open-video-studio`
Supabase 项目：`wyvswkxogkmywduhrhkw`

## 结论

本次只进行了生产缺失项核对和安全部署尝试，没有修改登录代码、业务逻辑或前端代码。

结果：`content_metrics` 相关迁移和 `platform` Edge Function 的源文件在当前仓库中均不存在，无法在不臆造业务结构的情况下安全补齐；Google OAuth 的仓库侧回调配置正确，但第三方控制台配置仍需人工确认。

## 1. 数据库迁移核对

已检查全部 `supabase/migrations` 和远程迁移记录：

- `content_metrics`：没有本地 migration，也没有远程表。
- `publish_metrics`：没有本地 migration，也没有远程表。
- `content_strategies`：没有本地 migration，也没有远程表。
- 远程 migration 状态与本地已存在 migration 一致，没有可执行的对应迁移。

因此本次没有创建猜测性的表结构，也没有向生产数据库写入未经确认的 schema。

## 2. platform Edge Function

检查结果：

- `supabase/functions/platform/` 不存在。
- 远程 Functions 列表包含 `ai`、`admin`、`billing`、`telegram-auth`，不包含 `platform`。
- 已按要求尝试部署 `platform`，Supabase 返回：`Entrypoint path does not exist ... supabase/functions/platform/index.ts`。
- 线上验证：`/functions/v1/platform` 返回 HTTP 404。

本次未创建占位函数，避免伪造平台业务接口或绕过 JWT 权限。需要先提供已确认的 `supabase/functions/platform/index.ts` 实现及其输入/输出契约，才能安全部署。

## 3. Google OAuth 配置核对

仓库侧已确认：

- Site URL：`https://jiang289140790-eng.github.io/open-video-studio/`
- 生产回调目标：`https://jiang289140790-eng.github.io/open-video-studio/signin.html`
- Google/Supabase 应使用的 Authorized redirect URI：
  `https://wyvswkxogkmywduhrhkw.supabase.co/auth/v1/callback`

本次没有读取或输出 Client Secret，也没有修改登录代码。Google Cloud Console 和 Supabase Dashboard 中的 Client ID/Secret、Authorized redirect URI 不能从仓库安全地确认，仍需在控制台人工核对。

## 4. 已验证的现状

- `ai`：ACTIVE，未认证请求 HTTP 401（JWT 生效）。
- `admin`：ACTIVE，未认证请求 HTTP 401（JWT 生效）。
- `billing`：ACTIVE，未认证请求 HTTP 401（JWT 生效）。
- `platform`：HTTP 404，源文件缺失。
- `profiles`、`agent_tasks`、`tools`、`workflows` 可读取。
- `content_metrics`、`publish_metrics`、`content_strategies` 不存在。

## 待补充内容

1. 提供三张指标表的既有 schema/migration（或明确字段契约），再执行 Supabase migration。
2. 提供经过确认的 `platform` Edge Function 源代码和调用契约，再部署并验证 JWT。
3. 在 Google Cloud Console 与 Supabase Auth Providers 页面人工确认 OAuth 回调地址和密钥配置。
