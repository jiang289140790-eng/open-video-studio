(function registerEffectCardSystem() {
  "use strict";

  const EFFECT_STATUSES = new Set(["active", "preview_only", "disabled"]);
  const EXTERNAL_MEDIA_HOSTS = new Set([
    "wyvswkxogkmywduhrhkw.supabase.co"
  ]);
  const WINDOWS_PATH = /^[a-z]:[\\/]/i;
  const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

  function siteBaseUrl() {
    const path = window.location.pathname;
    const marker = "/open-video-studio/";
    const index = path.indexOf(marker);
    if (index >= 0) return new URL(path.slice(0, index + marker.length), window.location.origin);
    return new URL("./", window.location.href);
  }

  function resolveMediaUrl(value) {
    const raw = String(value || "").trim();
    if (!raw || WINDOWS_PATH.test(raw) || raw.startsWith("file:")) return null;
    try {
      const resolved = new URL(raw.replace(/^\/+/, ""), raw.startsWith("http") || raw.startsWith("blob:") || raw.startsWith("data:") ? window.location.href : siteBaseUrl());
      if (resolved.protocol === "blob:" || resolved.protocol === "data:") return resolved.href;
      if (!["http:", "https:"].includes(resolved.protocol)) return null;
      if (LOCAL_HOSTS.has(resolved.hostname) && !LOCAL_HOSTS.has(window.location.hostname)) return null;
      if (resolved.origin === window.location.origin || EXTERNAL_MEDIA_HOSTS.has(resolved.hostname)) return resolved.href;
      return null;
    } catch {
      return null;
    }
  }

  function normalizeEffect(input = {}) {
    const workflowId = String(input.workflow_id || input.workflowId || "").trim() || null;
    const requestedStatus = EFFECT_STATUSES.has(input.status) ? input.status : "preview_only";
    const workflowActive = input.workflow_status === "active";
    const status = requestedStatus === "active" && workflowId && workflowActive ? "active" : requestedStatus === "disabled" ? "disabled" : "preview_only";
    return {
      id: String(input.id || input.slug || "effect"),
      slug: String(input.slug || input.id || "effect"),
      name: String(input.name || "未命名效果"),
      category: String(input.category || "effect"),
      media_type: input.media_type === "video" ? "video" : "image",
      thumbnail_url: resolveMediaUrl(input.thumbnail_url || input.thumbnailUrl),
      poster_url: resolveMediaUrl(input.poster_url || input.posterUrl || input.thumbnail_url || input.thumbnailUrl),
      preview_video_url: resolveMediaUrl(input.preview_video_url || input.previewVideoUrl),
      workflow_id: workflowId,
      workflow_status: input.workflow_status || "unconfigured",
      status,
      visual_style: ["realistic", "anime", "illustration"].includes(input.visual_style) ? input.visual_style : "realistic",
      route: String(input.route || input.link || ""),
      description: String(input.description || input.desc || ""),
      credits: input.credits !== null && input.credits !== undefined && input.credits !== "" && Number.isFinite(Number(input.credits))
        ? Number(input.credits)
        : null,
      badge: input.badge || input.tag || null,
      estimated_time: input.estimated_time || null,
      tags: Array.isArray(input.tags) ? input.tags : []
    };
  }

  function MediaSkeleton() {
    const node = document.createElement("span");
    node.className = "media-skeleton";
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  function MediaErrorFallback() {
    const node = document.createElement("span");
    node.className = "media-error-fallback";
    node.setAttribute("role", "status");
    const icon = document.createElement("span");
    icon.className = "media-error-fallback__icon";
    icon.textContent = "▧";
    const label = document.createElement("span");
    label.textContent = "预览准备中";
    node.append(icon, label);
    return node;
  }

  function VideoHoverPreview(effect, onReady, onError) {
    const video = document.createElement("video");
    video.className = "effect-media__video";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.poster = effect.poster_url || "";
    video.src = effect.preview_video_url || "";
    video.setAttribute("aria-label", `${effect.name} 视频预览`);
    let stopTimer = 0;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const stop = () => {
      window.clearTimeout(stopTimer);
      video.pause();
      try { video.currentTime = 0; } catch {}
    };
    if (canHover) {
      video.addEventListener("mouseenter", () => {
        video.play().catch(() => {});
        stopTimer = window.setTimeout(stop, 4000);
      });
      video.addEventListener("mouseleave", stop);
    }
    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    return video;
  }

  function EffectMedia(input) {
    const effect = normalizeEffect(input);
    const frame = document.createElement("span");
    frame.className = `effect-media effect-media--${effect.media_type}`;
    frame.dataset.mediaState = "loading";
    const skeleton = MediaSkeleton();
    frame.append(skeleton);
    const ready = () => {
      frame.dataset.mediaState = "ready";
      skeleton.remove();
    };
    const failed = () => {
      frame.dataset.mediaState = "error";
      frame.replaceChildren(MediaErrorFallback());
    };

    if (effect.media_type === "video" && effect.preview_video_url) {
      frame.append(VideoHoverPreview(effect, ready, failed));
      return frame;
    }
    const source = effect.poster_url || effect.thumbnail_url;
    if (!source) {
      failed();
      return frame;
    }
    const image = document.createElement("img");
    image.className = "effect-media__image";
    image.src = source;
    image.alt = `${effect.name} 效果预览`;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("load", ready, { once: true });
    image.addEventListener("error", failed, { once: true });
    frame.append(image);
    return frame;
  }

  function badge(label, variant) {
    const node = document.createElement("span");
    node.className = `effect-card__badge effect-card__badge--${variant}`;
    node.textContent = label;
    return node;
  }

  function EffectCard(input, options = {}) {
    const effect = normalizeEffect(input);
    if (effect.status === "disabled") return null;
    const card = document.createElement(effect.status === "active" ? "a" : "article");
    card.className = `effect-card effect-card--${effect.status} effect-card--${effect.visual_style}`;
    card.dataset.effectId = effect.id;
    card.dataset.effectStatus = effect.status;
    card.dataset.mediaType = effect.media_type;
    card.dataset.toolHomeCard = "";
    card.dataset.toolTags = [effect.category, effect.media_type, effect.badge || "", effect.name, ...(effect.tags || [])].join(" ");
    if (effect.status === "active") card.href = effect.route;

    const mediaLink = effect.status === "preview_only" && effect.route ? document.createElement("a") : document.createElement("span");
    mediaLink.className = "effect-card__media-link";
    if (mediaLink.tagName === "A") {
      mediaLink.href = effect.route;
      mediaLink.setAttribute("aria-label", `查看 ${effect.name} 详情`);
    }
    mediaLink.append(EffectMedia(effect));

    const badges = document.createElement("span");
    badges.className = "effect-card__badges";
    badges.append(badge(effect.media_type === "video" ? "视频" : "图片", "type"));
    if (effect.visual_style === "anime") badges.append(badge("动漫", "anime"));
    if (effect.visual_style === "illustration") badges.append(badge("插画", "illustration"));
    if (effect.badge) badges.append(badge(effect.badge, String(effect.badge).toLowerCase()));
    if (effect.status === "preview_only") badges.append(badge("即将上线", "coming"));
    mediaLink.append(badges);

    const body = document.createElement("span");
    body.className = "effect-card__body";
    const title = document.createElement("strong");
    title.textContent = effect.name;
    const desc = document.createElement("small");
    desc.textContent = effect.description || "效果信息准备中";
    const meta = document.createElement("span");
    meta.className = "effect-card__meta";
    const cost = document.createElement("span");
    cost.textContent = effect.credits === null ? "登录后查看" : `${effect.credits} 积分`;
    const state = document.createElement("span");
    state.className = `effect-card__state effect-card__state--${effect.status}`;
    state.textContent = effect.status === "active" ? "立即生成" : "即将上线";
    meta.append(cost, state);
    body.append(title, desc, meta);
    card.append(mediaLink, body);

    if (options.tags) card.dataset.toolTags += ` ${options.tags}`;
    if (options.className) card.classList.add(...String(options.className).split(/\s+/).filter(Boolean));
    return card;
  }

  function slugify(value) {
    return String(value || "").trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "");
  }

  function findCatalogItem(name) {
    const slug = slugify(name);
    return (window.__EFFECT_CATALOG__ || []).find((item) => item.slug === slug || slugify(item.name) === slug) || null;
  }

  function hydrateLegacyEffectCards(root = document) {
    root.querySelectorAll(".video-effect-card, .spicy-effect-card").forEach((legacy) => {
      if (legacy.dataset.effectHydrated === "true") return;
      const name = legacy.querySelector("strong")?.textContent?.trim() || "未命名效果";
      const description = legacy.querySelector("small")?.textContent?.trim() || "";
      const creditsMatch = legacy.querySelector("em")?.textContent?.match(/\d+/);
      const catalogItem = findCatalogItem(name);
      const normalized = catalogItem || {
        id: `legacy-${slugify(name)}`,
        slug: slugify(name),
        name,
        description,
        category: "spicy",
        media_type: "video",
        route: legacy.getAttribute("href") || "",
        status: "preview_only",
        visual_style: "realistic",
        credits: creditsMatch ? Number(creditsMatch[0]) : null
      };
      const replacement = EffectCard(normalized, {
        tags: legacy.dataset.toolTags || legacy.dataset.spicyTags || ""
      });
      if (replacement) {
        replacement.dataset.effectHydrated = "true";
        legacy.replaceWith(replacement);
      } else {
        legacy.remove();
      }
    });
  }

  function hydrateEffectOptions(root = document) {
    root.querySelectorAll(".video-effect-choice[data-effect-id]").forEach((option) => {
      if (option.dataset.effectMediaHydrated === "true") return;
      const effect = window.__EFFECT_CATALOG_BY_ID__?.[option.dataset.effectId];
      if (!effect) return;
      option.classList.remove(...Array.from(option.classList).filter((name) => /^art-\d+$/.test(name)));
      option.prepend(EffectMedia(effect));
      const status = document.createElement("span");
      status.className = "effect-option__status";
      status.textContent = normalizeEffect(effect).status === "active" ? "可用" : "预览准备中";
      option.append(status);
      option.dataset.effectMediaHydrated = "true";
    });
  }

  window.EffectCardSystem = Object.freeze({
    resolveMediaUrl,
    normalizeEffect,
    MediaSkeleton,
    MediaErrorFallback,
    VideoHoverPreview,
    EffectMedia,
    EffectCard,
    hydrateLegacyEffectCards,
    hydrateEffectOptions
  });

  window.addEventListener("DOMContentLoaded", () => {
    hydrateLegacyEffectCards(document);
    hydrateEffectOptions(document);
  }, { once: true });
})();
