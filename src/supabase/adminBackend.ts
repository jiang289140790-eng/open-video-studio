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
    return this.selectAll("generation_jobs", "created_at", false);
  }

  async listShareLinks(actor: AdminActor): Promise<Array<Record<string, unknown>>> {
    await this.requireOperator(actor);
    return this.selectAll("share_links", "created_at", false);
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
}
