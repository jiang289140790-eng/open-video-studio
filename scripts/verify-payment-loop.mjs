import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || "";
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || "";
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || "";
const missing = [
  !supabaseUrl || isPlaceholder(supabaseUrl) ? "SUPABASE_URL" : "",
  !anonKey || isPlaceholder(anonKey) ? "SUPABASE_ANON_KEY" : "",
].filter(Boolean);

if (missing.length > 0) {
  console.log(JSON.stringify({ ok: false, reason: "missing_supabase_config", missing }, null, 2));
  process.exit(1);
}

const endpoint = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ai`;
const report = {
  ok: false,
  endpoint,
  unauthenticatedGate: {
    ok: false,
    status: 0,
    code: "",
    message: "",
  },
  paymentLoop: {
    ok: false,
    orderCreated: false,
    orderReadable: false,
    creditLedgerReadable: false,
    creditBalanceCorrect: false,
    orderStatus: "",
    creditsGranted: 0,
    balance: 0,
    error: "",
  },
};

const unauthenticated = await fetch(endpoint, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "demo-credit-purchase", credits: 1, amountCents: 0, method: "unauthenticated_probe" }),
});
const unauthenticatedBody = await unauthenticated.json().catch(() => ({}));
report.unauthenticatedGate = {
  ok: unauthenticated.status === 401,
  status: unauthenticated.status,
  code: unauthenticatedBody?.code || unauthenticatedBody?.error?.code || "",
  message: unauthenticatedBody?.message || unauthenticatedBody?.error?.message || "",
};

const temporaryAccess = env.SUPABASE_TEST_ACCESS_TOKEN
  ? { accessToken: env.SUPABASE_TEST_ACCESS_TOKEN, cleanup: async () => {} }
  : await createTemporaryUserAccessToken().catch((error) => {
    report.paymentLoop.error = error instanceof Error ? error.message : "temporary_user_probe_failed";
    return { accessToken: "", cleanup: async () => {} };
  });

if (temporaryAccess.accessToken) {
  try {
    await probePaymentLoop(temporaryAccess.accessToken);
  } finally {
    await temporaryAccess.cleanup();
  }
}

report.ok = report.unauthenticatedGate.ok && report.paymentLoop.ok;
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.ok ? 0 : 1;

async function probePaymentLoop(accessToken) {
  try {
    const credits = 123;
    const amountCents = 1999;
    const method = `verification_${Date.now()}`;
    const purchase = await invokeAi(accessToken, {
      action: "demo-credit-purchase",
      credits,
      amountCents,
      currency: "USD",
      method,
    });
    const orderId = String(purchase.order?.id || "");
    report.paymentLoop.orderCreated = Boolean(orderId);
    report.paymentLoop.orderStatus = String(purchase.order?.status || "");
    report.paymentLoop.creditsGranted = Number(purchase.order?.credits_granted || 0);
    if (!orderId) throw new Error("demo purchase did not return an order id");

    const { createClient } = await import("@supabase/supabase-js");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const [orderRead, ledgerRead, balanceRead] = await Promise.all([
      userClient
        .from("orders")
        .select("id,status,credits_granted,amount_cents,currency,provider_reference,credit_transaction_id")
        .eq("id", orderId)
        .single(),
      userClient
        .from("credit_transactions")
        .select("source_type,source_id,balance_impact,status,operation_category")
        .eq("source_id", orderId),
      userClient
        .from("credit_transactions")
        .select("balance_impact,status"),
    ]);
    if (orderRead.error) throw new Error(`orders readback failed: ${orderRead.error.message}`);
    if (ledgerRead.error) throw new Error(`credit ledger readback failed: ${ledgerRead.error.message}`);
    if (balanceRead.error) throw new Error(`credit balance readback failed: ${balanceRead.error.message}`);

    const ledgerRows = ledgerRead.data ?? [];
    const balanceRows = balanceRead.data ?? [];
    report.paymentLoop.orderReadable =
      orderRead.data?.id === orderId &&
      orderRead.data?.status === "fulfilled" &&
      Number(orderRead.data?.credits_granted || 0) === credits &&
      Number(orderRead.data?.amount_cents || 0) === amountCents;
    report.paymentLoop.creditLedgerReadable = ledgerRows.some((row) =>
      row.source_type === "order" &&
      row.source_id === orderId &&
      Number(row.balance_impact) === credits &&
      row.status === "posted" &&
      row.operation_category === "grant"
    );
    report.paymentLoop.balance = balanceRows
      .filter((row) => row.status === "posted")
      .reduce((sum, row) => sum + Number(row.balance_impact || 0), 0);
    report.paymentLoop.creditBalanceCorrect = report.paymentLoop.balance >= credits;
    report.paymentLoop.ok =
      report.paymentLoop.orderCreated &&
      report.paymentLoop.orderReadable &&
      report.paymentLoop.creditLedgerReadable &&
      report.paymentLoop.creditBalanceCorrect;
    if (!report.paymentLoop.ok) report.paymentLoop.error = "payment_loop_readback_incomplete";
  } catch (error) {
    report.paymentLoop.ok = false;
    report.paymentLoop.error = error instanceof Error ? error.message : "payment_loop_probe_failed";
  }
}

async function createTemporaryUserAccessToken() {
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_TEST_ACCESS_TOKEN is required for payment verification");
  const { createClient } = await import("@supabase/supabase-js");
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const email = `ovs-payment-verify-${Date.now()}@example.invalid`;
  const password = `Payment-${crypto.randomUUID()}!`;
  const created = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "OVS Payment Verify" },
  });
  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message || "Could not create temporary payment verification user");
  }
  const userId = created.data.user.id;
  try {
    const profile = await adminClient.from("profiles").upsert({
      id: userId,
      email,
      display_name: "OVS Payment Verify",
      role: "user",
      account_status: "active",
      locale: "en",
      timezone: "UTC",
      onboarding_state: "payment_verification",
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (profile.error) {
      const minimalProfile = await adminClient.from("profiles").upsert({
        id: userId,
        email,
        display_name: "OVS Payment Verify",
        role: "user",
      }, { onConflict: "id" });
      if (minimalProfile.error) throw new Error(minimalProfile.error.message);
    }
    const login = await userClient.auth.signInWithPassword({ email, password });
    if (login.error || !login.data.session?.access_token) {
      throw new Error(login.error?.message || "Could not sign in temporary payment verification user");
    }
    return {
      accessToken: login.data.session.access_token,
      cleanup: async () => {
        await adminClient.from("orders").delete().eq("user_id", userId);
        await adminClient.from("credit_transactions").delete().eq("user_id", userId);
        await adminClient.from("profiles").delete().eq("id", userId);
        await adminClient.auth.admin.deleteUser(userId);
      },
    };
  } catch (error) {
    await adminClient.from("profiles").delete().eq("id", userId);
    await adminClient.auth.admin.deleteUser(userId);
    throw error;
  }
}

async function invokeAi(accessToken, payload) {
  const response = await fetch(endpoint, {
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

function loadEnv(path) {
  const output = { ...process.env };
  if (!existsSync(path)) return output;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    output[key] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return output;
}

function isPlaceholder(value = "") {
  return value.includes("your-") || value.includes("placeholder") || value.includes("example");
}
