import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("payment provider configuration", () => {
  it("keeps Stripe and PayPal checkout behind the Supabase Edge Function", () => {
    const aiFunction = read("supabase/functions/ai/index.ts");
    for (const expected of [
      'action === "create-payment-checkout"',
      'action === "payment-provider-status"',
      "createStripeCheckoutSession",
      "createPaypalOrder",
      "https://api.stripe.com/v1/checkout/sessions",
      "/v2/checkout/orders",
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "provider_checkout",
    ]) {
      assert.ok(aiFunction.includes(expected), `AI function should include ${expected}`);
    }
  });

  it("documents all payment environment variables without committing real keys", () => {
    const envExample = read(".env.example");
    const localExample = read(".env.local.example");
    for (const expected of [
      "VITE_STRIPE_PUBLISHABLE_KEY=",
      "STRIPE_SECRET_KEY=",
      "STRIPE_WEBHOOK_SECRET=",
      "STRIPE_MODE=test",
      "VITE_PAYPAL_CLIENT_ID=",
      "PAYPAL_CLIENT_ID=",
      "PAYPAL_CLIENT_SECRET=",
      "PAYPAL_WEBHOOK_ID=",
      "PAYPAL_ENVIRONMENT=sandbox",
    ]) {
      assert.ok(`${envExample}\n${localExample}`.includes(expected), `env templates should include ${expected}`);
    }
    assert.equal(/sk_live_[A-Za-z0-9]/.test(envExample + localExample), false);
    assert.equal(/sk_test_[A-Za-z0-9]/.test(envExample + localExample), false);
  });

  it("exposes only public payment configuration to the browser", () => {
    const appScript = read("apps/web/app.js");
    assert.ok(appScript.includes("VITE_STRIPE_PUBLISHABLE_KEY"));
    assert.ok(appScript.includes("VITE_PAYPAL_CLIENT_ID"));
    assert.ok(appScript.includes("Stripe"));
    assert.ok(appScript.includes("PayPal"));
    assert.equal(appScript.includes("STRIPE_SECRET_KEY"), false);
    assert.equal(appScript.includes("PAYPAL_CLIENT_SECRET"), false);
    assert.equal(appScript.includes("PAYPAL_WEBHOOK_ID"), false);
  });

  it("keeps the pricing surface localized and mobile checkout usable", () => {
    const pricing = read("apps/web/pricing.html");
    const styles = read("apps/web/styles.css");
    assert.ok(pricing.includes("购买积分"));
    assert.ok(pricing.includes("选择你的创作套餐"));
    assert.ok(pricing.includes("Stripe 卡支付"));
    assert.ok(pricing.includes("PayPal"));
    assert.ok(styles.includes("max-height: calc(100dvh - 28px)"));
    assert.ok(styles.includes(".checkout-methods button small"));
    assert.ok(styles.includes("overflow-wrap: anywhere"));
  });
});
