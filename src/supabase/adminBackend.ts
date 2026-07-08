import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../shared/errors.js";
import { createId } from "../shared/id.js";
import { nowIso } from "../shared/time.js";

export type AdminRole = "admin" | "operator";

export interface AdminActor {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

export interface AdminDashboardSummary {
  users: number;
  assets: number;
  pendingAssets: number;
  generationJobs: number;
  failedJobs: number;
  orders: number;
  creditsConsumed: number;
  activeShares: number;
  todayNewUsers: number;
  todayPaidUsers: number;
  todayRevenueCents: number;
  todayImages: number;
  todayVideos: number;
  todayFailedJobs: number;
  weeklyRevenueTrend: Array<{ date: string; revenueCents: number }>;
  popularTools: Array<{ toolSlug: string; jobs: number }>;
  highFailureTools: Array<{ toolSlug: string; failedJobs: number; totalJobs: number; failureRate: number }>;
  creditConsumptionRank: Array<{ toolSlug: string; credits: number }>;
}

export interface AdminWorkerStatus {
  worker_id: string;
  provider: string;
  workflow: string;
  type: "image" | "video" | "multimodal" | "text";
  status: "idle" | "running" | "failed" | "offline";
  queue_count: number;
  average_latency: number;
  success_rate: number;
  cost_per_job: number;
  last_heartbeat: string;
  recent_failure_reason: string;
}

export interface HomepageConfig {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  galleryTitle: string;
  trustSignals: string[];
  showcaseCards: HomepageCard[];
  creationCards: HomepageCard[];
}

export interface HomepageCard {
  label: string;
  title: string;
  style: string;
  size?: string;
  outputPreview?: boolean;
}

export interface PageBuilderConfig {
  pages: PageBuilderPage[];
}

export interface PageBuilderPage {
  slug: string;
  name: string;
  status: string;
  modules: PageBuilderModule[];
}

export interface PageBuilderModule {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  displayStyle: string;
  cardCount: number;
  source: string;
}

export interface ToolCatalogConfig {
  tools: ToolCatalogItem[];
}

export interface ToolCatalogItem {
  slug: string;
  name: string;
  category: string;
  status: string;
  provider: string;
  model: string;
  workflowId: string;
  creditCost: number;
  route: string;
  featured: boolean;
  versions: ToolVersion[];
}

export interface ToolVersion {
  version: string;
  changelog: string;
  modelVersion: string;
  workflowVersion: string;
  promptVersion: string;
  status: string;
}

export interface WorkflowCenterConfig {
  workflows: WorkflowCenterItem[];
}

export interface WorkflowCenterItem {
  workflowId: string;
  name: string;
  type: string;
  provider: string;
  jsonConfig: Record<string, unknown>;
  requiredModels: string[];
  requiredInputs: string[];
  outputType: string;
  creditPrice: number;
  version: string;
  status: string;
  description: string;
}

export interface PromptLibraryConfig {
  prompts: PromptLibraryItem[];
}

export interface PromptLibraryItem {
  promptId: string;
  title: string;
  category: string;
  useCase: string;
  promptText: string;
  negativePrompt: string;
  variables: string[];
  model: string;
  version: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentIntelligenceConfig {
  records: ContentIntelligenceRecord[];
}

export interface ContentIntelligenceRecord {
  sourcePlatform: string;
  sourceUrl: string;
  accountName: string;
  postText: string;
  mediaUrls: string[];
  analysisJson: Record<string, unknown>;
  hook: string;
  topic: string;
  targetAudience: string;
  contentAngle: string;
  reusableStrategy: string;
  generatedPostVariants: string[];
  status: string;
}

export interface AgentCenterConfig {
  agents: AgentCenterItem[];
}

export interface AgentCenterItem {
  agentId: string;
  name: string;
  role: string;
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  toolsEnabled: string[];
  status: string;
}

export class SupabaseAdminBackend {
  constructor(private readonly client: SupabaseClient) {}

  async getActor(userId: string): Promise<AdminActor> {
    const result = await this.client
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (result.error || !result.data) {
      throw new AppError("ADMIN_PROFILE_NOT_FOUND", result.error?.message ?? "Admin profile not found.", 404);
    }
    const profile = result.data as Record<string, any>;
    if (profile.role !== "admin" && profile.role !== "operator") {
      throw new AppError("ADMIN_FORBIDDEN", "Admin access is required.", 403);
    }
    return {
      id: String(profile.id),
      email: String(profile.email ?? ""),
      displayName: String(profile.display_name ?? profile.email ?? "Admin"),
      role: profile.role,
    };
  }

  async dashboardSummary(actor: AdminActor): Promise<AdminDashboardSummary> {
    await this.requireOperator(actor);
    const [profiles, assets, jobs, orders, credits, shares] = await Promise.all([
      this.selectAll("profiles"),
      this.selectAll("media_assets"),
      this.selectAll("generation_jobs"),
      this.selectAll("orders"),
      this.selectAll("credit_transactions"),
      this.selectAll("share_links"),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const paidOrders = orders.filter((order) => ["fulfilled", "paid", "completed"].includes(String(order.status ?? "")));
    return {
      users: profiles.length,
      assets: assets.filter((asset) => !asset.deleted_at).length,
      pendingAssets: assets.filter((asset) => !asset.deleted_at && asset.moderation_status !== "approved").length,
      generationJobs: jobs.length,
      failedJobs: jobs.filter((job) => job.status === "failed").length,
      orders: orders.length,
      creditsConsumed: credits
        .filter((row) => Number(row.balance_impact ?? 0) < 0)
        .reduce((sum, row) => sum + Math.abs(Number(row.balance_impact ?? 0)), 0),
      activeShares: shares.filter((share) => share.visibility_status === "active" && !share.revoked_at).length,
      todayNewUsers: profiles.filter((profile) => this.isSameDay(profile.created_at, today)).length,
      todayPaidUsers: new Set(paidOrders.filter((order) => this.isSameDay(order.created_at, today)).map((order) => order.user_id)).size,
      todayRevenueCents: paidOrders
        .filter((order) => this.isSameDay(order.created_at, today))
        .reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0),
      todayImages: jobs.filter((job) => this.isSameDay(job.created_at, today) && job.media_type === "image").length,
      todayVideos: jobs.filter((job) => this.isSameDay(job.created_at, today) && job.media_type === "video").length,
      todayFailedJobs: jobs.filter((job) => this.isSameDay(job.created_at, today) && job.status === "failed").length,
      weeklyRevenueTrend: this.weeklyRevenueTrend(paidOrders),
      popularTools: this.rankPopularTools(jobs),
      highFailureTools: this.rankFailureByTool(jobs),
      creditConsumptionRank: this.rankCreditConsumption(jobs),
    };
  }

  async listUsers(actor: AdminActor): Promise<Array<Record<string, unknown>>> {
    await this.requireOperator(actor);
    const [profiles, credits] = await Promise.all([
      this.selectAll("profiles"),
      this.selectAll("credit_transactions"),
    ]);
    return profiles.map((profile) => ({
      ...profile,
      credit_balance: credits
        .filter((credit) => credit.user_id === profile.id && credit.status === "posted")
        .reduce((sum, credit) => sum + Number(credit.balance_impact ?? 0), 0),
    }));
  }

  async adjustCredits(actor: AdminActor, input: {
    userId: string;
    amount: number;
    reason: string;
  }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    if (!Number.isInteger(input.amount) || input.amount === 0) {
      throw new AppError("ADMIN_CREDIT_AMOUNT_INVALID", "Credit adjustment amount must be a non-zero integer.");
    }
    const timestamp = nowIso();
    const transaction = {
      id: createId("credit"),
      account_id: input.userId,
      user_id: input.userId,
      source_type: "admin_adjustment",
      source_id: actor.id,
      amount: Math.abs(input.amount),
      balance_impact: input.amount,
      operation_category: input.amount > 0 ? "admin_grant" : "admin_deduct",
      status: "posted",
      reason: input.reason.trim(),
      created_at: timestamp,
    };
    const result = await this.client.from("credit_transactions").insert(transaction).select("*").single();
    if (result.error) {
      throw new AppError("ADMIN_CREDIT_ADJUST_FAILED", result.error.message, 502);
    }
    await this.audit(actor, "admin.adjust_credits", "profile", input.userId, "success", {
      amount: input.amount,
      reason: input.reason.trim(),
      creditTransactionId: transaction.id,
    });
    return result.data as Record<string, unknown>;
  }

  async listOrders(actor: AdminActor): Promise<Array<Record<string, unknown>>> {
    await this.requireOperator(actor);
    return this.selectAll("orders", "created_at", false);
  }

  async updateOrderStatus(actor: AdminActor, input: {
    orderId: string;
    status: string;
    reason: string;
  }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const allowed = new Set(["pending", "fulfilled", "failed", "refunding", "refunded"]);
    if (!allowed.has(input.status)) {
      throw new AppError("ADMIN_ORDER_STATUS_INVALID", "Unsupported order status.");
    }
    const timestamp = nowIso();
    const result = await this.client
      .from("orders")
      .update({
        status: input.status,
        updated_at: timestamp,
        completed_at: input.status === "fulfilled" ? timestamp : null,
      })
      .eq("id", input.orderId)
      .select("*")
      .single();
    if (result.error) {
      throw new AppError("ADMIN_ORDER_UPDATE_FAILED", result.error.message, 502);
    }
    await this.audit(actor, "admin.update_order_status", "order", input.orderId, "success", {
      status: input.status,
      reason: input.reason.trim(),
    });
    return result.data as Record<string, unknown>;
  }

  async listAssets(actor: AdminActor): Promise<Array<Record<string, unknown>>> {
    await this.requireOperator(actor);
    return this.selectAll("media_assets", "updated_at", false);
  }

  async reviewAsset(actor: AdminActor, input: {
    assetId: string;
    moderationStatus: string;
    visibilityStatus?: string;
    reason: string;
  }): Promise<Record<string, unknown>> {
    await this.requireOperator(actor);
    this.requireReason(input.reason);
    const moderation = new Set(["approved", "pending", "rejected", "archived"]);
    if (!moderation.has(input.moderationStatus)) {
      throw new AppError("ADMIN_ASSET_REVIEW_INVALID", "Unsupported moderation status.");
    }
    if (actor.role !== "admin" && input.moderationStatus === "archived") {
      throw new AppError("ADMIN_FORBIDDEN", "Only admins can archive assets.", 403);
    }
    const update: Record<string, unknown> = {
      moderation_status: input.moderationStatus,
      updated_at: nowIso(),
    };
    if (input.visibilityStatus) {
      update.visibility_status = input.visibilityStatus;
    }
    if (input.moderationStatus === "archived") {
      update.archived_at = nowIso();
    }
    const result = await this.client
      .from("media_assets")
      .update(update)
      .eq("id", input.assetId)
      .select("*")
      .single();
    if (result.error) {
      throw new AppError("ADMIN_ASSET_REVIEW_FAILED", result.error.message, 502);
    }
    await this.audit(actor, "admin.review_asset", "media_asset", input.assetId, "success", {
      moderationStatus: input.moderationStatus,
      visibilityStatus: input.visibilityStatus,
      reason: input.reason.trim(),
    });
    return result.data as Record<string, unknown>;
  }

  async listGenerationJobs(actor: AdminActor): Promise<Array<Record<string, unknown>>> {
    await this.requireOperator(actor);
    const jobs = await this.selectAll("generation_jobs", "created_at", false);
    return jobs.map((job) => this.normalizeGenerationJob(job));
  }

  async listWorkers(actor: AdminActor): Promise<AdminWorkerStatus[]> {
    await this.requireOperator(actor);
    const jobs = await this.selectAll("generation_jobs", "created_at", false);
    return this.deriveWorkerStatuses(jobs);
  }

  async listShareLinks(actor: AdminActor): Promise<Array<Record<string, unknown>>> {
    await this.requireOperator(actor);
    return this.selectAll("share_links", "created_at", false);
  }

  async getHomepageConfig(actor: AdminActor): Promise<Record<string, unknown>> {
    await this.requireOperator(actor);
    const result = await this.client
      .from("site_settings")
      .select("*")
      .eq("setting_key", "homepage_config")
      .single();
    if (result.error || !result.data) {
      return {
        setting_key: "homepage_config",
        value_json: this.defaultHomepageConfig(),
        status: "default",
      };
    }
    return result.data as Record<string, unknown>;
  }

  async updateHomepageConfig(actor: AdminActor, input: { config: Partial<HomepageConfig>; reason: string }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const record = {
      setting_key: "homepage_config",
      value_json: this.normalizeHomepageConfig(input.config),
      status: "published",
      updated_by: actor.id,
      updated_at: nowIso(),
    };
    const result = await this.client
      .from("site_settings")
      .upsert(record, { onConflict: "setting_key" })
      .select("*")
      .single();
    if (result.error) {
      throw new AppError("ADMIN_HOMEPAGE_UPDATE_FAILED", result.error.message, 502);
    }
    await this.audit(actor, "admin.update_homepage_config", "site_setting", "homepage_config", "success", {
      reason: input.reason.trim(),
    });
    return result.data as Record<string, unknown>;
  }

  async getPageBuilderConfig(actor: AdminActor): Promise<Record<string, unknown>> {
    await this.requireOperator(actor);
    return this.getSetting("page_builder_config", this.defaultPageBuilderConfig());
  }

  async updatePageBuilderConfig(actor: AdminActor, input: { config: Partial<PageBuilderConfig>; reason: string }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const record = await this.upsertSetting("page_builder_config", this.normalizePageBuilderConfig(input.config), actor.id);
    await this.audit(actor, "admin.update_page_builder_config", "site_setting", "page_builder_config", "success", {
      reason: input.reason.trim(),
    });
    return record;
  }

  async getToolCatalogConfig(actor: AdminActor): Promise<Record<string, unknown>> {
    await this.requireOperator(actor);
    return this.getSetting("tool_catalog_config", this.defaultToolCatalogConfig());
  }

  async getWorkflowCenterConfig(actor: AdminActor): Promise<Record<string, unknown>> {
    await this.requireOperator(actor);
    return this.getSetting("workflow_center_config", this.defaultWorkflowCenterConfig());
  }

  async updateWorkflowCenterConfig(actor: AdminActor, input: { config: Partial<WorkflowCenterConfig>; reason: string }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const record = await this.upsertSetting("workflow_center_config", this.normalizeWorkflowCenterConfig(input.config), actor.id);
    await this.audit(actor, "admin.update_workflow_center_config", "site_setting", "workflow_center_config", "success", {
      reason: input.reason.trim(),
    });
    return record;
  }

  async getPromptLibraryConfig(actor: AdminActor): Promise<Record<string, unknown>> {
    await this.requireOperator(actor);
    return this.getSetting("prompt_library_config", this.defaultPromptLibraryConfig());
  }

  async updatePromptLibraryConfig(actor: AdminActor, input: { config: Partial<PromptLibraryConfig>; reason: string }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const record = await this.upsertSetting("prompt_library_config", this.normalizePromptLibraryConfig(input.config), actor.id);
    await this.audit(actor, "admin.update_prompt_library_config", "site_setting", "prompt_library_config", "success", {
      reason: input.reason.trim(),
    });
    return record;
  }

  async getContentIntelligenceConfig(actor: AdminActor): Promise<Record<string, unknown>> {
    await this.requireOperator(actor);
    return this.getSetting("content_intelligence_config", this.defaultContentIntelligenceConfig());
  }

  async updateContentIntelligenceConfig(actor: AdminActor, input: { config: Partial<ContentIntelligenceConfig>; reason: string }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const record = await this.upsertSetting("content_intelligence_config", this.normalizeContentIntelligenceConfig(input.config), actor.id);
    await this.audit(actor, "admin.update_content_intelligence_config", "site_setting", "content_intelligence_config", "success", {
      reason: input.reason.trim(),
    });
    return record;
  }

  async getAgentCenterConfig(actor: AdminActor): Promise<Record<string, unknown>> {
    await this.requireOperator(actor);
    return this.getSetting("agent_center_config", this.defaultAgentCenterConfig());
  }

  async updateAgentCenterConfig(actor: AdminActor, input: { config: Partial<AgentCenterConfig>; reason: string }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const record = await this.upsertSetting("agent_center_config", this.normalizeAgentCenterConfig(input.config), actor.id);
    await this.audit(actor, "admin.update_agent_center_config", "site_setting", "agent_center_config", "success", {
      reason: input.reason.trim(),
    });
    return record;
  }

  async listCostAnalytics(actor: AdminActor): Promise<Array<Record<string, unknown>>> {
    await this.requireOperator(actor);
    const jobs = await this.selectAll("generation_jobs", "created_at", false);
    return this.deriveCostAnalytics(jobs);
  }

  async updateToolCatalogConfig(actor: AdminActor, input: { config: Partial<ToolCatalogConfig>; reason: string }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const record = await this.upsertSetting("tool_catalog_config", this.normalizeToolCatalogConfig(input.config), actor.id);
    await this.audit(actor, "admin.update_tool_catalog_config", "site_setting", "tool_catalog_config", "success", {
      reason: input.reason.trim(),
    });
    return record;
  }

  async revokeShareLink(actor: AdminActor, input: { shareId: string; reason: string }): Promise<Record<string, unknown>> {
    this.requireAdmin(actor);
    this.requireReason(input.reason);
    const result = await this.client
      .from("share_links")
      .update({ visibility_status: "revoked", revoked_at: nowIso() })
      .eq("id", input.shareId)
      .select("*")
      .single();
    if (result.error) {
      throw new AppError("ADMIN_SHARE_REVOKE_FAILED", result.error.message, 502);
    }
    await this.audit(actor, "admin.revoke_share_link", "share_link", input.shareId, "success", {
      reason: input.reason.trim(),
    });
    return result.data as Record<string, unknown>;
  }

  async listAuditLogs(actor: AdminActor): Promise<Array<Record<string, unknown>>> {
    this.requireAdmin(actor);
    return this.selectAll("audit_logs", "created_at", false);
  }

  private async selectAll(table: string, orderColumn?: string, ascending = true): Promise<Array<Record<string, any>>> {
    let query = this.client.from(table).select("*");
    if (orderColumn) {
      query = query.order(orderColumn, { ascending }) as typeof query;
    }
    const result = await query;
    if (result.error) {
      throw new AppError("ADMIN_TABLE_READ_FAILED", result.error.message, 502);
    }
    return (result.data ?? []) as Array<Record<string, any>>;
  }

  private async getSetting(settingKey: string, fallback: unknown): Promise<Record<string, unknown>> {
    const result = await this.client
      .from("site_settings")
      .select("*")
      .eq("setting_key", settingKey)
      .single();
    if (result.error || !result.data) {
      return {
        setting_key: settingKey,
        value_json: fallback,
        status: "default",
      };
    }
    return result.data as Record<string, unknown>;
  }

  private async upsertSetting(settingKey: string, valueJson: unknown, actorId: string): Promise<Record<string, unknown>> {
    const result = await this.client
      .from("site_settings")
      .upsert({
        setting_key: settingKey,
        value_json: valueJson,
        status: "published",
        updated_by: actorId,
        updated_at: nowIso(),
      }, { onConflict: "setting_key" })
      .select("*")
      .single();
    if (result.error) {
      throw new AppError("ADMIN_SETTING_UPDATE_FAILED", result.error.message, 502);
    }
    return result.data as Record<string, unknown>;
  }

  private async audit(
    actor: AdminActor,
    action: string,
    targetType: string,
    targetId: string,
    outcome: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const result = await this.client.from("audit_logs").insert({
      id: createId("audit"),
      actor_type: "admin",
      actor_id: actor.id,
      action,
      target_type: targetType,
      target_id: targetId,
      outcome,
      risk_classification: "high",
      metadata_json: metadata,
      created_at: nowIso(),
    });
    if (result.error) {
      throw new AppError("ADMIN_AUDIT_WRITE_FAILED", result.error.message, 502);
    }
  }

  private async requireOperator(actor: AdminActor): Promise<void> {
    if (actor.role !== "admin" && actor.role !== "operator") {
      throw new AppError("ADMIN_FORBIDDEN", "Operator access is required.", 403);
    }
  }

  private requireAdmin(actor: AdminActor): void {
    if (actor.role !== "admin") {
      throw new AppError("ADMIN_FORBIDDEN", "Admin access is required.", 403);
    }
  }

  private requireReason(reason: string): void {
    if (!reason?.trim()) {
      throw new AppError("ADMIN_REASON_REQUIRED", "Admin action reason is required.");
    }
  }

  private normalizeHomepageConfig(config: Partial<HomepageConfig>): HomepageConfig {
    const fallback = this.defaultHomepageConfig();
    return {
      ...fallback,
      ...config,
      primaryCtaHref: this.safeHref(config.primaryCtaHref, fallback.primaryCtaHref),
      secondaryCtaHref: this.safeHref(config.secondaryCtaHref, fallback.secondaryCtaHref),
      trustSignals: this.safeTextList(config.trustSignals, fallback.trustSignals, 6),
      showcaseCards: this.safeCards(config.showcaseCards, fallback.showcaseCards, 8),
      creationCards: this.safeCards(config.creationCards, fallback.creationCards, 12),
    };
  }

  private defaultHomepageConfig(): HomepageConfig {
    return {
      eyebrow: "可复用角色的 AI 创作平台",
      headline: "用一致性角色创建 AI 视频",
      subheadline: "在一个创作空间里生成角色、场景、提示词、图片和视频，并持续复用。",
      primaryCtaLabel: "免费开始生成",
      primaryCtaHref: "./zh/app/generate/",
      secondaryCtaLabel: "探索作品",
      secondaryCtaHref: "./zh/gallery/",
      galleryTitle: "看看你可以创建什么",
      trustSignals: ["无需设计经验", "角色可复用", "提示词到视频", "积分制生成"],
      showcaseCards: [
        { label: "视频", title: "生成营销短片", style: "art-1", size: "tall", outputPreview: true },
        { label: "角色", title: "工作室主持人", style: "art-2" },
      ],
      creationCards: [
        { label: "AI 角色", title: "带记忆的可复用主持人", style: "art-2" },
        { label: "产品视频", title: "适合发布的动态概念", style: "art-1" },
      ],
    };
  }

  private safeHref(value: string | undefined, fallback: string): string {
    if (!value) return fallback;
    return value.startsWith("./") || value.startsWith("/") || value.startsWith("#") ? value : fallback;
  }

  private safeTextList(value: string[] | undefined, fallback: string[], max: number): string[] {
    return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, max) : fallback;
  }

  private safeCards(cards: HomepageCard[] | undefined, fallback: HomepageCard[], max: number): HomepageCard[] {
    return Array.isArray(cards) && cards.length
      ? cards.filter((card) => card.label && card.title).slice(0, max)
      : fallback;
  }

  private normalizePageBuilderConfig(config: Partial<PageBuilderConfig>): PageBuilderConfig {
    const fallback = this.defaultPageBuilderConfig();
    const pages = Array.isArray(config.pages) ? config.pages : fallback.pages;
    return {
      pages: pages
        .filter((page) => page.slug && page.name)
        .slice(0, 12)
        .map((page) => ({
          slug: String(page.slug).trim().slice(0, 48),
          name: String(page.name).trim().slice(0, 80),
          status: ["published", "draft", "hidden"].includes(page.status) ? page.status : "published",
          modules: this.safePageModules(page.modules, fallback.pages[0]?.modules ?? []),
        })),
    };
  }

  private safePageModules(modules: PageBuilderModule[] | undefined, fallback: PageBuilderModule[]): PageBuilderModule[] {
    const source = Array.isArray(modules) && modules.length ? modules : fallback;
    return source
      .filter((module) => module.id && module.type)
      .slice(0, 16)
      .map((module) => ({
        id: String(module.id).trim().slice(0, 48),
        type: String(module.type).trim().slice(0, 40),
        title: String(module.title ?? "").trim().slice(0, 80),
        enabled: module.enabled !== false,
        displayStyle: ["masonry", "carousel", "grid", "hero", "list"].includes(module.displayStyle) ? module.displayStyle : "grid",
        cardCount: Math.max(1, Math.min(24, Number(module.cardCount || 6))),
        source: String(module.source ?? "manual").trim().slice(0, 80),
      }));
  }

  private defaultPageBuilderConfig(): PageBuilderConfig {
    return {
      pages: [
        {
          slug: "home",
          name: "首页",
          status: "published",
          modules: [
            { id: "hero", type: "hero", title: "首屏视觉", enabled: true, displayStyle: "hero", cardCount: 4, source: "homepage_config.showcaseCards" },
            { id: "explore", type: "gallery", title: "探索你能创作什么", enabled: true, displayStyle: "masonry", cardCount: 8, source: "featured_assets" },
            { id: "characters", type: "characters", title: "角色示例", enabled: true, displayStyle: "carousel", cardCount: 6, source: "character_templates" },
          ],
        },
        {
          slug: "app",
          name: "工具首页",
          status: "published",
          modules: [
            { id: "featured-tools", type: "tools", title: "推荐工具", enabled: true, displayStyle: "grid", cardCount: 8, source: "tool_catalog_config.tools" },
            { id: "image-tools", type: "tools", title: "图像工具", enabled: true, displayStyle: "carousel", cardCount: 12, source: "category:image" },
            { id: "video-tools", type: "tools", title: "视频工具", enabled: true, displayStyle: "carousel", cardCount: 8, source: "category:video" },
          ],
        },
      ],
    };
  }

  private normalizeToolCatalogConfig(config: Partial<ToolCatalogConfig>): ToolCatalogConfig {
    const fallback = this.defaultToolCatalogConfig();
    const tools = Array.isArray(config.tools) ? config.tools : fallback.tools;
    return {
      tools: tools
        .filter((tool) => tool.slug && tool.name)
        .slice(0, 80)
        .map((tool) => ({
          slug: String(tool.slug).trim().slice(0, 64),
          name: String(tool.name).trim().slice(0, 80),
          category: ["image", "video", "character", "asset", "prompt"].includes(tool.category) ? tool.category : "image",
          status: ["published", "draft", "hidden"].includes(tool.status) ? tool.status : "published",
          provider: String(tool.provider || "fake_worker").trim().slice(0, 40),
          model: String(tool.model || "local-demo").trim().slice(0, 80),
          workflowId: String((tool as any).workflowId || (tool as any).workflow_id || "workflow-v1").trim().slice(0, 80),
          creditCost: Math.max(0, Math.min(999, Number(tool.creditCost || 0))),
          route: this.safeHref(tool.route, "./zh/app/generate/"),
          featured: Boolean(tool.featured),
          versions: this.safeToolVersions(tool.versions, [{
            version: "v1",
            changelog: "Initial published configuration",
            modelVersion: String(tool.model || "local-demo"),
            workflowVersion: "workflow-v1",
            promptVersion: "prompt-v1",
            status: "published",
          }]),
        })),
    };
  }

  private defaultToolCatalogConfig(): ToolCatalogConfig {
    return {
      tools: [
        { slug: "image-editor", name: "图片编辑器", category: "image", status: "published", provider: "fake_worker", model: "local-image-edit-v0", workflowId: "workflow-image-edit-v1", creditCost: 8, route: "./zh/app/image-editor/", featured: true, versions: [{ version: "v1", changelog: "MVP image edit workflow", modelVersion: "local-image-edit-v0", workflowVersion: "workflow-image-edit-v1", promptVersion: "prompt-image-edit-v1", status: "published" }] },
        { slug: "outfit-studio", name: "AI 换装", category: "image", status: "published", provider: "fake_worker", model: "local-outfit-v0", workflowId: "workflow-outfit-v1", creditCost: 12, route: "./zh/app/outfit-studio/", featured: true, versions: [{ version: "v1", changelog: "MVP outfit workflow", modelVersion: "local-outfit-v0", workflowVersion: "workflow-outfit-v1", promptVersion: "prompt-outfit-v1", status: "published" }] },
        { slug: "image-to-video", name: "图片转视频", category: "video", status: "published", provider: "fake_worker", model: "local-video-v0", workflowId: "workflow-video-v1", creditCost: 24, route: "./zh/app/image-to-video/", featured: true, versions: [{ version: "v1", changelog: "MVP image to video workflow", modelVersion: "local-video-v0", workflowVersion: "workflow-video-v1", promptVersion: "prompt-video-v1", status: "published" }] },
        { slug: "vision-analyze", name: "图片识别分析", category: "asset", status: "draft", provider: "qwen_vision", model: "Qwen/Qwen2.5-VL-7B-Instruct", workflowId: "workflow-qwen-vision-v1", creditCost: 2, route: "./zh/app/image-editor/", featured: false, versions: [{ version: "v1", changelog: "Qwen multimodal image analysis workflow", modelVersion: "Qwen/Qwen2.5-VL-7B-Instruct", workflowVersion: "workflow-qwen-vision-v1", promptVersion: "prompt-qwen-vision-v1", status: "testing" }] },
        { slug: "prompt-enhancer", name: "提示词增强", category: "prompt", status: "draft", provider: "deepseek_text", model: "deepseek-chat", workflowId: "workflow-deepseek-prompt-v1", creditCost: 1, route: "./zh/app/generate/", featured: false, versions: [{ version: "v1", changelog: "DeepSeek prompt enhancement workflow", modelVersion: "deepseek-chat", workflowVersion: "workflow-deepseek-prompt-v1", promptVersion: "prompt-enhance-v1", status: "testing" }] },
        { slug: "qianwen-image", name: "千问图片生成", category: "image", status: "draft", provider: "qianwen_generation", model: "qianwen-image-v1", workflowId: "workflow-qianwen-image-v1", creditCost: 8, route: "./zh/app/generate/", featured: false, versions: [{ version: "v1", changelog: "Qianwen image generation workflow", modelVersion: "qianwen-image-v1", workflowVersion: "workflow-qianwen-image-v1", promptVersion: "prompt-image-launch-v1", status: "testing" }] },
        { slug: "qianwen-video", name: "千问视频生成", category: "video", status: "draft", provider: "qianwen_generation", model: "qianwen-video-v1", workflowId: "workflow-qianwen-video-v1", creditCost: 24, route: "./zh/app/image-to-video/", featured: false, versions: [{ version: "v1", changelog: "Qianwen video generation workflow", modelVersion: "qianwen-video-v1", workflowVersion: "workflow-qianwen-video-v1", promptVersion: "prompt-video-short-v1", status: "testing" }] },
      ],
    };
  }

  private normalizeWorkflowCenterConfig(config: Partial<WorkflowCenterConfig>): WorkflowCenterConfig {
    const fallback = this.defaultWorkflowCenterConfig();
    const workflows = Array.isArray(config.workflows) ? config.workflows : fallback.workflows;
    return {
      workflows: workflows
        .filter((workflow) => workflow.workflowId && workflow.name)
        .slice(0, 80)
        .map((workflow) => ({
          workflowId: String(workflow.workflowId).trim().slice(0, 80),
          name: String(workflow.name).trim().slice(0, 100),
          type: ["comfyui", "n8n", "api_chain", "agent_chain"].includes(workflow.type) ? workflow.type : "api_chain",
          provider: String(workflow.provider || "fake_worker").trim().slice(0, 60),
          jsonConfig: typeof workflow.jsonConfig === "object" && workflow.jsonConfig ? workflow.jsonConfig : {},
          requiredModels: this.safeTextList(workflow.requiredModels, [], 12),
          requiredInputs: this.safeTextList(workflow.requiredInputs, [], 12),
          outputType: ["image", "video", "text", "multimodal", "asset"].includes(workflow.outputType) ? workflow.outputType : "asset",
          creditPrice: Math.max(0, Math.min(9999, Number(workflow.creditPrice || 0))),
          version: String(workflow.version || "v1").trim().slice(0, 24),
          status: ["draft", "testing", "published", "deprecated"].includes(workflow.status) ? workflow.status : "draft",
          description: String(workflow.description || "").trim().slice(0, 240),
        })),
    };
  }

  private defaultWorkflowCenterConfig(): WorkflowCenterConfig {
    return {
      workflows: [
        { workflowId: "workflow-image-edit-v1", name: "图片编辑工作流", type: "api_chain", provider: "fake_worker", jsonConfig: { mode: "image_edit" }, requiredModels: ["local-image-edit-v0"], requiredInputs: ["prompt", "reference_image"], outputType: "image", creditPrice: 8, version: "v1", status: "published", description: "MVP 图片编辑占位工作流，可替换为 ComfyUI / Fal / RunPod。" },
        { workflowId: "workflow-video-v1", name: "图片转视频工作流", type: "api_chain", provider: "fake_worker", jsonConfig: { mode: "image_to_video" }, requiredModels: ["local-video-v0"], requiredInputs: ["prompt", "source_asset"], outputType: "video", creditPrice: 24, version: "v1", status: "testing", description: "MVP 视频生成占位工作流，后续绑定真实视频 provider。" },
        { workflowId: "workflow-qwen-vision-v1", name: "Qwen 图片识别工作流", type: "api_chain", provider: "qwen_vision", jsonConfig: { action: "analyze-image", accepts: ["image_url", "image_base64", "storage_key"] }, requiredModels: ["Qwen/Qwen2.5-VL-7B-Instruct"], requiredInputs: ["image", "prompt"], outputType: "multimodal", creditPrice: 2, version: "v1", status: "testing", description: "识别用户上传图片，输出主体、场景、文字、风险、标签和运营文案。" },
        { workflowId: "workflow-deepseek-prompt-v1", name: "DeepSeek 提示词增强工作流", type: "api_chain", provider: "deepseek_text", jsonConfig: { action: "enhance-prompt" }, requiredModels: ["deepseek-chat"], requiredInputs: ["prompt"], outputType: "text", creditPrice: 1, version: "v1", status: "testing", description: "生成前增强中文 prompt，并把识图结果转成可复用生成提示词。" },
        { workflowId: "workflow-qianwen-image-v1", name: "千问图片生成工作流", type: "api_chain", provider: "qianwen_generation", jsonConfig: { action: "process-generation-job", mediaType: "image" }, requiredModels: ["qianwen-image-v1"], requiredInputs: ["prompt"], outputType: "image", creditPrice: 8, version: "v1", status: "testing", description: "真实图片生成工作流，后台灰度后可替换 Fake Worker。" },
        { workflowId: "workflow-qianwen-video-v1", name: "千问视频生成工作流", type: "api_chain", provider: "qianwen_generation", jsonConfig: { action: "process-generation-job", mediaType: "video" }, requiredModels: ["qianwen-video-v1"], requiredInputs: ["prompt", "source_asset"], outputType: "video", creditPrice: 24, version: "v1", status: "testing", description: "真实视频和图片转视频工作流，后台灰度后可替换 Fake Worker。" },
      ],
    };
  }

  private normalizePromptLibraryConfig(config: Partial<PromptLibraryConfig>): PromptLibraryConfig {
    const fallback = this.defaultPromptLibraryConfig();
    const prompts = Array.isArray(config.prompts) ? config.prompts : fallback.prompts;
    const timestamp = nowIso();
    return {
      prompts: prompts
        .filter((prompt) => prompt.promptId && prompt.title && prompt.promptText)
        .slice(0, 200)
        .map((prompt) => ({
          promptId: String(prompt.promptId).trim().slice(0, 80),
          title: String(prompt.title).trim().slice(0, 120),
          category: String(prompt.category || "image").trim().slice(0, 60),
          useCase: String(prompt.useCase || "").trim().slice(0, 120),
          promptText: String(prompt.promptText || "").trim().slice(0, 4000),
          negativePrompt: String(prompt.negativePrompt || "").trim().slice(0, 2000),
          variables: this.safeTextList(prompt.variables, [], 20),
          model: String(prompt.model || "local-demo").trim().slice(0, 100),
          version: String(prompt.version || "v1").trim().slice(0, 24),
          tags: this.safeTextList(prompt.tags, [], 16),
          status: ["draft", "testing", "published", "archived"].includes(prompt.status) ? prompt.status : "draft",
          createdAt: String(prompt.createdAt || timestamp),
          updatedAt: timestamp,
        })),
    };
  }

  private defaultPromptLibraryConfig(): PromptLibraryConfig {
    const timestamp = nowIso();
    return {
      prompts: [
        { promptId: "prompt-image-launch-v1", title: "产品发布主视觉", category: "image", useCase: "图片生成", promptText: "Create a premium AI SaaS product launch scene with a reusable presenter character, cinematic lighting, clean composition, and strong visual CTA.", negativePrompt: "low quality, blurry, distorted text", variables: ["character", "product", "style"], model: "local-image-edit-v0", version: "v1", tags: ["image", "launch", "saas"], status: "published", createdAt: timestamp, updatedAt: timestamp },
        { promptId: "prompt-video-short-v1", title: "短视频分镜", category: "video", useCase: "视频生成", promptText: "Write a 6-scene vertical short video storyboard for {topic}. Include hook, scene direction, motion, caption, and CTA.", negativePrompt: "", variables: ["topic", "cta"], model: "local-video-v0", version: "v1", tags: ["video", "storyboard"], status: "testing", createdAt: timestamp, updatedAt: timestamp },
      ],
    };
  }

  private normalizeContentIntelligenceConfig(config: Partial<ContentIntelligenceConfig>): ContentIntelligenceConfig {
    const fallback = this.defaultContentIntelligenceConfig();
    const records = Array.isArray(config.records) ? config.records : fallback.records;
    return {
      records: records
        .filter((record) => record.sourcePlatform && (record.sourceUrl || record.postText))
        .slice(0, 200)
        .map((record) => ({
          sourcePlatform: String(record.sourcePlatform || "X").trim().slice(0, 40),
          sourceUrl: String(record.sourceUrl || "").trim().slice(0, 240),
          accountName: String(record.accountName || "").trim().slice(0, 120),
          postText: String(record.postText || "").trim().slice(0, 4000),
          mediaUrls: this.safeTextList(record.mediaUrls, [], 12),
          analysisJson: typeof record.analysisJson === "object" && record.analysisJson ? record.analysisJson : {},
          hook: String(record.hook || "").trim().slice(0, 240),
          topic: String(record.topic || "").trim().slice(0, 160),
          targetAudience: String(record.targetAudience || "").trim().slice(0, 160),
          contentAngle: String(record.contentAngle || "").trim().slice(0, 240),
          reusableStrategy: String(record.reusableStrategy || "").trim().slice(0, 300),
          generatedPostVariants: this.safeTextList(record.generatedPostVariants, [], 12),
          status: ["draft", "analyzed", "converted", "archived"].includes(record.status) ? record.status : "draft",
        })),
    };
  }

  private defaultContentIntelligenceConfig(): ContentIntelligenceConfig {
    return {
      records: [
        { sourcePlatform: "X", sourceUrl: "https://x.com/example/status/demo", accountName: "@creator", postText: "One prompt should become a full content package.", mediaUrls: [], analysisJson: { confidence: 0.82 }, hook: "一个提示词不该只生成一张图", topic: "AI 内容生产系统", targetAudience: "短视频创作者", contentAngle: "从单次生成升级到可复用内容资产", reusableStrategy: "转成 Campaign、Prompt、Caption 和短视频分镜", generatedPostVariants: ["X thread", "TikTok short", "YouTube Shorts"], status: "analyzed" },
        { sourcePlatform: "TikTok", sourceUrl: "", accountName: "@trend", postText: "Fast visual hooks outperform static product demos.", mediaUrls: [], analysisJson: { confidence: 0.76, inputMode: "manual" }, hook: "前 2 秒决定短视频是否被看完", topic: "短视频开场", targetAudience: "品牌短视频团队", contentAngle: "把产品亮点转成强开场镜头", reusableStrategy: "转成脚本、分镜和视频生成 prompt", generatedPostVariants: ["TikTok script", "Reel caption"], status: "draft" },
        { sourcePlatform: "YouTube", sourceUrl: "", accountName: "@shorts", postText: "Creators want repeatable formats, not isolated generations.", mediaUrls: [], analysisJson: { confidence: 0.73, inputMode: "manual" }, hook: "固定栏目比单次爆款更可持续", topic: "内容栏目化", targetAudience: "YouTube Shorts 创作者", contentAngle: "把生成结果组织成可持续栏目", reusableStrategy: "转成 series template、thumbnail prompt 和片尾 CTA", generatedPostVariants: ["Shorts outline", "Thumbnail prompt"], status: "draft" },
        { sourcePlatform: "Reddit", sourceUrl: "", accountName: "r/creator", postText: "Users compare model output quality and workflow reliability.", mediaUrls: [], analysisJson: { confidence: 0.7, inputMode: "manual" }, hook: "质量之外，稳定工作流才是复购原因", topic: "AI 工具评价", targetAudience: "AI SaaS 产品经理", contentAngle: "把社区反馈转成产品改进和演示素材", reusableStrategy: "转成 FAQ、对比图和落地页证据卡", generatedPostVariants: ["FAQ item", "Comparison card"], status: "draft" },
        { sourcePlatform: "Instagram", sourceUrl: "", accountName: "@visualstudio", postText: "Masonry visual previews create stronger creative intent.", mediaUrls: [], analysisJson: { confidence: 0.74, inputMode: "manual" }, hook: "视觉墙比文字说明更能驱动创作", topic: "视觉发现", targetAudience: "视觉内容创作者", contentAngle: "用图库预览驱动生成入口", reusableStrategy: "转成 gallery tags、prompt remix 和角色示例", generatedPostVariants: ["Carousel caption", "Gallery prompt"], status: "draft" },
        { sourcePlatform: "Telegram", sourceUrl: "", accountName: "creator channel", postText: "Private communities need quick reusable creative packs.", mediaUrls: [], analysisJson: { confidence: 0.68, inputMode: "manual" }, hook: "社群运营需要一键复用的内容包", topic: "社群内容运营", targetAudience: "Telegram 社群运营者", contentAngle: "把生成资产打包成社群发布素材", reusableStrategy: "转成发布文案、封面图和短视频脚本", generatedPostVariants: ["Channel post", "Pinned offer"], status: "draft" },
      ],
    };
  }

  private normalizeAgentCenterConfig(config: Partial<AgentCenterConfig>): AgentCenterConfig {
    const fallback = this.defaultAgentCenterConfig();
    const agents = Array.isArray(config.agents) ? config.agents : fallback.agents;
    return {
      agents: agents
        .filter((agent) => agent.agentId && agent.name)
        .slice(0, 80)
        .map((agent) => ({
          agentId: String(agent.agentId).trim().slice(0, 80),
          name: String(agent.name).trim().slice(0, 120),
          role: ["Director Agent", "Content Analyst Agent", "Prompt Engineer Agent", "Script Writer Agent", "Storyboard Agent", "Publisher Agent"].includes(agent.role) ? agent.role : "Director Agent",
          modelProvider: String(agent.modelProvider || "fake_worker").trim().slice(0, 60),
          modelName: String(agent.modelName || "local-agent-v0").trim().slice(0, 100),
          systemPrompt: String(agent.systemPrompt || "").trim().slice(0, 4000),
          temperature: Math.max(0, Math.min(2, Number(agent.temperature ?? 0.7))),
          maxTokens: Math.max(1, Math.min(200000, Number(agent.maxTokens || 4096))),
          toolsEnabled: this.safeTextList(agent.toolsEnabled, [], 20),
          status: ["draft", "testing", "active", "disabled"].includes(agent.status) ? agent.status : "draft",
        })),
    };
  }

  private defaultAgentCenterConfig(): AgentCenterConfig {
    return {
      agents: [
        { agentId: "agent_director_v1", name: "Director Agent", role: "Director Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Coordinate campaign content from topic to reusable assets.", temperature: 0.7, maxTokens: 4096, toolsEnabled: ["prompt_library", "workflow_center"], status: "active" },
        { agentId: "agent_analyst_v1", name: "Content Analyst Agent", role: "Content Analyst Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Analyze social posts into hooks, topics, audience, angle, and reusable strategy.", temperature: 0.4, maxTokens: 4096, toolsEnabled: ["content_intelligence"], status: "testing" },
        { agentId: "agent_prompt_engineer_v1", name: "Prompt Engineer Agent", role: "Prompt Engineer Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Turn approved creative briefs into reusable image, video, and character prompts.", temperature: 0.5, maxTokens: 4096, toolsEnabled: ["prompt_library", "tool_catalog"], status: "draft" },
        { agentId: "agent_script_writer_v1", name: "Script Writer Agent", role: "Script Writer Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Write short-form scripts with hook, scenes, captions, and CTA.", temperature: 0.8, maxTokens: 4096, toolsEnabled: ["content_intelligence", "prompt_library"], status: "draft" },
        { agentId: "agent_storyboard_v1", name: "Storyboard Agent", role: "Storyboard Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Convert scripts into shot lists, visual directions, and generation-ready scene plans.", temperature: 0.6, maxTokens: 4096, toolsEnabled: ["workflow_center", "asset_library"], status: "draft" },
        { agentId: "agent_publisher_v1", name: "Publisher Agent", role: "Publisher Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Prepare approved assets for platform-specific publishing queues and metadata.", temperature: 0.4, maxTokens: 4096, toolsEnabled: ["publishing_queue", "analytics"], status: "disabled" },
      ],
    };
  }

  private deriveCostAnalytics(jobs: Array<Record<string, any>>): Array<Record<string, unknown>> {
    const groups = new Map<string, Array<Record<string, any>>>();
    for (const job of jobs) {
      const key = `${this.toolSlug(job)}|${job.provider || "fake_worker"}|${job.workflow_id || job.model || "local-demo"}`;
      groups.set(key, [...(groups.get(key) ?? []), job]);
    }
    return Array.from(groups.entries()).map(([key, items]) => {
      const [toolSlug, provider, workflow] = key.split("|");
      const successJobs = items.filter((job) => job.status === "completed").length;
      const failedJobs = items.filter((job) => job.status === "failed").length;
      const totalCreditCharged = items.reduce((sum, job) => sum + Number(job.credit_charged ?? job.cost_credits ?? 0), 0);
      const estimatedApiCost = items.reduce((sum, job) => sum + Number(job.estimated_cost ?? job.estimated_cost_cents ?? 0), 0);
      const estimatedGpuCost = Math.round(items.reduce((sum, job) => sum + Number(job.duration_seconds ?? 0) * 2, 0));
      const revenueCents = totalCreditCharged * 3;
      const grossProfit = revenueCents - estimatedApiCost - estimatedGpuCost;
      return {
        tool_slug: toolSlug,
        provider,
        model_workflow: workflow,
        total_jobs: items.length,
        success_jobs: successJobs,
        failed_jobs: failedJobs,
        total_credit_charged: totalCreditCharged,
        estimated_api_cost: estimatedApiCost,
        estimated_gpu_cost: estimatedGpuCost,
        gross_profit: grossProfit,
        profit_margin: revenueCents ? Math.round((grossProfit / revenueCents) * 100) : 0,
      };
    }).sort((left, right) => Number(right.total_credit_charged) - Number(left.total_credit_charged));
  }

  private safeToolVersions(versions: ToolVersion[] | undefined, fallback: ToolVersion[]): ToolVersion[] {
    const source = Array.isArray(versions) && versions.length ? versions : fallback;
    return source.slice(0, 20).map((version) => ({
      version: String(version.version || "v1").trim().slice(0, 24),
      changelog: String(version.changelog || "").trim().slice(0, 200),
      modelVersion: String(version.modelVersion || "").trim().slice(0, 80),
      workflowVersion: String(version.workflowVersion || "").trim().slice(0, 80),
      promptVersion: String(version.promptVersion || "").trim().slice(0, 80),
      status: ["draft", "testing", "published", "deprecated"].includes(version.status) ? version.status : "draft",
    }));
  }

  private normalizeGenerationJob(job: Record<string, any>): Record<string, unknown> {
    const createdAt = job.created_at ? new Date(job.created_at).getTime() : 0;
    const completedAt = job.completed_at ? new Date(job.completed_at).getTime() : 0;
    const latency = Number(job.latency ?? job.latency_ms ?? (createdAt && completedAt ? Math.max(0, completedAt - createdAt) : 0));
    return {
      ...job,
      tool_slug: job.tool_slug ?? this.toolSlug(job),
      workflow_id: job.workflow_id ?? `${job.provider || "fake_worker"}_${job.media_type || "generation"}_workflow`,
      workflow_version: job.workflow_version ?? "v0",
      input_params: job.input_params ?? { prompt: job.prompt, aspectRatio: job.aspect_ratio, sourceAssetId: job.source_asset_id },
      output_assets: job.output_assets ?? (job.result_asset_id ? [job.result_asset_id] : []),
      credit_charged: Number(job.credit_charged ?? job.cost_credits ?? 0),
      estimated_cost: Number(job.estimated_cost ?? job.estimated_cost_cents ?? 0),
      latency,
    };
  }

  private deriveWorkerStatuses(jobs: Array<Record<string, any>>): AdminWorkerStatus[] {
    const groups = new Map<string, Array<Record<string, any>>>();
    for (const job of jobs) {
      const key = `${job.provider || "fake_worker"}|${job.model || job.workflow_id || "local-demo"}|${job.media_type || "image"}`;
      groups.set(key, [...(groups.get(key) ?? []), job]);
    }
    const workers = Array.from(groups.entries()).map(([key, items], index) => {
      const [provider, workflow, type] = key.split("|");
      const running = items.filter((job) => ["queued", "running", "pending"].includes(String(job.status))).length;
      const failed = items.filter((job) => job.status === "failed");
      const completed = items.filter((job) => job.status === "completed");
      const latencyValues = items.map((job) => Number(this.normalizeGenerationJob(job).latency || 0)).filter(Boolean);
      return {
        worker_id: `worker_${provider}_${index + 1}`,
        provider,
        workflow,
        type: ["image", "video", "multimodal", "text"].includes(type) ? type as AdminWorkerStatus["type"] : "image",
        status: (failed.length && failed.length >= completed.length ? "failed" : running ? "running" : "idle") as AdminWorkerStatus["status"],
        queue_count: running,
        average_latency: latencyValues.length ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length) : 0,
        success_rate: items.length ? Math.round((completed.length / items.length) * 100) : 100,
        cost_per_job: items.length ? Math.round(items.reduce((sum, job) => sum + Number(job.estimated_cost_cents ?? job.estimated_cost ?? 0), 0) / items.length) : 0,
        last_heartbeat: String(items[0]?.updated_at ?? items[0]?.created_at ?? nowIso()),
        recent_failure_reason: String(failed[0]?.error_message ?? failed[0]?.error_code ?? "暂无失败记录"),
      };
    });
    return workers.length ? workers : [{
      worker_id: "worker_fake_1",
      provider: "fake_worker",
      workflow: "local-demo",
      type: "multimodal",
      status: "idle",
      queue_count: 0,
      average_latency: 0,
      success_rate: 100,
      cost_per_job: 0,
      last_heartbeat: nowIso(),
      recent_failure_reason: "暂无失败记录",
    }];
  }

  private rankPopularTools(jobs: Array<Record<string, any>>): Array<{ toolSlug: string; jobs: number }> {
    const totals = new Map<string, number>();
    for (const job of jobs) {
      const key = this.toolSlug(job);
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    return Array.from(totals.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([toolSlug, jobs]) => ({ toolSlug, jobs }));
  }

  private rankCreditConsumption(jobs: Array<Record<string, any>>): Array<{ toolSlug: string; credits: number }> {
    const totals = new Map<string, number>();
    for (const job of jobs) {
      const key = this.toolSlug(job);
      totals.set(key, (totals.get(key) ?? 0) + Number(job.credit_charged ?? job.cost_credits ?? 0));
    }
    return Array.from(totals.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([toolSlug, credits]) => ({ toolSlug, credits }));
  }

  private rankFailureByTool(jobs: Array<Record<string, any>>): Array<{ toolSlug: string; failedJobs: number; totalJobs: number; failureRate: number }> {
    const totals = new Map<string, { failedJobs: number; totalJobs: number }>();
    for (const job of jobs) {
      const key = this.toolSlug(job);
      const record = totals.get(key) ?? { failedJobs: 0, totalJobs: 0 };
      record.totalJobs += 1;
      if (job.status === "failed") record.failedJobs += 1;
      totals.set(key, record);
    }
    return Array.from(totals.entries())
      .map(([toolSlug, record]) => ({ toolSlug, ...record, failureRate: record.totalJobs ? Math.round((record.failedJobs / record.totalJobs) * 100) : 0 }))
      .filter((record) => record.failedJobs > 0)
      .sort((left, right) => right.failureRate - left.failureRate || right.failedJobs - left.failedJobs)
      .slice(0, 5);
  }

  private weeklyRevenueTrend(orders: Array<Record<string, any>>): Array<{ date: string; revenueCents: number }> {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        revenueCents: orders
          .filter((order) => this.isSameDay(order.created_at, key))
          .reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0),
      };
    });
  }

  private toolSlug(job: Record<string, any>): string {
    return String(job.tool_slug ?? job.toolSlug ?? `${job.media_type || "generation"}-${job.provider || "fake_worker"}`);
  }

  private isSameDay(value: unknown, dayKey: string): boolean {
    return typeof value === "string" && value.slice(0, 10) === dayKey;
  }
}
