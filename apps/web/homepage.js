import { getSession } from "./auth-service.js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase-client.js";

const catalog = Array.isArray(window.__EFFECT_CATALOG__) ? window.__EFFECT_CATALOG__ : [];
const cardSystem = window.EffectCardSystem;

// These are presentation records only. Availability is intentionally conservative:
// IMAGE_GENERATION_E2E_REPORT.md and VIDEO_GENERATION_E2E_REPORT.md are both BLOCKED.
const tools = [
  { id: "ai-image", name: "AI 图片生成", description: "输入描述创建全新图片", kind: "image", icon: "✦", route: "./zh/app/generate/", placement: "featured", availability: "coming_soon" },
  { id: "image-editor", name: "图片编辑", description: "重绘、扩图与局部修改", kind: "image", icon: "⌁", route: "./zh/app/image-editor/", placement: "popular", availability: "coming_soon" },
  { id: "image-combiner", name: "多图合成", description: "组合多张参考素材", kind: "image", icon: "▦", route: "./zh/app/image-combiner/", placement: "preview", availability: "coming_soon" },
  { id: "face-swap", name: "AI 换脸", description: "替换已授权角色的人脸", kind: "image", icon: "◎", route: "./zh/app/face-swap/", placement: "popular", availability: "restricted" },
  { id: "outfit-studio", name: "更换服装", description: "尝试不同服装和造型", kind: "image", icon: "◇", route: "./zh/app/outfit-studio/", placement: "popular", availability: "coming_soon" },
  { id: "pose-generator", name: "姿势生成", description: "调整人物姿势与镜头", kind: "image", icon: "↗", route: "./zh/app/pose-generator/", placement: "preview", availability: "coming_soon" },
  { id: "image-to-video", name: "图片转视频", description: "让静态图片自然动起来", kind: "video", icon: "▶", route: "./zh/app/image-to-video/", placement: "featured", availability: "coming_soon" },
  { id: "video-effects", name: "视频特效", description: "选择模板创建短视频", kind: "video", icon: "◆", route: "./zh/app/spicy-effects/", placement: "popular", availability: "restricted" },
  { id: "upscale", name: "高清修复", description: "增强画面清晰度与细节", kind: "image", icon: "⌗", route: "./zh/app/image-editor/?operation=upscale", placement: "preview", availability: "coming_soon" },
];

const labelForAvailability = {
  active: "可创建",
  preview: "预览",
  coming_soon: "即将上线",
  restricted: "受限内容",
};

function normalized(effect) {
  return cardSystem?.normalizeEffect ? cardSystem.normalizeEffect(effect) : effect;
}

function isActive(effect) {
  const item = normalized(effect);
  return Boolean(item && item.status === "active" && item.workflow_id && item.workflow_status === "active");
}

const activeEffects = catalog.filter(isActive);
const activeImageEffects = activeEffects.filter((item) => item.media_type !== "video");
const activeVideoEffects = activeEffects.filter((item) => item.media_type === "video");

const uploadInput = document.querySelector("[data-home-upload]");
const uploadZone = document.querySelector("[data-home-upload-zone]");
const uploadTitle = document.querySelector("[data-home-upload-title]");
const uploadDetail = document.querySelector("[data-home-upload-detail]");
const promptInput = document.querySelector("[data-home-prompt]");
const effectSelect = document.querySelector("[data-home-effect]");
const generateButton = document.querySelector("[data-home-generate]");
const statusNode = document.querySelector("[data-home-status]");
const costNode = document.querySelector("[data-home-cost]");
const preview = document.querySelector("[data-home-preview]");
let selectedMode = "image";
let selectedFile = null;
let previewUrl = "";

function effectsForMode() {
  return selectedMode === "video" ? activeVideoEffects : activeImageEffects;
}

function selectedEffect() {
  return catalog.find((item) => item.id === effectSelect?.value && isActive(item)) || null;
}

function setStatus(message, tone = "neutral") {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.dataset.tone = tone;
}

function updateGenerateState() {
  const effect = selectedEffect();
  const ready = Boolean(effect && (selectedFile || promptInput?.value.trim()));
  if (generateButton) {
    generateButton.disabled = !ready;
    generateButton.textContent = ready ? "开始创建" : effectsForMode().length ? "添加图片或描述后创建" : "真实生成能力验收中";
  }
  if (!costNode) return;
  const strong = costNode.querySelector("strong");
  const small = costNode.querySelector("small");
  if (effect?.credits !== null && effect?.credits !== undefined) {
    strong.textContent = `${effect.credits} 积分`;
    small.textContent = effect.estimated_time ? `预计 ${effect.estimated_time}` : "提交前会再次确认";
  } else {
    strong.textContent = effect ? "登录后查看积分" : "选择可用能力后显示";
    small.textContent = "不会在前端直接扣费";
  }
}

function renderEffectOptions() {
  if (!effectSelect) return;
  const effects = effectsForMode();
  effectSelect.replaceChildren();
  const option = document.createElement("option");
  option.value = "";
  if (!effects.length) {
    option.textContent = selectedMode === "video" ? "视频能力正在完成真实验收" : "图片能力正在完成真实验收";
    effectSelect.disabled = true;
    setStatus("当前没有达到 E2E_VERIFIED 的能力，因此不会进入假生成页面。");
  } else {
    option.textContent = "请选择能力";
    effectSelect.disabled = false;
  }
  effectSelect.append(option);
  effects.forEach((effect) => {
    const item = document.createElement("option");
    item.value = effect.id;
    item.textContent = effect.name;
    effectSelect.append(item);
  });
  updateGenerateState();
}

function showUploadedPreview(file) {
  if (!preview) return;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.replaceChildren();
  const image = document.createElement("img");
  image.src = previewUrl;
  image.alt = `已选择的参考图片：${file.name}`;
  image.decoding = "async";
  preview.append(image);
  preview.dataset.state = "uploaded";
}

function handleFile(file) {
  if (!file) return;
  if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
    setStatus("请选择 JPG、PNG 或 WebP 图片。", "error");
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    setStatus("图片超过 20MB，请选择更小的文件。", "error");
    return;
  }
  selectedFile = file;
  uploadZone?.classList.add("has-file");
  if (uploadTitle) uploadTitle.textContent = file.name;
  if (uploadDetail) uploadDetail.textContent = `${(file.size / 1024 / 1024).toFixed(1)} MB · 点击可重新选择`;
  showUploadedPreview(file);
  setStatus(effectsForMode().length ? "素材已准备好，请选择能力。" : "素材已准备好；能力完成真实验收后即可创建。");
  updateGenerateState();
}

uploadInput?.addEventListener("change", () => handleFile(uploadInput.files?.[0]));
uploadZone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  uploadZone.classList.add("is-dragging");
});
uploadZone?.addEventListener("dragleave", () => uploadZone.classList.remove("is-dragging"));
uploadZone?.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadZone.classList.remove("is-dragging");
  handleFile(event.dataTransfer?.files?.[0]);
});
promptInput?.addEventListener("input", updateGenerateState);
effectSelect?.addEventListener("change", updateGenerateState);

document.querySelectorAll("[data-home-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedMode = button.dataset.homeMode === "video" ? "video" : "image";
    document.querySelectorAll("[data-home-mode]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    renderEffectOptions();
  });
});

generateButton?.addEventListener("click", async () => {
  const effect = selectedEffect();
  if (!effect) {
    setStatus("该能力尚未完成真实 E2E 验收，当前不能创建。", "error");
    return;
  }
  sessionStorage.setItem("ovs_homepage_generation_intent_v1", JSON.stringify({
    effectId: effect.id,
    mode: selectedMode,
    fileName: selectedFile?.name || "",
    prompt: promptInput?.value.trim() || "",
    createdAt: new Date().toISOString(),
  }));
  const session = await getSession();
  if (!session) {
    const login = document.querySelector("[data-auth-modal]");
    if (login) {
      login.dataset.nextUrl = effect.route;
      login.click();
      return;
    }
  }
  window.location.href = effect.route;
});

function toolCard(tool, size = "compact") {
  const node = document.createElement(tool.availability === "active" ? "a" : "article");
  node.className = `consumer-product-card consumer-product-card--${size}`;
  node.dataset.availability = tool.availability;
  node.dataset.placement = tool.placement;
  if (node.tagName === "A") node.href = tool.route;
  const placementLabel = tool.placement === "featured" ? "精选" : tool.placement === "popular" ? "热门" : "预览";
  node.innerHTML = `
    <span class="consumer-product-card__visual" aria-hidden="true"><b>${tool.icon}</b></span>
    <span class="consumer-product-card__badges">
      <em>${placementLabel}</em>
      <em class="availability">${labelForAvailability[tool.availability]}</em>
    </span>
    <span class="consumer-product-card__copy">
      <strong>${tool.name}</strong>
      <small>${tool.description}</small>
    </span>
    <span class="consumer-product-card__action">${tool.availability === "active" ? "开始创建 →" : labelForAvailability[tool.availability]}</span>
  `;
  if (tool.availability !== "active") {
    node.setAttribute("aria-disabled", "true");
    node.title = "尚未完成真实 E2E 验收";
  }
  return node;
}

function renderTools(selector, items, size) {
  const root = document.querySelector(selector);
  if (!root) return;
  root.replaceChildren(...items.map((tool) => toolCard(tool, size)));
}

function renderPopularEffects() {
  const root = document.querySelector("[data-home-popular]");
  if (!root) return;
  const items = [
    tools.find((item) => item.id === "ai-image"),
    tools.find((item) => item.id === "image-editor"),
    tools.find((item) => item.id === "outfit-studio"),
    tools.find((item) => item.id === "image-to-video"),
  ].filter(Boolean);
  renderTools("[data-home-popular]", items, "media");
}

function renderRecentEmpty(title, copy, actionText = "") {
  const root = document.querySelector("[data-home-recent]");
  if (!root) return;
  root.className = "consumer-home-recent";
  root.innerHTML = `
    <span aria-hidden="true">▧</span>
    <strong>${title}</strong>
    <p>${copy}</p>
    ${actionText ? `<a href="./zh/my-creations/">${actionText}</a>` : ""}
  `;
}

async function loadRecentCreations() {
  const session = await getSession();
  if (!session) return;
  if (!isSupabaseConfigured) {
    renderRecentEmpty("暂时无法读取作品", "作品服务尚未配置。");
    return;
  }
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("generation_jobs")
      .select("id,status,media_type,result_url,created_at,tool_slug")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(4);
    if (error) throw error;
    if (!data?.length) {
      renderRecentEmpty("还没有创作记录", "完成第一个真实生成任务后，作品会显示在这里。", "打开我的作品");
      return;
    }
    const root = document.querySelector("[data-home-recent]");
    root.className = "consumer-home-recent-grid";
    root.replaceChildren(...data.map((item) => {
      const card = document.createElement("a");
      card.href = `./zh/my-creations/?task=${encodeURIComponent(item.id)}`;
      card.className = "consumer-recent-card";
      const media = item.result_url
        ? item.media_type === "video"
          ? `<video src="${item.result_url}" muted playsinline preload="metadata" aria-label="最近生成的视频"></video>`
          : `<img src="${item.result_url}" alt="最近生成的图片" loading="lazy">`
        : `<span aria-hidden="true">▧</span>`;
      card.innerHTML = `${media}<span><strong>${item.tool_slug || "生成任务"}</strong><small>${item.status} · ${new Date(item.created_at).toLocaleDateString("zh-CN")}</small></span>`;
      return card;
    }));
  } catch {
    renderRecentEmpty("暂时无法读取作品", "请稍后重试，或前往“我的作品”查看。", "打开我的作品");
  }
}

renderEffectOptions();
renderPopularEffects();
renderTools("[data-home-recommended-tools]", tools.filter((item) => ["featured", "popular"].includes(item.placement)).slice(0, 5), "compact");
renderTools("[data-home-image-tools]", tools.filter((item) => item.kind === "image").slice(0, 6), "wide");
renderTools("[data-home-video-tools]", tools.filter((item) => item.kind === "video"), "wide");
loadRecentCreations();

window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});
