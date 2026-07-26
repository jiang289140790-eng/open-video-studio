const DIRECTORY = {
  image: {
    eyebrow: "图片创作",
    title: "选择你想完成的事情",
    description: "无需了解模型名称。按创作目标选择工具，未完成真实验收的能力会明确显示“即将上线”。",
    filters: ["全部", "生成", "编辑", "人物", "增强"],
    tools: [
      { name: "AI 图片生成", description: "输入描述，创建全新图片", category: "生成", icon: "✦", placement: "featured", availability: "coming_soon" },
      { name: "图片编辑", description: "重绘、扩图和局部修改", category: "编辑", icon: "⌁", placement: "popular", availability: "coming_soon" },
      { name: "多图合成", description: "组合多张参考图片", category: "编辑", icon: "▦", placement: "preview", availability: "coming_soon" },
      { name: "AI 换脸", description: "替换已授权角色的人脸", category: "人物", icon: "◎", placement: "popular", availability: "restricted" },
      { name: "更换服装", description: "尝试不同服装和造型", category: "人物", icon: "◇", placement: "popular", availability: "coming_soon" },
      { name: "姿势生成", description: "调整人物姿势和镜头", category: "人物", icon: "↗", placement: "preview", availability: "coming_soon" },
      { name: "高清修复", description: "增强清晰度与画面细节", category: "增强", icon: "⌗", placement: "preview", availability: "coming_soon" },
    ],
  },
  video: {
    eyebrow: "视频创作",
    title: "从一张图片开始制作视频",
    description: "选择适合的创作方向。只有完成真实 MP4 生成、回传和播放验收的能力才会开放创建。",
    filters: ["全部", "图生视频", "特效", "最新"],
    tools: [
      { name: "图片转视频", description: "让静态人物、商品或场景自然动起来", category: "图生视频", icon: "▶", placement: "featured", availability: "coming_soon" },
      { name: "通用动态", description: "添加自然运动和镜头变化", category: "图生视频", icon: "◉", placement: "popular", availability: "coming_soon" },
      { name: "视频特效", description: "使用视觉模板创建短视频", category: "特效", icon: "◆", placement: "popular", availability: "restricted" },
      { name: "热门模板", description: "查看当前受欢迎的创作方向", category: "特效", icon: "◇", placement: "preview", availability: "coming_soon" },
      { name: "最新模板", description: "查看正在验收的新能力", category: "最新", icon: "＋", placement: "preview", availability: "coming_soon" },
    ],
  },
};

const labels = {
  active: "可创建",
  preview: "预览",
  coming_soon: "即将上线",
  restricted: "受限内容",
};

const root = document.querySelector("[data-consumer-tool-directory]");
const type = root?.dataset.directoryType === "video" ? "video" : "image";
const config = DIRECTORY[type];
let activeFilter = "全部";
let query = "";

function card(tool) {
  const node = document.createElement(tool.availability === "active" ? "a" : "article");
  node.className = "directory-tool-card";
  node.dataset.category = tool.category;
  node.dataset.search = `${tool.name} ${tool.description} ${tool.category}`.toLowerCase();
  node.dataset.availability = tool.availability;
  node.dataset.placement = tool.placement;
  if (node.tagName === "A") node.href = tool.route;
  const placement = tool.placement === "featured" ? "精选" : tool.placement === "popular" ? "热门" : "预览";
  node.innerHTML = `
    <span class="directory-tool-card__media" aria-hidden="true">${tool.icon}</span>
    <span class="directory-tool-card__badges"><em>${placement}</em><em>${labels[tool.availability]}</em></span>
    <span class="directory-tool-card__copy"><strong>${tool.name}</strong><small>${tool.description}</small></span>
    <span class="directory-tool-card__footer"><b>${tool.category}</b><span>${tool.availability === "active" ? "开始创建 →" : labels[tool.availability]}</span></span>
  `;
  if (tool.availability !== "active") {
    node.setAttribute("aria-disabled", "true");
    node.title = "尚未完成真实 E2E 验收";
  }
  return node;
}

function render() {
  if (!root) return;
  const list = config.tools.filter((tool) => {
    const filterMatch = activeFilter === "全部" || tool.category === activeFilter;
    const queryMatch = !query || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(query);
    return filterMatch && queryMatch;
  });
  const grid = root.querySelector("[data-directory-grid]");
  grid.replaceChildren(...list.map(card));
  root.querySelector("[data-directory-empty]").hidden = list.length > 0;
}

if (root) {
  root.querySelector("[data-directory-eyebrow]").textContent = config.eyebrow;
  root.querySelector("[data-directory-title]").textContent = config.title;
  root.querySelector("[data-directory-description]").textContent = config.description;
  const filters = root.querySelector("[data-directory-filters]");
  filters.replaceChildren(...config.filters.map((filter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = filter;
    button.dataset.toolHomeFilter = filter === "全部" ? "all" : filter === "热门" ? "hot" : filter;
    button.className = index === 0 ? "active" : "";
    button.addEventListener("click", () => {
      activeFilter = filter;
      filters.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
      render();
    });
    return button;
  }));
  root.querySelector("[data-directory-search]").addEventListener("input", (event) => {
    query = event.target.value.trim().toLowerCase();
    render();
  });
  render();
}
