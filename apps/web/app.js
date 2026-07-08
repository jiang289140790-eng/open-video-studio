import { createClient } from "@supabase/supabase-js";

const STORE_KEY = "ovs_mvp_state_v1";
const COOKIE_PREF_KEY = "ovs_cookie_preferences_v1";
const APP_SHELL_PAGES = new Set([
  "app.html",
  "gallery.html",
  "generate.html",
  "image-to-video.html",
  "characters.html",
  "assets.html",
  "history.html",
  "campaigns.html",
  "ai-studio.html",
  "pipeline.html",
  "queue.html",
  "accounts.html",
  "calendar.html",
  "analytics.html",
  "publishing.html",
  "automation.html",
  "settings.html",
  "dashboard.html",
  "pricing.html",
  "free-coins.html",
  "referral.html",
  "my-creations.html",
  "image-tools.html",
  "video-tools.html",
  "image-editor.html",
  "face-swap.html",
  "outfit-studio.html",
  "pose-generator.html",
  "nano-banana.html",
  "image-combiner.html",
  "ai-effects.html",
  "blog.html",
  "terms.html",
  "privacy.html",
  "cookie.html",
  "admin.html"
]);
const PROTECTED_PRODUCT_PAGES = new Set([
  "dashboard.html",
  "my-creations.html",
  "assets.html",
  "history.html",
  "campaigns.html",
  "ai-studio.html",
  "pipeline.html",
  "queue.html",
  "accounts.html",
  "calendar.html",
  "analytics.html",
  "publishing.html",
  "automation.html",
  "settings.html",
  "admin.html"
]);
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "";
const telegramAuthUrl = import.meta.env.VITE_TELEGRAM_AUTH_URL || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const I18N_LOCALES = {
  "zh-CN": { label: "简体中文", short: "文A", status: "complete" },
  en: { label: "English", short: "EN", status: "mvp" },
  ja: { label: "日本語", short: "JA", status: "mvp" },
  ko: { label: "한국어", short: "KO", status: "mvp" }
};
const I18N_CORE_TERMS = [
  "图像工具",
  "视频工具",
  "购买积分",
  "免费硬币",
  "我的创作",
  "每日签到",
  "登录",
  "控制台",
  "生成历史",
  "资产库",
  "管理后台",
  "开始生成",
  "角色",
  "积分",
  "生成",
  "优化提示词",
  "用户管理",
  "订单履约",
  "内容审核",
  "分享链接",
  "系统配置",
  "审计日志",
  "Workflow Center",
  "Prompt 管理"
];
const I18N_PRODUCT_TERMS = Array.from(new Set([
  ...I18N_CORE_TERMS,
  "立即升级",
  "推荐好友",
  "开始创作",
  "返回控制台",
  "作品探索",
  "图片生成器",
  "生成预览",
  "准备生成",
  "结果会保存到资产库和生成历史。",
  "积分不足",
  "打开作品",
  "真实生成暂不可用",
  "后台安全函数不可用",
  "积分管理",
  "生成任务",
  "成本利润",
  "Worker 管理",
  "首页内容",
  "页面模块",
  "工具上架",
  "工具版本",
  "内容情报",
  "运营管理后台",
  "打开网站",
  "退出登录",
  "发布 Workflow 配置",
  "预览 Workflow",
  "发布",
  "测试",
  "草稿",
  "停用",
  "回滚 Fake",
  "切千问",
  "切 DeepSeek",
  "切 Qwen"
]));
const I18N_MESSAGES = {
  "zh-CN": {},
  en: {
    "图像工具": "Image tools",
    "视频工具": "Video tools",
    "购买积分": "Buy credits",
    "免费硬币": "Free coins",
    "我的创作": "My creations",
    "每日签到": "Daily check-in",
    "登录": "Sign in",
    "控制台": "Dashboard",
    "生成历史": "History",
    "资产库": "Assets",
    "管理后台": "Admin",
    "立即升级": "Upgrade now",
    "推荐好友": "Refer friends",
    "开始创作": "Start creating",
    "开始生成": "Start generating",
    "返回控制台": "Back to dashboard",
    "作品探索": "Explore",
    "角色": "Characters",
    "积分": "Credits",
    "图片生成器": "Image generator",
    "生成预览": "Generation preview",
    "准备生成": "Ready to generate",
    "结果会保存到资产库和生成历史。": "Results save to Assets and History.",
    "生成": "Generate",
    "优化提示词": "Enhance prompt",
    "积分不足": "Not enough credits",
    "购买积分": "Buy credits",
    "打开作品": "Open asset",
    "真实生成暂不可用": "Real generation is unavailable",
    "后台安全函数不可用": "Admin function unavailable",
    "用户管理": "Users",
    "积分管理": "Credits",
    "订单履约": "Orders",
    "内容审核": "Moderation",
    "生成任务": "Generation jobs",
    "分享链接": "Share links",
    "系统配置": "System config",
    "审计日志": "Audit logs",
    "Workflow Center": "Workflow Center",
    "Prompt 管理": "Prompt Library",
    "成本利润": "Cost & margin",
    "Worker 管理": "Worker Center",
    "首页内容": "Homepage content",
    "页面模块": "Page modules",
    "工具上架": "Tool catalog",
    "工具版本": "Tool versions",
    "内容情报": "Content intelligence",
    "运营管理后台": "Operations admin",
    "打开网站": "Open site",
    "退出登录": "Sign out",
    "发布 Workflow 配置": "Publish workflow config",
    "预览 Workflow": "Preview workflow",
    "发布": "Published",
    "测试": "Testing",
    "草稿": "Draft",
    "停用": "Disabled",
    "回滚 Fake": "Rollback Fake",
    "切千问": "Use Qianwen",
    "切 DeepSeek": "Use DeepSeek",
    "切 Qwen": "Use Qwen"
  },
  ja: {
    "图像工具": "画像ツール",
    "视频工具": "動画ツール",
    "购买积分": "クレジット購入",
    "免费硬币": "無料コイン",
    "我的创作": "マイ作品",
    "每日签到": "デイリーチェックイン",
    "登录": "ログイン",
    "开始生成": "生成を開始",
    "生成": "生成",
    "资产库": "アセット",
    "生成历史": "履歴",
    "控制台": "ダッシュボード",
    "管理后台": "管理",
    "角色": "キャラクター",
    "积分": "クレジット",
    "优化提示词": "プロンプト強化",
    "用户管理": "ユーザー",
    "积分管理": "クレジット管理",
    "订单履约": "注文",
    "内容审核": "モデレーション",
    "分享链接": "共有リンク",
    "系统配置": "システム設定",
    "审计日志": "監査ログ",
    "Workflow Center": "Workflow Center",
    "Prompt 管理": "プロンプト管理",
    "立即升级": "今すぐアップグレード",
    "推荐好友": "友達を紹介",
    "开始创作": "作成を開始",
    "返回控制台": "ダッシュボードへ戻る",
    "作品探索": "作品を探す",
    "图片生成器": "画像ジェネレーター",
    "生成预览": "生成プレビュー",
    "准备生成": "生成準備完了",
    "结果会保存到资产库和生成历史。": "結果はアセットと履歴に保存されます。",
    "积分不足": "クレジット不足",
    "打开作品": "作品を開く",
    "真实生成暂不可用": "実生成は現在利用できません",
    "后台安全函数不可用": "管理用セキュア関数は利用できません",
    "生成任务": "生成ジョブ",
    "成本利润": "コストと利益",
    "Worker 管理": "Worker 管理",
    "首页内容": "ホーム内容",
    "页面模块": "ページモジュール",
    "工具上架": "ツール公開",
    "工具版本": "ツールバージョン",
    "内容情报": "コンテンツインテリジェンス",
    "运营管理后台": "運用管理",
    "打开网站": "サイトを開く",
    "退出登录": "ログアウト",
    "发布 Workflow 配置": "Workflow 設定を公開",
    "预览 Workflow": "Workflow をプレビュー",
    "发布": "公開",
    "测试": "テスト",
    "草稿": "下書き",
    "停用": "無効",
    "回滚 Fake": "Fake に戻す",
    "切千问": "Qianwen に切替",
    "切 DeepSeek": "DeepSeek に切替",
    "切 Qwen": "Qwen に切替"
  },
  ko: {
    "图像工具": "이미지 도구",
    "视频工具": "비디오 도구",
    "购买积分": "크레딧 구매",
    "免费硬币": "무료 코인",
    "我的创作": "내 작업",
    "每日签到": "데일리 체크인",
    "登录": "로그인",
    "开始生成": "생성 시작",
    "生成": "생성",
    "资产库": "에셋",
    "生成历史": "히스토리",
    "控制台": "대시보드",
    "管理后台": "관리자",
    "角色": "캐릭터",
    "积分": "크레딧",
    "优化提示词": "프롬프트 개선",
    "用户管理": "사용자",
    "积分管理": "크레딧 관리",
    "订单履约": "주문",
    "内容审核": "콘텐츠 검수",
    "分享链接": "공유 링크",
    "系统配置": "시스템 설정",
    "审计日志": "감사 로그",
    "Workflow Center": "Workflow Center",
    "Prompt 管理": "프롬프트 관리",
    "立即升级": "지금 업그레이드",
    "推荐好友": "친구 추천",
    "开始创作": "창작 시작",
    "返回控制台": "대시보드로 돌아가기",
    "作品探索": "작품 탐색",
    "图片生成器": "이미지 생성기",
    "生成预览": "생성 미리보기",
    "准备生成": "생성 준비 완료",
    "结果会保存到资产库和生成历史。": "결과는 에셋과 생성 기록에 저장됩니다.",
    "积分不足": "크레딧 부족",
    "打开作品": "작품 열기",
    "真实生成暂不可用": "실제 생성은 현재 사용할 수 없습니다",
    "后台安全函数不可用": "관리 보안 함수 사용 불가",
    "生成任务": "생성 작업",
    "成本利润": "비용과 마진",
    "Worker 管理": "Worker 관리",
    "首页内容": "홈 콘텐츠",
    "页面模块": "페이지 모듈",
    "工具上架": "도구 게시",
    "工具版本": "도구 버전",
    "内容情报": "콘텐츠 인텔리전스",
    "运营管理后台": "운영 관리자",
    "打开网站": "사이트 열기",
    "退出登录": "로그아웃",
    "发布 Workflow 配置": "Workflow 설정 게시",
    "预览 Workflow": "Workflow 미리보기",
    "发布": "게시됨",
    "测试": "테스트",
    "草稿": "초안",
    "停用": "비활성",
    "回滚 Fake": "Fake로 롤백",
    "切千问": "Qianwen 사용",
    "切 DeepSeek": "DeepSeek 사용",
    "切 Qwen": "Qwen 사용"
  }
};
const I18N_ATTRIBUTE_MESSAGES = {
  en: {
    "选择文件": "Choose file",
    "输入密码": "Enter password",
    "creator@example.com": "creator@example.com",
    "例如：新增 ComfyUI 图片生成工作流": "Example: add a ComfyUI image workflow",
    "例如：上架换装工具并调整积分价格": "Example: publish outfit tool and adjust credits"
  },
  ja: {
    "选择文件": "ファイルを選択",
    "输入密码": "パスワードを入力",
    "例如：新增 ComfyUI 图片生成工作流": "例：ComfyUI 画像ワークフローを追加",
    "例如：上架换装工具并调整积分价格": "例：着せ替えツールを公開しクレジットを調整"
  },
  ko: {
    "选择文件": "파일 선택",
    "输入密码": "비밀번호 입력",
    "例如：新增 ComfyUI 图片生成工作流": "예: ComfyUI 이미지 워크플로 추가",
    "例如：上架换装工具并调整积分价格": "예: 의상 도구 게시 및 크레딧 조정"
  }
};
const I18N_ORIGINAL_TEXT = new WeakMap();
const I18N_ORIGINAL_ATTRS = new WeakMap();

const defaultState = {
  user: null,
  credits: 40,
  characters: [
    { id: "char_mira", name: "Mira", role: "工作室主持人", tags: ["发布", "工作室", "冷静"], score: 92, status: "active", favorite: true, memory: "稳定的工作室主持人，适合产品讲解、发布短片和品牌介绍。" },
    { id: "char_atlas", name: "Atlas", role: "产品讲解员", tags: ["产品", "干净"], score: 88, status: "active", favorite: false, memory: "商业产品讲解员，表达清晰，画面干净。" },
    { id: "char_nova", name: "Nova", role: "创作者形象", tags: ["时尚", "霓虹"], score: 95, status: "draft", favorite: false, memory: "适合时尚、霓虹、竖屏内容的创作者形象。" }
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
  ],
  orders: [
    { id: "order_demo", planName: "创作者包", credits: 1000, price: "$29.99", method: "paypal", status: "fulfilled", createdAt: "2026-07-07" }
  ],
  campaigns: [
    {
      id: "camp_growth",
      name: "Creator Growth Loop",
      goal: "traffic",
      niche: "AI 视频创作者",
      audience: "独立创作者、小团队和内容运营人员",
      platforms: ["X", "TikTok", "YouTube Shorts", "Pinterest"],
      connectedAccounts: ["demo-x-account"],
      style: "深色高级、视觉优先、创作者工具感",
      frequency: "每天 1 条",
      cta: "免费开始生成",
      targetUrl: "https://openvideostudio.app",
      status: "active"
    }
  ],
  contentItems: [
    {
      id: "content_prompt_pack",
      campaignId: "camp_growth",
      title: "把一个提示词变成完整内容包",
      topic: "可复用 AI 视频资产",
      stage: "caption",
      reviewStatus: "needs_review",
      character: "Mira",
      research: "关注创作者从提示词到可发布内容的断点：脚本、提示词、封面、字幕、CTA 和平台适配。",
      script: "Hook：一个提示词不该只生成一张图。展示如何把它变成图片、视频、Caption 和多平台版本。",
      prompt: "深色高级 AI 创作平台界面，角色主持人展示可复用视频资产，电影感灯光，适合竖屏短视频。",
      imagePlaceholder: "发布主视觉占位：角色主持人 + 深色 AI Studio 背景",
      videoPlaceholder: "8 秒竖屏视频占位：镜头推进 + Caption 动效",
      thumbnailPlaceholder: "缩略图占位：强标题 + 高对比主体",
      caption: "把一个创意变成完整内容包，并保存为可复用资产。",
      cta: "免费开始生成",
      hashtags: ["AIContent", "OpenVideoStudio", "VideoAI", "CreatorTools"],
      translations: { zh: "把一个创意变成完整内容包。", en: "Turn one idea into a full content package." },
      variants: [
        { id: "variant_x", platform: "X", caption: "一个提示词，也可以变成完整内容包。", hashtags: ["AIContent", "VideoAI"], cta: "免费开始生成", status: "needs_review", format: "image_or_video_with_caption", account: "@openvideostudio", scheduledAt: "" },
        { id: "variant_tiktok", platform: "TikTok", caption: "从提示词到短视频内容包。", hashtags: ["CreatorTools", "OpenVideoStudio"], cta: "免费开始生成", status: "scheduled", format: "vertical_video_9_16", account: "@ovs.creator", scheduledAt: "2026-07-09 09:00" }
      ]
    }
  ],
  contentQueue: [
    { id: "queue_tiktok", contentItemId: "content_prompt_pack", platform: "TikTok", status: "scheduled", scheduledAt: "2026-07-09 09:00", title: "把一个提示词变成完整内容包" }
  ],
  socialAccounts: [
    { id: "social_x", platform: "X", handle: "@openvideostudio", purpose: "短文案发布", status: "connected" },
    { id: "social_tiktok", platform: "TikTok", handle: "@ovs.creator", purpose: "竖屏短视频", status: "needs_review" }
  ],
  contentAnalytics: [
    { id: "analytics_prompt_pack", contentItemId: "content_prompt_pack", platform: "TikTok", views: 12800, likes: 920, comments: 84, shares: 112, clicks: 430, signups: 37, revenue: 0, conversionRate: 8.6 },
    { id: "analytics_x_pack", contentItemId: "content_prompt_pack", platform: "X", views: 6400, likes: 310, comments: 29, shares: 58, clicks: 220, signups: 14, revenue: 0, conversionRate: 6.3 }
  ],
  automationRules: [
    { id: "auto_review", name: "AI Studio 草稿进入 Review", trigger: "content_created", action: "move_to_review", status: "active", lastRun: "等待首次运行" },
    { id: "auto_retry", name: "失败发布提醒", trigger: "publish_failed", action: "retry_failed", status: "paused", lastRun: "未运行" }
  ],
  contentSettings: {
    defaultPlatforms: "X, TikTok, YouTube Shorts, Pinterest",
    defaultFrequency: "每天 1 条",
    defaultCta: "免费开始生成",
    defaultStyle: "深色高级、视觉优先、创作者工具感",
    reviewRequired: true
  },
  rewards: {
    checkInDay: 0,
    lastCheckInDate: "",
    referralCopies: 0,
    taskClaims: []
  }
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

function normalizeHomepageConfig(config = {}) {
  return {
    ...structuredClone(defaultHomepageConfig),
    ...config,
    trustSignals: Array.isArray(config.trustSignals) ? config.trustSignals.filter(Boolean).slice(0, 6) : [...defaultHomepageConfig.trustSignals],
    showcaseCards: normalizeHomepageCards(config.showcaseCards, defaultHomepageConfig.showcaseCards),
    creationCards: normalizeHomepageCards(config.creationCards, defaultHomepageConfig.creationCards)
  };
}

function normalizeHomepageCards(cards, fallback) {
  return Array.isArray(cards) && cards.length
    ? cards.filter((card) => card?.label && card?.title).slice(0, 12).map((card, index) => ({
      label: String(card.label),
      title: String(card.title),
      style: /^art-\d+$/.test(String(card.style || "")) ? String(card.style) : `art-${(index % 13) + 1}`,
      size: ["tall", "wide"].includes(card.size) ? card.size : "",
      outputPreview: Boolean(card.outputPreview),
      image: sanitizeHomepageImageHref(String(card.image || fallback?.[index]?.image || ""))
    }))
    : structuredClone(fallback);
}

async function loadHomepageConfig() {
  if (!document.querySelector("[data-homepage]")) return;
  try {
    const localDraft = JSON.parse(localStorage.getItem("ovs_homepage_config_preview") || "null");
    if (localDraft) {
      homepageConfig = normalizeHomepageConfig(localDraft);
      renderHomepageConfig(homepageConfig);
    }
  } catch {
    // Ignore broken local previews; production settings remain authoritative.
  }
  if (!supabase) {
    renderHomepageConfig(homepageConfig);
    return;
  }
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value_json")
      .eq("setting_key", "homepage_config")
      .eq("status", "published")
      .single();
    if (!error && data?.value_json) {
      homepageConfig = normalizeHomepageConfig(data.value_json);
      renderHomepageConfig(homepageConfig);
    }
  } catch {
    renderHomepageConfig(homepageConfig);
  }
}

function renderHomepageConfig(config) {
  const normalized = normalizeHomepageConfig(config);
  setText("[data-homepage-text='eyebrow']", normalized.eyebrow);
  setText("[data-homepage-text='headline']", normalized.headline);
  setText("[data-homepage-text='subheadline']", normalized.subheadline);
  setText("[data-homepage-text='galleryTitle']", normalized.galleryTitle);
  setHomepageLink("primaryCta", normalized.primaryCtaLabel, normalized.primaryCtaHref);
  setHomepageLink("secondaryCta", normalized.secondaryCtaLabel, normalized.secondaryCtaHref);

  const signals = document.querySelector("[data-homepage-list='trustSignals']");
  if (signals) signals.innerHTML = normalized.trustSignals.map((signal) => `<span>${escapeHtml(signal)}</span>`).join("");

  const showcase = document.querySelector("[data-homepage-list='showcaseCards']");
  if (showcase) showcase.innerHTML = normalized.showcaseCards.map((card) => homepageShowcaseMarkup(card)).join("");

  const creations = document.querySelector("[data-homepage-list='creationCards']");
  if (creations) creations.innerHTML = normalized.creationCards.map((card) => `
    <article class="creation-card ${escapeHtml(card.style)}${card.image ? " has-image" : ""}"${homepageCardStyle(card)}><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(card.title)}</strong></article>
  `).join("");
}

function homepageShowcaseMarkup(card) {
  const classes = ["showcase-card", card.size, card.style, card.image ? "has-image" : "", card.outputPreview ? "output-preview" : ""].filter(Boolean).join(" ");
  return `
    <article class="${escapeHtml(classes)}"${homepageCardStyle(card)}>
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.title)}</strong>
      ${card.outputPreview ? `<div class="mock-video-frame"><span class="play-dot small"></span><p>已发布配置</p></div>` : ""}
    </article>
  `;
}

function homepageCardStyle(card) {
  return card.image ? ` style="--card-image: url('${escapeHtml(card.image)}')"` : "";
}

function setHomepageLink(name, label, href) {
  const target = document.querySelector(`[data-homepage-link='${name}']`);
  if (!target) return;
  target.textContent = label || target.textContent;
  if (href) target.setAttribute("href", href);
}

async function loadPageBuilderConfig() {
  if (!document.querySelector("[data-homepage]") && !document.querySelector(".tool-home")) return;
  if (!supabase) {
    applyPageBuilderConfig(pageBuilderConfig);
    return;
  }
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value_json")
      .eq("setting_key", "page_builder_config")
      .eq("status", "published")
      .single();
    if (!error && data?.value_json) {
      pageBuilderConfig = normalizePageBuilderConfig(data.value_json);
    }
  } catch {
    // Static fallback remains authoritative when remote settings are unavailable.
  }
  applyPageBuilderConfig(pageBuilderConfig);
}

async function loadToolCatalogConfig() {
  if (!document.querySelector("[data-tool-home-card]")) return;
  if (!supabase) {
    applyToolCatalogConfig(toolCatalogConfig);
    return;
  }
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value_json")
      .eq("setting_key", "tool_catalog_config")
      .eq("status", "published")
      .single();
    if (!error && data?.value_json) {
      toolCatalogConfig = normalizeToolCatalogConfig(data.value_json);
    }
  } catch {
    // Keep static tool catalog if remote settings fail.
  }
  applyToolCatalogConfig(toolCatalogConfig);
}

function applyPageBuilderConfig(config) {
  const normalized = normalizePageBuilderConfig(config);
  const pageSlug = document.querySelector("[data-homepage]") ? "home" : document.querySelector(".tool-home") ? "app" : "";
  const page = normalized.pages.find((item) => item.slug === pageSlug);
  if (!page) return;
  if (pageSlug === "home") applyHomepageModules(page.modules);
  if (pageSlug === "app") applyToolHomeModules(page.modules);
}

function applyHomepageModules(modules) {
  const heroModule = modules.find((module) => module.id === "hero" || module.type === "hero");
  applySectionState("[data-homepage-section='hero']", heroModule);
  const galleryModule = modules.find((module) => module.id === "explore" || module.type === "gallery");
  applySectionState("[data-homepage-section='galleryPreview']", galleryModule);
  if (galleryModule) {
    const grid = document.querySelector("[data-homepage-list='creationCards']");
    limitChildren(grid, galleryModule.cardCount);
    applyDisplayStyle(grid, galleryModule.displayStyle);
  }
  if (heroModule) {
    const showcase = document.querySelector("[data-homepage-list='showcaseCards']");
    limitChildren(showcase, heroModule.cardCount);
  }
}

function applyToolHomeModules(modules) {
  document.querySelectorAll("[data-tool-home-section]").forEach((section) => {
    const sectionKey = section.dataset.toolHomeSection || "";
    const module = modules.find((item) => sectionKey.includes(item.source.replace("category:", "")) || sectionKey.includes(item.id.replace("-tools", "")) || item.type === "tools" && item.source === "tool_catalog_config.tools");
    if (!module) return;
    section.hidden = module.enabled === false;
    const row = section.querySelector(".card-carousel");
    limitChildren(row, module.cardCount);
    applyDisplayStyle(row, module.displayStyle);
  });
}

function applyToolCatalogConfig(config) {
  const normalized = normalizeToolCatalogConfig(config);
  const toolMap = new Map(normalized.tools.map((tool) => [tool.slug, tool]));
  document.querySelectorAll("[data-tool-home-card]").forEach((card) => {
    const slug = toolSlugFromHref(card.getAttribute("href") || "");
    const tool = toolMap.get(slug);
    if (!tool) return;
    card.hidden = tool.status !== "published";
    card.setAttribute("href", tool.route);
    card.dataset.toolTags = `${tool.category} ${tool.status} ${tool.featured ? "hot featured" : ""} ${tool.provider} ${tool.model} ${tool.name}`;
    const strong = card.querySelector("strong");
    if (strong) strong.textContent = tool.name;
    let meta = card.querySelector("[data-tool-config-meta]");
    if (!meta) {
      meta = document.createElement("small");
      meta.dataset.toolConfigMeta = "true";
      card.append(meta);
    }
    meta.textContent = `${tool.provider} · ${tool.creditCost} 积分`;
    card.classList.toggle("featured", tool.featured);
  });
  renderToolHomeDirectory();
}

function applySectionState(selector, module) {
  const target = document.querySelector(selector);
  if (!target || !module) return;
  target.hidden = module.enabled === false;
}

function limitChildren(container, count) {
  if (!container || !count) return;
  Array.from(container.children).forEach((child, index) => {
    child.hidden = index >= count;
  });
}

function applyDisplayStyle(container, style) {
  if (!container) return;
  container.dataset.adminDisplayStyle = style || "grid";
}

function toolSlugFromHref(href) {
  const clean = href.replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

const state = loadState();
state.characters = state.characters.map((character) => ({
  status: "active",
  favorite: false,
  memory: `${character.role || "创意角色"}，保持视觉和提示词一致。`,
  ...character
}));
state.rewards = {
  checkInDay: 0,
  lastCheckInDate: "",
  referralCopies: 0,
  taskClaims: [],
  ...(state.rewards || {})
};
state.orders = Array.isArray(state.orders) ? state.orders : [...defaultState.orders];
state.campaigns = Array.isArray(state.campaigns) ? state.campaigns : structuredClone(defaultState.campaigns);
state.contentItems = Array.isArray(state.contentItems) ? state.contentItems : structuredClone(defaultState.contentItems);
state.contentQueue = Array.isArray(state.contentQueue) ? state.contentQueue : structuredClone(defaultState.contentQueue);
state.socialAccounts = Array.isArray(state.socialAccounts) ? state.socialAccounts : structuredClone(defaultState.socialAccounts);
state.contentAnalytics = Array.isArray(state.contentAnalytics) ? state.contentAnalytics : structuredClone(defaultState.contentAnalytics);
state.automationRules = Array.isArray(state.automationRules) ? state.automationRules : structuredClone(defaultState.automationRules);
state.contentSettings = state.contentSettings && typeof state.contentSettings === "object" ? { ...defaultState.contentSettings, ...state.contentSettings } : structuredClone(defaultState.contentSettings);
let selectedCharacterId = state.characters[0]?.id || "";
let toolHomeFilter = "all";
let toolHomeSearch = "";
let queueFilter = "all";
let adminLoaded = false;
let adminLoading = false;
let adminData = null;

const defaultHomepageConfig = {
  eyebrow: "可复用角色的 AI 创作平台",
  headline: "用一致性角色创建 AI 视频",
  subheadline: "在一个创作空间里生成角色、场景、提示词、图片和视频，并持续复用。",
  primaryCtaLabel: "免费开始生成",
  primaryCtaHref: "./zh/app/generate/",
  secondaryCtaLabel: "探索作品",
  secondaryCtaHref: "./zh/gallery/",
  galleryTitle: "看看你可以创建什么",
  trustSignals: ["无需设计经验", "角色可复用", "提示词到视频", "积分制生成"],
  showcaseCards: [
    { label: "视频", title: "生成营销短片", style: "art-1", size: "tall", outputPreview: true, image: "./home-assets/ovs-home-07.png" },
    { label: "角色", title: "工作室主持人", style: "art-2", image: "./home-assets/ovs-home-10.png" },
    { label: "图片", title: "发布主视觉", style: "art-3", image: "./home-assets/ovs-home-01.png" },
    { label: "提示词", title: "把发布脚本转成可复用场景", style: "art-4", size: "wide", image: "./home-assets/ovs-home-05.png" }
  ],
  creationCards: [
    { label: "AI 角色", title: "带记忆的可复用主持人", style: "art-2", image: "./home-assets/ovs-home-02.png" },
    { label: "产品视频", title: "适合发布的动态概念", style: "art-1", image: "./home-assets/ovs-home-08.png" },
    { label: "时尚场景", title: "杂志感营销画面", style: "art-5", image: "./home-assets/ovs-home-09.png" },
    { label: "电影肖像", title: "统一面孔与风格", style: "art-6", image: "./home-assets/ovs-home-11.png" },
    { label: "社媒广告", title: "适合投放的竖屏素材", style: "art-8", image: "./home-assets/ovs-home-12.png" },
    { label: "图片转视频", title: "把参考图变成短片", style: "art-7", image: "./home-assets/ovs-home-06.png" },
    { label: "提示词重混", title: "从一个想法生成多个版本", style: "art-9", image: "./home-assets/ovs-home-03.png" },
    { label: "可复用资产", title: "保存作品用于未来场景", style: "art-10", image: "./home-assets/ovs-home-04.png" }
  ]
};
let homepageConfig = structuredClone(defaultHomepageConfig);

const defaultPageBuilderConfig = {
  pages: [
    {
      slug: "home",
      name: "首页",
      status: "published",
      modules: [
        { id: "hero", type: "hero", title: "首屏视觉", enabled: true, displayStyle: "hero", cardCount: 4, source: "homepage_config.showcaseCards" },
        { id: "explore", type: "gallery", title: "探索你能创作什么", enabled: true, displayStyle: "masonry", cardCount: 8, source: "featured_assets" },
        { id: "characters", type: "characters", title: "角色示例", enabled: true, displayStyle: "carousel", cardCount: 6, source: "character_templates" }
      ]
    },
    {
      slug: "app",
      name: "工具首页",
      status: "published",
      modules: [
        { id: "featured-tools", type: "tools", title: "推荐工具", enabled: true, displayStyle: "grid", cardCount: 8, source: "tool_catalog_config.tools" },
        { id: "image-tools", type: "tools", title: "图像工具", enabled: true, displayStyle: "carousel", cardCount: 12, source: "category:image" },
        { id: "video-tools", type: "tools", title: "视频工具", enabled: true, displayStyle: "carousel", cardCount: 8, source: "category:video" }
      ]
    }
  ]
};

const defaultToolCatalogConfig = {
  tools: [
    { slug: "image-editor", name: "图片编辑器", category: "image", status: "published", provider: "fake_worker", model: "local-image-edit-v0", workflowId: "workflow-image-edit-v1", creditCost: 8, route: "./zh/app/image-editor/", featured: true, versions: [{ version: "v1", changelog: "MVP image edit workflow", modelVersion: "local-image-edit-v0", workflowVersion: "workflow-image-edit-v1", promptVersion: "prompt-image-edit-v1", status: "published" }] },
    { slug: "outfit-studio", name: "AI 换装", category: "image", status: "published", provider: "fake_worker", model: "local-outfit-v0", workflowId: "workflow-outfit-v1", creditCost: 12, route: "./zh/app/outfit-studio/", featured: true, versions: [{ version: "v1", changelog: "MVP outfit workflow", modelVersion: "local-outfit-v0", workflowVersion: "workflow-outfit-v1", promptVersion: "prompt-outfit-v1", status: "published" }] },
    { slug: "image-to-video", name: "图片转视频", category: "video", status: "published", provider: "fake_worker", model: "local-video-v0", workflowId: "workflow-video-v1", creditCost: 24, route: "./zh/app/image-to-video/", featured: true, versions: [{ version: "v1", changelog: "MVP image to video workflow", modelVersion: "local-video-v0", workflowVersion: "workflow-video-v1", promptVersion: "prompt-video-v1", status: "published" }] }
  ]
};
const defaultWorkflowCenterConfig = {
  workflows: [
    { workflowId: "workflow-image-edit-v1", name: "图片编辑工作流", type: "api_chain", provider: "fake_worker", jsonConfig: { mode: "image_edit" }, requiredModels: ["local-image-edit-v0"], requiredInputs: ["prompt", "reference_image"], outputType: "image", creditPrice: 8, version: "v1", status: "published", description: "MVP 图片编辑占位工作流，可替换为 ComfyUI / Fal / RunPod。" },
    { workflowId: "workflow-video-v1", name: "图片转视频工作流", type: "api_chain", provider: "fake_worker", jsonConfig: { mode: "image_to_video" }, requiredModels: ["local-video-v0"], requiredInputs: ["prompt", "source_asset"], outputType: "video", creditPrice: 24, version: "v1", status: "testing", description: "MVP 视频生成占位工作流，后续绑定真实视频 provider。" }
  ]
};
const defaultPromptLibraryConfig = {
  prompts: [
    { promptId: "prompt-image-launch-v1", title: "产品发布主视觉", category: "image", useCase: "图片生成", promptText: "Create a premium AI SaaS product launch scene with a reusable presenter character, cinematic lighting, clean composition, and strong visual CTA.", negativePrompt: "low quality, blurry, distorted text", variables: ["character", "product", "style"], model: "local-image-edit-v0", version: "v1", tags: ["image", "launch", "saas"], status: "published", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { promptId: "prompt-video-short-v1", title: "短视频分镜", category: "video", useCase: "视频生成", promptText: "Write a 6-scene vertical short video storyboard for {topic}. Include hook, scene direction, motion, caption, and CTA.", negativePrompt: "", variables: ["topic", "cta"], model: "local-video-v0", version: "v1", tags: ["video", "storyboard"], status: "testing", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ]
};
const defaultContentIntelligenceConfig = {
  records: [
    { sourcePlatform: "X", sourceUrl: "https://x.com/example/status/demo", accountName: "@creator", postText: "One prompt should become a full content package.", mediaUrls: [], analysisJson: { confidence: 0.82 }, hook: "一个提示词不该只生成一张图", topic: "AI 内容生产系统", targetAudience: "短视频创作者", contentAngle: "从单次生成升级到可复用内容资产", reusableStrategy: "转成 Campaign、Prompt、Caption 和短视频分镜", generatedPostVariants: ["X thread", "TikTok short", "YouTube Shorts"], status: "analyzed" },
    { sourcePlatform: "TikTok", sourceUrl: "", accountName: "@trend", postText: "Fast visual hooks outperform static product demos.", mediaUrls: [], analysisJson: { confidence: 0.76, inputMode: "manual" }, hook: "前 2 秒决定短视频是否被看完", topic: "短视频开场", targetAudience: "品牌短视频团队", contentAngle: "把产品亮点转成强开场镜头", reusableStrategy: "转成脚本、分镜和视频生成 prompt", generatedPostVariants: ["TikTok script", "Reel caption"], status: "draft" },
    { sourcePlatform: "YouTube", sourceUrl: "", accountName: "@shorts", postText: "Creators want repeatable formats, not isolated generations.", mediaUrls: [], analysisJson: { confidence: 0.73, inputMode: "manual" }, hook: "固定栏目比单次爆款更可持续", topic: "内容栏目化", targetAudience: "YouTube Shorts 创作者", contentAngle: "把生成结果组织成可持续栏目", reusableStrategy: "转成 series template、thumbnail prompt 和片尾 CTA", generatedPostVariants: ["Shorts outline", "Thumbnail prompt"], status: "draft" },
    { sourcePlatform: "Reddit", sourceUrl: "", accountName: "r/creator", postText: "Users compare model output quality and workflow reliability.", mediaUrls: [], analysisJson: { confidence: 0.7, inputMode: "manual" }, hook: "质量之外，稳定工作流才是复购原因", topic: "AI 工具评价", targetAudience: "AI SaaS 产品经理", contentAngle: "把社区反馈转成产品改进和演示素材", reusableStrategy: "转成 FAQ、对比图和落地页证据卡", generatedPostVariants: ["FAQ item", "Comparison card"], status: "draft" },
    { sourcePlatform: "Instagram", sourceUrl: "", accountName: "@visualstudio", postText: "Masonry visual previews create stronger creative intent.", mediaUrls: [], analysisJson: { confidence: 0.74, inputMode: "manual" }, hook: "视觉墙比文字说明更能驱动创作", topic: "视觉发现", targetAudience: "视觉内容创作者", contentAngle: "用图库预览驱动生成入口", reusableStrategy: "转成 gallery tags、prompt remix 和角色示例", generatedPostVariants: ["Carousel caption", "Gallery prompt"], status: "draft" },
    { sourcePlatform: "Telegram", sourceUrl: "", accountName: "creator channel", postText: "Private communities need quick reusable creative packs.", mediaUrls: [], analysisJson: { confidence: 0.68, inputMode: "manual" }, hook: "社群运营需要一键复用的内容包", topic: "社群内容运营", targetAudience: "Telegram 社群运营者", contentAngle: "把生成资产打包成社群发布素材", reusableStrategy: "转成发布文案、封面图和短视频脚本", generatedPostVariants: ["Channel post", "Pinned offer"], status: "draft" }
  ]
};
const defaultAgentCenterConfig = {
  agents: [
    { agentId: "agent_director_v1", name: "Director Agent", role: "Director Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Coordinate campaign content from topic to reusable assets.", temperature: 0.7, maxTokens: 4096, toolsEnabled: ["prompt_library", "workflow_center"], status: "active" },
    { agentId: "agent_analyst_v1", name: "Content Analyst Agent", role: "Content Analyst Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Analyze social posts into hooks, topics, audience, angle, and reusable strategy.", temperature: 0.4, maxTokens: 4096, toolsEnabled: ["content_intelligence"], status: "testing" },
    { agentId: "agent_prompt_engineer_v1", name: "Prompt Engineer Agent", role: "Prompt Engineer Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Turn approved creative briefs into reusable image, video, and character prompts.", temperature: 0.5, maxTokens: 4096, toolsEnabled: ["prompt_library", "tool_catalog"], status: "draft" },
    { agentId: "agent_script_writer_v1", name: "Script Writer Agent", role: "Script Writer Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Write short-form scripts with hook, scenes, captions, and CTA.", temperature: 0.8, maxTokens: 4096, toolsEnabled: ["content_intelligence", "prompt_library"], status: "draft" },
    { agentId: "agent_storyboard_v1", name: "Storyboard Agent", role: "Storyboard Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Convert scripts into shot lists, visual directions, and generation-ready scene plans.", temperature: 0.6, maxTokens: 4096, toolsEnabled: ["workflow_center", "asset_library"], status: "draft" },
    { agentId: "agent_publisher_v1", name: "Publisher Agent", role: "Publisher Agent", modelProvider: "fake_worker", modelName: "local-agent-v0", systemPrompt: "Prepare approved assets for platform-specific publishing queues and metadata.", temperature: 0.4, maxTokens: 4096, toolsEnabled: ["publishing_queue", "analytics"], status: "disabled" }
  ]
};
let pageBuilderConfig = structuredClone(defaultPageBuilderConfig);
let toolCatalogConfig = structuredClone(defaultToolCatalogConfig);

injectTopNavigation();
injectAppShell();
injectToolWorkbench();
injectToolDiscovery();
injectCarouselControls();
injectFloatingDock();
injectGlobalFooter();
loadHomepageConfig();
loadPageBuilderConfig();
loadToolCatalogConfig();
applyStoredLanguage();
renderOAuthReadiness();
renderToolHomeDirectory();
renderCookieBanner();
hydrateAuthSession();

function injectTopNavigation() {
  const topnav = document.querySelector(".topnav");
  const accountnav = document.querySelector(".accountnav");
  if (topnav && !topnav.querySelector(".nav-menu")) {
    topnav.innerHTML = `
      <div class="nav-menu">
        <button class="nav-trigger" type="button" aria-expanded="false">图像工具 <span>⌄</span></button>
        <div class="nav-dropdown">
          <a href="./zh/image-tools/"><strong>全部图像工具</strong><small>浏览图像生成、编辑、换脸、造型和组合工具</small></a>
          <a href="./zh/app/image-editor/"><strong>图片编辑器</strong><small>重绘、扩图、局部修复</small></a>
          <a href="./zh/app/face-swap/"><strong>AI 换脸</strong><small>授权角色替换</small></a>
          <a href="./zh/app/outfit-studio/"><strong>造型工作室</strong><small>服装、场景和品牌造型</small></a>
          <a href="./zh/app/pose-generator/"><strong>姿势生成器</strong><small>动作、镜头和分镜参考</small></a>
          <a href="./zh/app/nano-banana/"><strong>Nano Banana</strong><small>快速创意实验</small></a>
          <a href="./zh/app/image-combiner/"><strong>图像组合器</strong><small>多图参考合成</small></a>
        </div>
      </div>
      <div class="nav-menu">
        <button class="nav-trigger" type="button" aria-expanded="false">视频工具 <span>⌄</span></button>
        <div class="nav-dropdown compact-dropdown">
          <a href="./zh/video-tools/"><strong>全部视频工具</strong><small>浏览图片转视频、短片和创作管理入口</small></a>
          <a href="./zh/app/image-to-video/"><strong>图片转视频</strong><small>把静态资产转成短视频</small></a>
          <a href="./zh/history/"><strong>生成历史</strong><small>查看任务、成本和输出</small></a>
          <a href="./zh/my-creations/"><strong>我的创作</strong><small>管理生成作品</small></a>
        </div>
      </div>
      <a href="./zh/pricing/">购买积分</a>
      <a href="./zh/free-coins/">免费硬币</a>
      <a href="./zh/my-creations/">我的创作</a>
    `;
  }
  if (accountnav && !accountnav.querySelector(".language-menu")) {
    accountnav.innerHTML = `
      <a class="daily-check" href="./zh/free-coins/">🎁 每日签到</a>
      ${languageMenuMarkup()}
      <a href="./zh/login/" data-auth-modal>登录</a>
    `;
  }
}

function languageMenuMarkup() {
  const locale = getStoredLanguage();
  return `
    <div class="language-menu">
      <button class="language-trigger" type="button" aria-label="切换语言" aria-expanded="false">${languageTriggerLabel(locale)}</button>
      <div class="language-dropdown">
        ${Object.entries(I18N_LOCALES).map(([code, meta]) => `
          <button type="button" data-language="${escapeHtml(code)}" aria-pressed="${locale === code}">${escapeHtml(meta.label)}</button>
        `).join("")}
      </div>
    </div>
  `;
}

function getStoredLanguage() {
  const locale = localStorage.getItem("ovs_language") || "zh-CN";
  return I18N_LOCALES[locale] ? locale : "zh-CN";
}

function languageTriggerLabel(locale) {
  return I18N_LOCALES[locale]?.short || I18N_LOCALES["zh-CN"].short;
}

function applyStoredLanguage() {
  const locale = getStoredLanguage();
  document.documentElement.lang = locale;
  document.documentElement.dataset.i18nStatus = I18N_LOCALES[locale]?.status || "unknown";
  document.querySelectorAll(".language-trigger").forEach((trigger) => {
    trigger.textContent = languageTriggerLabel(locale);
  });
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.language === locale));
  });
  translateStaticText(locale);
}

function translateStaticText(locale) {
  const dictionary = I18N_MESSAGES[locale];
  document.body.dataset.locale = locale;
  document.body.dataset.i18nCoverage = String(getI18nCoverage(locale));
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    if (!I18N_ORIGINAL_TEXT.has(node)) {
      I18N_ORIGINAL_TEXT.set(node, node.nodeValue);
    }
    const original = I18N_ORIGINAL_TEXT.get(node);
    if (!dictionary) {
      node.nodeValue = original;
      return;
    }
    const text = original.trim();
    node.nodeValue = dictionary[text] ? original.replace(text, dictionary[text]) : original;
  });
  translateStaticAttributes(locale);
}

function translateStaticAttributes(locale) {
  const dictionary = I18N_ATTRIBUTE_MESSAGES[locale];
  const attributes = ["placeholder", "aria-label", "title"];
  document.querySelectorAll("input, textarea, button, a").forEach((element) => {
    if (!I18N_ORIGINAL_ATTRS.has(element)) I18N_ORIGINAL_ATTRS.set(element, {});
    const originals = I18N_ORIGINAL_ATTRS.get(element);
    attributes.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      if (!Object.prototype.hasOwnProperty.call(originals, attribute)) {
        originals[attribute] = element.getAttribute(attribute);
      }
      const original = originals[attribute];
      if (!dictionary || !dictionary[original]) {
        element.setAttribute(attribute, original);
        return;
      }
      element.setAttribute(attribute, dictionary[original]);
    });
  });
}

function getI18nCoverage(locale) {
  if (locale === "zh-CN") return 100;
  const dictionary = I18N_MESSAGES[locale] || {};
  const translated = I18N_PRODUCT_TERMS.filter((term) => dictionary[term]).length;
  return Math.round((translated / I18N_PRODUCT_TERMS.length) * 100);
}

function showSiteToast(message) {
  document.querySelector(".site-toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "site-toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2200);
}

function getCookiePreferences() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_PREF_KEY) || "null");
  } catch {
    return null;
  }
}

function saveCookiePreferences(preferences) {
  localStorage.setItem(COOKIE_PREF_KEY, JSON.stringify({
    necessary: true,
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing),
    updatedAt: new Date().toISOString()
  }));
  document.querySelector(".cookie-banner")?.remove();
  document.querySelector(".cookie-preferences-overlay")?.remove();
  showSiteToast("Cookie 偏好已保存");
}

function renderCookieBanner() {
  if (document.body.classList.contains("share-body") || getCookiePreferences() || document.querySelector(".cookie-banner")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <section class="cookie-banner" data-cookie-banner>
      <div>
        <strong>Cookie 偏好</strong>
        <p>我们使用必要本地存储保存登录、积分演示、语言和创作状态。你可以选择是否允许分析和营销用途。</p>
      </div>
      <div class="cookie-banner-actions">
        <button type="button" data-cookie-manage>管理偏好</button>
        <button type="button" data-cookie-essential>仅必要</button>
        <button type="button" data-cookie-accept>接受全部</button>
      </div>
    </section>
  `);
}

function openCookiePreferences() {
  document.querySelector(".cookie-preferences-overlay")?.remove();
  const current = getCookiePreferences() || { necessary: true, analytics: false, marketing: false };
  const overlay = document.createElement("section");
  overlay.className = "cookie-preferences-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Cookie 偏好设置");
  overlay.innerHTML = `
    <div class="cookie-preferences-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <p class="eyebrow">Cookie</p>
      <h2>管理 Cookie 偏好</h2>
      <label><span><strong>必要存储</strong><small>登录状态、积分演示、语言和生成历史。</small></span><input type="checkbox" checked disabled></label>
      <label><span><strong>产品分析</strong><small>帮助理解页面使用情况，后续接入真实分析前仅保存偏好。</small></span><input type="checkbox" data-cookie-analytics ${current.analytics ? "checked" : ""}></label>
      <label><span><strong>营销偏好</strong><small>用于优惠提示和推荐活动偏好，当前不会连接第三方广告 API。</small></span><input type="checkbox" data-cookie-marketing ${current.marketing ? "checked" : ""}></label>
      <div class="cookie-modal-actions">
        <button class="btn glass" type="button" data-cookie-essential>仅必要</button>
        <button class="btn primary" type="button" data-cookie-save>保存偏好</button>
      </div>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

function closeOpenMenus(exceptMenu = null) {
  document.querySelectorAll(".nav-menu.is-open, .language-menu.is-open, .account-menu.is-open").forEach((menu) => {
    if (menu === exceptMenu) return;
    menu.classList.remove("is-open");
    menu.querySelector("button")?.setAttribute("aria-expanded", "false");
  });
}

function toggleDropdownMenu(trigger) {
  const menu = trigger.closest(".nav-menu, .language-menu, .account-menu");
  if (!menu) return;
  const willOpen = !menu.classList.contains("is-open");
  closeOpenMenus(menu);
  menu.classList.toggle("is-open", willOpen);
  trigger.setAttribute("aria-expanded", String(willOpen));
}

function renderToolHomeDirectory() {
  const cards = Array.from(document.querySelectorAll("[data-tool-home-card]"));
  if (!cards.length) return;
  let visibleCount = 0;
  cards.forEach((card) => {
    const tags = `${card.dataset.toolTags || ""} ${card.textContent || ""}`.toLowerCase();
    const matchesFilter = toolHomeFilter === "all" || tags.includes(toolHomeFilter);
    const matchesSearch = !toolHomeSearch || tags.includes(toolHomeSearch);
    const visible = matchesFilter && matchesSearch;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  document.querySelectorAll("[data-tool-home-section]").forEach((section) => {
    section.hidden = !section.querySelector("[data-tool-home-card]:not([hidden])");
  });
  document.querySelectorAll("[data-tool-home-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.toolHomeFilter === toolHomeFilter);
  });
  const empty = document.querySelector("[data-tool-home-empty]");
  if (empty) empty.hidden = visibleCount > 0;
}

function renderAccountNavigation(current) {
  const accountnav = document.querySelector(".accountnav");
  if (!accountnav) return;
  if (!current.user) {
    accountnav.innerHTML = `
      <a class="daily-check" href="./zh/free-coins/">🎁 每日签到</a>
      ${languageMenuMarkup()}
      <a href="./zh/login/" data-auth-modal>登录</a>
    `;
    return;
  }
  const initial = (current.user.name || "创作者").trim().charAt(0).toUpperCase();
  accountnav.innerHTML = `
    <a class="daily-check" href="./zh/free-coins/">🎁 每日签到</a>
    <a class="account-credit" href="./zh/pricing/"><span data-credit-balance>${current.credits}</span> 积分</a>
    ${languageMenuMarkup()}
    <div class="account-menu">
      <button class="account-trigger" type="button" aria-expanded="false"><span>${initial}</span><b data-user-name>${current.user.name}</b></button>
      <div class="account-dropdown">
        <a href="./zh/dashboard/">控制台</a>
        <a href="./zh/campaigns/">Campaigns</a>
        <a href="./zh/ai-studio/">AI Studio</a>
        <a href="./zh/pipeline/">Content Pipeline</a>
        <a href="./zh/queue/">Content Queue</a>
        <a href="./zh/accounts/">Publishing Accounts</a>
        <a href="./zh/publishing/">Publishing</a>
        <a href="./zh/calendar/">Content Calendar</a>
        <a href="./zh/analytics/">Analytics</a>
        <a href="./zh/automation/">Automation</a>
        <a href="./zh/settings/">Settings</a>
        <a href="./zh/my-creations/">我的创作</a>
        <a href="./zh/history/">生成历史</a>
        <a href="./zh/assets/">资产库</a>
        <a href="./zh/admin/">管理后台</a>
        <a href="./zh/free-coins/">免费硬币</a>
        <a href="./zh/pricing/">购买积分</a>
        <button type="button" data-logout>退出登录</button>
      </div>
    </div>
  `;
}

function injectAppShell() {
  const page = window.location.pathname.split("/").pop() || "index.html";
  if (!APP_SHELL_PAGES.has(page) || document.querySelector(".side-rail")) return;
  const active = (target) => page === target ? " rail-active" : "";
  document.body.classList.add("tool-layout");
  document.body.insertAdjacentHTML("afterbegin", `
    <aside class="side-rail" aria-label="Product tools">
      <a class="rail-brand" href="./index.html"><span>ovs.ai</span><strong>Open Video Studio</strong></a>
      <nav class="rail-nav">
        <a href="./zh/app/" class="${active("app.html")}">首页</a>
        <a href="./zh/gallery/" class="${active("gallery.html")}">热门作品</a>
        <a href="./zh/app/ai-effects/" class="${active("ai-effects.html")}">AI 特效 <em>HOT</em></a>
        <span>AI 图像</span>
        <a href="./zh/image-tools/" class="${active("image-tools.html")}">全部图像工具</a>
        <a href="./zh/app/image-editor/" class="${active("image-editor.html")}">图片编辑器</a>
        <a href="./zh/app/face-swap/" class="${active("face-swap.html")}">AI 换脸</a>
        <a href="./zh/app/outfit-studio/" class="${active("outfit-studio.html")}">造型工作室</a>
        <a href="./zh/app/pose-generator/" class="${active("pose-generator.html")}">姿势生成器</a>
        <a href="./zh/app/nano-banana/" class="${active("nano-banana.html")}">Nano Banana</a>
        <a href="./zh/app/image-combiner/" class="${active("image-combiner.html")}">图像组合器</a>
        <a href="./zh/app/generate/" class="${active("generate.html")}">图片生成器</a>
        <a href="./zh/app/characters/" class="${active("characters.html")}">角色生成器</a>
        <a href="./zh/assets/" class="${active("assets.html")}">资产库</a>
        <span>内容运营</span>
        <a href="./zh/campaigns/" class="${active("campaigns.html")}">Campaigns</a>
        <a href="./zh/ai-studio/" class="${active("ai-studio.html")}">AI Studio</a>
        <a href="./zh/pipeline/" class="${active("pipeline.html")}">Content Pipeline</a>
        <a href="./zh/queue/" class="${active("queue.html")}">Content Queue</a>
        <a href="./zh/accounts/" class="${active("accounts.html")}">Publishing Accounts</a>
        <a href="./zh/publishing/" class="${active("publishing.html")}">Publishing</a>
        <a href="./zh/calendar/" class="${active("calendar.html")}">Content Calendar</a>
        <a href="./zh/analytics/" class="${active("analytics.html")}">Analytics</a>
        <a href="./zh/automation/" class="${active("automation.html")}">Automation</a>
        <a href="./zh/settings/" class="${active("settings.html")}">Settings</a>
        <span>AI 视频</span>
        <a href="./zh/video-tools/" class="${active("video-tools.html")}">全部视频工具</a>
        <a href="./zh/app/image-to-video/" class="${active("image-to-video.html")}">图片转视频</a>
        <a href="./zh/my-creations/" class="${active("my-creations.html")}">我的创作</a>
        <a href="./zh/history/" class="${active("history.html")}">生成历史</a>
        <a href="./zh/admin/" class="${active("admin.html")}">管理后台</a>
      </nav>
      <div class="rail-actions">
        <a href="./zh/free-coins/">推荐好友</a>
        <a class="rail-upgrade" href="./zh/pricing/">立即升级</a>
      </div>
    </aside>
  `);
}

function injectGlobalFooter() {
  if (document.querySelector(".site-footer") || document.body.classList.contains("share-body")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer app-footer" aria-label="Footer navigation">
      <div class="footer-top-links">
        <a href="./zh/app/">首页</a>
        <a href="./zh/image-tools/">图像工具</a>
        <a href="./zh/app/ai-effects/">AI 特效</a>
        <a href="./zh/video-tools/">AI 视频</a>
        <a href="./zh/gallery/">作品探索</a>
      </div>
      <div>
        <h3>图像工具</h3>
        <a href="./zh/image-tools/">全部图像工具</a>
        <a href="./zh/app/image-editor/">图片编辑器</a>
        <a href="./zh/app/face-swap/">AI 换脸</a>
        <a href="./zh/app/outfit-studio/">造型工作室</a>
        <a href="./zh/app/pose-generator/">姿势生成器</a>
        <a href="./zh/app/nano-banana/">Nano Banana</a>
        <a href="./zh/app/image-combiner/">图像组合器</a>
      </div>
      <div>
        <h3>视频工具</h3>
        <a href="./zh/video-tools/">全部视频工具</a>
        <a href="./zh/app/image-to-video/">图片转视频</a>
        <a href="./zh/history/">生成历史</a>
        <a href="./zh/my-creations/">我的创作</a>
        <a href="./zh/campaigns/">Campaigns</a>
        <a href="./zh/ai-studio/">AI Studio</a>
        <a href="./zh/pipeline/">Content Pipeline</a>
        <a href="./zh/queue/">Content Queue</a>
        <a href="./zh/accounts/">Publishing Accounts</a>
        <a href="./zh/publishing/">Publishing</a>
        <a href="./zh/calendar/">Content Calendar</a>
        <a href="./zh/analytics/">Analytics</a>
        <a href="./zh/automation/">Automation</a>
        <a href="./zh/settings/">Settings</a>
      </div>
      <div>
        <h3>About Us</h3>
        <a href="./zh/blog/">Blog</a>
        <a href="./zh/pricing/">价格</a>
        <a href="./zh/free-coins/">推荐</a>
        <a href="./zh/terms/">Terms</a>
        <a href="./zh/privacy/">Privacy</a>
        <a href="./zh/cookie/">Cookie</a>
        <a href="./zh/admin/">Admin</a>
      </div>
      <div>
        <p>支持：support@openvideostudio.app</p>
        <p>商务：business@openvideostudio.app</p>
        <p>版权所有 © 2026</p>
      </div>
    </footer>
  `);
}

function injectFloatingDock() {
  if (document.querySelector(".floating-dock") || document.body.classList.contains("share-body")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="floating-dock" aria-label="Quick actions">
      <button class="floating-action daily-check" type="button" aria-label="每日签到"><span>🎁</span></button>
      <a class="floating-action" href="./zh/free-coins/" aria-label="免费硬币"><span>币</span></a>
      <button class="floating-action" type="button" data-support-widget aria-label="帮助"><span>?</span></button>
      <button class="floating-avatar" type="button" data-support-widget aria-label="客服头像"><span>OVS</span></button>
      <button class="floating-action to-top" type="button" data-scroll-top aria-label="返回顶部"><span>↑</span></button>
    </aside>
  `);
}

function injectToolWorkbench() {
  const hero = document.querySelector(".tool-detail-hero");
  if (!hero || document.querySelector("[data-tool-workbench]")) return;
  const toolName = document.querySelector(".tool-detail-copy h1")?.textContent?.trim() || "AI 工具";
  hero.insertAdjacentHTML("afterend", `
    <section class="tool-workbench" data-tool-workbench>
      <div class="tool-input-panel">
        <div class="tool-section-head">
          <div>
            <p class="eyebrow">Create</p>
            <h2>${toolName} 工作台</h2>
          </div>
          <span class="credit-pill"><b data-credit-balance>${state.credits}</b> 积分</span>
        </div>
        <label class="tool-upload-zone">
          <input type="file" accept="image/*,video/*">
          <strong>上传参考图片或视频帧</strong>
          <span>支持角色图、产品图、场景图和参考风格。</span>
        </label>
        <div class="tool-mode-tabs" role="tablist" aria-label="Tool modes">
          <button class="active" type="button">标准</button>
          <button type="button">高质量</button>
          <button type="button">批量</button>
        </div>
        <label class="studio-field">
          <span>提示词</span>
          <textarea class="hero-textarea" data-tool-prompt rows="5">生成一个干净、电影感、适合社媒传播的 AI 创作结果，保持角色和品牌视觉一致。</textarea>
        </label>
        <div class="selector-grid">
          <label>风格<select><option>电影感</option><option>商业广告</option><option>社媒短片</option><option>产品展示</option></select></label>
          <label>比例<select><option>9:16</option><option>1:1</option><option>16:9</option><option>4:5</option></select></label>
        </div>
        <button class="btn primary full" type="button" data-tool-demo-generate>生成演示结果</button>
      </div>
      <div class="tool-output-panel">
        <div class="tool-preview-canvas art-7" data-tool-demo-preview></div>
        <div class="tool-output-status" data-tool-demo-status>
          <strong>等待生成</strong>
          <span>生成结果会保存到资产库和生成历史。</span>
        </div>
        <div class="tool-template-row">
          <button type="button" data-template-prompt="产品发布主视觉，霓虹灯光，干净背景">产品发布</button>
          <button type="button" data-template-prompt="角色封面图，电影感人像，清晰构图">角色封面</button>
          <button type="button" data-template-prompt="社媒短视频封面，强对比色，高级质感">社媒封面</button>
        </div>
      </div>
    </section>
  `);
}

function injectToolDiscovery() {
  const page = document.querySelector(".tool-detail-page");
  if (!page || document.querySelector("[data-tool-discovery]")) return;
  const toolName = document.querySelector(".tool-detail-copy h1")?.textContent?.trim() || "AI 工具";
  const isVideo = toolName.includes("视频");
  const relatedTools = [
    ["图片编辑器", "重绘、扩图、修复参考图", "image-editor.html", "art-3"],
    ["AI 换脸", "授权角色替换与一致性", "face-swap.html", "art-2"],
    ["造型工作室", "角色服装和场景风格", "outfit-studio.html", "art-11"],
    ["姿势生成器", "动作、镜头和分镜参考", "pose-generator.html", "art-10"],
    ["图像组合器", "多张资产合成主视觉", "image-combiner.html", "art-9"],
    ["图片转视频", "把图像变成短视频资产", "image-to-video.html", "art-7"]
  ].filter((item) => !toolName.includes(item[0])).slice(0, 5);

  page.insertAdjacentHTML("beforeend", `
    <section class="tool-template-gallery" data-tool-discovery>
      <div class="tool-section-head">
        <div>
          <p class="eyebrow">模板库</p>
          <h2>${toolName} 热门模板</h2>
        </div>
        <a href="./zh/pricing/">购买积分</a>
      </div>
      <div class="tool-template-grid">
        ${[
          ["品牌主视觉", "适合广告图、活动头图和产品发布", "品牌发布主视觉，电影感灯光，清晰主体，适合商业投放", "art-1"],
          ["角色封面", "保持角色一致，生成可复用人物资产", "一致性角色封面，干净背景，高级摄影棚质感", "art-2"],
          ["社媒短片", "竖屏节奏、强对比封面和可分享资产", "竖屏社媒短片封面，强视觉中心，适合视频发布", "art-13"],
          ["产品场景", "把产品放入真实可传播的使用场景", "产品生活方式场景，真实光影，现代室内，商业摄影", "art-6"]
        ].map(([title, desc, prompt, art]) => `
          <button class="tool-template-card ${art}" type="button" data-template-prompt="${prompt}" data-tool-template-card>
            <strong>${title}</strong>
            <span>${desc}</span>
          </button>
        `).join("")}
      </div>
    </section>
    <section class="tool-usecase-band">
      <article><span>01</span><strong>${isVideo ? "从图片进入视频" : "上传或选择资产"}</strong><p>${isVideo ? "选择图片、角色或产品图，进入短视频生成流程。" : "从本地上传或从资产库选择参考图，保持创作素材可复用。"}</p></article>
      <article><span>02</span><strong>选择模板并调整提示词</strong><p>用模板快速起步，再改角色、风格、比例和输出用途。</p></article>
      <article><span>03</span><strong>保存到我的创作</strong><p>演示生成会进入资产、历史和分享链路，方便继续复用。</p></article>
    </section>
    <section class="tool-related-section" data-tool-related>
      <div class="tool-section-head">
        <div>
          <p class="eyebrow">继续创作</p>
          <h2>相关工具</h2>
        </div>
        <a href="./app.html">返回工具首页</a>
      </div>
      <div class="card-carousel compact">
        ${relatedTools.map(([title, desc, href, art]) => `
          <a class="tool-poster ${art}" href="./${href}" data-tool-route="${href}">
            <strong>${title}</strong>
            <span>${desc}</span>
          </a>
        `).join("")}
      </div>
    </section>
    <section class="tool-conversion-strip">
      <div>
        <p class="eyebrow">创作额度</p>
        <h2>生成结果会保存为可复用资产</h2>
        <p class="muted">登录后可同步角色、素材库、历史记录、分享链接和积分余额。</p>
      </div>
      <div class="tool-conversion-actions">
        <a class="btn primary" href="./zh/login/" data-auth-modal>登录继续</a>
        <a class="btn glass" href="./zh/free-coins/">领取免费硬币</a>
      </div>
    </section>
  `);
}

function injectCarouselControls() {
  document.querySelectorAll(".card-carousel").forEach((carousel, index) => {
    if (carousel.dataset.carouselReady === "true") return;
    const id = `carousel_${index}`;
    carousel.dataset.carouselReady = "true";
    carousel.dataset.carouselId = id;
    carousel.setAttribute("tabindex", "0");
    carousel.insertAdjacentHTML("beforebegin", `
      <div class="carousel-controls" data-carousel-controls>
        <button type="button" data-carousel-scroll="${id}" data-direction="-1" aria-label="向左滚动">‹</button>
        <button type="button" data-carousel-scroll="${id}" data-direction="1" aria-label="向右滚动">›</button>
      </div>
    `);
  });
}

async function hydrateAuthSession() {
  if (document.body.classList.contains("share-body")) {
    await hydrateRemoteShareByToken();
  }
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
    await syncRemoteProductData();
    saveState(state);
  } else {
    renderState(state);
  }
}

async function syncRemoteProductData() {
  if (!supabase || !state.user?.id) return;
  const [assetsResult, jobsResult, creditsResult, sharesResult] = await Promise.all([
    supabase.from("media_assets").select("*").eq("owner_user_id", state.user.id).is("deleted_at", null).order("updated_at", { ascending: false }).limit(80),
    supabase.from("generation_jobs").select("*").eq("user_id", state.user.id).order("created_at", { ascending: false }).limit(80),
    supabase.from("credit_transactions").select("balance_impact,status").eq("user_id", state.user.id),
    supabase.from("share_links").select("*").eq("owner_user_id", state.user.id).eq("visibility_status", "active").is("revoked_at", null).order("created_at", { ascending: false }).limit(80)
  ]);
  if (!assetsResult.error && Array.isArray(assetsResult.data)) {
    state.assets = assetsResult.data.map(mapRemoteAsset);
  }
  if (!jobsResult.error && Array.isArray(jobsResult.data)) {
    state.history = jobsResult.data.map(mapRemoteJob);
  }
  if (!creditsResult.error && Array.isArray(creditsResult.data)) {
    state.credits = creditsResult.data
      .filter((row) => row.status === "posted")
      .reduce((sum, row) => sum + Number(row.balance_impact || 0), 0);
  }
  if (!sharesResult.error && Array.isArray(sharesResult.data)) {
    state.shares = sharesResult.data.map((share) => ({
      id: String(share.id),
      token: String(share.token),
      assetId: String(share.media_asset_id),
      title: state.assets.find((asset) => asset.id === share.media_asset_id)?.title || "分享作品",
      remote: true
    }));
  }
}

async function hydrateRemoteShareByToken() {
  if (!supabase) return;
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) return;
  const shareResult = await supabase
    .from("share_links")
    .select("*")
    .eq("token", token)
    .eq("visibility_status", "active")
    .is("revoked_at", null)
    .maybeSingle();
  if (shareResult.error || !shareResult.data?.media_asset_id) return;
  const assetResult = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", shareResult.data.media_asset_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (assetResult.error || !assetResult.data) return;
  const asset = mapRemoteAsset(assetResult.data);
  asset.visibility = "public";
  upsertById(state.assets, asset);
  upsertById(state.shares, {
    id: String(shareResult.data.id),
    token: String(shareResult.data.token),
    assetId: String(shareResult.data.media_asset_id),
    title: asset.title,
    remote: true
  });
}

function mapRemoteAsset(asset, index = 0) {
  const metadata = parseMaybeJson(asset.metadata_json);
  return {
    id: String(asset.id),
    type: asset.asset_type === "video" ? "video" : "image",
    title: String(asset.display_name || `${asset.asset_type || "image"}-${index + 1}`),
    prompt: String(metadata.prompt || ""),
    character: String(asset.character_id || metadata.character || "Mira"),
    credits: Number(metadata.credits || 0),
    status: String(asset.processing_status || "ready"),
    visibility: String(asset.visibility_status || "private"),
    favorite: Boolean(asset.is_favorite),
    remote: true
  };
}

function mapRemoteJob(job) {
  return {
    id: String(job.id),
    type: job.media_type === "video" ? "video" : "image",
    title: job.media_type === "video" ? "生成视频场景" : "生成图片作品",
    prompt: String(job.prompt || ""),
    provider: String(job.provider || "fake_worker"),
    model: String(job.model || "local-demo"),
    status: String(job.status || "queued"),
    credits: Number(job.cost_credits || job.credit_charged || 0),
    duration: job.latency ? `${Math.round(Number(job.latency) / 1000)}s` : String(job.duration_seconds ? `${job.duration_seconds}s` : "等待中"),
    assetId: String(job.result_asset_id || "")
  };
}

function parseMaybeJson(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
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
  renderAccountNavigation(current);
  renderProtectedPageGate(current);
  document.querySelectorAll("[data-credit-balance]").forEach((node) => {
    node.textContent = String(current.credits);
  });
  document.querySelectorAll("[data-user-name]").forEach((node) => {
    node.textContent = current.user ? current.user.name : "访客创作者";
  });
  renderCharacters(current);
  renderAssets(current);
  renderHistory(current);
  renderCreations(current);
  renderDashboard(current);
  renderContentOperatingSystem(current);
  renderReferral(current);
  renderShare(current);
  renderAdmin(current);
  translateStaticText(getStoredLanguage());
}

function renderProtectedPageGate(current) {
  const page = window.location.pathname.split("/").pop() || "index.html";
  if (!PROTECTED_PRODUCT_PAGES.has(page)) return;
  document.querySelector(".protected-gate")?.remove();
  document.body.classList.toggle("protected-signed-out", !current.user);
  if (current.user) return;
  const main = document.querySelector("main");
  if (!main) return;
  main.insertAdjacentHTML("afterbegin", `
    <section class="protected-gate" data-protected-gate>
      <div>
        <p class="eyebrow">需要登录</p>
        <h2>登录后管理你的创作、资产和积分</h2>
        <p>这些页面会保存你的生成结果、历史记录、分享链接和资产库。当前展示的是本地演示数据，登录后可进入真实账户流程。</p>
      </div>
      <div class="protected-gate-actions">
        <a class="btn primary" href="./zh/login/" data-auth-modal>登录 / 注册</a>
        <a class="btn glass" href="./app.html">先浏览工具</a>
      </div>
    </section>
  `);
}

function showAuthMessage(message, tone = "info") {
  const target = document.querySelector("[data-auth-message]");
  if (!target) return;
  target.textContent = message;
  target.dataset.tone = tone;
}

function getOAuthReadiness() {
  return [
    { name: "Google", ready: Boolean(supabase), action: "Supabase Authentication > Providers > Google，填写 Client ID / Secret，并加入站点回调 URL。" },
    { name: "X", ready: Boolean(supabase), action: "Supabase Authentication > Providers > Twitter/X，填写 API Key / Secret。" },
    { name: "Telegram", ready: Boolean(telegramBotUsername && telegramAuthUrl), action: "配置 Telegram Bot Username、VITE_TELEGRAM_AUTH_URL，并在后端校验 Telegram 签名。" },
    { name: "Discord", ready: Boolean(supabase), action: "Supabase Authentication > Providers > Discord，填写 Client ID / Secret。" }
  ];
}

function renderOAuthReadiness() {
  const target = document.querySelector("[data-oauth-readiness]");
  if (!target) return;
  target.innerHTML = getOAuthReadiness().map((item) => `
    <article class="oauth-readiness-row">
      <span class="status-dot ${item.ready ? "ready" : "blocked"}"></span>
      <div><strong>${item.name}</strong><p>${escapeHtml(item.action)}</p></div>
      <em>${item.ready ? "前端已就绪" : "待后台配置"}</em>
    </article>
  `).join("");
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
      options: { redirectTo: new URL("./zh/dashboard/", window.location.href).href }
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

document.addEventListener("click", async (event) => {
  const adminRefresh = event.target.closest("[data-admin-refresh]");
  if (adminRefresh) {
    event.preventDefault();
    adminLoaded = false;
    adminData = null;
    await loadAdminConsole();
    return;
  }
  const adminCopyUser = event.target.closest("[data-admin-copy-user]");
  if (adminCopyUser) {
    event.preventDefault();
    await navigator.clipboard?.writeText(adminCopyUser.dataset.adminCopyUser || "");
    adminCopyUser.textContent = "已复制";
    return;
  }
  const adminOrder = event.target.closest("[data-admin-order]");
  if (adminOrder) {
    event.preventDefault();
    await runAdminAction(adminOrder, "update-order-status", {
      orderId: adminOrder.dataset.adminOrder,
      status: adminOrder.dataset.status || "fulfilled",
      reason: "后台确认订单履约"
    });
    return;
  }
  const adminReviewAsset = event.target.closest("[data-admin-review-asset]");
  if (adminReviewAsset) {
    event.preventDefault();
    await runAdminAction(adminReviewAsset, "review-asset", {
      assetId: adminReviewAsset.dataset.adminReviewAsset,
      moderationStatus: adminReviewAsset.dataset.status || "approved",
      visibilityStatus: "public",
      reason: "后台内容审核通过"
    });
    return;
  }
  const adminRevokeShare = event.target.closest("[data-admin-revoke-share]");
  if (adminRevokeShare) {
    event.preventDefault();
    await runAdminAction(adminRevokeShare, "revoke-share-link", {
      shareId: adminRevokeShare.dataset.adminRevokeShare,
      reason: "后台撤销公开分享"
    });
    return;
  }
  const adminHomepagePreview = event.target.closest("[data-admin-homepage-preview]");
  if (adminHomepagePreview) {
    event.preventDefault();
    const form = document.querySelector("[data-admin-homepage-form]");
    if (!form) return;
    const config = readHomepageForm(new FormData(form));
    renderAdminHomepagePreview(config);
    localStorage.setItem("ovs_homepage_config_preview", JSON.stringify(config));
    showSiteToast("已生成首页预览配置，可打开首页查看本机预览。");
    return;
  }
  const adminPageBuilderPreview = event.target.closest("[data-admin-page-builder-preview]");
  if (adminPageBuilderPreview) {
    event.preventDefault();
    const form = document.querySelector("[data-admin-page-builder-form]");
    if (!form) return;
    renderAdminPageBuilderPreview(readPageBuilderForm(new FormData(form)));
    showSiteToast("已生成页面模块预览");
    return;
  }
  const adminToolCatalogPreview = event.target.closest("[data-admin-tool-catalog-preview]");
  if (adminToolCatalogPreview) {
    event.preventDefault();
    const form = document.querySelector("[data-admin-tool-catalog-form]");
    if (!form) return;
    renderAdminToolCatalogPreview(readToolCatalogForm(new FormData(form)));
    showSiteToast("已生成工具上架预览");
    return;
  }
  const adminWorkflowPreview = event.target.closest("[data-admin-workflow-preview]");
  if (adminWorkflowPreview) {
    event.preventDefault();
    const form = document.querySelector("[data-admin-workflow-form]");
    if (!form) return;
    renderAdminWorkflowPreview(readWorkflowForm(new FormData(form)));
    showSiteToast("已生成 Workflow 预览");
    return;
  }
  const adminWorkflowSwitch = event.target.closest("[data-admin-workflow-switch]");
  if (adminWorkflowSwitch) {
    event.preventDefault();
    await runAdminWorkflowSwitch(adminWorkflowSwitch);
    return;
  }
  const adminPromptPreview = event.target.closest("[data-admin-prompt-preview]");
  if (adminPromptPreview) {
    event.preventDefault();
    const form = document.querySelector("[data-admin-prompt-form]");
    if (!form) return;
    renderAdminPromptPreview(readPromptForm(new FormData(form)));
    showSiteToast("已生成 Prompt 预览");
    return;
  }
  const adminIntelligencePreview = event.target.closest("[data-admin-intelligence-preview]");
  if (adminIntelligencePreview) {
    event.preventDefault();
    const form = document.querySelector("[data-admin-intelligence-form]");
    if (!form) return;
    renderAdminIntelligencePreview(readIntelligenceForm(new FormData(form)));
    showSiteToast("已生成内容情报预览");
    return;
  }
  const adminAgentPreview = event.target.closest("[data-admin-agent-preview]");
  if (adminAgentPreview) {
    event.preventDefault();
    const form = document.querySelector("[data-admin-agent-form]");
    if (!form) return;
    renderAdminAgentPreview(readAgentForm(new FormData(form)));
    showSiteToast("已生成 Agent 预览");
    return;
  }
  const carouselButton = event.target.closest("[data-carousel-scroll]");
  if (carouselButton) {
    event.preventDefault();
    const carousel = document.querySelector(`[data-carousel-id="${carouselButton.dataset.carouselScroll}"]`);
    if (carousel) {
      const direction = Number(carouselButton.dataset.direction || "1");
      carousel.scrollBy({ left: direction * Math.max(260, carousel.clientWidth * 0.82), behavior: "smooth" });
    }
    return;
  }

  if (event.target.closest("[data-cookie-manage]")) {
    event.preventDefault();
    openCookiePreferences();
    return;
  }
  if (event.target.closest("[data-cookie-essential]")) {
    event.preventDefault();
    saveCookiePreferences({ analytics: false, marketing: false });
    return;
  }
  if (event.target.closest("[data-cookie-accept]")) {
    event.preventDefault();
    saveCookiePreferences({ analytics: true, marketing: true });
    return;
  }
  if (event.target.closest("[data-cookie-save]")) {
    event.preventDefault();
    saveCookiePreferences({
      analytics: Boolean(document.querySelector("[data-cookie-analytics]")?.checked),
      marketing: Boolean(document.querySelector("[data-cookie-marketing]")?.checked)
    });
    return;
  }

  const menuTrigger = event.target.closest(".nav-trigger, .language-trigger, .account-trigger");
  if (menuTrigger) {
    event.preventDefault();
    toggleDropdownMenu(menuTrigger);
    return;
  }
  if (!event.target.closest(".nav-menu, .language-menu, .account-menu")) {
    closeOpenMenus();
  }

  const authModalLink = event.target.closest("[data-auth-modal]");
  if (authModalLink) {
    event.preventDefault();
    openAuthModal(authModalLink.getAttribute("href") || "./zh/dashboard/");
    return;
  }

  const modalAuthButton = event.target.closest("[data-modal-auth-provider]");
  if (modalAuthButton) {
    event.preventDefault();
    await startSocialAuth(modalAuthButton.dataset.modalAuthProvider || "google", modalAuthButton.dataset.nextUrl || "./zh/dashboard/");
    return;
  }

  const dailyCheck = event.target.closest(".daily-check");
  if (dailyCheck) {
    event.preventDefault();
    openCheckInModal();
    return;
  }
  const languageButton = event.target.closest("[data-language]");
  if (languageButton) {
    const label = languageButton.textContent.trim();
    const locale = languageButton.dataset.language || "zh-CN";
    localStorage.setItem("ovs_language", locale);
    applyStoredLanguage();
    const coverage = getI18nCoverage(locale);
    showSiteToast(locale === "zh-CN" ? "已切换为简体中文" : `已切换为 ${label}，核心界面覆盖率 ${coverage}%`);
    return;
  }
  const logoutButton = event.target.closest("[data-logout]");
  if (logoutButton) {
    if (supabase) await supabase.auth.signOut();
    state.user = null;
    saveState(state);
    return;
  }
  const templateButton = event.target.closest("[data-template-prompt]");
  if (templateButton) {
    const prompt = document.querySelector("[data-tool-prompt]");
    if (prompt) prompt.value = templateButton.dataset.templatePrompt;
    return;
  }
  const toolGenerateButton = event.target.closest("[data-tool-demo-generate]");
  if (toolGenerateButton) {
    if (!state.user) {
      openUnlockModal(window.location.pathname.split("/").pop() || "./zh/app/generate/");
      return;
    }
    runToolDemoGeneration();
    return;
  }
  const supportButton = event.target.closest("[data-support-widget]");
  if (supportButton) {
    openSupportWidget();
    return;
  }
  const scrollTopButton = event.target.closest("[data-scroll-top]");
  if (scrollTopButton) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const pipelineMove = event.target.closest("[data-pipeline-move]");
  if (pipelineMove) {
    event.preventDefault();
    const item = state.contentItems.find((entry) => entry.id === pipelineMove.dataset.pipelineMove);
    if (!item) return;
    item.stage = pipelineMove.dataset.stage || "review";
    item.reviewStatus = item.stage === "scheduled" ? "scheduled" : item.stage === "published" ? "published" : "needs_review";
    if (item.stage === "scheduled" && !state.contentQueue.some((queue) => queue.contentItemId === item.id)) {
      state.contentQueue.unshift({
        id: `queue_${Date.now()}`,
        contentItemId: item.id,
        platform: item.variants?.[0]?.platform || "X",
        status: "scheduled",
        scheduledAt: "明天 09:00",
        title: item.title
      });
    }
    saveState(state);
    showSiteToast(`已移动到 ${item.stage}`);
    return;
  }

  const queueButton = event.target.closest("[data-queue-filter]");
  if (queueButton) {
    event.preventDefault();
    queueFilter = queueButton.dataset.queueFilter || "all";
    renderContentQueue(state);
  }
});

document.addEventListener("submit", async (event) => {
  const campaignForm = event.target.closest("[data-campaign-form]");
  if (campaignForm) {
    event.preventDefault();
    const formData = new FormData(campaignForm);
    const campaign = {
      id: `camp_${Date.now()}`,
      name: String(formData.get("name") || "Untitled Campaign"),
      goal: String(formData.get("goal") || "traffic"),
      niche: String(formData.get("niche") || ""),
      audience: String(formData.get("audience") || ""),
      platforms: String(formData.get("platforms") || "").split(",").map((item) => item.trim()).filter(Boolean),
      connectedAccounts: [],
      style: String(formData.get("style") || ""),
      frequency: String(formData.get("frequency") || ""),
      cta: String(formData.get("cta") || ""),
      targetUrl: "",
      status: "draft"
    };
    state.campaigns.unshift(campaign);
    saveState(state);
    showSiteToast("Campaign 已创建");
    return;
  }

  const aiStudioForm = event.target.closest("[data-ai-studio-form]");
  if (aiStudioForm) {
    event.preventDefault();
    const formData = new FormData(aiStudioForm);
    const campaignId = String(formData.get("campaignId") || state.campaigns[0]?.id || "");
    const campaign = state.campaigns.find((item) => item.id === campaignId) || state.campaigns[0];
    const topic = String(formData.get("topic") || "AI 内容创作");
    const character = String(formData.get("character") || "Mira");
    const contentItem = createMockContentItem(campaign, topic, character);
    state.contentItems.unshift(contentItem);
    saveState(state);
    showSiteToast("AI Studio 草稿已生成");
    window.setTimeout(() => renderAiStudioOutput(state), 0);
    return;
  }

  const socialAccountForm = event.target.closest("[data-social-account-form]");
  if (socialAccountForm) {
    event.preventDefault();
    const formData = new FormData(socialAccountForm);
    state.socialAccounts.unshift({
      id: `social_${Date.now()}`,
      platform: String(formData.get("platform") || "X"),
      handle: String(formData.get("handle") || "@openvideostudio"),
      purpose: String(formData.get("purpose") || "Campaign 发布账号"),
      status: "connected"
    });
    saveState(state);
    showSiteToast("演示发布账号已连接");
    return;
  }

  const automationForm = event.target.closest("[data-automation-form]");
  if (automationForm) {
    event.preventDefault();
    const formData = new FormData(automationForm);
    state.automationRules.unshift({
      id: `auto_${Date.now()}`,
      name: String(formData.get("name") || "Untitled automation"),
      trigger: String(formData.get("trigger") || "content_created"),
      action: String(formData.get("action") || "move_to_review"),
      status: "active",
      lastRun: "刚刚保存"
    });
    saveState(state);
    showSiteToast("自动化规则已保存");
    return;
  }

  const contentSettingsForm = event.target.closest("[data-content-settings-form]");
  if (contentSettingsForm) {
    event.preventDefault();
    const formData = new FormData(contentSettingsForm);
    state.contentSettings = {
      defaultPlatforms: String(formData.get("defaultPlatforms") || ""),
      defaultFrequency: String(formData.get("defaultFrequency") || ""),
      defaultCta: String(formData.get("defaultCta") || ""),
      defaultStyle: String(formData.get("defaultStyle") || ""),
      reviewRequired: String(formData.get("reviewRequired")) === "true"
    };
    saveState(state);
    showSiteToast("内容运营设置已保存");
    return;
  }

  const homepageForm = event.target.closest("[data-admin-homepage-form]");
  if (homepageForm) {
    event.preventDefault();
    const formData = new FormData(homepageForm);
    const button = homepageForm.querySelector("button[type='submit']");
    const config = readHomepageForm(formData);
    await runAdminAction(button, "update-homepage-config", {
      config,
      reason: String(formData.get("reason") || "").trim()
    });
    return;
  }

  const pageBuilderForm = event.target.closest("[data-admin-page-builder-form]");
  if (pageBuilderForm) {
    event.preventDefault();
    const formData = new FormData(pageBuilderForm);
    const button = pageBuilderForm.querySelector("button[type='submit']");
    await runAdminAction(button, "update-page-builder-config", {
      config: readPageBuilderForm(formData),
      reason: String(formData.get("reason") || "").trim()
    });
    return;
  }

  const toolCatalogForm = event.target.closest("[data-admin-tool-catalog-form]");
  if (toolCatalogForm) {
    event.preventDefault();
    const formData = new FormData(toolCatalogForm);
    const button = toolCatalogForm.querySelector("button[type='submit']");
    await runAdminAction(button, "update-tool-catalog-config", {
      config: readToolCatalogForm(formData),
      reason: String(formData.get("reason") || "").trim()
    });
    return;
  }

  const workflowForm = event.target.closest("[data-admin-workflow-form]");
  if (workflowForm) {
    event.preventDefault();
    const formData = new FormData(workflowForm);
    const button = workflowForm.querySelector("button[type='submit']");
    await runAdminAction(button, "update-workflow-center-config", {
      config: readWorkflowForm(formData),
      reason: String(formData.get("reason") || "").trim()
    });
    return;
  }

  const promptForm = event.target.closest("[data-admin-prompt-form]");
  if (promptForm) {
    event.preventDefault();
    const formData = new FormData(promptForm);
    const button = promptForm.querySelector("button[type='submit']");
    await runAdminAction(button, "update-prompt-library-config", {
      config: readPromptForm(formData),
      reason: String(formData.get("reason") || "").trim()
    });
    return;
  }

  const intelligenceForm = event.target.closest("[data-admin-intelligence-form]");
  if (intelligenceForm) {
    event.preventDefault();
    const formData = new FormData(intelligenceForm);
    const button = intelligenceForm.querySelector("button[type='submit']");
    await runAdminAction(button, "update-content-intelligence-config", {
      config: readIntelligenceForm(formData),
      reason: String(formData.get("reason") || "").trim()
    });
    return;
  }

  const agentForm = event.target.closest("[data-admin-agent-form]");
  if (agentForm) {
    event.preventDefault();
    const formData = new FormData(agentForm);
    const button = agentForm.querySelector("button[type='submit']");
    await runAdminAction(button, "update-agent-center-config", {
      config: readAgentForm(formData),
      reason: String(formData.get("reason") || "").trim()
    });
    return;
  }

  const creditForm = event.target.closest("[data-admin-credit-form]");
  if (!creditForm) return;
  event.preventDefault();
  const formData = new FormData(creditForm);
  const button = creditForm.querySelector("button[type='submit']");
  await runAdminAction(button, "adjust-credits", {
    userId: String(formData.get("userId") || "").trim(),
    amount: Number(formData.get("amount")),
    reason: String(formData.get("reason") || "").trim()
  });
  creditForm.reset();
});

async function runAdminAction(button, action, body) {
  if (!supabase) {
    showSiteToast("Supabase 未配置，无法执行后台操作");
    return;
  }
  const original = button?.textContent || "提交";
  if (button) button.textContent = "处理中...";
  try {
    await invokeAdmin(action, body);
    adminLoaded = false;
    adminData = null;
    await loadAdminConsole();
    showSiteToast("后台操作已完成，并已写入审计日志");
  } catch (error) {
    showSiteToast(error.message || "后台操作失败");
  } finally {
    if (button) button.textContent = original;
  }
}

function openSupportWidget() {
  document.querySelector(".support-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "support-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "帮助中心");
  overlay.innerHTML = `
    <div class="support-card">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <span class="support-avatar">OVS</span>
      <h2>需要帮助？</h2>
      <p>这里是 Open Video Studio 的快速帮助入口。真实客服系统接入前，先提供常用路径。</p>
      <div class="support-links">
        <a href="./zh/app/image-editor/">打开图片工具</a>
        <a href="./zh/app/image-to-video/">打开视频工具</a>
        <a href="./zh/pricing/">查看积分套餐</a>
        <a href="./zh/free-coins/">领取免费硬币</a>
        <a href="mailto:support@openvideostudio.app">联系支持</a>
      </div>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

function openAuthModal(nextUrl = "./zh/dashboard/") {
  document.querySelector(".auth-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "auth-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "登录 Open Video Studio");
  overlay.innerHTML = `
    <div class="login-modal-card auth-popup-card">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <h1>登录到 Open Video Studio</h1>
      <p class="muted">使用社交账号继续创作。登录后可以保存作品、领取免费积分、购买积分并管理分享链接。</p>
      <div class="modal-auth-list">
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="google" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot google-dot">G</span>使用 Google 登录 <b>→</b></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="twitter" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot x-dot">X</span>使用 X 登录 <b>→</b></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="telegram" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot tg-dot">TG</span>使用 Telegram 登录 <b>→</b></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="discord" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot dc-dot">DC</span>使用 Discord 登录 <b>→</b></button>
      </div>
      <p class="auth-message" data-auth-message>配置 Supabase OAuth 后，Google / X / Discord 会进行真实登录；Telegram 需要配置 Bot 和回调校验。</p>
      <p class="login-terms">继续即表示你同意我们的 <a href="./zh/terms/">服务条款</a> 和 <a href="./zh/privacy/">隐私政策</a>。</p>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

async function startSocialAuth(provider, nextUrl = "./zh/dashboard/") {
  const message = document.querySelector(".auth-overlay [data-auth-message]") || document.querySelector("[data-auth-message]");
  const setMessage = (text, tone = "error") => {
    if (!message) return;
    message.textContent = text;
    message.dataset.tone = tone;
  };
  if (provider === "telegram") {
    if (!telegramBotUsername || !telegramAuthUrl) {
      setMessage("Telegram 登录需要先配置 VITE_TELEGRAM_BOT_USERNAME 和 VITE_TELEGRAM_AUTH_URL。");
      return;
    }
    setMessage("请使用独立登录页完成 Telegram Widget 授权。", "success");
    window.location.href = "./zh/login/";
    return;
  }
  if (!supabase) {
    setMessage("Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可启用真实社交登录。");
    return;
  }
  const redirectTo = new URL(nextUrl, window.location.href).href;
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) setMessage(error.message);
}

function runToolDemoGeneration() {
  const status = document.querySelector("[data-tool-demo-status]");
  const preview = document.querySelector("[data-tool-demo-preview]");
  const prompt = document.querySelector("[data-tool-prompt]")?.value.trim() || "AI 工具演示生成";
  const cost = 8;
  if (state.credits < cost) {
    if (status) status.innerHTML = `<strong>积分不足</strong><span>请先购买积分后继续生成。</span>`;
    return;
  }
  state.credits -= cost;
  const id = `asset_${Date.now()}`;
  const toolName = document.querySelector(".tool-detail-copy h1")?.textContent?.trim() || "AI 工具";
  const asset = { id, type: "image", title: `${toolName} 演示结果`, prompt, character: "Mira", credits: cost, status: "completed", visibility: "private", favorite: false };
  const job = { id: `job_${Date.now()}`, type: "image", title: asset.title, prompt, provider: "local_api", model: "local-tool-demo-v0", status: "completed", credits: cost, duration: "9s", assetId: id };
  state.assets.unshift(asset);
  state.history.unshift(job);
  saveState(state);
  if (preview) {
    preview.classList.remove("art-7");
    preview.classList.add("art-3");
  }
  if (status) {
    status.innerHTML = `<strong>已生成演示结果</strong><span>消耗 ${cost} 积分，已保存到资产库和生成历史。</span><a href="./zh/assets/">查看资产</a>`;
  }
}

document.querySelectorAll(".tool-poster.locked").forEach((card) => {
  card.addEventListener("click", (event) => {
    if (state.user) return;
    event.preventDefault();
    openUnlockModal(card.getAttribute("href") || "./zh/app/generate/");
  });
});

function stopAdminControlEvent(event) {
  if (!document.body.classList.contains("admin-shell-body")) return;
  if (!event.target.closest(".admin-config-page input, .admin-config-page select, .admin-config-page textarea, .admin-config-card input, .admin-config-card select, .admin-config-card textarea")) return;
  event.stopImmediatePropagation();
}

document.addEventListener("pointerdown", stopAdminControlEvent);
document.addEventListener("mousedown", stopAdminControlEvent);
document.addEventListener("click", stopAdminControlEvent);

function openUnlockModal(nextUrl = "./zh/app/generate/") {
  document.querySelector(".unlock-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "unlock-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "登录解锁工具");
  overlay.innerHTML = `
    <div class="unlock-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <h2>登录后解锁此工具</h2>
      <p>保存生成结果、复用资产、管理积分，并继续打开这个创作工具。</p>
      <div class="unlock-auth-list">
        <button type="button" data-unlock-auth="google" data-modal-auth-provider="google" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot google-dot">G</span>使用 Google 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="twitter" data-modal-auth-provider="twitter" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot x-dot">X</span>使用 X 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="telegram" data-modal-auth-provider="telegram" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot tg-dot">TG</span>使用 Telegram 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="discord" data-modal-auth-provider="discord" data-next-url="${escapeHtml(nextUrl)}"><span class="provider-dot dc-dot">DC</span>使用 Discord 登录 <b>→</b></button>
      </div>
      <p class="auth-message" data-auth-message>选择一个账号继续。真实登录需要先配置 Supabase OAuth。</p>
      <a class="btn primary full" href="./zh/pricing/">查看积分套餐</a>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

function openCheckInModal() {
  document.querySelector(".checkin-overlay")?.remove();
  const signedIn = Boolean(state.user);
  const today = new Date().toISOString().slice(0, 10);
  const alreadyChecked = state.rewards.lastCheckInDate === today;
  const day = Math.min(state.rewards.checkInDay || 0, 6);
  const rewards = [5, 6, 12, 6, 8, 8, 20];
  const overlay = document.createElement("section");
  overlay.className = "checkin-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "每日签到");
  overlay.innerHTML = `
    <div class="checkin-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <div class="checkin-gift" aria-hidden="true">🎁</div>
      <h2>${signedIn ? alreadyChecked ? "今日签到已完成" : "今日签到奖励已准备好" : "登录即可立即获得 10 免费积分"}</h2>
      <p>连续签到 7 天最多可获得 <strong>65 积分</strong></p>
      <div class="checkin-status">
        <span>Day ${signedIn ? String(day + 1) : "0"} of 7</span>
        <span><b data-credit-balance>${state.credits}</b></span>
      </div>
      <div class="checkin-days">
        ${rewards.map((value, index) => `
          <article class="${index < day || alreadyChecked && index === day ? "claimed" : index === day ? "active" : ""}">
            ${index === 2 ? "<i>2x</i>" : ""}
            ${index === 6 ? "<i>3x</i>" : ""}
            <strong>+${value}</strong>
            <span>Day ${index + 1}</span>
          </article>
        `).join("")}
      </div>
      <button class="btn primary full checkin-action" type="button">${signedIn ? alreadyChecked ? "今天已领取" : `领取 +${rewards[day]} 积分` : "登录开始签到 →"}</button>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.querySelector(".checkin-action")?.addEventListener("click", () => {
    if (!state.user) {
      overlay.remove();
      openAuthModal("./zh/free-coins/");
      return;
    }
    if (state.rewards.lastCheckInDate === today) {
      overlay.querySelector(".checkin-action").textContent = "今天已领取";
      return;
    }
    const currentDay = Math.min(state.rewards.checkInDay || 0, 6);
    const reward = rewards[currentDay];
    state.credits += reward;
    state.rewards.checkInDay = currentDay === 6 ? 0 : currentDay + 1;
    state.rewards.lastCheckInDate = today;
    saveState(state);
    renderReferral(state);
    overlay.querySelector(".checkin-action").textContent = `已领取 ${reward} 积分`;
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
    window.location.href = "./zh/dashboard/";
  });
});

document.querySelectorAll("[data-buy-credits]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const credits = Number(button.dataset.buyCredits || "0");
    const planName = button.dataset.planName || button.textContent.trim() || "积分套餐";
    const price = button.querySelector("strong")?.textContent?.trim() || button.dataset.planPrice || "演示结账";
    openCheckoutModal({ credits, planName, price });
  });
});

document.querySelectorAll("[data-payment-method]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-payment-method]").forEach((item) => {
      item.classList.remove("active");
      item.textContent = item.dataset.label || item.textContent.replace("（已选择）", "");
    });
    button.classList.add("active");
    button.textContent = `${button.dataset.label}（已选择）`;
  });
});

document.querySelector("[data-copy-referral]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const link = document.querySelector("[data-referral-link]")?.value || "https://openvideostudio.app/?ref=creator-demo";
  try {
    await navigator.clipboard?.writeText(link);
    state.rewards.referralCopies = (state.rewards.referralCopies || 0) + 1;
    saveState(state);
    button.textContent = "已复制";
  } catch {
    button.textContent = "复制链接";
  }
});

document.querySelectorAll("[data-claim-task]").forEach((button) => {
  button.addEventListener("click", () => {
    ensureUser("email");
    const task = button.dataset.claimTask || "task";
    if (state.rewards.taskClaims.includes(task)) {
      button.textContent = "已领取";
      return;
    }
    const credits = Number(button.dataset.taskCredits || "0");
    state.credits += credits;
    state.rewards.taskClaims.push(task);
    saveState(state);
    button.textContent = `已领取 ${credits} 积分`;
  });
});

if (document.body.classList.contains("pricing-page") || document.querySelector(".pricing-page")) {
  window.setTimeout(openCreditOfferModal, 450);
}

function openCreditOfferModal() {
  if (sessionStorage.getItem("ovs-credit-offer-dismissed") === "true") return;
  document.querySelector(".credit-offer-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "credit-offer-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "限时积分优惠");
  overlay.innerHTML = `
    <div class="credit-offer-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <span class="offer-pill">⚡ 限时优惠</span>
      <h2>等等！现在可获得 <strong>2x 积分加赠</strong></h2>
      <p>当前创作者专属奖励，只在本次访问期间展示。</p>
      <div class="offer-compare">
        <div><span>原套餐</span><del>1000 积分</del><b>$29.99</b></div>
        <div class="active"><span>加赠后</span><strong>1600 积分</strong><b>$29.99</b></div>
      </div>
      <small>结账时使用优惠码</small>
      <button class="promo-code" type="button" data-copy-promo><span>WELCOME_SALE</span><em>复制</em></button>
      <div class="offer-timer">优惠倒计时 <b data-offer-countdown>29:51</b></div>
      <button class="btn primary full" type="button" data-offer-claim data-buy-credits="1600">领取我的 2x 积分</button>
      <button class="offer-skip" type="button">不用了，暂时跳过</button>
    </div>
  `;
  document.body.append(overlay);
  const close = () => {
    sessionStorage.setItem("ovs-credit-offer-dismissed", "true");
    overlay.remove();
  };
  overlay.querySelector(".checkin-close")?.addEventListener("click", close);
  overlay.querySelector(".offer-skip")?.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelector("[data-copy-promo]")?.addEventListener("click", async (event) => {
    try {
      await navigator.clipboard?.writeText("WELCOME_SALE");
      event.currentTarget.querySelector("em").textContent = "已复制";
    } catch {
      event.currentTarget.querySelector("em").textContent = "复制";
    }
  });
  overlay.querySelector("[data-offer-claim]")?.addEventListener("click", () => {
    close();
    openCheckoutModal({ credits: 1600, planName: "2x 加赠创作者包", price: "$29.99", promo: "WELCOME_SALE" });
  });
}

function openCheckoutModal({ credits, planName, price, promo = "" }) {
  document.querySelector(".checkout-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "checkout-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "积分结账");
  const signedIn = Boolean(state.user);
  overlay.innerHTML = `
    <div class="checkout-modal">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <p class="eyebrow">Checkout</p>
      <h2>确认购买 ${escapeHtml(planName)}</h2>
      <div class="checkout-summary">
        <div><span>套餐</span><strong>${escapeHtml(planName)}</strong></div>
        <div><span>积分</span><strong>${credits}</strong></div>
        <div><span>价格</span><strong>${escapeHtml(price)}</strong></div>
        <div><span>账户</span><strong>${signedIn ? escapeHtml(state.user.name) : "访客结账"}</strong></div>
      </div>
      <label class="checkout-promo">
        <span>优惠码</span>
        <input value="${escapeHtml(promo)}" placeholder="WELCOME_SALE" data-checkout-promo>
      </label>
      <div class="checkout-methods" aria-label="Payment methods">
        <button class="active" type="button" data-checkout-method="paypal">PayPal</button>
        <button type="button" data-checkout-method="cashapp">Cash App</button>
        <button type="button" data-checkout-method="applepay">Apple Pay</button>
        <button type="button" data-checkout-method="venmo">Venmo</button>
      </div>
      <p class="checkout-note">${signedIn ? "这是演示结账：不会调用真实支付接口，确认后积分会进入本地余额。" : "登录后可同步账户积分。当前演示模式会先创建本地创作者账户。"}</p>
      <div class="checkout-actions">
        <button class="btn primary full" type="button" data-confirm-checkout>确认并发放演示积分</button>
        <a class="btn glass full" href="./zh/login/">登录账户</a>
      </div>
    </div>
  `;
  document.body.append(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".checkin-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  overlay.querySelectorAll("[data-checkout-method]").forEach((button) => {
    button.addEventListener("click", () => {
      overlay.querySelectorAll("[data-checkout-method]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
    });
  });
  overlay.querySelector("[data-confirm-checkout]")?.addEventListener("click", async () => {
    const confirmButton = overlay.querySelector("[data-confirm-checkout]");
    const method = overlay.querySelector("[data-checkout-method].active")?.dataset.checkoutMethod || "paypal";
    confirmButton.disabled = true;
    confirmButton.textContent = "正在发放积分";
    try {
      const remoteOrder = await runRemoteDemoCreditPurchase({
        credits,
        method,
        amountCents: parsePriceToCents(price)
      });
      if (remoteOrder) {
        state.orders = [mapRemoteOrder(remoteOrder), ...(state.orders || []).filter((order) => order.id !== remoteOrder.id)];
        state.rewards.taskClaims = Array.from(new Set([...state.rewards.taskClaims, "purchase"]));
        await syncRemoteProductData();
        saveState(state);
        confirmButton.textContent = `已到账 ${credits} 积分`;
        overlay.querySelector(".checkout-note").textContent = "演示订单已写入 Supabase，真实支付 API 接入前不会产生扣款。";
        window.setTimeout(() => {
          window.location.href = "./zh/dashboard/";
        }, 650);
        return;
      }
    } catch (error) {
      overlay.querySelector(".checkout-note").textContent = `${error.message || "服务端演示结账暂不可用"}，已切回本地演示。`;
    } finally {
      confirmButton.disabled = false;
    }
    ensureUser("checkout");
    state.credits += credits;
    state.orders = [
      {
        id: `order_${Date.now()}`,
        planName,
        credits,
        price,
        method,
        status: "fulfilled",
        createdAt: new Date().toISOString().slice(0, 10)
      },
      ...(state.orders || [])
    ];
    state.rewards.taskClaims = Array.from(new Set([...state.rewards.taskClaims, "purchase"]));
    saveState(state);
    overlay.querySelector("[data-confirm-checkout]").textContent = `已到账 ${credits} 积分`;
    overlay.querySelector(".checkout-note").textContent = "演示积分已进入余额。真实支付 API 接入前不会产生扣款。";
    window.setTimeout(() => {
      window.location.href = "./zh/dashboard/";
    }, 650);
  });
}

async function runRemoteDemoCreditPurchase(input) {
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) return null;
  const result = await invokeAi("demo-credit-purchase", {
    credits: input.credits,
    amountCents: input.amountCents,
    currency: "USD",
    method: input.method
  });
  return result.order || null;
}

function parsePriceToCents(value) {
  const match = String(value || "").match(/([0-9]+(?:\.[0-9]{1,2})?)/);
  return match ? Math.round(Number(match[1]) * 100) : 0;
}

function mapRemoteOrder(order) {
  return {
    id: String(order.id),
    planName: "积分套餐",
    credits: Number(order.credits_granted || 0),
    price: `${order.currency || "USD"} ${(Number(order.amount_cents || 0) / 100).toFixed(2)}`,
    method: String(order.provider_reference || "demo_checkout"),
    status: String(order.status || "fulfilled"),
    createdAt: String(order.created_at || new Date().toISOString()).slice(0, 10),
    remote: true
  };
}

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
  enhanceButton.addEventListener("click", async () => {
    const original = promptBox.value.trim();
    if (supabase && original) {
      enhanceButton.disabled = true;
      enhanceButton.textContent = "增强中";
      try {
        const enhanced = await invokeAi("enhance-prompt", {
          prompt: original,
          context: { page: "generate", locale: getStoredLanguage() }
        });
        promptBox.value = enhanced.enhancedPrompt || enhanced.prompt || original;
        showSiteToast(enhanced.fallback ? "已使用本地提示词增强" : "已使用 DeepSeek 增强提示词");
      } catch (error) {
        showSiteToast(`${error.message || "提示词增强失败"}，已保留原提示词。`);
      } finally {
        enhanceButton.disabled = false;
        enhanceButton.textContent = "优化提示词";
      }
      return;
    }
    if (!promptBox.value.includes("ultra-detailed")) {
      promptBox.value = `${original} ultra-detailed, cinematic composition, reusable reference metadata`;
    }
  });
}

if (generateButton && queueTarget) {
  generateButton.addEventListener("click", async () => {
    const activeMode = document.querySelector("[data-mode].active")?.dataset.mode || "image";
    const cost = modeCosts[activeMode] || 8;
    const title = activeMode === "video" ? "生成视频场景" : activeMode === "character" ? "生成角色种子" : "生成图片作品";
    const prompt = promptBox?.value.trim() || "生成 AI 场景";
    const character = document.querySelector(".selector-grid select")?.value?.split(" - ")[0] || "Mira";
    generateButton.disabled = true;
    generateButton.textContent = "生成中";
    try {
      const remoteResult = await runRemoteGeneration({
        mode: activeMode,
        prompt,
        title,
        character,
        cost
      });
      if (remoteResult) {
        queueTarget.prepend(statusRow(`${title}已完成`, "真实任务已保存到 Supabase 资产库和生成历史。", "./zh/assets/", "打开作品"));
        return;
      }
    } catch (error) {
      queueTarget.prepend(statusRow("真实生成暂不可用", `${error.message || "已切回本地演示生成。"} 未重复扣除远端积分。`, "./zh/admin/", "检查后台"));
    } finally {
      generateButton.disabled = false;
      generateButton.textContent = "生成";
    }

    ensureUser("email");
    if (state.credits < cost) {
    queueTarget.prepend(statusRow("积分不足", "请先购买积分再生成这个作品。", "./zh/pricing/", "购买积分"));
      return;
    }
    state.credits -= cost;
    const id = `asset_${Date.now()}`;
    const asset = { id, type: activeMode === "video" ? "video" : "image", title, prompt, character, credits: cost, status: "completed", visibility: "private", favorite: false };
    const job = { id: `job_${Date.now()}`, type: asset.type, title, prompt, provider: "local_api", model: activeMode === "video" ? "local-video-v0" : "local-image-v0", status: "completed", credits: cost, duration: activeMode === "video" ? "8s" : "12s", assetId: id };
    state.assets.unshift(asset);
    state.history.unshift(job);
    saveState(state);
    queueTarget.prepend(statusRow(`${title}已完成`, "已保存到资产库和生成历史。", "./zh/assets/", "打开作品"));
  });
}

async function runRemoteGeneration(input) {
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    openUnlockModal("./zh/app/generate/");
    throw new Error("请先登录后使用真实生成。");
  }
  const mediaType = input.mode === "video" ? "video" : "image";
  const workflowId = mediaType === "video" ? "workflow-qianwen-video-v1" : "workflow-qianwen-image-v1";
  const createResult = await invokeAi("create-generation-job", {
    mediaType,
    prompt: input.prompt,
    workflowId,
    toolSlug: mediaType === "video" ? "image-to-video" : "generate",
    durationSeconds: mediaType === "video" ? 6 : undefined
  });
  const job = createResult.job;
  const processed = await invokeAi("process-generation-job", { jobId: job.id });
  if (processed.error) {
    throw new Error(processed.error.message || "AI 生成失败，积分已自动退回。");
  }
  mergeRemoteGenerationResult(processed.job, processed.asset, input);
  await syncRemoteProductData();
  return processed;
}

async function invokeAi(action, body = {}) {
  const { data, error } = await supabase.functions.invoke("ai", { body: { action, ...body } });
  if (error) throw new Error(error.message || "AI 服务调用失败。");
  if (data?.error) throw new Error(data.error.message || data.error.code || "AI 服务调用失败。");
  return data;
}

function mergeRemoteGenerationResult(job, asset, input = {}) {
  if (!job || !asset) return;
  const assetId = String(asset.id || job.result_asset_id || `asset_${Date.now()}`);
  const mediaType = String(asset.asset_type || job.media_type || input.mode || "image");
  const mappedAsset = {
    id: assetId,
    type: mediaType === "video" ? "video" : "image",
    title: String(asset.display_name || input.title || "生成作品"),
    prompt: String(job.prompt || input.prompt || ""),
    character: input.character || "Mira",
    credits: Number(job.cost_credits || input.cost || 0),
    status: String(job.status || "completed"),
    visibility: String(asset.visibility_status || "private"),
    favorite: Boolean(asset.is_favorite),
    remote: true
  };
  const mappedJob = {
    id: String(job.id || `job_${Date.now()}`),
    type: mappedAsset.type,
    title: mappedAsset.title,
    prompt: mappedAsset.prompt,
    provider: String(job.provider || "fake_worker"),
    model: String(job.model || "local-demo"),
    status: String(job.status || "completed"),
    credits: mappedAsset.credits,
    duration: job.latency ? `${Math.round(Number(job.latency) / 1000)}s` : "实时",
    assetId
  };
  upsertById(state.assets, mappedAsset);
  upsertById(state.history, mappedJob);
  saveState(state);
}

function upsertById(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index >= 0) {
    list[index] = { ...list[index], ...item };
  } else {
    list.unshift(item);
  }
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
      score: 84,
      status: "active",
      favorite: false,
      memory: String(form.get("memory") || "保持角色外观、语气、镜头和品牌视觉一致。")
    });
    selectedCharacterId = state.characters[0].id;
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

let characterFilter = "all";
let characterSearch = "";

function renderCharacters(current) {
  const target = document.querySelector("[data-character-list]");
  document.querySelectorAll("[data-character-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.characterFilter === characterFilter);
  });
  if (target) {
    const characters = current.characters.filter((character) => {
      const matchesFilter =
        characterFilter === "all" ||
        character.status === characterFilter ||
        (characterFilter === "favorite" && character.favorite);
      const haystack = `${character.name} ${character.role} ${character.tags.join(" ")} ${character.memory}`.toLowerCase();
      return matchesFilter && (!characterSearch || haystack.includes(characterSearch));
    });
    target.innerHTML = characters.map((character, index) => `
    <article class="character-card large ${["art-2", "art-11", "art-12"][index % 3]} ${character.id === selectedCharacterId ? "selected" : ""}" data-character-card="${character.id}">
      <span>${character.status === "active" ? "可生成" : "草稿"} ${character.favorite ? "· 收藏" : ""}</span>
      <strong>${escapeHtml(character.name)}</strong>
      <span>${escapeHtml(character.role)} - 一致性 ${character.score}%</span>
      <p>标签：${character.tags.map(escapeHtml).join(", ")}</p>
      <div class="row-actions"><button type="button" data-use-character="${character.id}">使用角色</button><button type="button" data-copy-character="${character.id}">复制设定</button></div>
    </article>
  `).join("");
  }
  renderCharacterProfile(current);
}

function renderCharacterProfile(current) {
  const profile = document.querySelector("[data-character-profile]");
  if (!profile) return;
  const character = current.characters.find((item) => item.id === selectedCharacterId) || current.characters[0];
  if (!character) return;
  const relatedAssets = current.assets.filter((asset) => asset.character === character.name).slice(0, 3);
  profile.querySelector(".eyebrow").textContent = character.status === "active" ? "角色预览" : "草稿角色";
  profile.querySelector(".avatar").className = `avatar ${character.favorite ? "art-12" : "art-2"}`;
  profile.querySelector("h2").textContent = `${character.name} ${character.role}`;
  profile.querySelector(".muted").textContent = character.memory || "保持角色外观、语气、镜头和品牌视觉一致。";
  profile.querySelector(".score").innerHTML = `一致性评分 <strong>${character.score}%</strong>`;
  profile.querySelector(".character-action-row").innerHTML = `<button class="btn primary" type="button" data-use-character="${character.id}">使用角色生成</button><button class="btn glass" type="button" data-copy-character="${character.id}">复制角色提示词</button>`;
  profile.querySelector(".mini-assets").innerHTML = relatedAssets.length
    ? relatedAssets.map((asset, index) => `<span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>`).join("")
    : `<span class="thumb art-3"></span><span class="thumb art-7"></span><span class="thumb art-8"></span>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderAssets(current) {
  const targets = document.querySelectorAll("[data-asset-list]");
  targets.forEach((target) => {
    target.innerHTML = current.assets.map((asset, index) => `
      <article class="library-card" data-asset data-asset-kind="${asset.type === "video" ? "视频" : "图片"}" data-asset-favorite="${asset.favorite ? "收藏" : ""}">
        <span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>
        <div><h3>${escapeHtml(asset.title)}</h3><p>${asset.type === "video" ? "视频" : "图片"} - ${asset.visibility === "public" ? "公开" : "私密"} - 角色 ${escapeHtml(asset.character)}</p></div>
        <button data-share-asset="${asset.id}">分享</button>
      </article>
    `).join("");
  });
}

function renderHistory(current) {
  const target = document.querySelector("[data-history-list]");
  if (!target) return;
  target.innerHTML = current.history.map((job) => `
    <article class="history-row">
      <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
      <div><h3>${escapeHtml(job.title)}</h3><p>提示词：${escapeHtml(job.prompt)}</p><small>服务商 ${escapeHtml(job.provider)} - 模型 ${escapeHtml(job.model)} - ${job.status === "completed" ? "已完成" : escapeHtml(job.status)} - ${job.credits} 积分 - ${escapeHtml(job.duration)}</small></div>
      <div class="row-actions"><button data-retry-job="${job.id}">重试</button><button data-share-asset="${job.assetId}">分享</button></div>
    </article>
  `).join("");
}

let creationFilter = "all";
let creationSearch = "";

function renderCreations(current) {
  const list = document.querySelector("[data-creation-list]");
  const historyList = document.querySelector("[data-creation-history]");
  const stats = {
    count: document.querySelector("[data-creation-count]"),
    shares: document.querySelector("[data-creation-shares]"),
    favorites: document.querySelector("[data-creation-favorites]"),
    jobs: document.querySelector("[data-creation-jobs]")
  };
  if (stats.count) stats.count.textContent = String(current.assets.length);
  if (stats.shares) stats.shares.textContent = String(current.shares.length);
  if (stats.favorites) stats.favorites.textContent = String(current.assets.filter((asset) => asset.favorite).length);
  if (stats.jobs) stats.jobs.textContent = String(current.history.length);

  document.querySelectorAll("[data-creation-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.creationFilter === creationFilter);
  });

  if (list) {
    const filteredAssets = current.assets.filter((asset) => {
      const matchesFilter =
        creationFilter === "all" ||
        asset.type === creationFilter ||
        (creationFilter === "favorite" && asset.favorite) ||
        asset.visibility === creationFilter;
      const haystack = `${asset.title} ${asset.prompt} ${asset.character} ${asset.type} ${asset.status} ${asset.visibility}`.toLowerCase();
      return matchesFilter && (!creationSearch || haystack.includes(creationSearch));
    });
    list.innerHTML = filteredAssets.length ? filteredAssets.map((asset, index) => `
      <article class="creation-work-card" data-asset>
        <span class="creation-work-thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10", "art-12"][index % 4]}"></span>
        <div class="creation-work-body">
          <div class="creation-work-meta"><span>${asset.type === "video" ? "视频" : "图片"}</span><span>${asset.visibility === "public" ? "公开" : "私密"}</span>${asset.favorite ? "<span>收藏</span>" : ""}</div>
          <h3>${escapeHtml(asset.title)}</h3>
          <p>${escapeHtml(asset.prompt)}</p>
          <small>角色 ${escapeHtml(asset.character)} · ${asset.credits} 积分 · ${asset.status === "completed" ? "已完成" : escapeHtml(asset.status)}</small>
          <div class="row-actions">
            <button data-share-asset="${asset.id}">分享</button>
            <button data-copy-asset-prompt="${asset.id}">复制提示词</button>
            <button data-retry-asset="${asset.id}">重新生成</button>
          </div>
        </div>
      </article>
    `).join("") : `
      <article class="empty-state creation-empty">
        <div><p class="eyebrow">没有匹配作品</p><h2>换个关键词，或生成一个新作品</h2><p class="muted">生成结果会自动进入这里，方便继续复用、分享和转视频。</p></div>
        <a class="btn primary" href="./zh/app/generate/">开始生成</a>
      </article>
    `;
  }

  if (historyList) {
    historyList.innerHTML = current.history.slice(0, 5).map((job) => `
      <article class="creation-job-row">
        <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
        <div>
          <strong>${escapeHtml(job.title)}</strong>
          <p>${escapeHtml(job.prompt)}</p>
          <small>${escapeHtml(job.provider)} · ${escapeHtml(job.model)} · ${job.credits} 积分 · ${escapeHtml(job.duration)}</small>
        </div>
        <button data-retry-job="${job.id}">重试</button>
      </article>
    `).join("");
  }
}

async function createShare(assetId) {
  const asset = state.assets.find((item) => item.id === assetId);
  if (!asset) return;
  if (supabase && asset.remote) {
    try {
      const result = await invokeAi("create-share-link", { assetId });
      const remoteShare = result.share;
      if (remoteShare?.token) {
        asset.visibility = "public";
        const share = {
          id: String(remoteShare.id),
          token: String(remoteShare.token),
          assetId: String(remoteShare.media_asset_id || asset.id),
          title: asset.title,
          remote: true
        };
        upsertById(state.shares, share);
        saveState(state);
        window.location.href = `./zh/share/?token=${encodeURIComponent(share.token)}`;
        return;
      }
    } catch (error) {
      showSiteToast(`${error.message || "分享链接创建失败"}，已切回本地演示分享。`);
    }
  }
  asset.visibility = "public";
  const share = { id: `share_${Date.now()}`, token: `share-${Date.now()}`, assetId: asset.id, title: asset.title };
  state.shares.unshift(share);
  saveState(state);
  window.location.href = `./zh/share/?token=${share.token}`;
}

function renderDashboard(current) {
  const stats = {
    credits: document.querySelector("[data-dashboard-credits]"),
    jobs: document.querySelector("[data-dashboard-jobs]"),
    assets: document.querySelector("[data-dashboard-assets]"),
    shares: document.querySelector("[data-dashboard-shares]"),
    campaigns: document.querySelector("[data-dashboard-campaigns]"),
    pipeline: document.querySelector("[data-dashboard-pipeline]"),
    scheduled: document.querySelector("[data-dashboard-scheduled]"),
    failed: document.querySelector("[data-dashboard-failed]"),
    volume: document.querySelector("[data-dashboard-volume]"),
    traffic: document.querySelector("[data-dashboard-traffic]")
  };
  if (stats.credits) stats.credits.textContent = String(current.credits);
  if (stats.jobs) stats.jobs.textContent = String(current.history.length);
  if (stats.assets) stats.assets.textContent = String(current.assets.length);
  if (stats.shares) stats.shares.textContent = String(current.shares.length);
  if (stats.campaigns) stats.campaigns.textContent = String(current.campaigns.filter((campaign) => campaign.status === "active").length);
  if (stats.pipeline) stats.pipeline.textContent = String(current.contentItems.filter((item) => !["published", "analyzed"].includes(item.stage)).length);
  if (stats.scheduled) stats.scheduled.textContent = String(current.contentQueue.filter((item) => item.status === "scheduled").length);
  if (stats.failed) stats.failed.textContent = String(current.contentQueue.filter((item) => item.status === "failed").length);
  if (stats.volume) stats.volume.textContent = String(current.contentItems.length);
  if (stats.traffic) stats.traffic.textContent = String(current.contentAnalytics.reduce((total, row) => total + Number(row.clicks || 0), 0));

  const recent = document.querySelector("[data-dashboard-recent]");
  if (recent) {
    recent.innerHTML = current.history.slice(0, 4).map((job) => `
      <article class="dashboard-row">
        <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
        <div><strong>${escapeHtml(job.title)}</strong><p>${job.status === "completed" ? "已完成" : escapeHtml(job.status)} · ${job.credits} 积分</p></div>
        <button type="button" data-retry-job="${job.id}">重试</button>
      </article>
    `).join("");
  }

  const characters = document.querySelector("[data-dashboard-characters]");
  if (characters) {
    characters.innerHTML = current.characters.slice(0, 4).map((character, index) => `
      <article class="dashboard-row">
        <span class="thumb ${["art-2", "art-11", "art-12"][index % 3]}"></span>
        <div><strong>${escapeHtml(character.name)}</strong><p>${escapeHtml(character.role)} · ${character.score}%</p></div>
        <button type="button" data-use-character="${character.id}">使用</button>
      </article>
    `).join("");
  }

  const shareList = document.querySelector("[data-dashboard-shares-list]");
  if (shareList) {
    shareList.innerHTML = current.shares.slice(0, 4).map((share) => `
      <article class="dashboard-row">
        <span class="thumb art-9"></span>
        <div><strong>${escapeHtml(share.title || "分享作品")}</strong><p>公开链接</p></div>
        <a href="./zh/share/?token=${encodeURIComponent(share.token)}">打开</a>
      </article>
    `).join("");
  }

  const topContent = document.querySelector("[data-dashboard-top-content]");
  if (topContent) {
    topContent.innerHTML = current.contentAnalytics
      .slice()
      .sort((a, b) => Number(b.views || 0) - Number(a.views || 0))
      .slice(0, 4)
      .map((row) => {
        const item = current.contentItems.find((entry) => entry.id === row.contentItemId);
        return `
          <article class="dashboard-row">
            <span class="thumb art-13"></span>
            <div><strong>${escapeHtml(item?.title || "内容表现")}</strong><p>${escapeHtml(row.platform)} · ${row.views} views · ${row.signups} signups</p></div>
            <a href="./zh/analytics/">分析</a>
          </article>
        `;
      }).join("");
  }

  const accountAttention = document.querySelector("[data-dashboard-account-attention]");
  if (accountAttention) {
    const rows = current.socialAccounts.filter((account) => account.status !== "connected");
    accountAttention.innerHTML = rows.length ? rows.map((account) => `
      <article class="dashboard-row">
        <span class="thumb art-9"></span>
        <div><strong>${escapeHtml(account.platform)} ${escapeHtml(account.handle)}</strong><p>${escapeHtml(account.status)} · 需要确认连接状态</p></div>
        <a href="./zh/accounts/">处理</a>
      </article>
    `).join("") : `
      <article class="dashboard-row">
        <span class="thumb art-9"></span>
        <div><strong>发布账号正常</strong><p>${current.socialAccounts.length} 个演示账号可用于排期。</p></div>
        <a href="./zh/accounts/">查看</a>
      </article>
    `;
  }
}

function renderContentOperatingSystem(current) {
  renderCampaignList(current);
  renderCampaignSelect(current);
  renderAiStudioOutput(current);
  renderPipelineBoard(current);
  renderContentQueue(current);
  renderSocialAccounts(current);
  renderContentCalendar(current);
  renderContentAnalytics(current);
  renderPublishingCenter(current);
  renderAutomation(current);
  renderContentSettings(current);
}

function renderCampaignList(current) {
  const target = document.querySelector("[data-campaign-list]");
  if (!target) return;
  target.innerHTML = current.campaigns.length ? current.campaigns.map((campaign) => `
    <article class="content-os-card">
      <div>
        <span>${escapeHtml(goalLabel(campaign.goal))}</span>
        <strong>${escapeHtml(campaign.name)}</strong>
        <p>${escapeHtml(campaign.audience || "尚未设置受众")}</p>
      </div>
      <div class="content-os-meta">
        <small>${escapeHtml(campaign.niche || "通用内容")}</small>
        <small>${escapeHtml(campaign.frequency || "未设置频率")}</small>
        <small>${escapeHtml(campaign.status || "draft")}</small>
      </div>
      <div class="content-chip-row">${(campaign.platforms || []).map((platform) => `<em>${escapeHtml(platform)}</em>`).join("")}</div>
      <div class="character-action-row">
        <a class="btn glass" href="./zh/ai-studio/">生成内容</a>
        <a class="btn glass" href="./zh/pipeline/">查看 Pipeline</a>
      </div>
    </article>
  `).join("") : `<article class="content-os-card"><strong>暂无 Campaign</strong><p>创建第一个 Campaign 后，AI Studio 会围绕它生成内容包。</p></article>`;
}

function renderCampaignSelect(current) {
  const target = document.querySelector("[data-campaign-select]");
  if (!target) return;
  target.innerHTML = current.campaigns.map((campaign) => `<option value="${escapeHtml(campaign.id)}">${escapeHtml(campaign.name)}</option>`).join("");
}

function renderAiStudioOutput(current) {
  const target = document.querySelector("[data-ai-studio-output]");
  if (!target) return;
  const item = current.contentItems[0];
  if (!item) {
    target.innerHTML = `<article><strong>等待生成</strong><p>选择 Campaign 和 Topic 后生成第一份内容包。</p></article>`;
    return;
  }
  target.innerHTML = [
    ["Research", item.research],
    ["Script", item.script],
    ["Prompt", item.prompt],
    ["Image Placeholder", item.imagePlaceholder],
    ["Video Placeholder", item.videoPlaceholder],
    ["Thumbnail", item.thumbnailPlaceholder],
    ["Caption", item.caption],
    ["CTA", item.cta],
    ["Hashtags", (item.hashtags || []).map((tag) => `#${tag}`).join(" ")],
    ["Translation", Object.entries(item.translations || {}).map(([locale, value]) => `${locale}: ${value}`).join(" / ")],
    ["Quality Check", `阶段：${stageLabel(item.stage)} · 审核：${reviewLabel(item.reviewStatus)}`]
  ].map(([label, value]) => `
    <article>
      <span>${escapeHtml(label)}</span>
      <p>${escapeHtml(value || "等待 AI Studio 输出")}</p>
    </article>
  `).join("") + `
    <article class="studio-platform-variants">
      <span>Platform Versions</span>
      <div class="platform-version-list">
        ${(item.variants || []).map((variant) => `
          <section class="platform-version-card">
            <strong>${escapeHtml(variant.platform)}</strong>
            <p>${escapeHtml(variant.caption)}</p>
            <small>${escapeHtml(variant.format)} · ${escapeHtml(reviewLabel(variant.status))} · ${escapeHtml(variant.account || "未选择账号")}</small>
            <em>${(variant.hashtags || []).map((tag) => `#${escapeHtml(tag)}`).join(" ")}</em>
            <b>${escapeHtml(variant.cta || item.cta || "开始创作")}</b>
          </section>
        `).join("")}
      </div>
    </article>
  `;
}

function renderPipelineBoard(current) {
  const target = document.querySelector("[data-pipeline-board]");
  if (!target) return;
  const stages = ["idea", "research", "script", "prompt", "asset", "caption", "review", "scheduled", "published", "analyzed"];
  target.innerHTML = stages.map((stage) => {
    const items = current.contentItems.filter((item) => item.stage === stage);
    return `
      <section class="pipeline-column">
        <h2>${stageLabel(stage)} <span>${items.length}</span></h2>
        ${items.length ? items.map((item) => pipelineCard(item)).join("") : `<p class="pipeline-empty">暂无内容</p>`}
      </section>
    `;
  }).join("");
}

function pipelineCard(item) {
  const next = nextStage(item.stage);
  return `
    <article class="pipeline-card">
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.topic || item.caption || "内容生产中")}</p>
      <div class="content-chip-row">${(item.hashtags || []).slice(0, 3).map((tag) => `<em>#${escapeHtml(tag)}</em>`).join("")}</div>
      ${next ? `<button type="button" data-pipeline-move="${escapeHtml(item.id)}" data-stage="${escapeHtml(next)}">移动到 ${stageLabel(next)}</button>` : `<a href="./zh/queue/">查看队列</a>`}
    </article>
  `;
}

function renderContentQueue(current) {
  const target = document.querySelector("[data-content-queue]");
  if (!target) return;
  document.querySelectorAll("[data-queue-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.queueFilter === queueFilter);
  });
  const rows = current.contentQueue.filter((item) => queueFilter === "all" || item.status === queueFilter);
  target.innerHTML = rows.length ? rows.map((item) => `
    <article class="queue-card">
      <div>
        <span>${escapeHtml(item.platform)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.scheduledAt || "未设置发布时间")}</p>
      </div>
      <em>${escapeHtml(queueStatusLabel(item.status))}</em>
    </article>
  `).join("") : `<article class="queue-card"><strong>当前筛选下暂无内容</strong><p>从 Pipeline 移动到 Scheduled 后会出现在这里。</p></article>`;
}

function createMockContentItem(campaign, topic, character) {
  const platforms = campaign?.platforms?.length ? campaign.platforms : ["X", "TikTok"];
  const caption = `${topic}：用 ${campaign?.name || "Open Video Studio"} 把一个创意变成可复用内容包。${campaign?.cta || "开始创作"}`;
  return {
    id: `content_${Date.now()}`,
    campaignId: campaign?.id || "camp_local",
    title: topic,
    topic,
    stage: "caption",
    reviewStatus: "needs_review",
    character,
    research: `围绕「${topic}」分析受众痛点、视觉钩子、平台节奏和转化 CTA。`,
    script: `Hook：${topic}。Problem：内容生产不能只停在单张图。Solution：生成脚本、提示词、资产、Caption 和平台版本。CTA：${campaign?.cta || "免费开始生成"}。`,
    prompt: `${campaign?.style || "高级 AI 创作平台"}，${character} 展示 ${topic}，电影感光影，竖屏友好，适合社媒发布。`,
    imagePlaceholder: `${topic} 主视觉占位：${character}、品牌场景、可复用资产构图。`,
    videoPlaceholder: `${topic} 视频占位：8 秒竖屏镜头、字幕节奏、开头 2 秒强钩子。`,
    thumbnailPlaceholder: `${topic} 缩略图占位：高对比标题、安全裁切、清晰主体。`,
    caption,
    cta: campaign?.cta || "免费开始生成",
    hashtags: ["AIContent", "OpenVideoStudio", "CreatorTools", "VideoAI"],
    translations: { zh: caption, en: `${topic}: turn one idea into a reusable content package.` },
    variants: platforms.map((platform) => ({
      id: `variant_${platform.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`,
      platform,
      caption: `${caption} · ${platform}`,
      hashtags: ["AIContent", "OpenVideoStudio"],
      cta: campaign?.cta || "免费开始生成",
      status: "needs_review",
      format: platform.toLowerCase().includes("tiktok") || platform.toLowerCase().includes("shorts") ? "vertical_video_9_16" : "image_or_video_with_caption",
      account: ""
    }))
  };
}

function nextStage(stage) {
  const stages = ["idea", "research", "script", "prompt", "asset", "caption", "review", "scheduled", "published", "analyzed"];
  const index = stages.indexOf(stage);
  return index >= 0 && index < stages.length - 1 ? stages[index + 1] : "";
}

function stageLabel(stage) {
  return ({
    idea: "Idea",
    research: "Research",
    script: "Script",
    prompt: "Prompt",
    asset: "Asset",
    caption: "Caption",
    review: "Review",
    scheduled: "Scheduled",
    published: "Published",
    analyzed: "Analyzed"
  })[stage] || stage;
}

function reviewLabel(status) {
  return ({ draft: "草稿", needs_review: "待审核", approved: "已通过", rejected: "已拒绝", scheduled: "已排期", published: "已发布", failed: "失败" })[status] || status;
}

function queueStatusLabel(status) {
  return ({ needs_review: "待审核", scheduled: "已排期", published: "已发布", failed: "失败", today: "今天", tomorrow: "明天", this_week: "本周" })[status] || status;
}

function goalLabel(goal) {
  return ({ traffic: "引流", followers: "涨粉", sales: "销售", leads: "线索", awareness: "品牌认知" })[goal] || goal;
}

function renderSocialAccounts(current) {
  const target = document.querySelector("[data-social-account-list]");
  if (!target) return;
  target.innerHTML = current.socialAccounts.length ? current.socialAccounts.map((account) => `
    <article class="content-os-card">
      <div>
        <span>${escapeHtml(account.platform)}</span>
        <strong>${escapeHtml(account.handle)}</strong>
        <p>${escapeHtml(account.purpose || "发布账号")}</p>
      </div>
      <div class="content-os-meta">
        <small>${account.status === "connected" ? "已连接" : "待确认"}</small>
        <small>真实 OAuth 后续接入</small>
      </div>
    </article>
  `).join("") : `<article class="content-os-card"><strong>暂无连接账号</strong><p>连接演示账号后，Campaign 和 Queue 可以关联发布平台。</p></article>`;
}

function renderContentCalendar(current) {
  const target = document.querySelector("[data-content-calendar]");
  if (!target) return;
  const groups = [
    ["today", "Today"],
    ["tomorrow", "Tomorrow"],
    ["this_week", "This Week"],
    ["scheduled", "Scheduled"],
    ["failed", "Failed"],
    ["published", "Published"]
  ];
  target.innerHTML = groups.map(([key, label]) => {
    const rows = current.contentQueue.filter((item) => key === "scheduled" ? item.status === "scheduled" : item.status === key);
    return `
      <section class="calendar-column">
        <h2>${label}<span>${rows.length}</span></h2>
        ${rows.length ? rows.map((item) => `
          <article class="calendar-card">
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.platform)} · ${escapeHtml(item.scheduledAt || "未设置")}</p>
            <small>${escapeHtml(queueStatusLabel(item.status))}</small>
          </article>
        `).join("") : `<p class="pipeline-empty">暂无排期</p>`}
      </section>
    `;
  }).join("");
}

function renderContentAnalytics(current) {
  const summary = document.querySelector("[data-content-analytics-summary]");
  const list = document.querySelector("[data-content-analytics-list]");
  if (!summary && !list) return;
  const totals = current.contentAnalytics.reduce((acc, row) => {
    acc.views += Number(row.views || 0);
    acc.likes += Number(row.likes || 0);
    acc.shares += Number(row.shares || 0);
    acc.clicks += Number(row.clicks || 0);
    acc.signups += Number(row.signups || 0);
    return acc;
  }, { views: 0, likes: 0, shares: 0, clicks: 0, signups: 0 });
  if (summary) {
    summary.innerHTML = [
      ["Views", totals.views],
      ["Likes", totals.likes],
      ["Shares", totals.shares],
      ["Clicks", totals.clicks],
      ["Signups", totals.signups]
    ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong><p>演示指标</p></article>`).join("");
  }
  if (list) {
    list.innerHTML = current.contentAnalytics.map((row) => {
      const item = current.contentItems.find((entry) => entry.id === row.contentItemId);
      return `
        <article class="content-os-card">
          <div>
            <span>${escapeHtml(row.platform)}</span>
            <strong>${escapeHtml(item?.title || "内容表现")}</strong>
            <p>Views ${row.views} · Likes ${row.likes} · Shares ${row.shares} · Clicks ${row.clicks}</p>
          </div>
          <div class="content-os-meta">
            <small>${row.signups} Signups</small>
            <small>${row.conversionRate}% Conversion</small>
            <small>优化建议占位</small>
          </div>
        </article>
      `;
    }).join("");
  }
}

function renderPublishingCenter(current) {
  const target = document.querySelector("[data-publishing-list]");
  if (!target) return;
  const buttons = document.querySelectorAll("[data-publishing-filter]");
  const active = Array.from(buttons).find((button) => button.classList.contains("active"))?.dataset.publishingFilter || "all";
  buttons.forEach((button) => {
    button.onclick = () => {
      buttons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      renderPublishingCenter(state);
    };
  });
  const rows = current.contentQueue.filter((item) => active === "all" || item.status === active);
  target.innerHTML = rows.length ? rows.map((item) => {
    const account = current.socialAccounts.find((entry) => entry.platform === item.platform);
    return `
      <article class="queue-card">
        <div>
          <span>${escapeHtml(item.platform)} · ${escapeHtml(account?.handle || "未连接账号")}</span>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.scheduledAt || "未设置时间")} · ${escapeHtml(queueStatusLabel(item.status))}</p>
        </div>
        <em>${account?.status === "connected" ? "Ready" : "Needs account"}</em>
      </article>
    `;
  }).join("") : `<article class="queue-card"><strong>暂无发布任务</strong><p>从 Queue 或 Pipeline 排期后会进入发布中心。</p></article>`;
}

function renderAutomation(current) {
  const target = document.querySelector("[data-automation-list]");
  if (!target) return;
  target.innerHTML = current.automationRules.length ? current.automationRules.map((rule) => `
    <article class="content-os-card">
      <div>
        <span>${escapeHtml(rule.status === "active" ? "Active" : "Paused")}</span>
        <strong>${escapeHtml(rule.name)}</strong>
        <p>Trigger: ${escapeHtml(rule.trigger)} · Action: ${escapeHtml(rule.action)}</p>
      </div>
      <div class="content-os-meta">
        <small>${escapeHtml(rule.lastRun)}</small>
        <small>真实执行器后续接入</small>
      </div>
    </article>
  `).join("") : `<article class="content-os-card"><strong>暂无自动化</strong><p>创建规则后会显示在这里。</p></article>`;
}

function renderContentSettings(current) {
  const target = document.querySelector("[data-content-settings-preview]");
  if (!target) return;
  const settings = current.contentSettings || defaultState.contentSettings;
  target.innerHTML = `
    <article class="content-os-card">
      <span>默认平台</span>
      <strong>${escapeHtml(settings.defaultPlatforms)}</strong>
      <p>Campaign 创建时可复用这些平台。</p>
    </article>
    <article class="content-os-card">
      <span>发布频率</span>
      <strong>${escapeHtml(settings.defaultFrequency)}</strong>
      <p>用于 Campaign 和 Calendar 的默认排期。</p>
    </article>
    <article class="content-os-card">
      <span>默认 CTA</span>
      <strong>${escapeHtml(settings.defaultCta)}</strong>
      <p>AI Studio 生成 Caption 时可作为默认转化动作。</p>
    </article>
    <article class="content-os-card">
      <span>发布安全</span>
      <strong>${settings.reviewRequired ? "发布前必须审核" : "允许自动排期"}</strong>
      <p>真实发布适配器接入前仅作为产品状态占位。</p>
    </article>
  `;
}

function renderAdmin(current) {
  if (!document.querySelector("[data-admin-page]")) return;
  renderAdminConfiguration();
  if (!supabase) {
    setAdminAccess("blocked", "Supabase 未配置", "请先配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。后台不会使用本地演示数据冒充真实数据。");
    fillAdminEmptyState();
    return;
  }
  if (!current.user) {
    setAdminAccess("blocked", "需要登录", "请先登录管理员账号。账号的 profiles.role 必须是 admin 或 operator。", "./zh/login/");
    fillAdminEmptyState();
    return;
  }
  if (!adminLoaded && !adminLoading) {
    loadAdminConsole();
  }
  if (!adminData) {
    setAdminAccess("blocked", "正在加载后台数据", "正在通过 Supabase 安全函数读取真实运营数据。");
    fillAdminEmptyState();
    return;
  }
  const actor = adminData.actor || {};
  setAdminAccess("ready", `已验证：${escapeHtml(actor.displayName || actor.email || "管理员")}`, `当前角色：${actor.role === "admin" ? "管理员" : "运营人员"}。敏感写操作会写入审计日志。`);
  const role = document.querySelector("[data-admin-role]");
  if (role) role.textContent = actor.role === "admin" ? "Admin" : "Operator";

  const summary = adminData.summary || {};
  setText("[data-admin-summary-users]", summary.users ?? 0);
  setText("[data-admin-summary-assets]", summary.assets ?? 0);
  setText("[data-admin-summary-pending]", summary.pendingAssets ?? 0);
  setText("[data-admin-summary-jobs]", summary.generationJobs ?? 0);
  setText("[data-admin-summary-failed]", summary.failedJobs ?? 0);
  setText("[data-admin-summary-credits]", summary.creditsConsumed ?? 0);
  setText("[data-admin-summary-orders]", summary.orders ?? 0);
  setText("[data-admin-summary-shares]", summary.activeShares ?? 0);
  setText("[data-admin-moderation-count]", summary.pendingAssets ?? 0);
  setText("[data-admin-kpi-new-users]", summary.todayNewUsers ?? 0);
  setText("[data-admin-kpi-paid-users]", summary.todayPaidUsers ?? 0);
  setText("[data-admin-kpi-revenue]", formatMoney(summary.todayRevenueCents ?? 0));
  setText("[data-admin-kpi-images]", summary.todayImages ?? 0);
  setText("[data-admin-kpi-videos]", summary.todayVideos ?? 0);
  setText("[data-admin-kpi-failed]", summary.todayFailedJobs ?? 0);
  setText("[data-admin-health]", "已连接");
  setText("[data-admin-supabase-status]", "Supabase 已配置。后台数据来自安全函数，不从浏览器暴露 service key。");
  renderAdminOperatingInsights(summary);
  renderAdminSystemReadiness(adminData.aiProviders || [], adminData.aiProviderError || "", adminData.oauthProviders || [], adminData.oauthProviderError || "");

  const homepage = normalizeHomepageConfig(adminData.homepage?.value_json || adminData.homepage || defaultHomepageConfig);
  fillHomepageForm(homepage);
  renderAdminHomepagePreview(homepage, adminData.homepage?.updated_at);
  const pageBuilder = normalizePageBuilderConfig(adminData.pageBuilder?.value_json || adminData.pageBuilder || defaultPageBuilderConfig);
  fillPageBuilderForm(pageBuilder);
  renderAdminPageBuilderPreview(pageBuilder, adminData.pageBuilder?.updated_at);
  const toolCatalog = normalizeToolCatalogConfig(adminData.toolCatalog?.value_json || adminData.toolCatalog || defaultToolCatalogConfig);
  fillToolCatalogForm(toolCatalog);
  renderAdminToolCatalogPreview(toolCatalog, adminData.toolCatalog?.updated_at);
  renderAdminToolVersions(toolCatalog);
  const workflowCenter = normalizeWorkflowCenterConfig(adminData.workflowCenter?.value_json || adminData.workflowCenter || defaultWorkflowCenterConfig);
  fillWorkflowForm(workflowCenter);
  renderAdminWorkflowPreview(workflowCenter, adminData.workflowCenter?.updated_at, adminData.aiProviders || []);
  const promptLibrary = normalizePromptLibraryConfig(adminData.promptLibrary?.value_json || adminData.promptLibrary || defaultPromptLibraryConfig);
  fillPromptForm(promptLibrary);
  renderAdminPromptPreview(promptLibrary, adminData.promptLibrary?.updated_at);
  const contentIntelligence = normalizeContentIntelligenceConfig(adminData.contentIntelligence?.value_json || adminData.contentIntelligence || defaultContentIntelligenceConfig);
  fillIntelligenceForm(contentIntelligence);
  renderAdminIntelligencePreview(contentIntelligence, adminData.contentIntelligence?.updated_at);
  const agentCenter = normalizeAgentCenterConfig(adminData.agentCenter?.value_json || adminData.agentCenter || defaultAgentCenterConfig);
  fillAgentForm(agentCenter);
  renderAdminAgentPreview(agentCenter, adminData.agentCenter?.updated_at);
  renderAdminCostAnalytics(adminData.costAnalytics || []);
  renderAdminUsers(adminData.users || []);
  renderAdminCredits(adminData.users || []);
  renderAdminOrders(adminData.orders || [], actor);
  renderAdminAssets(adminData.assets || [], actor);
  renderAdminJobs(adminData.jobs || []);
  renderAdminWorkers(adminData.workers || []);
  renderAdminShares(adminData.shares || [], actor);
  renderAdminAudit(adminData.auditLogs || [], actor);
}

function renderAdminConfiguration() {
  fillHomepageForm(defaultHomepageConfig);
  renderAdminHomepagePreview(defaultHomepageConfig);
  fillPageBuilderForm(defaultPageBuilderConfig);
  renderAdminPageBuilderPreview(defaultPageBuilderConfig);
  fillToolCatalogForm(defaultToolCatalogConfig);
  renderAdminToolCatalogPreview(defaultToolCatalogConfig);
  renderAdminToolVersions(defaultToolCatalogConfig);
  fillWorkflowForm(defaultWorkflowCenterConfig);
  renderAdminWorkflowPreview(defaultWorkflowCenterConfig);
  fillPromptForm(defaultPromptLibraryConfig);
  renderAdminPromptPreview(defaultPromptLibraryConfig);
  fillIntelligenceForm(defaultContentIntelligenceConfig);
  renderAdminIntelligencePreview(defaultContentIntelligenceConfig);
  fillAgentForm(defaultAgentCenterConfig);
  renderAdminAgentPreview(defaultAgentCenterConfig);
  renderAdminCostAnalytics([]);
  renderAdminSystemReadiness([], "", [], "");
}

function renderAdminSystemReadiness(aiProviders = [], providerError = "", oauthProviderStatus = [], oauthProviderError = "") {
  const oauthItems = getOAuthReadiness().map((item) => ({ ...item, detail: item.ready ? "前端可发起真实授权" : item.action }));
  const oauthStatusByProvider = Object.fromEntries((oauthProviderStatus || []).map((item) => [item.provider, item]));
  const oauthList = document.querySelector("[data-admin-oauth]");
  if (!oauthList) return;
  const providerRows = Array.isArray(aiProviders) && aiProviders.length ? aiProviders.map((provider) => {
    const probe = provider.probe || {};
    const configured = Boolean(provider.configured);
    const ok = configured && (probe.ok !== false);
    const detail = probe.message
      ? `${configured ? "Secret 已配置" : "Secret 未配置"} · ${probe.ok === false ? `实时验证失败：${probe.message}` : `状态：${probe.message}`}`
      : (configured ? "Secret 已配置，尚未运行实时验证。" : "缺少必要 Secret 或 endpoint。");
    return `
      <article class="admin-row">
        <span class="status-dot ${ok ? "ready" : "blocked"}"></span>
        <div><strong>AI Provider · ${escapeHtml(provider.provider || "unknown")}</strong><p>${escapeHtml(detail)}</p></div>
        <em>${ok ? "可用" : "阻塞"}</em>
      </article>
    `;
  }).join("") : `
    <article class="admin-row muted-row">
      <span class="status-dot blocked"></span>
      <div><strong>AI Provider</strong><p>${escapeHtml(providerError || "登录管理员后会读取 AI Function 的 provider-status 实时探针。")}</p></div>
      <em>待检测</em>
    </article>
  `;
  oauthList.innerHTML = `
    <article class="admin-row muted-row"><div><strong>OAuth 登录状态</strong><p>前端配置与 Supabase Provider 实时探测分开显示，避免把按钮入口误判为可登录。</p></div></article>
    ${oauthItems.map((item) => `
    <article class="admin-row">
      <span class="status-dot ${item.ready ? "ready" : "blocked"}"></span>
      <div><strong>${item.name}</strong><p>${escapeHtml(item.detail)}</p></div>
      <em>${item.ready ? "入口可见" : "待配置"}</em>
    </article>
    `).join("")}
    ${["google", "twitter", "discord"].map((provider) => {
      const status = oauthStatusByProvider[provider];
      const ok = Boolean(status?.ok);
      const detail = status
        ? (ok ? `Supabase 已跳转到 ${status.locationHost || "provider"}` : `Supabase 探测失败：${status.error || `HTTP ${status.status || 0}`}`)
        : (oauthProviderError || "登录管理员后会由后台安全函数探测 Supabase Provider 是否启用。");
      return `
        <article class="admin-row">
          <span class="status-dot ${ok ? "ready" : "blocked"}"></span>
          <div><strong>Supabase OAuth · ${escapeHtml(provider)}</strong><p>${escapeHtml(detail)}</p></div>
          <em>${ok ? "已启用" : "未启用"}</em>
        </article>
      `;
    }).join("")}
    <article class="admin-row muted-row"><div><strong>AI Provider 实时状态</strong><p>后台只轻量探测 Qwen Vision / DeepSeek；千问生成避免自动触发真实生成成本。</p></div></article>
    ${providerRows}
  `;
}

function fillAdminEmptyState() {
  const placeholders = [
    "[data-admin-users]",
    "[data-admin-credits]",
    "[data-admin-orders]",
    "[data-admin-assets]",
    "[data-admin-jobs]",
    "[data-admin-workers]",
    "[data-admin-shares]",
    "[data-admin-audit]",
    "[data-admin-homepage-preview-list]",
    "[data-admin-page-builder-preview-list]",
    "[data-admin-tool-catalog-preview-list]",
    "[data-admin-tool-version-list]",
    "[data-admin-workflow-preview-list]",
    "[data-admin-prompt-preview-list]",
    "[data-admin-intelligence-preview-list]",
    "[data-admin-agent-preview-list]",
    "[data-admin-cost-analytics]"
  ];
  placeholders.forEach((selector) => {
    const target = document.querySelector(selector);
    if (target) target.innerHTML = `<article class="admin-row muted-row"><div><strong>暂无真实后台数据</strong><p>完成登录、角色配置和 Supabase Function 部署后这里会显示生产数据。</p></div></article>`;
  });
}

function setAdminAccess(tone, title, message, href = "") {
  const target = document.querySelector("[data-admin-access]");
  if (!target) return;
  target.innerHTML = `
    <span class="status-dot ${tone === "ready" ? "ready" : "blocked"}"></span>
    <div><strong>${title}</strong><p>${message}</p></div>
    ${href ? `<a class="btn primary" href="${href}">去登录</a>` : ""}
  `;
}

async function loadAdminConsole() {
  if (!document.querySelector("[data-admin-page]") || !supabase || adminLoading) return;
  adminLoading = true;
  try {
    const [summary, users, orders, assets, jobs, workers, shares, homepage, pageBuilder, toolCatalog, workflowCenter, promptLibrary, contentIntelligence, agentCenter, costAnalytics, audit, aiStatus, oauthStatus] = await Promise.all([
      invokeAdmin("dashboard-summary"),
      invokeAdmin("list-users"),
      invokeAdmin("list-orders"),
      invokeAdmin("list-assets"),
      invokeAdmin("list-generation-jobs"),
      invokeAdmin("list-workers").catch(() => ({ workers: [] })),
      invokeAdmin("list-share-links"),
      invokeAdmin("get-homepage-config"),
      invokeAdmin("get-page-builder-config"),
      invokeAdmin("get-tool-catalog-config"),
      invokeAdmin("get-workflow-center-config").catch(() => ({ workflowCenter: { value_json: defaultWorkflowCenterConfig } })),
      invokeAdmin("get-prompt-library-config").catch(() => ({ promptLibrary: { value_json: defaultPromptLibraryConfig } })),
      invokeAdmin("get-content-intelligence-config").catch(() => ({ contentIntelligence: { value_json: defaultContentIntelligenceConfig } })),
      invokeAdmin("get-agent-center-config").catch(() => ({ agentCenter: { value_json: defaultAgentCenterConfig } })),
      invokeAdmin("list-cost-analytics").catch(() => ({ costAnalytics: [] })),
      invokeAdmin("list-audit-logs").catch((error) => ({ auditLogs: [], auditError: error.message })),
      invokeAi("provider-status", { probe: true }).catch((error) => ({ providers: [], providerError: error.message })),
      invokeAdmin("oauth-provider-status", { redirectTo: new URL("./zh/login/", window.location.href).href }).catch((error) => ({ oauthProviders: [], oauthProviderError: error.message }))
    ]);
    adminData = {
      actor: summary.actor || users.actor || orders.actor || assets.actor || jobs.actor,
      summary: summary.summary,
      users: users.users || [],
      orders: orders.orders || [],
      assets: assets.assets || [],
      jobs: jobs.jobs || [],
      workers: workers.workers || deriveAdminWorkers(jobs.jobs || []),
      shares: shares.shares || [],
      homepage: homepage.homepage || {},
      pageBuilder: pageBuilder.pageBuilder || {},
      toolCatalog: toolCatalog.toolCatalog || {},
      workflowCenter: workflowCenter.workflowCenter || {},
      promptLibrary: promptLibrary.promptLibrary || {},
      contentIntelligence: contentIntelligence.contentIntelligence || {},
      agentCenter: agentCenter.agentCenter || {},
      costAnalytics: costAnalytics.costAnalytics || [],
      auditLogs: audit.auditLogs || [],
      auditError: audit.auditError,
      aiProviders: aiStatus.providers || [],
      aiProviderError: aiStatus.providerError || "",
      oauthProviders: oauthStatus.oauthProviders || [],
      oauthProviderError: oauthStatus.oauthProviderError || ""
    };
    adminLoaded = true;
  } catch (error) {
    adminLoaded = false;
    adminData = null;
    setAdminAccess("blocked", "后台安全函数不可用", `${error.message || "请部署 Supabase Edge Function：admin。"}`);
  } finally {
    adminLoading = false;
    renderAdmin(state);
  }
}

async function invokeAdmin(action, body = {}) {
  const { data, error } = await supabase.functions.invoke("admin", { body: { action, ...body } });
  if (error) throw new Error(error.message || "后台函数调用失败");
  if (data?.error) throw new Error(data.error.message || data.error.code || "后台函数返回错误");
  return data || {};
}

function readHomepageForm(formData) {
  return normalizeHomepageConfig({
    eyebrow: String(formData.get("eyebrow") || defaultHomepageConfig.eyebrow).trim(),
    headline: String(formData.get("headline") || defaultHomepageConfig.headline).trim(),
    subheadline: String(formData.get("subheadline") || defaultHomepageConfig.subheadline).trim(),
    primaryCtaLabel: String(formData.get("primaryCtaLabel") || defaultHomepageConfig.primaryCtaLabel).trim(),
    primaryCtaHref: sanitizeHomepageHref(String(formData.get("primaryCtaHref") || defaultHomepageConfig.primaryCtaHref).trim()),
    secondaryCtaLabel: String(formData.get("secondaryCtaLabel") || defaultHomepageConfig.secondaryCtaLabel).trim(),
    secondaryCtaHref: sanitizeHomepageHref(String(formData.get("secondaryCtaHref") || defaultHomepageConfig.secondaryCtaHref).trim()),
    trustSignals: splitCommaList(String(formData.get("trustSignals") || "")),
    showcaseCards: parseHomepageCards(String(formData.get("showcaseCards") || ""), defaultHomepageConfig.showcaseCards),
    creationCards: parseHomepageCards(String(formData.get("creationCards") || ""), defaultHomepageConfig.creationCards)
  });
}

function fillHomepageForm(config) {
  const form = document.querySelector("[data-admin-homepage-form]");
  if (!form) return;
  const normalized = normalizeHomepageConfig(config);
  setFormValue(form, "eyebrow", normalized.eyebrow);
  setFormValue(form, "headline", normalized.headline);
  setFormValue(form, "subheadline", normalized.subheadline);
  setFormValue(form, "primaryCtaLabel", normalized.primaryCtaLabel);
  setFormValue(form, "primaryCtaHref", normalized.primaryCtaHref);
  setFormValue(form, "secondaryCtaLabel", normalized.secondaryCtaLabel);
  setFormValue(form, "secondaryCtaHref", normalized.secondaryCtaHref);
  setFormValue(form, "trustSignals", normalized.trustSignals.join(","));
  setFormValue(form, "showcaseCards", serializeHomepageCards(normalized.showcaseCards));
  setFormValue(form, "creationCards", serializeHomepageCards(normalized.creationCards));
}

function renderAdminHomepagePreview(config, updatedAt = "") {
  const target = document.querySelector("[data-admin-homepage-preview-list]");
  if (!target) return;
  const normalized = normalizeHomepageConfig(config);
  target.innerHTML = `
    <article class="admin-row homepage-preview-row">
      <span class="thumb ${escapeHtml(normalized.showcaseCards[0]?.style || "art-1")}"></span>
      <div>
        <strong>${escapeHtml(normalized.headline)}</strong>
        <p>${escapeHtml(normalized.subheadline)}</p>
        <small>${normalized.trustSignals.map(escapeHtml).join(" / ")}${updatedAt ? ` · 更新于 ${escapeHtml(updatedAt)}` : ""}</small>
      </div>
      <a href="./index.html" target="_blank" rel="noreferrer">打开首页</a>
    </article>
  `;
}

function setFormValue(form, name, value) {
  const field = form.elements.namedItem(name);
  if (field) field.value = value;
}

function normalizePageBuilderConfig(config) {
  const pages = Array.isArray(config?.pages) ? config.pages : defaultPageBuilderConfig.pages;
  return {
    pages: pages.map((page, pageIndex) => ({
      slug: String(page.slug || (pageIndex === 0 ? "home" : `page-${pageIndex + 1}`)).trim(),
      name: String(page.name || "页面").trim(),
      status: ["published", "draft", "hidden"].includes(page.status) ? page.status : "published",
      modules: normalizePageModules(page.modules)
    })).filter((page) => page.slug && page.name).slice(0, 12)
  };
}

function normalizePageModules(modules) {
  const source = Array.isArray(modules) && modules.length ? modules : defaultPageBuilderConfig.pages[0].modules;
  return source.map((module, index) => ({
    id: String(module.id || `module-${index + 1}`).trim(),
    type: String(module.type || "gallery").trim(),
    title: String(module.title || "内容模块").trim(),
    enabled: module.enabled !== false,
    displayStyle: ["masonry", "carousel", "grid", "hero", "list"].includes(module.displayStyle) ? module.displayStyle : "grid",
    cardCount: Math.max(1, Math.min(24, Number(module.cardCount || 6))),
    source: String(module.source || "manual").trim()
  })).filter((module) => module.id && module.type).slice(0, 16);
}

function normalizeToolCatalogConfig(config) {
  const tools = Array.isArray(config?.tools) ? config.tools : defaultToolCatalogConfig.tools;
  return {
    tools: tools.map((tool) => ({
      slug: String(tool.slug || "").trim(),
      name: String(tool.name || "").trim(),
      category: ["image", "video", "character", "asset", "prompt"].includes(tool.category) ? tool.category : "image",
      status: ["published", "draft", "hidden"].includes(tool.status) ? tool.status : "published",
      provider: String(tool.provider || "fake_worker").trim(),
      model: String(tool.model || "local-demo").trim(),
      workflowId: String(tool.workflowId || tool.workflow_id || "workflow-v1").trim(),
      creditCost: Math.max(0, Math.min(999, Number(tool.creditCost || 0))),
      route: sanitizeHomepageHref(String(tool.route || "./zh/app/generate/")),
      featured: Boolean(tool.featured),
      versions: normalizeToolVersions(tool.versions, [{
        version: "v1",
        changelog: "Initial published configuration",
        modelVersion: String(tool.model || "local-demo"),
        workflowVersion: "workflow-v1",
        promptVersion: "prompt-v1",
        status: "published"
      }])
    })).filter((tool) => tool.slug && tool.name).slice(0, 80)
  };
}

function normalizeToolVersions(versions, fallback = []) {
  const source = Array.isArray(versions) && versions.length ? versions : fallback;
  return source.slice(0, 20).map((version) => ({
    version: String(version.version || "v1").trim(),
    changelog: String(version.changelog || "").trim(),
    modelVersion: String(version.modelVersion || "").trim(),
    workflowVersion: String(version.workflowVersion || "").trim(),
    promptVersion: String(version.promptVersion || "").trim(),
    status: ["draft", "testing", "published", "deprecated"].includes(version.status) ? version.status : "draft"
  }));
}

function normalizeWorkflowCenterConfig(config) {
  const workflows = Array.isArray(config?.workflows) ? config.workflows : defaultWorkflowCenterConfig.workflows;
  return {
    workflows: workflows.map((workflow) => ({
      workflowId: String(workflow.workflowId || "").trim(),
      name: String(workflow.name || "").trim(),
      type: ["comfyui", "n8n", "api_chain", "agent_chain"].includes(workflow.type) ? workflow.type : "api_chain",
      provider: String(workflow.provider || "fake_worker").trim(),
      jsonConfig: workflow.jsonConfig && typeof workflow.jsonConfig === "object" ? workflow.jsonConfig : {},
      requiredModels: Array.isArray(workflow.requiredModels) ? workflow.requiredModels.map(String).filter(Boolean).slice(0, 12) : [],
      requiredInputs: Array.isArray(workflow.requiredInputs) ? workflow.requiredInputs.map(String).filter(Boolean).slice(0, 12) : [],
      outputType: ["image", "video", "text", "multimodal", "asset"].includes(workflow.outputType) ? workflow.outputType : "asset",
      creditPrice: Math.max(0, Math.min(9999, Number(workflow.creditPrice || 0))),
      version: String(workflow.version || "v1").trim(),
      status: ["draft", "testing", "published", "deprecated"].includes(workflow.status) ? workflow.status : "draft",
      description: String(workflow.description || "").trim()
    })).filter((workflow) => workflow.workflowId && workflow.name).slice(0, 80)
  };
}

function normalizePromptLibraryConfig(config) {
  const prompts = Array.isArray(config?.prompts) ? config.prompts : defaultPromptLibraryConfig.prompts;
  const timestamp = new Date().toISOString();
  return {
    prompts: prompts.map((prompt) => ({
      promptId: String(prompt.promptId || "").trim(),
      title: String(prompt.title || "").trim(),
      category: String(prompt.category || "image").trim(),
      useCase: String(prompt.useCase || "").trim(),
      promptText: String(prompt.promptText || "").trim(),
      negativePrompt: String(prompt.negativePrompt || "").trim(),
      variables: Array.isArray(prompt.variables) ? prompt.variables.map(String).filter(Boolean).slice(0, 20) : [],
      model: String(prompt.model || "local-demo").trim(),
      version: String(prompt.version || "v1").trim(),
      tags: Array.isArray(prompt.tags) ? prompt.tags.map(String).filter(Boolean).slice(0, 16) : [],
      status: ["draft", "testing", "published", "archived"].includes(prompt.status) ? prompt.status : "draft",
      createdAt: String(prompt.createdAt || timestamp),
      updatedAt: String(prompt.updatedAt || timestamp)
    })).filter((prompt) => prompt.promptId && prompt.title && prompt.promptText).slice(0, 200)
  };
}

function normalizeContentIntelligenceConfig(config) {
  const records = Array.isArray(config?.records) ? config.records : defaultContentIntelligenceConfig.records;
  return {
    records: records.map((record) => ({
      sourcePlatform: String(record.sourcePlatform || "X").trim(),
      sourceUrl: String(record.sourceUrl || "").trim(),
      accountName: String(record.accountName || "").trim(),
      postText: String(record.postText || "").trim(),
      mediaUrls: Array.isArray(record.mediaUrls) ? record.mediaUrls.map(String).filter(Boolean).slice(0, 12) : [],
      analysisJson: record.analysisJson && typeof record.analysisJson === "object" ? record.analysisJson : {},
      hook: String(record.hook || "").trim(),
      topic: String(record.topic || "").trim(),
      targetAudience: String(record.targetAudience || "").trim(),
      contentAngle: String(record.contentAngle || "").trim(),
      reusableStrategy: String(record.reusableStrategy || "").trim(),
      generatedPostVariants: Array.isArray(record.generatedPostVariants) ? record.generatedPostVariants.map(String).filter(Boolean).slice(0, 12) : [],
      status: ["draft", "analyzed", "converted", "archived"].includes(record.status) ? record.status : "draft"
    })).filter((record) => record.sourcePlatform && (record.sourceUrl || record.postText)).slice(0, 200)
  };
}

function normalizeAgentCenterConfig(config) {
  const agents = Array.isArray(config?.agents) ? config.agents : defaultAgentCenterConfig.agents;
  return {
    agents: agents.map((agent) => ({
      agentId: String(agent.agentId || "").trim(),
      name: String(agent.name || "").trim(),
      role: ["Director Agent", "Content Analyst Agent", "Prompt Engineer Agent", "Script Writer Agent", "Storyboard Agent", "Publisher Agent"].includes(agent.role) ? agent.role : "Director Agent",
      modelProvider: String(agent.modelProvider || "fake_worker").trim(),
      modelName: String(agent.modelName || "local-agent-v0").trim(),
      systemPrompt: String(agent.systemPrompt || "").trim(),
      temperature: Math.max(0, Math.min(2, Number(agent.temperature ?? 0.7))),
      maxTokens: Math.max(1, Math.min(200000, Number(agent.maxTokens || 4096))),
      toolsEnabled: Array.isArray(agent.toolsEnabled) ? agent.toolsEnabled.map(String).filter(Boolean).slice(0, 20) : [],
      status: ["draft", "testing", "active", "disabled"].includes(agent.status) ? agent.status : "draft"
    })).filter((agent) => agent.agentId && agent.name).slice(0, 80)
  };
}

function fillPageBuilderForm(config) {
  const form = document.querySelector("[data-admin-page-builder-form]");
  if (!form) return;
  const normalized = normalizePageBuilderConfig(config);
  setFormValue(form, "pageBuilderRows", serializePageBuilderRows(normalized));
  renderPageBuilderVisualEditor(normalized);
}

function fillToolCatalogForm(config) {
  const form = document.querySelector("[data-admin-tool-catalog-form]");
  if (!form) return;
  const normalized = normalizeToolCatalogConfig(config);
  setFormValue(form, "toolCatalogRows", serializeToolCatalogRows(normalized));
  renderToolCatalogVisualEditor(normalized);
}

function fillWorkflowForm(config) {
  const form = document.querySelector("[data-admin-workflow-form]");
  if (!form) return;
  const normalized = normalizeWorkflowCenterConfig(config);
  setFormValue(form, "workflowRows", serializeWorkflowRows(normalized));
  renderAdminWorkflowSwitchboard(normalized, adminData?.aiProviders || []);
}

function fillPromptForm(config) {
  const form = document.querySelector("[data-admin-prompt-form]");
  if (!form) return;
  setFormValue(form, "promptRows", serializePromptRows(normalizePromptLibraryConfig(config)));
}

function fillIntelligenceForm(config) {
  const form = document.querySelector("[data-admin-intelligence-form]");
  if (!form) return;
  setFormValue(form, "intelligenceRows", serializeIntelligenceRows(normalizeContentIntelligenceConfig(config)));
}

function fillAgentForm(config) {
  const form = document.querySelector("[data-admin-agent-form]");
  if (!form) return;
  setFormValue(form, "agentRows", serializeAgentRows(normalizeAgentCenterConfig(config)));
}

function readPageBuilderForm(formData) {
  const visual = readPageBuilderVisualEditor();
  if (visual.pages.length) return normalizePageBuilderConfig(visual);
  const rows = String(formData.get("pageBuilderRows") || "");
  const pageMap = new Map();
  for (const line of rows.split(/\n+/)) {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length < 9) continue;
    const [slug, name, moduleId, type, title, enabled, displayStyle, cardCount, source] = parts;
    if (!pageMap.has(slug)) pageMap.set(slug, { slug, name, status: "published", modules: [] });
    pageMap.get(slug).modules.push({
      id: moduleId,
      type,
      title,
      enabled: !["off", "false", "hidden", "0"].includes(enabled.toLowerCase()),
      displayStyle,
      cardCount: Number(cardCount),
      source
    });
  }
  return normalizePageBuilderConfig({ pages: Array.from(pageMap.values()) });
}

function readToolCatalogForm(formData) {
  const visual = readToolCatalogVisualEditor();
  if (visual.tools.length) return normalizeToolCatalogConfig(visual);
  const rows = String(formData.get("toolCatalogRows") || "");
  return normalizeToolCatalogConfig({
    tools: rows.split(/\n+/).map((line) => {
      const [slug, name, category, status, provider, model, workflowId, creditCost, route, featured] = line.split("|").map((part) => part.trim());
      return {
        slug,
        name,
        category,
        status,
        provider,
        model,
        workflowId,
        creditCost: Number(creditCost),
        route,
        featured: ["yes", "true", "on", "1", "推荐"].includes(String(featured || "").toLowerCase())
      };
    })
  });
}

function readWorkflowForm(formData) {
  const rows = String(formData.get("workflowRows") || "");
  return normalizeWorkflowCenterConfig({
    workflows: rows.split(/\n+/).map((line) => {
      const [workflowId, name, type, provider, outputType, creditPrice, version, status, requiredModels, requiredInputs, description] = line.split("|").map((part) => part.trim());
      return {
        workflowId,
        name,
        type,
        provider,
        outputType,
        creditPrice: Number(creditPrice),
        version,
        status,
        requiredModels: splitAdminList(requiredModels),
        requiredInputs: splitAdminList(requiredInputs),
        description,
        jsonConfig: { source: "admin_text_rows" }
      };
    })
  });
}

async function runAdminWorkflowSwitch(button) {
  const form = document.querySelector("[data-admin-workflow-form]");
  if (!form) return;
  const workflowId = button.dataset.workflowId || "";
  const provider = button.dataset.provider || "";
  const status = button.dataset.status || "";
  const formData = new FormData(form);
  const current = readWorkflowForm(formData);
  const updated = applyWorkflowSwitch(current, { workflowId, provider, status });
  const target = updated.workflows.find((workflow) => workflow.workflowId === workflowId);
  setFormValue(form, "workflowRows", serializeWorkflowRows(updated));
  renderAdminWorkflowSwitchboard(updated, adminData?.aiProviders || []);
  renderAdminWorkflowPreview(updated, "", adminData?.aiProviders || []);
  await runAdminAction(button, "update-workflow-center-config", {
    config: updated,
    reason: `后台 Workflow 快捷开关：${target?.name || workflowId} -> ${target?.provider || provider} / ${target?.status || status}`
  });
}

function applyWorkflowSwitch(config, change) {
  return normalizeWorkflowCenterConfig({
    workflows: normalizeWorkflowCenterConfig(config).workflows.map((workflow) => {
      if (workflow.workflowId !== change.workflowId) return workflow;
      const next = { ...workflow };
      if (change.provider) {
        next.provider = change.provider;
        next.requiredModels = workflowModelsForProvider(change.provider, workflow.outputType, workflow.requiredModels);
        next.description = workflowDescriptionForProvider(change.provider, workflow.outputType, workflow.description);
        next.status = workflow.status === "deprecated" || workflow.status === "draft" ? "testing" : workflow.status;
      }
      if (change.status) next.status = change.status;
      return next;
    })
  });
}

function workflowModelsForProvider(provider, outputType, fallback = []) {
  if (provider === "fake_worker") return [outputType === "video" ? "local-video-v0" : outputType === "text" ? "local-text-v0" : "local-image-v0"];
  if (provider === "qianwen_generation") return [outputType === "video" ? "qianwen-video-v1" : "qianwen-image-v1"];
  if (provider === "deepseek_text") return ["deepseek-chat"];
  if (provider === "qwen_vision") return ["Qwen/Qwen2.5-VL-7B-Instruct"];
  return Array.isArray(fallback) && fallback.length ? fallback : [provider];
}

function workflowDescriptionForProvider(provider, outputType, fallback = "") {
  if (provider === "fake_worker") return "安全回滚到 Fake Worker：用于演示、灰度验证和真实 provider 异常时保持产品闭环。";
  if (provider === "qianwen_generation") return outputType === "video"
    ? "灰度到千问视频生成：任务失败时标记 failed，并通过积分账本退款。"
    : "灰度到千问图片生成：任务失败时标记 failed，并通过积分账本退款。";
  if (provider === "deepseek_text") return "使用 DeepSeek 做提示词增强、中文文案和运营文案，不直接生成资产。";
  if (provider === "qwen_vision") return "使用 Qwen Vision 做上传图片识别、标签、风险和可复用 prompt 建议。";
  return fallback || "预留真实 provider 工作流，启用前需要先完成 Edge Function 适配和密钥配置。";
}

function readPromptForm(formData) {
  const rows = String(formData.get("promptRows") || "");
  return normalizePromptLibraryConfig({
    prompts: rows.split(/\n+/).map((line) => {
      const [promptId, title, category, useCase, model, version, status, variables, tags, promptText, negativePrompt] = line.split("|").map((part) => part.trim());
      return {
        promptId,
        title,
        category,
        useCase,
        model,
        version,
        status,
        variables: splitAdminList(variables),
        tags: splitAdminList(tags),
        promptText,
        negativePrompt
      };
    })
  });
}

function readIntelligenceForm(formData) {
  const rows = String(formData.get("intelligenceRows") || "");
  return normalizeContentIntelligenceConfig({
    records: rows.split(/\n+/).map((line) => {
      const [sourcePlatform, sourceUrl, accountName, postText, hook, topic, targetAudience, contentAngle, reusableStrategy, status, variants] = line.split("|").map((part) => part.trim());
      return {
        sourcePlatform,
        sourceUrl,
        accountName,
        postText,
        hook,
        topic,
        targetAudience,
        contentAngle,
        reusableStrategy,
        status,
        generatedPostVariants: splitAdminList(variants),
        mediaUrls: [],
        analysisJson: { source: "manual_admin_input", confidence: 0.7 }
      };
    })
  });
}

function readAgentForm(formData) {
  const rows = String(formData.get("agentRows") || "");
  return normalizeAgentCenterConfig({
    agents: rows.split(/\n+/).map((line) => {
      const [agentId, name, role, modelProvider, modelName, temperature, maxTokens, toolsEnabled, status, systemPrompt] = line.split("|").map((part) => part.trim());
      return {
        agentId,
        name,
        role,
        modelProvider,
        modelName,
        temperature: Number(temperature),
        maxTokens: Number(maxTokens),
        toolsEnabled: splitAdminList(toolsEnabled),
        status,
        systemPrompt
      };
    })
  });
}

function renderPageBuilderVisualEditor(config) {
  const target = document.querySelector("[data-admin-page-builder-visual]");
  if (!target) return;
  const normalized = normalizePageBuilderConfig(config);
  target.innerHTML = normalized.pages.map((page) => `
    <section class="admin-config-page" data-page-builder-page>
      <div class="admin-config-page-head">
        <label><span>页面</span><input data-page-slug value="${escapeHtml(page.slug)}"></label>
        <label><span>页面名称</span><input data-page-name value="${escapeHtml(page.name)}"></label>
        <label><span>状态</span><select data-page-status>${optionMarkup(["published", "draft", "hidden"], page.status)}</select></label>
      </div>
      <div class="admin-config-module-list">
        ${page.modules.map((module) => `
          <article class="admin-config-card" data-page-builder-module>
            <label><span>模块 ID</span><input data-module-id value="${escapeHtml(module.id)}"></label>
            <label><span>模块类型</span><select data-module-type>${optionMarkup(["hero", "gallery", "characters", "tools", "pricing", "faq", "custom"], module.type)}</select></label>
            <label class="wide"><span>模块标题</span><input data-module-title value="${escapeHtml(module.title)}"></label>
            <label><span>是否启用</span><select data-module-enabled>${optionMarkup(["on", "off"], module.enabled ? "on" : "off")}</select></label>
            <label><span>展示方式</span><select data-module-style>${optionMarkup(["hero", "masonry", "carousel", "grid", "list"], module.displayStyle)}</select></label>
            <label><span>展示卡片数</span><input data-module-count type="number" min="1" max="24" value="${module.cardCount}"></label>
            <label class="wide"><span>数据来源</span><input data-module-source value="${escapeHtml(module.source)}"></label>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderToolCatalogVisualEditor(config) {
  const target = document.querySelector("[data-admin-tool-catalog-visual]");
  if (!target) return;
  const normalized = normalizeToolCatalogConfig(config);
  target.innerHTML = normalized.tools.map((tool) => `
    <article class="admin-config-card admin-tool-config-card" data-tool-catalog-item>
      <label><span>Slug</span><input data-tool-slug value="${escapeHtml(tool.slug)}"></label>
      <label><span>工具名称</span><input data-tool-name value="${escapeHtml(tool.name)}"></label>
      <label><span>分类</span><select data-tool-category>${optionMarkup(["image", "video", "character", "asset", "prompt"], tool.category)}</select></label>
      <label><span>状态</span><select data-tool-status>${optionMarkup(["published", "draft", "hidden"], tool.status)}</select></label>
      <label><span>服务商</span><select data-tool-provider>${optionMarkup(["fake_worker", "qwen_vision", "deepseek_text", "qianwen_generation", "openai", "gemini", "fal", "replicate", "comfyui", "runpod", "local_api"], tool.provider)}</select></label>
      <label><span>模型 / 工作流</span><input data-tool-model value="${escapeHtml(tool.model)}"></label>
      <label><span>绑定 Workflow</span><input data-tool-workflow value="${escapeHtml(tool.workflowId)}"></label>
      <label><span>积分价格</span><input data-tool-cost type="number" min="0" max="999" value="${tool.creditCost}"></label>
      <label><span>是否推荐</span><select data-tool-featured>${optionMarkup(["yes", "no"], tool.featured ? "yes" : "no")}</select></label>
      <label class="wide"><span>入口路径</span><input data-tool-route value="${escapeHtml(tool.route)}"></label>
    </article>
  `).join("");
}

function readPageBuilderVisualEditor() {
  const pages = Array.from(document.querySelectorAll("[data-page-builder-page]")).map((pageNode) => ({
    slug: pageNode.querySelector("[data-page-slug]")?.value.trim() || "",
    name: pageNode.querySelector("[data-page-name]")?.value.trim() || "",
    status: pageNode.querySelector("[data-page-status]")?.value || "published",
    modules: Array.from(pageNode.querySelectorAll("[data-page-builder-module]")).map((moduleNode) => ({
      id: moduleNode.querySelector("[data-module-id]")?.value.trim() || "",
      type: moduleNode.querySelector("[data-module-type]")?.value || "gallery",
      title: moduleNode.querySelector("[data-module-title]")?.value.trim() || "",
      enabled: moduleNode.querySelector("[data-module-enabled]")?.value !== "off",
      displayStyle: moduleNode.querySelector("[data-module-style]")?.value || "grid",
      cardCount: Number(moduleNode.querySelector("[data-module-count]")?.value || 6),
      source: moduleNode.querySelector("[data-module-source]")?.value.trim() || "manual"
    }))
  }));
  return { pages: pages.filter((page) => page.slug && page.name) };
}

function readToolCatalogVisualEditor() {
  const existing = normalizeToolCatalogConfig(adminData?.toolCatalog?.value_json || adminData?.toolCatalog || defaultToolCatalogConfig).tools;
  const tools = Array.from(document.querySelectorAll("[data-tool-catalog-item]")).map((node) => ({
    slug: node.querySelector("[data-tool-slug]")?.value.trim() || "",
    name: node.querySelector("[data-tool-name]")?.value.trim() || "",
    category: node.querySelector("[data-tool-category]")?.value || "image",
    status: node.querySelector("[data-tool-status]")?.value || "published",
    provider: node.querySelector("[data-tool-provider]")?.value || "fake_worker",
    model: node.querySelector("[data-tool-model]")?.value.trim() || "local-demo",
    workflowId: node.querySelector("[data-tool-workflow]")?.value.trim() || "workflow-v1",
    creditCost: Number(node.querySelector("[data-tool-cost]")?.value || 0),
    route: node.querySelector("[data-tool-route]")?.value.trim() || "./zh/app/generate/",
    featured: node.querySelector("[data-tool-featured]")?.value === "yes",
    versions: existing.find((tool) => tool.slug === (node.querySelector("[data-tool-slug]")?.value.trim() || ""))?.versions
  }));
  return { tools: tools.filter((tool) => tool.slug && tool.name) };
}

function optionMarkup(options, selected) {
  return options.map((option) => `<option value="${escapeHtml(option)}" ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
}

function serializePageBuilderRows(config) {
  return normalizePageBuilderConfig(config).pages.flatMap((page) =>
    page.modules.map((module) => [
      page.slug,
      page.name,
      module.id,
      module.type,
      module.title,
      module.enabled ? "on" : "off",
      module.displayStyle,
      module.cardCount,
      module.source
    ].join("|"))
  ).join("\n");
}

function serializeToolCatalogRows(config) {
  return normalizeToolCatalogConfig(config).tools.map((tool) => [
    tool.slug,
    tool.name,
    tool.category,
    tool.status,
    tool.provider,
    tool.model,
    tool.workflowId,
    tool.creditCost,
    tool.route,
    tool.featured ? "yes" : "no"
  ].join("|")).join("\n");
}

function serializeWorkflowRows(config) {
  return normalizeWorkflowCenterConfig(config).workflows.map((workflow) => [
    workflow.workflowId,
    workflow.name,
    workflow.type,
    workflow.provider,
    workflow.outputType,
    workflow.creditPrice,
    workflow.version,
    workflow.status,
    workflow.requiredModels.join(","),
    workflow.requiredInputs.join(","),
    workflow.description
  ].join("|")).join("\n");
}

function serializePromptRows(config) {
  return normalizePromptLibraryConfig(config).prompts.map((prompt) => [
    prompt.promptId,
    prompt.title,
    prompt.category,
    prompt.useCase,
    prompt.model,
    prompt.version,
    prompt.status,
    prompt.variables.join(","),
    prompt.tags.join(","),
    prompt.promptText,
    prompt.negativePrompt
  ].join("|")).join("\n");
}

function serializeIntelligenceRows(config) {
  return normalizeContentIntelligenceConfig(config).records.map((record) => [
    record.sourcePlatform,
    record.sourceUrl,
    record.accountName,
    record.postText,
    record.hook,
    record.topic,
    record.targetAudience,
    record.contentAngle,
    record.reusableStrategy,
    record.status,
    record.generatedPostVariants.join(",")
  ].join("|")).join("\n");
}

function serializeAgentRows(config) {
  return normalizeAgentCenterConfig(config).agents.map((agent) => [
    agent.agentId,
    agent.name,
    agent.role,
    agent.modelProvider,
    agent.modelName,
    agent.temperature,
    agent.maxTokens,
    agent.toolsEnabled.join(","),
    agent.status,
    agent.systemPrompt
  ].join("|")).join("\n");
}

function renderAdminPageBuilderPreview(config, updatedAt = "") {
  const target = document.querySelector("[data-admin-page-builder-preview-list]");
  if (!target) return;
  const normalized = normalizePageBuilderConfig(config);
  target.innerHTML = normalized.pages.map((page) => `
    <article class="admin-row admin-config-row">
      <span class="status-dot ${page.status === "published" ? "ready" : "blocked"}"></span>
      <div>
        <strong>${escapeHtml(page.name)} · ${escapeHtml(page.slug)}</strong>
        <p>${page.modules.length} 个模块 · ${page.modules.filter((module) => module.enabled).length} 个启用${updatedAt ? ` · 更新于 ${escapeHtml(updatedAt)}` : ""}</p>
        <small>${page.modules.map((module) => `${escapeHtml(module.title)} / ${escapeHtml(module.displayStyle)} / ${module.cardCount} 张`).join(" ｜ ")}</small>
      </div>
      <em>${escapeHtml(page.status)}</em>
    </article>
  `).join("");
}

function renderAdminToolCatalogPreview(config, updatedAt = "") {
  const target = document.querySelector("[data-admin-tool-catalog-preview-list]");
  if (!target) return;
  const normalized = normalizeToolCatalogConfig(config);
  target.innerHTML = normalized.tools.map((tool) => `
    <article class="admin-row admin-config-row">
      <span class="status-dot ${tool.status === "published" ? "ready" : "blocked"}"></span>
      <div>
        <strong>${escapeHtml(tool.name)} · ${escapeHtml(tool.category)}</strong>
        <p>${escapeHtml(tool.provider)} / ${escapeHtml(tool.model)} · Workflow ${escapeHtml(tool.workflowId)} · ${tool.creditCost} 积分 · ${escapeHtml(tool.route)}${updatedAt ? ` · 更新于 ${escapeHtml(updatedAt)}` : ""}</p>
      </div>
      <em>${tool.featured ? "推荐" : escapeHtml(tool.status)}</em>
    </article>
  `).join("");
}

function renderAdminToolVersions(config) {
  const target = document.querySelector("[data-admin-tool-version-list]");
  if (!target) return;
  const tools = normalizeToolCatalogConfig(config).tools;
  const versions = tools.flatMap((tool) => tool.versions.map((version) => ({ tool, version })));
  target.innerHTML = versions.length ? versions.map(({ tool, version }) => `
    <article class="admin-row admin-config-row">
      <span class="status-dot ${version.status === "published" ? "ready" : version.status === "deprecated" ? "blocked" : ""}"></span>
      <div>
        <strong>${escapeHtml(tool.name)} · ${escapeHtml(version.version)} · ${escapeHtml(version.status)}</strong>
        <p>模型 ${escapeHtml(version.modelVersion)} · Workflow ${escapeHtml(version.workflowVersion)} · Prompt ${escapeHtml(version.promptVersion)}</p>
        <small>${escapeHtml(version.changelog || "暂无版本说明")}</small>
      </div>
      <em>${escapeHtml(tool.slug)}</em>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无工具版本</strong><p>工具上架配置保存后会在这里展示版本历史。</p></div></article>`;
}

function renderAdminWorkflowSwitchboard(config, aiProviders = []) {
  const target = document.querySelector("[data-admin-workflow-switchboard]");
  if (!target) return;
  const actor = adminData?.actor || {};
  const canWrite = actor.role === "admin";
  const workflows = normalizeWorkflowCenterConfig(config).workflows;
  const providerOptions = ["fake_worker", "qianwen_generation", "deepseek_text", "qwen_vision"];
  target.innerHTML = workflows.length ? workflows.map((workflow) => {
    const providerStatus = Array.isArray(aiProviders) ? aiProviders.find((item) => item.provider === workflow.provider) : null;
    const blocked = providerStatus?.configured === false || providerStatus?.probe?.ok === false;
    const statusClass = workflow.status === "published" && !blocked ? "ready" : blocked || workflow.status === "deprecated" ? "blocked" : "";
    return `
      <article class="admin-workflow-card" data-workflow-card="${escapeHtml(workflow.workflowId)}">
        <div class="admin-workflow-card-head">
          <span class="status-dot ${statusClass}"></span>
          <div>
            <strong>${escapeHtml(workflow.name)}</strong>
            <p>${escapeHtml(workflow.workflowId)} · ${escapeHtml(workflow.outputType)} · ${workflow.creditPrice} 积分</p>
          </div>
          <em>${escapeHtml(workflow.status)}</em>
        </div>
        <small>${escapeHtml(workflowRolloutHint(workflow, aiProviders))}</small>
        <div class="admin-workflow-actions" aria-label="Workflow 快捷开关">
          ${providerOptions.map((provider) => `
            <button type="button" data-admin-workflow-switch data-workflow-id="${escapeHtml(workflow.workflowId)}" data-provider="${escapeHtml(provider)}" ${!canWrite || workflow.provider === provider ? "disabled" : ""}>${workflowProviderLabel(provider)}</button>
          `).join("")}
        </div>
        <div class="admin-workflow-actions compact">
          ${["published", "testing", "draft", "deprecated"].map((status) => `
            <button type="button" data-admin-workflow-switch data-workflow-id="${escapeHtml(workflow.workflowId)}" data-status="${escapeHtml(status)}" ${!canWrite || workflow.status === status ? "disabled" : ""}>${workflowStatusLabel(status)}</button>
          `).join("")}
        </div>
      </article>
    `;
  }).join("") : `<article class="admin-row muted-row"><strong>暂无 Workflow</strong><p>保存 Workflow 配置后会显示快捷开关。</p></article>`;
}

function workflowProviderLabel(provider) {
  return {
    fake_worker: "回滚 Fake",
    qianwen_generation: "切千问",
    deepseek_text: "切 DeepSeek",
    qwen_vision: "切 Qwen"
  }[provider] || provider;
}

function workflowStatusLabel(status) {
  return {
    published: "发布",
    testing: "测试",
    draft: "草稿",
    deprecated: "停用"
  }[status] || status;
}

function renderAdminWorkflowPreview(config, updatedAt = "", aiProviders = []) {
  const target = document.querySelector("[data-admin-workflow-preview-list]");
  if (!target) return;
  const workflows = normalizeWorkflowCenterConfig(config).workflows;
  target.innerHTML = workflows.length ? workflows.map((workflow) => `
    <article class="admin-row admin-config-row">
      <span class="status-dot ${workflow.status === "published" ? "ready" : workflow.status === "deprecated" ? "blocked" : ""}"></span>
      <div>
        <strong>${escapeHtml(workflow.name)} · ${escapeHtml(workflow.workflowId)}</strong>
        <p>${escapeHtml(workflow.type)} / ${escapeHtml(workflow.provider)} · ${escapeHtml(workflow.outputType)} · ${workflow.creditPrice} 积分 · ${escapeHtml(workflow.version)}${updatedAt ? ` · 更新于 ${escapeHtml(updatedAt)}` : ""}</p>
        <small>模型：${workflow.requiredModels.map(escapeHtml).join(", ") || "未配置"} ｜ 输入：${workflow.requiredInputs.map(escapeHtml).join(", ") || "未配置"} ｜ ${escapeHtml(workflow.description)}</small>
        <small>${escapeHtml(workflowRolloutHint(workflow, aiProviders))}</small>
      </div>
      <em>${escapeHtml(workflow.status)}</em>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无 Workflow</strong><p>添加 ComfyUI、n8n、API Chain 或 Agent Chain 后会显示在这里。</p></div></article>`;
}

function workflowRolloutHint(workflow, aiProviders = []) {
  const providerStatus = Array.isArray(aiProviders)
    ? aiProviders.find((provider) => provider.provider === workflow.provider)
    : null;
  if (providerStatus?.probe?.ok === false) {
    return `Provider 阻塞：${workflow.provider} 实时验证失败，原因：${providerStatus.probe.message || "未知错误"}。`;
  }
  if (providerStatus && !providerStatus.configured) {
    return `Provider 阻塞：${workflow.provider} 缺少必要 Secret 或 endpoint。`;
  }
  if (!["published", "testing"].includes(workflow.status)) {
    return "不会进入真实生成路由：只有 testing / published 状态会被 AI Function 读取。";
  }
  if (workflow.provider === "qianwen_generation") {
    return "真实生成候选：此 Workflow 会尝试走千问图片/视频 provider，失败时任务会标记 failed 并自动退款。";
  }
  if (workflow.provider === "fake_worker") {
    return "安全回滚：此 Workflow 会走 Fake Worker，适合演示、灰度和供应商异常时回退。";
  }
  if (workflow.provider === "deepseek_text") {
    return "文本增强：此 Workflow 仅用于提示词/文案增强，不直接生成资产。";
  }
  if (workflow.provider === "qwen_vision") {
    return "图片理解：此 Workflow 用于上传图片识别、标签、风险和运营文案，不直接生成资产。";
  }
  return "预留 provider：当前前端不会直接调用此 Workflow，请先完成对应 Edge Function 适配。";
}

function renderAdminPromptPreview(config, updatedAt = "") {
  const target = document.querySelector("[data-admin-prompt-preview-list]");
  if (!target) return;
  const prompts = normalizePromptLibraryConfig(config).prompts;
  target.innerHTML = prompts.length ? prompts.map((prompt) => `
    <article class="admin-row admin-config-row">
      <span class="status-dot ${prompt.status === "published" ? "ready" : prompt.status === "archived" ? "blocked" : ""}"></span>
      <div>
        <strong>${escapeHtml(prompt.title)} · ${escapeHtml(prompt.promptId)}</strong>
        <p>${escapeHtml(prompt.category)} / ${escapeHtml(prompt.useCase)} · ${escapeHtml(prompt.model)} · ${escapeHtml(prompt.version)}${updatedAt ? ` · 更新于 ${escapeHtml(updatedAt)}` : ""}</p>
        <small>${escapeHtml(prompt.promptText.slice(0, 180))}</small>
        <small>变量：${prompt.variables.map(escapeHtml).join(", ") || "无"} ｜ 标签：${prompt.tags.map(escapeHtml).join(", ") || "无"}</small>
      </div>
      <em>${escapeHtml(prompt.status)}</em>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无 Prompt</strong><p>添加图片、视频、分析、改写或分镜 Prompt 后会显示在这里。</p></div></article>`;
}

function renderAdminIntelligencePreview(config, updatedAt = "") {
  const target = document.querySelector("[data-admin-intelligence-preview-list]");
  if (!target) return;
  const records = normalizeContentIntelligenceConfig(config).records;
  target.innerHTML = records.length ? records.map((record) => `
    <article class="admin-row admin-config-row">
      <span class="status-dot ${record.status === "analyzed" || record.status === "converted" ? "ready" : record.status === "archived" ? "blocked" : ""}"></span>
      <div>
        <strong>${escapeHtml(record.sourcePlatform)} · ${escapeHtml(record.topic || record.hook || "Untitled intelligence")}</strong>
        <p>${escapeHtml(record.accountName || "unknown")} · ${escapeHtml(record.status)}${updatedAt ? ` · 更新于 ${escapeHtml(updatedAt)}` : ""}</p>
        <small>Hook：${escapeHtml(record.hook || "待分析")} ｜ 受众：${escapeHtml(record.targetAudience || "待分析")}</small>
        <small>复用策略：${escapeHtml(record.reusableStrategy || "待生成")} ｜ 变体：${record.generatedPostVariants.map(escapeHtml).join(", ") || "无"}</small>
      </div>
      <em>${escapeHtml(record.sourceUrl ? "链接" : "正文")}</em>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无内容情报</strong><p>手动输入 X 链接和正文后会在这里展示 AI analysis JSON 占位结果。</p></div></article>`;
}

function renderAdminAgentPreview(config, updatedAt = "") {
  const target = document.querySelector("[data-admin-agent-preview-list]");
  if (!target) return;
  const agents = normalizeAgentCenterConfig(config).agents;
  target.innerHTML = agents.length ? agents.map((agent) => `
    <article class="admin-row admin-config-row">
      <span class="status-dot ${agent.status === "active" ? "ready" : agent.status === "disabled" ? "blocked" : ""}"></span>
      <div>
        <strong>${escapeHtml(agent.name)} · ${escapeHtml(agent.role)}</strong>
        <p>${escapeHtml(agent.modelProvider)} / ${escapeHtml(agent.modelName)} · temp ${agent.temperature} · ${agent.maxTokens} tokens${updatedAt ? ` · 更新于 ${escapeHtml(updatedAt)}` : ""}</p>
        <small>工具：${agent.toolsEnabled.map(escapeHtml).join(", ") || "无"} ｜ ${escapeHtml(agent.systemPrompt.slice(0, 180))}</small>
      </div>
      <em>${escapeHtml(agent.status)}</em>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无 Agent</strong><p>配置 Director、Content Analyst、Prompt Engineer 等 Agent 后会显示在这里。</p></div></article>`;
}

function renderAdminCostAnalytics(items) {
  const target = document.querySelector("[data-admin-cost-analytics]");
  if (!target) return;
  target.innerHTML = items.length ? items.slice(0, 12).map((item) => `
    <article class="admin-row admin-config-row">
      <span class="status-dot ${Number(item.profit_margin || 0) >= 0 ? "ready" : "blocked"}"></span>
      <div>
        <strong>${escapeHtml(item.tool_slug || "unknown-tool")} · ${escapeHtml(item.provider || "fake_worker")}</strong>
        <p>${escapeHtml(item.model_workflow || "local-demo")} · ${Number(item.total_jobs || 0)} jobs · ${Number(item.success_jobs || 0)} 成功 / ${Number(item.failed_jobs || 0)} 失败</p>
        <small>积分 ${Number(item.total_credit_charged || 0)} · API ${formatMoney(item.estimated_api_cost || 0)} · GPU ${formatMoney(item.estimated_gpu_cost || 0)} · 毛利 ${formatMoney(item.gross_profit || 0)}</small>
      </div>
      <em>${Number(item.profit_margin || 0)}%</em>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>等待成本数据</strong><p>生成任务产生后，会按工具、provider 和 workflow 汇总成本与利润。</p></div></article>`;
}

function splitAdminList(value = "") {
  return String(value || "").split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

function renderAdminOperatingInsights(summary) {
  renderAdminRankList("[data-admin-revenue-trend]", summary.weeklyRevenueTrend || [], (item) => ({
    title: item.date || "日期",
    detail: formatMoney(item.revenueCents || 0),
    value: "收入"
  }));
  renderAdminRankList("[data-admin-popular-tools]", summary.popularTools || [], (item) => ({
    title: item.toolSlug || "unknown-tool",
    detail: `${Number(item.jobs || 0)} 个生成任务`,
    value: "热门"
  }));
  renderAdminRankList("[data-admin-failure-tools]", summary.highFailureTools || [], (item) => ({
    title: item.toolSlug || "unknown-tool",
    detail: `${Number(item.failedJobs || 0)} / ${Number(item.totalJobs || 0)} 失败`,
    value: `${Number(item.failureRate || 0)}%`
  }));
  renderAdminRankList("[data-admin-credit-rank]", summary.creditConsumptionRank || [], (item) => ({
    title: item.toolSlug || "unknown-tool",
    detail: `${Number(item.credits || 0)} 积分`,
    value: "消耗"
  }));
}

function renderAdminRankList(selector, items, mapper) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.innerHTML = items.length ? items.slice(0, 7).map((item) => {
    const mapped = mapper(item);
    return `
      <article class="admin-row compact-row">
        <span class="status-dot ready"></span>
        <div><strong>${escapeHtml(mapped.title)}</strong><p>${escapeHtml(mapped.detail)}</p></div>
        <em>${escapeHtml(mapped.value)}</em>
      </article>
    `;
  }).join("") : `<article class="admin-row muted-row"><div><strong>等待真实数据</strong><p>生成、订单和积分流水出现后这里会自动汇总。</p></div></article>`;
}

function splitCommaList(value) {
  return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
}

function parseHomepageCards(value, fallback) {
  const cards = value.split(/\n+/).map((line, index) => {
    const [label, title, style = `art-${(index % 13) + 1}`, size = "", output = "", image = ""] = line.split("|").map((part) => part.trim());
    return label && title ? { label, title, style, size, outputPreview: output === "preview", image } : null;
  }).filter(Boolean);
  return cards.length ? cards : fallback;
}

function serializeHomepageCards(cards) {
  return normalizeHomepageCards(cards, []).map((card) => [card.label, card.title, card.style, card.size, card.outputPreview ? "preview" : "", card.image].filter(Boolean).join("|")).join("\n");
}

function sanitizeHomepageHref(href) {
  if (!href) return "./zh/app/generate/";
  if (href.startsWith("./") || href.startsWith("/") || href.startsWith("#")) return href;
  return "./zh/app/generate/";
}

function sanitizeHomepageImageHref(href) {
  if (!href) return "";
  if (href.startsWith("./home-assets/") || href.startsWith("./assets/") || href.startsWith("data:image/")) return href;
  return "";
}

function renderAdminUsers(users) {
  const target = document.querySelector("[data-admin-users]");
  if (!target) return;
  target.innerHTML = users.length ? users.slice(0, 8).map((user) => `
    <article class="admin-row">
      <span class="status-dot ${user.account_status === "active" ? "ready" : "blocked"}"></span>
      <div><strong>${escapeHtml(user.display_name || user.email)}</strong><p>${escapeHtml(user.email)} · ${escapeHtml(user.role || "user")} · ${Number(user.credit_balance || 0)} 积分</p></div>
      <button type="button" data-admin-copy-user="${escapeHtml(user.id)}">复制 ID</button>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无用户</strong><p>真实注册用户会显示在这里。</p></div></article>`;
}

function renderAdminCredits(users) {
  const target = document.querySelector("[data-admin-credits]");
  if (!target) return;
  target.innerHTML = users.slice(0, 5).map((user) => `
    <article class="admin-row">
      <span class="status-dot ready"></span>
      <div><strong>${escapeHtml(user.display_name || user.email)}</strong><p>当前余额 ${Number(user.credit_balance || 0)} 积分</p></div>
      <em>${escapeHtml(user.role || "user")}</em>
    </article>
  `).join("") || `<article class="admin-row"><div><strong>等待积分流水</strong><p>用户注册、生成和后台调整都会进入这里。</p></div></article>`;
}

function renderAdminOrders(orders, actor) {
  const target = document.querySelector("[data-admin-orders]");
  if (!target) return;
  target.innerHTML = orders.length ? orders.slice(0, 8).map((order) => `
    <article class="admin-row">
      <span class="status-dot ${order.status === "fulfilled" ? "ready" : "blocked"}"></span>
      <div><strong>${escapeHtml(order.order_type || "credit_purchase")} · ${Number(order.credits_granted || 0)} 积分</strong><p>${escapeHtml(order.currency || "USD")} ${(Number(order.amount_cents || 0) / 100).toFixed(2)} · ${escapeHtml(order.status)}</p></div>
      ${actor.role === "admin" ? `<button type="button" data-admin-order="${escapeHtml(order.id)}" data-status="fulfilled">标记到账</button>` : `<em>只读</em>`}
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无订单</strong><p>真实订单和演示订单会在这里汇总。</p></div></article>`;
}

function renderAdminAssets(assets, actor) {
  const target = document.querySelector("[data-admin-assets]");
  if (!target) return;
  target.innerHTML = assets.length ? assets.slice(0, 10).map((asset) => `
    <article class="admin-row">
      <span class="thumb ${asset.asset_type === "video" ? "art-7" : "art-3"}"></span>
      <div><strong>${escapeHtml(asset.display_name)}</strong><p>${escapeHtml(asset.asset_type)} · ${escapeHtml(asset.visibility_status)} · ${escapeHtml(asset.moderation_status)}</p></div>
      <button type="button" data-admin-review-asset="${escapeHtml(asset.id)}" data-status="approved">通过</button>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无资产</strong><p>用户生成结果会进入审核列表。</p></div></article>`;
}

function renderAdminJobs(jobs) {
  const target = document.querySelector("[data-admin-jobs]");
  if (!target) return;
  target.innerHTML = jobs.length ? jobs.slice(0, 8).map((job) => `
    <article class="admin-row admin-job-row">
      <span class="status-dot ${job.status === "completed" ? "ready" : job.status === "failed" ? "blocked" : ""}"></span>
      <div>
        <strong>${escapeHtml(job.tool_slug || job.media_type || "generation")} · ${escapeHtml(job.model || job.workflow_id || "local-demo")}</strong>
        <p>${escapeHtml(job.status)} · ${Number(job.credit_charged ?? job.cost_credits ?? 0)} 积分 · ${formatMoney(job.estimated_cost ?? job.estimated_cost_cents ?? 0)} 成本 · ${formatLatency(job.latency)} 延迟</p>
        <small>用户 ${escapeHtml(job.user_id || "unknown")} · workflow ${escapeHtml(job.workflow_id || "fake_worker_workflow")}@${escapeHtml(job.workflow_version || "v0")}</small>
        <small>输入 ${escapeHtml(formatAdminJson(job.input_params || { prompt: job.prompt }))}</small>
        <small>输出 ${escapeHtml(formatAdminJson(job.output_assets || job.result_asset_id || []))}${job.error_message ? ` · 错误 ${escapeHtml(job.error_message)}` : ""}</small>
      </div>
      <em>${Number(job.progress || 0)}%</em>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无生成任务</strong><p>Fake Worker 生成任务会显示状态、成本和失败原因。</p></div></article>`;
}

function renderAdminWorkers(workers) {
  const target = document.querySelector("[data-admin-workers]");
  if (!target) return;
  target.innerHTML = workers.length ? workers.slice(0, 8).map((worker) => `
    <article class="admin-row admin-worker-row">
      <span class="status-dot ${worker.status === "failed" || worker.status === "offline" ? "blocked" : worker.status === "idle" ? "ready" : ""}"></span>
      <div>
        <strong>${escapeHtml(worker.worker_id)} · ${escapeHtml(worker.provider)}</strong>
        <p>${escapeHtml(worker.workflow)} · ${escapeHtml(worker.type)} · 队列 ${Number(worker.queue_count || 0)} · 成功率 ${Number(worker.success_rate || 0)}%</p>
        <small>平均延迟 ${formatLatency(worker.average_latency)} · 单次成本 ${formatMoney(worker.cost_per_job || 0)} · 心跳 ${escapeHtml(worker.last_heartbeat || "unknown")}</small>
        <small>最近失败：${escapeHtml(worker.recent_failure_reason || "暂无失败记录")}</small>
      </div>
      <button type="button" disabled title="真实 Worker 接入后启用">启停预留</button>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无 Worker</strong><p>当前使用 Fake Worker；真实 ComfyUI / RunPod / Fal Worker 接入后会在这里显示。</p></div></article>`;
}

function renderAdminShares(shares, actor) {
  const target = document.querySelector("[data-admin-shares]");
  if (!target) return;
  target.innerHTML = shares.length ? shares.slice(0, 8).map((share) => `
    <article class="admin-row">
      <span class="status-dot ${share.visibility_status === "active" ? "ready" : "blocked"}"></span>
      <div><strong>${escapeHtml(share.token || share.id)}</strong><p>${escapeHtml(share.visibility_status)} · ${escapeHtml(share.media_asset_id || "")}</p></div>
      ${actor.role === "admin" ? `<button type="button" data-admin-revoke-share="${escapeHtml(share.id)}">撤销</button>` : `<em>只读</em>`}
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无分享链接</strong><p>公开分享会在这里显示并支持撤销。</p></div></article>`;
}

function renderAdminAudit(logs, actor) {
  const target = document.querySelector("[data-admin-audit]");
  if (!target) return;
  if (actor.role !== "admin") {
    target.innerHTML = `<article class="admin-row"><div><strong>仅管理员可查看审计日志</strong><p>operator 角色不能读取高风险操作记录。</p></div></article>`;
    return;
  }
  target.innerHTML = logs.length ? logs.slice(0, 10).map((log) => `
    <article class="admin-row">
      <span class="status-dot ready"></span>
      <div><strong>${escapeHtml(log.action)}</strong><p>${escapeHtml(log.target_type)} · ${escapeHtml(log.target_id)} · ${escapeHtml(log.created_at)}</p></div>
      <em>${escapeHtml(log.outcome)}</em>
    </article>
  `).join("") : `<article class="admin-row"><div><strong>暂无审计日志</strong><p>后台写操作完成后会自动留下记录。</p></div></article>`;
}

function deriveAdminWorkers(jobs) {
  const groups = new Map();
  for (const job of jobs) {
    const key = `${job.provider || "fake_worker"}|${job.model || job.workflow_id || "local-demo"}|${job.media_type || "image"}`;
    groups.set(key, [...(groups.get(key) || []), job]);
  }
  const workers = Array.from(groups.entries()).map(([key, items], index) => {
    const [provider, workflow, type] = key.split("|");
    const running = items.filter((job) => ["queued", "running", "pending"].includes(String(job.status))).length;
    const failed = items.filter((job) => job.status === "failed");
    const completed = items.filter((job) => job.status === "completed");
    const latencyValues = items.map((job) => Number(job.latency || 0)).filter(Boolean);
    return {
      worker_id: `worker_${provider}_${index + 1}`,
      provider,
      workflow,
      type,
      status: failed.length && failed.length >= completed.length ? "failed" : running ? "running" : "idle",
      queue_count: running,
      average_latency: latencyValues.length ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length) : 0,
      success_rate: items.length ? Math.round((completed.length / items.length) * 100) : 100,
      cost_per_job: items.length ? Math.round(items.reduce((sum, job) => sum + Number(job.estimated_cost_cents || job.estimated_cost || 0), 0) / items.length) : 0,
      last_heartbeat: items[0]?.updated_at || items[0]?.created_at || new Date().toISOString(),
      recent_failure_reason: failed[0]?.error_message || failed[0]?.error_code || "暂无失败记录"
    };
  });
  return workers.length ? workers : [{
    worker_id: "worker_fake_1",
    provider: "fake_worker",
    workflow: "local-demo",
    type: "multimodal",
    status: "idle",
    queue_count: 0,
    average_latency: 0,
    success_rate: 100,
    cost_per_job: 0,
    last_heartbeat: new Date().toISOString(),
    recent_failure_reason: "暂无失败记录"
  }];
}

function formatAdminJson(value) {
  if (typeof value === "string") return value.slice(0, 120);
  try {
    return JSON.stringify(value).slice(0, 160);
  } catch {
    return String(value).slice(0, 120);
  }
}

function formatLatency(value) {
  const ms = Number(value || 0);
  if (!ms) return "0ms";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatMoney(cents) {
  return `$${(Number(cents || 0) / 100).toFixed(2)}`;
}

function setText(selector, value) {
  const target = document.querySelector(selector);
  if (target) target.textContent = String(value);
}

function renderReferral(current) {
  const stateCard = document.querySelector("[data-referral-state]");
  if (stateCard) {
    stateCard.innerHTML = current.user ? `
      <span>已登录</span>
      <h2>${escapeHtml(current.user.name)} 的奖励中心</h2>
      <p>当前可用积分：<strong data-credit-balance>${current.credits}</strong>。继续签到、复制推荐链接或完成创作任务来获得更多积分。</p>
      <a class="btn primary full" href="./zh/dashboard/">打开控制台</a>
    ` : `
      <span>需要登录</span>
      <h2>登录后查看你的推荐仪表板</h2>
      <p>登录后可以复制专属推荐链接、查看奖励进度，并领取完成任务后的免费积分。</p>
      <a class="btn primary full" href="./zh/login/">登录开始</a>
    `;
  }

  const progress = document.querySelector("[data-referral-progress]");
  if (progress) {
    const checkDay = state.rewards.lastCheckInDate ? state.rewards.checkInDay || 1 : 0;
    progress.innerHTML = `
      <span>签到进度 <b>${checkDay}/7</b></span>
      <span>推荐链接复制 <b>${current.rewards.referralCopies || 0}</b></span>
      <span>已领任务 <b>${current.rewards.taskClaims.length}</b></span>
    `;
  }

  document.querySelectorAll("[data-reward-task]").forEach((card) => {
    const task = card.dataset.rewardTask;
    const claimed =
      (task === "checkin" && Boolean(current.rewards.lastCheckInDate)) ||
      (task === "first-generation" && current.history.length > 0) ||
      (task === "share" && current.shares.length > 0) ||
      current.rewards.taskClaims.includes(task);
    card.classList.toggle("claimed", claimed);
  });

  document.querySelectorAll("[data-claim-task]").forEach((button) => {
    const task = button.dataset.claimTask || "";
    if (current.rewards.taskClaims.includes(task)) {
      button.textContent = "已领取";
    }
  });
}

function renderShare(current) {
  const title = document.querySelector("[data-share-title]");
  if (!title) return;
  const asset = getCurrentShareAsset(current);
  if (!asset) return;
  title.textContent = asset.title;
  document.querySelectorAll("[data-share-prompt]").forEach((node) => node.textContent = `提示词：${asset.prompt}`);
  document.querySelectorAll("[data-share-character]").forEach((node) => node.textContent = asset.character);
  document.querySelectorAll("[data-share-credits]").forEach((node) => node.textContent = String(asset.credits));
}

function getCurrentShareAsset(current = state) {
  const token = new URLSearchParams(window.location.search).get("token");
  const share = current.shares.find((item) => item.token === token) || current.shares[0];
  return current.assets.find((item) => item.id === share?.assetId);
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

document.querySelector("[data-creation-search]")?.addEventListener("input", (event) => {
  creationSearch = event.currentTarget.value.trim().toLowerCase();
  renderCreations(state);
});

document.querySelectorAll("[data-creation-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    creationFilter = button.dataset.creationFilter || "all";
    renderCreations(state);
  });
});

document.querySelectorAll("[data-tool-home-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    toolHomeFilter = button.dataset.toolHomeFilter || "all";
    renderToolHomeDirectory();
  });
});

document.querySelector("[data-tool-home-search]")?.addEventListener("input", (event) => {
  toolHomeSearch = event.currentTarget.value.trim().toLowerCase();
  renderToolHomeDirectory();
});

document.addEventListener("click", async (event) => {
  const shareGenerateButton = event.target.closest("[data-share-generate]");
  if (shareGenerateButton) {
    const asset = getCurrentShareAsset();
    if (!asset) return;
    localStorage.setItem("ovs_retry_prompt", asset.prompt || "");
    localStorage.setItem("ovs_selected_character", asset.character || "");
    window.location.href = "./zh/app/generate/";
    return;
  }

  const shareCopyPromptButton = event.target.closest("[data-share-copy-prompt]");
  if (shareCopyPromptButton) {
    const asset = getCurrentShareAsset();
    if (!asset) return;
    try {
      await navigator.clipboard?.writeText(asset.prompt || "");
      shareCopyPromptButton.textContent = "已复制提示词";
    } catch {
      shareCopyPromptButton.textContent = "复制提示词";
    }
    return;
  }

  const shareSaveButton = event.target.closest("[data-share-save]");
  if (shareSaveButton) {
    const asset = getCurrentShareAsset();
    if (!asset) return;
    ensureUser("share");
    asset.favorite = true;
    asset.visibility = asset.visibility || "private";
    saveState(state);
    renderDashboard(state);
    shareSaveButton.textContent = "已保存到资产库";
    return;
  }

  const shareButton = event.target.closest("[data-share-asset]");
  if (shareButton) {
    event.preventDefault();
    createShare(shareButton.dataset.shareAsset);
    return;
  }

  const retryAssetButton = event.target.closest("[data-retry-asset]");
  if (retryAssetButton) {
    const asset = state.assets.find((item) => item.id === retryAssetButton.dataset.retryAsset);
    if (asset) {
      localStorage.setItem("ovs_retry_prompt", asset.prompt || "");
      window.location.href = "./zh/app/generate/";
    }
    return;
  }

  const retryJobButton = event.target.closest("[data-retry-job]");
  if (retryJobButton) {
    const job = state.history.find((item) => item.id === retryJobButton.dataset.retryJob);
    if (job) {
      localStorage.setItem("ovs_retry_prompt", job.prompt || "");
      window.location.href = "./zh/app/generate/";
    }
    return;
  }

  const copyPromptButton = event.target.closest("[data-copy-asset-prompt]");
  if (copyPromptButton) {
    const asset = state.assets.find((item) => item.id === copyPromptButton.dataset.copyAssetPrompt);
    if (!asset) return;
    try {
      await navigator.clipboard?.writeText(asset.prompt || "");
      copyPromptButton.textContent = "已复制";
    } catch {
      copyPromptButton.textContent = "复制提示词";
    }
    return;
  }

  const galleryCard = event.target.closest("[data-gallery-title][data-gallery-prompt]");
  const galleryTitle = galleryCard?.dataset.galleryTitle || "灵感作品";
  const galleryPrompt = galleryCard?.dataset.galleryPrompt || "";

  if (event.target.closest("[data-gallery-similar]")) {
    localStorage.setItem("ovs_retry_prompt", galleryPrompt);
    window.location.href = "./zh/app/generate/";
    return;
  }

  const copyGalleryPromptButton = event.target.closest("[data-copy-gallery-prompt]");
  if (copyGalleryPromptButton) {
    try {
      await navigator.clipboard?.writeText(galleryPrompt);
      copyGalleryPromptButton.textContent = "已复制";
    } catch {
      copyGalleryPromptButton.textContent = "复制提示词";
    }
    return;
  }

  if (event.target.closest("[data-gallery-share]")) {
    const assetId = `asset_gallery_${Date.now()}`;
    state.assets.unshift({
      id: assetId,
      type: galleryTitle.includes("片") ? "video" : "image",
      title: galleryTitle,
      prompt: galleryPrompt,
      character: "Gallery",
      credits: galleryTitle.includes("片") ? 24 : 8,
      status: "completed",
      visibility: "private",
      favorite: false
    });
    saveState(state);
    createShare(assetId);
    return;
  }

  const favoriteGalleryButton = event.target.closest("[data-gallery-favorite]");
  if (favoriteGalleryButton) {
    favoriteGalleryButton.textContent = "已收藏";
    galleryCard?.classList.add("saved");
    return;
  }

  if (event.target.closest("[data-open-character]")) {
    window.location.href = "./zh/app/characters/";
    return;
  }

  const characterCard = event.target.closest("[data-character-card]");
  if (characterCard && !event.target.closest("button")) {
    selectedCharacterId = characterCard.dataset.characterCard || selectedCharacterId;
    renderCharacters(state);
    return;
  }

  const useCharacterButton = event.target.closest("[data-use-character]");
  if (useCharacterButton) {
    const character = state.characters.find((item) => item.id === useCharacterButton.dataset.useCharacter);
    if (character) {
      localStorage.setItem("ovs_selected_character", character.name);
      localStorage.setItem("ovs_retry_prompt", `${character.name}，${character.role}，${character.memory || ""}`);
      window.location.href = "./zh/app/generate/";
    }
    return;
  }

  const copyCharacterButton = event.target.closest("[data-copy-character]");
  if (copyCharacterButton) {
    const character = state.characters.find((item) => item.id === copyCharacterButton.dataset.copyCharacter);
    if (!character) return;
    const characterPrompt = `${character.name}｜${character.role}｜标签：${character.tags.join(", ")}｜记忆：${character.memory || ""}`;
    try {
      await navigator.clipboard?.writeText(characterPrompt);
      copyCharacterButton.textContent = "已复制";
    } catch {
      copyCharacterButton.textContent = "复制设定";
    }
  }
});

document.querySelectorAll("[data-asset-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.assetFilter || "all";
    document.querySelectorAll("[data-asset-filter]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll("[data-asset]").forEach((card) => {
      const text = `${card.textContent || ""} ${card.dataset.assetKind || ""} ${card.dataset.assetFavorite || ""}`;
      card.hidden = filter !== "all" && !text.includes(filter);
    });
  });
});

document.querySelector("[data-character-search]")?.addEventListener("input", (event) => {
  characterSearch = event.currentTarget.value.trim().toLowerCase();
  renderCharacters(state);
});

document.querySelectorAll("[data-character-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    characterFilter = button.dataset.characterFilter || "all";
    renderCharacters(state);
  });
});

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
const selectedCharacterName = localStorage.getItem("ovs_selected_character");
if (selectedCharacterName) {
  const characterSelect = document.querySelector(".selector-grid select");
  if (characterSelect) {
    const matchingOption = Array.from(characterSelect.options).find((option) => option.textContent.startsWith(selectedCharacterName));
    if (matchingOption) characterSelect.value = matchingOption.value;
  }
  localStorage.removeItem("ovs_selected_character");
}

renderState(state);


