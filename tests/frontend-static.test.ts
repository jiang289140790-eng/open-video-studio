import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const webRoot = join(process.cwd(), "apps", "web");
const publicRoot = join(webRoot, "public");

const requiredPages = [
  "index.html",
  "app.html",
  "gallery.html",
  "generate.html",
  "image-to-video.html",
  "characters.html",
  "assets.html",
  "campaigns.html",
  "ai-studio.html",
  "pipeline.html",
  "queue.html",
  "accounts.html",
  "calendar.html",
  "analytics.html",
  "publishing.html",
  "automation.html",
  "settings.html",
  "history.html",
  "dashboard.html",
  "pricing.html",
  "free-coins.html",
  "referral.html",
  "my-creations.html",
  "image-tools.html",
  "video-tools.html",
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
  "share.html",
  "admin.html"
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

  it("uses real homepage visual assets instead of CSS-only placeholders", () => {
    const index = readPage("index.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    const homepageAssets = [
      "ovs-home-01.png",
      "ovs-home-02.png",
      "ovs-home-03.png",
      "ovs-home-04.png",
      "ovs-home-05.png",
      "ovs-home-06.png",
      "ovs-home-07.png",
      "ovs-home-08.png",
      "ovs-home-09.png",
      "ovs-home-10.png",
      "ovs-home-11.png",
      "ovs-home-12.png"
    ];
    for (const asset of homepageAssets) {
      assert.equal(existsSync(join(publicRoot, "home-assets", asset)), true, `${asset} should be available to the deployed site`);
      assert.ok(`${index}\n${appScript}`.includes(`./home-assets/${asset}`), `${asset} should be referenced by the homepage surface`);
    }
    assert.ok(index.includes("has-image"));
    assert.ok(styles.includes("--card-image"));
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
      "data-tool-discovery",
      "data-tool-template-card",
      "data-tool-related",
      "data-tool-route",
      "data-tool-home-filter",
      "data-tool-home-search",
      "renderToolHomeDirectory",
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
      "data-dashboard-campaigns",
      "data-dashboard-pipeline",
      "data-dashboard-scheduled",
      "data-dashboard-failed",
      "data-dashboard-volume",
      "data-dashboard-traffic",
      "data-dashboard-top-content",
      "data-dashboard-account-attention",
      "data-campaign-form",
      "data-campaign-list",
      "data-ai-studio-form",
      "data-ai-studio-output",
      "Image Placeholder",
      "Video Placeholder",
      "Thumbnail",
      "Platform Versions",
      "platform-version-card",
      "data-pipeline-board",
      "data-pipeline-move",
      "data-content-queue",
      "data-queue-filter",
      "data-social-account-form",
      "data-social-account-list",
      "data-content-calendar",
      "data-content-analytics-summary",
      "data-content-analytics-list",
      "data-publishing-list",
      "data-publishing-filter",
      "data-automation-form",
      "data-automation-list",
      "data-content-settings-form",
      "data-content-settings-preview",
      "data-admin-kpi",
      "data-admin-kpi-new-users",
      "data-admin-revenue-trend",
      "Worker Center",
      "data-admin-workers",
      "data-admin-operating-insights",
      "data-admin-tool-version-list",
      "data-admin-workflow-form",
      "data-admin-workflow-preview",
      "data-admin-workflow-preview-list",
      "data-admin-workflow-switchboard",
      "data-admin-workflow-switch",
      "runAdminWorkflowSwitch",
      "applyWorkflowSwitch",
      "后台 Workflow 快捷开关",
      "data-admin-prompt-form",
      "data-admin-prompt-preview",
      "data-admin-prompt-preview-list",
      "data-admin-intelligence-form",
      "data-admin-intelligence-preview",
      "data-admin-intelligence-preview-list",
      "data-admin-agent-form",
      "data-admin-agent-preview",
      "data-admin-agent-preview-list",
      "data-admin-cost-analytics",
      "Workflow Center",
      "Prompt 管理",
      "renderContentOperatingSystem",
      "openCheckoutModal",
      "checkout-overlay",
      "data-checkout-method",
      "data-confirm-checkout",
      "data-checkout-promo",
      "登录开始签到 →",
      "data-auth-modal",
      "openAuthModal",
      "data-modal-auth-provider",
      "startSocialAuth",
      "auth-overlay",
      "data-share-generate",
      "data-share-copy-prompt",
      "data-share-save",
      "getCurrentShareAsset",
      "data-protected-gate",
      "renderProtectedPageGate",
      "data-cookie-banner",
      "data-cookie-manage",
      "COOKIE_PREF_KEY",
      "injectCarouselControls",
      "data-carousel-scroll"
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

  it("contains target-site-style image and video tool category pages", () => {
    const imageTools = readPage("image-tools.html");
    const videoTools = readPage("video-tools.html");
    const appScript = readPage("app.js");
    const viteConfig = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");
    const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
    for (const expected of [
      "image-tools.html",
      "video-tools.html",
      "全部图像工具",
      "全部视频工具",
      "data-tool-home-filter",
      "data-tool-home-search",
      "tool-category-page",
      "图片编辑器",
      "图片转视频",
      "选择资产",
      "查看历史"
    ]) {
      assert.ok(`${imageTools}\n${videoTools}\n${appScript}\n${viteConfig}`.includes(expected), `tool category pages should include ${expected}`);
    }
  });

  it("contains target-site-style zh route aliases", () => {
    const zhAliases = [
      ["zh/app/index.html", "../../app.html"],
      ["zh/image-tools/index.html", "../../image-tools.html"],
      ["zh/video-tools/index.html", "../../video-tools.html"],
      ["zh/pricing/index.html", "../../pricing.html"],
      ["zh/free-coins/index.html", "../../free-coins.html"],
      ["zh/my-creations/index.html", "../../my-creations.html"],
      ["zh/login/index.html", "../../signin.html"],
      ["zh/account/index.html", "../../dashboard.html"],
      ["zh/dashboard/index.html", "../../dashboard.html"],
      ["zh/gallery/index.html", "../../gallery.html"],
      ["zh/assets/index.html", "../../assets.html"],
      ["zh/campaigns/index.html", "../../campaigns.html"],
      ["zh/ai-studio/index.html", "../../ai-studio.html"],
      ["zh/pipeline/index.html", "../../pipeline.html"],
      ["zh/queue/index.html", "../../queue.html"],
      ["zh/accounts/index.html", "../../accounts.html"],
      ["zh/calendar/index.html", "../../calendar.html"],
      ["zh/analytics/index.html", "../../analytics.html"],
      ["zh/publishing/index.html", "../../publishing.html"],
      ["zh/automation/index.html", "../../automation.html"],
      ["zh/settings/index.html", "../../settings.html"],
      ["zh/history/index.html", "../../history.html"],
      ["zh/share/index.html", "../../share.html"],
      ["zh/admin/index.html", "../../admin.html"],
      ["zh/blog/index.html", "../../blog.html"],
      ["zh/terms/index.html", "../../terms.html"],
      ["zh/privacy/index.html", "../../privacy.html"],
      ["zh/cookie/index.html", "../../cookie.html"]
    ];
    const redirectScript = readFileSync(join(publicRoot, "zh", "redirect.js"), "utf8");
    assert.ok(redirectScript.includes("window.location.replace"));
    assert.ok(redirectScript.includes("window.location.search"));
    assert.ok(redirectScript.includes("window.location.hash"));
    for (const [alias, target] of zhAliases) {
      const aliasPath = join(publicRoot, alias);
      assert.equal(existsSync(aliasPath), true, `${alias} should exist`);
      const html = readFileSync(aliasPath, "utf8");
      assert.ok(html.includes('lang="zh-CN"'), `${alias} should declare Chinese language`);
      assert.ok(html.includes(target), `${alias} should redirect to ${target}`);
      assert.ok(html.includes("../redirect.js"), `${alias} should use shared zh redirect script`);
    }
  });

  it("contains target-site-style zh app tool route aliases", () => {
    const toolAliases = [
      ["zh/app/image-editor/index.html", "../../../image-editor.html"],
      ["zh/app/face-swap/index.html", "../../../face-swap.html"],
      ["zh/app/outfit-studio/index.html", "../../../outfit-studio.html"],
      ["zh/app/pose-generator/index.html", "../../../pose-generator.html"],
      ["zh/app/nano-banana/index.html", "../../../nano-banana.html"],
      ["zh/app/image-combiner/index.html", "../../../image-combiner.html"],
      ["zh/app/ai-effects/index.html", "../../../ai-effects.html"],
      ["zh/app/generate/index.html", "../../../generate.html"],
      ["zh/app/characters/index.html", "../../../characters.html"],
      ["zh/app/image-to-video/index.html", "../../../image-to-video.html"]
    ];
    for (const [alias, target] of toolAliases) {
      const aliasPath = join(publicRoot, alias);
      assert.equal(existsSync(aliasPath), true, `${alias} should exist`);
      const html = readFileSync(aliasPath, "utf8");
      assert.ok(html.includes('lang="zh-CN"'), `${alias} should declare Chinese language`);
      assert.ok(html.includes(target), `${alias} should redirect to ${target}`);
      assert.ok(html.includes("../../redirect.js"), `${alias} should use shared zh redirect script`);
    }
  });

  it("uses target-site-style localized click routes on primary discovery surfaces", () => {
    const surfaces = ["app.html", "image-tools.html", "video-tools.html"].map(readPage).join("\n");
    const appScript = readPage("app.js");
    for (const expected of [
      "./zh/image-tools/",
      "./zh/video-tools/",
      "./zh/app/image-editor/",
      "./zh/app/face-swap/",
      "./zh/app/outfit-studio/",
      "./zh/app/pose-generator/",
      "./zh/app/nano-banana/",
      "./zh/app/image-combiner/",
      "./zh/app/generate/",
      "./zh/app/characters/",
      "./zh/app/image-to-video/",
      "./zh/pricing/",
      "./zh/free-coins/",
      "./zh/my-creations/",
      "./zh/login/",
      "./zh/gallery/"
    ]) {
      assert.ok(`${surfaces}\n${appScript}`.includes(expected), `primary click routes should include ${expected}`);
    }
    for (const oldHref of [
      'href="./image-editor.html"',
      'href="./image-to-video.html"',
      'href="./image-tools.html"',
      'href="./video-tools.html"',
      'href="./pricing.html"',
      'href="./free-coins.html"',
      'href="./signin.html"',
      'href="./gallery.html"'
    ]) {
      assert.equal(surfaces.includes(oldHref), false, `primary discovery pages should not expose ${oldHref}`);
    }
  });

  it("uses localized click routes across root static product pages", () => {
    const pages = requiredPages.map(readPage).join("\n");
    for (const oldHref of [
      'href="./app.html"',
      'href="./image-tools.html"',
      'href="./video-tools.html"',
      'href="./image-editor.html"',
      'href="./face-swap.html"',
      'href="./outfit-studio.html"',
      'href="./pose-generator.html"',
      'href="./nano-banana.html"',
      'href="./image-combiner.html"',
      'href="./ai-effects.html"',
      'href="./generate.html"',
      'href="./characters.html"',
      'href="./image-to-video.html"',
      'href="./pricing.html"',
      'href="./free-coins.html"',
      'href="./referral.html"',
      'href="./my-creations.html"',
      'href="./blog.html"',
      'href="./terms.html"',
      'href="./privacy.html"',
      'href="./cookie.html"',
      'href="./signin.html"',
      'href="./dashboard.html"',
      'href="./admin.html"',
      'href="./gallery.html"',
      'href="./assets.html"',
      'href="./history.html"',
      'href="./share.html"'
    ]) {
      assert.equal(pages.includes(oldHref), false, `root product pages should not expose ${oldHref}`);
    }
  });

  it("contains target-site-style top navigation dropdowns", () => {
    const appScript = readPage("app.js");
    for (const expected of [
      "nav-menu",
      "nav-dropdown",
      "language-menu",
      "language-dropdown",
      "applyStoredLanguage",
      "showSiteToast",
      "aria-pressed",
      "aria-expanded",
      "toggleDropdownMenu",
      "closeOpenMenus",
      "is-open",
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

  it("contains target-site-style tool directory filtering", () => {
    const appHome = readPage("app.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "data-tool-home-filter=\"hot\"",
      "data-tool-home-filter=\"new\"",
      "data-tool-home-filter=\"image\"",
      "data-tool-home-filter=\"video\"",
      "data-tool-home-filter=\"character\"",
      "data-tool-home-search",
      "data-tool-home-card",
      "data-tool-home-empty",
      "renderToolHomeDirectory",
      "tool-directory-bar",
      "tool-filter-tabs"
    ]) {
      assert.ok(`${appHome}\n${appScript}\n${styles}`.includes(expected), `tool directory should include ${expected}`);
    }
  });

  it("contains target-site-style carousel controls", () => {
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "injectCarouselControls",
      "data-carousel-controls",
      "data-carousel-scroll",
      "data-carousel-id",
      "carousel-controls",
      "scrollBy"
    ]) {
      assert.ok(`${appScript}\n${styles}`.includes(expected), `carousel controls should include ${expected}`);
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

  it("contains target-site-style protected account page gates", () => {
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "PROTECTED_PRODUCT_PAGES",
      "renderProtectedPageGate",
      "data-protected-gate",
      "需要登录",
      "登录 / 注册",
      "protected-gate",
      "protected-gate-actions"
    ]) {
      assert.ok(`${appScript}\n${styles}`.includes(expected), `protected pages should include ${expected}`);
    }
  });

  it("contains target-site-style cookie preference controls", () => {
    const cookie = readPage("cookie.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "COOKIE_PREF_KEY",
      "renderCookieBanner",
      "openCookiePreferences",
      "data-cookie-banner",
      "data-cookie-manage",
      "data-cookie-essential",
      "data-cookie-accept",
      "data-cookie-save",
      "cookie-preferences-modal",
      "cookie-banner-actions",
      "管理 Cookie 偏好"
    ]) {
      assert.ok(`${cookie}\n${appScript}\n${styles}`.includes(expected), `cookie preferences should include ${expected}`);
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

  it("contains production-readiness surfaces for auth, i18n, admin, moderation, and orders", () => {
    const admin = readPage("admin.html");
    const signin = readPage("signin.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    const viteConfig = readFileSync(join(process.cwd(), "vite.config.ts"), "utf8");
    const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
    const adminFunction = readFileSync(join(process.cwd(), "supabase", "functions", "admin", "index.ts"), "utf8");
    const supabaseConfig = readFileSync(join(process.cwd(), "supabase", "config.toml"), "utf8");
    const adminMigration = readFileSync(join(process.cwd(), "supabase", "migrations", "202607070001_mvp_admin_console.sql"), "utf8");
    for (const expected of [
      "data-oauth-readiness",
      "getOAuthReadiness",
      "I18N_MESSAGES",
      "I18N_LOCALES",
      "I18N_CORE_TERMS",
      "I18N_PRODUCT_TERMS",
      "I18N_ATTRIBUTE_MESSAGES",
      "I18N_ORIGINAL_TEXT",
      "I18N_ORIGINAL_ATTRS",
      "translateStaticText",
      "translateStaticAttributes",
      "getI18nCoverage",
      "verify:i18n",
      "i18nCoverage",
      "workflowRolloutHint",
      "data-admin-oauth",
      "data-admin-page",
      "data-admin-access",
      "data-admin-users",
      "data-admin-credit-form",
      "data-admin-assets",
      "data-admin-jobs",
      "data-admin-shares",
      "data-admin-audit",
      "data-admin-orders",
      "data-admin-health",
      "renderAdminSystemReadiness",
      "providerReadinessDetail",
      "AI Provider 实时状态",
      "verify:real-ai",
      "Supabase OAuth",
      "oauth-provider-status",
      "入口可见",
      "provider-status",
      "Provider 阻塞",
      "data-admin-page-builder-form",
      "data-admin-tool-catalog-form",
      "data-admin-page-builder-visual",
      "data-admin-tool-catalog-visual",
      "data-page-builder-page",
      "data-page-builder-module",
      "data-tool-catalog-item",
      "admin-tool-config-card",
      "data-tool-workflow",
      "stopAdminControlEvent",
      "stopImmediatePropagation",
      "get-page-builder-config",
      "get-tool-catalog-config",
      "update-page-builder-config",
      "update-tool-catalog-config",
      "loadPageBuilderConfig",
      "loadToolCatalogConfig",
      "applyPageBuilderConfig",
      "applyToolCatalogConfig",
      "data-admin-display-style",
      "data-tool-config-meta",
      "renderAdmin",
      "loadAdminConsole",
      "invokeAdmin",
      "adjust-credits",
      "review-asset",
      "revoke-share-link",
      "audit_logs",
      "orders",
      "moderation",
      "admin.html",
      "admin-status-grid",
      "oauth-readiness-panel"
    ]) {
      assert.ok(`${admin}\n${signin}\n${appScript}\n${styles}\n${viteConfig}\n${packageJson}\n${adminFunction}\n${supabaseConfig}\n${adminMigration}`.includes(expected), `production-readiness surface should include ${expected}`);
    }
    assert.ok(supabaseConfig.includes('project_id = "wyvswkxogkmywduhrhkw"'));
    assert.ok(supabaseConfig.includes("[functions.admin]"));
    assert.ok(adminMigration.includes("create table if not exists public.audit_logs"));
    assert.ok(adminMigration.includes("current_profile_role"));
    for (const expected of [
      "管理后台",
      "运营管理后台",
      "用户管理",
      "积分管理",
      "订单履约",
      "内容审核",
      "生成任务",
      "分享链接",
      "首页内容管理",
      "系统配置",
      "审计日志",
      "页面模块管理",
      "AI 工具上架管理",
      "高级批量编辑",
      "展示方式",
      "卡片数",
      "服务商",
      "模型",
      "积分",
      "admin-sidebar",
      "admin-command-center",
      "admin-workspace"
    ]) {
      assert.ok(admin.includes(expected), `admin page should include ${expected}`);
    }
    assert.equal(admin.includes("\u7ba1\uff24\u60ca"), false);
  });

  it("ships local original preview assets instead of only CSS placeholders", () => {
    for (const asset of [
      "assets/previews/character-studio.svg",
      "assets/previews/product-video.svg",
      "assets/previews/fashion-scene.svg",
      "assets/previews/cinematic-portrait.svg"
    ]) {
      assert.equal(existsSync(join(publicRoot, asset)), true, `${asset} should exist`);
      assert.equal(existsSync(join(webRoot, "src", asset)), true, `src/${asset} should exist`);
    }
    const styles = readPage("styles.css");
    assert.ok(styles.includes('url("./src/assets/previews/product-video.svg")'));
    assert.ok(styles.includes('url("./src/assets/previews/character-studio.svg")'));
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
      "injectToolDiscovery",
      "data-tool-discovery",
      "data-tool-template-card",
      "data-tool-related",
      "tool-template-gallery",
      "tool-usecase-band",
      "tool-conversion-strip",
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
    const referral = readPage("free-coins.html");
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
      "Top performing content",
      "Accounts needing attention",
      "Content volume",
      "Social traffic",
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
    const referral = readPage("free-coins.html");
    const appScript = readPage("app.js");
    const styles = readPage("styles.css");
    for (const expected of [
      "free-coin-calendar",
      "连续 7 天最多领取 65 积分",
      "Day 7",
      "data-referral-progress",
      "openCheckInModal",
      "登录即可立即获得 10 免费积分",
      "登录开始签到 →",
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
      assert.equal(/(\u95b3|\u9236|\u9207|\u8119|\u9427|\u934f|\u7ec9|\u935a|\u7ba1\uff24\u60ca|\u9422|\u7481|\u941f|\u9352|\u68e3|\u7039|\u939c)/.test(content), false, `${file} should not contain mojibake markers`);
    }
  });
});
