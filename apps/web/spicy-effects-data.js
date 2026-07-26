// Spicy effects page uses the same normalized catalog as the home directory.
(function registerSpicyData() {
  "use strict";
  const byId = window.__EFFECT_CATALOG_BY_ID__ || {};
  const ids = [
    "tool-image-to-video",
    "effect-undress-video",
    "effect-cumshot",
    "effect-cumshot-huge",
    "effect-posing-nude",
    "effect-pov-cumshot",
    "effect-squirting",
    "effect-blowjob-pov",
    "effect-missionary",
    "effect-doggystyle"
  ];
  const tagsById = {
    "tool-image-to-video": ["热门", "动作"],
    "effect-undress-video": ["最新", "动作"],
    "effect-cumshot": ["热门", "动作"],
    "effect-cumshot-huge": ["热门", "动作"],
    "effect-posing-nude": ["姿势"],
    "effect-pov-cumshot": ["热门", "动作"],
    "effect-squirting": ["动作"],
    "effect-blowjob-pov": ["姿势"],
    "effect-missionary": ["姿势"],
    "effect-doggystyle": ["姿势"]
  };
  window.__SPICY_DATA__ = {
    header: {
      title: "辣味效果",
      count: "10",
      desc: "浏览已登记的 18+ 图片与视频效果",
      ageNotice: "进入特效前请确认你已年满18岁，并同意平台内容政策与素材授权规则。"
    },
    filterTags: ["全部", "最新", "热门", "姿势", "动作"],
    cards: ids.map((id) => byId[id] ? { ...byId[id], tags: tagsById[id] || [] } : null).filter(Boolean)
  };
})();
