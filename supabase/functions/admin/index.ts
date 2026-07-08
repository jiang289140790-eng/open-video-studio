// Open Video Studio MVP Admin Edge Function.
// Deploy with Supabase CLI after setting SUPABASE_SERVICE_ROLE_KEY in Supabase secrets.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: { code: "ADMIN_FUNCTION_NOT_CONFIGURED", message: "Supabase admin function secrets are missing." } }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return json({ error: { code: "ADMIN_AUTH_REQUIRED", message: "Admin login is required." } }, 401);
    }

    const actor = await getActor(adminClient, authData.user.id);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "dashboard-summary") {
      const [profiles, assets, jobs, orders, credits, shares] = await Promise.all([
        select(adminClient, "profiles"),
        select(adminClient, "media_assets"),
        select(adminClient, "generation_jobs"),
        select(adminClient, "orders"),
        select(adminClient, "credit_transactions"),
        select(adminClient, "share_links"),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      const paidOrders = orders.filter((order) => ["fulfilled", "paid", "completed"].includes(String(order.status ?? "")));
      return json({
        actor,
        summary: {
          users: profiles.length,
          assets: assets.filter((asset) => !asset.deleted_at).length,
          pendingAssets: assets.filter((asset) => !asset.deleted_at && asset.moderation_status !== "approved").length,
          generationJobs: jobs.length,
          failedJobs: jobs.filter((job) => job.status === "failed").length,
          orders: orders.length,
          creditsConsumed: credits
            .filter((credit) => Number(credit.balance_impact ?? 0) < 0)
            .reduce((sum, credit) => sum + Math.abs(Number(credit.balance_impact ?? 0)), 0),
          activeShares: shares.filter((share) => share.visibility_status === "active" && !share.revoked_at).length,
          todayNewUsers: profiles.filter((profile) => isSameDay(profile.created_at, today)).length,
          todayPaidUsers: new Set(paidOrders.filter((order) => isSameDay(order.created_at, today)).map((order) => order.user_id)).size,
          todayRevenueCents: paidOrders
            .filter((order) => isSameDay(order.created_at, today))
            .reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0),
          todayImages: jobs.filter((job) => isSameDay(job.created_at, today) && job.media_type === "image").length,
          todayVideos: jobs.filter((job) => isSameDay(job.created_at, today) && job.media_type === "video").length,
          todayFailedJobs: jobs.filter((job) => isSameDay(job.created_at, today) && job.status === "failed").length,
          weeklyRevenueTrend: weeklyRevenueTrend(paidOrders),
          popularTools: rankJobsByTool(jobs),
          highFailureTools: rankFailureByTool(jobs),
          creditConsumptionRank: rankCreditsByTool(jobs),
        },
      });
    }

    if (action === "list-users") {
      const [profiles, credits] = await Promise.all([select(adminClient, "profiles"), select(adminClient, "credit_transactions")]);
      return json({
        actor,
        users: profiles.map((profile) => ({
          ...profile,
          credit_balance: credits
            .filter((credit) => credit.user_id === profile.id && credit.status === "posted")
            .reduce((sum, credit) => sum + Number(credit.balance_impact ?? 0), 0),
        })),
      });
    }

    if (action === "list-assets") return json({ actor, assets: await select(adminClient, "media_assets", "updated_at", false) });
    if (action === "list-orders") return json({ actor, orders: await select(adminClient, "orders", "created_at", false) });
    if (action === "list-generation-jobs") {
      const jobs = await select(adminClient, "generation_jobs", "created_at", false);
      return json({ actor, jobs: jobs.map(normalizeGenerationJob) });
    }
    if (action === "list-workers") {
      const jobs = await select(adminClient, "generation_jobs", "created_at", false);
      return json({ actor, workers: deriveWorkerStatuses(jobs) });
    }
    if (action === "list-share-links") return json({ actor, shares: await select(adminClient, "share_links", "created_at", false) });
    if (action === "oauth-provider-status") {
      const redirectTo = String(body.redirectTo || "https://jiang289140790-eng.github.io/open-video-studio/zh/login/").trim();
      return json({ actor, oauthProviders: await oauthProviderStatus(userClient, redirectTo) });
    }
    if (action === "get-homepage-config") {
      const homepage = await getHomepageConfig(adminClient);
      return json({ actor, homepage });
    }
    if (action === "get-page-builder-config") {
      const pageBuilder = await getSetting(adminClient, "page_builder_config", defaultPageBuilderConfig());
      return json({ actor, pageBuilder });
    }
    if (action === "get-tool-catalog-config") {
      const toolCatalog = await getSetting(adminClient, "tool_catalog_config", defaultToolCatalogConfig());
      return json({ actor, toolCatalog });
    }
    if (action === "get-workflow-center-config") {
      const workflowCenter = await getSetting(adminClient, "workflow_center_config", defaultWorkflowCenterConfig());
      return json({ actor, workflowCenter });
    }
    if (action === "get-prompt-library-config") {
      const promptLibrary = await getSetting(adminClient, "prompt_library_config", defaultPromptLibraryConfig());
      return json({ actor, promptLibrary });
    }
    if (action === "get-content-intelligence-config") {
      const contentIntelligence = await getSetting(adminClient, "content_intelligence_config", defaultContentIntelligenceConfig());
      return json({ actor, contentIntelligence });
    }
    if (action === "get-agent-center-config") {
      const agentCenter = await getSetting(adminClient, "agent_center_config", defaultAgentCenterConfig());
      return json({ actor, agentCenter });
    }
    if (action === "list-cost-analytics") {
      const jobs = await select(adminClient, "generation_jobs", "created_at", false);
      return json({ actor, costAnalytics: deriveCostAnalytics(jobs) });
    }
    if (action === "list-audit-logs") {
      requireAdmin(actor);
      return json({ actor, auditLogs: await select(adminClient, "audit_logs", "created_at", false) });
    }

    if (action === "update-homepage-config") {
      requireAdmin(actor);
      requireReason(body.reason);
      const config = normalizeHomepageConfig(body.config);
      const record = {
        setting_key: "homepage_config",
        value_json: config,
        status: "published",
        updated_by: actor.id,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await adminClient
        .from("site_settings")
        .upsert(record, { onConflict: "setting_key" })
        .select("*")
        .single();
      if (error) throw error;
      await audit(adminClient, actor, "admin.update_homepage_config", "site_setting", "homepage_config", { reason: body.reason });
      return json({ actor, homepage: data });
    }

    if (action === "update-page-builder-config") {
      requireAdmin(actor);
      requireReason(body.reason);
      const { data, error } = await upsertSetting(adminClient, "page_builder_config", normalizePageBuilderConfig(body.config), actor.id);
      if (error) throw error;
      await audit(adminClient, actor, "admin.update_page_builder_config", "site_setting", "page_builder_config", { reason: body.reason });
      return json({ actor, pageBuilder: data });
    }

    if (action === "update-tool-catalog-config") {
      requireAdmin(actor);
      requireReason(body.reason);
      const { data, error } = await upsertSetting(adminClient, "tool_catalog_config", normalizeToolCatalogConfig(body.config), actor.id);
      if (error) throw error;
      await audit(adminClient, actor, "admin.update_tool_catalog_config", "site_setting", "tool_catalog_config", { reason: body.reason });
      return json({ actor, toolCatalog: data });
    }

    if (action === "update-workflow-center-config") {
      requireAdmin(actor);
      requireReason(body.reason);
      const { data, error } = await upsertSetting(adminClient, "workflow_center_config", normalizeWorkflowCenterConfig(body.config), actor.id);
      if (error) throw error;
      await audit(adminClient, actor, "admin.update_workflow_center_config", "site_setting", "workflow_center_config", { reason: body.reason });
      return json({ actor, workflowCenter: data });
    }

    if (action === "update-prompt-library-config") {
      requireAdmin(actor);
      requireReason(body.reason);
      const { data, error } = await upsertSetting(adminClient, "prompt_library_config", normalizePromptLibraryConfig(body.config), actor.id);
      if (error) throw error;
      await audit(adminClient, actor, "admin.update_prompt_library_config", "site_setting", "prompt_library_config", { reason: body.reason });
      return json({ actor, promptLibrary: data });
    }

    if (action === "update-content-intelligence-config") {
      requireAdmin(actor);
      requireReason(body.reason);
      const { data, error } = await upsertSetting(adminClient, "content_intelligence_config", normalizeContentIntelligenceConfig(body.config), actor.id);
      if (error) throw error;
      await audit(adminClient, actor, "admin.update_content_intelligence_config", "site_setting", "content_intelligence_config", { reason: body.reason });
      return json({ actor, contentIntelligence: data });
    }

    if (action === "update-agent-center-config") {
      requireAdmin(actor);
      requireReason(body.reason);
      const { data, error } = await upsertSetting(adminClient, "agent_center_config", normalizeAgentCenterConfig(body.config), actor.id);
      if (error) throw error;
      await audit(adminClient, actor, "admin.update_agent_center_config", "site_setting", "agent_center_config", { reason: body.reason });
      return json({ actor, agentCenter: data });
    }

    if (action === "adjust-credits") {
      requireAdmin(actor);
      requireReason(body.reason);
      const amount = Number(body.amount);
      if (!Number.isInteger(amount) || amount === 0) throw new AdminError("ADMIN_CREDIT_AMOUNT_INVALID", "Credit amount must be a non-zero integer.", 400);
      const transaction = {
        id: `credit_${crypto.randomUUID()}`,
        account_id: body.userId,
        user_id: body.userId,
        source_type: "admin_adjustment",
        source_id: actor.id,
        amount: Math.abs(amount),
        balance_impact: amount,
        operation_category: amount > 0 ? "admin_grant" : "admin_deduct",
        status: "posted",
        reason: String(body.reason).trim(),
        created_at: new Date().toISOString(),
      };
      const { data, error } = await adminClient.from("credit_transactions").insert(transaction).select("*").single();
      if (error) throw error;
      await audit(adminClient, actor, "admin.adjust_credits", "profile", String(body.userId), { amount, reason: body.reason });
      return json({ actor, transaction: data });
    }

    if (action === "update-order-status") {
      requireAdmin(actor);
      requireReason(body.reason);
      const status = String(body.status ?? "");
      if (!["pending", "fulfilled", "failed", "refunding", "refunded"].includes(status)) {
        throw new AdminError("ADMIN_ORDER_STATUS_INVALID", "Unsupported order status.", 400);
      }
      const timestamp = new Date().toISOString();
      const { data, error } = await adminClient
        .from("orders")
        .update({ status, updated_at: timestamp, completed_at: status === "fulfilled" ? timestamp : null })
        .eq("id", body.orderId)
        .select("*")
        .single();
      if (error) throw error;
      await audit(adminClient, actor, "admin.update_order_status", "order", String(body.orderId), { status, reason: body.reason });
      return json({ actor, order: data });
    }

    if (action === "review-asset") {
      requireReason(body.reason);
      const moderationStatus = String(body.moderationStatus ?? "");
      if (!["approved", "pending", "rejected", "archived"].includes(moderationStatus)) {
        throw new AdminError("ADMIN_ASSET_REVIEW_INVALID", "Unsupported moderation status.", 400);
      }
      if (actor.role !== "admin" && moderationStatus === "archived") {
        throw new AdminError("ADMIN_FORBIDDEN", "Only admins can archive assets.", 403);
      }
      const update: Record<string, unknown> = { moderation_status: moderationStatus, updated_at: new Date().toISOString() };
      if (body.visibilityStatus) update.visibility_status = String(body.visibilityStatus);
      if (moderationStatus === "archived") update.archived_at = new Date().toISOString();
      const { data, error } = await adminClient.from("media_assets").update(update).eq("id", body.assetId).select("*").single();
      if (error) throw error;
      await audit(adminClient, actor, "admin.review_asset", "media_asset", String(body.assetId), {
        moderationStatus,
        visibilityStatus: body.visibilityStatus,
        reason: body.reason,
      });
      return json({ actor, asset: data });
    }

    if (action === "revoke-share-link") {
      requireAdmin(actor);
      requireReason(body.reason);
      const { data, error } = await adminClient
        .from("share_links")
        .update({ visibility_status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", body.shareId)
        .select("*")
        .single();
      if (error) throw error;
      await audit(adminClient, actor, "admin.revoke_share_link", "share_link", String(body.shareId), { reason: body.reason });
      return json({ actor, share: data });
    }

    return json({ error: { code: "ADMIN_ACTION_NOT_FOUND", message: "Unknown admin action." } }, 404);
  } catch (error) {
    const status = error instanceof AdminError ? error.status : 500;
    return json({
      error: {
        code: error instanceof AdminError ? error.code : "ADMIN_INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Admin function failed.",
      },
    }, status);
  }
});

async function getActor(client: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) throw new AdminError("ADMIN_PROFILE_NOT_FOUND", error?.message ?? "Profile not found.", 404);
  if (data.role !== "admin" && data.role !== "operator") throw new AdminError("ADMIN_FORBIDDEN", "Admin access is required.", 403);
  return { id: data.id, email: data.email, displayName: data.display_name, role: data.role };
}

async function select(client: ReturnType<typeof createClient>, table: string, orderColumn?: string, ascending = true) {
  let query = client.from(table).select("*");
  if (orderColumn) query = query.order(orderColumn, { ascending });
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function oauthProviderStatus(userClient: ReturnType<typeof createClient>, redirectTo: string) {
  const providers = ["google", "twitter", "discord"];
  const results = await Promise.all(providers.map(async (provider) => {
    const result = await userClient.auth.signInWithOAuth({
      provider: provider as "google" | "twitter" | "discord",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (result.error || !result.data?.url) {
      return {
        provider,
        ok: false,
        authorizationUrlCreated: Boolean(result.data?.url),
        status: 0,
        locationHost: "",
        error: result.error?.message || "authorization_url_missing",
      };
    }
    const probe = await probeAuthorizationUrl(result.data.url);
    return {
      provider,
      ok: probe.ok,
      authorizationUrlCreated: true,
      status: probe.status,
      locationHost: probe.locationHost,
      error: probe.error,
    };
  }));
  return results;
}

async function probeAuthorizationUrl(url: string) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    const location = response.headers.get("location") || "";
    const locationHost = location ? new URL(location).host : "";
    const text = response.status >= 300 && response.status < 400 ? "" : await response.text().catch(() => "");
    return {
      ok: response.status >= 300 && response.status < 400 && Boolean(locationHost),
      status: response.status,
      locationHost,
      error: summarizeProviderError(text),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      locationHost: "",
      error: error instanceof Error ? error.message : "authorization_probe_failed",
    };
  }
}

function summarizeProviderError(textValue = "") {
  return textValue.replace(/\s+/g, " ").trim().slice(0, 240);
}

async function getHomepageConfig(client: ReturnType<typeof createClient>) {
  const { data, error } = await client
    .from("site_settings")
    .select("*")
    .eq("setting_key", "homepage_config")
    .maybeSingle();
  if (error) throw error;
  return data ?? {
    setting_key: "homepage_config",
    value_json: defaultHomepageConfig(),
    status: "default",
    updated_at: null,
    updated_by: null,
  };
}

async function getSetting(client: ReturnType<typeof createClient>, settingKey: string, fallback: Record<string, unknown>) {
  const { data, error } = await client
    .from("site_settings")
    .select("*")
    .eq("setting_key", settingKey)
    .maybeSingle();
  if (error) throw error;
  return data ?? {
    setting_key: settingKey,
    value_json: fallback,
    status: "default",
    updated_at: null,
    updated_by: null,
  };
}

function upsertSetting(client: ReturnType<typeof createClient>, settingKey: string, valueJson: Record<string, unknown>, actorId: string) {
  return client
    .from("site_settings")
    .upsert({
      setting_key: settingKey,
      value_json: valueJson,
      status: "published",
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "setting_key" })
    .select("*")
    .single();
}

function normalizeHomepageConfig(config: unknown) {
  const fallback = defaultHomepageConfig();
  const input = typeof config === "object" && config ? config as Record<string, unknown> : {};
  return {
    ...fallback,
    eyebrow: text(input.eyebrow, fallback.eyebrow, 80),
    headline: text(input.headline, fallback.headline, 120),
    subheadline: text(input.subheadline, fallback.subheadline, 240),
    primaryCtaLabel: text(input.primaryCtaLabel, fallback.primaryCtaLabel, 40),
    primaryCtaHref: href(input.primaryCtaHref, fallback.primaryCtaHref),
    secondaryCtaLabel: text(input.secondaryCtaLabel, fallback.secondaryCtaLabel, 40),
    secondaryCtaHref: href(input.secondaryCtaHref, fallback.secondaryCtaHref),
    galleryTitle: text(input.galleryTitle, fallback.galleryTitle, 80),
    trustSignals: arrayText(input.trustSignals, fallback.trustSignals, 6, 40),
    showcaseCards: cardList(input.showcaseCards, fallback.showcaseCards, 8),
    creationCards: cardList(input.creationCards, fallback.creationCards, 12),
  };
}

function normalizePageBuilderConfig(config: unknown) {
  const fallback = defaultPageBuilderConfig();
  const input = typeof config === "object" && config ? config as Record<string, unknown> : {};
  const pages = Array.isArray(input.pages) ? input.pages : fallback.pages;
  return {
    pages: pages.map((page, pageIndex) => {
      const item = typeof page === "object" && page ? page as Record<string, unknown> : {};
      return {
        slug: text(item.slug, pageIndex === 0 ? "home" : `page-${pageIndex + 1}`, 48),
        name: text(item.name, "页面", 80),
        status: enumText(item.status, ["published", "draft", "hidden"], "published"),
        modules: moduleList(item.modules, fallback.pages[0].modules),
      };
    }).filter((page) => page.slug && page.name).slice(0, 12),
  };
}

function normalizeToolCatalogConfig(config: unknown) {
  const fallback = defaultToolCatalogConfig();
  const input = typeof config === "object" && config ? config as Record<string, unknown> : {};
  const tools = Array.isArray(input.tools) ? input.tools : fallback.tools;
  return {
    tools: tools.map((tool) => {
      const item = typeof tool === "object" && tool ? tool as Record<string, unknown> : {};
      return {
        slug: text(item.slug, "", 64),
        name: text(item.name, "", 80),
        category: enumText(item.category, ["image", "video", "character", "asset", "prompt"], "image"),
        status: enumText(item.status, ["published", "draft", "hidden"], "published"),
        provider: text(item.provider, "fake_worker", 40),
        model: text(item.model, "local-demo", 80),
        workflowId: text(item.workflowId || item.workflow_id, "workflow-v1", 80),
        creditCost: numberClamp(item.creditCost, 0, 999, 0),
        route: href(item.route, "./zh/app/generate/"),
        featured: Boolean(item.featured),
        versions: toolVersions(item.versions, [{
          version: "v1",
          changelog: "Initial published configuration",
          modelVersion: text(item.model, "local-demo", 80),
          workflowVersion: "workflow-v1",
          promptVersion: "prompt-v1",
          status: "published",
        }]),
      };
    }).filter((tool) => tool.slug && tool.name).slice(0, 80),
  };
}

function normalizeWorkflowCenterConfig(config: unknown) {
  const fallback = defaultWorkflowCenterConfig();
  const input = typeof config === "object" && config ? config as Record<string, unknown> : {};
  const workflows = Array.isArray(input.workflows) ? input.workflows : fallback.workflows;
  return {
    workflows: workflows.map((workflow) => {
      const item = typeof workflow === "object" && workflow ? workflow as Record<string, unknown> : {};
      return {
        workflowId: text(item.workflowId, "", 80),
        name: text(item.name, "", 100),
        type: enumText(item.type, ["comfyui", "n8n", "api_chain", "agent_chain"], "api_chain"),
        provider: text(item.provider, "fake_worker", 60),
        jsonConfig: typeof item.jsonConfig === "object" && item.jsonConfig ? item.jsonConfig : {},
        requiredModels: arrayText(item.requiredModels, [], 12, 80),
        requiredInputs: arrayText(item.requiredInputs, [], 12, 60),
        outputType: enumText(item.outputType, ["image", "video", "text", "multimodal", "asset"], "asset"),
        creditPrice: numberClamp(item.creditPrice, 0, 9999, 0),
        version: text(item.version, "v1", 24),
        status: enumText(item.status, ["draft", "testing", "published", "deprecated"], "draft"),
        description: text(item.description, "", 240),
      };
    }).filter((workflow) => workflow.workflowId && workflow.name).slice(0, 80),
  };
}

function normalizePromptLibraryConfig(config: unknown) {
  const fallback = defaultPromptLibraryConfig();
  const input = typeof config === "object" && config ? config as Record<string, unknown> : {};
  const prompts = Array.isArray(input.prompts) ? input.prompts : fallback.prompts;
  const timestamp = new Date().toISOString();
  return {
    prompts: prompts.map((prompt) => {
      const item = typeof prompt === "object" && prompt ? prompt as Record<string, unknown> : {};
      return {
        promptId: text(item.promptId, "", 80),
        title: text(item.title, "", 120),
        category: text(item.category, "image", 60),
        useCase: text(item.useCase, "", 120),
        promptText: text(item.promptText, "", 4000),
        negativePrompt: text(item.negativePrompt, "", 2000),
        variables: arrayText(item.variables, [], 20, 60),
        model: text(item.model, "local-demo", 100),
        version: text(item.version, "v1", 24),
        tags: arrayText(item.tags, [], 16, 40),
        status: enumText(item.status, ["draft", "testing", "published", "archived"], "draft"),
        createdAt: text(item.createdAt, timestamp, 40),
        updatedAt: timestamp,
      };
    }).filter((prompt) => prompt.promptId && prompt.title && prompt.promptText).slice(0, 200),
  };
}

function normalizeContentIntelligenceConfig(config: unknown) {
  const fallback = defaultContentIntelligenceConfig();
  const input = typeof config === "object" && config ? config as Record<string, unknown> : {};
  const records = Array.isArray(input.records) ? input.records : fallback.records;
  return {
    records: records.map((record) => {
      const item = typeof record === "object" && record ? record as Record<string, unknown> : {};
      return {
        sourcePlatform: text(item.sourcePlatform, "X", 40),
        sourceUrl: text(item.sourceUrl, "", 240),
        accountName: text(item.accountName, "", 120),
        postText: text(item.postText, "", 4000),
        mediaUrls: arrayText(item.mediaUrls, [], 12, 240),
        analysisJson: typeof item.analysisJson === "object" && item.analysisJson ? item.analysisJson : {},
        hook: text(item.hook, "", 240),
        topic: text(item.topic, "", 160),
        targetAudience: text(item.targetAudience, "", 160),
        contentAngle: text(item.contentAngle, "", 240),
        reusableStrategy: text(item.reusableStrategy, "", 300),
        generatedPostVariants: arrayText(item.generatedPostVariants, [], 12, 160),
        status: enumText(item.status, ["draft", "analyzed", "converted", "archived"], "draft"),
      };
    }).filter((record) => record.sourcePlatform && (record.sourceUrl || record.postText)).slice(0, 200),
  };
}

function normalizeAgentCenterConfig(config: unknown) {
  const fallback = defaultAgentCenterConfig();
  const input = typeof config === "object" && config ? config as Record<string, unknown> : {};
  const agents = Array.isArray(input.agents) ? input.agents : fallback.agents;
  return {
    agents: agents.map((agent) => {
      const item = typeof agent === "object" && agent ? agent as Record<string, unknown> : {};
      return {
        agentId: text(item.agentId, "", 80),
        name: text(item.name, "", 120),
        role: enumText(item.role, ["Director Agent", "Content Analyst Agent", "Prompt Engineer Agent", "Script Writer Agent", "Storyboard Agent", "Publisher Agent"], "Director Agent"),
        modelProvider: text(item.modelProvider, "fake_worker", 60),
        modelName: text(item.modelName, "local-agent-v0", 100),
        systemPrompt: text(item.systemPrompt, "", 4000),
        temperature: numberClamp(item.temperature, 0, 2, 0.7),
        maxTokens: numberClamp(item.maxTokens, 1, 200000, 4096),
        toolsEnabled: arrayText(item.toolsEnabled, [], 20, 80),
        status: enumText(item.status, ["draft", "testing", "active", "disabled"], "draft"),
      };
    }).filter((agent) => agent.agentId && agent.name).slice(0, 80),
  };
}

function moduleList(value: unknown, fallback: Array<Record<string, unknown>>) {
  const modules = Array.isArray(value) ? value : fallback;
  return modules.map((module, index) => {
    const item = typeof module === "object" && module ? module as Record<string, unknown> : {};
    return {
      id: text(item.id, `module-${index + 1}`, 48),
      type: text(item.type, "gallery", 40),
      title: text(item.title, "内容模块", 80),
      enabled: item.enabled !== false,
      displayStyle: enumText(item.displayStyle, ["masonry", "carousel", "grid", "hero", "list"], "grid"),
      cardCount: numberClamp(item.cardCount, 1, 24, 6),
      source: text(item.source, "manual", 80),
    };
  }).filter((module) => module.id && module.type).slice(0, 16);
}

function defaultHomepageConfig() {
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
      { label: "图片", title: "发布主视觉", style: "art-3" },
      { label: "提示词", title: "把发布脚本转成可复用场景", style: "art-4", size: "wide" },
    ],
    creationCards: [
      { label: "AI 角色", title: "带记忆的可复用主持人", style: "art-2" },
      { label: "产品视频", title: "适合发布的动态概念", style: "art-1" },
      { label: "时尚场景", title: "杂志感营销画面", style: "art-5" },
      { label: "电影肖像", title: "统一面孔与风格", style: "art-6" },
    ],
  };
}

function defaultPageBuilderConfig() {
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

function defaultToolCatalogConfig() {
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

function defaultWorkflowCenterConfig() {
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

function defaultPromptLibraryConfig() {
  const timestamp = new Date().toISOString();
  return {
    prompts: [
      { promptId: "prompt-image-launch-v1", title: "产品发布主视觉", category: "image", useCase: "图片生成", promptText: "Create a premium AI SaaS product launch scene with a reusable presenter character, cinematic lighting, clean composition, and strong visual CTA.", negativePrompt: "low quality, blurry, distorted text", variables: ["character", "product", "style"], model: "local-image-edit-v0", version: "v1", tags: ["image", "launch", "saas"], status: "published", createdAt: timestamp, updatedAt: timestamp },
      { promptId: "prompt-video-short-v1", title: "短视频分镜", category: "video", useCase: "视频生成", promptText: "Write a 6-scene vertical short video storyboard for {topic}. Include hook, scene direction, motion, caption, and CTA.", negativePrompt: "", variables: ["topic", "cta"], model: "local-video-v0", version: "v1", tags: ["video", "storyboard"], status: "testing", createdAt: timestamp, updatedAt: timestamp },
    ],
  };
}

function defaultContentIntelligenceConfig() {
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

function defaultAgentCenterConfig() {
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

function text(value: unknown, fallback: string, max: number) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized ? normalized.slice(0, max) : fallback;
}

function enumText(value: unknown, allowed: string[], fallback: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return allowed.includes(normalized) ? normalized : fallback;
}

function numberClamp(value: unknown, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function href(value: unknown, fallback: string) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.startsWith("./") || normalized.startsWith("/") || normalized.startsWith("#")) return normalized.slice(0, 160);
  return fallback;
}

function arrayText(value: unknown, fallback: string[], maxItems: number, maxLength: number) {
  return Array.isArray(value)
    ? value.map((item) => text(item, "", maxLength)).filter(Boolean).slice(0, maxItems)
    : fallback;
}

function cardList(value: unknown, fallback: Array<Record<string, unknown>>, maxItems: number) {
  if (!Array.isArray(value)) return fallback;
  const cards = value.map((item, index) => {
    const card = typeof item === "object" && item ? item as Record<string, unknown> : {};
    return {
      label: text(card.label, "", 32),
      title: text(card.title, "", 80),
      style: /^art-\d+$/.test(String(card.style ?? "")) ? String(card.style) : `art-${(index % 13) + 1}`,
      size: ["tall", "wide"].includes(String(card.size ?? "")) ? String(card.size) : "",
      outputPreview: Boolean(card.outputPreview),
    };
  }).filter((card) => card.label && card.title).slice(0, maxItems);
  return cards.length ? cards : fallback;
}

function toolVersions(value: unknown, fallback: Array<Record<string, unknown>>) {
  const versions = Array.isArray(value) && value.length ? value : fallback;
  return versions.slice(0, 20).map((version) => {
    const item = typeof version === "object" && version ? version as Record<string, unknown> : {};
    return {
      version: text(item.version, "v1", 24),
      changelog: text(item.changelog, "", 200),
      modelVersion: text(item.modelVersion, "", 80),
      workflowVersion: text(item.workflowVersion, "", 80),
      promptVersion: text(item.promptVersion, "", 80),
      status: enumText(item.status, ["draft", "testing", "published", "deprecated"], "draft"),
    };
  });
}

function deriveCostAnalytics(jobs: Array<Record<string, unknown>>) {
  const groups = new Map<string, Array<Record<string, unknown>>>();
  for (const job of jobs) {
    const key = `${toolSlug(job)}|${job.provider || "fake_worker"}|${job.workflow_id || job.model || "local-demo"}`;
    groups.set(key, [...(groups.get(key) ?? []), job]);
  }
  return Array.from(groups.entries()).map(([key, items]) => {
    const [tool_slug, provider, model_workflow] = key.split("|");
    const success_jobs = items.filter((job) => job.status === "completed").length;
    const failed_jobs = items.filter((job) => job.status === "failed").length;
    const total_credit_charged = items.reduce((sum, job) => sum + Number(job.credit_charged ?? job.cost_credits ?? 0), 0);
    const estimated_api_cost = items.reduce((sum, job) => sum + Number(job.estimated_cost ?? job.estimated_cost_cents ?? 0), 0);
    const estimated_gpu_cost = Math.round(items.reduce((sum, job) => sum + Number(job.duration_seconds ?? 0) * 2, 0));
    const revenueCents = total_credit_charged * 3;
    const gross_profit = revenueCents - estimated_api_cost - estimated_gpu_cost;
    return {
      tool_slug,
      provider,
      model_workflow,
      total_jobs: items.length,
      success_jobs,
      failed_jobs,
      total_credit_charged,
      estimated_api_cost,
      estimated_gpu_cost,
      gross_profit,
      profit_margin: revenueCents ? Math.round((gross_profit / revenueCents) * 100) : 0,
    };
  }).sort((left, right) => Number(right.total_credit_charged) - Number(left.total_credit_charged));
}

function normalizeGenerationJob(job: Record<string, unknown>) {
  const createdAt = job.created_at ? new Date(String(job.created_at)).getTime() : 0;
  const completedAt = job.completed_at ? new Date(String(job.completed_at)).getTime() : 0;
  const latency = Number(job.latency ?? job.latency_ms ?? (createdAt && completedAt ? Math.max(0, completedAt - createdAt) : 0));
  return {
    ...job,
    tool_slug: job.tool_slug ?? toolSlug(job),
    workflow_id: job.workflow_id ?? `${job.provider || "fake_worker"}_${job.media_type || "generation"}_workflow`,
    workflow_version: job.workflow_version ?? "v0",
    input_params: job.input_params ?? { prompt: job.prompt, aspectRatio: job.aspect_ratio, sourceAssetId: job.source_asset_id },
    output_assets: job.output_assets ?? (job.result_asset_id ? [job.result_asset_id] : []),
    credit_charged: Number(job.credit_charged ?? job.cost_credits ?? 0),
    estimated_cost: Number(job.estimated_cost ?? job.estimated_cost_cents ?? 0),
    latency,
  };
}

function deriveWorkerStatuses(jobs: Array<Record<string, unknown>>) {
  const groups = new Map<string, Array<Record<string, unknown>>>();
  for (const job of jobs) {
    const key = `${job.provider || "fake_worker"}|${job.model || job.workflow_id || "local-demo"}|${job.media_type || "image"}`;
    groups.set(key, [...(groups.get(key) ?? []), job]);
  }
  const workers = Array.from(groups.entries()).map(([key, items], index) => {
    const [provider, workflow, type] = key.split("|");
    const running = items.filter((job) => ["queued", "running", "pending"].includes(String(job.status))).length;
    const failed = items.filter((job) => job.status === "failed");
    const completed = items.filter((job) => job.status === "completed");
    const latencyValues = items.map((job) => Number(normalizeGenerationJob(job).latency || 0)).filter(Boolean);
    return {
      worker_id: `worker_${provider}_${index + 1}`,
      provider,
      workflow,
      type: ["image", "video", "multimodal", "text"].includes(type) ? type : "image",
      status: failed.length && failed.length >= completed.length ? "failed" : running ? "running" : "idle",
      queue_count: running,
      average_latency: latencyValues.length ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length) : 0,
      success_rate: items.length ? Math.round((completed.length / items.length) * 100) : 100,
      cost_per_job: items.length ? Math.round(items.reduce((sum, job) => sum + Number(job.estimated_cost_cents ?? job.estimated_cost ?? 0), 0) / items.length) : 0,
      last_heartbeat: String(items[0]?.updated_at ?? items[0]?.created_at ?? new Date().toISOString()),
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
    last_heartbeat: new Date().toISOString(),
    recent_failure_reason: "暂无失败记录",
  }];
}

function rankJobsByTool(jobs: Array<Record<string, unknown>>) {
  const totals = new Map<string, number>();
  for (const job of jobs) totals.set(toolSlug(job), (totals.get(toolSlug(job)) ?? 0) + 1);
  return Array.from(totals.entries()).sort((left, right) => right[1] - left[1]).slice(0, 5).map(([toolSlug, jobs]) => ({ toolSlug, jobs }));
}

function rankCreditsByTool(jobs: Array<Record<string, unknown>>) {
  const totals = new Map<string, number>();
  for (const job of jobs) totals.set(toolSlug(job), (totals.get(toolSlug(job)) ?? 0) + Number(job.credit_charged ?? job.cost_credits ?? 0));
  return Array.from(totals.entries()).sort((left, right) => right[1] - left[1]).slice(0, 5).map(([toolSlug, credits]) => ({ toolSlug, credits }));
}

function rankFailureByTool(jobs: Array<Record<string, unknown>>) {
  const totals = new Map<string, { failedJobs: number; totalJobs: number }>();
  for (const job of jobs) {
    const key = toolSlug(job);
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

function weeklyRevenueTrend(orders: Array<Record<string, unknown>>) {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      revenueCents: orders
        .filter((order) => isSameDay(order.created_at, key))
        .reduce((sum, order) => sum + Number(order.amount_cents ?? 0), 0),
    };
  });
}

function toolSlug(job: Record<string, unknown>) {
  return String(job.tool_slug ?? job.toolSlug ?? `${job.media_type || "generation"}-${job.provider || "fake_worker"}`);
}

function isSameDay(value: unknown, dayKey: string) {
  return typeof value === "string" && value.slice(0, 10) === dayKey;
}

async function audit(client: ReturnType<typeof createClient>, actor: { id: string }, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
  const { error } = await client.from("audit_logs").insert({
    id: `audit_${crypto.randomUUID()}`,
    actor_type: "admin",
    actor_id: actor.id,
    action,
    target_type: targetType,
    target_id: targetId,
    outcome: "success",
    risk_classification: "high",
    metadata_json: metadata,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function requireAdmin(actor: { role: string }) {
  if (actor.role !== "admin") throw new AdminError("ADMIN_FORBIDDEN", "Admin access is required.", 403);
}

function requireReason(reason: unknown) {
  if (typeof reason !== "string" || !reason.trim()) throw new AdminError("ADMIN_REASON_REQUIRED", "Admin action reason is required.", 400);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

class AdminError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
  }
}
