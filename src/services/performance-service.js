import { supabase } from "../../apps/web/supabase-client.js";

const EMPTY_RESULT = { data: [], error: null, authenticated: false };

async function authenticatedClient() {
  if (!supabase) return EMPTY_RESULT;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user) return EMPTY_RESULT;
  return { data: supabase, error: null, authenticated: true };
}

async function readTable(table, orderColumn, limit) {
  const auth = await authenticatedClient();
  if (!auth.authenticated) return [];
  let query = auth.data.from(table).select("*").order(orderColumn, { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getContentMetrics(options = {}) {
  return readTable("content_metrics", "metric_date", options.limit || 500);
}

export async function getPublishMetrics(options = {}) {
  return readTable("publish_metrics", "published_at", options.limit || 500);
}

export async function getContentStrategies(options = {}) {
  return readTable("content_strategies", "updated_at", options.limit || 100);
}

function normalizeMetric(row, fallbackPlatform = "") {
  const clicks = Number(row.clicks || 0);
  const signups = Number(row.signups || 0);
  const revenue = Number(row.revenue_cents || 0) / 100;
  const cost = Number(row.spend_cents || 0) / 100;
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  return {
    id: String(row.id),
    contentItemId: String(row.content_ref || row.content_metric_id || row.id),
    platform: String(row.platform || fallbackPlatform || "未知渠道"),
    contentType: String(row.content_type || metadata.content_type || metadata.type || "未分类"),
    views: Number(row.views || row.impressions || 0),
    likes: Number(row.likes || 0),
    comments: Number(row.comments || 0),
    shares: Number(row.shares || 0),
    clicks,
    signups,
    revenue,
    cost,
    conversionRate: Number(row.conversion_rate || (clicks ? (signups / clicks) * 100 : 0)),
    roi: revenue - cost,
    metricDate: row.metric_date || row.published_at || row.created_at || ""
  };
}

export async function getPerformanceSummary(options = {}) {
  const [contentMetrics, publishMetrics, strategies] = await Promise.all([
    getContentMetrics(options),
    getPublishMetrics(options),
    getContentStrategies(options)
  ]);
  const contentRows = contentMetrics.map((row) => normalizeMetric(row));
  const contentById = new Map(contentMetrics.map((row) => [String(row.id), row]));
  const publishRows = publishMetrics.map((row) => {
    const parent = contentById.get(String(row.content_metric_id));
    return normalizeMetric({ ...parent, ...row, signups: row.signups ?? parent?.signups ?? 0 }, parent?.platform || "");
  });
  const rows = publishRows.length ? publishRows : contentRows;
  const totals = rows.reduce((summary, row) => {
    summary.views += row.views;
    summary.likes += row.likes;
    summary.comments += row.comments;
    summary.shares += row.shares;
    summary.clicks += row.clicks;
    summary.signups += row.signups;
    summary.revenue += row.revenue;
    summary.cost += row.cost;
    return summary;
  }, { views: 0, likes: 0, comments: 0, shares: 0, clicks: 0, signups: 0, revenue: 0, cost: 0 });
  const aggregate = (key) => Object.values(rows.reduce((groups, row) => {
    const groupKey = row[key] || "未分类";
    const group = groups[groupKey] || { name: groupKey, views: 0, clicks: 0, signups: 0, revenue: 0, cost: 0 };
    group.views += row.views;
    group.clicks += row.clicks;
    group.signups += row.signups;
    group.revenue += row.revenue;
    group.cost += row.cost;
    groups[groupKey] = group;
    return groups;
  }, {})).sort((a, b) => b.views - a.views);
  return {
    rows,
    contentMetrics,
    publishMetrics,
    strategies,
    totals,
    platformRanking: aggregate("platform"),
    contentTypeRanking: aggregate("contentType"),
    topContent: rows.slice().sort((a, b) => b.views - a.views)[0] || null,
    topRoiChannel: rows.slice().sort((a, b) => b.roi - a.roi)[0] || null
  };
}
