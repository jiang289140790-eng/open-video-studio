import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || isPlaceholder(supabaseUrl) || !anonKey || isPlaceholder(anonKey) || !serviceRoleKey || isPlaceholder(serviceRoleKey)) {
  console.log(JSON.stringify({
    ok: false,
    reason: "missing_supabase_environment",
    required: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  }, null, 2));
  process.exit(1);
}

const aiEndpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ai`;
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const anonymousClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const userClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const email = `ovs-user-loop-${suffix}@example.invalid`;
const password = `UserLoop-${crypto.randomUUID()}!`;

const report = {
  ok: false,
  userId: "",
  auth: {
    created: false,
    signedIn: false,
  },
  credits: {
    granted: false,
    debited: false,
    balanceAfterGeneration: null,
  },
  generation: {
    jobCreated: false,
    jobId: "",
    completed: false,
    assetCreated: false,
    assetId: "",
    storageKey: "",
  },
  gallery: {
    assetReadableByOwner: false,
    assetPublicAfterShare: false,
  },
  history: {
    jobReadableByOwner: false,
  },
  share: {
    created: false,
    token: "",
    ownerReadable: false,
    publicLinkReadable: false,
    publicAssetReadable: false,
  },
  cleanupComplete: false,
  error: "",
};

let userId = "";

try {
  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "OVS User Loop Verify" },
  });
  if (created.error || !created.data.user?.id) throw new Error(created.error?.message || "Could not create verification user");
  userId = created.data.user.id;
  report.userId = userId;
  report.auth.created = true;
  await upsertProfile(userId, email);

  const login = await userClient.auth.signInWithPassword({ email, password });
  if (login.error || !login.data.session?.access_token) throw new Error(login.error?.message || "Could not sign in verification user");
  const accessToken = login.data.session.access_token;
  report.auth.signedIn = true;

  const order = await invokeAi(accessToken, {
    action: "demo-credit-purchase",
    credits: 40,
    amountCents: 0,
    method: "user_product_loop_verification",
  });
  report.credits.granted = Boolean(order.order?.id);

  const createdJob = await invokeAi(accessToken, {
    action: "create-generation-job",
    mediaType: "image",
    provider: "fake_worker",
    workflowId: "workflow-qianwen-image-v1",
    prompt: "用户闭环验证：生成一个可分享的 AI 视频概念图",
    aspectRatio: "16:9",
  });
  report.generation.jobCreated = Boolean(createdJob.job?.id);
  report.generation.jobId = String(createdJob.job?.id || "");

  const processed = await invokeAi(accessToken, {
    action: "process-generation-job",
    jobId: createdJob.job?.id,
  });
  report.generation.completed = processed.job?.status === "completed";
  report.generation.assetCreated = Boolean(processed.asset?.id);
  report.generation.assetId = String(processed.asset?.id || "");
  report.generation.storageKey = String(processed.asset?.storage_key || "");

  const ownerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const [assetRead, jobRead, debitRead] = await Promise.all([
    ownerClient
      .from("media_assets")
      .select("id,owner_user_id,generation_job_id,storage_key,visibility_status,metadata_json")
      .eq("id", report.generation.assetId)
      .single(),
    ownerClient
      .from("generation_jobs")
      .select("id,user_id,status,result_asset_id,cost_credits")
      .eq("id", report.generation.jobId)
      .single(),
    ownerClient
      .from("credit_transactions")
      .select("source_type,source_id,balance_impact,status")
      .eq("source_id", report.generation.jobId),
  ]);
  if (assetRead.error) throw new Error(`owner asset read failed: ${assetRead.error.message}`);
  if (jobRead.error) throw new Error(`owner job read failed: ${jobRead.error.message}`);
  if (debitRead.error) throw new Error(`credit debit read failed: ${debitRead.error.message}`);
  report.gallery.assetReadableByOwner =
    assetRead.data?.owner_user_id === userId &&
    assetRead.data?.generation_job_id === report.generation.jobId &&
    Boolean(assetRead.data?.storage_key);
  report.history.jobReadableByOwner =
    jobRead.data?.user_id === userId &&
    jobRead.data?.status === "completed" &&
    jobRead.data?.result_asset_id === report.generation.assetId;
  report.credits.debited = (debitRead.data ?? []).some((row) =>
    row.source_id === report.generation.jobId &&
    row.status === "posted" &&
    Number(row.balance_impact) < 0
  );

  const share = await invokeAi(accessToken, {
    action: "create-share-link",
    assetId: report.generation.assetId,
  });
  report.share.created = Boolean(share.share?.id && share.share?.token);
  report.share.token = String(share.share?.token || "");

  const [ownerShareRead, publicShareRead, publicAssetRead, balanceRead] = await Promise.all([
    ownerClient
      .from("share_links")
      .select("id,owner_user_id,media_asset_id,token,visibility_status,revoked_at")
      .eq("token", report.share.token)
      .single(),
    anonymousClient
      .from("share_links")
      .select("id,media_asset_id,token,visibility_status,revoked_at")
      .eq("token", report.share.token)
      .single(),
    anonymousClient
      .from("media_assets")
      .select("id,visibility_status,deleted_at,storage_key")
      .eq("id", report.generation.assetId)
      .single(),
    ownerClient
      .from("credit_transactions")
      .select("balance_impact,status")
      .eq("user_id", userId),
  ]);
  if (ownerShareRead.error) throw new Error(`owner share read failed: ${ownerShareRead.error.message}`);
  if (publicShareRead.error) throw new Error(`public share read failed: ${publicShareRead.error.message}`);
  if (publicAssetRead.error) throw new Error(`public asset read failed: ${publicAssetRead.error.message}`);
  if (balanceRead.error) throw new Error(`credit balance read failed: ${balanceRead.error.message}`);
  report.share.ownerReadable =
    ownerShareRead.data?.owner_user_id === userId &&
    ownerShareRead.data?.media_asset_id === report.generation.assetId;
  report.share.publicLinkReadable =
    publicShareRead.data?.token === report.share.token &&
    publicShareRead.data?.visibility_status === "active";
  report.share.publicAssetReadable =
    publicAssetRead.data?.id === report.generation.assetId &&
    publicAssetRead.data?.visibility_status === "public" &&
    Boolean(publicAssetRead.data?.storage_key);
  report.gallery.assetPublicAfterShare = report.share.publicAssetReadable;
  report.credits.balanceAfterGeneration = (balanceRead.data ?? [])
    .filter((row) => row.status === "posted")
    .reduce((sum, row) => sum + Number(row.balance_impact || 0), 0);

  report.ok =
    report.auth.created &&
    report.auth.signedIn &&
    report.credits.granted &&
    report.credits.debited &&
    report.generation.jobCreated &&
    report.generation.completed &&
    report.generation.assetCreated &&
    report.gallery.assetReadableByOwner &&
    report.history.jobReadableByOwner &&
    report.share.created &&
    report.share.ownerReadable &&
    report.share.publicLinkReadable &&
    report.share.publicAssetReadable;
  if (!report.ok) report.error = "user_product_loop_incomplete";
} catch (error) {
  report.ok = false;
  report.error = error instanceof Error ? error.message : "user_product_loop_failed";
} finally {
  report.cleanupComplete = await cleanup(userId).catch((error) => {
    report.error = `${report.error || "cleanup_failed"}; cleanup: ${error instanceof Error ? error.message : String(error)}`;
    return false;
  });
}

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok && report.cleanupComplete ? 0 : 1);

async function invokeAi(accessToken, payload) {
  const response = await fetch(aiEndpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.error) {
    throw new Error(body?.error?.message || body?.message || `AI function returned ${response.status}`);
  }
  return body;
}

async function upsertProfile(id, profileEmail) {
  const common = {
    id,
    email: profileEmail,
    display_name: "OVS User Loop Verify",
    role: "user",
    account_status: "active",
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
    onboarding_state: "user_loop_verification",
    updated_at: new Date().toISOString(),
  };
  const result = await adminClient.from("profiles").upsert(common, { onConflict: "id" });
  if (!result.error) return;
  const minimal = await adminClient.from("profiles").upsert({
    id,
    email: profileEmail,
    display_name: "OVS User Loop Verify",
    role: "user",
  }, { onConflict: "id" });
  if (minimal.error) throw new Error(`profile upsert failed: ${minimal.error.message}`);
}

async function cleanup(id) {
  if (!id) return true;
  const assets = await adminClient.from("media_assets").select("storage_key").eq("owner_user_id", id);
  const storageKeys = (assets.data ?? []).map((asset) => asset.storage_key).filter(Boolean);
  if (storageKeys.length > 0) {
    await adminClient.storage.from(env.SUPABASE_STORAGE_BUCKET || "generated-assets").remove(storageKeys);
  }
  await adminClient.from("share_links").delete().eq("owner_user_id", id);
  await adminClient.from("media_assets").delete().eq("owner_user_id", id);
  await adminClient.from("generation_jobs").delete().eq("user_id", id);
  await adminClient.from("orders").delete().eq("user_id", id);
  await adminClient.from("credit_transactions").delete().eq("user_id", id);
  await adminClient.from("profiles").delete().eq("id", id);
  await adminClient.auth.admin.deleteUser(id);
  return true;
}

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf8");
  const entries = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    entries[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return entries;
}

function isPlaceholder(value) {
  return !value || /your-|placeholder|example|change-me/i.test(String(value));
}
