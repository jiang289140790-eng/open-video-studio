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
  "my-creations.html"
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
    { id: "char_mira", name: "Mira", role: "工作室主持人", tags: ["发布", "工作室", "冷静"], score: 92 },
    { id: "char_atlas", name: "Atlas", role: "产品讲解员", tags: ["产品", "干净"], score: 88 },
    { id: "char_nova", name: "Nova", role: "创作者形象", tags: ["时尚", "霓虹"], score: 95 }
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
  ]
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

injectAppShell();
injectGlobalFooter();
hydrateAuthSession();

function injectAppShell() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  if (!APP_SHELL_PAGES.has(page) || document.querySelector(".side-rail")) return;
  document.body.classList.add("tool-layout");
  document.body.insertAdjacentHTML("afterbegin", `
    <aside class="side-rail" aria-label="Product tools">
      <a class="rail-brand" href="./index.html"><span>ovs.ai</span><strong>Open Video Studio</strong></a>
      <nav class="rail-nav">
        <a href="./app.html" class="rail-active">首页</a>
        <a href="./gallery.html">热门作品</a>
        <span>AI 图像</span>
        <a href="./generate.html">图片生成器</a>
        <a href="./characters.html">角色生成器</a>
        <a href="./assets.html">资产库</a>
        <span>AI 视频</span>
        <a href="./image-to-video.html">图片转视频</a>
        <a href="./history.html">我的创作</a>
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
        <a href="./generate.html">图片编辑器</a>
        <a href="./image-to-video.html">AI 视频</a>
        <a href="./gallery.html">作品探索</a>
      </div>
      <div>
        <h3>图像工具</h3>
        <a href="./generate.html">图片生成器</a>
        <a href="./characters.html">角色生成器</a>
        <a href="./assets.html">资产库</a>
        <a href="./gallery.html">作品探索</a>
        <a href="./generate.html">图像组合器</a>
      </div>
      <div>
        <h3>视频工具</h3>
        <a href="./image-to-video.html">图片转视频</a>
        <a href="./history.html">生成历史</a>
        <a href="./my-creations.html">我的创作</a>
      </div>
      <div>
        <h3>关于我们</h3>
        <a href="./pricing.html">价格</a>
        <a href="./referral.html">推荐</a>
        <a href="./signin.html">登录</a>
        <a href="./index.html">首页</a>
      </div>
      <div>
        <p>支持：support@openvideostudio.app</p>
        <p>商务：business@openvideostudio.app</p>
        <p>版权所有 © 2026</p>
      </div>
    </footer>
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
  document.querySelectorAll("[data-credit-balance]").forEach((node) => {
    node.textContent = String(current.credits);
  });
  document.querySelectorAll("[data-user-name]").forEach((node) => {
    node.textContent = current.user ? current.user.name : "访客创作者";
  });
  renderCharacters(current);
  renderAssets(current);
  renderHistory(current);
  renderDashboard(current);
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

document.querySelectorAll(".daily-check").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openCheckInModal();
  });
});

function openCheckInModal() {
  document.querySelector(".checkin-overlay")?.remove();
  const signedIn = Boolean(state.user);
  const overlay = document.createElement("section");
  overlay.className = "checkin-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "每日签到");
  overlay.innerHTML = `
    <div class="checkin-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <div class="checkin-gift" aria-hidden="true">🎁</div>
      <h2>${signedIn ? "今日签到奖励已准备好" : "登录即可立即获得 10 免费积分"}</h2>
      <p>连续签到 7 天最多可获得 <strong>65 积分</strong></p>
      <div class="checkin-status">
        <span>Day ${signedIn ? "1" : "0"} of 7</span>
        <span><b data-credit-balance>${state.credits}</b></span>
      </div>
      <div class="checkin-days">
        ${[5, 6, 12, 6, 8, 8, 20].map((value, index) => `
          <article class="${index === 0 ? "active" : ""}">
            ${index === 2 ? "<i>2x</i>" : ""}
            ${index === 6 ? "<i>3x</i>" : ""}
            <strong>+${value}</strong>
            <span>Day ${index + 1}</span>
          </article>
        `).join("")}
      </div>
      <button class="btn primary full checkin-action" type="button">${signedIn ? "领取今日签到积分" : "登录开始签到"}</button>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.querySelector(".checkin-action")?.addEventListener("click", () => {
    if (!state.user) {
      window.location.href = "./signin.html";
      return;
    }
    state.credits += 10;
    saveState(state);
    overlay.querySelector(".checkin-action").textContent = "已领取 10 积分";
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
    ensureUser("email");
    const credits = Number(button.dataset.buyCredits || "0");
    state.credits += credits;
    saveState(state);
    button.textContent = `已增加 ${credits} 积分`;
  });
});

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
      score: 84
    });
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

function renderCharacters(current) {
  const target = document.querySelector("[data-character-list]");
  if (!target) return;
  target.innerHTML = current.characters.map((character, index) => `
    <article class="character-card large ${["art-2", "art-11", "art-12"][index % 3]}">
      <strong>${character.name}</strong>
      <span>${character.role} - 一致性 ${character.score}%</span>
      <p>标签：${character.tags.join(", ")}</p>
    </article>
  `).join("");
}

function renderAssets(current) {
  const targets = document.querySelectorAll("[data-asset-list]");
  targets.forEach((target) => {
    target.innerHTML = current.assets.map((asset, index) => `
      <article class="library-card" data-asset>
        <span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>
        <div><h3>${asset.title}</h3><p>${asset.type === "video" ? "视频" : "图片"} - ${asset.visibility === "public" ? "公开" : "私密"} - 角色 ${asset.character}</p></div>
        <button data-share-asset="${asset.id}">分享</button>
      </article>
    `).join("");
  });
  document.querySelectorAll("[data-share-asset]").forEach((button) => {
    button.addEventListener("click", () => createShare(button.dataset.shareAsset));
  });
}

function renderHistory(current) {
  const target = document.querySelector("[data-history-list]");
  if (!target) return;
  target.innerHTML = current.history.map((job) => `
    <article class="history-row">
      <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
      <div><h3>${job.title}</h3><p>提示词：${job.prompt}</p><small>服务商 ${job.provider} - 模型 ${job.model} - ${job.status === "completed" ? "已完成" : job.status} - ${job.credits} 积分 - ${job.duration}</small></div>
      <div class="row-actions"><button data-retry-prompt="${job.prompt}">重试</button><button data-share-asset="${job.assetId}">分享</button></div>
    </article>
  `).join("");
  document.querySelectorAll("[data-retry-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem("ovs_retry_prompt", button.dataset.retryPrompt || "");
      window.location.href = "./generate.html";
    });
  });
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
}

function renderShare(current) {
  const title = document.querySelector("[data-share-title]");
  if (!title) return;
  const token = new URLSearchParams(window.location.search).get("token");
  const share = current.shares.find((item) => item.token === token) || current.shares[0];
  const asset = current.assets.find((item) => item.id === share?.assetId);
  if (!asset) return;
  title.textContent = asset.title;
  document.querySelectorAll("[data-share-prompt]").forEach((node) => node.textContent = `提示词：${asset.prompt}`);
  document.querySelectorAll("[data-share-character]").forEach((node) => node.textContent = asset.character);
  document.querySelectorAll("[data-share-credits]").forEach((node) => node.textContent = String(asset.credits));
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

renderState(state);
