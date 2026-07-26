export const PRICING_SETTING_KEY = "consumer_credit_pricing";
export const PRICING_CONFIG_VERSION = 1;

export const DEFAULT_CONSUMER_PRICING = Object.freeze({
  version: PRICING_CONFIG_VERSION,
  currency: "USD",
  packages: [
    { id: "starter-200", credits: 200, amountCents: 999, label: "入门包", tag: "轻量体验", featured: false },
    { id: "creator-1000", credits: 1000, amountCents: 2999, label: "创作者包", tag: "最受欢迎", featured: true },
    { id: "growth-5000", credits: 5000, amountCents: 9999, label: "成长包", tag: "高频创作", featured: false },
    { id: "studio-20000", credits: 20000, amountCents: 29999, label: "工作室包", tag: "团队用量", featured: false }
  ],
  offer: {
    id: "welcome-extra-60",
    code: "WELCOME60",
    packageId: "creator-1000",
    extraPercent: 60,
    durationMinutes: 30,
    triggerDelaySeconds: 45,
    cooldownHours: 24
  }
});

export function normalizeConsumerPricing(input) {
  const source = input && typeof input === "object" ? input : DEFAULT_CONSUMER_PRICING;
  const currency = String(source.currency || "USD").trim().toUpperCase().slice(0, 8) || "USD";
  const packages = Array.isArray(source.packages) ? source.packages : DEFAULT_CONSUMER_PRICING.packages;
  const normalizedPackages = packages
    .map((item, index) => ({
      id: String(item?.id || `package-${index + 1}`).trim(),
      credits: clampInteger(item?.credits, 1, 200000),
      amountCents: clampInteger(item?.amountCents ?? item?.amount_cents, 50, 100000000),
      label: String(item?.label || `${item?.credits || 0} 积分包`).trim().slice(0, 80),
      tag: String(item?.tag || "").trim().slice(0, 40),
      featured: item?.featured === true,
      enabled: item?.enabled !== false
    }))
    .filter((item) => item.id && item.credits > 0 && item.amountCents >= 50 && item.enabled)
    .slice(0, 12);
  const safePackages = normalizedPackages.length ? normalizedPackages : structuredClone(DEFAULT_CONSUMER_PRICING.packages);
  const rawOffer = source.offer && typeof source.offer === "object" ? source.offer : DEFAULT_CONSUMER_PRICING.offer;
  const packageId = safePackages.some((item) => item.id === rawOffer.packageId)
    ? String(rawOffer.packageId)
    : safePackages.find((item) => item.featured)?.id || safePackages[0].id;
  return {
    version: clampInteger(source.version, 1, 100),
    currency,
    packages: safePackages,
    offer: {
      id: String(rawOffer.id || "welcome-extra-60").trim().slice(0, 80),
      code: String(rawOffer.code || "WELCOME60").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32),
      packageId,
      extraPercent: clampInteger(rawOffer.extraPercent, 1, 500),
      durationMinutes: clampInteger(rawOffer.durationMinutes, 5, 1440),
      triggerDelaySeconds: clampInteger(rawOffer.triggerDelaySeconds, 30, 60),
      cooldownHours: clampInteger(rawOffer.cooldownHours, 1, 720)
    }
  };
}

export function packageMetrics(packageItem, packages, toolCosts) {
  const entry = packageItem || {};
  const validCosts = (Array.isArray(toolCosts) ? toolCosts : [])
    .map((tool) => ({
      category: String(tool?.category || ""),
      cost: Number(tool?.creditCost ?? tool?.credits_cost ?? 0)
    }))
    .filter((tool) => Number.isFinite(tool.cost) && tool.cost > 0);
  const imageCosts = validCosts.filter((tool) => tool.category === "image").map((tool) => tool.cost);
  const videoCosts = validCosts.filter((tool) => tool.category === "video").map((tool) => tool.cost);
  const unitPrice = Number(entry.amountCents || 0) / Math.max(1, Number(entry.credits || 0)) * 100;
  const base = [...(Array.isArray(packages) ? packages : [])]
    .filter((item) => Number(item?.credits) > 0 && Number(item?.amountCents) > 0)
    .sort((a, b) => Number(a.credits) - Number(b.credits))[0];
  const baseUnitPrice = base ? Number(base.amountCents) / Number(base.credits) * 100 : unitPrice;
  const savingsPercent = baseUnitPrice > 0 ? Math.max(0, Math.round((1 - unitPrice / baseUnitPrice) * 100)) : 0;
  return {
    unitPriceCentsPer100: unitPrice,
    savingsPercent,
    imageEstimate: estimateRange(entry.credits, imageCosts),
    videoEstimate: estimateRange(entry.credits, videoCosts)
  };
}

export function offerCredits(pricing, packageItem) {
  const extraPercent = Number(pricing?.offer?.extraPercent || 0);
  const baseCredits = Number(packageItem?.credits || 0);
  return Math.floor(baseCredits * (1 + extraPercent / 100));
}

function estimateRange(credits, costs) {
  if (!costs.length) return null;
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  return {
    min: Math.floor(Number(credits || 0) / maxCost),
    max: Math.floor(Number(credits || 0) / minCost),
    minCost,
    maxCost
  };
}

function clampInteger(value, min, max) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}
