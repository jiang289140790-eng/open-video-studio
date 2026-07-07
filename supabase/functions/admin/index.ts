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
    if (action === "list-generation-jobs") return json({ actor, jobs: await select(adminClient, "generation_jobs", "created_at", false) });
    if (action === "list-share-links") return json({ actor, shares: await select(adminClient, "share_links", "created_at", false) });
    if (action === "list-audit-logs") {
      requireAdmin(actor);
      return json({ actor, auditLogs: await select(adminClient, "audit_logs", "created_at", false) });
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
