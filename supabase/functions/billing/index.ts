import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } }, 405);

  const env = loadEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signature = req.headers.get("stripe-signature") || "";
  const rawBody = await req.text();

  try {
    if (signature) {
      if (!env.webhookSecret || !(await verifyStripeSignature(rawBody, signature, env.webhookSecret))) {
        return json({ error: { code: "STRIPE_SIGNATURE_INVALID", message: "Invalid Stripe webhook signature." } }, 401);
      }
      const event = JSON.parse(rawBody);
      if (!env.billingEnabled || env.stripeMode !== "test") {
        return json({ received: true, ignored: true, reason: "billing_disabled_or_not_test_mode" });
      }
      const result = await handleStripeEvent(admin, event);
      return json({ received: true, ...result });
    }

    const body = JSON.parse(rawBody || "{}");
    if (body.action === "create-checkout-session") {
      if (!env.billingEnabled || env.stripeMode !== "test") {
        return json({ error: { code: "BILLING_DISABLED", message: "Stripe Billing is disabled; no real charges can be created." } }, 409);
      }
      const userClient = createClient(env.supabaseUrl, env.anonKey, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
      const { data: auth } = await userClient.auth.getUser();
      if (!auth.user || auth.user.is_anonymous) return json({ error: { code: "AUTH_REQUIRED", message: "Login is required." } }, 401);
      const planId = String(body.planId || "").trim();
      const { data: plan, error: planError } = await admin.from("plans").select("*").eq("id", planId).eq("status", "published").maybeSingle();
      if (planError || !plan) return json({ error: { code: "PLAN_NOT_FOUND", message: "Published plan not found." } }, 404);
      if (!plan.stripe_price_id) return json({ error: { code: "STRIPE_PRICE_NOT_CONFIGURED", message: "Stripe Price ID is not configured for this plan." } }, 409);
      const session = await createStripeCheckoutSession(env, {
        userId: auth.user.id,
        email: auth.user.email || "",
        planId: plan.id,
        priceId: plan.stripe_price_id,
        returnUrl: String(body.returnUrl || `${env.appUrl}/pricing.html`),
        cancelUrl: String(body.cancelUrl || `${env.appUrl}/pricing.html`),
      });
      await admin.from("subscriptions").insert({
        user_id: auth.user.id,
        plan_id: plan.id,
        status: "pending",
        provider: "stripe",
        external_id: session.id,
      });
      return json({ checkoutUrl: session.url, sessionId: session.id, mode: "test" });
    }

    if (body.action === "sync-subscription") {
      return json({ error: { code: "BILLING_WEBHOOK_ONLY", message: "Subscriptions are synchronized by verified Stripe webhooks." } }, 409);
    }
    return json({ error: { code: "BILLING_ACTION_UNKNOWN", message: "Unknown billing action." } }, 400);
  } catch (error) {
    return json({ error: { code: "BILLING_FAILED", message: error instanceof Error ? error.message : "Billing request failed." } }, 500);
  }
});

async function handleStripeEvent(admin: any, event: Record<string, any>) {
  const type = String(event.type || "");
  const object = event.data?.object || {};
  if (!["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(type)) {
    return { ignoredEvent: type };
  }
  if (type === "checkout.session.completed") {
    const subscriptionId = String(object.subscription || "");
    if (!subscriptionId) return { ignoredEvent: type, reason: "missing_subscription" };
    const metadata = object.metadata || {};
    return { subscription: await syncSubscription(admin, { stripeSubscriptionId: subscriptionId, stripeCustomerId: object.customer, externalId: object.id, userId: metadata.user_id, planId: metadata.plan_id, status: "active" }) };
  }
  const item = object.items?.data?.[0] || {};
  const priceId = String(item.price?.id || "");
  const metadata = object.metadata || {};
  const mappedStatus = type.endsWith(".deleted") ? "cancelled" : mapStripeStatus(object.status);
  return { subscription: await syncSubscription(admin, { stripeSubscriptionId: object.id, stripeCustomerId: object.customer, stripePriceId: priceId, userId: metadata.user_id, planId: metadata.plan_id, status: mappedStatus, startedAt: toIso(item.current_period_start || object.start_date), endedAt: toIso(item.current_period_end) }) };
}

async function syncSubscription(admin: any, input: Record<string, any>) {
  let query = admin.from("subscriptions").select("*").limit(1);
  if (input.stripeSubscriptionId) query = query.eq("stripe_subscription_id", input.stripeSubscriptionId);
  else if (input.stripeCustomerId) query = query.eq("stripe_customer_id", input.stripeCustomerId);
  else if (input.externalId) query = query.eq("external_id", input.externalId);
  let existing = await query.maybeSingle();
  if (!existing.data && input.externalId && input.stripeSubscriptionId) {
    existing = await admin.from("subscriptions").select("*").eq("external_id", input.externalId).limit(1).maybeSingle();
  }
  if (existing.error && existing.error.code !== "PGRST116") throw existing.error;
  let planId = input.planId || existing.data?.plan_id || null;
  if (!planId && input.stripePriceId) {
    const { data: plan } = await admin.from("plans").select("id").eq("stripe_price_id", input.stripePriceId).maybeSingle();
    planId = plan?.id || null;
  }
  if (!input.userId && !existing.data?.user_id) throw new Error("Subscription user could not be resolved.");
  if (!planId) throw new Error("Subscription plan could not be resolved.");
  const payload = {
    user_id: input.userId || existing.data.user_id,
    plan_id: planId,
    status: input.status || existing.data?.status || "active",
    started_at: input.startedAt || existing.data?.started_at || new Date().toISOString(),
    ended_at: input.endedAt || null,
    provider: "stripe",
    external_id: input.externalId || existing.data?.external_id || null,
    stripe_customer_id: input.stripeCustomerId || existing.data?.stripe_customer_id || null,
    stripe_subscription_id: input.stripeSubscriptionId || existing.data?.stripe_subscription_id || null,
    stripe_price_id: input.stripePriceId || existing.data?.stripe_price_id || null,
    updated_at: new Date().toISOString(),
  };
  const result = existing.data
    ? await admin.from("subscriptions").update(payload).eq("id", existing.data.id).select("*").single()
    : await admin.from("subscriptions").insert(payload).select("*").single();
  if (result.error) throw result.error;
  return result.data;
}

async function createStripeCheckoutSession(env: Record<string, string>, input: Record<string, string>) {
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", input.priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("success_url", `${input.returnUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${input.cancelUrl}?checkout=cancelled`);
  params.set("client_reference_id", input.userId);
  params.set("customer_email", input.email);
  params.set("metadata[user_id]", input.userId);
  params.set("metadata[plan_id]", input.planId);
  params.set("subscription_data[metadata][user_id]", input.userId);
  params.set("subscription_data[metadata][plan_id]", input.planId);
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${env.secretKey}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params });
  const data = await response.json();
  if (!response.ok || !data.id || !data.url) throw new Error(data.error?.message || "Stripe checkout session creation failed.");
  return { id: String(data.id), url: String(data.url) };
}

async function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=", 2)));
  const timestamp = Number(parts.t);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300 || !parts.v1) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(expected, parts.v1);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return result === 0;
}

function mapStripeStatus(status: unknown) {
  return ["trialing", "active", "paused", "cancelled", "expired"].includes(String(status)) ? String(status) : "pending";
}

function toIso(value: unknown) {
  const seconds = Number(value || 0);
  return seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function loadEnv() {
  return {
    supabaseUrl: Deno.env.get("SUPABASE_URL") || "",
    anonKey: Deno.env.get("SUPABASE_ANON_KEY") || "",
    serviceRoleKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    secretKey: Deno.env.get("STRIPE_SECRET_KEY") || "",
    webhookSecret: Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
    stripeMode: Deno.env.get("STRIPE_MODE") === "live" ? "live" : "test",
    billingEnabled: Deno.env.get("STRIPE_BILLING_ENABLED") === "true",
    appUrl: Deno.env.get("APP_URL") || "https://jiang289140790-eng.github.io/open-video-studio",
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
}
