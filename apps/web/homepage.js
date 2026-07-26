import { getSession } from "./auth-service.js";

const catalog = Array.isArray(window.__EFFECT_CATALOG__) ? window.__EFFECT_CATALOG__ : [];
const cardSystem = window.EffectCardSystem;

const imageTools = [
  { id: "tool-image-editor", name: "图片编辑器", description: "重绘、扩图与局部修改", route: "./zh/app/image-editor/", icon: "✦" },
  { id: "tool-face-swap", name: "AI 换脸", description: "授权角色的自然换脸", route: "./zh/app/face-swap/", icon: "◎" },
  { id: "tool-outfit-studio", name: "服装变换", description: "选择服装和造型方向", route: "./zh/app/outfit-studio/", icon: "◇" },
  { id: "tool-pose-generator", name: "姿势生成", description: "选择姿势和镜头参考", route: "./zh/app/pose-generator/", icon: "↗" },
  { id: "tool-image-combiner", name: "图片组合", description: "组合多张参考图片", route: "./zh/app/image-combiner/", icon: "▦" },
];

function normalized(effect) {
  return cardSystem?.normalizeEffect ? cardSystem.normalizeEffect(effect) : effect;
}

function isActive(effect) {
  const item = normalized(effect);
  return Boolean(item && item.status === "active" && item.workflow_id && item.workflow_status === "active");
}

function hasRealPreview(effect) {
  const item = normalized(effect);
  return Boolean(item?.thumbnail_url || item?.poster_url || item?.preview_video_url);
}

const activeEffects = catalog.filter(isActive);
const verifiedEffects = activeEffects.filter(hasRealPreview);
const activeImageEffects = activeEffects.filter((item) => item.media_type !== "video");
const activeVideoEffects = activeEffects.filter((item) => item.media_type === "video");
const featuredEffects = verifiedEffects
  .filter((item) => item.featured || item.badge === "HOT" || item.badge === "NEW")
  .slice(0, 12);

const uploadInput = document.querySelector("[data-home-upload]");
const uploadZone = document.querySelector("[data-home-upload-zone]");
const uploadTitle = document.querySelector("[data-home-upload-title]");
const uploadDetail = document.querySelector("[data-home-upload-detail]");
const effectSelect = document.querySelector("[data-home-effect]");
const generateButton = document.querySelector("[data-home-generate]");
const statusNode = document.querySelector("[data-home-status]");
const costNode = document.querySelector("[data-home-cost]");
const preview = document.querySelector("[data-home-preview]");
const previewDots = document.querySelector("[data-home-preview-dots]");
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
  const ready = Boolean(selectedFile && effect);
  if (generateButton) {
    generateButton.disabled = !ready;
    generateButton.textContent = ready ? "立即生成" : effectsForMode().length ? "上传图片后生成" : "可用效果接入中";
  }
  if (costNode) {
    const strong = costNode.querySelector("strong");
    const small = costNode.querySelector("small");
    if (effect?.credits !== null && effect?.credits !== undefined) {
      strong.textContent = `${effect.credits} 积分`;
      small.textContent = effect.estimated_time ? `预计 ${effect.estimated_time}` : "提交前会再次确认";
    } else {
      strong.textContent = effect ? "登录后查看积分" : "尚未选择可用效果";
      small.textContent = effect ? "提交前会再次确认" : "选择可用效果后显示";
    }
  }
}

function renderEffectOptions() {
  if (!effectSelect) return;
  const effects = effectsForMode();
  effectSelect.replaceChildren();
  if (!effects.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = selectedMode === "video" ? "暂无已验证的视频效果" : "暂无已验证的图片效果";
    effectSelect.append(option);
    effectSelect.disabled = true;
    setStatus("工作流仍需完成输入输出与真实运行验证，当前不开放生成。");
  } else {
    effectSelect.disabled = false;
    for (const effect of effects) {
      const option = document.createElement("option");
      option.value = effect.id;
      option.textContent = effect.name;
      effectSelect.append(option);
    }
    setStatus(selectedFile ? "已选择图片，可以生成。" : "选择效果后上传图片；点击生成时再检查登录和积分。");
  }
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
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(file.type)) {
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
  setStatus(effectsForMode().length ? "图片已准备好，请选择效果。" : "图片已准备好；可用效果通过验证后即可生成。");
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

effectSelect?.addEventListener("change", updateGenerateState);

generateButton?.addEventListener("click", async () => {
  const effect = selectedEffect();
  if (!selectedFile || !effect) {
    setStatus("请先上传图片并选择已验证效果。", "error");
    return;
  }
  sessionStorage.setItem(
    "ovs_homepage_generation_intent_v1",
    JSON.stringify({ effectId: effect.id, mode: selectedMode, fileName: selectedFile.name, createdAt: new Date().toISOString() }),
  );
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

function renderEffectGrid(selector, items, emptySelector, className = "") {
  const grid = document.querySelector(selector);
  const empty = document.querySelector(emptySelector);
  if (!grid || !cardSystem) return;
  grid.replaceChildren();
  for (const item of items) {
    const card = cardSystem.EffectCard(item, { className });
    if (card) grid.append(card);
  }
  if (empty) empty.hidden = items.length > 0;
}

function renderImageTools() {
  const grid = document.querySelector("[data-home-image-tools]");
  if (!grid) return;
  for (const tool of imageTools) {
    const catalogItem = catalog.find((item) => item.id === tool.id);
    const active = catalogItem ? isActive(catalogItem) : false;
    const link = document.createElement("a");
    link.className = "consumer-home-tool-card";
    link.href = tool.route;
    link.innerHTML = `
      <span class="consumer-home-tool-icon" aria-hidden="true">${tool.icon}</span>
      <span><strong>${tool.name}</strong><small>${tool.description}</small></span>
      <em class="${active ? "is-active" : ""}">${active ? "可使用" : "即将上线"}</em>
    `;
    grid.append(link);
  }
}

function renderVerifiedPreview() {
  if (!preview || !cardSystem || !verifiedEffects.length || selectedFile) return;
  const effect = verifiedEffects[0];
  preview.replaceChildren(cardSystem.EffectMedia(effect));
  preview.dataset.state = "verified";
  if (previewDots) {
    previewDots.replaceChildren();
    verifiedEffects.slice(0, 5).forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = index === 0 ? "active" : "";
      button.setAttribute("aria-label", `查看 ${item.name} 预览`);
      button.addEventListener("click", () => {
        preview.replaceChildren(cardSystem.EffectMedia(item));
        previewDots.querySelectorAll("button").forEach((dot) => dot.classList.toggle("active", dot === button));
      });
      previewDots.append(button);
    });
  }
}

renderEffectOptions();
renderEffectGrid("[data-home-popular]", featuredEffects, "[data-home-popular-empty]", "effect-card--homepage");
renderEffectGrid("[data-home-video-effects]", activeVideoEffects.filter(hasRealPreview).slice(0, 8), "[data-home-video-empty]", "effect-card--homepage");
renderImageTools();
renderVerifiedPreview();

window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});
