import { supabase } from "./supabase-client.js";

// Billing is deliberately disabled until the server-side Stripe secrets,
// webhook endpoint, tax settings, and refund policy have been reviewed.
const billingEnabled = import.meta.env.VITE_STRIPE_BILLING_ENABLED === "true";

async function invoke(action, payload = {}) {
  if (!supabase) throw new Error("Supabase 未配置，暂不能使用会员结账。");
  const { data, error } = await supabase.functions.invoke("billing", { body: { action, ...payload } });
  if (error) throw new Error(error.message || "Billing 服务调用失败。");
  if (data?.error) throw new Error(data.error.message || data.error.code || "Billing 服务调用失败。");
  return data;
}

export async function createCheckoutSession(planId, returnUrl, cancelUrl) {
  if (!billingEnabled) throw new Error("Stripe Billing 尚未开放，当前仅完成安全架构。");
  return invoke("create-checkout-session", { planId, returnUrl, cancelUrl });
}

export async function syncSubscription(subscriptionId) {
  if (!billingEnabled) throw new Error("Stripe Billing 尚未开放。");
  return invoke("sync-subscription", { subscriptionId });
}

// Webhooks must be handled by the Edge Function. This guard prevents browser
// code from pretending to process a Stripe event or receiving a secret.
export async function handleWebhook() {
  throw new Error("Stripe webhook 只能由 Supabase billing Edge Function 处理。");
}

export const billingConfig = Object.freeze({ enabled: billingEnabled, provider: "stripe", mode: "server_only" });
