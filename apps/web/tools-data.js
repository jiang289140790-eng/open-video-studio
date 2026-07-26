// Consumer tool directory assembled from the normalized effect catalog.
(function registerToolsData() {
  "use strict";
  const byId = window.__EFFECT_CATALOG_BY_ID__ || {};
  const pick = (...ids) => ids.map((id) => byId[id]).filter(Boolean);

  window.__TOOLS_DATA__ = {
    hero: {
      title: "AI 图片与视频工具",
      subtitle: "选择效果，进入生成页面",
      desc: "浏览已登记的图片与视频效果。没有完成工作流验证的功能会明确标记为“即将上线”。",
      cta: "浏览辣味效果",
      link: "./zh/app/spicy-effects/",
      effect_id: "tool-spicy-effects"
    },
    quickTools: pick(
      "tool-image-editor",
      "tool-face-swap",
      "tool-outfit-studio",
      "tool-pose-generator",
      "tool-image-to-video",
      "tool-spicy-effects"
    ),
    sections: [
      {
        id: "spicy-effects",
        title: "辣味效果",
        link: "./zh/app/spicy-effects/",
        count: "10",
        filterTags: ["全部", "最新", "热门", "姿势", "动作"],
        items: pick(
          "effect-undress-video",
          "effect-cumshot",
          "effect-cumshot-huge",
          "effect-posing-nude",
          "effect-pov-cumshot",
          "effect-squirting",
          "effect-blowjob-pov",
          "effect-missionary",
          "effect-doggystyle"
        )
      },
      {
        id: "pose-generator",
        title: "AI 姿势生成器",
        link: "./zh/app/pose-generator/",
        count: "4",
        items: pick("pose-custom", "pose-standing", "pose-action", "pose-camera")
      },
      {
        id: "sexy-outfits",
        title: "性感装扮",
        link: "./zh/app/outfit-studio/",
        count: "6",
        items: pick(
          "outfit-business",
          "outfit-street",
          "outfit-evening",
          "outfit-social",
          "outfit-lace-lingerie",
          "outfit-custom"
        )
      }
    ]
  };
})();
