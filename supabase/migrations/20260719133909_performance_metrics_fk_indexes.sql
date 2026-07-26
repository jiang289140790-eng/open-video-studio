-- Cover the tool/workflow foreign keys used by content_metrics.
create index if not exists content_metrics_tool_fk_idx
  on public.content_metrics (tool_id);
create index if not exists content_metrics_workflow_fk_idx
  on public.content_metrics (workflow_id);
