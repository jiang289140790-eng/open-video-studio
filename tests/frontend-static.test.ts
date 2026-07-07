import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const webRoot = join(process.cwd(), "apps", "web");

const requiredPages = [
  "index.html",
  "app.html",
  "gallery.html",
  "generate.html",
  "image-to-video.html",
  "characters.html",
  "assets.html",
  "history.html",
  "dashboard.html",
  "pricing.html",
  "referral.html",
  "my-creations.html",
  "image-editor.html",
  "face-swap.html",
  "outfit-studio.html",
  "pose-generator.html",
  "nano-banana.html",
  "image-combiner.html",
  "ai-effects.html",
  "blog.html",
  "terms.html",
  "privacy.html",
  "cookie.html",
  "signin.html",
  "share.html"
];

function readPage(file: string): string {
  return readFileSync(join(webRoot, file), "utf8");
}

describe("MVP static frontend", () => {
  it("contains every required product surface", () => {
    for (const page of requiredPages) {
      const pagePath = join(webRoot, page);
      assert.equal(existsSync(pagePath), true, `${page} should exist`);
      const html = readPage(page);
      assert.match(html, /<title>.+<\/title>/);
      assert.ok(html.includes("./styles.css"), `${page} should reference shared styles`);
    }
  });

  it("keeps required commercial navigation items available", () => {
    const combined = requiredPages.map(readPage).join("\n");
    for (const item of ["工具", "作品探索", "图像工具", "角色", "购买积分", "免费硬币", "我的创作", "控制台", "生成历史", "积分", "登录"]) {
      assert.ok(combined.includes(item), `navigation should include ${item}`);
    }
  });

  it("contains required conversion CTAs", () => {
    const combined = requiredPages.map(readPage).join("\n");
    for (const cta of ["开始创作", "生成第一个场景", "创建角色", "快速生成", "立即购买", "生成相似作品"]) {
      assert.ok(combined.includes(cta), `CTA should exist: ${cta}`);
    }
  });

  it("offers the required social authentication options on the account page", () => {
    const signin = readPage("signin.html");
    assert.ok(signin.includes("使用 Google 登录"));
    assert.ok(signin.includes("使用 X 登录"));
    assert.ok(signin.includes("使用 Telegram 登录"));
    assert.ok(signin.includes("使用 Discord 登录"));
    assert.equal(signin.includes("GitHub"), false);
    assert.equal(signin.includes("Apple"), false);
    assert.ok(signin.includes("登录"));
    assert.equal(signin.includes("data-auth-email"), false);
    assert.equal(signin.includes("data-auth-password"), false);
  });

  it("contains working MVP hooks for the target-site-style product loop", () => {
    const combined = [...requiredPages.map(readPage), readPage("app.js")].join("\n");
    for (const hook of [
      "data-auth-provider=\"google\"",
      "data-auth-provider=\"twitter\"",
      "data-telegram-auth",
      "data-auth-provider=\"discord\"",
      "data-buy-credits",
      "data-character-form",
      "data-generate",
      "data-asset-list",
      "data-history-list",
      "data-share-title",
      "daily-check",
      "data-language",
      "openUnlockModal",
      "data-unlock-auth",
      "data-logout",
      "data-tool-workbench",
      "data-tool-demo-generate",
      "data-template-prompt",
      "floating-dock",
      "data-support-widget",
      "data-scroll-top",
      "data-creation-list",
      "data-creation-history",
      "data-creation-search",
      "data-creation-filter",
      "renderCreations",
      "data-copy-asset-prompt",
      "data-retry-asset",
      "data-retry-job",
      "data-gallery-similar",
      "data-copy-gallery-prompt",
      "data-gallery-share",
      "data-gallery-favorite",
      "data-asset-filter",
      "data-character-search",
      "data-character-filter",
      "data-character-profile",
      "data-character-card",
      "data-use-character",
      "data-copy-character",
      "ovs_selected_character",
      "data-referral-state",
      "data-referral-progress",
      "data-reward-task",
      "data-claim-task",
      "renderReferral",
      "data-dashboard-recent",
      "data-dashboard-characters",
      "data-dashboard-shares-list",
      "openCheckoutModal",
      "checkout-overlay",
      "data-checkout-method",
      "data-confirm-checkout",
      "data-checkout-promo",
      "data-auth-modal",
      "openAuthModal",
      "data-modal-auth-provider",
      "startSocialAuth",
      "auth-overlay",
      "data-share-generate",
      "data-share-copy-prompt",
      "data-share-save",
      "getCurrentShareAsset"
    ]) {
      assert.ok(combined.includes(hook), `MVP hook should exist: ${hook}`);
    }
  });

  it("contains target-site-style tool and footer page routes", () => {
    const combined = [...requiredPages.map(readPage), readPage("app.js")].join("\n");
    for (const page of [
      "image-editor.html",
      "face-swap.html",
      "outfit-studio.html",
      "pose-generator.html",
      "nano-banana.html",
      "image-combiner.html",
      "ai-effects.html",
      "blog.html",
      "terms.html",
      "privacy.html",
      "cookie.html"
    ]) {
      assert.ok(existsSync(join(webRoot, page)), `${page} should exist`);
      assert.ok(combined.includes(page), `${page} should be linked from the product surface`);
    }
  });

  it("contains target-site-style top navigation dropdowns", () => {
    const appScript = readPage("app.js");
    for (const expected of [
      "nav-menu",
      "nav-dropdown",
      "language-menu",
      "language-dropdown",
      "图片编辑器",
      "AI 换脸",
      "造型工作室",
      "姿势生成器",
      "Nano Banana",
      "图像组合器",
      "图片转视频"
    ]) {
      assert.ok(appScript.includes(expected), `top navigation should include ${expected}`);
    }
  });

  it("uses page-aware side rail active navigation", () => {
    const appScript = readPage("app.js");
    assert.ok(appScript.includes("const active = (target) => page === target"));
    assert.ok(appScript.includes("my-creations.html"));
    assert.ok(appScript.includes("生成历史"));
    assert.equal(appScript.includes('href="./app.html" class="rail-active"'), false);
  });

  it("contains signed-in account navigation state", () => {
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "renderAccountNavigation",
      "account-menu",
      "account-dropdown",
      "account-credit",
      "退出登录",
      "控制台",
      "免费硬币"
    ]) {
      assert.ok(`${appScript}\n${styles}`.includes(expected), `account navigation should include ${expected}`);
    }
  });

  it("contains target-site-style global auth modal", () => {
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "data-auth-modal",
      "openAuthModal",
      "auth-overlay",
      "data-modal-auth-provider=\"google\"",
      "data-modal-auth-provider=\"twitter\"",
      "data-modal-auth-provider=\"telegram\"",
      "data-modal-auth-provider=\"discord\"",
      "startSocialAuth",
      "使用 Google 登录",
      "使用 Discord 登录"
    ]) {
      assert.ok(`${appScript}\n${styles}`.includes(expected), `global auth modal should include ${expected}`);
    }
  });

  it("contains locked tool login gates", () => {
    const combined = [...requiredPages.map(readPage), readPage("app.js"), readPage("styles.css")].join("\n");
    assert.ok(combined.includes("tool-poster art-2 locked"));
    assert.ok(combined.includes("unlock-overlay"));
    assert.ok(combined.includes("登录后解锁此工具"));
    assert.ok(combined.includes("data-unlock-auth=\"google\""));
    assert.ok(combined.includes("data-unlock-auth=\"discord\""));
  });

  it("contains actionable tool detail workbenches", () => {
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "injectToolWorkbench",
      "tool-workbench",
      "tool-upload-zone",
      "data-tool-demo-generate",
      "runToolDemoGeneration",
      "生成演示结果",
      "已保存到资产库和生成历史"
    ]) {
      assert.ok(`${appScript}\n${styles}`.includes(expected), `tool workbench should include ${expected}`);
    }
  });

  it("contains target-site-style floating quick actions", () => {
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "injectFloatingDock",
      "floating-dock",
      "floating-avatar",
      "data-support-widget",
      "openSupportWidget",
      "support-overlay",
      "领取免费硬币",
      "data-scroll-top"
    ]) {
      assert.ok(`${appScript}\n${styles}`.includes(expected), `floating quick actions should include ${expected}`);
    }
  });

  it("contains target-site-style my creations center", () => {
    const creations = readPage("my-creations.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "creation-hero",
      "creation-stats",
      "creation-grid-dynamic",
      "data-creation-list",
      "data-creation-history",
      "复制提示词",
      "重新生成",
      "renderCreations",
      "creation-work-card"
    ]) {
      assert.ok(`${creations}\n${appScript}\n${styles}`.includes(expected), `my creations center should include ${expected}`);
    }
  });

  it("contains actionable character management center", () => {
    const characters = readPage("characters.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "data-character-search",
      "data-character-filter",
      "data-character-profile",
      "data-character-card",
      "data-use-character",
      "data-copy-character",
      "角色记忆",
      "character-action-row",
      "selectedCharacterId"
    ]) {
      assert.ok(`${characters}\n${appScript}\n${styles}`.includes(expected), `character center should include ${expected}`);
    }
  });

  it("contains dynamic rewards and dashboard centers", () => {
    const referral = readPage("referral.html");
    const dashboard = readPage("dashboard.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "data-referral-state",
      "data-referral-progress",
      "data-reward-task",
      "data-claim-task",
      "renderReferral",
      "lastCheckInDate",
      "referralCopies",
      "data-dashboard-recent",
      "data-dashboard-characters",
      "data-dashboard-shares-list",
      "dashboard-row",
      "referral-progress"
    ]) {
      assert.ok(`${referral}\n${dashboard}\n${appScript}\n${styles}`.includes(expected), `reward/dashboard center should include ${expected}`);
    }
  });

  it("contains target-site-style checkout flow without payment API", () => {
    const pricing = readPage("pricing.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "data-buy-credits",
      "data-payment-method",
      "openCheckoutModal",
      "checkout-overlay",
      "checkout-methods",
      "data-checkout-method",
      "data-confirm-checkout",
      "Cash App",
      "Venmo",
      "领取我的 2x 积分",
      "真实支付 API 接入前不会产生扣款"
    ]) {
      assert.ok(`${pricing}\n${appScript}\n${styles}`.includes(expected), `checkout flow should include ${expected}`);
    }
  });

  it("contains target-site-style free coin reward calendar", () => {
    const referral = readPage("referral.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "free-coin-calendar",
      "连续 7 天最多领取 65 积分",
      "Day 7",
      "data-referral-progress",
      "openCheckInModal",
      "inline-calendar"
    ]) {
      assert.ok(`${referral}\n${appScript}\n${styles}`.includes(expected), `free coins page should include ${expected}`);
    }
  });

  it("contains public share conversion actions", () => {
    const share = readPage("share.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "data-share-generate",
      "data-share-copy-prompt",
      "data-share-save",
      "share-conversion",
      "getCurrentShareAsset"
    ]) {
      assert.ok(`${share}\n${appScript}\n${styles}`.includes(expected), `share page should include ${expected}`);
    }
  });

  it("contains visual-first gallery and dashboard sections", () => {
    const gallery = readPage("gallery.html");
    const dashboard = readPage("dashboard.html");
    assert.ok(gallery.includes("masonry-gallery"));
    assert.ok(gallery.includes("data-gallery-title"));
    assert.ok(gallery.includes("data-gallery-prompt"));
    assert.ok(gallery.includes("热门"));
    assert.ok(gallery.includes("生成相似"));
    assert.ok(gallery.includes("复制提示词"));
    assert.ok(gallery.includes("分享"));
    assert.ok(dashboard.includes("积分"));
    assert.ok(dashboard.includes("最近生成"));
    assert.ok(dashboard.includes("任务"));
    assert.ok(dashboard.includes("保存角色"));
    assert.ok(dashboard.includes("分享链接"));
  });

  it("preserves premium AI SaaS positioning over internal-tool language", () => {
    const combined = requiredPages.map(readPage).join("\n");
    assert.ok(combined.includes("AI 视频创作平台"));
    assert.ok(combined.includes("看看你可以创建什么"));
    assert.ok(combined.includes("用一致性角色创建 AI 视频"));
    assert.ok(combined.includes("免费开始生成"));
    assert.ok(combined.includes("图片生成器"));
    assert.ok(combined.includes("角色选择"));
    const appScript = readPage("app.js");
    assert.ok(appScript.includes("side-rail"));
    assert.ok(appScript.includes("VITE_SUPABASE_URL"));
    assert.ok(appScript.includes("openCheckInModal"));
    assert.equal(combined.includes("PAGE-003"), false);
    assert.equal(combined.includes("internal engineering"), false);
    assert.equal(combined.includes("Fake worker"), false);
  });

  it("keeps static product files UTF-8-safe to avoid encoding mojibake", () => {
    const staticFiles = [...requiredPages, "styles.css", "app.js"];
    for (const file of staticFiles) {
      const content = readPage(file);
      assert.equal(/閳鈶﹟鈧瑋锟絴脗|脙|鐧诲綍|鍥惧儚|绉垎/.test(content), false, `${file} should not contain mojibake markers`);
    }
  });
});
