import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CONSUMER_PRICING,
  normalizeConsumerPricing,
  offerCredits,
  packageMetrics
} from "../apps/web/pricing-config.js";

test("consumer packages keep the audited one-time prices", () => {
  const pricing = normalizeConsumerPricing(DEFAULT_CONSUMER_PRICING);
  assert.deepEqual(
    pricing.packages.map(({ credits, amountCents }) => [credits, amountCents]),
    [[200, 999], [1000, 2999], [5000, 9999], [20000, 29999]]
  );
});

test("welcome offer is consistently an extra sixty percent", () => {
  const pricing = normalizeConsumerPricing(DEFAULT_CONSUMER_PRICING);
  const creator = pricing.packages.find((item) => item.id === pricing.offer.packageId);
  assert.equal(pricing.offer.code, "WELCOME60");
  assert.equal(pricing.offer.extraPercent, 60);
  assert.equal(offerCredits(pricing, creator), 1600);
});

test("unit savings and usage estimates derive from package and tool costs", () => {
  const pricing = normalizeConsumerPricing(DEFAULT_CONSUMER_PRICING);
  const creator = pricing.packages.find((item) => item.id === "creator-1000");
  const metrics = packageMetrics(creator, pricing.packages, [
    { category: "image", creditCost: 8 },
    { category: "image", creditCost: 40 },
    { category: "video", creditCost: 24 },
    { category: "video", creditCost: 32 }
  ]);
  assert.equal(metrics.savingsPercent, 40);
  assert.deepEqual(metrics.imageEstimate, { min: 25, max: 125, minCost: 8, maxCost: 40 });
  assert.deepEqual(metrics.videoEstimate, { min: 31, max: 41, minCost: 24, maxCost: 32 });
});

test("missing tool prices do not create misleading generation counts", () => {
  const pricing = normalizeConsumerPricing(DEFAULT_CONSUMER_PRICING);
  const starter = pricing.packages[0];
  const metrics = packageMetrics(starter, pricing.packages, [
    { category: "image", creditCost: 0 },
    { category: "video", creditCost: 0 }
  ]);
  assert.equal(metrics.imageEstimate, null);
  assert.equal(metrics.videoEstimate, null);
});
