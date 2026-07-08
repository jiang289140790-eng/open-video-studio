import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
const missing = required.filter((key) => !env[key] || isPlaceholder(env[key]));

if (missing.length > 0) {
  reportAndExit({
    ok: false,
    reason: "missing_supabase_environment",
    missing,
  });
}

const adminTables = [
  "profiles",
  "credit_transactions",
  "generation_jobs",
  "media_assets",
  "share_links",
  "characters",
  "images",
  "videos",
  "orders",
  "audit_logs",
  "site_settings",
];

const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
const client = createClient(env.SUPABASE_URL, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

if (env.SUPABASE_SERVICE_ROLE_KEY) {
  await cleanupStaleAdminVerificationRows(client).catch(() => {});
}

const tables = [];
for (const table of adminTables) {
  const result = await client.from(table).select("*", { count: "exact", head: true });
  tables.push({
    table,
    ok: !result.error,
    count: result.count,
    error: result.error?.message,
    code: result.error?.code,
  });
}

const functionCheck = await checkAdminFunction(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
const operationProbe = await runAdminOperationProbe(env).catch((error) => ({
  supported: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
  ok: false,
  error: error instanceof Error ? error.message : "admin_operation_probe_failed",
}));
const ok = tables.every((table) => table.ok) && functionCheck.ok && operationProbe.ok !== false;

reportAndExit({
  ok,
  database: {
    usingServiceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    tables,
  },
  edgeFunction: functionCheck,
  operationProbe,
  nextSteps: ok ? [] : [
    "Apply supabase/migrations/202607070001_mvp_admin_console.sql in Supabase SQL Editor.",
    "Deploy supabase/functions/admin/index.ts as the admin Edge Function.",
    "Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY as Supabase Function secrets.",
    "Set your profile role to admin: update public.profiles set role = 'admin' where email = 'YOUR_EMAIL';",
  ],
});

async function runAdminOperationProbe(env) {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      supported: false,
      ok: null,
      reason: "SUPABASE_SERVICE_ROLE_KEY is required for authenticated admin operation verification",
    };
  }
  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  const email = `ovs-admin-verify-${suffix}@example.invalid`;
  const password = `Admin-${crypto.randomUUID()}!`;
  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "OVS Admin Verify" },
  });
  if (created.error || !created.data.user?.id) throw new Error(created.error?.message || "Could not create temporary admin user");
  const userId = created.data.user.id;
  const ids = {
    orderId: `order_admin_verify_${suffix}`,
    assetId: `asset_admin_verify_${suffix}`,
    shareId: `share_admin_verify_${suffix}`,
  };
  const report = {
    supported: true,
    ok: false,
    tempUserCreated: true,
    dashboardReadable: false,
    usersReadable: false,
    creditsAdjusted: false,
    orderUpdated: false,
    assetReviewed: false,
    shareRevoked: false,
    auditLogged: false,
    cleanupComplete: false,
    error: "",
  };

  try {
    await upsertProfile(adminClient, userId, email, "admin");
    await seedAdminProbeRows(adminClient, userId, ids);
    const login = await userClient.auth.signInWithPassword({ email, password });
    if (login.error || !login.data.session?.access_token) {
      throw new Error(login.error?.message || "Could not sign in temporary admin user");
    }
    const accessToken = login.data.session.access_token;

    const dashboard = await invokeAdmin(env, accessToken, { action: "dashboard-summary" });
    report.dashboardReadable = Boolean(dashboard.summary && dashboard.actor?.role === "admin");

    const users = await invokeAdmin(env, accessToken, { action: "list-users" });
    report.usersReadable = Array.isArray(users.users) && users.users.some((user) => user.id === userId);

    const credit = await invokeAdmin(env, accessToken, {
      action: "adjust-credits",
      userId,
      amount: 17,
      reason: "admin verification credit adjustment",
    });
    report.creditsAdjusted = Number(credit.transaction?.balance_impact) === 17;

    const order = await invokeAdmin(env, accessToken, {
      action: "update-order-status",
      orderId: ids.orderId,
      status: "fulfilled",
      reason: "admin verification order fulfillment",
    });
    report.orderUpdated = order.order?.status === "fulfilled";

    const asset = await invokeAdmin(env, accessToken, {
      action: "review-asset",
      assetId: ids.assetId,
      moderationStatus: "approved",
      visibilityStatus: "public",
      reason: "admin verification asset review",
    });
    report.assetReviewed = asset.asset?.moderation_status === "approved" && asset.asset?.visibility_status === "public";

    const share = await invokeAdmin(env, accessToken, {
      action: "revoke-share-link",
      shareId: ids.shareId,
      reason: "admin verification share revoke",
    });
    report.shareRevoked = share.share?.visibility_status === "revoked";

    const audit = await invokeAdmin(env, accessToken, { action: "list-audit-logs" });
    const auditRows = audit.auditLogs ?? [];
    report.auditLogged = [
      "admin.adjust_credits",
      "admin.update_order_status",
      "admin.review_asset",
      "admin.revoke_share_link",
    ].every((action) => auditRows.some((row) => row.actor_id === userId && row.action === action));

    report.ok =
      report.dashboardReadable &&
      report.usersReadable &&
      report.creditsAdjusted &&
      report.orderUpdated &&
      report.assetReviewed &&
      report.shareRevoked &&
      report.auditLogged;
    if (!report.ok) report.error = "admin_operation_probe_incomplete";
    return report;
  } catch (error) {
    report.ok = false;
    report.error = error instanceof Error ? error.message : "admin_operation_probe_failed";
    return report;
  } finally {
    await cleanupAdminProbe(adminClient, userId, ids).catch(() => {});
    await adminClient.auth.admin.deleteUser(userId).catch(() => {});
    report.cleanupComplete = true;
  }
}

async function upsertProfile(client, userId, email, role) {
  const common = {
    id: userId,
    email,
    display_name: "OVS Admin Verify",
    role,
    account_status: "active",
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
    onboarding_state: "admin_verification",
    updated_at: new Date().toISOString(),
  };
  const result = await client.from("profiles").upsert(common, { onConflict: "id" });
  if (!result.error) return;
  const minimal = await client.from("profiles").upsert({
    id: userId,
    email,
    display_name: "OVS Admin Verify",
    role,
  }, { onConflict: "id" });
  if (minimal.error) throw new Error(minimal.error.message);
}

async function seedAdminProbeRows(client, userId, ids) {
  const timestamp = new Date().toISOString();
  const order = await client.from("orders").insert({
    id: ids.orderId,
    account_id: userId,
    user_id: userId,
    provider_reference: `admin_verify_${ids.orderId}`,
    order_type: "credit_purchase",
    status: "pending",
    currency: "USD",
    amount_cents: 199,
    credits_granted: 17,
    created_at: timestamp,
    updated_at: timestamp,
  });
  if (order.error) throw new Error(`seed order failed: ${order.error.message}`);

  const asset = await client.from("media_assets").insert({
    id: ids.assetId,
    user_id: userId,
    owner_user_id: userId,
    file_url: `admin-verify/${ids.assetId}.json`,
    file_type: "image",
    consent_confirmed: true,
    asset_type: "image",
    source_type: "generation",
    storage_key: `admin-verify/${ids.assetId}.json`,
    display_name: "Admin verification asset",
    tags_json: [],
    metadata_json: { verification: true },
    processing_status: "ready",
    rights_status: "generated",
    moderation_status: "pending",
    visibility_status: "private",
    created_at: timestamp,
    updated_at: timestamp,
  });
  if (asset.error) throw new Error(`seed asset failed: ${asset.error.message}`);

  const share = await client.from("share_links").insert({
    id: ids.shareId,
    owner_user_id: userId,
    media_asset_id: ids.assetId,
    token: `admin-verify-${ids.shareId}`,
    visibility_status: "active",
    created_at: timestamp,
  });
  if (share.error) throw new Error(`seed share failed: ${share.error.message}`);
}

async function invokeAdmin(env, accessToken, payload) {
  const endpoint = `${env.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/admin`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || body?.message || `Admin function returned ${response.status}`);
  }
  return body;
}

async function cleanupAdminProbe(client, userId, ids) {
  await client.from("audit_logs").delete().eq("actor_id", userId);
  await client.from("share_links").delete().eq("id", ids.shareId);
  await client.from("media_assets").delete().eq("id", ids.assetId);
  await client.from("orders").delete().eq("id", ids.orderId);
  await client.from("credit_transactions").delete().eq("user_id", userId);
  await client.from("profiles").delete().eq("id", userId);
}

async function cleanupStaleAdminVerificationRows(client) {
  const actions = [
    "admin.adjust_credits",
    "admin.update_order_status",
    "admin.review_asset",
    "admin.revoke_share_link",
  ];
  const audit = await client
    .from("audit_logs")
    .select("id,metadata_json")
    .in("action", actions)
    .limit(1000);
  const auditIds = (audit.data ?? [])
    .filter((row) => String(row.metadata_json?.reason || "").startsWith("admin verification"))
    .map((row) => row.id);
  if (auditIds.length > 0) await client.from("audit_logs").delete().in("id", auditIds);

  const [orders, assets, shares] = await Promise.all([
    client.from("orders").select("id").like("id", "order_admin_verify_%").limit(1000),
    client.from("media_assets").select("id").like("id", "asset_admin_verify_%").limit(1000),
    client.from("share_links").select("id").like("id", "share_admin_verify_%").limit(1000),
  ]);
  const orderIds = (orders.data ?? []).map((row) => row.id);
  const assetIds = (assets.data ?? []).map((row) => row.id);
  const shareIds = (shares.data ?? []).map((row) => row.id);
  if (shareIds.length > 0) await client.from("share_links").delete().in("id", shareIds);
  if (assetIds.length > 0) await client.from("media_assets").delete().in("id", assetIds);
  if (orderIds.length > 0) await client.from("orders").delete().in("id", orderIds);
}

async function checkAdminFunction(supabaseUrl, anonKey) {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/admin`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ action: "dashboard-summary" }),
    });
    const body = await response.json().catch(() => ({}));
    const code = body?.error?.code;
    return {
      ok: response.status === 401 && code === "ADMIN_AUTH_REQUIRED" || response.status === 403 && code === "ADMIN_FORBIDDEN",
      endpoint,
      status: response.status,
      expectedUnauthenticatedCode: "ADMIN_AUTH_REQUIRED",
      code,
      message: body?.error?.message,
    };
  } catch (error) {
    return {
      ok: false,
      endpoint,
      status: 0,
      error: error instanceof Error ? error.message : "Unknown function check error",
    };
  }
}

function reportAndExit(report) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

function loadEnv(path) {
  const output = { ...process.env };
  if (!existsSync(path)) return output;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    output[key] = value;
  }
  return output;
}

function isPlaceholder(value) {
  return value.includes("your-") || value.includes("placeholder") || value.includes("example");
}
