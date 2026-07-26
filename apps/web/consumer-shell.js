const CONSUMER_PAGE_NAMES = new Set([
  "app.html",
  "spicy-effects.html",
  "tool.html",
  "image-editor.html",
  "face-swap.html",
  "outfit-studio.html",
  "pose-generator.html",
  "image-to-video.html",
  "my-creations.html",
  "pricing.html",
  "free-coins.html",
]);

const SIDEBAR_ITEMS = [
  { key: "home", label: "首页", href: "./zh/app/" },
  { key: "spicy-effects", label: "辣味效果", href: "./zh/app/spicy-effects/", hot: true },
  { type: "label", label: "AI 图像" },
  { key: "image-editor", label: "图片编辑器", href: "./zh/app/image-editor/" },
  { key: "face-swap", label: "AI 换脸", href: "./zh/app/face-swap/" },
  { key: "outfit-studio", label: "性感礼服", href: "./zh/app/outfit-studio/" },
  { key: "pose-generator", label: "性爱姿势", href: "./zh/app/pose-generator/" },
  { type: "label", label: "AI 视频" },
  { key: "image-to-video", label: "图片转视频", href: "./zh/app/image-to-video/" },
  { key: "my-creations", label: "我的作品", href: "./zh/my-creations/" },
];

function getPageName() {
  const pathname = window.location.pathname.replace(/\/+$/, "");
  return pathname.split("/").pop() || "index.html";
}

function getActiveConsumerRoute(pageName = getPageName()) {
  if (pageName === "app.html") return "home";
  if (pageName === "spicy-effects.html") return "spicy-effects";
  if (pageName === "my-creations.html") return "my-creations";
  if (pageName === "image-editor.html") return "image-editor";
  if (pageName === "face-swap.html") return "face-swap";
  if (pageName === "outfit-studio.html") return "outfit-studio";
  if (pageName === "pose-generator.html") return "pose-generator";
  if (pageName === "image-to-video.html") return "image-to-video";
  if (pageName === "tool.html") {
    const tool = new URLSearchParams(window.location.search).get("tool");
    return new Set(["image-editor", "face-swap", "outfit-studio", "pose-generator", "image-to-video"]).has(tool)
      ? tool
      : "";
  }
  return "";
}

export function isConsumerPage(pageName = getPageName()) {
  return CONSUMER_PAGE_NAMES.has(pageName);
}

function fallbackTopNavigation() {
  return `
    <div class="nav-menu">
      <button class="nav-trigger" type="button" aria-expanded="false">图像工具 <span>⌄</span></button>
      <div class="nav-dropdown">
        <a href="./zh/app/image-editor/"><strong>图片编辑器</strong><small>编辑、重绘和修复图片</small></a>
        <a href="./zh/app/face-swap/"><strong>AI 换脸</strong><small>授权角色替换</small></a>
        <a href="./zh/app/outfit-studio/"><strong>性感礼服</strong><small>服饰和造型效果</small></a>
        <a href="./zh/app/pose-generator/"><strong>性爱姿势</strong><small>姿势和动作效果</small></a>
      </div>
    </div>
    <div class="nav-menu">
      <button class="nav-trigger" type="button" aria-expanded="false">视频工具 <span>⌄</span></button>
      <div class="nav-dropdown compact-dropdown">
        <a href="./zh/app/image-to-video/"><strong>图片转视频</strong><small>将参考图生成短视频</small></a>
      </div>
    </div>
    <a href="./zh/pricing/">购买积分</a>
    <a href="./zh/free-coins/">免费积分</a>
    <a href="./zh/my-creations/">我的作品</a>
  `;
}

function fallbackAccountNavigation() {
  return `
    <a class="daily-check" href="./zh/free-coins/">🎁 每日奖励</a>
    <div class="language-menu">
      <button class="language-trigger" type="button" aria-label="切换语言" aria-expanded="false">文A</button>
      <div class="language-dropdown">
        <button type="button" data-language="zh-CN" aria-pressed="true">中文（简体）</button>
        <button type="button" data-language="en" aria-pressed="false">English</button>
      </div>
    </div>
    <a href="./zh/login/" data-auth-modal>登录</a>
  `;
}

function buildConsumerHeader(existingHeader) {
  const topNavigation = existingHeader?.querySelector(".topnav")?.innerHTML || fallbackTopNavigation();
  const accountNavigation = existingHeader?.querySelector(".accountnav")?.innerHTML || fallbackAccountNavigation();
  const header = existingHeader || document.createElement("header");
  header.className = "topbar consumer-header";
  header.dataset.consumerHeader = "true";
  header.innerHTML = `
    <a class="brand" href="./zh/app/" aria-label="Luravyn 首页">
      <img class="brand-wordmark" src="./brand/luravyn-logo.png" alt="Luravyn">
    </a>
    <nav class="topnav" aria-label="主导航">${topNavigation}</nav>
    <a class="consumer-mobile-credit" href="./zh/free-coins/" aria-label="免费积分">积分</a>
    <nav class="accountnav" aria-label="账户导航">${accountNavigation}</nav>
    <button class="consumer-menu-toggle" type="button" aria-label="打开导航菜单" aria-controls="consumer-sidebar" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  `;
  return header;
}

function buildConsumerSidebar(activeRoute) {
  const sidebar = document.createElement("aside");
  sidebar.id = "consumer-sidebar";
  sidebar.className = "side-rail consumer-sidebar";
  sidebar.dataset.consumerSidebar = "true";
  sidebar.setAttribute("aria-label", "消费者工具导航");
  sidebar.innerHTML = `
    <nav class="rail-menu" aria-label="工具菜单">
      ${SIDEBAR_ITEMS.map((item) => {
        if (item.type === "label") return `<p class="side-label">${item.label}</p>`;
        const active = item.key === activeRoute;
        return `<a class="side-link${active ? " active" : ""}" href="${item.href}"${active ? ' aria-current="page"' : ""}>${item.label}${item.hot ? '<em class="badge-hot">HOT</em>' : ""}</a>`;
      }).join("")}
    </nav>
    <div class="consumer-mobile-account" data-consumer-mobile-account aria-label="移动端账户入口"></div>
    <div class="rail-actions" aria-label="账户快捷入口">
      <a href="./zh/referral/">推荐好友</a>
      <a class="rail-upgrade" href="./zh/pricing/?from=sidebar">立即升级</a>
    </div>
  `;
  return sidebar;
}

function syncMobileAccountNavigation(header, sidebar) {
  const accountNavigation = header.querySelector(".accountnav");
  const mobileAccount = sidebar.querySelector("[data-consumer-mobile-account]");
  if (!accountNavigation || !mobileAccount) return;
  const sync = () => {
    mobileAccount.innerHTML = accountNavigation.innerHTML;
  };
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(accountNavigation, { childList: true, subtree: true });
}

function removeDuplicatePublicLayout() {
  const headers = [...document.querySelectorAll("header.topbar")];
  const primaryHeader = headers.shift() || null;
  headers.forEach((header) => header.remove());
  document.querySelectorAll(".side-rail").forEach((sidebar) => sidebar.remove());
  document.querySelectorAll(".consumer-drawer-backdrop").forEach((backdrop) => backdrop.remove());
  return primaryHeader;
}

function createMainShell(header, sidebar) {
  const existingShell = document.querySelector("[data-consumer-app-shell]");
  if (existingShell) return existingShell;

  const shell = document.createElement("div");
  shell.className = "consumer-app-shell";
  shell.dataset.consumerAppShell = "true";
  const mainContent = document.createElement("div");
  mainContent.className = "consumer-main-content";
  mainContent.dataset.consumerMainContent = "true";

  const excluded = new Set([
    header,
    ...document.querySelectorAll("script, footer.site-footer, .floating-dock, .support-chat-widget, .consumer-drawer-backdrop"),
  ]);
  const pageNodes = [...document.body.children].filter((node) => !excluded.has(node));

  shell.append(sidebar, mainContent);
  header.insertAdjacentElement("afterend", shell);
  pageNodes.forEach((node) => {
    if (node !== shell) mainContent.append(node);
  });
  return shell;
}

function closeConsumerDrawer() {
  document.body.classList.remove("consumer-drawer-open");
  document.querySelector(".consumer-menu-toggle")?.setAttribute("aria-expanded", "false");
  document.querySelector(".consumer-drawer-backdrop")?.setAttribute("hidden", "");
}

function toggleConsumerDrawer() {
  const isOpen = document.body.classList.toggle("consumer-drawer-open");
  document.querySelector(".consumer-menu-toggle")?.setAttribute("aria-expanded", String(isOpen));
  const backdrop = document.querySelector(".consumer-drawer-backdrop");
  if (backdrop) backdrop.hidden = !isOpen;
}

async function shareCurrentPage() {
  const shareData = {
    title: document.title,
    text: "查看 Luravyn AI 图片与视频工具",
    url: window.location.href,
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(window.location.href);
    window.dispatchEvent(new CustomEvent("consumer-share-complete", { detail: { copied: true } }));
  } catch {
    window.location.href = `mailto:?subject=${encodeURIComponent(document.title)}&body=${encodeURIComponent(window.location.href)}`;
  }
}

function updateBackToTopVisibility() {
  const visible = window.scrollY > 480;
  document.querySelectorAll("[data-scroll-top]").forEach((button) => {
    button.classList.toggle("is-visible", visible);
    button.toggleAttribute("hidden", !visible);
  });
}

function closeFloatingMoreMenu() {
  const menu = document.querySelector("[data-floating-more-menu]");
  const trigger = document.querySelector("[data-floating-more]");
  if (menu) menu.hidden = true;
  trigger?.setAttribute("aria-expanded", "false");
}

function bindConsumerShellInteractions() {
  if (document.documentElement.dataset.consumerShellBound === "true") return;
  document.documentElement.dataset.consumerShellBound = "true";

  document.addEventListener("click", async (event) => {
    const menuToggle = event.target.closest(".consumer-menu-toggle");
    if (menuToggle) {
      event.preventDefault();
      toggleConsumerDrawer();
      return;
    }
    if (event.target.closest(".consumer-drawer-backdrop") || event.target.closest(".consumer-sidebar a")) {
      closeConsumerDrawer();
    }

    const shareButton = event.target.closest("[data-global-share]");
    if (shareButton) {
      event.preventDefault();
      closeFloatingMoreMenu();
      await shareCurrentPage();
      return;
    }

    const moreButton = event.target.closest("[data-floating-more]");
    if (moreButton) {
      event.preventDefault();
      const menu = document.querySelector("[data-floating-more-menu]");
      const willOpen = Boolean(menu?.hidden);
      if (menu) menu.hidden = !willOpen;
      moreButton.setAttribute("aria-expanded", String(willOpen));
      return;
    }

    if (!event.target.closest(".floating-more-wrap")) closeFloatingMoreMenu();
  });

  window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) closeConsumerDrawer();
  }, { passive: true });
  window.addEventListener("consumer-share-complete", () => {
    const live = document.querySelector("[data-consumer-shell-live]");
    if (!live) return;
    live.textContent = "页面链接已复制";
    window.setTimeout(() => { live.textContent = ""; }, 1800);
  });
}

export function setupConsumerAppShell() {
  const pageName = getPageName();
  if (!isConsumerPage(pageName)) return false;

  document.body.classList.add("consumer-app-page", "tool-layout");
  const existingHeader = removeDuplicatePublicLayout();
  const header = buildConsumerHeader(existingHeader);
  if (!header.isConnected) document.body.prepend(header);
  const sidebar = buildConsumerSidebar(getActiveConsumerRoute(pageName));
  createMainShell(header, sidebar);
  syncMobileAccountNavigation(header, sidebar);

  const backdrop = document.createElement("button");
  backdrop.className = "consumer-drawer-backdrop";
  backdrop.type = "button";
  backdrop.hidden = true;
  backdrop.setAttribute("aria-label", "关闭导航菜单");
  document.body.append(backdrop);

  if (!document.querySelector("[data-consumer-shell-live]")) {
    const live = document.createElement("div");
    live.className = "visually-hidden";
    live.dataset.consumerShellLive = "true";
    live.setAttribute("aria-live", "polite");
    document.body.append(live);
  }

  bindConsumerShellInteractions();
  return true;
}

export function ensureGlobalFloatingActions() {
  if (!isConsumerPage()) return false;

  document.querySelectorAll(".floating-dock, .support-chat-widget").forEach((node) => node.remove());
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="floating-dock consumer-floating-actions" aria-label="全局操作">
      <a class="floating-action" href="./zh/free-coins/" aria-label="免费积分" data-tooltip="免费积分"><span>分</span></a>
      <button class="floating-action desktop-floating-action" type="button" data-global-share aria-label="分享" data-tooltip="分享"><span>享</span></button>
      <button class="floating-action desktop-floating-action" type="button" data-support-widget aria-label="帮助" data-tooltip="帮助"><span>?</span></button>
      <button class="floating-action desktop-floating-action to-top" type="button" data-scroll-top aria-label="返回顶部" data-tooltip="返回顶部" hidden><span>↑</span></button>
      <div class="floating-more-wrap">
        <button class="floating-action mobile-floating-more" type="button" data-floating-more aria-label="更多操作" data-tooltip="更多" aria-expanded="false"><span>•••</span></button>
        <div class="floating-more-menu" data-floating-more-menu hidden>
          <button type="button" data-global-share>分享</button>
          <button type="button" data-support-widget>帮助</button>
          <button type="button" data-scroll-top hidden>返回顶部</button>
        </div>
      </div>
    </aside>
    <button class="support-chat-widget" type="button" data-support-widget aria-label="联系客服" data-tooltip="联系客服">
      <img src="./brand/luravyn-icon.png" alt="">
    </button>
  `);
  updateBackToTopVisibility();
  return true;
}
