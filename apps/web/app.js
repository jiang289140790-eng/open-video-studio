import { createClient } from "@supabase/supabase-js";

const STORE_KEY = "ovs_mvp_state_v1";
const APP_SHELL_PAGES = new Set([
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
  "cookie.html"
]);
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "";
const telegramAuthUrl = import.meta.env.VITE_TELEGRAM_AUTH_URL || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const defaultState = {
  user: null,
  credits: 40,
  characters: [
    { id: "char_mira", name: "Mira", role: "工作室主持人", tags: ["发布", "工作室", "冷静"], score: 92, status: "active", favorite: true, memory: "稳定的工作室主持人，适合产品讲解、发布短片和品牌介绍。" },
    { id: "char_atlas", name: "Atlas", role: "产品讲解员", tags: ["产品", "干净"], score: 88, status: "active", favorite: false, memory: "商业产品讲解员，表达清晰，画面干净。" },
    { id: "char_nova", name: "Nova", role: "创作者形象", tags: ["时尚", "霓虹"], score: 95, status: "draft", favorite: false, memory: "适合时尚、霓虹、竖屏内容的创作者形象。" }
  ],
  assets: [
    { id: "asset_launch", type: "image", title: "发布主视觉", prompt: "紫色灯光下的电影感产品发布", character: "Mira", credits: 8, status: "completed", visibility: "private", favorite: true },
    { id: "asset_teaser", type: "video", title: "竖屏短片", prompt: "把主视觉转成社媒短片", character: "Mira", credits: 24, status: "completed", visibility: "public", favorite: false }
  ],
  history: [
    { id: "job_launch", type: "image", title: "产品发布主视觉", prompt: "紫色灯光下的电影感产品发布", provider: "local_api", model: "local-image-v0", status: "completed", credits: 8, duration: "18s", assetId: "asset_launch" },
    { id: "job_teaser", type: "video", title: "竖屏短片", prompt: "把主视觉转成社媒短片", provider: "local_api", model: "local-video-v0", status: "completed", credits: 24, duration: "8s", assetId: "asset_teaser" }
  ],
  shares: [
    { id: "share_teaser", token: "demo-share", assetId: "asset_teaser", title: "Vertical teaser" }
  ],
  rewards: {
    checkInDay: 0,
    lastCheckInDate: "",
    referralCopies: 0,
    taskClaims: []
  }
};

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return parsed ? { ...defaultState, ...parsed } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState(state) {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  renderState(state);
}

const state = loadState();
state.characters = state.characters.map((character) => ({
  status: "active",
  favorite: false,
  memory: `${character.role || "创意角色"}，保持视觉和提示词一致。`,
  ...character
}));
state.rewards = {
  checkInDay: 0,
  lastCheckInDate: "",
  referralCopies: 0,
  taskClaims: [],
  ...(state.rewards || {})
};
let selectedCharacterId = state.characters[0]?.id || "";

injectTopNavigation();
injectAppShell();
injectToolWorkbench();
injectToolDiscovery();
injectFloatingDock();
injectGlobalFooter();
hydrateAuthSession();

function injectTopNavigation() {
  const topnav = document.querySelector(".topnav");
  const accountnav = document.querySelector(".accountnav");
  if (topnav && !topnav.querySelector(".nav-menu")) {
    topnav.innerHTML = `
      <div class="nav-menu">
        <button class="nav-trigger" type="button">图像工具 <span>⌄</span></button>
        <div class="nav-dropdown">
          <a href="./image-editor.html"><strong>图片编辑器</strong><small>重绘、扩图、局部修复</small></a>
          <a href="./face-swap.html"><strong>AI 换脸</strong><small>授权角色替换</small></a>
          <a href="./outfit-studio.html"><strong>造型工作室</strong><small>服装、场景和品牌造型</small></a>
          <a href="./pose-generator.html"><strong>姿势生成器</strong><small>动作、镜头和分镜参考</small></a>
          <a href="./nano-banana.html"><strong>Nano Banana</strong><small>快速创意实验</small></a>
          <a href="./image-combiner.html"><strong>图像组合器</strong><small>多图参考合成</small></a>
        </div>
      </div>
      <div class="nav-menu">
        <button class="nav-trigger" type="button">视频工具 <span>⌄</span></button>
        <div class="nav-dropdown compact-dropdown">
          <a href="./image-to-video.html"><strong>图片转视频</strong><small>把静态资产转成短视频</small></a>
          <a href="./history.html"><strong>生成历史</strong><small>查看任务、成本和输出</small></a>
          <a href="./my-creations.html"><strong>我的创作</strong><small>管理生成作品</small></a>
        </div>
      </div>
      <a href="./pricing.html">购买积分</a>
      <a href="./referral.html">免费硬币</a>
      <a href="./my-creations.html">我的创作</a>
    `;
  }
  if (accountnav && !accountnav.querySelector(".language-menu")) {
    accountnav.innerHTML = `
      <a class="daily-check" href="./referral.html">🎁 每日签到</a>
      <div class="language-menu">
        <button class="language-trigger" type="button" aria-label="切换语言">文A</button>
        <div class="language-dropdown">
          <button type="button" data-language="zh-CN">简体中文</button>
          <button type="button" data-language="en">English</button>
          <button type="button" data-language="ja">日本語</button>
          <button type="button" data-language="ko">한국어</button>
        </div>
      </div>
      <a href="./signin.html" data-auth-modal>登录</a>
    `;
  }
}

function languageMenuMarkup() {
  return `
    <div class="language-menu">
      <button class="language-trigger" type="button" aria-label="切换语言">文A</button>
      <div class="language-dropdown">
        <button type="button" data-language="zh-CN">简体中文</button>
        <button type="button" data-language="en">English</button>
        <button type="button" data-language="ja">日本語</button>
        <button type="button" data-language="ko">한국어</button>
      </div>
    </div>
  `;
}

function renderAccountNavigation(current) {
  const accountnav = document.querySelector(".accountnav");
  if (!accountnav) return;
  if (!current.user) {
    accountnav.innerHTML = `
      <a class="daily-check" href="./referral.html">🎁 每日签到</a>
      ${languageMenuMarkup()}
      <a href="./signin.html" data-auth-modal>登录</a>
    `;
    return;
  }
  const initial = (current.user.name || "创作者").trim().charAt(0).toUpperCase();
  accountnav.innerHTML = `
    <a class="daily-check" href="./referral.html">🎁 每日签到</a>
    <a class="account-credit" href="./pricing.html"><span data-credit-balance>${current.credits}</span> 积分</a>
    ${languageMenuMarkup()}
    <div class="account-menu">
      <button class="account-trigger" type="button"><span>${initial}</span><b data-user-name>${current.user.name}</b></button>
      <div class="account-dropdown">
        <a href="./dashboard.html">控制台</a>
        <a href="./my-creations.html">我的创作</a>
        <a href="./history.html">生成历史</a>
        <a href="./assets.html">资产库</a>
        <a href="./referral.html">免费硬币</a>
        <a href="./pricing.html">购买积分</a>
        <button type="button" data-logout>退出登录</button>
      </div>
    </div>
  `;
}

function injectAppShell() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  if (!APP_SHELL_PAGES.has(page) || document.querySelector(".side-rail")) return;
  const active = (target) => page === target ? " rail-active" : "";
  document.body.classList.add("tool-layout");
  document.body.insertAdjacentHTML("afterbegin", `
    <aside class="side-rail" aria-label="Product tools">
      <a class="rail-brand" href="./index.html"><span>ovs.ai</span><strong>Open Video Studio</strong></a>
      <nav class="rail-nav">
        <a href="./app.html" class="${active("app.html")}">首页</a>
        <a href="./gallery.html" class="${active("gallery.html")}">热门作品</a>
        <a href="./ai-effects.html" class="${active("ai-effects.html")}">AI 特效 <em>HOT</em></a>
        <span>AI 图像</span>
        <a href="./image-editor.html" class="${active("image-editor.html")}">图片编辑器</a>
        <a href="./face-swap.html" class="${active("face-swap.html")}">AI 换脸</a>
        <a href="./outfit-studio.html" class="${active("outfit-studio.html")}">造型工作室</a>
        <a href="./pose-generator.html" class="${active("pose-generator.html")}">姿势生成器</a>
        <a href="./nano-banana.html" class="${active("nano-banana.html")}">Nano Banana</a>
        <a href="./image-combiner.html" class="${active("image-combiner.html")}">图像组合器</a>
        <a href="./generate.html" class="${active("generate.html")}">图片生成器</a>
        <a href="./characters.html" class="${active("characters.html")}">角色生成器</a>
        <a href="./assets.html" class="${active("assets.html")}">资产库</a>
        <span>AI 视频</span>
        <a href="./image-to-video.html" class="${active("image-to-video.html")}">图片转视频</a>
        <a href="./my-creations.html" class="${active("my-creations.html")}">我的创作</a>
        <a href="./history.html" class="${active("history.html")}">生成历史</a>
      </nav>
      <div class="rail-actions">
        <a href="./referral.html">推荐好友</a>
        <a class="rail-upgrade" href="./pricing.html">立即升级</a>
      </div>
    </aside>
  `);
}

function injectGlobalFooter() {
  if (document.querySelector(".site-footer") || document.body.classList.contains("share-body")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer app-footer" aria-label="Footer navigation">
      <div class="footer-top-links">
        <a href="./app.html">首页</a>
        <a href="./image-editor.html">图片编辑器</a>
        <a href="./ai-effects.html">AI 特效</a>
        <a href="./image-to-video.html">AI 视频</a>
        <a href="./gallery.html">作品探索</a>
      </div>
      <div>
        <h3>图像工具</h3>
        <a href="./image-editor.html">图片编辑器</a>
        <a href="./face-swap.html">AI 换脸</a>
        <a href="./outfit-studio.html">造型工作室</a>
        <a href="./pose-generator.html">姿势生成器</a>
        <a href="./nano-banana.html">Nano Banana</a>
        <a href="./image-combiner.html">图像组合器</a>
      </div>
      <div>
        <h3>视频工具</h3>
        <a href="./image-to-video.html">图片转视频</a>
        <a href="./history.html">生成历史</a>
        <a href="./my-creations.html">我的创作</a>
      </div>
      <div>
        <h3>About Us</h3>
        <a href="./blog.html">Blog</a>
        <a href="./pricing.html">价格</a>
        <a href="./referral.html">推荐</a>
        <a href="./terms.html">Terms</a>
        <a href="./privacy.html">Privacy</a>
        <a href="./cookie.html">Cookie</a>
      </div>
      <div>
        <p>支持：support@openvideostudio.app</p>
        <p>商务：business@openvideostudio.app</p>
        <p>版权所有 © 2026</p>
      </div>
    </footer>
  `);
}

function injectFloatingDock() {
  if (document.querySelector(".floating-dock") || document.body.classList.contains("share-body")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="floating-dock" aria-label="Quick actions">
      <button class="floating-action daily-check" type="button" aria-label="每日签到"><span>🎁</span></button>
      <a class="floating-action" href="./referral.html" aria-label="免费硬币"><span>币</span></a>
      <button class="floating-action" type="button" data-support-widget aria-label="帮助"><span>?</span></button>
      <button class="floating-avatar" type="button" data-support-widget aria-label="客服头像"><span>OVS</span></button>
      <button class="floating-action to-top" type="button" data-scroll-top aria-label="返回顶部"><span>↑</span></button>
    </aside>
  `);
}

function injectToolWorkbench() {
  const hero = document.querySelector(".tool-detail-hero");
  if (!hero || document.querySelector("[data-tool-workbench]")) return;
  const toolName = document.querySelector(".tool-detail-copy h1")?.textContent?.trim() || "AI 工具";
  hero.insertAdjacentHTML("afterend", `
    <section class="tool-workbench" data-tool-workbench>
      <div class="tool-input-panel">
        <div class="tool-section-head">
          <div>
            <p class="eyebrow">Create</p>
            <h2>${toolName} 工作台</h2>
          </div>
          <span class="credit-pill"><b data-credit-balance>${state.credits}</b> 积分</span>
        </div>
        <label class="tool-upload-zone">
          <input type="file" accept="image/*,video/*">
          <strong>上传参考图片或视频帧</strong>
          <span>支持角色图、产品图、场景图和参考风格。</span>
        </label>
        <div class="tool-mode-tabs" role="tablist" aria-label="Tool modes">
          <button class="active" type="button">标准</button>
          <button type="button">高质量</button>
          <button type="button">批量</button>
        </div>
        <label class="studio-field">
          <span>提示词</span>
          <textarea class="hero-textarea" data-tool-prompt rows="5">生成一个干净、电影感、适合社媒传播的 AI 创作结果，保持角色和品牌视觉一致。</textarea>
        </label>
        <div class="selector-grid">
          <label>风格<select><option>电影感</option><option>商业广告</option><option>社媒短片</option><option>产品展示</option></select></label>
          <label>比例<select><option>9:16</option><option>1:1</option><option>16:9</option><option>4:5</option></select></label>
        </div>
        <button class="btn primary full" type="button" data-tool-demo-generate>生成演示结果</button>
      </div>
      <div class="tool-output-panel">
        <div class="tool-preview-canvas art-7" data-tool-demo-preview></div>
        <div class="tool-output-status" data-tool-demo-status>
          <strong>等待生成</strong>
          <span>生成结果会保存到资产库和生成历史。</span>
        </div>
        <div class="tool-template-row">
          <button type="button" data-template-prompt="产品发布主视觉，霓虹灯光，干净背景">产品发布</button>
          <button type="button" data-template-prompt="角色封面图，电影感人像，清晰构图">角色封面</button>
          <button type="button" data-template-prompt="社媒短视频封面，强对比色，高级质感">社媒封面</button>
        </div>
      </div>
    </section>
  `);
}

function injectToolDiscovery() {
  const page = document.querySelector(".tool-detail-page");
  if (!page || document.querySelector("[data-tool-discovery]")) return;
  const toolName = document.querySelector(".tool-detail-copy h1")?.textContent?.trim() || "AI 工具";
  const isVideo = toolName.includes("视频");
  const relatedTools = [
    ["图片编辑器", "重绘、扩图、修复参考图", "image-editor.html", "art-3"],
    ["AI 换脸", "授权角色替换与一致性", "face-swap.html", "art-2"],
    ["造型工作室", "角色服装和场景风格", "outfit-studio.html", "art-11"],
    ["姿势生成器", "动作、镜头和分镜参考", "pose-generator.html", "art-10"],
    ["图像组合器", "多张资产合成主视觉", "image-combiner.html", "art-9"],
    ["图片转视频", "把图像变成短视频资产", "image-to-video.html", "art-7"]
  ].filter((item) => !toolName.includes(item[0])).slice(0, 5);

  page.insertAdjacentHTML("beforeend", `
    <section class="tool-template-gallery" data-tool-discovery>
      <div class="tool-section-head">
        <div>
          <p class="eyebrow">模板库</p>
          <h2>${toolName} 热门模板</h2>
        </div>
        <a href="./pricing.html">购买积分</a>
      </div>
      <div class="tool-template-grid">
        ${[
          ["品牌主视觉", "适合广告图、活动头图和产品发布", "品牌发布主视觉，电影感灯光，清晰主体，适合商业投放", "art-1"],
          ["角色封面", "保持角色一致，生成可复用人物资产", "一致性角色封面，干净背景，高级摄影棚质感", "art-2"],
          ["社媒短片", "竖屏节奏、强对比封面和可分享资产", "竖屏社媒短片封面，强视觉中心，适合视频发布", "art-13"],
          ["产品场景", "把产品放入真实可传播的使用场景", "产品生活方式场景，真实光影，现代室内，商业摄影", "art-6"]
        ].map(([title, desc, prompt, art]) => `
          <button class="tool-template-card ${art}" type="button" data-template-prompt="${prompt}" data-tool-template-card>
            <strong>${title}</strong>
            <span>${desc}</span>
          </button>
        `).join("")}
      </div>
    </section>
    <section class="tool-usecase-band">
      <article><span>01</span><strong>${isVideo ? "从图片进入视频" : "上传或选择资产"}</strong><p>${isVideo ? "选择图片、角色或产品图，进入短视频生成流程。" : "从本地上传或从资产库选择参考图，保持创作素材可复用。"}</p></article>
      <article><span>02</span><strong>选择模板并调整提示词</strong><p>用模板快速起步，再改角色、风格、比例和输出用途。</p></article>
      <article><span>03</span><strong>保存到我的创作</strong><p>演示生成会进入资产、历史和分享链路，方便继续复用。</p></article>
    </section>
    <section class="tool-related-section" data-tool-related>
      <div class="tool-section-head">
        <div>
          <p class="eyebrow">继续创作</p>
          <h2>相关工具</h2>
        </div>
        <a href="./app.html">返回工具首页</a>
      </div>
      <div class="card-carousel compact">
        ${relatedTools.map(([title, desc, href, art]) => `
          <a class="tool-poster ${art}" href="./${href}" data-tool-route="${href}">
            <strong>${title}</strong>
            <span>${desc}</span>
          </a>
        `).join("")}
      </div>
    </section>
    <section class="tool-conversion-strip">
      <div>
        <p class="eyebrow">创作额度</p>
        <h2>生成结果会保存为可复用资产</h2>
        <p class="muted">登录后可同步角色、素材库、历史记录、分享链接和积分余额。</p>
      </div>
      <div class="tool-conversion-actions">
        <a class="btn primary" href="./signin.html" data-auth-modal>登录继续</a>
        <a class="btn glass" href="./referral.html">领取免费硬币</a>
      </div>
    </section>
  `);
}

async function hydrateAuthSession() {
  if (!supabase) {
    renderState(state);
    return;
  }
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    state.user = {
      id: data.session.user.id,
      name: String(data.session.user.user_metadata?.display_name || data.session.user.email || "创作者"),
      email: data.session.user.email || "",
      provider: "supabase",
      createdAt: data.session.user.created_at || new Date().toISOString()
    };
    saveState(state);
  } else {
    renderState(state);
  }
}

function ensureUser(provider = "email") {
  if (!state.user) {
    state.user = {
      id: "user_demo",
      name: provider === "email" ? "演示创作者" : `${capitalize(provider)} 创作者`,
      provider,
      createdAt: new Date().toISOString()
    };
  }
  saveState(state);
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function renderState(current) {
  renderAccountNavigation(current);
  document.querySelectorAll("[data-credit-balance]").forEach((node) => {
    node.textContent = String(current.credits);
  });
  document.querySelectorAll("[data-user-name]").forEach((node) => {
    node.textContent = current.user ? current.user.name : "访客创作者";
  });
  renderCharacters(current);
  renderAssets(current);
  renderHistory(current);
  renderCreations(current);
  renderDashboard(current);
  renderReferral(current);
  renderShare(current);
}

function showAuthMessage(message, tone = "info") {
  const target = document.querySelector("[data-auth-message]");
  if (!target) return;
  target.textContent = message;
  target.dataset.tone = tone;
}

document.querySelectorAll("[data-auth-provider]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const provider = button.dataset.authProvider || "google";
    if (!supabase) {
      showAuthMessage("Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可启用真实社交登录。", "error");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: new URL("./dashboard.html", window.location.href).href }
    });
    if (error) showAuthMessage(error.message, "error");
  });
});

document.querySelectorAll("[data-telegram-auth]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    if (!telegramBotUsername || !telegramAuthUrl) {
      showAuthMessage("Telegram 登录需要先配置 VITE_TELEGRAM_BOT_USERNAME 和 VITE_TELEGRAM_AUTH_URL，并在后端校验 Telegram 返回签名。", "error");
      return;
    }
    const container = document.createElement("div");
    container.className = "telegram-widget-slot";
    button.after(container);
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", telegramBotUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", telegramAuthUrl);
    script.setAttribute("data-request-access", "write");
    container.innerHTML = "";
    container.append(script);
    showAuthMessage("请在 Telegram 弹窗中完成授权。", "success");
  });
});

document.addEventListener("click", async (event) => {
  const authModalLink = event.target.closest("[data-auth-modal]");
  if (authModalLink) {
    event.preventDefault();
    openAuthModal(authModalLink.getAttribute("href") || "./dashboard.html");
    return;
  }

  const modalAuthButton = event.target.closest("[data-modal-auth-provider]");
  if (modalAuthButton) {
    event.preventDefault();
    await startSocialAuth(modalAuthButton.dataset.modalAuthProvider || "google", modalAuthButton.dataset.nextUrl || "./dashboard.html");
    return;
  }

  const dailyCheck = event.target.closest(".daily-check");
  if (dailyCheck) {
    event.preventDefault();
    openCheckInModal();
    return;
  }
  const languageButton = event.target.closest("[data-language]");
  if (languageButton) {
    const label = languageButton.textContent.trim();
    localStorage.setItem("ovs_language", languageButton.dataset.language || "zh-CN");
    const trigger = document.querySelector(".language-trigger");
    if (trigger) trigger.textContent = label === "简体中文" ? "文A" : label.slice(0, 2);
    return;
  }
  const logoutButton = event.target.closest("[data-logout]");
  if (logoutButton) {
    if (supabase) await supabase.auth.signOut();
    state.user = null;
    saveState(state);
    return;
  }
  const templateButton = event.target.closest("[data-template-prompt]");
  if (templateButton) {
    const prompt = document.querySelector("[data-tool-prompt]");
    if (prompt) prompt.value = templateButton.dataset.templatePrompt;
    return;
  }
  const toolGenerateButton = event.target.closest("[data-tool-demo-generate]");
  if (toolGenerateButton) {
    if (!state.user) {
      openUnlockModal(window.location.pathname.split("/").pop() || "./generate.html");
      return;
    }
    runToolDemoGeneration();
    return;
  }
  const supportButton = event.target.closest("[data-support-widget]");
  if (supportButton) {
    openSupportWidget();
    return;
  }
  const scrollTopButton = event.target.closest("[data-scroll-top]");
  if (scrollTopButton) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

function openSupportWidget() {
  document.querySelector(".support-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "support-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "帮助中心");
  overlay.innerHTML = `
    <div class="support-card">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <span class="support-avatar">OVS</span>
      <h2>需要帮助？</h2>
      <p>这里是 Open Video Studio 的快速帮助入口。真实客服系统接入前，先提供常用路径。</p>
      <div class="support-links">
        <a href="./image-editor.html">打开图片工具</a>
        <a href="./image-to-video.html">打开视频工具</a>
        <a href="./pricing.html">查看积分套餐</a>
        <a href="./referral.html">领取免费硬币</a>
        <a href="mailto:support@openvideostudio.app">联系支持</a>
      </div>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

function openAuthModal(nextUrl = "./dashboard.html") {
  document.querySelector(".auth-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "auth-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "登录 Open Video Studio");
  overlay.innerHTML = `
    <div class="login-modal-card auth-popup-card">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <h1>登录到 Open Video Studio</h1>
      <p class="muted">使用社交账号继续创作。登录后可以保存作品、领取免费积分、购买积分并管理分享链接。</p>
      <div class="modal-auth-list">
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="google" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot google-dot">G</span>使用 Google 登录 <b>→</b></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="twitter" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot x-dot">X</span>使用 X 登录 <b>→</b></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="telegram" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot tg-dot">TG</span>使用 Telegram 登录 <b>→</b></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="discord" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot dc-dot">DC</span>使用 Discord 登录 <b>→</b></button>
      </div>
      <p class="auth-message" data-auth-message>配置 Supabase OAuth 后，Google / X / Discord 会进行真实登录；Telegram 需要配置 Bot 和回调校验。</p>
      <p class="login-terms">继续即表示你同意我们的 <a href="./terms.html">服务条款</a> 和 <a href="./privacy.html">隐私政策</a>。</p>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

async function startSocialAuth(provider, nextUrl = "./dashboard.html") {
  const message = document.querySelector(".auth-overlay [data-auth-message]") || document.querySelector("[data-auth-message]");
  const setMessage = (text, tone = "error") => {
    if (!message) return;
    message.textContent = text;
    message.dataset.tone = tone;
  };
  if (provider === "telegram") {
    if (!telegramBotUsername || !telegramAuthUrl) {
      setMessage("Telegram 登录需要先配置 VITE_TELEGRAM_BOT_USERNAME 和 VITE_TELEGRAM_AUTH_URL。");
      return;
    }
    setMessage("请使用独立登录页完成 Telegram Widget 授权。", "success");
    window.location.href = "./signin.html";
    return;
  }
  if (!supabase) {
    setMessage("Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可启用真实社交登录。");
    return;
  }
  const redirectTo = new URL(nextUrl, window.location.href).href;
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) setMessage(error.message);
}

function runToolDemoGeneration() {
  const status = document.querySelector("[data-tool-demo-status]");
  const preview = document.querySelector("[data-tool-demo-preview]");
  const prompt = document.querySelector("[data-tool-prompt]")?.value.trim() || "AI 工具演示生成";
  const cost = 8;
  if (state.credits < cost) {
    if (status) status.innerHTML = `<strong>积分不足</strong><span>请先购买积分后继续生成。</span>`;
    return;
  }
  state.credits -= cost;
  const id = `asset_${Date.now()}`;
  const toolName = document.querySelector(".tool-detail-copy h1")?.textContent?.trim() || "AI 工具";
  const asset = { id, type: "image", title: `${toolName} 演示结果`, prompt, character: "Mira", credits: cost, status: "completed", visibility: "private", favorite: false };
  const job = { id: `job_${Date.now()}`, type: "image", title: asset.title, prompt, provider: "local_api", model: "local-tool-demo-v0", status: "completed", credits: cost, duration: "9s", assetId: id };
  state.assets.unshift(asset);
  state.history.unshift(job);
  saveState(state);
  if (preview) {
    preview.classList.remove("art-7");
    preview.classList.add("art-3");
  }
  if (status) {
    status.innerHTML = `<strong>已生成演示结果</strong><span>消耗 ${cost} 积分，已保存到资产库和生成历史。</span><a href="./assets.html">查看资产</a>`;
  }
}

document.querySelectorAll(".tool-poster.locked").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (state.user) return;
    event.preventDefault();
    openUnlockModal(card.getAttribute("href") || "./generate.html");
  });
});

function openUnlockModal(nextUrl = "./generate.html") {
  document.querySelector(".unlock-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "unlock-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "登录解锁工具");
  overlay.innerHTML = `
    <div class="unlock-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <h2>登录后解锁此工具</h2>
      <p>保存生成结果、复用资产、管理积分，并继续打开这个创作工具。</p>
      <div class="unlock-auth-list">
        <button type="button" data-unlock-auth="google" data-modal-auth-provider="google" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot google-dot">G</span>使用 Google 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="twitter" data-modal-auth-provider="twitter" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot x-dot">X</span>使用 X 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="telegram" data-modal-auth-provider="telegram" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot tg-dot">TG</span>使用 Telegram 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="discord" data-modal-auth-provider="discord" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot dc-dot">DC</span>使用 Discord 登录 <b>→</b></button>
      </div>
      <p class="auth-message" data-auth-message>选择一个账号继续。真实登录需要先配置 Supabase OAuth。</p>
      <a class="btn primary full" href="./pricing.html">查看积分套餐</a>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

function openCheckInModal() {
  document.querySelector(".checkin-overlay")?.remove();
  const signedIn = Boolean(state.user);
  const today = new Date().toISOString().slice(0, 10);
  const alreadyChecked = state.rewards.lastCheckInDate === today;
  const day = Math.min(state.rewards.checkInDay || 0, 6);
  const rewards = [5, 6, 12, 6, 8, 8, 20];
  const overlay = document.createElement("section");
  overlay.className = "checkin-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "每日签到");
  overlay.innerHTML = `
    <div class="checkin-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <div class="checkin-gift" aria-hidden="true">🎁</div>
      <h2>${signedIn ? alreadyChecked ? "今日签到已完成" : "今日签到奖励已准备好" : "登录即可立即获得 10 免费积分"}</h2>
      <p>连续签到 7 天最多可获得 <strong>65 积分</strong></p>
      <div class="checkin-status">
        <span>Day ${signedIn ? String(day + 1) : "0"} of 7</span>
        <span><b data-credit-balance>${state.credits}</b></span>
      </div>
      <div class="checkin-days">
        ${rewards.map((value, index) => `
          <article class="${index < day || alreadyChecked && index === day ? "claimed" : index === day ? "active" : ""}">
            ${index === 2 ? "<i>2x</i>" : ""}
            ${index === 6 ? "<i>3x</i>" : ""}
            <strong>+${value}</strong>
            <span>Day ${index + 1}</span>
          </article>
        `).join("")}
      </div>
      <button class="btn primary full checkin-action" type="button">${signedIn ? alreadyChecked ? "今天已领取" : `领取 +${rewards[day]} 积分` : "登录开始签到 →"}</button>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.querySelector(".checkin-action")?.addEventListener("click", () => {
    if (!state.user) {
      overlay.remove();
      openAuthModal("./referral.html");
      return;
    }
    if (state.rewards.lastCheckInDate === today) {
      overlay.querySelector(".checkin-action").textContent = "今天已领取";
      return;
    }
    const currentDay = Math.min(state.rewards.checkInDay || 0, 6);
    const reward = rewards[currentDay];
    state.credits += reward;
    state.rewards.checkInDay = currentDay === 6 ? 0 : currentDay + 1;
    state.rewards.lastCheckInDate = today;
    saveState(state);
    renderReferral(state);
    overlay.querySelector(".checkin-action").textContent = `已领取 ${reward} 积分`;
  });
}

document.querySelectorAll("[data-email-auth]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.querySelector("[data-auth-email]")?.value.trim();
    const password = document.querySelector("[data-auth-password]")?.value;
    const displayName = document.querySelector("[data-auth-name]")?.value.trim() || email;
    const mode = button.dataset.emailAuth || "signin";
    if (!email || !password) {
      showAuthMessage("请先输入邮箱和密码。", "error");
      return;
    }
    if (!supabase) {
      showAuthMessage("Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可启用真实注册。", "error");
      return;
    }
    button.textContent = mode === "signup" ? "正在创建账户..." : "正在登录...";
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      button.textContent = mode === "signup" ? "创建账户" : "登录";
      showAuthMessage(result.error.message, "error");
      return;
    }
    if (result.data.user) {
      state.user = {
        id: result.data.user.id,
        name: String(result.data.user.user_metadata?.display_name || result.data.user.email || "创作者"),
        email: result.data.user.email || email,
        provider: "supabase",
        createdAt: result.data.user.created_at || new Date().toISOString()
      };
      saveState(state);
    }
    showAuthMessage(mode === "signup" ? "账户已创建。如开启邮箱验证，请检查邮件。" : "登录成功。", "success");
    window.location.href = "./dashboard.html";
  });
});

document.querySelectorAll("[data-buy-credits]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const credits = Number(button.dataset.buyCredits || "0");
    const planName = button.dataset.planName || button.textContent.trim() || "积分套餐";
    const price = button.querySelector("strong")?.textContent?.trim() || button.dataset.planPrice || "演示结账";
    openCheckoutModal({ credits, planName, price });
  });
});

document.querySelectorAll("[data-payment-method]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-payment-method]").forEach((item) => {
      item.classList.remove("active");
      item.textContent = item.dataset.label || item.textContent.replace("（已选择）", "");
    });
    button.classList.add("active");
    button.textContent = `${button.dataset.label}（已选择）`;
  });
});

document.querySelector("[data-copy-referral]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const link = document.querySelector("[data-referral-link]")?.value || "https://openvideostudio.app/?ref=creator-demo";
  try {
    await navigator.clipboard?.writeText(link);
    state.rewards.referralCopies = (state.rewards.referralCopies || 0) + 1;
    saveState(state);
    button.textContent = "已复制";
  } catch {
    button.textContent = "复制链接";
  }
});

document.querySelectorAll("[data-claim-task]").forEach((button) => {
  button.addEventListener("click", () => {
    ensureUser("email");
    const task = button.dataset.claimTask || "task";
    if (state.rewards.taskClaims.includes(task)) {
      button.textContent = "已领取";
      return;
    }
    const credits = Number(button.dataset.taskCredits || "0");
    state.credits += credits;
    state.rewards.taskClaims.push(task);
    saveState(state);
    button.textContent = `已领取 ${credits} 积分`;
  });
});

if (document.body.classList.contains("pricing-page") || document.querySelector(".pricing-page")) {
  window.setTimeout(openCreditOfferModal, 450);
}

function openCreditOfferModal() {
  if (sessionStorage.getItem("ovs-credit-offer-dismissed") === "true") return;
  document.querySelector(".credit-offer-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "credit-offer-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "限时积分优惠");
  overlay.innerHTML = `
    <div class="credit-offer-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <span class="offer-pill">⚡ 限时优惠</span>
      <h2>等等！现在可获得 <strong>2x 积分加赠</strong></h2>
      <p>当前创作者专属奖励，只在本次访问期间展示。</p>
      <div class="offer-compare">
        <div><span>原套餐</span><del>1000 积分</del><b>$29.99</b></div>
        <div class="active"><span>加赠后</span><strong>1600 积分</strong><b>$29.99</b></div>
      </div>
      <small>结账时使用优惠码</small>
      <button class="promo-code" type="button" data-copy-promo><span>WELCOME_SALE</span><em>复制</em></button>
      <div class="offer-timer">优惠倒计时 <b data-offer-countdown>29:51</b></div>
      <button class="btn primary full" type="button" data-offer-claim data-buy-credits="1600">领取我的 2x 积分</button>
      <button class="offer-skip" type="button">不用了，暂时跳过</button>
    </div>
  `;
  document.body.append(overlay);
  const close = () => {
    sessionStorage.setItem("ovs-credit-offer-dismissed", "true");
    overlay.remove();
  };
  overlay.querySelector(".checkin-close")?.addEventListener("click", close);
  overlay.querySelector(".offer-skip")?.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-copy-promo]")?.addEventListener("click", async (event) => {
    try {
      await navigator.clipboard?.writeText("WELCOME_SALE");
      event.currentTarget.querySelector("em").textContent = "已复制";
    } catch {
      event.currentTarget.querySelector("em").textContent = "复制";
    }
  });
  overlay.querySelector("[data-offer-claim]")?.addEventListener("click", () => {
    close();
    openCheckoutModal({ credits: 1600, planName: "2x 加赠创作者包", price: "$29.99", promo: "WELCOME_SALE" });
  });
}

function openCheckoutModal({ credits, planName, price, promo = "" }) {
  document.querySelector(".checkout-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "checkout-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "积分结账");
  const signedIn = Boolean(state.user);
  overlay.innerHTML = `
    <div class="checkout-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <p class="eyebrow">Checkout</p>
      <h2>确认购买 ${escapeHtml(planName)}</h2>
      <div class="checkout-summary">
        <div><span>套餐</span><strong>${escapeHtml(planName)}</strong></div>
        <div><span>积分</span><strong>${credits}</strong></div>
        <div><span>价格</span><strong>${escapeHtml(price)}</strong></div>
        <div><span>账户</span><strong>${signedIn ? escapeHtml(state.user.name) : "访客结账"}</strong></div>
      </div>
      <label class="checkout-promo">
        <span>优惠码</span>
        <input value="${escapeHtml(promo)}" placeholder="WELCOME_SALE" data-checkout-promo>
      </label>
      <div class="checkout-methods" aria-label="Payment methods">
        <button class="active" type="button" data-checkout-method="paypal">PayPal</button>
        <button type="button" data-checkout-method="cashapp">Cash App</button>
        <button type="button" data-checkout-method="applepay">Apple Pay</button>
        <button type="button" data-checkout-method="venmo">Venmo</button>
      </div>
      <p class="checkout-note">${signedIn ? "这是演示结账：不会调用真实支付接口，确认后积分会进入本地余额。" : "登录后可同步账户积分。当前演示模式会先创建本地创作者账户。"}</p>
      <div class="checkout-actions">
        <button class="btn primary full" type="button" data-confirm-checkout>确认并发放演示积分</button>
        <a class="btn glass full" href="./signin.html">登录账户</a>
      </div>
    </div>
  `;
  document.body.append(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".checkin-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelectorAll("[data-checkout-method]").forEach((button) => {
    button.addEventListener("click", () => {
      overlay.querySelectorAll("[data-checkout-method]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
  overlay.querySelector("[data-confirm-checkout]")?.addEventListener("click", () => {
    ensureUser("checkout");
    state.credits += credits;
    state.rewards.taskClaims = Array.from(new Set([...state.rewards.taskClaims, "purchase"]));
    saveState(state);
    overlay.querySelector("[data-confirm-checkout]").textContent = `已到账 ${credits} 积分`;
    overlay.querySelector(".checkout-note").textContent = "演示积分已进入余额。真实支付 API 接入前不会产生扣款。";
    window.setTimeout(() => {
      window.location.href = "./dashboard.html";
    }, 650);
  });
}

const modeButtons = document.querySelectorAll("[data-mode]");
const costTarget = document.querySelector("[data-credit-cost]");
const modeTarget = document.querySelector("[data-mode-label]");
const queueTarget = document.querySelector("[data-queue]");
const generateButton = document.querySelector("[data-generate]");
const enhanceButton = document.querySelector("[data-enhance]");
const promptBox = document.querySelector(".hero-textarea");

const modeCosts = { image: 8, video: 24, character: 12 };

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const mode = button.dataset.mode || "image";
    if (costTarget) costTarget.textContent = `${modeCosts[mode] || 8} 积分`;
    if (modeTarget) {
      modeTarget.textContent = mode === "video" ? "视频生成" : mode === "character" ? "角色生成" : "图片生成";
    }
  });
});

if (enhanceButton && promptBox) {
  enhanceButton.addEventListener("click", () => {
    if (!promptBox.value.includes("ultra-detailed")) {
      promptBox.value = `${promptBox.value.trim()} ultra-detailed, cinematic composition, reusable reference metadata`;
    }
  });
}

if (generateButton && queueTarget) {
  generateButton.addEventListener("click", () => {
    ensureUser("email");
    const activeMode = document.querySelector("[data-mode].active")?.dataset.mode || "image";
    const cost = modeCosts[activeMode] || 8;
    if (state.credits < cost) {
    queueTarget.prepend(statusRow("积分不足", "请先购买积分再生成这个作品。", "./pricing.html", "购买积分"));
      return;
    }
    state.credits -= cost;
    const id = `asset_${Date.now()}`;
    const title = activeMode === "video" ? "生成视频场景" : activeMode === "character" ? "生成角色种子" : "生成图片作品";
    const prompt = promptBox?.value.trim() || "生成 AI 场景";
    const character = document.querySelector(".selector-grid select")?.value?.split(" - ")[0] || "Mira";
    const asset = { id, type: activeMode === "video" ? "video" : "image", title, prompt, character, credits: cost, status: "completed", visibility: "private", favorite: false };
    const job = { id: `job_${Date.now()}`, type: asset.type, title, prompt, provider: "local_api", model: activeMode === "video" ? "local-video-v0" : "local-image-v0", status: "completed", credits: cost, duration: activeMode === "video" ? "8s" : "12s", assetId: id };
    state.assets.unshift(asset);
    state.history.unshift(job);
    saveState(state);
    queueTarget.prepend(statusRow(`${title}已完成`, "已保存到资产库和生成历史。", "./assets.html", "打开作品"));
  });
}

const characterForm = document.querySelector("[data-character-form]");
if (characterForm) {
  characterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(characterForm);
    const name = String(form.get("name") || "").trim();
    if (!name) return;
    state.characters.unshift({
      id: `char_${Date.now()}`,
      name,
      role: String(form.get("role") || "创意角色"),
      tags: String(form.get("tags") || "自定义").split(",").map((tag) => tag.trim()).filter(Boolean),
      score: 84,
      status: "active",
      favorite: false,
      memory: String(form.get("memory") || "保持角色外观、语气、镜头和品牌视觉一致。")
    });
    selectedCharacterId = state.characters[0].id;
    saveState(state);
    characterForm.reset();
  });
}

function statusRow(title, body, href, action) {
  const row = document.createElement("article");
  row.className = "result-row";
  row.innerHTML = `<span class="thumb art-3"></span><div><strong>${title}</strong><p>${body}</p></div><a href="${href}">${action}</a>`;
  return row;
}

let characterFilter = "all";
let characterSearch = "";

function renderCharacters(current) {
  const target = document.querySelector("[data-character-list]");
  document.querySelectorAll("[data-character-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.characterFilter === characterFilter);
  });
  if (target) {
    const characters = current.characters.filter((character) => {
      const matchesFilter =
        characterFilter === "all" ||
        character.status === characterFilter ||
        (characterFilter === "favorite" && character.favorite);
      const haystack = `${character.name} ${character.role} ${character.tags.join(" ")} ${character.memory}`.toLowerCase();
      return matchesFilter && (!characterSearch || haystack.includes(characterSearch));
    });
    target.innerHTML = characters.map((character, index) => `
    <article class="character-card large ${["art-2", "art-11", "art-12"][index % 3]} ${character.id === selectedCharacterId ? "selected" : ""}" data-character-card="${character.id}">
      <span>${character.status === "active" ? "可生成" : "草稿"} ${character.favorite ? "· 收藏" : ""}</span>
      <strong>${escapeHtml(character.name)}</strong>
      <span>${escapeHtml(character.role)} - 一致性 ${character.score}%</span>
      <p>标签：${character.tags.map(escapeHtml).join(", ")}</p>
      <div class="row-actions"><button type="button" data-use-character="${character.id}">使用角色</button><button type="button" data-copy-character="${character.id}">复制设定</button></div>
    </article>
  `).join("");
  }
  renderCharacterProfile(current);
}

function renderCharacterProfile(current) {
  const profile = document.querySelector("[data-character-profile]");
  if (!profile) return;
  const character = current.characters.find((item) => item.id === selectedCharacterId) || current.characters[0];
  if (!character) return;
  const relatedAssets = current.assets.filter((asset) => asset.character === character.name).slice(0, 3);
  profile.querySelector(".eyebrow").textContent = character.status === "active" ? "角色预览" : "草稿角色";
  profile.querySelector(".avatar").className = `avatar ${character.favorite ? "art-12" : "art-2"}`;
  profile.querySelector("h2").textContent = `${character.name} ${character.role}`;
  profile.querySelector(".muted").textContent = character.memory || "保持角色外观、语气、镜头和品牌视觉一致。";
  profile.querySelector(".score").innerHTML = `一致性评分 <strong>${character.score}%</strong>`;
  profile.querySelector(".character-action-row").innerHTML = `<button class="btn primary" type="button" data-use-character="${character.id}">使用角色生成</button><button class="btn glass" type="button" data-copy-character="${character.id}">复制角色提示词</button>`;
  profile.querySelector(".mini-assets").innerHTML = relatedAssets.length
    ? relatedAssets.map((asset, index) => `<span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>`).join("")
    : `<span class="thumb art-3"></span><span class="thumb art-7"></span><span class="thumb art-8"></span>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderAssets(current) {
  const targets = document.querySelectorAll("[data-asset-list]");
  targets.forEach((target) => {
    target.innerHTML = current.assets.map((asset, index) => `
      <article class="library-card" data-asset data-asset-kind="${asset.type === "video" ? "视频" : "图片"}" data-asset-favorite="${asset.favorite ? "收藏" : ""}">
        <span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>
        <div><h3>${escapeHtml(asset.title)}</h3><p>${asset.type === "video" ? "视频" : "图片"} - ${asset.visibility === "public" ? "公开" : "私密"} - 角色 ${escapeHtml(asset.character)}</p></div>
        <button data-share-asset="${asset.id}">分享</button>
      </article>
    `).join("");
  });
}

function renderHistory(current) {
  const target = document.querySelector("[data-history-list]");
  if (!target) return;
  target.innerHTML = current.history.map((job) => `
    <article class="history-row">
      <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
      <div><h3>${escapeHtml(job.title)}</h3><p>提示词：${escapeHtml(job.prompt)}</p><small>服务商 ${escapeHtml(job.provider)} - 模型 ${escapeHtml(job.model)} - ${job.status === "completed" ? "已完成" : escapeHtml(job.status)} - ${job.credits} 积分 - ${escapeHtml(job.duration)}</small></div>
      <div class="row-actions"><button data-retry-job="${job.id}">重试</button><button data-share-asset="${job.assetId}">分享</button></div>
    </article>
  `).join("");
}

let creationFilter = "all";
let creationSearch = "";

function renderCreations(current) {
  const list = document.querySelector("[data-creation-list]");
  const historyList = document.querySelector("[data-creation-history]");
  const stats = {
    count: document.querySelector("[data-creation-count]"),
    shares: document.querySelector("[data-creation-shares]"),
    favorites: document.querySelector("[data-creation-favorites]"),
    jobs: document.querySelector("[data-creation-jobs]")
  };
  if (stats.count) stats.count.textContent = String(current.assets.length);
  if (stats.shares) stats.shares.textContent = String(current.shares.length);
  if (stats.favorites) stats.favorites.textContent = String(current.assets.filter((asset) => asset.favorite).length);
  if (stats.jobs) stats.jobs.textContent = String(current.history.length);

  document.querySelectorAll("[data-creation-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.creationFilter === creationFilter);
  });

  if (list) {
    const filteredAssets = current.assets.filter((asset) => {
      const matchesFilter =
        creationFilter === "all" ||
        asset.type === creationFilter ||
        (creationFilter === "favorite" && asset.favorite) ||
        asset.visibility === creationFilter;
      const haystack = `${asset.title} ${asset.prompt} ${asset.character} ${asset.type} ${asset.status} ${asset.visibility}`.toLowerCase();
      return matchesFilter && (!creationSearch || haystack.includes(creationSearch));
    });
    list.innerHTML = filteredAssets.length ? filteredAssets.map((asset, index) => `
      <article class="creation-work-card" data-asset>
        <span class="creation-work-thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10", "art-12"][index % 4]}"></span>
        <div class="creation-work-body">
          <div class="creation-work-meta"><span>${asset.type === "video" ? "视频" : "图片"}</span><span>${asset.visibility === "public" ? "公开" : "私密"}</span>${asset.favorite ? "<span>收藏</span>" : ""}</div>
          <h3>${escapeHtml(asset.title)}</h3>
          <p>${escapeHtml(asset.prompt)}</p>
          <small>角色 ${escapeHtml(asset.character)} · ${asset.credits} 积分 · ${asset.status === "completed" ? "已完成" : escapeHtml(asset.status)}</small>
          <div class="row-actions">
            <button data-share-asset="${asset.id}">分享</button>
            <button data-copy-asset-prompt="${asset.id}">复制提示词</button>
            <button data-retry-asset="${asset.id}">重新生成</button>
          </div>
        </div>
      </article>
    `).join("") : `
      <article class="empty-state creation-empty">
        <div><p class="eyebrow">没有匹配作品</p><h2>换个关键词，或生成一个新作品</h2><p class="muted">生成结果会自动进入这里，方便继续复用、分享和转视频。</p></div>
        <a class="btn primary" href="./generate.html">开始生成</a>
      </article>
    `;
  }

  if (historyList) {
    historyList.innerHTML = current.history.slice(0, 5).map((job) => `
      <article class="creation-job-row">
        <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
        <div>
          <strong>${escapeHtml(job.title)}</strong>
          <p>${escapeHtml(job.prompt)}</p>
          <small>${escapeHtml(job.provider)} · ${escapeHtml(job.model)} · ${job.credits} 积分 · ${escapeHtml(job.duration)}</small>
        </div>
        <button data-retry-job="${job.id}">重试</button>
      </article>
    `).join("");
  }
}

function createShare(assetId) {
  const asset = state.assets.find((item) => item.id === assetId);
  if (!asset) return;
  asset.visibility = "public";
  const share = { id: `share_${Date.now()}`, token: `share-${Date.now()}`, assetId: asset.id, title: asset.title };
  state.shares.unshift(share);
  saveState(state);
  window.location.href = `./share.html?token=${share.token}`;
}

function renderDashboard(current) {
  const stats = {
    credits: document.querySelector("[data-dashboard-credits]"),
    jobs: document.querySelector("[data-dashboard-jobs]"),
    assets: document.querySelector("[data-dashboard-assets]"),
    shares: document.querySelector("[data-dashboard-shares]")
  };
  if (stats.credits) stats.credits.textContent = String(current.credits);
  if (stats.jobs) stats.jobs.textContent = String(current.history.length);
  if (stats.assets) stats.assets.textContent = String(current.assets.length);
  if (stats.shares) stats.shares.textContent = String(current.shares.length);

  const recent = document.querySelector("[data-dashboard-recent]");
  if (recent) {
    recent.innerHTML = current.history.slice(0, 4).map((job) => `
      <article class="dashboard-row">
        <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
        <div><strong>${escapeHtml(job.title)}</strong><p>${job.status === "completed" ? "已完成" : escapeHtml(job.status)} · ${job.credits} 积分</p></div>
        <button type="button" data-retry-job="${job.id}">重试</button>
      </article>
    `).join("");
  }

  const characters = document.querySelector("[data-dashboard-characters]");
  if (characters) {
    characters.innerHTML = current.characters.slice(0, 4).map((character, index) => `
      <article class="dashboard-row">
        <span class="thumb ${["art-2", "art-11", "art-12"][index % 3]}"></span>
        <div><strong>${escapeHtml(character.name)}</strong><p>${escapeHtml(character.role)} · ${character.score}%</p></div>
        <button type="button" data-use-character="${character.id}">使用</button>
      </article>
    `).join("");
  }

  const shareList = document.querySelector("[data-dashboard-shares-list]");
  if (shareList) {
    shareList.innerHTML = current.shares.slice(0, 4).map((share) => `
      <article class="dashboard-row">
        <span class="thumb art-9"></span>
        <div><strong>${escapeHtml(share.title || "分享作品")}</strong><p>公开链接</p></div>
        <a href="./share.html?token=${encodeURIComponent(share.token)}">打开</a>
      </article>
    `).join("");
  }
}

function renderReferral(current) {
  const stateCard = document.querySelector("[data-referral-state]");
  if (stateCard) {
    stateCard.innerHTML = current.user ? `
      <span>已登录</span>
      <h2>${escapeHtml(current.user.name)} 的奖励中心</h2>
      <p>当前可用积分：<strong data-credit-balance>${current.credits}</strong>。继续签到、复制推荐链接或完成创作任务来获得更多积分。</p>
      <a class="btn primary full" href="./dashboard.html">打开控制台</a>
    ` : `
      <span>需要登录</span>
      <h2>登录后查看你的推荐仪表板</h2>
      <p>登录后可以复制专属推荐链接、查看奖励进度，并领取完成任务后的免费积分。</p>
      <a class="btn primary full" href="./signin.html">登录开始</a>
    `;
  }

  const progress = document.querySelector("[data-referral-progress]");
  if (progress) {
    const checkDay = state.rewards.lastCheckInDate ? state.rewards.checkInDay || 1 : 0;
    progress.innerHTML = `
      <span>签到进度 <b>${checkDay}/7</b></span>
      <span>推荐链接复制 <b>${current.rewards.referralCopies || 0}</b></span>
      <span>已领任务 <b>${current.rewards.taskClaims.length}</b></span>
    `;
  }

  document.querySelectorAll("[data-reward-task]").forEach((card) => {
    const task = card.dataset.rewardTask;
    const claimed =
      (task === "checkin" && Boolean(current.rewards.lastCheckInDate)) ||
      (task === "first-generation" && current.history.length > 0) ||
      (task === "share" && current.shares.length > 0) ||
      current.rewards.taskClaims.includes(task);
    card.classList.toggle("claimed", claimed);
  });

  document.querySelectorAll("[data-claim-task]").forEach((button) => {
    const task = button.dataset.claimTask || "";
    if (current.rewards.taskClaims.includes(task)) {
      button.textContent = "已领取";
    }
  });
}

function renderShare(current) {
  const title = document.querySelector("[data-share-title]");
  if (!title) return;
  const asset = getCurrentShareAsset(current);
  if (!asset) return;
  title.textContent = asset.title;
  document.querySelectorAll("[data-share-prompt]").forEach((node) => node.textContent = `提示词：${asset.prompt}`);
  document.querySelectorAll("[data-share-character]").forEach((node) => node.textContent = asset.character);
  document.querySelectorAll("[data-share-credits]").forEach((node) => node.textContent = String(asset.credits));
}

function getCurrentShareAsset(current = state) {
  const token = new URLSearchParams(window.location.search).get("token");
  const share = current.shares.find((item) => item.token === token) || current.shares[0];
  return current.assets.find((item) => item.id === share?.assetId);
}

const filterInput = document.querySelector("[data-gallery-filter]");
if (filterInput) {
  filterInput.addEventListener("input", () => {
    const value = filterInput.value.trim().toLowerCase();
    document.querySelectorAll("[data-asset]").forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.hidden = value.length > 0 && !text.includes(value);
    });
  });
}

document.querySelector("[data-creation-search]")?.addEventListener("input", (event) => {
  creationSearch = event.currentTarget.value.trim().toLowerCase();
  renderCreations(state);
});

document.querySelectorAll("[data-creation-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    creationFilter = button.dataset.creationFilter || "all";
    renderCreations(state);
  });
});

document.addEventListener("click", async (event) => {
  const shareGenerateButton = event.target.closest("[data-share-generate]");
  if (shareGenerateButton) {
    const asset = getCurrentShareAsset();
    if (!asset) return;
    localStorage.setItem("ovs_retry_prompt", asset.prompt || "");
    localStorage.setItem("ovs_selected_character", asset.character || "");
    window.location.href = "./generate.html";
    return;
  }

  const shareCopyPromptButton = event.target.closest("[data-share-copy-prompt]");
  if (shareCopyPromptButton) {
    const asset = getCurrentShareAsset();
    if (!asset) return;
    try {
      await navigator.clipboard?.writeText(asset.prompt || "");
      shareCopyPromptButton.textContent = "已复制提示词";
    } catch {
      shareCopyPromptButton.textContent = "复制提示词";
    }
    return;
  }

  const shareSaveButton = event.target.closest("[data-share-save]");
  if (shareSaveButton) {
    const asset = getCurrentShareAsset();
    if (!asset) return;
    ensureUser("share");
    asset.favorite = true;
    asset.visibility = asset.visibility || "private";
    saveState(state);
    renderDashboard(state);
    shareSaveButton.textContent = "已保存到资产库";
    return;
  }

  const shareButton = event.target.closest("[data-share-asset]");
  if (shareButton) {
    event.preventDefault();
    createShare(shareButton.dataset.shareAsset);
    return;
  }

  const retryAssetButton = event.target.closest("[data-retry-asset]");
  if (retryAssetButton) {
    const asset = state.assets.find((item) => item.id === retryAssetButton.dataset.retryAsset);
    if (asset) {
      localStorage.setItem("ovs_retry_prompt", asset.prompt || "");
      window.location.href = "./generate.html";
    }
    return;
  }

  const retryJobButton = event.target.closest("[data-retry-job]");
  if (retryJobButton) {
    const job = state.history.find((item) => item.id === retryJobButton.dataset.retryJob);
    if (job) {
      localStorage.setItem("ovs_retry_prompt", job.prompt || "");
      window.location.href = "./generate.html";
    }
    return;
  }

  const copyPromptButton = event.target.closest("[data-copy-asset-prompt]");
  if (copyPromptButton) {
    const asset = state.assets.find((item) => item.id === copyPromptButton.dataset.copyAssetPrompt);
    if (!asset) return;
    try {
      await navigator.clipboard?.writeText(asset.prompt || "");
      copyPromptButton.textContent = "已复制";
    } catch {
      copyPromptButton.textContent = "复制提示词";
    }
    return;
  }

  const galleryCard = event.target.closest("[data-gallery-title][data-gallery-prompt]");
  const galleryTitle = galleryCard?.dataset.galleryTitle || "灵感作品";
  const galleryPrompt = galleryCard?.dataset.galleryPrompt || "";

  if (event.target.closest("[data-gallery-similar]")) {
    localStorage.setItem("ovs_retry_prompt", galleryPrompt);
    window.location.href = "./generate.html";
    return;
  }

  const copyGalleryPromptButton = event.target.closest("[data-copy-gallery-prompt]");
  if (copyGalleryPromptButton) {
    try {
      await navigator.clipboard?.writeText(galleryPrompt);
      copyGalleryPromptButton.textContent = "已复制";
    } catch {
      copyGalleryPromptButton.textContent = "复制提示词";
    }
    return;
  }

  if (event.target.closest("[data-gallery-share]")) {
    const assetId = `asset_gallery_${Date.now()}`;
    state.assets.unshift({
      id: assetId,
      type: galleryTitle.includes("片") ? "video" : "image",
      title: galleryTitle,
      prompt: galleryPrompt,
      character: "Gallery",
      credits: galleryTitle.includes("片") ? 24 : 8,
      status: "completed",
      visibility: "private",
      favorite: false
    });
    saveState(state);
    createShare(assetId);
    return;
  }

  const favoriteGalleryButton = event.target.closest("[data-gallery-favorite]");
  if (favoriteGalleryButton) {
    favoriteGalleryButton.textContent = "已收藏";
    galleryCard?.classList.add("saved");
    return;
  }

  if (event.target.closest("[data-open-character]")) {
    window.location.href = "./characters.html";
    return;
  }

  const characterCard = event.target.closest("[data-character-card]");
  if (characterCard && !event.target.closest("button")) {
    selectedCharacterId = characterCard.dataset.characterCard || selectedCharacterId;
    renderCharacters(state);
    return;
  }

  const useCharacterButton = event.target.closest("[data-use-character]");
  if (useCharacterButton) {
    const character = state.characters.find((item) => item.id === useCharacterButton.dataset.useCharacter);
    if (character) {
      localStorage.setItem("ovs_selected_character", character.name);
      localStorage.setItem("ovs_retry_prompt", `${character.name}，${character.role}，${character.memory || ""}`);
      window.location.href = "./generate.html";
    }
    return;
  }

  const copyCharacterButton = event.target.closest("[data-copy-character]");
  if (copyCharacterButton) {
    const character = state.characters.find((item) => item.id === copyCharacterButton.dataset.copyCharacter);
    if (!character) return;
    const characterPrompt = `${character.name}｜${character.role}｜标签：${character.tags.join(", ")}｜记忆：${character.memory || ""}`;
    try {
      await navigator.clipboard?.writeText(characterPrompt);
      copyCharacterButton.textContent = "已复制";
    } catch {
      copyCharacterButton.textContent = "复制设定";
    }
  }
});

document.querySelectorAll("[data-asset-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.assetFilter || "all";
    document.querySelectorAll("[data-asset-filter]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll("[data-asset]").forEach((card) => {
      const text = `${card.textContent || ""} ${card.dataset.assetKind || ""} ${card.dataset.assetFavorite || ""}`;
      card.hidden = filter !== "all" && !text.includes(filter);
    });
  });
});

document.querySelector("[data-character-search]")?.addEventListener("input", (event) => {
  characterSearch = event.currentTarget.value.trim().toLowerCase();
  renderCharacters(state);
});

document.querySelectorAll("[data-character-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    characterFilter = button.dataset.characterFilter || "all";
    renderCharacters(state);
  });
});

const intervalToggle = document.querySelector("[data-interval]");
const priceTargets = document.querySelectorAll("[data-monthly][data-yearly]");
if (intervalToggle) {
  intervalToggle.addEventListener("change", () => {
    const yearly = intervalToggle.value === "yearly";
    priceTargets.forEach((target) => {
      target.textContent = yearly ? target.dataset.yearly : target.dataset.monthly;
    });
  });
}

const retryPrompt = localStorage.getItem("ovs_retry_prompt");
if (retryPrompt && promptBox) {
  promptBox.value = retryPrompt;
  localStorage.removeItem("ovs_retry_prompt");
}
const selectedCharacterName = localStorage.getItem("ovs_selected_character");
if (selectedCharacterName) {
  const characterSelect = document.querySelector(".selector-grid select");
  if (characterSelect) {
    const matchingOption = Array.from(characterSelect.options).find((option) => option.textContent.startsWith(selectedCharacterName));
    if (matchingOption) characterSelect.value = matchingOption.value;
  }
  localStorage.removeItem("ovs_selected_character");
}

renderState(state);
