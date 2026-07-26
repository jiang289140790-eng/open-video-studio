(function registerEffectCatalog() {
  "use strict";

  const preview = (effect) => ({
    media_type: "image",
    thumbnail_url: null,
    poster_url: null,
    preview_video_url: null,
    workflow_id: null,
    workflow_status: "unconfigured",
    status: "preview_only",
    visual_style: "realistic",
    credits: null,
    badge: null,
    estimated_time: null,
    ...effect
  });

  const catalog = [
    preview({ id: "tool-image-editor", slug: "image-editor", name: "图片编辑器", category: "image-tool", description: "重绘、扩图与修复", route: "./zh/app/image-editor/", workflow_id: "workflow-hifun-image-editor-v1" }),
    preview({ id: "tool-face-swap", slug: "face-swap", name: "AI 换脸", category: "image-tool", description: "授权虚构角色换脸", route: "./zh/app/face-swap/", workflow_id: "workflow-hifun-face-swap-v1" }),
    preview({ id: "tool-outfit-studio", slug: "outfit-studio", name: "性感礼服", category: "outfit", description: "服饰与造型选择", route: "./zh/app/outfit-studio/", workflow_id: "workflow-hifun-outfit-v1" }),
    preview({ id: "tool-pose-generator", slug: "pose-generator", name: "性爱姿势", category: "pose", description: "姿势和镜头参考", route: "./zh/app/pose-generator/", workflow_id: "workflow-hifun-pose-v1" }),
    preview({ id: "tool-image-to-video", slug: "image-to-video", name: "图片转视频", category: "video-tool", description: "将参考图生成动态视频", route: "./zh/app/image-to-video/", media_type: "video", workflow_id: "workflow-hifun-image-to-video-v1", badge: "NEW" }),
    preview({ id: "tool-spicy-effects", slug: "spicy-effects", name: "辣味效果", category: "spicy", description: "18+ 效果目录", route: "./zh/app/spicy-effects/", media_type: "video", badge: "HOT" }),

    preview({ id: "effect-undress-video", slug: "undress-video", name: "Undress Video", category: "spicy", description: "服装变化视频效果", route: "./zh/app/undress-video/", media_type: "video", workflow_id: "workflow-hifun-adult-effects-v1", credits: 40, badge: "HOT" }),
    preview({ id: "effect-cumshot", slug: "cumshot", name: "Cumshot", category: "spicy", description: "成人动作效果", route: "./zh/app/undress-video/?preset=cumshot", media_type: "video", workflow_id: "workflow-hifun-adult-effects-v1", credits: 40 }),
    preview({ id: "effect-cumshot-huge", slug: "cumshot-huge", name: "Cumshot Huge", category: "spicy", description: "强化动作版本", route: "./zh/app/undress-video/?preset=cumshot-huge", media_type: "video", workflow_id: "workflow-hifun-adult-effects-v1", credits: 40 }),
    preview({ id: "effect-posing-nude", slug: "posing-nude", name: "Posing Nude", category: "pose", description: "姿势参考", route: "./zh/app/pose-generator/?preset=posing-nude", workflow_id: "workflow-hifun-pose-v1", credits: 8 }),
    preview({ id: "effect-pov-cumshot", slug: "blowjob-pov-cumshot", name: "BlowJob POV & Cumshot", category: "spicy", description: "第一人称动作预设", route: "./zh/app/undress-video/?preset=pov-cumshot", media_type: "video", workflow_id: "workflow-hifun-adult-effects-v1", credits: 40 }),
    preview({ id: "effect-squirting", slug: "squirting", name: "Squirting", category: "spicy", description: "动作效果预设", route: "./zh/app/undress-video/?preset=squirting", media_type: "video", workflow_id: "workflow-hifun-adult-effects-v1", credits: 40 }),
    preview({ id: "effect-blowjob-pov", slug: "blowjob-pov", name: "BlowJob POV", category: "pose", description: "第一人称姿势", route: "./zh/app/pose-generator/?preset=blowjob-pov", workflow_id: "workflow-hifun-pose-v1", credits: 8 }),
    preview({ id: "effect-missionary", slug: "missionary", name: "Missionary", category: "pose", description: "双人姿势参考", route: "./zh/app/pose-generator/?preset=missionary", workflow_id: "workflow-hifun-pose-v1", credits: 8 }),
    preview({ id: "effect-doggystyle", slug: "doggystyle-undressed", name: "Doggystyle Undressed", category: "pose", description: "电影感姿势参考", route: "./zh/app/pose-generator/?preset=doggystyle", workflow_id: "workflow-hifun-pose-v1", credits: 8 }),

    preview({ id: "outfit-business", slug: "business", name: "职业装 / 正装", category: "outfit", description: "商务造型", route: "./zh/app/outfit-studio/?preset=business", workflow_id: "workflow-hifun-outfit-v1", credits: 12 }),
    preview({ id: "outfit-street", slug: "street", name: "街拍风格", category: "outfit", description: "休闲与潮流造型", route: "./zh/app/outfit-studio/?preset=street", workflow_id: "workflow-hifun-outfit-v1", credits: 12 }),
    preview({ id: "outfit-evening", slug: "evening", name: "晚装礼服", category: "outfit", description: "正式场合造型", route: "./zh/app/outfit-studio/?preset=evening", workflow_id: "workflow-hifun-outfit-v1", credits: 16 }),
    preview({ id: "outfit-social", slug: "social", name: "社媒时尚", category: "outfit", description: "网红与时尚造型", route: "./zh/app/outfit-studio/?preset=social", workflow_id: "workflow-hifun-outfit-v1", credits: 12 }),
    preview({ id: "outfit-lace-lingerie", slug: "lace-lingerie", name: "Lace Lingerie", category: "outfit", description: "蕾丝礼服风格", route: "./zh/app/outfit-studio/?preset=lingerie", workflow_id: "workflow-hifun-outfit-v1", credits: 16 }),
    preview({ id: "outfit-custom", slug: "custom-outfit", name: "Custom", category: "outfit", description: "自定义造型描述", route: "./zh/app/outfit-studio/?preset=custom", workflow_id: "workflow-hifun-outfit-v1", credits: null }),

    preview({ id: "pose-custom", slug: "custom-pose", name: "Custom Prompt", category: "pose", description: "输入自定义姿势描述", route: "./zh/app/pose-generator/?preset=custom", workflow_id: "workflow-hifun-pose-v1", credits: 8 }),
    preview({ id: "pose-standing", slug: "standing", name: "站立展示", category: "pose", description: "站姿参考", route: "./zh/app/pose-generator/?preset=standing", workflow_id: "workflow-hifun-pose-v1", credits: 8 }),
    preview({ id: "pose-action", slug: "action", name: "动作姿势", category: "pose", description: "动作参考", route: "./zh/app/pose-generator/?preset=action", workflow_id: "workflow-hifun-pose-v1", credits: 8 }),
    preview({ id: "pose-camera", slug: "camera", name: "镜头角度", category: "pose", description: "镜头与构图参考", route: "./zh/app/pose-generator/?preset=camera", workflow_id: "workflow-hifun-pose-v1", credits: 8 })
  ];

  const byId = Object.fromEntries(catalog.map((item) => [item.id, Object.freeze(item)]));
  const bySlug = Object.fromEntries(catalog.map((item) => [item.slug, Object.freeze(item)]));

  window.__EFFECT_CATALOG__ = Object.freeze(catalog.map(Object.freeze));
  window.__EFFECT_CATALOG_BY_ID__ = Object.freeze(byId);
  window.__EFFECT_CATALOG_BY_SLUG__ = Object.freeze(bySlug);
})();
