import test from "node:test";
import assert from "node:assert/strict";
import { SupabaseAdminBackend } from "../src/index.js";

test("admin backend enforces roles and audits sensitive operations", async () => {
  const client = new FakeAdminSupabaseClient();
  const backend = new SupabaseAdminBackend(client as any);

  await assert.rejects(
    () => backend.getActor("user_1"),
    (error: any) => error.code === "ADMIN_FORBIDDEN",
  );

  const operator = await backend.getActor("operator_1");
  assert.equal(operator.role, "operator");
  const operatorSummary = await backend.dashboardSummary(operator);
  assert.equal(operatorSummary.users, 3);
  assert.equal(operatorSummary.pendingAssets, 1);
  assert.equal(operatorSummary.todayNewUsers, 3);
  assert.equal(operatorSummary.todayPaidUsers, 1);
  assert.equal(operatorSummary.todayImages, 1);
  assert.equal(operatorSummary.todayVideos, 1);
  assert.equal(operatorSummary.todayFailedJobs, 1);
  assert.equal(operatorSummary.popularTools[0].toolSlug, "image-editor");
  assert.equal(operatorSummary.highFailureTools[0].toolSlug, "image-to-video");
  assert.equal(operatorSummary.creditConsumptionRank[0].credits, 24);

  const workers = await backend.listWorkers(operator);
  assert.equal(workers.length, 2);
  assert.equal(workers[0].provider, "fake_worker");

  const generationJobs = await backend.listGenerationJobs(operator);
  assert.equal(generationJobs[0].workflow_id, "workflow_image_v1");
  assert.equal(generationJobs[0].credit_charged, 8);

  await assert.rejects(
    () => backend.adjustCredits(operator, { userId: "user_1", amount: 20, reason: "support grant" }),
    (error: any) => error.code === "ADMIN_FORBIDDEN",
  );

  const admin = await backend.getActor("admin_1");
  const credit = await backend.adjustCredits(admin, {
    userId: "user_1",
    amount: 50,
    reason: "manual order fulfillment",
  });
  assert.equal(credit.balance_impact, 50);
  assert.equal(client.table("audit_logs").length, 1);

  const reviewed = await backend.reviewAsset(operator, {
    assetId: "asset_1",
    moderationStatus: "approved",
    visibilityStatus: "public",
    reason: "content checked",
  });
  assert.equal(reviewed.moderation_status, "approved");
  assert.equal(client.table("audit_logs").length, 2);

  const order = await backend.updateOrderStatus(admin, {
    orderId: "order_1",
    status: "fulfilled",
    reason: "payment confirmed",
  });
  assert.equal(order.status, "fulfilled");

  const share = await backend.revokeShareLink(admin, {
    shareId: "share_1",
    reason: "creator requested removal",
  });
  assert.equal(share.visibility_status, "revoked");
  assert.equal(client.table("audit_logs").length, 4);

  const homepage = await backend.getHomepageConfig(operator);
  assert.equal(homepage.setting_key, "homepage_config");
  await assert.rejects(
    () => backend.updateHomepageConfig(operator, {
      config: { headline: "operator cannot publish homepage" },
      reason: "operator attempt",
    }),
    (error: any) => error.code === "ADMIN_FORBIDDEN",
  );
  const updatedHomepage = await backend.updateHomepageConfig(admin, {
    config: {
      headline: "Admin published homepage headline",
      primaryCtaHref: "https://unsafe.example",
      trustSignals: ["configurable homepage", "audited publish"],
      showcaseCards: [{ label: "Video", title: "Configured card", style: "art-1" }],
      creationCards: [{ label: "Asset", title: "Homepage creation card", style: "art-2" }],
    },
    reason: "homepage conversion update",
  });
  assert.equal((updatedHomepage.value_json as any).headline, "Admin published homepage headline");
  assert.equal((updatedHomepage.value_json as any).primaryCtaHref, "./zh/app/generate/");
  assert.equal(client.table("audit_logs").length, 5);

  const pageBuilder = await backend.getPageBuilderConfig(operator);
  assert.equal(pageBuilder.setting_key, "page_builder_config");
  await assert.rejects(
    () => backend.updatePageBuilderConfig(operator, {
      config: { pages: [] },
      reason: "operator attempt",
    }),
    (error: any) => error.code === "ADMIN_FORBIDDEN",
  );
  const updatedPageBuilder = await backend.updatePageBuilderConfig(admin, {
    config: {
      pages: [
        {
          slug: "home",
          name: "Home",
          status: "published",
          modules: [
            { id: "explore", type: "gallery", title: "Explore module", enabled: true, displayStyle: "masonry", cardCount: 99, source: "featured_assets" },
          ],
        },
      ],
    },
    reason: "page module merchandising",
  });
  assert.equal((updatedPageBuilder.value_json as any).pages[0].modules[0].cardCount, 24);
  assert.equal(client.table("audit_logs").length, 6);

  const toolCatalog = await backend.getToolCatalogConfig(operator);
  assert.equal(toolCatalog.setting_key, "tool_catalog_config");
  const updatedToolCatalog = await backend.updateToolCatalogConfig(admin, {
    config: {
      tools: [
        { slug: "outfit-studio", name: "AI Outfit", category: "image", status: "published", provider: "fal", model: "tryon-v1", creditCost: 12, route: "https://unsafe.example", featured: true },
      ],
    },
    reason: "tool listing update",
  });
  assert.equal((updatedToolCatalog.value_json as any).tools[0].route, "./zh/app/generate/");
  assert.equal((updatedToolCatalog.value_json as any).tools[0].provider, "fal");
  assert.equal(client.table("audit_logs").length, 7);
});

class FakeAdminSupabaseClient {
  private readonly today = new Date().toISOString();
  private readonly tables = new Map<string, any[]>([
    ["profiles", [
      { id: "admin_1", email: "admin@example.com", display_name: "Admin", role: "admin", account_status: "active", created_at: this.today },
      { id: "operator_1", email: "operator@example.com", display_name: "Operator", role: "operator", account_status: "active", created_at: this.today },
      { id: "user_1", email: "user@example.com", display_name: "User", role: "user", account_status: "active", created_at: this.today },
    ]],
    ["credit_transactions", [
      { id: "credit_1", user_id: "user_1", status: "posted", balance_impact: 40 },
      { id: "credit_2", user_id: "user_1", status: "posted", balance_impact: -8 },
    ]],
    ["media_assets", [
      { id: "asset_1", owner_user_id: "user_1", display_name: "Demo asset", asset_type: "image", moderation_status: "pending", visibility_status: "private" },
    ]],
    ["generation_jobs", [
      { id: "job_1", user_id: "user_1", media_type: "image", status: "completed", provider: "fake_worker", model: "local-image-v1", tool_slug: "image-editor", workflow_id: "workflow_image_v1", workflow_version: "v1", cost_credits: 8, estimated_cost_cents: 30, latency: 1200, created_at: this.today, completed_at: this.today },
      { id: "job_2", user_id: "user_1", media_type: "video", status: "failed", provider: "fake_worker", model: "local-video-v1", tool_slug: "image-to-video", workflow_id: "workflow_video_v1", workflow_version: "v1", cost_credits: 24, estimated_cost_cents: 120, latency: 4800, error_message: "worker timeout", created_at: this.today, completed_at: this.today },
    ]],
    ["orders", [
      { id: "order_1", user_id: "user_1", order_type: "credit_purchase", status: "fulfilled", credits_granted: 1000, amount_cents: 2999, created_at: this.today },
    ]],
    ["share_links", [
      { id: "share_1", owner_user_id: "user_1", media_asset_id: "asset_1", token: "demo", visibility_status: "active" },
    ]],
    ["audit_logs", []],
    ["site_settings", []],
  ]);

  from(tableName: string): FakeAdminQuery {
    const table = this.tables.get(tableName);
    if (!table) throw new Error(`Unknown table ${tableName}`);
    return new FakeAdminQuery(table);
  }

  table(name: string): any[] {
    return this.tables.get(name) ?? [];
  }
}

class FakeAdminQuery {
  private action: "select" | "insert" | "update" | "upsert" = "select";
  private payload: any;
  private filters: Array<(row: any) => boolean> = [];
  private singleResult = false;
  private orderKey?: string;
  private orderAscending = true;

  constructor(private readonly table: any[]) {}

  select(_columns = "*"): this {
    return this;
  }

  insert(payload: any): this {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: any): this {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: any, options: { onConflict?: string } = {}): this {
    this.action = "upsert";
    const conflictKey = options.onConflict || "id";
    const existing = this.table.find((row) => row[conflictKey] === payload[conflictKey]);
    if (existing) {
      Object.assign(existing, payload);
      this.payload = existing;
    } else {
      const row = { ...payload };
      this.table.push(row);
      this.payload = row;
    }
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): this {
    this.orderKey = column;
    this.orderAscending = options.ascending ?? true;
    return this;
  }

  single(): Promise<{ data: any; error: null }> {
    this.singleResult = true;
    return this.execute();
  }

  then<TResult1 = { data: any; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<{ data: any; error: null }> {
    if (this.action === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      this.table.push(...rows.map((row) => ({ ...row })));
      return { data: this.singleResult ? rows[0] : rows, error: null };
    }
    if (this.action === "upsert") {
      return { data: this.singleResult ? this.payload : [this.payload], error: null };
    }
    if (this.action === "update") {
      const rows = this.filteredRows();
      for (const row of rows) Object.assign(row, this.payload);
      return { data: this.singleResult ? rows[0] : rows, error: null };
    }
    const rows = this.filteredRows();
    return { data: this.singleResult ? rows[0] : rows, error: null };
  }

  private filteredRows(): any[] {
    let rows = this.filters.reduce((current, filter) => current.filter(filter), [...this.table]);
    if (this.orderKey) {
      rows = rows.sort((left, right) => {
        const comparison = String(left[this.orderKey!] ?? "").localeCompare(String(right[this.orderKey!] ?? ""));
        return this.orderAscending ? comparison : -comparison;
      });
    }
    return rows;
  }
}
