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
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const defaultState = {
  user: null,
  credits: 40,
  characters: [
    { id: "char_mira", name: "Mira", role: "Studio Presenter", tags: ["launch", "studio", "calm"], score: 92 },
    { id: "char_atlas", name: "Atlas", role: "Product Host", tags: ["product", "clean"], score: 88 },
    { id: "char_nova", name: "Nova", role: "Creator Avatar", tags: ["fashion", "neon"], score: 95 }
  ],
  assets: [
    { id: "asset_launch", type: "image", title: "Launch hero frame", prompt: "cinematic product reveal with violet lighting", character: "Mira", credits: 8, status: "completed", visibility: "private", favorite: true },
    { id: "asset_teaser", type: "video", title: "Vertical teaser", prompt: "animate hero frame into a social teaser", character: "Mira", credits: 24, status: "completed", visibility: "public", favorite: false }
  ],
  history: [
    { id: "job_launch", type: "image", title: "Product launch hero", prompt: "cinematic product reveal with violet lighting", provider: "local_api", model: "local-image-v0", status: "completed", credits: 8, duration: "18s", assetId: "asset_launch" },
    { id: "job_teaser", type: "video", title: "Vertical teaser", prompt: "animate hero frame into a social teaser", provider: "local_api", model: "local-video-v0", status: "completed", credits: 24, duration: "8s", assetId: "asset_teaser" }
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

async function hydrateAuthSession() {
  if (!supabase) {
    renderState(state);
    return;
  }
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    state.user = {
      id: data.session.user.id,
      name: String(data.session.user.user_metadata?.display_name || data.session.user.email || "Creator"),
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
      name: provider === "email" ? "Demo Creator" : `${capitalize(provider)} Creator`,
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
    node.textContent = current.user ? current.user.name : "Guest creator";
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
      showAuthMessage("Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable real social login.", "error");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: new URL("./dashboard.html", window.location.href).href }
    });
    if (error) showAuthMessage(error.message, "error");
  });
});

document.querySelectorAll("[data-email-auth]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.querySelector("[data-auth-email]")?.value.trim();
    const password = document.querySelector("[data-auth-password]")?.value;
    const displayName = document.querySelector("[data-auth-name]")?.value.trim() || email;
    const mode = button.dataset.emailAuth || "signin";
    if (!email || !password) {
      showAuthMessage("Enter an email and password first.", "error");
      return;
    }
    if (!supabase) {
      showAuthMessage("Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable real registration.", "error");
      return;
    }
    button.textContent = mode === "signup" ? "Creating account..." : "Signing in...";
    const result = mode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      button.textContent = mode === "signup" ? "Create account" : "Sign in";
      showAuthMessage(result.error.message, "error");
      return;
    }
    if (result.data.user) {
      state.user = {
        id: result.data.user.id,
        name: String(result.data.user.user_metadata?.display_name || result.data.user.email || "Creator"),
        email: result.data.user.email || email,
        provider: "supabase",
        createdAt: result.data.user.created_at || new Date().toISOString()
      };
      saveState(state);
    }
    showAuthMessage(mode === "signup" ? "Account created. Check email if confirmation is required." : "Signed in successfully.", "success");
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
    button.textContent = `Added ${credits} credits`;
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
    if (costTarget) costTarget.textContent = `${modeCosts[mode] || 8} credits`;
    if (modeTarget) {
      modeTarget.textContent = mode === "video" ? "Video generation" : mode === "character" ? "Character generation" : "Image generation";
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
      queueTarget.prepend(statusRow("Insufficient credits", "Buy credits before generating this output.", "./pricing.html", "Buy credits"));
      return;
    }
    state.credits -= cost;
    const id = `asset_${Date.now()}`;
    const title = activeMode === "video" ? "Generated video scene" : activeMode === "character" ? "Generated character seed" : "Generated image scene";
    const prompt = promptBox?.value.trim() || "Generated AI scene";
    const character = document.querySelector(".selector-grid select")?.value?.split(" - ")[0] || "Mira";
    const asset = { id, type: activeMode === "video" ? "video" : "image", title, prompt, character, credits: cost, status: "completed", visibility: "private", favorite: false };
    const job = { id: `job_${Date.now()}`, type: asset.type, title, prompt, provider: "local_api", model: activeMode === "video" ? "local-video-v0" : "local-image-v0", status: "completed", credits: cost, duration: activeMode === "video" ? "8s" : "12s", assetId: id };
    state.assets.unshift(asset);
    state.history.unshift(job);
    saveState(state);
    queueTarget.prepend(statusRow(`${title} completed`, "Saved to Assets and History.", "./assets.html", "Open output"));
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
      role: String(form.get("role") || "Creative Character"),
      tags: String(form.get("tags") || "custom").split(",").map((tag) => tag.trim()).filter(Boolean),
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
      <span>${character.role} - Consistency ${character.score}%</span>
      <p>Tags: ${character.tags.join(", ")}</p>
    </article>
  `).join("");
}

function renderAssets(current) {
  const targets = document.querySelectorAll("[data-asset-list]");
  targets.forEach((target) => {
    target.innerHTML = current.assets.map((asset, index) => `
      <article class="library-card" data-asset>
        <span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>
        <div><h3>${asset.title}</h3><p>${capitalize(asset.type)} - ${asset.visibility} - Character ${asset.character}</p></div>
        <button data-share-asset="${asset.id}">Share</button>
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
      <div><h3>${job.title}</h3><p>Prompt: ${job.prompt}</p><small>Provider ${job.provider} - Model ${job.model} - ${capitalize(job.status)} - ${job.credits} credits - ${job.duration}</small></div>
      <div class="row-actions"><button data-retry-prompt="${job.prompt}">Retry</button><button data-share-asset="${job.assetId}">Share</button></div>
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
  document.querySelectorAll("[data-share-prompt]").forEach((node) => node.textContent = `Prompt: ${asset.prompt}`);
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
