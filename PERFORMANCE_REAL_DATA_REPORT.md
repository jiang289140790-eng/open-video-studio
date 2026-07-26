# Performance 真实数据切换报告

## 修改文件

- `src/services/performance-service.js`：新增统一 Performance Service。
- `apps/web/app.js`：Growth Dashboard 与内容分析改为使用 Performance Service 返回的数据；未登录或无 Supabase 会话时不再渲染本地演示指标。
- `supabase/migrations/20260719133047_performance_metrics.sql`：建立 `content_metrics`、`publish_metrics`、`content_strategies`，启用 RLS、authenticated 权限和自有数据策略。
- `supabase/migrations/20260719133909_performance_metrics_fk_indexes.sql`：补齐外键索引。

## 数据流

1. 页面通过现有 Supabase 客户端获取 Auth session。
2. 只有存在当前登录用户 session 时，Service 才读取三张表；查询使用前端 anon 客户端，未使用 `service_role`。
3. `getPerformanceSummary()` 并行读取：
   - `content_metrics`：内容曝光、互动、点击、注册、收入、成本。
   - `publish_metrics`：平台发布表现；有发布数据时优先用于平台汇总。
   - `content_strategies`：AI 优化策略。
4. Dashboard 使用汇总结果展示点击、注册、转化、最高表现内容、最高 ROI 渠道、收入和成本；内容分析列表使用真实行数据。
5. RLS 由数据库限制为当前用户自己的记录，未绕过策略。

## 生产验证

- Supabase migrations 已推送并与远端一致。
- 远端表计数查询成功：当前 `content_metrics`、`publish_metrics`、`content_strategies` 均为 0 行；因此无登录用户数据时页面显示空状态是预期行为，不再显示演示数据。
- `npm run typecheck`：通过。
- `npm run build`：通过，产物包含 `dist-web/growth-dashboard.html`、`dist-web/analytics.html` 及包含 Performance Service 查询的前端 bundle。
- `git diff --check`：通过。

## 说明

首次产生或导入指标后，登录对应用户即可在 Growth Dashboard 和内容分析页面看到真实数据。Service 会优先读取 `content_type`，也会从 `metadata.content_type` / `metadata.type` 推导内容类型；没有类型的记录归入“未分类”。本次未改动生成、Workflow、Automation、Agent 和登录逻辑。
