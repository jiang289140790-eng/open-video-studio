# Production Consistency Report

日期：2026-07-19
项目：`open-video-studio`
Supabase：`wyvswkxogkmywduhrhkw`

## 结论

已补齐 Performance 数据库表并部署到生产 Supabase。三张表均启用 RLS，已授予 `authenticated` 基础 CRUD 权限，并添加查询索引及外键覆盖索引。

没有创建 `platform` Edge Function，也没有修改登录、生成 API、Workflow 或 Automation。

## 1. Migration

新增并已部署：

- `supabase/migrations/20260719133047_performance_metrics.sql`
- `supabase/migrations/20260719133909_performance_metrics_fk_indexes.sql`

远程 migration 状态已与本地一致：

- `20260719133047`：已部署
- `20260719133909`：已部署

## 2. 生产表结构

已存在并可读取：

- `content_metrics`
- `publish_metrics`
- `content_strategies`

核心字段覆盖：

- 内容/发布归属：`user_id`、`content_ref`、`content_metric_id`、`platform`
- 内容表现：`impressions`、`views`、`likes`、`comments`、`shares`、`clicks`、`signups`、`conversions`
- 商业指标：`spend_cents`、`revenue_cents`
- 策略配置：`strategy_type`、`status`、`priority`、`config`、`target_metrics`

## 3. RLS、权限与索引

三张表均已确认：

- RLS：启用
- `authenticated`：已授予 SELECT / INSERT / UPDATE / DELETE
- 行级策略：只允许用户访问自己的 `user_id` 数据
- UPDATE：同时具备 `USING` 和 `WITH CHECK`
- 索引：用户+日期、用户+平台、内容关联、策略状态
- 外键覆盖索引：`tool_id`、`workflow_id`

## 4. Performance Service 与 Dashboard 检查

检查结果：

- 当前仓库没有独立的 `Performance Service` 文件或 Supabase 查询服务。
- `apps/web/analytics.html` 的 Performance 页面存在，但 `apps/web/app.js` 仍从本地 `contentAnalytics` 状态和演示数据渲染。
- 因此数据库结构已经补齐，但 Dashboard 当前尚未切换为读取上述三张 Supabase 表。
- 本次没有修改 Dashboard，避免超出“生产一致性修复”的范围。

状态：**数据库已一致；前端 Performance 数据源仍是本地演示状态。**

## 5. 验证结果

- `supabase db push --linked --yes`：成功
- `supabase migration list --linked`：本地/远程一致
- 三张表存在：通过
- RLS 与策略：通过
- 索引与外键覆盖索引：通过
- `npm run typecheck`：通过
- `platform` Edge Function：未创建，符合本次要求

## 未完成项

如果要让 Performance Dashboard 显示真实生产指标，下一步需要单独实现 Performance Service 查询层，将 `content_metrics` / `publish_metrics` / `content_strategies` 接入 `analytics.html`；本次未执行该项。
