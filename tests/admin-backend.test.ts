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
      config: { headline: "运营人员不能发布首页" },
      reason: "operator attempt",
    }),
    (error: any) => error.code === "ADMIN_FORBIDDEN",
  );
  const updatedHomepage = await backend.updateHomepageConfig(admin, {
    config: {
      headline: "后台发布的首页标题",
      primaryCtaHref: "https://unsafe.example",
      trustSignals: ["首页可配置", "写入审计"],
      showcaseCards: [{ label: "视频", title: "后台配置卡片", style: "art-1" }],
      creationCards: [{ label: "资产", title: "首页作品卡片", style: "art-2" }],
    },
    reason: "homepage conversion update",
  });
  assert.equal((updatedHomepage.value_json as any).headline, "后台发布的首页标题");
  assert.equal((updatedHomepage.value_json as any).primaryCtaHref, "./zh/app/generate/");
  assert.equal(client.table("audit_logs").length, 5);
});

class FakeAdminSupabaseClient {
  private readonly tables = new Map<string, any[]>([
    ["profiles", [
      { id: "admin_1", email: "admin@example.com", display_name: "Admin", role: "admin", account_status: "active" },
      { id: "operator_1", email: "operator@example.com", display_name: "Operator", role: "operator", account_status: "active" },
      { id: "user_1", email: "user@example.com", display_name: "User", role: "user", account_status: "active" },
    ]],
    ["credit_transactions", [
      { id: "credit_1", user_id: "user_1", status: "posted", balance_impact: 40 },
      { id: "credit_2", user_id: "user_1", status: "posted", balance_impact: -8 },
    ]],
    ["media_assets", [
      { id: "asset_1", owner_user_id: "user_1", display_name: "Demo asset", asset_type: "image", moderation_status: "pending", visibility_status: "private" },
    ]],
    ["generation_jobs", [
      { id: "job_1", user_id: "user_1", status: "completed", cost_credits: 8 },
    ]],
    ["orders", [
      { id: "order_1", user_id: "user_1", order_type: "credit_purchase", status: "pending", credits_granted: 1000, amount_cents: 2999 },
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
      this.payload = payload;
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
      const row = this.payload;
      if (!this.table.includes(row)) this.table.push({ ...row });
      return { data: this.singleResult ? row : [row], error: null };
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
