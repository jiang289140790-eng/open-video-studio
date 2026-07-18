import { createClient } from "@supabase/supabase-js";

const STORE_KEY = "ovs_mvp_state_v1";
const COOKIE_PREF_KEY = "ovs_cookie_preferences_v1";
const PRODUCT_EVENT_KEY = "ovs_product_events_v1";
const PRODUCT_EVENT_LIMIT = 250;
const AUTH_RETURN_KEY = "ovs_auth_return_target_v1";
const VIDEO_DRAFT_KEY = "ovs_video_generation_draft_v1";
const GENERATION_RECOVERY_KEY = "ovs_generation_recovery_v1";
const APP_SHELL_PAGES = new Set([
  "app.html",
  "gallery.html",
  "generate.html",
  "image-to-video.html",
  "undress-video.html",
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
const supabaseStorageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "open-video-studio-assets";
const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "";
const telegramAuthUrl = import.meta.env.VITE_TELEGRAM_AUTH_URL || "";
const oauthProviderFlags = {
  google: import.meta.env.VITE_GOOGLE_OAUTH_READY === "true",
  x: import.meta.env.VITE_X_OAUTH_READY === "true",
  discord: import.meta.env.VITE_DISCORD_OAUTH_READY === "true",
  telegram: import.meta.env.VITE_TELEGRAM_OAUTH_READY === "true"
};
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
// Temporary staging switch. Disable after API verification is complete.
const ENABLE_ANONYMOUS_TEST_MODE = true;
const AUTH_ROUTE_ALIASES = new Map([
  ["app", "app.html"],
  ["gallery", "gallery.html"],
  ["generate", "generate.html"],
  ["image-to-video", "image-to-video.html"],
  ["characters", "characters.html"],
  ["assets", "assets.html"],
  ["history", "history.html"],
  ["dashboard", "dashboard.html"],
  ["pricing", "pricing.html"],
  ["free-coins", "free-coins.html"],
  ["my-creations", "my-creations.html"],
  ["login", "signin.html"],
  ["signin", "signin.html"],
  ["reset-password", "reset-password.html"],
  ["share", "share.html"]
]);
const PAYMENT_PROVIDERS = [
  {
    id: "stripe",
    label: "Stripe 卡支付",
    shortLabel: "Stripe",
    configured: Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY),
    note: "支持银行卡和本地钱包；配置 Stripe Key 后启用真实结账。"
  },
  {
    id: "paypal",
    label: "PayPal",
    shortLabel: "PayPal",
    configured: Boolean(import.meta.env.VITE_PAYPAL_CLIENT_ID),
    note: "支持 PayPal 钱包；配置 PayPal Client ID / Secret 后启用真实结账。"
  }
];
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
  "免费积分",
  "我的作品",
  "每日奖励",
  "登录",
  "控制台",
  "生成任务",
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
  "结果会保存到资产库和生成任务。",
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
    "免费积分": "Free credits",
    "我的作品": "My works",
    "每日奖励": "Daily rewards",
    "登录": "Sign in",
    "控制台": "Dashboard",
    "生成任务": "Generation jobs",
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
    "结果会保存到资产库和生成任务。": "Results save to Assets and Generation jobs.",
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
    "免费积分": "無料クレジット",
    "我的作品": "マイ作品",
    "每日奖励": "デイリー報酬",
    "登录": "ログイン",
    "开始生成": "生成を開始",
    "生成": "生成",
    "资产库": "アセット",
    "生成任务": "生成ジョブ",
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
    "结果会保存到资产库和生成任务。": "結果はアセットと生成ジョブに保存されます。",
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
    "免费积分": "무료 크레딧",
    "我的作品": "내 작품",
    "每日奖励": "데일리 리워드",
    "登录": "로그인",
    "开始生成": "생성 시작",
    "生成": "생성",
    "资产库": "에셋",
    "生成任务": "생성 작업",
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
    "结果会保存到资产库和生成任务。": "결과는 에셋과 생성 작업에 저장됩니다.",
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
    { id: "char_mira", name: "Mira", role: "工作室主持人", tags: ["发布", "工作室", "冷静"], score: 92, status: "active", favorite: true, consistencyStatus: "stable", coverAsset: "asset_launch", referenceAsset: "asset_launch", memory: "稳定的工作室主持人，适合产品讲解、发布短片和品牌介绍。" },
    { id: "char_atlas", name: "Atlas", role: "产品讲解员", tags: ["产品", "干净"], score: 88, status: "active", favorite: false, consistencyStatus: "stable", coverAsset: "", referenceAsset: "asset_launch", memory: "商业产品讲解员，表达清晰，画面干净。" },
    { id: "char_nova", name: "Nova", role: "创作者形象", tags: ["时尚", "霓虹"], score: 95, status: "draft", favorite: false, consistencyStatus: "experimental", coverAsset: "", referenceAsset: "", memory: "适合时尚、霓虹、竖屏内容的创作者形象。" }
  ],
  assets: [
    { id: "asset_launch", type: "image", title: "发布主视觉", prompt: "紫色灯光下的电影感产品发布", character: "Mira", credits: 8, status: "completed", visibility: "private", favorite: true },
    { id: "asset_teaser", type: "video", title: "竖屏短片", prompt: "把主视觉转成社媒短片", character: "Mira", credits: 24, status: "completed", visibility: "public", favorite: false }
  ],
  history: [
    { id: "job_launch", type: "image", title: "产品发布主视觉", prompt: "紫色灯光下的电影感产品发布", provider: "local_api", model: "local-image-v0", status: "completed", credits: 8, duration: "18s", assetId: "asset_launch" },
    { id: "job_teaser", type: "video", title: "竖屏短片", prompt: "把主视觉转成社媒短片", provider: "local_api", model: "local-video-v0", status: "completed", credits: 24, duration: "8s", assetId: "asset_teaser" }
  ],
  creditLedger: [
    { id: "credit_starter", amount: 40, category: "starter", status: "posted", reason: "新用户启动积分", sourceType: "signup", sourceId: "starter", createdAt: "2026-07-07T09:00:00.000Z" },
    { id: "credit_job_launch", amount: -8, category: "generation", status: "posted", reason: "生成图片作品", sourceType: "generation_job", sourceId: "job_launch", createdAt: "2026-07-07T09:05:00.000Z" },
    { id: "credit_job_teaser", amount: -24, category: "generation", status: "posted", reason: "生成视频作品", sourceType: "generation_job", sourceId: "job_teaser", createdAt: "2026-07-07T09:12:00.000Z" }
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
    const existingHref = card.getAttribute("href") || "";
    const preservesPresetRoute = existingHref.includes("?preset=");
    const slug = toolSlugFromHref(existingHref);
    const tool = toolMap.get(slug);
    if (!tool) return;
    card.hidden = tool.status !== "published";
    if (!preservesPresetRoute) {
      card.setAttribute("href", tool.route);
      card.dataset.toolTags = `${tool.category} ${tool.status} ${tool.featured ? "hot featured" : ""} ${tool.provider} ${tool.model} ${tool.name}`;
      const strong = card.querySelector("strong");
      if (strong) strong.textContent = tool.name;
    } else {
      card.dataset.toolTags = `${card.dataset.toolTags || ""} ${tool.provider} ${tool.model} ${tool.status}`;
    }
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
  score: Number(character.score || 84),
  consistencyStatus: character.consistencyStatus || (Number(character.score || 84) >= 90 ? "stable" : "needs_review"),
  coverAsset: character.coverAsset || character.cover || "",
  referenceAsset: character.referenceAsset || character.reference || "",
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
state.creditLedger = Array.isArray(state.creditLedger) ? state.creditLedger : structuredClone(defaultState.creditLedger);
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
    { slug: "face-swap", name: "AI 换脸", category: "image", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-face-swap-v1", creditCost: 40, route: "./zh/app/face-swap/", featured: true, versions: [{ version: "v1", changelog: "绑定 Zealman AI 换脸 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-face-swap-v1", promptVersion: "prompt-faceswap-v1", status: "published" }] },
    { slug: "image-editor", name: "图片编辑器", category: "image", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-image-editor-v1", creditCost: 8, route: "./zh/app/image-editor/", featured: true, versions: [{ version: "v1", changelog: "绑定 Zealman 自然语言图片编辑 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-image-editor-v1", promptVersion: "prompt-image-editor-v1", status: "published" }] },
    { slug: "outfit-studio", name: "造型工作室", category: "image", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-outfit-v1", creditCost: 12, route: "./zh/app/outfit-studio/", featured: true, versions: [{ version: "v1", changelog: "绑定 Zealman 虚构成人角色换装 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-outfit-v1", promptVersion: "prompt-outfit-v1", status: "published" }] },
    { slug: "pose-generator", name: "姿势生成器", category: "image", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-pose-v1", creditCost: 8, route: "./zh/app/pose-generator/", featured: true, versions: [{ version: "v1", changelog: "绑定 Zealman 姿势重构 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-pose-v1", promptVersion: "prompt-pose-v1", status: "published" }] },
    { slug: "nano-banana", name: "自然语言图片编辑", category: "image", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-nano-v1", creditCost: 8, route: "./zh/app/nano-banana/", featured: true, versions: [{ version: "v1", changelog: "绑定 Zealman 自然语言图片编辑 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-nano-v1", promptVersion: "prompt-nano-v1", status: "published" }] },
    { slug: "image-combiner", name: "多图智能合成", category: "image", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-combiner-v1", creditCost: 16, route: "./zh/app/image-combiner/", featured: true, versions: [{ version: "v1", changelog: "绑定 Zealman 多图合成 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-combiner-v1", promptVersion: "prompt-combiner-v1", status: "published" }] },
    { slug: "image-to-video", name: "图片转视频", category: "video", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-image-to-video-v1", creditCost: 24, route: "./zh/app/image-to-video/", featured: true, versions: [{ version: "v1", changelog: "绑定 Zealman WAN 2.2 图生视频 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-image-to-video-v1", promptVersion: "prompt-wan22-i2v-v1", status: "published" }] },
    { slug: "adult-effects", name: "成人特效（已满18岁）", category: "video", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-adult-effects-v1", creditCost: 32, route: "./zh/app/undress-video/", featured: false, versions: [{ version: "v1", changelog: "绑定 Zealman Wan 2.2 4in1 API；仅限成年且合规内容", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-adult-effects-v1", promptVersion: "prompt-adult-effects-v1", status: "published" }] },
    { slug: "movie-closeup", name: "电影近景特效", category: "video", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-movie-closeup-v1", creditCost: 28, route: "./zh/app/image-to-video/?preset=movie-closeup", featured: false, versions: [{ version: "v1", changelog: "绑定 Zealman 电影近景 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-movie-closeup-v1", promptVersion: "prompt-movie-closeup-v1", status: "published" }] },
    { slug: "image-upscale", name: "图片高清修复", category: "image", status: "published", provider: "zealman_workflow", model: "zealman_workflow", workflowId: "workflow-hifun-upscale-v1", creditCost: 16, route: "./zh/app/image-editor/", featured: false, versions: [{ version: "v1", changelog: "绑定 Zealman 高清修复 API", modelVersion: "zealman_workflow", workflowVersion: "workflow-hifun-upscale-v1", promptVersion: "prompt-upscale-v1", status: "published" }] }
  ]
};
const defaultWorkflowCenterConfig = {
  workflows: [
    { workflowId: "workflow-faceswap-v1", name: "AI 换脸工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "image", workflowEnv: "COMFYUI_FACESWAP" }, requiredModels: ["comfyui-faceswap-v1"], requiredInputs: ["source_image", "target_image"], outputType: "image", creditPrice: 40, version: "v1", status: "published", description: "通过 ComfyUI Gateway 执行 AI 换脸，结果保存到资产库。" },
    { workflowId: "workflow-flux-klein-v1", name: "Flux Klein 图片增强工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "image", workflowEnv: "COMFYUI_FLUX_KLEIN" }, requiredModels: ["comfyui-flux-klein-v1"], requiredInputs: ["prompt", "reference_image"], outputType: "image", creditPrice: 8, version: "v1", status: "published", description: "通过 ComfyUI Gateway 执行 Flux Klein 图片增强，支持重绘、风格迁移。" },
    { workflowId: "workflow-outfit-v1", name: "造型生成工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "image", workflowEnv: "COMFYUI_OUTFIT" }, requiredModels: ["comfyui-outfit-v1"], requiredInputs: ["prompt", "reference_image"], outputType: "image", creditPrice: 12, version: "v1", status: "published", description: "通过 ComfyUI Gateway 生成角色造型变化。" },
    { workflowId: "workflow-pose-v1", name: "姿势生成工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "image", workflowEnv: "COMFYUI_POSE" }, requiredModels: ["comfyui-pose-v1"], requiredInputs: ["prompt"], outputType: "image", creditPrice: 8, version: "v1", status: "published", description: "通过 ComfyUI Gateway 生成角色姿势参考图。" },
    { workflowId: "workflow-nano-banana-v1", name: "Nano Banana 快速创意工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "image", workflowEnv: "COMFYUI_NANO_BANANA" }, requiredModels: ["comfyui-nano-banana-v1"], requiredInputs: ["prompt"], outputType: "image", creditPrice: 4, version: "v1", status: "published", description: "通过 ComfyUI Gateway 生成趣味贴纸、社媒封面等快速创意图像。" },
    { workflowId: "workflow-combiner-v1", name: "图像组合工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "image", workflowEnv: "COMFYUI_COMBINER" }, requiredModels: ["comfyui-combiner-v1"], requiredInputs: ["prompt", "source_asset", "reference_image"], outputType: "image", creditPrice: 16, version: "v1", status: "published", description: "通过 ComfyUI Gateway 组合多张参考图生成统一画面。" },
    { workflowId: "workflow-wan22-i2v-v1", name: "WAN 2.2 图生视频工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "video", workflowEnv: "COMFYUI_WAN22_I2V" }, requiredModels: ["comfyui-wan22-i2v-v1"], requiredInputs: ["prompt", "source_asset"], outputType: "video", creditPrice: 24, version: "v1", status: "published", description: "通过 ComfyUI Gateway WAN 2.2 把参考图生成 5 秒短视频（1280x720, 16fps）。" },
    { workflowId: "workflow-seedvr2-v1", name: "SEEDVR2 超分工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "image", workflowEnv: "COMFYUI_SEEDVR2" }, requiredModels: ["comfyui-seedvr2-v1"], requiredInputs: ["source_asset"], outputType: "image", creditPrice: 16, version: "v1", status: "published", description: "通过 ComfyUI Gateway SEEDVR2 将图片/视频超分到 2K/4K。" },
    { workflowId: "workflow-gmfss-v1", name: "GMFSS 视频补帧工作流", type: "comfyui", provider: "comfyui_gateway", jsonConfig: { action: "process-generation-job", mediaType: "video", workflowEnv: "COMFYUI_GMFSS" }, requiredModels: ["comfyui-gmfss-v1"], requiredInputs: ["source_asset"], outputType: "video", creditPrice: 12, version: "v1", status: "published", description: "通过 ComfyUI Gateway GMFSS 提升视频帧率让画面更流畅。" }
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
showAuthUrlMessage();
renderOAuthReadiness();
renderToolHomeDirectory();
renderCookieBanner();
hydrateAuthSession();
bindSupabaseAuthState();

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
          <a href="./zh/video-tools/"><strong>全部视频工具</strong><small>浏览图生视频、产品广告和社媒短视频</small></a>
          <a href="./zh/app/image-to-video/"><strong>图片转视频</strong><small>把静态资产转成短视频</small></a>
          <a href="./zh/history/"><strong>生成任务</strong><small>查看任务状态、成本和失败原因</small></a>
          <a href="./zh/my-creations/"><strong>我的作品</strong><small>管理成功生成的作品</small></a>
        </div>
      </div>
      <a href="./zh/pricing/">购买积分</a>
      <a href="./zh/free-coins/">免费积分</a>
      <a href="./zh/my-creations/">我的作品</a>
    `;
  }
  if (accountnav && !accountnav.querySelector(".language-menu")) {
    accountnav.innerHTML = `
      <a class="daily-check" href="./zh/free-coins/">🎁 每日奖励</a>
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
  trackProductEvent("cookie_preferences_saved", {
    analytics: Boolean(preferences.analytics),
    marketing: Boolean(preferences.marketing)
  });
  showSiteToast("Cookie 偏好已保存");
}

function isLocalAnalyticsDebug() {
  return ["localhost", "127.0.0.1", ""].includes(window.location.hostname) || window.location.protocol === "file:";
}

function shouldTrackProductEvent() {
  const preferences = getCookiePreferences();
  return Boolean(preferences?.analytics) || isLocalAnalyticsDebug();
}

function getCurrentAnalyticsPage() {
  const path = window.location.pathname.split("/").filter(Boolean).pop() || "index.html";
  return path.endsWith(".html") ? path : `${path}/`;
}

function sanitizeAnalyticsProperties(properties = {}) {
  return Object.fromEntries(Object.entries(properties)
    .filter(([, value]) => value === null || ["string", "number", "boolean"].includes(typeof value))
    .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 160) : value]));
}

function readProductEvents() {
  try {
    const rows = JSON.parse(localStorage.getItem(PRODUCT_EVENT_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function trackProductEvent(name, properties = {}) {
  if (!name || !shouldTrackProductEvent()) return null;
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    page: getCurrentAnalyticsPage(),
    path: window.location.pathname,
    createdAt: new Date().toISOString(),
    properties: sanitizeAnalyticsProperties(properties)
  };
  const events = [event, ...readProductEvents()].slice(0, PRODUCT_EVENT_LIMIT);
  localStorage.setItem(PRODUCT_EVENT_KEY, JSON.stringify(events));
  return event;
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
      <label><span><strong>必要存储</strong><small>登录状态、积分演示、语言和生成任务。</small></span><input type="checkbox" checked disabled></label>
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
      <a class="daily-check" href="./zh/free-coins/">🎁 每日奖励</a>
      ${languageMenuMarkup()}
      <a href="./zh/login/" data-auth-modal>登录</a>
    `;
    return;
  }
  const initial = (current.user.name || "创作者").trim().charAt(0).toUpperCase();
  accountnav.innerHTML = `
    <a class="daily-check" href="./zh/free-coins/">🎁 每日奖励</a>
    <a class="account-credit" href="./zh/pricing/"><span data-credit-balance>${current.credits}</span> 积分</a>
    ${languageMenuMarkup()}
    <div class="account-menu">
      <button class="account-trigger" type="button" aria-expanded="false"><span>${initial}</span><b data-user-name>${current.user.name}</b></button>
      <div class="account-dropdown">
        <a href="./zh/dashboard/">控制台</a>
        <a href="./zh/ai-studio/">创建内容</a>
        <a href="./zh/pipeline/">内容库 / 审核</a>
        <a href="./zh/calendar/">日历排期</a>
        <a href="./zh/analytics/">数据分析</a>
        <a href="./zh/accounts/">发布账号</a>
        <a href="./zh/campaigns/">内容计划</a>
        <a href="./zh/automation/">自动化</a>
        <a href="./zh/settings/">设置</a>
        <a href="./zh/my-creations/">我的作品</a>
        <a href="./zh/history/">生成任务</a>
        <a href="./zh/assets/">资产库</a>
        ${isAdminActor(current.user) ? `<a href="./zh/admin/" data-admin-nav-link>管理后台</a>` : ""}
        <a href="./zh/free-coins/">免费积分</a>
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
      <a class="rail-brand" href="./index.html" aria-label="Luravyn home"><img src="./brand/luravyn-logo.png" alt="Luravyn"></a>
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
        <span>创作者工作流</span>
        <a href="./zh/dashboard/" class="${active("dashboard.html")}">控制台</a>
        <a href="./zh/ai-studio/" class="${active("ai-studio.html")}">创建内容</a>
        <a href="./zh/pipeline/" class="${active("pipeline.html")}">内容库 / 审核</a>
        <a href="./zh/calendar/" class="${active("calendar.html")}">日历排期</a>
        <a href="./zh/analytics/" class="${active("analytics.html")}">数据分析</a>
        <span>辅助配置</span>
        <a href="./zh/accounts/" class="${active("accounts.html")}">发布账号</a>
        <a href="./zh/campaigns/" class="${active("campaigns.html")}">内容计划</a>
        <a href="./zh/automation/" class="${active("automation.html")}">自动化</a>
        <a href="./zh/settings/" class="${active("settings.html")}">设置</a>
        <span>AI 视频</span>
        <a href="./zh/video-tools/" class="${active("video-tools.html")}">全部视频工具</a>
        <a href="./zh/app/image-to-video/" class="${active("image-to-video.html")}">图片转视频</a>
        <a href="./zh/my-creations/" class="${active("my-creations.html")}">我的作品</a>
        <a href="./zh/history/" class="${active("history.html")}">生成任务</a>
        <a href="./zh/admin/" class="${active("admin.html")}" data-admin-nav-link hidden>管理后台</a>
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
        <a href="./zh/history/">生成任务</a>
        <a href="./zh/my-creations/">我的作品</a>
        <a href="./zh/dashboard/">控制台</a>
        <a href="./zh/ai-studio/">创建内容</a>
        <a href="./zh/pipeline/">内容库 / 审核</a>
        <a href="./zh/calendar/">日历排期</a>
        <a href="./zh/analytics/">数据分析</a>
        <a href="./zh/accounts/">发布账号</a>
        <a href="./zh/campaigns/">内容计划</a>
        <a href="./zh/automation/">自动化</a>
        <a href="./zh/settings/">设置</a>
      </div>
      <div>
        <h3>About Us</h3>
        <a href="./zh/blog/">Blog</a>
        <a href="./zh/pricing/">价格</a>
        <a href="./zh/free-coins/">推荐</a>
        <a href="./zh/terms/">Terms</a>
        <a href="./zh/privacy/">Privacy</a>
        <a href="./zh/cookie/">Cookie</a>
        <a href="./zh/admin/" data-admin-nav-link hidden>Admin</a>
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
      <button class="floating-action daily-check" type="button" aria-label="每日奖励"><span>🎁</span></button>
      <a class="floating-action" href="./zh/free-coins/" aria-label="免费积分"><span>分</span></a>
      <button class="floating-action" type="button" data-support-widget aria-label="帮助"><span>?</span></button>
      <button class="floating-avatar" type="button" data-support-widget aria-label="客服头像"><img src="./brand/luravyn-icon.png" alt=""></button>
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
          <span>生成结果会保存到资产库和生成任务。</span>
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
  if (document.querySelector(".spicy-effects-page")) return;
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
      <article><span>03</span><strong>保存到我的作品</strong><p>演示生成会进入资产、生成任务和分享链路，方便继续复用。</p></article>
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
        <a class="btn glass" href="./zh/free-coins/">领取免费积分</a>
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

function stateUserFromSupabaseUser(user) {
  const appMetadata = user.app_metadata || {};
  return {
    id: user.id,
    name: String(user.user_metadata?.display_name || user.email || "创作者"),
    email: user.email || "",
    provider: "supabase",
    isAnonymous: Boolean(user.is_anonymous),
    role: String(appMetadata.role || user.user_metadata?.role || "user").toLowerCase(),
    appMetadata,
    createdAt: user.created_at || new Date().toISOString()
  };
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
    state.user = stateUserFromSupabaseUser(data.session.user);
    await syncRemoteProductData();
    localStorage.removeItem(AUTH_RETURN_KEY);
    saveState(state);
    renderState(state);
  } else if (ENABLE_ANONYMOUS_TEST_MODE) {
    const anonymous = await supabase.auth.signInAnonymously().catch(() => null);
    if (anonymous?.data?.user) {
      state.user = stateUserFromSupabaseUser(anonymous.data.user);
      await syncRemoteProductData();
      saveState(state);
    }
    renderState(state);
  } else {
    renderState(state);
  }
}

function bindSupabaseAuthState() {
  if (!supabase || window.__ovsAuthStateBound) return;
  window.__ovsAuthStateBound = true;
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_OUT") {
      state.user = null;
      saveState(state);
      renderState(state);
      return;
    }
    if (session?.user) {
      state.user = stateUserFromSupabaseUser(session.user);
      await syncRemoteProductData();
      localStorage.removeItem(AUTH_RETURN_KEY);
      saveState(state);
      renderState(state);
    }
  });
}

async function syncRemoteProductData() {
  if (!supabase || !state.user?.id) return;
  const [profileResult, assetsResult, jobsResult, creditsResult, creditBalanceResult, sharesResult, charactersResult] = await Promise.all([
    supabase.from("profiles").select("display_name,email,role,account_status,credit_balance").eq("id", state.user.id).maybeSingle(),
    supabase.from("media_assets").select("*").eq("owner_user_id", state.user.id).is("deleted_at", null).order("updated_at", { ascending: false }).limit(80),
    supabase.from("generation_jobs").select("*").eq("user_id", state.user.id).order("created_at", { ascending: false }).limit(80),
    supabase.from("credit_transactions").select("id,balance_impact,status,operation_category,source_type,source_id,reason,created_at").eq("user_id", state.user.id).order("created_at", { ascending: false }).limit(100),
    supabase.from("credit_transactions").select("balance_impact,status").eq("user_id", state.user.id),
    supabase.from("share_links").select("*").eq("owner_user_id", state.user.id).eq("visibility_status", "active").is("revoked_at", null).order("created_at", { ascending: false }).limit(80),
    supabase.from("characters").select("*").eq("owner_user_id", state.user.id).is("archived_at", null).order("updated_at", { ascending: false }).limit(80)
  ]);
  if (!profileResult.error && profileResult.data) {
    state.user = {
      ...state.user,
      name: String(profileResult.data.display_name || state.user.name || "创作者"),
      email: String(profileResult.data.email || state.user.email || ""),
      role: String(profileResult.data.role || state.user.role || "user").toLowerCase(),
      accountStatus: String(profileResult.data.account_status || "active")
    };
    if (Number.isFinite(Number(profileResult.data.credit_balance))) {
      state.credits = Number(profileResult.data.credit_balance);
    }
  }
  if (!assetsResult.error && Array.isArray(assetsResult.data)) {
    state.assets = assetsResult.data.map(mapRemoteAsset);
    await attachRemoteAssetDownloadUrls(state.assets);
  }
  if (!jobsResult.error && Array.isArray(jobsResult.data)) {
    state.history = jobsResult.data.map(mapRemoteJob);
    enrichAssetsWithGenerationJobs();
  }
  if (!creditsResult.error && Array.isArray(creditsResult.data)) {
    state.creditLedger = creditsResult.data.map(mapRemoteCreditTransaction);
  }
  const balanceRows = !creditBalanceResult.error && Array.isArray(creditBalanceResult.data)
    ? creditBalanceResult.data
    : !creditsResult.error && Array.isArray(creditsResult.data)
      ? creditsResult.data
      : null;
  if (balanceRows) {
    state.credits = balanceRows
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
  if (!charactersResult.error && Array.isArray(charactersResult.data)) {
    state.characters = charactersResult.data.map(mapRemoteCharacter);
    if (!state.characters.some((character) => character.id === selectedCharacterId)) {
      selectedCharacterId = state.characters[0]?.id || selectedCharacterId;
    }
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
  await attachRemoteAssetDownloadUrls([asset]);
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
  const storageKey = String(asset.storage_key || asset.file_url || "").trim();
  const outputUrl = String(metadata.outputUrl || metadata.providerOutputUrl || "").trim();
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
    storageKey,
    outputUrl,
    contentType: String(metadata.storageContentType || asset.file_type || ""),
    provider: String(metadata.provider || ""),
    model: String(metadata.model || ""),
    ratio: String(metadata.aspectRatio || metadata.ratio || ""),
    durationSeconds: Number(metadata.durationSeconds || 0) || undefined,
    downloadUrl: outputUrl,
    previewUrl: outputUrl,
    remote: true
  };
}

function mapRemoteJob(job) {
  const inputParams = parseMaybeJson(job.input_params);
  const durationSeconds = Number(job.duration_seconds || inputParams.durationSeconds || 0) || undefined;
  return {
    id: String(job.id),
    type: job.media_type === "video" ? "video" : "image",
    title: job.media_type === "video" ? "生成视频场景" : "生成图片作品",
    prompt: String(job.prompt || ""),
    provider: String(job.provider || "fake_worker"),
    model: String(job.model || "local-demo"),
    status: String(job.status || "queued"),
    credits: Number(job.cost_credits || job.credit_charged || 0),
    duration: job.latency ? `${Math.round(Number(job.latency) / 1000)}s` : String(durationSeconds ? `${durationSeconds}s` : "等待中"),
    durationSeconds,
    ratio: String(job.aspect_ratio || inputParams.aspectRatio || ""),
    assetId: String(job.result_asset_id || ""),
    progress: Number(job.progress || 0),
    errorCode: String(job.error_code || ""),
    errorMessage: String(job.error_message || ""),
    refundAmount: Number(job.refund?.amount || 0),
    sourceAssetId: String(job.source_asset_id || inputParams.sourceAssetId || ""),
    remote: true
  };
}

function mapRemoteCreditTransaction(row) {
  return {
    id: String(row.id || `credit_${Date.now()}`),
    amount: Number(row.balance_impact || 0),
    category: String(row.operation_category || "credit"),
    status: String(row.status || "posted"),
    reason: String(row.reason || creditCategoryLabel(row.operation_category, row.balance_impact)),
    sourceType: String(row.source_type || ""),
    sourceId: String(row.source_id || ""),
    createdAt: String(row.created_at || new Date().toISOString()),
    remote: true
  };
}

function mapRemoteCharacter(character) {
  const tags = parseMaybeJson(character.tags_json);
  const memory = parseMaybeJson(character.memory_json);
  const safeTags = Array.isArray(tags) ? tags.map(String) : [];
  const score = Number(memory.consistencyScore || memory.score || 0);
  return {
    id: String(character.id),
    name: String(character.name || "未命名角色"),
    role: String(character.description || character.character_type || "角色"),
    tags: safeTags,
    score: Number.isFinite(score) && score > 0 ? score : 70,
    status: character.visibility_status === "archived" ? "archived" : character.consistency_status === "draft" ? "draft" : "active",
    favorite: Boolean(memory.favorite),
    consistencyStatus: String(character.consistency_status || "needs_review"),
    coverAsset: String(character.cover_asset_id || ""),
    referenceAsset: String(character.reference_asset_id || ""),
    memory: String(memory.summary || memory.notes || character.prompt_seed || character.description || "登录后保存的角色记忆。"),
    remote: true
  };
}

function recordCreditLedger(input) {
  state.creditLedger = Array.isArray(state.creditLedger) ? state.creditLedger : [];
  state.creditLedger.unshift({
    id: input.id || `credit_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    amount: Number(input.amount || 0),
    category: input.category || "local",
    status: input.status || "posted",
    reason: input.reason || creditCategoryLabel(input.category, input.amount),
    sourceType: input.sourceType || "local",
    sourceId: input.sourceId || "",
    createdAt: input.createdAt || new Date().toISOString(),
    remote: false
  });
  state.creditLedger = state.creditLedger.slice(0, 100);
}

function creditCategoryLabel(category, amount = 0) {
  const normalized = String(category || "").toLowerCase();
  if (normalized.includes("refund")) return "生成失败退款";
  if (normalized.includes("generation")) return Number(amount) < 0 ? "生成任务扣费" : "生成任务调整";
  if (normalized.includes("purchase")) return "购买积分到账";
  if (normalized.includes("reward") || normalized.includes("starter")) return "奖励积分到账";
  if (normalized.includes("admin")) return "后台积分调整";
  return Number(amount) >= 0 ? "积分增加" : "积分扣减";
}

function enrichAssetsWithGenerationJobs() {
  if (!Array.isArray(state.assets) || !Array.isArray(state.history)) return;
  state.assets = state.assets.map((asset) => {
    const job = state.history.find((entry) => entry.assetId && entry.assetId === asset.id);
    if (!job) return asset;
    return {
      ...asset,
      prompt: asset.prompt || job.prompt || "",
      credits: asset.credits || job.credits || 0,
      provider: asset.provider || job.provider || "",
      model: asset.model || job.model || "",
      ratio: asset.ratio || job.ratio || "",
      durationSeconds: asset.durationSeconds || job.durationSeconds,
      duration: asset.duration || job.duration
    };
  });
}

async function attachRemoteAssetDownloadUrls(assets) {
  if (!supabase || !Array.isArray(assets)) return;
  await Promise.all(assets.map(async (asset) => {
    if (!asset.remote || !asset.storageKey) return;
    try {
      const publicResult = supabase.storage.from(supabaseStorageBucket).getPublicUrl(asset.storageKey);
      if (publicResult?.data?.publicUrl) {
        asset.publicUrl = publicResult.data.publicUrl;
        asset.previewUrl = asset.previewUrl || publicResult.data.publicUrl;
      }
      const signed = await supabase.storage.from(supabaseStorageBucket).createSignedUrl(asset.storageKey, 3600);
      if (!signed.error && signed.data?.signedUrl) {
        asset.downloadUrl = signed.data.signedUrl;
        asset.previewUrl = signed.data.signedUrl;
      }
    } catch {
      asset.downloadUrl = asset.outputUrl || asset.publicUrl || asset.downloadUrl || "";
    }
  }));
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

function isRealAuthenticatedUser(user = state.user) {
  if (!user?.id) return false;
  if (String(user.id) === "user_demo") return false;
  if (String(user.provider || "").toLowerCase().includes("demo")) return false;
  return true;
}

function requireRealLoginForAction(reason = "protected-action", nextUrl = getCurrentAuthReturnTarget()) {
  if (isRealAuthenticatedUser(state.user)) return true;
  captureVideoGenerationDraft(reason);
  showSiteToast("真实保存、下载和分享需要登录；你也可以先试一次本地演示生成。");
  openUnlockModal(nextUrl);
  trackProductEvent("auth_required", { reason });
  return false;
}

const demoGenerationIntentKey = "ovs_demo_generation_intent_v1";

function enableOneDemoGeneration(nextUrl = getCurrentAuthReturnTarget()) {
  try {
    sessionStorage.setItem(demoGenerationIntentKey, String(Date.now()));
  } catch (_error) {
    return;
  }
  document.querySelector(".unlock-overlay")?.remove();
  showSiteToast("已开启一次演示生成：不扣积分，不保存到真实账户。");
  const generatorButton = document.querySelector("[data-generate]");
  if (generatorButton) {
    generatorButton.click();
    return;
  }
  window.location.href = nextUrl || "./zh/app/generate/";
}

function consumeDemoGenerationIntent() {
  let value = "";
  try {
    value = sessionStorage.getItem(demoGenerationIntentKey) || "";
    sessionStorage.removeItem(demoGenerationIntentKey);
  } catch (_error) {
    return false;
  }
  const createdAt = Number(value);
  return Number.isFinite(createdAt) && Date.now() - createdAt < 5 * 60 * 1000;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function renderState(current) {
  renderAccountNavigation(current);
  renderProtectedPageGate(current);
  renderDemoModeBanner(current);
  updateAdminNavigation(current);
  applyOAuthProviderState();
  document.querySelectorAll("[data-credit-balance]").forEach((node) => {
    node.textContent = String(current.credits);
  });
  document.querySelectorAll("[data-user-name]").forEach((node) => {
    node.textContent = current.user ? current.user.name : "访客创作者";
  });
  applyGenerationModelVisibility(current);
  updateVideoPreflight();
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
  document.body.classList.toggle("protected-signed-out", !isRealAuthenticatedUser(current.user));
  if (isRealAuthenticatedUser(current.user)) return;
  const main = document.querySelector("main");
  if (!main) return;
  main.insertAdjacentHTML("afterbegin", `
    <section class="protected-gate" data-protected-gate>
      <div>
        <p class="eyebrow">需要登录</p>
        <h2>登录后管理你的创作、资产和积分</h2>
        <p>这些页面只在真实登录后显示你的账户数据。未登录时只展示功能预览，不会伪装成你的作品或积分。</p>
      </div>
      <div class="protected-gate-actions">
        <a class="btn primary" href="./zh/login/" data-auth-modal>登录 / 注册</a>
        <a class="btn glass" href="./app.html">先浏览工具</a>
      </div>
    </section>
  `);
}

function isAdminActor(user) {
  const role = String(user?.role || user?.appMetadata?.role || user?.app_metadata?.role || "").toLowerCase();
  return role === "admin" || role === "operator";
}

function updateAdminNavigation(current) {
  const visible = isAdminActor(current.user);
  document.querySelectorAll("[data-admin-nav-link]").forEach((link) => {
    link.hidden = !visible;
    link.setAttribute("aria-hidden", visible ? "false" : "true");
  });
}

function renderDemoModeBanner(current) {
  const page = window.location.pathname.split("/").pop() || "index.html";
  const isAuthPage = ["signin.html", "reset-password.html", "share.html"].includes(page);
  const hasDemoSurface = Boolean(document.querySelector("[data-asset-list], [data-history-list], [data-dashboard-credits], [data-character-list], [data-dashboard-assets-list], [data-creation-work-list]"));
  const enabled = !isRealAuthenticatedUser(current.user) && !isAuthPage && hasDemoSurface;
  document.body.classList.toggle("demo-mode", enabled);
  document.querySelector("[data-demo-mode-banner]")?.remove();
  if (!enabled) return;
  const anchor = document.querySelector(".topbar") || document.querySelector(".side-rail");
  const markup = `
    <aside class="demo-mode-banner" data-demo-mode-banner role="status">
      <strong>演示模式</strong>
      <span>当前是功能预览，不是账户数据。登录后将读取真实 Supabase 昵称、积分、角色、资产、作品和生成任务。</span>
      <a href="./zh/login/" data-auth-modal>登录 / 注册</a>
    </aside>
  `;
  if (anchor) {
    anchor.insertAdjacentHTML("afterend", markup);
  } else {
    document.body.insertAdjacentHTML("afterbegin", markup);
  }
}

function normalizeAuthProvider(provider) {
  const normalized = String(provider || "google").toLowerCase();
  if (["google", "x", "discord", "telegram"].includes(normalized)) return normalized;
  return "google";
}

function oauthProviderLabel(provider) {
  return {
    google: "Google",
    x: "X",
    discord: "Discord",
    telegram: "Telegram"
  }[normalizeAuthProvider(provider)];
}

function isOAuthProviderReady(provider) {
  const normalized = normalizeAuthProvider(provider);
  if (normalized === "telegram") {
    return Boolean(oauthProviderFlags.telegram && telegramBotUsername && telegramAuthUrl);
  }
  return Boolean(oauthProviderFlags[normalized] && supabase);
}

function getOAuthBlockedMessage(provider) {
  const normalized = normalizeAuthProvider(provider);
  if (normalized === "telegram") {
    return "Telegram 登录正在配置中。需要 Telegram Bot、回调校验 URL 和 VITE_TELEGRAM_OAUTH_READY=true 后才会启用。请先使用邮箱登录。";
  }
  if (!supabase) {
    return "Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后，再完成 OAuth Provider 验证。";
  }
  return `${oauthProviderLabel(normalized)} 登录正在配置中。第三方 OAuth 回调验证完成并设置 readiness 开关后才会启用，请先使用邮箱登录。`;
}

function applyOAuthProviderState(scope = document) {
  scope.querySelectorAll("[data-auth-provider], [data-modal-auth-provider], [data-telegram-auth]").forEach((button) => {
    const provider = button.dataset.authProvider || button.dataset.modalAuthProvider || "telegram";
    const ready = isOAuthProviderReady(provider);
    button.dataset.oauthDisabled = ready ? "false" : "true";
    button.setAttribute("aria-disabled", ready ? "false" : "true");
    button.setAttribute("title", ready ? `${oauthProviderLabel(provider)} 登录已启用` : getOAuthBlockedMessage(provider));
    const status = button.querySelector("[data-oauth-status]");
    if (status) status.textContent = ready ? "可用" : "配置中";
  });
}

function showAuthMessage(message, tone = "info") {
  const target = document.querySelector("[data-auth-message]");
  if (!target) return;
  target.textContent = message;
  target.dataset.tone = tone;
}

function showAuthUrlMessage() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);
  const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");
  if (errorDescription) {
    showAuthMessage(errorDescription.replace(/\+/g, " "), "error");
    return;
  }
  if (hashParams.get("type") === "recovery") {
    showAuthMessage("请设置一个新的账户密码。", "success");
  }
}

function getOAuthReadiness() {
  return [
    { name: "Google", provider: "google", ready: isOAuthProviderReady("google"), action: "Supabase Authentication > Providers > Google，填写 Client ID / Secret，配置回调 URL，并将 VITE_GOOGLE_OAUTH_READY 设为 true。" },
    { name: "X", provider: "x", ready: isOAuthProviderReady("x"), action: "Supabase Authentication > Providers > X / Twitter OAuth 2.0，填写 Client ID / Secret，确认 provider=x，并将 VITE_X_OAUTH_READY 设为 true。" },
    { name: "Telegram", provider: "telegram", ready: isOAuthProviderReady("telegram"), action: "Telegram 不是 Supabase 内置 OAuth；需配置 Telegram Login Widget、后端签名校验 URL，并将 VITE_TELEGRAM_OAUTH_READY 设为 true。" },
    { name: "Discord", provider: "discord", ready: isOAuthProviderReady("discord"), action: "Supabase Authentication > Providers > Discord，填写 Client ID / Secret，验证回调 URL，并将 VITE_DISCORD_OAUTH_READY 设为 true。" }
  ];
}

function renderOAuthReadiness() {
  const target = document.querySelector("[data-oauth-readiness]");
  if (!target) return;
  target.innerHTML = getOAuthReadiness().map((item) => `
    <article class="oauth-readiness-row">
      <span class="status-dot ${item.ready ? "ready" : "blocked"}"></span>
      <div><strong>${item.name}</strong><p>${escapeHtml(item.action)}</p></div>
      <em>${item.ready ? "已验证可用" : "配置中"}</em>
    </article>
  `).join("");
}

document.querySelectorAll("[data-auth-provider]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    captureVideoGenerationDraft("social-auth");
    const provider = button.dataset.authProvider || "google";
    if (!isOAuthProviderReady(provider)) {
      showAuthMessage(getOAuthBlockedMessage(provider), "error");
      trackProductEvent("auth_provider_blocked", { method: provider, reason: "provider_not_verified" });
      return;
    }
    if (!supabase) {
      showAuthMessage("Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可启用真实社交登录。", "error");
      return;
    }
    const returnTarget = persistAuthReturnTarget(getRequestedAuthReturnTarget("dashboard.html"));
    trackProductEvent("auth_method_selected", {
      method: provider,
      returnTarget
    });
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: getAuthRedirectUrl(returnTarget) } });
    if (error) showAuthMessage(error.message, "error");
  });
});

document.querySelectorAll("[data-telegram-auth]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    captureVideoGenerationDraft("telegram-auth");
    persistAuthReturnTarget(getRequestedAuthReturnTarget("dashboard.html"));
    if (!isOAuthProviderReady("telegram")) {
      showAuthMessage(getOAuthBlockedMessage("telegram"), "error");
      trackProductEvent("auth_provider_blocked", { method: "telegram", reason: "provider_not_verified" });
      return;
    }
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
    const authHref = authModalLink.getAttribute("href") || "";
    const explicitNext = authModalLink.dataset.nextUrl || "";
    const defaultNext = explicitNext || (/(?:login|signin)/.test(authHref) ? "./zh/dashboard/" : authHref || getCurrentAuthReturnTarget());
    openAuthModal(defaultNext);
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
      captureVideoGenerationDraft("tool-gate");
      openUnlockModal(getCurrentAuthReturnTarget());
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
      <span class="support-avatar"><img src="./brand/luravyn-icon.png" alt=""></span>
      <h2>需要帮助？</h2>
      <p>这里是 Luravyn 的快速帮助入口。真实客服系统接入前，先提供常用路径。</p>
      <div class="support-links">
        <a href="./zh/app/image-editor/">打开图片工具</a>
        <a href="./zh/app/image-to-video/">打开视频工具</a>
        <a href="./zh/pricing/">查看积分套餐</a>
        <a href="./zh/free-coins/">领取免费积分</a>
        <a href="mailto:support@luravyn.com">联系支持</a>
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
  captureVideoGenerationDraft("auth-modal");
  const returnTarget = persistAuthReturnTarget(nextUrl);
  document.querySelector(".auth-overlay")?.remove();
  const overlay = document.createElement("section");
  overlay.className = "auth-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "登录 Luravyn");
  overlay.innerHTML = `
    <div class="login-modal-card auth-popup-card">
      <button class="checkin-close" type="button" aria-label="关闭">×</button>
      <h1>登录到 Luravyn</h1>
      <p class="muted">使用社交账号继续创作。登录后可以保存作品、领取免费积分、购买积分并管理分享链接。</p>
      <div class="modal-auth-list">
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="google" data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot google-dot">G</span>使用 Google 登录 <em data-oauth-status>配置中</em></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="x" data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot x-dot">X</span>使用 X 登录 <em data-oauth-status>配置中</em></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="telegram" data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot tg-dot">TG</span>使用 Telegram 登录 <em data-oauth-status>配置中</em></button>
        <button class="modal-auth-btn" type="button" data-modal-auth-provider="discord" data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot dc-dot">DC</span>使用 Discord 登录 <em data-oauth-status>配置中</em></button>
      </div>
      <p class="auth-message" data-auth-message>配置 Supabase OAuth 后，Google / X / Discord 会进行真实登录；Telegram 需要配置 Bot 和回调校验。</p>
      <p class="login-terms">继续即表示你同意我们的 <a href="./zh/terms/">服务条款</a> 和 <a href="./zh/privacy/">隐私政策</a>。</p>
    </div>
  `;
  document.body.append(overlay);
  applyOAuthProviderState(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

async function startSocialAuth(provider, nextUrl = "./zh/dashboard/") {
  captureVideoGenerationDraft("modal-social-auth");
  const returnTarget = persistAuthReturnTarget(nextUrl);
  const normalizedProvider = normalizeAuthProvider(provider);
  const message = document.querySelector(".auth-overlay [data-auth-message]") || document.querySelector("[data-auth-message]");
  const setMessage = (text, tone = "error") => {
    if (!message) return;
    message.textContent = text;
    message.dataset.tone = tone;
  };
  if (!isOAuthProviderReady(normalizedProvider)) {
    setMessage(getOAuthBlockedMessage(normalizedProvider));
    trackProductEvent("auth_provider_blocked", { method: normalizedProvider, reason: "provider_not_verified" });
    return;
  }
  if (normalizedProvider === "telegram") {
    if (!telegramBotUsername || !telegramAuthUrl) {
      setMessage("Telegram 登录需要先配置 VITE_TELEGRAM_BOT_USERNAME 和 VITE_TELEGRAM_AUTH_URL。");
      return;
    }
    setMessage("请使用独立登录页完成 Telegram Widget 授权。", "success");
    window.location.href = `./zh/login/?next=${encodeURIComponent(returnTarget)}`;
    return;
  }
  if (!supabase) {
    setMessage("Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可启用真实社交登录。");
    return;
  }
  const redirectTo = getAuthRedirectUrl(returnTarget);
  const { error } = await supabase.auth.signInWithOAuth({ provider: normalizedProvider, options: { redirectTo } });
  if (error) setMessage(error.message);
}

function runToolDemoGeneration() {
  const demoGeneration = !isRealAuthenticatedUser(state.user) && consumeDemoGenerationIntent();
  if (!demoGeneration && !requireRealLoginForAction("tool-demo-generation", getCurrentAuthReturnTarget())) return;
  const status = document.querySelector("[data-tool-demo-status]");
  const preview = document.querySelector("[data-tool-demo-preview]");
  const prompt = document.querySelector("[data-tool-prompt]")?.value.trim() || "AI 工具演示生成";
  const cost = 8;
  if (!demoGeneration && state.credits < cost) {
    if (status) status.innerHTML = `<strong>积分不足</strong><span>请先购买积分后继续生成。</span>`;
    return;
  }
  if (!demoGeneration) state.credits -= cost;
  const id = `asset_${Date.now()}`;
  const toolName = document.querySelector(".tool-detail-copy h1")?.textContent?.trim() || "AI 工具";
  const asset = { id, type: "image", title: `${toolName} 演示结果`, prompt, character: "Mira", credits: demoGeneration ? 0 : cost, status: "completed", visibility: "private", favorite: false, demo: demoGeneration };
  const job = { id: `job_${Date.now()}`, type: "image", title: asset.title, prompt, provider: demoGeneration ? "demo_preview" : "local_api", model: demoGeneration ? "browser-tool-preview" : "local-tool-demo-v0", status: "completed", credits: demoGeneration ? 0 : cost, duration: "9s", assetId: id, demo: demoGeneration };
  if (!demoGeneration) {
    recordCreditLedger({
      amount: -cost,
      category: "generation",
      reason: `${toolName} 演示生成扣费`,
      sourceType: "generation_job",
      sourceId: job.id
    });
  }
  state.assets.unshift(asset);
  state.history.unshift(job);
  saveState(state);
  if (preview) {
    preview.classList.remove("art-7");
    preview.classList.add("art-3");
  }
  if (status) {
    status.innerHTML = demoGeneration
      ? `<strong>已生成演示结果</strong><span>未扣积分，结果只保存在当前浏览器。登录后可真实保存和分享。</span><a href="./zh/login/">登录 / 注册</a>`
      : `<strong>已生成演示结果</strong><span>消耗 ${cost} 积分，已保存到资产库和生成任务。</span><a href="./zh/assets/">查看资产</a>`;
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
  captureVideoGenerationDraft("unlock-modal");
  const returnTarget = persistAuthReturnTarget(nextUrl);
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
      <p>真实生成会保存结果、复用资产、管理积分，并继续打开这个创作工具。你也可以先跑一次本地演示。</p>
      <div class="unlock-auth-list">
        <a href="./zh/login/?next=${encodeURIComponent(returnTarget)}" data-auth-modal data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot email-dot">@</span>邮箱登录 / 注册 <b>→</b></a>
        <button type="button" data-unlock-auth="google" data-modal-auth-provider="google" data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot google-dot">G</span>使用 Google 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="x" data-modal-auth-provider="x" data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot x-dot">X</span>使用 X 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="telegram" data-modal-auth-provider="telegram" data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot tg-dot">TG</span>使用 Telegram 登录 <b>→</b></button>
        <button type="button" data-unlock-auth="discord" data-modal-auth-provider="discord" data-next-url="${escapeHtml(returnTarget)}"><span class="provider-dot dc-dot">DC</span>使用 Discord 登录 <b>→</b></button>
      </div>
      <p class="auth-message" data-auth-message>社交登录需要 Supabase OAuth 配置；邮箱登录可作为稳定入口。</p>
      <button class="unlock-demo-button" type="button" data-demo-generate>先试一次演示生成</button>
      <p class="unlock-demo-note">演示结果只保存在当前浏览器，不扣积分，不进入真实资产库，登录后才能真实保存、下载和分享。</p>
      <a class="btn primary full" href="./zh/pricing/">查看积分套餐</a>
    </div>
  `;
  document.body.append(overlay);
  overlay.querySelector(".checkin-close")?.addEventListener("click", () => overlay.remove());
  overlay.querySelector("[data-demo-generate]")?.addEventListener("click", () => enableOneDemoGeneration(returnTarget));
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
  overlay.setAttribute("aria-label", "每日奖励");
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
    recordCreditLedger({
      amount: reward,
      category: "reward",
      reason: `每日奖励 Day ${currentDay + 1}`,
      sourceType: "daily_checkin",
      sourceId: today
    });
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
      state.user = stateUserFromSupabaseUser(result.data.user);
      saveState(state);
    }
    trackProductEvent(mode === "signup" ? "signup_completed" : "signin_completed", {
      method: "email",
      hasUser: Boolean(result.data.user)
    });
    showAuthMessage(mode === "signup" ? "账户已创建。如开启邮箱验证，请检查邮件。" : "登录成功。", "success");
    window.location.href = getAuthRedirectUrl(getRequestedAuthReturnTarget("dashboard.html"));
  });
});

document.querySelectorAll("[data-email-auth-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.querySelector('[data-email-auth="signin"]')?.click();
  });
});

document.querySelectorAll("[data-password-reset-request]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const email = document.querySelector("[data-auth-email]")?.value.trim();
    if (!email) {
      showAuthMessage("请先输入邮箱。", "error");
      return;
    }
    if (!supabase) {
      showAuthMessage("Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可发送重置邮件。", "error");
      return;
    }
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "正在发送...";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetRedirectUrl()
    });
    button.disabled = false;
    button.textContent = originalLabel || "忘记密码？发送重置邮件";
    if (error) {
      showAuthMessage(error.message, "error");
      return;
    }
    trackProductEvent("password_reset_requested", { method: "email" });
    showAuthMessage("密码重置邮件已发送。请打开邮件里的链接设置新密码。", "success");
  });
});

document.querySelectorAll("[data-password-update-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.querySelector("[data-password-update]")?.click();
  });
});

document.querySelectorAll("[data-password-update]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.preventDefault();
    const password = document.querySelector("[data-new-password]")?.value || "";
    const confirmation = document.querySelector("[data-confirm-password]")?.value || "";
    if (!password || !confirmation) {
      showAuthMessage("请填写并确认新密码。", "error");
      return;
    }
    if (password.length < 8) {
      showAuthMessage("新密码至少需要 8 位。", "error");
      return;
    }
    if (password !== confirmation) {
      showAuthMessage("两次输入的密码不一致。", "error");
      return;
    }
    if (!supabase) {
      showAuthMessage("Supabase 尚未配置。添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后即可更新密码。", "error");
      return;
    }
    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = "正在更新...";
    const { data, error } = await supabase.auth.updateUser({ password });
    button.disabled = false;
    button.textContent = originalLabel || "更新密码";
    if (error) {
      showAuthMessage(error.message, "error");
      return;
    }
    if (data.user) {
      state.user = stateUserFromSupabaseUser(data.user);
      saveState(state);
    }
    trackProductEvent("password_updated", { method: "email" });
    showAuthMessage("密码已更新。正在进入控制台。", "success");
    window.setTimeout(() => {
      window.location.href = getAuthRedirectUrl(getRequestedAuthReturnTarget("dashboard.html"));
    }, 700);
  });
});

document.querySelectorAll("[data-buy-credits]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const credits = Number(button.dataset.buyCredits || "0");
    const planName = button.dataset.planName || button.textContent.trim() || "积分套餐";
    const price = button.querySelector("strong")?.textContent?.trim() || button.dataset.planPrice || "演示结账";
    trackProductEvent("pricing_cta_clicked", {
      credits,
      planName,
      price
    });
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
    recordCreditLedger({
      amount: credits,
      category: "reward",
      reason: "免费积分任务奖励",
      sourceType: "reward_task",
      sourceId: task
    });
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
  trackProductEvent("credit_purchase_started", {
    credits,
    planName,
    price,
    promo: Boolean(promo)
  });
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
        ${PAYMENT_PROVIDERS.map((provider, index) => `
          <button class="${index === 0 ? "active" : ""}" type="button" data-checkout-method="${provider.id}">
            <span>${escapeHtml(provider.label)}</span>
            <small>${provider.configured ? "已配置" : "待配置"}</small>
          </button>
        `).join("")}
      </div>
      <p class="checkout-note">${signedIn ? "Stripe / PayPal 已预接入。账号密钥未配置时会进入演示结账，不会产生真实扣款。" : "登录后可同步账户积分。未登录时仅能查看演示结账状态。"}</p>
      <div class="checkout-actions">
        <button class="btn primary full" type="button" data-confirm-checkout>创建结账</button>
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
      const provider = PAYMENT_PROVIDERS.find((item) => item.id === button.dataset.checkoutMethod);
      overlay.querySelector(".checkout-note").textContent = provider?.configured
        ? `${provider.label} 已有前端配置，将尝试创建真实结账会话。`
        : `${provider?.label || "支付方式"} 入口已准备好，但账号密钥还未配置；当前只会走演示模式。`;
    });
  });
  overlay.querySelector("[data-confirm-checkout]")?.addEventListener("click", async () => {
    const confirmButton = overlay.querySelector("[data-confirm-checkout]");
    const method = overlay.querySelector("[data-checkout-method].active")?.dataset.checkoutMethod || "paypal";
    trackProductEvent("credit_purchase_confirmed", {
      provider: method,
      credits,
      planName,
      amountCents: parsePriceToCents(price)
    });
    confirmButton.disabled = true;
    confirmButton.textContent = "正在创建结账";
    try {
      const checkout = await runRemotePaymentCheckout({
        provider: method,
        credits,
        planName,
        amountCents: parsePriceToCents(price)
      });
      if (checkout?.checkoutUrl) {
        trackProductEvent("payment_checkout_created", {
          provider: method,
          credits,
          hasCheckoutUrl: true
        });
        overlay.querySelector(".checkout-note").textContent = "真实结账会话已创建，正在跳转到支付页面。";
        window.location.href = checkout.checkoutUrl;
        return;
      }
    } catch (error) {
      overlay.querySelector(".checkout-note").textContent = `${error.message || "真实支付暂不可用"}。当前账号未完成支付配置，下面会切换到演示结账。`;
    }
    try {
      confirmButton.textContent = "正在发放演示积分";
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
        trackProductEvent("credit_purchase_completed", {
          provider: method,
          credits,
          fulfillment: "remote_demo"
        });
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
    const localOrderId = `order_${Date.now()}`;
    recordCreditLedger({
      amount: credits,
      category: "purchase",
      reason: `${planName} 演示购买到账`,
      sourceType: "order",
      sourceId: localOrderId
    });
    state.orders = [
      {
        id: localOrderId,
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
    trackProductEvent("credit_purchase_completed", {
      provider: method,
      credits,
      fulfillment: "local_demo"
    });
    overlay.querySelector("[data-confirm-checkout]").textContent = `已到账 ${credits} 积分`;
    overlay.querySelector(".checkout-note").textContent = "演示积分已进入余额。真实支付 API 接入前不会产生扣款。";
    window.setTimeout(() => {
      window.location.href = "./zh/dashboard/";
    }, 650);
  });
}

async function runRemotePaymentCheckout(input) {
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) return null;
  const result = await invokeAi("create-payment-checkout", {
    provider: input.provider,
    credits: input.credits,
    planName: input.planName,
    amountCents: input.amountCents,
    currency: "USD",
    returnUrl: new URL("./zh/dashboard/", window.location.href).href,
    cancelUrl: new URL("./zh/pricing/", window.location.href).href
  });
  return result || null;
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
const generateVideoButton = document.querySelector("[data-generate-video]");
const enhanceButton = document.querySelector("[data-enhance]");
const promptBox = document.querySelector(".hero-textarea");

const modeCosts = { image: 8, video: 24, character: 12 };
const videoWorkflowPresets = {
  "image-video": {
    title: "图片转视频",
    description: "上传一张角色、商品或场景图，生成可保存、可下载、可分享的短视频资产。",
    summary: "图生视频 · 24 积分起",
    detail: "支持 16:9、9:16、1:1；5秒 / 10秒；结果自动进入生成任务和我的作品。",
    prompt: "将这张图转换成 5 秒电影感短视频，镜头缓慢推进，主体保持清晰，灯光高级，适合发布到社媒。",
    ratio: "16:9",
    duration: "5",
    model: "zealman_workflow",
    cost: 24,
    preview: "16:9 · 5秒 · 可用测试生成",
    art: "art-7"
  },
  "product-teaser": {
    title: "产品短片",
    description: "为商品图生成广告感短片，自动强化主体展示、镜头推进、字幕节奏和品牌氛围。",
    summary: "产品广告 · 32 积分起",
    detail: "默认 10 秒、16:9 或 1:1，适合商品主视觉、新品发布和电商广告。",
    prompt: "把这张商品图生成 10 秒产品广告短片，镜头从产品细节缓慢推进到完整主体，加入高级棚拍灯光、干净背景、品牌发布感和可放置字幕的留白区域。",
    ratio: "16:9",
    duration: "10",
    model: "zealman_workflow",
    cost: 32,
    preview: "16:9 · 10秒 · 产品广告预设",
    art: "art-1"
  },
  "social-reel": {
    title: "社媒竖屏视频",
    description: "为 TikTok、Reels 和 Shorts 自动设置 9:16、强开场运镜和短视频节奏。",
    summary: "社媒短视频 · 28 积分起",
    detail: "默认 9:16、5 秒强开场，适合广告测试、创作者内容和爆款封面动效。",
    prompt: "把这张图片生成 5 秒 9:16 竖屏短视频，前 2 秒有强视觉开场，镜头轻微推进，主体保持稳定，节奏适合 TikTok、Reels 和 Shorts。",
    ratio: "9:16",
    duration: "5",
    model: "zealman_workflow",
    cost: 28,
    preview: "9:16 · 5秒 · 社媒竖屏预设",
    art: "art-13"
  },
  "adult-effects": {
    title: "成人特效（已满18岁）",
    description: "仅处理成年、虚构或已获授权的合规素材；禁止未成年人、真人色情换脸、名人色情和非自愿亲密内容。",
    summary: "Wan 2.2 4in1 · 32 积分起",
    detail: "默认 5 秒、16:9；提交前必须确认年满18岁并同意平台内容规则。",
    prompt: "对这张成年且已获授权的虚构角色图片生成合规的电影感动作短片，保持人物身份和服装连续，不涉及未成年人、真人色情换脸或非自愿内容。",
    ratio: "16:9",
    duration: "5",
    model: "zealman_workflow",
    cost: 32,
    preview: "16:9 · 5秒 · 成人合规预设",
    art: "art-13"
  },
  "movie-closeup": {
    title: "电影近景特效",
    description: "使用 Wan 2.2 电影近景工作流制作合规的电影感近景镜头。",
    summary: "电影近景 · 28 积分起",
    detail: "默认 5 秒、16:9；适合角色表情、镜头推进和氛围测试。",
    prompt: "将这张成年且已获授权的角色图生成 5 秒电影近景短片，镜头缓慢推进，保持脸部和服装一致，电影级灯光与景深。",
    ratio: "16:9",
    duration: "5",
    model: "zealman_workflow",
    cost: 28,
    preview: "16:9 · 5秒 · 电影近景预设",
    art: "art-1"
  }
};

const videoEffectLabels = {
  "image-video": "通用图片转视频",
  "adult-effects": "服装变化特效（成年人/已授权）",
  "movie-closeup": "电影近景特效",
  "social-reel": "社媒竖屏动作"
};

function openVideoEffectPicker() {
  const overlay = document.querySelector("[data-video-effect-picker]");
  if (!overlay) return;
  overlay.hidden = false;
  document.body.classList.add("modal-open");
}

function closeVideoEffectPicker() {
  const overlay = document.querySelector("[data-video-effect-picker]");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("modal-open");
}

function setupVideoEffectPicker() {
  document.querySelector("[data-open-video-effect-picker]")?.addEventListener("click", openVideoEffectPicker);
  document.querySelector("[data-close-video-effect-picker]")?.addEventListener("click", closeVideoEffectPicker);
  document.querySelector("[data-video-effect-picker]")?.addEventListener("click", (event) => {
    if (event.target?.matches("[data-video-effect-picker]")) closeVideoEffectPicker();
  });
  document.querySelectorAll("[data-video-effect-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.videoEffectFilter || "all";
      document.querySelectorAll("[data-video-effect-filter]").forEach((item) => item.classList.toggle("active", item === button));
      document.querySelectorAll("[data-video-effect-choice]").forEach((card) => {
        const tags = String(card.dataset.videoEffectTags || "").split(/\s+/);
        card.hidden = filter !== "all" && !tags.includes(filter);
      });
    });
  });
  document.querySelectorAll("[data-video-effect-choice]").forEach((card) => {
    card.addEventListener("click", () => {
      const presetId = card.dataset.videoEffectChoice || "image-video";
      applyVideoPreset(presetId, { updateUrl: true });
      closeVideoEffectPicker();
    });
  });
}

function applyGenerationModelVisibility(current = state) {
  document.querySelectorAll("[data-video-model]").forEach((select) => {
    const isAdmin = isAdminActor(current.user);
    const fakeOption = Array.from(select.options).find((option) => option.value === "fake_worker");
    if (!isAdmin && fakeOption) fakeOption.remove();
    if (isAdmin && !fakeOption) {
      const option = document.createElement("option");
      option.value = "fake_worker";
      option.textContent = "Fake Worker 内部测试";
      select.prepend(option);
    }
    const hasSelected = Array.from(select.options).some((option) => option.value === select.value);
    if (!hasSelected || (!isAdmin && ["fake_worker", "local_api"].includes(select.value))) {
      select.value = Array.from(select.options).find((option) => option.value === "qianwen_generation")?.value || select.options[0]?.value || "";
    }
  });
}

let selectedVideoReference = null;
let videoAssetPickerSearch = "";
let videoAssetPickerFilter = "all";

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const preset = button.dataset.videoPresetButton;
    if (preset) {
      applyVideoPreset(preset, { updateUrl: true });
      return;
    }
    modeButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const mode = button.dataset.mode || "image";
    const cost = Number(button.dataset.videoCost || modeCosts[mode] || 8);
    if (costTarget) costTarget.textContent = `${cost} 积分`;
    if (modeTarget) {
      modeTarget.textContent = mode === "video" ? "视频生成" : mode === "character" ? "角色生成" : "图片生成";
    }
  });
});

applyInitialVideoPreset();

function applyInitialVideoPreset() {
  if (!document.querySelector("[data-video-generator]")) return;
  applyGenerationModelVisibility(state);
  const pageName = window.location.pathname.split("/").pop() || "";
  const defaultPreset = pageName === "undress-video.html" ? "adult-effects" : "image-video";
  const preset = new URLSearchParams(window.location.search).get("preset") || defaultPreset;
  applyVideoPreset(videoWorkflowPresets[preset] ? preset : defaultPreset, { updateUrl: false });
  setupVideoEffectPicker();
  document.querySelectorAll("[data-video-ratio], [data-video-duration], [data-video-model]").forEach((input) => {
    input.addEventListener("change", updateVideoEstimateFromControls);
  });
  document.querySelector("[data-mobile-generate]")?.addEventListener("click", () => generateButton?.click());
  document.querySelector("[data-video-upload]")?.addEventListener("change", handleVideoReferenceUpload);
  document.querySelector("[data-video-camera-upload]")?.addEventListener("change", handleVideoReferenceUpload);
  document.querySelector("[data-replace-video-reference]")?.addEventListener("click", () => {
    document.querySelector("[data-video-upload]")?.click();
  });
  document.querySelector("[data-clear-video-reference]")?.addEventListener("click", clearVideoReference);
  document.querySelector("[data-open-asset-picker]")?.addEventListener("click", openVideoAssetPicker);
  document.querySelector("[data-close-asset-picker]")?.addEventListener("click", closeVideoAssetPicker);
  document.querySelector("[data-asset-picker]")?.addEventListener("click", (event) => {
    if (event.target?.matches("[data-asset-picker]")) closeVideoAssetPicker();
  });
  document.querySelector("[data-video-asset-search]")?.addEventListener("input", (event) => {
    videoAssetPickerSearch = event.currentTarget.value.trim().toLowerCase();
    renderVideoAssetPickerOptions();
  });
  document.querySelectorAll("[data-video-asset-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      videoAssetPickerFilter = button.dataset.videoAssetFilter || "all";
      renderVideoAssetPickerOptions();
    });
  });
  document.querySelector("[data-trigger-reference-upload]")?.addEventListener("click", () => {
    closeVideoAssetPicker();
    document.querySelector("[data-video-upload]")?.click();
  });
  document.querySelector("[data-picker-demo-reference]")?.addEventListener("click", () => {
    selectDemoVideoReference();
    closeVideoAssetPicker();
  });
  applyVideoSourceFromUrl();
  restoreVideoGenerationDraft();
  document.querySelectorAll("[data-demo-reference]").forEach((button) => {
    button.addEventListener("click", selectDemoVideoReference);
  });
  updateVideoPreflight();
}

function selectDemoVideoReference() {
  const demoUrl = new URL("./home-assets/ovs-home-06.png", window.location.href).href;
  selectVideoReference({
    id: "demo-reference-image",
    title: "示例参考图",
    type: "image",
    prompt: "图片转视频示例参考图",
    character: "Mira",
    credits: 0,
    status: "ready",
    visibility: "private",
    favorite: false,
    previewUrl: demoUrl,
    sourceImageUrl: demoUrl,
    sourceType: "reference_image"
  }, { addToAssets: false });
  showSiteToast("已选择示例参考图。提交后会作为图片转视频首帧。");
}

function applyVideoSourceFromUrl() {
  const sourceId = new URLSearchParams(window.location.search).get("source");
  if (!sourceId) return;
  const asset = state.assets.find((item) => item.id === sourceId);
  if (!asset || asset.type === "video") return;
  const sourceImageUrl = getReferenceImageUrl(asset);
  selectVideoReference({
    ...asset,
    sourceAssetId: asset.remote ? asset.id : undefined,
    previewUrl: getAssetPreviewUrl(asset),
    sourceImageUrl
  }, { addToAssets: false });
}

function captureVideoGenerationDraft(reason = "auth") {
  const generator = document.querySelector("[data-video-generator]");
  if (!generator) return null;
  const preset = getActiveVideoPreset() || videoWorkflowPresets["image-video"];
  const reference = selectedVideoReference;
  const previewUrl = String(reference?.previewUrl || reference?.sourceImageUrl || "");
  const canRestoreReference = Boolean(reference) && !previewUrl.startsWith("blob:");
  const draft = {
    kind: "image-to-video",
    reason,
    savedAt: Date.now(),
    returnTarget: getCurrentAuthReturnTarget(),
    preset: preset?.id || "image-video",
    prompt: promptBox?.value || "",
    ratio: document.querySelector("[data-video-ratio]")?.value || preset?.ratio || "16:9",
    duration: document.querySelector("[data-video-duration]")?.value || String(preset?.duration || 5),
    model: document.querySelector("[data-video-model]")?.value || preset?.model || "fake_worker",
    reference: reference ? {
      id: reference.id || "",
      title: reference.title || reference.fileName || "参考图",
      type: reference.type || "image",
      prompt: reference.prompt || "",
      character: reference.character || "Mira",
      credits: Number(reference.credits || 0),
      status: reference.status || "ready",
      visibility: reference.visibility || "private",
      favorite: Boolean(reference.favorite),
      remote: Boolean(reference.remote),
      sourceAssetId: reference.sourceAssetId || (reference.remote ? reference.id : ""),
      sourceImageUrl: canRestoreReference ? reference.sourceImageUrl || previewUrl : "",
      previewUrl: canRestoreReference ? previewUrl : "",
      sourceType: reference.sourceType || "reference_image",
      needsReupload: !canRestoreReference
    } : null
  };
  localStorage.setItem(VIDEO_DRAFT_KEY, JSON.stringify(draft));
  generator.setAttribute("data-video-draft-saved", "true");
  return draft;
}

function restoreVideoGenerationDraft() {
  const generator = document.querySelector("[data-video-generator]");
  if (!generator) return false;
  const draft = parseMaybeJson(localStorage.getItem(VIDEO_DRAFT_KEY));
  if (draft.kind !== "image-to-video") return false;
  if (Date.now() - Number(draft.savedAt || 0) > 24 * 60 * 60 * 1000) {
    clearVideoGenerationDraft();
    return false;
  }
  if (draft.preset && !new URLSearchParams(window.location.search).has("preset")) {
    applyVideoPreset(videoWorkflowPresets[draft.preset] ? draft.preset : "image-video", { updateUrl: false });
  }
  if (promptBox && typeof draft.prompt === "string") promptBox.value = draft.prompt;
  const ratioInput = document.querySelector("[data-video-ratio]");
  const durationInput = document.querySelector("[data-video-duration]");
  const modelInput = document.querySelector("[data-video-model]");
  if (ratioInput && draft.ratio) ratioInput.value = normalizeVideoAspectRatio(draft.ratio);
  if (durationInput && draft.duration) durationInput.value = String(draft.duration);
  if (modelInput && draft.model) modelInput.value = String(draft.model);
  const hasSourceParam = new URLSearchParams(window.location.search).has("source");
  if (!selectedVideoReference && !hasSourceParam && draft.reference) {
    if (draft.reference.needsReupload) {
      setVideoUploadStatus("已恢复草稿，请重新选择本地参考图。", "idle");
    } else {
      selectVideoReference(draft.reference, { addToAssets: false, status: "已恢复登录前选择的参考图。" });
    }
  }
  generator.setAttribute("data-video-draft-restored", "true");
  clearVideoGenerationDraft();
  updateVideoEstimateFromControls();
  updateVideoPreflight();
  showSiteToast("已恢复登录前的生成草稿。");
  return true;
}

function clearVideoGenerationDraft() {
  localStorage.removeItem(VIDEO_DRAFT_KEY);
  document.querySelector("[data-video-generator]")?.removeAttribute("data-video-draft-saved");
}

function clearGenerationRecovery() {
  localStorage.removeItem(GENERATION_RECOVERY_KEY);
  localStorage.removeItem("ovs_retry_prompt");
}

function buildGenerationRecoveryReference(sourceAsset) {
  if (!sourceAsset || sourceAsset.type === "video") return null;
  const sourceImageUrl = getReferenceImageUrl(sourceAsset);
  const previewUrl = getAssetPreviewUrl(sourceAsset);
  const hasLocalBlob = [sourceImageUrl, previewUrl].some((value) => String(value || "").startsWith("blob:"));
  const needsReupload = hasLocalBlob || Boolean(sourceAsset.fileName && !sourceAsset.remote && !sourceAsset.sourceImageUrl && !sourceAsset.downloadUrl);
  return {
    id: sourceAsset.id,
    title: sourceAsset.title,
    type: sourceAsset.type || "image",
    prompt: sourceAsset.prompt || "",
    character: sourceAsset.character || "Mira",
    credits: Number(sourceAsset.credits || 0),
    status: sourceAsset.status || "ready",
    visibility: sourceAsset.visibility || "private",
    favorite: Boolean(sourceAsset.favorite),
    remote: Boolean(sourceAsset.remote),
    sourceAssetId: sourceAsset.remote ? sourceAsset.id : sourceAsset.sourceAssetId || "",
    sourceImageUrl: needsReupload ? "" : sourceImageUrl,
    previewUrl: needsReupload ? "" : previewUrl,
    sourceType: sourceAsset.sourceType || "reference_image",
    needsReupload
  };
}

function buildGenerationRecoveryFromJob(job) {
  if (!job) return null;
  const asset = state.assets.find((item) => item.id === job.assetId || item.id === job.sourceAssetId);
  const sourceAsset = state.assets.find((item) => item.id === job.sourceAssetId || item.id === job.referenceId) || asset || job.reference;
  return {
    kind: job.type === "video" ? "image-to-video" : "image-generation",
    source: "job",
    jobId: job.id,
    assetId: job.assetId || "",
    savedAt: Date.now(),
    title: job.title || "重新生成",
    prompt: job.prompt || "",
    ratio: job.ratio || sourceAsset?.ratio || "",
    durationSeconds: job.durationSeconds || sourceAsset?.durationSeconds || 0,
    model: job.model || "",
    provider: job.provider || "",
    preset: job.preset || (job.type === "video" ? "image-video" : ""),
    status: normalizeJobStatus(job.status),
    errorMessage: job.errorMessage || "",
    refundAmount: Number(job.refundAmount || 0),
    reference: buildGenerationRecoveryReference(sourceAsset)
  };
}

function buildGenerationRecoveryFromAsset(asset) {
  if (!asset) return null;
  const sourceAsset = state.assets.find((item) => item.id === asset.referenceId || item.id === asset.sourceAssetId);
  return {
    kind: asset.type === "video" ? "image-to-video" : "image-generation",
    source: "asset",
    assetId: asset.id,
    savedAt: Date.now(),
    title: asset.title || "重新生成",
    prompt: asset.prompt || "",
    ratio: asset.ratio || "",
    durationSeconds: asset.durationSeconds || 0,
    model: asset.model || "",
    provider: asset.provider || "",
    preset: asset.preset || (asset.type === "video" ? "social-reel" : ""),
    status: normalizeJobStatus(asset.status || "completed"),
    reference: buildGenerationRecoveryReference(sourceAsset || asset)
  };
}

function persistGenerationRecovery(recovery) {
  if (!recovery) return null;
  localStorage.setItem(GENERATION_RECOVERY_KEY, JSON.stringify(recovery));
  if (recovery.prompt) localStorage.setItem("ovs_retry_prompt", recovery.prompt);
  return recovery;
}

function applyGenerationRecovery() {
  if (!promptBox) return false;
  const recovery = parseMaybeJson(localStorage.getItem(GENERATION_RECOVERY_KEY));
  if (!recovery.kind) return false;
  if (Date.now() - Number(recovery.savedAt || 0) > 24 * 60 * 60 * 1000) {
    localStorage.removeItem(GENERATION_RECOVERY_KEY);
    return false;
  }
  promptBox.value = recovery.prompt || promptBox.value;
  if (document.querySelector("[data-video-generator]")) {
    if (recovery.preset && videoWorkflowPresets[recovery.preset]) {
      applyVideoPreset(recovery.preset, { updateUrl: false });
    }
    const ratioInput = document.querySelector("[data-video-ratio]");
    const durationInput = document.querySelector("[data-video-duration]");
    const modelInput = document.querySelector("[data-video-model]");
    if (ratioInput && recovery.ratio) ratioInput.value = normalizeVideoAspectRatio(recovery.ratio);
    if (durationInput && recovery.durationSeconds) durationInput.value = String(recovery.durationSeconds);
    if (modelInput && recovery.model && Array.from(modelInput.options).some((option) => option.value === recovery.model)) {
      modelInput.value = recovery.model;
    }
    if (!selectedVideoReference && recovery.reference?.id) {
      if (recovery.reference.needsReupload) {
        setVideoUploadStatus("已恢复上次任务，请重新选择本地参考图。", "idle");
      } else {
        selectVideoReference(recovery.reference, { addToAssets: false, status: "已恢复上次任务的参考图。" });
      }
    }
    updateVideoEstimateFromControls();
    updateVideoPreflight();
  }
  showGenerationRecoveryNotice(recovery);
  clearGenerationRecovery();
  return true;
}

function getGenerationRecoveryRoute(recovery) {
  return recovery?.kind === "image-to-video" ? "./zh/app/image-to-video/" : "./zh/app/generate/";
}

function renderJobRecoveryHint(job) {
  const status = normalizeJobStatus(job.status);
  if (!["failed", "cancelled", "canceled"].includes(status)) return "";
  const refundCopy = job.refundAmount
    ? `已退回 ${Number(job.refundAmount)} 积分`
    : "不会重复扣费，重新提交前会重新估算积分";
  const nextStep = job.type === "video" ? "保留视频参数和参考图继续生成" : "带回提示词重新生成";
  return `
    <div class="history-recovery-hint" data-history-recovery-hint>
      <strong>${statusLabel(status)}任务可恢复</strong>
      <span>${escapeHtml(refundCopy)} · ${escapeHtml(nextStep)}</span>
    </div>
  `;
}

function showGenerationRecoveryNotice(recovery) {
  const target = document.querySelector("[data-video-preflight]") || document.querySelector("[data-queue]") || document.querySelector(".studio-panel");
  if (!target) {
    showSiteToast("已恢复上次生成内容，可重新提交。");
    return;
  }
  document.querySelector("[data-generation-recovery-notice]")?.remove();
  const refundCopy = recovery.refundAmount ? `已退回 ${recovery.refundAmount} 积分。` : "没有检测到额外扣费。";
  const errorCopy = recovery.errorMessage ? `失败原因：${recovery.errorMessage}` : "你可以调整参数后重新提交。";
  const notice = document.createElement("article");
  notice.className = "generation-recovery-notice";
  notice.dataset.generationRecoveryNotice = "true";
  notice.innerHTML = `
    <div>
      <span>任务恢复</span>
      <strong>${escapeHtml(recovery.title || "已恢复上次生成")}</strong>
      <p>${escapeHtml(errorCopy)} ${escapeHtml(refundCopy)}</p>
    </div>
    <button class="btn glass" type="button" data-dismiss-recovery>知道了</button>
  `;
  target.before(notice);
}

async function handleVideoReferenceUpload(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showSiteToast("请上传图片文件作为视频参考图。");
    setVideoUploadStatus("请选择图片文件", "error");
    return;
  }
  const localPreviewUrl = URL.createObjectURL(file);
  const reference = {
    id: `reference_${Date.now()}`,
    type: "image",
    title: file.name.replace(/\.[^.]+$/, "") || "上传参考图",
    prompt: "用户上传的图片转视频参考图",
    character: "Mira",
    credits: 0,
    status: "ready",
    visibility: "private",
    favorite: false,
    previewUrl: localPreviewUrl,
    sourceType: "reference_image",
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    uploadStatus: supabase ? "本地已选择，正在上传到 Supabase。" : "本地演示可用，登录并配置 Supabase 后可远端保存。"
  };
  selectVideoReference(reference, { status: reference.uploadStatus });
  showSiteToast("参考图已选择，正在准备生成输入。");

  if (!supabase) {
    setVideoUploadStatus("本地可用", "ready");
    return;
  }
  setVideoUploadStatus("上传中", "uploading");
  try {
    const remoteReference = await uploadVideoReferenceToSupabase(file, reference);
    selectVideoReference(remoteReference, { status: "已上传到 Supabase Storage，可用于真实图片转视频。" });
    setVideoUploadStatus("已上传", "ready");
    showSiteToast("参考图已上传到 Supabase Storage，可用于真实图片转视频。");
  } catch (error) {
    reference.uploadStatus = `${error.message || "参考图上传失败"}，仍可使用本地演示生成。`;
    selectedVideoReference = reference;
    updateVideoReferenceCard(reference, reference.uploadStatus, "error");
    setVideoUploadStatus("上传失败，本地可用", "error");
    showSiteToast(`${error.message || "参考图上传失败"}，仍可使用本地演示生成。`);
  }
}

async function uploadVideoReferenceToSupabase(file, reference) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("请先登录后上传参考图。");
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "reference.png";
  const storageKey = `${user.id}/references/${Date.now()}-${safeName}`;
  const upload = await supabase.storage.from(supabaseStorageBucket).upload(storageKey, file, {
    contentType: file.type || "image/png",
    upsert: false
  });
  if (upload.error) throw new Error(upload.error.message || "Storage 上传失败。");
  const signed = await supabase.storage.from(supabaseStorageBucket).createSignedUrl(storageKey, 3600);
  const assetId = `ref_${Date.now()}`;
  const assetRecord = {
    id: assetId,
    user_id: user.id,
    owner_user_id: user.id,
    file_url: storageKey,
    file_type: "image",
    consent_confirmed: true,
    asset_type: "image",
    source_type: "reference_image",
    storage_key: storageKey,
    display_name: reference.title,
    tags_json: ["reference", "image-to-video"],
    metadata_json: {
      prompt: reference.prompt,
      source: "video_reference_upload",
      originalFileName: file.name,
      fileSize: file.size
    },
    processing_status: "ready",
    rights_status: "user_uploaded",
    moderation_status: "pending",
    visibility_status: "private"
  };
  const inserted = await supabase.from("media_assets").insert(assetRecord).select("*").single();
  if (inserted.error) throw new Error(inserted.error.message || "参考资产记录创建失败。");
  return {
    ...reference,
    id: String(inserted.data.id),
    remote: true,
    storageKey,
    sourceAssetId: String(inserted.data.id),
    sourceImageUrl: signed.data?.signedUrl || "",
    title: String(inserted.data.display_name || reference.title),
    uploadStatus: "已上传到 Supabase Storage，可用于真实图片转视频。"
  };
}

function selectVideoReference(reference, options = {}) {
  const normalizedReference = normalizeVideoReference(reference);
  selectedVideoReference = normalizedReference;
  const label = document.querySelector("[data-video-reference-label]");
  if (label) {
    label.textContent = `${normalizedReference.title || "参考图"} · ${normalizedReference.remote ? "已上传" : "本地可用"}`;
  }
  updateVideoReferenceCard(normalizedReference, options.status || normalizedReference.uploadStatus || (normalizedReference.remote ? "已上传到 Supabase Storage。" : "本地可用。"), normalizedReference.remote ? "ready" : "local");
  setVideoUploadStatus(normalizedReference.remote ? "已上传" : "已选择", normalizedReference.remote ? "ready" : "local");
  const preview = document.querySelector("[data-video-preview]");
  if (preview) {
    preview.classList.add("has-reference-preview");
    const previewUrl = getAssetPreviewUrl(normalizedReference);
    if (previewUrl) {
      preview.style.setProperty("--reference-image", `url("${previewUrl}")`);
    }
  }
  if (options.addToAssets !== false && !state.assets.some((asset) => asset.id === normalizedReference.id)) {
    state.assets.unshift({
      ...normalizedReference,
      status: "ready",
      visibility: "private",
      favorite: false
    });
    saveState(state);
    renderState(state);
  }
  updateVideoPreflight();
}

function normalizeVideoAspectRatio(ratio) {
  const value = String(ratio || "").trim();
  if (value === "9:16" || value === "vertical" || value === "1080x1920") return "9:16";
  if (value === "1:1" || value === "square" || value === "1024x1024") return "1:1";
  return "16:9";
}

function updateVideoPreviewRatio(ratio) {
  const preview = document.querySelector("[data-video-preview]");
  if (!preview) return;
  const normalized = normalizeVideoAspectRatio(ratio);
  preview.setAttribute("data-preview-ratio", normalized);
  preview.setAttribute("data-preview-orientation", normalized === "9:16" ? "vertical" : normalized === "1:1" ? "square" : "wide");
}

function updateVideoReferenceCard(reference, statusText = "", status = "local") {
  const card = document.querySelector("[data-video-reference-card]");
  if (!card) return;
  card.hidden = false;
  card.dataset.referenceStatus = status;
  const label = card.querySelector("[data-video-reference-label]");
  const meta = card.querySelector("[data-video-reference-meta]");
  const thumb = card.querySelector("[data-video-reference-thumb]");
  if (label) label.textContent = `${reference.title || reference.fileName || "参考图"} · ${reference.remote ? "远端已保存" : "本地参考"}`;
  const previewUrl = getAssetPreviewUrl(reference);
  if (thumb) {
    thumb.classList.toggle("has-reference-preview", Boolean(previewUrl));
    if (previewUrl) thumb.style.setProperty("--reference-image", `url("${previewUrl}")`);
    else thumb.style.removeProperty("--reference-image");
  }
  const detailParts = [
    reference.fileName || reference.title || "参考图",
    reference.fileSize ? formatFileSize(reference.fileSize) : "",
    statusText || reference.uploadStatus || ""
  ].filter(Boolean);
  if (meta) meta.textContent = detailParts.join(" · ");
  document.querySelector("[data-replace-video-reference]")?.removeAttribute("hidden");
  document.querySelector("[data-clear-video-reference]")?.removeAttribute("hidden");
}

function setVideoUploadStatus(message, status = "idle") {
  const target = document.querySelector("[data-video-upload-status]");
  if (!target) return;
  target.textContent = message;
  target.dataset.uploadStatus = status;
}

function clearVideoReference() {
  if (selectedVideoReference?.previewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(selectedVideoReference.previewUrl);
  }
  selectedVideoReference = null;
  document.querySelectorAll("[data-video-upload], [data-video-camera-upload]").forEach((input) => {
    input.value = "";
  });
  const label = document.querySelector("[data-video-reference-label]");
  if (label) label.textContent = "尚未选择参考图";
  const card = document.querySelector("[data-video-reference-card]");
  if (card) card.hidden = true;
  const thumb = document.querySelector("[data-video-reference-thumb]");
  if (thumb) {
    thumb.classList.remove("has-reference-preview");
    thumb.style.removeProperty("--reference-image");
  }
  document.querySelector("[data-replace-video-reference]")?.setAttribute("hidden", "");
  document.querySelector("[data-clear-video-reference]")?.setAttribute("hidden", "");
  setVideoUploadStatus("等待选择", "idle");
  const preview = document.querySelector("[data-video-preview]");
  if (preview) {
    preview.classList.remove("has-reference-preview");
    preview.style.removeProperty("--reference-image");
  }
  updateVideoPreflight();
  showSiteToast("已删除当前参考图。");
}

function formatFileSize(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function normalizeVideoReference(reference = {}) {
  const previewUrl = getAssetPreviewUrl(reference);
  const sourceImageUrl = getReferenceImageUrl(reference);
  return {
    ...reference,
    previewUrl,
    sourceImageUrl
  };
}

function getAssetPreviewUrl(asset = {}) {
  return [
    asset.previewUrl,
    asset.sourceImageUrl,
    asset.publicUrl,
    asset.downloadUrl,
    asset.outputUrl,
    asset.fileUrl,
    asset.file_url
  ].map((value) => String(value || "").trim()).find(isRenderableMediaUrl) || "";
}

function getReferenceImageUrl(asset = {}) {
  return [
    asset.sourceImageUrl,
    asset.previewUrl,
    asset.publicUrl,
    asset.downloadUrl,
    asset.outputUrl,
    asset.fileUrl,
    asset.file_url
  ].map((value) => String(value || "").trim()).find(isReferenceImageUrl) || "";
}

function isRenderableMediaUrl(value) {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("blob:") || value.startsWith("data:image/") || value.startsWith("./") || value.startsWith("/");
}

function isReferenceImageUrl(value) {
  if (!value) return false;
  if (value.startsWith("data:application/json")) return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("blob:") || value.startsWith("data:image/");
}

function openVideoAssetPicker() {
  const overlay = document.querySelector("[data-asset-picker]");
  if (!overlay) return;
  renderVideoAssetPickerOptions();
  overlay.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector("[data-video-asset-search]")?.focus();
}

function renderVideoAssetPickerOptions() {
  const list = document.querySelector("[data-video-asset-options]");
  if (!list) return;
  document.querySelectorAll("[data-video-asset-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.videoAssetFilter === videoAssetPickerFilter);
  });
  const imageAssets = getFilteredVideoAssetOptions();
  const allImageAssets = state.assets.filter((asset) => asset.type !== "video");
  list.innerHTML = imageAssets.length ? imageAssets.map((asset, index) => {
    const previewUrl = getAssetPreviewUrl(asset);
    const meta = [
      asset.favorite ? "收藏" : "",
      asset.visibility === "public" ? "公开" : "私密",
      asset.character ? `角色 ${asset.character}` : "",
      asset.remote ? "Supabase" : "本地"
    ].filter(Boolean).join(" · ");
    return `
    <button type="button" class="asset-picker-option" data-select-video-asset="${escapeHtml(asset.id)}">
      <span class="thumb ${["art-3", "art-8", "art-10", "art-12"][index % 4]} ${previewUrl ? "has-reference-preview" : ""}"${previewUrl ? ` style="--reference-image: url('${escapeHtml(previewUrl)}')"` : ""}></span>
      <span>
        <strong>${escapeHtml(asset.title)}</strong>
        <em>${escapeHtml(meta || "可作为图片转视频参考图")}</em>
        <small>${escapeHtml(asset.prompt || "可作为图片转视频参考图")}</small>
      </span>
    </button>
  `; }).join("") : `
    <article class="empty-state compact asset-picker-empty" data-asset-picker-empty>
      <h3>${allImageAssets.length ? "没有匹配的图片资产" : "还没有可选图片资产"}</h3>
      <p class="muted">${allImageAssets.length ? "换个关键词或筛选条件，也可以直接上传新参考图。" : "你可以先上传参考图，或使用示例图片开始。"}</p>
      <div class="row-actions">
        ${allImageAssets.length ? `<button type="button" data-clear-asset-picker-search>清除筛选</button>` : ""}
        <button type="button" data-trigger-reference-upload>上传新参考图</button>
        <button type="button" data-picker-demo-reference>使用示例图</button>
      </div>
    </article>
  `;
  list.querySelectorAll("[data-select-video-asset]").forEach((button) => {
    button.addEventListener("click", () => {
      const asset = state.assets.find((item) => item.id === button.dataset.selectVideoAsset);
      if (!asset) return;
      const sourceImageUrl = getReferenceImageUrl(asset);
      selectVideoReference({
        ...asset,
        sourceAssetId: asset.remote ? asset.id : undefined,
        previewUrl: getAssetPreviewUrl(asset),
        sourceImageUrl
      }, { addToAssets: false });
      closeVideoAssetPicker();
      showSiteToast(sourceImageUrl ? "已选择资产作为图片转视频参考图。" : "已选择资产。这个资产缺少真实图片地址，真实生成前可能需要重新上传。");
    });
  });
  list.querySelector("[data-clear-asset-picker-search]")?.addEventListener("click", () => {
    videoAssetPickerSearch = "";
    videoAssetPickerFilter = "all";
    const input = document.querySelector("[data-video-asset-search]");
    if (input) input.value = "";
    renderVideoAssetPickerOptions();
  });
  list.querySelector("[data-trigger-reference-upload]")?.addEventListener("click", () => {
    closeVideoAssetPicker();
    document.querySelector("[data-video-upload]")?.click();
  });
  list.querySelector("[data-picker-demo-reference]")?.addEventListener("click", () => {
    selectDemoVideoReference();
    closeVideoAssetPicker();
  });
}

function getFilteredVideoAssetOptions() {
  const assets = state.assets.filter((asset) => asset.type !== "video");
  const filtered = assets.filter((asset) => {
    const matchesFilter =
      videoAssetPickerFilter === "all" ||
      videoAssetPickerFilter === "recent" ||
      (videoAssetPickerFilter === "favorite" && asset.favorite) ||
      (videoAssetPickerFilter === "public" && asset.visibility === "public");
    const haystack = `${asset.title} ${asset.prompt} ${asset.character} ${asset.status} ${asset.visibility} ${asset.type}`.toLowerCase();
    return matchesFilter && (!videoAssetPickerSearch || haystack.includes(videoAssetPickerSearch));
  });
  return filtered.slice(0, videoAssetPickerFilter === "recent" ? 8 : 12);
}

function closeVideoAssetPicker() {
  const overlay = document.querySelector("[data-asset-picker]");
  if (overlay) overlay.hidden = true;
  document.body.classList.remove("modal-open");
}

function applyVideoPreset(presetId, options = {}) {
  const preset = videoWorkflowPresets[presetId] || videoWorkflowPresets["image-video"];
  if (!document.querySelector("[data-video-generator]")) return;
  modeButtons.forEach((item) => {
    item.classList.toggle("active", item.dataset.videoPresetButton === presetId);
  });
  document.querySelector("[data-video-preset-title]") && (document.querySelector("[data-video-preset-title]").textContent = preset.title);
  document.querySelector("[data-video-preset-description]") && (document.querySelector("[data-video-preset-description]").textContent = preset.description);
  const summary = document.querySelector("[data-video-preset-summary]");
  if (summary) {
    summary.innerHTML = `<span>当前预设</span><strong>${escapeHtml(preset.summary)}</strong><p>${escapeHtml(preset.detail)}</p>`;
  }
  const ratioInput = document.querySelector("[data-video-ratio]");
  const durationInput = document.querySelector("[data-video-duration]");
  const modelInput = document.querySelector("[data-video-model]");
  if (ratioInput) ratioInput.value = preset.ratio;
  if (durationInput) durationInput.value = preset.duration;
  if (modelInput) modelInput.value = preset.model;
  if (promptBox) promptBox.value = preset.prompt;
  const effectLabel = document.querySelector("[data-video-effect-label]");
  if (effectLabel) effectLabel.textContent = videoEffectLabels[presetId] || preset.title;
  const effectNote = document.querySelector("[data-video-effect-note]");
  if (effectNote) effectNote.textContent = presetId === "adult-effects"
    ? "仅允许成年人、虚构角色或已获授权素材；生成前请确认符合平台内容规则。"
    : "点击选择特效后，会在当前页面保留图片、参数和生成结果。";
  if (costTarget) costTarget.textContent = `${preset.cost} 积分`;
  if (modeTarget) modeTarget.textContent = preset.title;
  const preview = document.querySelector("[data-video-preview]");
  if (preview) {
    preview.classList.remove("art-1", "art-7", "art-13");
    preview.classList.add(preset.art);
  }
  updateVideoPreviewRatio(preset.ratio);
  const previewMeta = document.querySelector("[data-video-preview-meta]");
  if (previewMeta) previewMeta.textContent = preset.preview;
  const costNote = document.querySelector("[data-video-cost-note]");
  if (costNote) costNote.textContent = `预计消耗 ${preset.cost} 积分。结果会保存到生成任务、资产库和我的作品。`;
  if (options.updateUrl && window.history?.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.set("preset", presetId);
    window.history.replaceState(null, "", url);
  }
  updateVideoPreflight();
}

function updateVideoEstimateFromControls() {
  const preset = getActiveVideoPreset() || videoWorkflowPresets["image-video"];
  const duration = Number(document.querySelector("[data-video-duration]")?.value || preset.duration);
  const cost = Math.max(preset.cost, duration >= 10 ? preset.cost + 8 : preset.cost);
  const ratio = document.querySelector("[data-video-ratio]")?.value || preset.ratio;
  const model = document.querySelector("[data-video-model]")?.selectedOptions?.[0]?.textContent || preset.model;
  if (costTarget) costTarget.textContent = `${cost} 积分`;
  const previewMeta = document.querySelector("[data-video-preview-meta]");
  if (previewMeta) previewMeta.textContent = `${ratio} · ${duration}秒 · ${model}`;
  updateVideoPreviewRatio(ratio);
  const costNote = document.querySelector("[data-video-cost-note]");
  if (costNote) costNote.textContent = `预计消耗 ${cost} 积分。结果会保存到生成任务、资产库和我的作品。`;
  updateVideoPreflight();
}

function getActiveVideoPreset() {
  const button = document.querySelector("[data-video-preset-button].active");
  const id = button?.dataset.videoPresetButton || "";
  const preset = videoWorkflowPresets[id];
  if (!preset) return null;
  const duration = Number(document.querySelector("[data-video-duration]")?.value || preset.duration);
  return {
    ...preset,
    id,
    cost: Math.max(preset.cost, duration >= 10 ? preset.cost + 8 : preset.cost)
  };
}

function getVideoPreflightEstimate() {
  const preset = getActiveVideoPreset() || videoWorkflowPresets["image-video"];
  const ratio = document.querySelector("[data-video-ratio]")?.value || preset.ratio;
  const duration = Number(document.querySelector("[data-video-duration]")?.value || preset.duration);
  const modelInput = document.querySelector("[data-video-model]");
  const model = modelInput?.value || preset.model;
  const modelLabel = modelInput?.selectedOptions?.[0]?.textContent || model;
  const cost = Math.max(preset.cost, duration >= 10 ? preset.cost + 8 : preset.cost);
  const realProvider = model !== "fake_worker";
  return {
    preset,
    ratio,
    duration,
    model,
    modelLabel,
    cost,
    expectedTime: realProvider ? (duration >= 10 ? "约 2-5 分钟" : "约 1-3 分钟") : "约 10-30 秒",
    output: realProvider ? "MP4 视频资产" : "演示元数据 / 视频资产",
    ready: Boolean(selectedVideoReference)
  };
}

function updateVideoPreflight() {
  if (!document.querySelector("[data-video-preflight]")) return;
  const estimate = getVideoPreflightEstimate();
  updateVideoPreviewRatio(estimate.ratio);
  const referenceLabel = selectedVideoReference
    ? `${selectedVideoReference.title || "参考图"} · ${selectedVideoReference.remote ? "已上传" : "本地/演示"}`
    : "未选择";
  setText("[data-video-preflight-reference]", referenceLabel);
  setText("[data-video-preflight-spec]", `${estimate.ratio} · ${estimate.duration}秒`);
  setText("[data-video-preflight-model]", estimate.modelLabel);
  setText("[data-video-preflight-time]", estimate.expectedTime);
  setText("[data-video-preflight-output]", estimate.output);
  setText("[data-video-preflight-cost]", `${estimate.cost} 积分`);
  const readyState = document.querySelector("[data-video-ready-state]");
  if (readyState) {
    const lowCredits = state.credits < estimate.cost;
    readyState.textContent = !estimate.ready
      ? "请先上传图片或从资产库选择参考图，再提交图片转视频任务。"
      : lowCredits
        ? `当前积分 ${state.credits}，还差 ${estimate.cost - state.credits} 积分。请先购买积分或领取每日奖励。`
        : "已准备好提交。成功后会保存到生成任务、资产库和我的作品，并支持下载和分享。";
    readyState.dataset.ready = estimate.ready && !lowCredits ? "true" : "false";
  }
}

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
    const demoGeneration = !isRealAuthenticatedUser(state.user) && consumeDemoGenerationIntent();
    if (!demoGeneration && !requireRealLoginForAction("generation-submit", window.location.pathname.split("/").pop() || "./zh/app/image-to-video/")) {
      return;
    }
    if (!demoGeneration && !supabase) {
      showSiteToast("Supabase 未配置，无法提交真实账户生成任务。");
      return;
    }
    const activeMode = document.querySelector("[data-mode].active")?.dataset.mode || "image";
    const activePreset = getActiveVideoPreset();
    const cost = activePreset?.cost || Number(document.querySelector("[data-mode].active")?.dataset.videoCost || modeCosts[activeMode] || 8);
    const title = activePreset?.title || (activeMode === "video" ? "生成视频场景" : activeMode === "character" ? "生成角色种子" : "生成图片作品");
    const prompt = promptBox?.value.trim() || "生成 AI 场景";
    const character = document.querySelector(".selector-grid select")?.value?.split(" - ")[0] || "Mira";
    const ratio = document.querySelector("[data-video-ratio]")?.value || "";
    const durationSeconds = Number(document.querySelector("[data-video-duration]")?.value || 0) || undefined;
    const requestedModel = document.querySelector("[data-video-model]")?.value || "";
    const model = isAdminActor(state.user) ? requestedModel : normalizePublicGenerationProvider(requestedModel);
    const reference = selectedVideoReference;
    if (document.querySelector("[data-video-generator]") && !reference) {
      updateVideoPreflight();
      trackProductEvent("generation_blocked", {
        reason: "missing_reference",
        mediaType: activeMode === "video" ? "video" : "image",
        preset: activePreset?.id || "",
        cost
      });
      showSiteToast("请先上传图片、从资产库选择图片，或使用示例参考图。");
      document.querySelector("[data-video-upload]")?.focus();
      return;
    }
    trackProductEvent("generation_submitted", {
      mediaType: activeMode === "video" ? "video" : "image",
      preset: activePreset?.id || "",
      cost,
      ratio,
      durationSeconds: durationSeconds || 0,
      provider: model || "auto",
      hasReference: Boolean(reference)
    });
    const progressRow = createGenerationProgressRow({
      title,
      cost,
      reference,
      mediaType: activeMode === "video" ? "video" : "image"
    });
    queueTarget.prepend(progressRow);
    generateButton.disabled = true;
    generateButton.textContent = "生成中";
    try {
      if (demoGeneration) {
        updateGenerationProgress(progressRow, "running", "正在生成本地演示预览，不扣积分，也不会保存到真实账户。", 38, {
          historyHref: "./zh/history/"
        });
      } else {
        updateGenerationProgress(progressRow, "queued", "任务已进入队列，正在准备参考图和积分扣费。", 18, {
          historyHref: "./zh/history/"
        });
        const remoteResult = await runRemoteGeneration({
          mode: activeMode,
          prompt,
          title,
          character,
          cost,
          ratio,
          durationSeconds,
          model,
          preset: activePreset?.id || "",
          reference,
          onJobCreated: (job) => {
            const remoteJobId = String(job?.id || "");
            if (remoteJobId) progressRow.dataset.remoteJobId = remoteJobId;
            updateGenerationProgress(progressRow, "running", remoteJobId
              ? `远端任务 ${remoteJobId} 已创建，正在扣费、调用模型并保存输出。`
              : "远端任务已创建，正在扣费、调用模型并保存输出。", 42, {
              historyHref: "./zh/history/",
              refreshJobId: remoteJobId,
              cancelJobId: remoteJobId
            });
          }
        });
        if (remoteResult) {
          const remoteAssetId = String(remoteResult.asset?.id || remoteResult.job?.result_asset_id || "");
          const remoteAsset = state.assets.find((asset) => asset.id === remoteAssetId);
          if (remoteAsset) renderGeneratedPreview(remoteAsset, state.history.find((job) => job.assetId === remoteAsset.id) || remoteResult.job || {});
          trackProductEvent("generation_completed", {
            mediaType: activeMode === "video" ? "video" : "image",
            preset: activePreset?.id || "",
            cost,
            provider: model || "workflow",
            remote: true,
            hasAsset: Boolean(remoteAssetId)
          });
          clearVideoGenerationDraft();
          clearGenerationRecovery();
          updateGenerationProgress(progressRow, "completed", "真实任务已保存到 Supabase 资产库、生成任务和我的作品。", 100, {
            assetHref: "./zh/assets/",
            historyHref: "./zh/history/",
            downloadHref: remoteAsset?.downloadUrl || "",
            downloadName: remoteAsset ? downloadFileName(remoteAsset) : "luravyn-generation",
            shareAssetId: remoteAssetId,
            retryAssetId: remoteAssetId
          });
          return;
        }
      }
    } catch (error) {
      const refundText = error.refund?.amount ? `远端已退回 ${error.refund.amount} 积分。` : "未重复扣除远端积分。";
      const failedJobId = String(error.job?.id || progressRow.dataset.remoteJobId || "");
      if (supabase && state.user) {
        await syncRemoteProductData();
        saveState(state);
      }
      const failedJob = state.history.find((job) => job.id === failedJobId) || {
        id: failedJobId,
        type: activeMode === "video" ? "video" : "image",
        title,
        prompt,
        provider: model || "fake_worker",
        model: model || "",
        status: "failed",
        credits: cost,
        ratio,
        durationSeconds,
        preset: activePreset?.id || "",
        referenceId: reference?.id || "",
        sourceAssetId: reference?.id || "",
        reference,
        errorMessage: error.message || "真实生成暂不可用",
        refundAmount: Number(error.refund?.amount || 0)
      };
      trackProductEvent("generation_failed", {
        mediaType: activeMode === "video" ? "video" : "image",
        preset: activePreset?.id || "",
        cost,
        provider: model || "workflow",
        remote: true,
        refunded: Boolean(error.refund?.amount)
      });
      persistGenerationRecovery(buildGenerationRecoveryFromJob(failedJob));
      if (!isAdminActor(state.user)) {
        updateGenerationProgress(progressRow, "failed", `${error.message || "生成暂不可用"}，${refundText} 请稍后重试或联系支持。`, 0, {
          historyHref: "./zh/history/",
          refreshJobId: failedJobId,
          retryJobId: failedJobId
        });
        generateButton.disabled = false;
        generateButton.textContent = activeMode === "video" ? "生成视频" : "生成";
        return;
      }
      updateGenerationProgress(progressRow, "retrying", `${error.message || "真实生成暂不可用"}，${refundText} 管理员测试模式正在切换到 Fake Worker。`, 38, {
        historyHref: "./zh/history/",
        refreshJobId: failedJobId,
        retryJobId: failedJobId
      });
    } finally {
      generateButton.disabled = false;
      generateButton.textContent = activeMode === "video" ? "生成视频" : "生成";
    }

    if (!demoGeneration && state.credits < cost) {
      trackProductEvent("generation_failed", {
        mediaType: activeMode === "video" ? "video" : "image",
        preset: activePreset?.id || "",
        cost,
        reason: "insufficient_credits",
        remote: false
      });
      updateGenerationProgress(progressRow, "failed", "积分不足，请先购买积分再生成这个作品。", 0, {
        assetHref: "./zh/pricing/",
        assetLabel: "购买积分",
        historyHref: "./zh/history/"
      });
      return;
    }
    if (!demoGeneration) state.credits -= cost;
    const id = `asset_${Date.now()}`;
    const jobId = `job_${Date.now()}`;
    const asset = {
      id,
      type: activeMode === "video" ? "video" : "image",
      title,
      prompt,
      character,
      credits: demoGeneration ? 0 : cost,
      status: "completed",
      visibility: "private",
      favorite: false,
      ratio,
      duration: durationSeconds,
      preset: activePreset?.id || "",
      referenceId: reference?.id || "",
      demo: demoGeneration,
      downloadUrl: createGeneratedDownloadUrl({ title, prompt, cost: demoGeneration ? 0 : cost, ratio, durationSeconds, model, reference, type: activeMode === "video" ? "video" : "image" })
    };
    const job = {
      id: jobId,
      type: asset.type,
      title,
      prompt,
      provider: demoGeneration ? "demo_preview" : model || "local_api",
      model: demoGeneration ? "browser-demo-preview" : activeMode === "video" ? model || "local-video-v0" : "local-image-v0",
      status: "completed",
      credits: demoGeneration ? 0 : cost,
      duration: activeMode === "video" ? `${durationSeconds || 8}s` : "12s",
      assetId: id,
      ratio,
      preset: activePreset?.id || "",
      progress: 100,
      remote: false,
      demo: demoGeneration
    };
    if (!demoGeneration) {
      recordCreditLedger({
        amount: -cost,
        category: "generation",
        reason: `${title} 本地演示生成扣费`,
        sourceType: "generation_job",
        sourceId: jobId
      });
    }
    updateGenerationProgress(progressRow, "running", demoGeneration ? "正在完成浏览器演示预览。真实保存和分享需要登录。" : "Fake Worker 正在生成预览和输出元数据。", 64);
    await wait(180);
    state.assets.unshift(asset);
    state.history.unshift(job);
    saveState(state);
    renderState(state);
    renderGeneratedPreview(asset, job);
    trackProductEvent("generation_completed", {
      mediaType: asset.type,
      preset: activePreset?.id || "",
      cost: demoGeneration ? 0 : cost,
      provider: job.provider,
      remote: false,
      hasAsset: true
    });
    clearVideoGenerationDraft();
    clearGenerationRecovery();
    updateGenerationProgress(progressRow, "completed", demoGeneration ? "演示生成完成：未扣积分，结果只保存在当前浏览器。登录后可真实保存、下载和分享。" : "已保存到资产库、生成任务和我的作品，可下载或继续分享。", 100, {
      assetHref: "./zh/assets/",
      historyHref: "./zh/history/",
      downloadHref: asset.downloadUrl,
      downloadName: `${asset.title}.json`,
      shareAssetId: demoGeneration ? "" : asset.id,
      retryAssetId: asset.id
    });
  });
}

function normalizePublicGenerationProvider(provider) {
  const value = String(provider || "").toLowerCase();
  if (!value || value === "fake_worker" || value === "local_api" || value.startsWith("local")) return "zealman_workflow";
  return value;
}

if (generateVideoButton && generateButton) {
  generateVideoButton.addEventListener("click", () => {
    document.querySelector('[data-mode="video"]')?.click();
    generateButton.click();
  });
}

async function runRemoteGeneration(input) {
  if (!supabase) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    captureVideoGenerationDraft("generation-auth-required");
    openUnlockModal(getCurrentAuthReturnTarget());
    throw new Error("请先登录后使用真实生成。");
  }
  const mediaType = input.mode === "video" ? "video" : "image";
  const workflowId = workflowIdForGeneration(mediaType, input.model, input.preset);
  const createResult = await invokeAi("create-generation-job", {
    mediaType,
    prompt: input.prompt,
    workflowId,
    toolSlug: mediaType === "video" ? "image-to-video" : "generate",
    durationSeconds: mediaType === "video" ? input.durationSeconds || 6 : undefined,
    aspectRatio: input.ratio || undefined,
    provider: input.model || undefined,
    sourceAssetId: input.reference?.sourceAssetId || (input.reference?.remote ? input.reference.id : undefined),
    sourceImageUrl: input.reference?.sourceImageUrl || undefined,
    preset: input.preset || undefined
  });
  const job = createResult.job;
  input.onJobCreated?.(job);
  const processed = await invokeAi("process-generation-job", { jobId: job.id });
  if (processed.error) {
    const error = new Error(processed.error.message || "AI 生成失败，积分已自动退回。");
    error.refund = processed.refund || null;
    error.job = processed.job || null;
    throw error;
  }
  mergeRemoteGenerationResult(processed.job, processed.asset, input);
  await syncRemoteProductData();
  return processed;
}

function workflowIdForGeneration(mediaType, provider, preset) {
  if (provider === "zealman_workflow") {
    if (mediaType === "image") return "workflow-hifun-image-editor-v1";
    if (preset === "adult-effects") return "workflow-hifun-adult-effects-v1";
    if (preset === "movie-closeup") return "workflow-hifun-movie-closeup-v1";
    if (preset === "social-reel") return "workflow-zealman-video-g03-v1";
    if (preset === "product-teaser") return "workflow-zealman-digital-human-j11-v1";
    return "workflow-zealman-video-g01-v1";
  }
  if (provider === "liblib_generation" && mediaType === "image") return "workflow-liblib-image-v1";
  return mediaType === "video" ? "workflow-qianwen-video-v1" : "workflow-qianwen-image-v1";
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
  const inputParams = parseMaybeJson(job.input_params);
  const ratio = String(job.aspect_ratio || input.ratio || inputParams.aspectRatio || "");
  const durationSeconds = Number(job.duration_seconds || input.durationSeconds || inputParams.durationSeconds || 0) || undefined;
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
    ratio,
    durationSeconds,
    duration: durationSeconds ? `${durationSeconds}s` : "",
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
    duration: job.latency ? `${Math.round(Number(job.latency) / 1000)}s` : durationSeconds ? `${durationSeconds}s` : "实时",
    durationSeconds,
    ratio,
    assetId,
    progress: Number(job.progress || 100),
    remote: true
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
    const payload = buildCharacterPayload(characterForm);
    if (!payload.name) return;
    const characterId = payload.id || `char_${Date.now()}`;
    const nextCharacter = { ...payload, id: characterId };
    const existingIndex = state.characters.findIndex((character) => character.id === characterId);
    if (existingIndex >= 0) {
      state.characters[existingIndex] = { ...state.characters[existingIndex], ...nextCharacter };
    } else {
      state.characters.unshift(nextCharacter);
    }
    selectedCharacterId = characterId;
    saveState(state);
    resetCharacterForm();
  });
}

function buildCharacterPayload(formElement) {
  const form = new FormData(formElement);
  const rawScore = Number(form.get("score") || 84);
  const score = Math.max(0, Math.min(100, Number.isFinite(rawScore) ? rawScore : 84));
  return {
    id: String(form.get("id") || "").trim(),
    name: String(form.get("name") || "").trim(),
    role: String(form.get("role") || "创意角色").trim() || "创意角色",
    tags: String(form.get("tags") || "自定义").split(",").map((tag) => tag.trim()).filter(Boolean),
    score,
    status: String(form.get("status") || "active"),
    consistencyStatus: String(form.get("consistencyStatus") || (score >= 90 ? "stable" : "needs_review")),
    coverAsset: String(form.get("coverAsset") || "").trim(),
    referenceAsset: String(form.get("referenceAsset") || "").trim(),
    favorite: form.has("favorite"),
    memory: String(form.get("memory") || "保持角色外观、语气、镜头和品牌视觉一致。").trim()
  };
}

function populateCharacterForm(character) {
  if (!characterForm || !character) return;
  characterForm.dataset.characterFormMode = "edit";
  setCharacterFormValue("id", character.id);
  setCharacterFormValue("name", character.name);
  setCharacterFormValue("role", character.role);
  setCharacterFormValue("tags", Array.isArray(character.tags) ? character.tags.join(", ") : character.tags || "");
  setCharacterFormValue("status", character.status || "active");
  setCharacterFormValue("consistencyStatus", character.consistencyStatus || "stable");
  setCharacterFormValue("score", character.score || 84);
  setCharacterFormValue("coverAsset", character.coverAsset || "");
  setCharacterFormValue("referenceAsset", character.referenceAsset || "");
  setCharacterFormValue("memory", character.memory || "");
  const favorite = characterForm.querySelector("[name='favorite']");
  if (favorite) favorite.checked = Boolean(character.favorite);
  const title = characterForm.querySelector("[data-character-form-title]");
  if (title) title.textContent = "编辑角色";
  const submit = characterForm.querySelector("[data-character-submit]");
  if (submit) submit.textContent = "保存角色";
  const cancel = characterForm.querySelector("[data-cancel-character-edit]");
  if (cancel) cancel.hidden = false;
}

function resetCharacterForm() {
  if (!characterForm) return;
  characterForm.reset();
  characterForm.dataset.characterFormMode = "create";
  setCharacterFormValue("id", "");
  setCharacterFormValue("score", 88);
  setCharacterFormValue("status", "active");
  setCharacterFormValue("consistencyStatus", "stable");
  const title = characterForm.querySelector("[data-character-form-title]");
  if (title) title.textContent = "创建角色";
  const submit = characterForm.querySelector("[data-character-submit]");
  if (submit) submit.textContent = "创建角色";
  const cancel = characterForm.querySelector("[data-cancel-character-edit]");
  if (cancel) cancel.hidden = true;
}

function setCharacterFormValue(name, value) {
  const field = characterForm?.querySelector(`[name='${name}']`);
  if (field) field.value = value ?? "";
}

function statusRow(title, body, href, action) {
  const row = document.createElement("article");
  row.className = "result-row";
  row.innerHTML = `<span class="thumb art-3"></span><div><strong>${title}</strong><p>${body}</p></div><a href="${href}">${action}</a>`;
  return row;
}

function createGenerationProgressRow(input) {
  const row = document.createElement("article");
  row.className = "result-row generation-progress-row";
  row.dataset.generationStatus = "queued";
  row.innerHTML = `
    <span class="thumb ${input.mediaType === "video" ? "art-7" : "art-3"}"></span>
    <div class="generation-progress-body">
      <strong>${escapeHtml(input.title)}</strong>
      <p data-generation-progress-message>${input.reference?.title ? `参考图：${escapeHtml(input.reference.title)}。` : "等待参考图或提示词输入。"}</p>
      <div class="generation-progress-track"><span data-generation-progress-bar style="width: 0%"></span></div>
      <small data-generation-progress-meta>排队中 · ${input.cost} 积分</small>
    </div>
    <div class="row-actions" data-generation-progress-actions></div>
  `;
  return row;
}

function updateGenerationProgress(row, status, message, progress, actions = {}) {
  if (!row) return;
  row.dataset.generationStatus = status;
  row.querySelector("[data-generation-progress-message]") && (row.querySelector("[data-generation-progress-message]").textContent = message);
  const bar = row.querySelector("[data-generation-progress-bar]");
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, Number(progress) || 0))}%`;
  const meta = row.querySelector("[data-generation-progress-meta]");
  if (meta) meta.textContent = `${statusLabel(status)} · ${Math.max(0, Math.min(100, Number(progress) || 0))}%`;
  const actionTarget = row.querySelector("[data-generation-progress-actions]");
  if (!actionTarget) return;
  const openLabel = actions.assetLabel || "打开作品";
  const openAction = actions.assetHref ? `<a href="${actions.assetHref}">${escapeHtml(openLabel)}</a>` : "";
  const historyAction = actions.historyHref ? `<a href="${actions.historyHref}">查看生成任务</a>` : "";
  const refreshAction = actions.refreshJobId ? `<button type="button" data-refresh-job="${escapeHtml(actions.refreshJobId)}">刷新</button>` : "";
  const cancelAction = actions.cancelJobId ? `<button type="button" data-cancel-job="${escapeHtml(actions.cancelJobId)}">取消</button>` : "";
  const shareAction = actions.shareAssetId ? `<button type="button" data-share-asset="${escapeHtml(actions.shareAssetId)}">分享</button>` : "";
  const retryJobAction = actions.retryJobId ? `<button type="button" data-retry-job="${escapeHtml(actions.retryJobId)}">重新提交</button>` : "";
  const retryAction = actions.retryAssetId ? `<button type="button" data-retry-asset="${escapeHtml(actions.retryAssetId)}">重新生成</button>` : "";
  const downloadAction = actions.downloadHref && actions.downloadHref !== "#"
    ? `<a href="${actions.downloadHref}" download="${escapeHtml(actions.downloadName || "luravyn-generation.json")}">下载</a>`
    : "";
  actionTarget.innerHTML = `${historyAction}${refreshAction}${cancelAction}${openAction}${downloadAction}${shareAction}${retryJobAction}${retryAction}`;
}

function statusLabel(status) {
  const labels = {
    queued: "排队中",
    pending: "等待中",
    running: "生成中",
    completed: "已完成",
    failed: "失败",
    retrying: "切换中",
    cancelled: "已取消",
    canceled: "已取消"
  };
  return labels[status] || status;
}

function createGeneratedDownloadUrl(input) {
  const payload = {
    product: "Luravyn",
    type: input.type,
    title: input.title,
    prompt: input.prompt,
    ratio: input.ratio,
    durationSeconds: input.durationSeconds,
    provider: input.model || "fake_worker",
    credits: input.cost,
    reference: input.reference ? {
      id: input.reference.id,
      title: input.reference.title,
      remote: Boolean(input.reference.remote)
    } : null,
    generatedAt: new Date().toISOString(),
    note: "MVP Fake Worker download metadata. Real providers will replace this with media file downloads."
  };
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
}

function renderGeneratedPreview(asset, job) {
  const preview = document.querySelector("[data-video-preview]");
  if (!preview) return;
  const outputRatio = normalizeVideoAspectRatio(asset.ratio || asset.aspectRatio || job.ratio || job.aspectRatio || "16:9");
  updateVideoPreviewRatio(outputRatio);
  preview.classList.add("generated-output-preview");
  const previewUrl = getAssetPreviewUrl(asset);
  preview.classList.toggle("has-reference-preview", Boolean(previewUrl));
  if (previewUrl) {
    preview.style.setProperty("--reference-image", `url("${previewUrl}")`);
  }
  const downloadHref = asset.downloadUrl || asset.outputUrl || asset.publicUrl || "";
  const downloadAction = downloadHref
    ? `<a href="${escapeHtml(downloadHref)}" download="${escapeHtml(downloadFileName(asset))}" data-generated-download>下载作品</a>`
    : "";
  const outputLabel = asset.type === "video" ? "视频作品" : "图片作品";
  preview.innerHTML = `
    <article class="generated-output-card" data-generated-output="${escapeHtml(asset.id)}">
      <div class="generated-output-player ${asset.type === "video" ? "video-player-shell" : "image-player-shell"}" data-generated-ratio="${escapeHtml(outputRatio)}">
        <span class="play-dot"></span>
        <strong>${escapeHtml(outputLabel)}</strong>
        <small>已保存到资产库、生成任务和我的作品</small>
      </div>
      <div class="generated-output-meta">
        <p class="eyebrow">生成完成</p>
        <h3>${escapeHtml(asset.title)}</h3>
        <p>${escapeHtml(asset.prompt || "已生成可复用作品。")}</p>
        <dl>
          <div><dt>规格</dt><dd>${escapeHtml(outputRatio)} · ${escapeHtml(job.duration || asset.duration || "实时")}</dd></div>
          <div><dt>模型</dt><dd>${escapeHtml(publicModelLabel(asset.model || job.model, asset.provider || job.provider, state))}</dd></div>
          <div><dt>积分</dt><dd>${Number(asset.credits || job.credits || 0)} 积分</dd></div>
          <div><dt>状态</dt><dd>${statusLabel(normalizeJobStatus(job.status || asset.status || "completed"))}</dd></div>
        </dl>
        <div class="preview-actions generated-output-actions">
          <a href="./zh/assets/">打开资产库</a>
          ${downloadAction}
          <button type="button" data-share-asset="${escapeHtml(asset.id)}">分享</button>
          <button type="button" data-retry-asset="${escapeHtml(asset.id)}">重新生成</button>
          <button type="button" data-use-generated-output="${escapeHtml(asset.id)}">${asset.type === "video" ? "生成相似视频" : "设为参考图"}</button>
        </div>
      </div>
    </article>
  `;
}

function useGeneratedOutputAsReference(assetId) {
  const asset = state.assets.find((item) => item.id === assetId);
  if (!asset) return;
  if (asset.type === "video") {
    const recovery = persistGenerationRecovery(buildGenerationRecoveryFromAsset(asset));
    window.location.href = `${getGenerationRecoveryRoute(recovery)}?preset=${encodeURIComponent(recovery?.preset || "social-reel")}`;
    return;
  }
  selectVideoReference({
    ...asset,
    sourceAssetId: asset.remote ? asset.id : undefined,
    previewUrl: getAssetPreviewUrl(asset),
    sourceImageUrl: getReferenceImageUrl(asset)
  }, { addToAssets: false });
  showSiteToast("已把生成结果设为下一次图片转视频参考图。");
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getAppBaseUrl() {
  const githubPagesBase = "/open-video-studio/";
  const basePath = window.location.pathname.startsWith(githubPagesBase) ? githubPagesBase : "/";
  return new URL(basePath, window.location.origin).href;
}

function getCurrentAuthReturnTarget() {
  const basePath = new URL(getAppBaseUrl()).pathname;
  let path = window.location.pathname;
  if (basePath !== "/" && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }
  path = path.replace(/^\/+/, "") || "index.html";
  return normalizeAuthReturnTarget(`${path}${window.location.search}${window.location.hash}`);
}

function getRequestedAuthReturnTarget(fallback = "dashboard.html") {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("next") || localStorage.getItem(AUTH_RETURN_KEY) || fallback;
  return normalizeAuthReturnTarget(requested);
}

function persistAuthReturnTarget(nextUrl = "dashboard.html") {
  const normalized = normalizeAuthReturnTarget(nextUrl);
  localStorage.setItem(AUTH_RETURN_KEY, normalized);
  return normalized;
}

function normalizeAuthReturnTarget(nextUrl = "dashboard.html") {
  const raw = String(nextUrl || "dashboard.html").trim();
  let target;
  try {
    target = new URL(raw, getAppBaseUrl());
  } catch {
    return "dashboard.html";
  }
  if (target.origin !== window.location.origin) return "dashboard.html";

  const basePath = new URL(getAppBaseUrl()).pathname;
  let path = target.pathname;
  if (basePath !== "/" && path.startsWith(basePath)) {
    path = path.slice(basePath.length);
  }
  const suffix = `${target.search}${target.hash}`;
  const withoutOrigin = path.replace(/^\/+/, "");
  const fileMatch = withoutOrigin.match(/([a-z0-9-]+\.html)$/i);
  if (fileMatch) return `${fileMatch[1]}${suffix}`;

  const cleaned = withoutOrigin
    .replace(/^open-video-studio\//, "")
    .replace(/^zh\//, "")
    .replace(/^app\//, "")
    .replace(/^\/+|\/+$/g, "");
  return `${AUTH_ROUTE_ALIASES.get(cleaned) || "dashboard.html"}${suffix}`;
}

function getAuthRedirectUrl(nextUrl = "dashboard.html") {
  return new URL(normalizeAuthReturnTarget(nextUrl), getAppBaseUrl()).href;
}

function getPasswordResetRedirectUrl() {
  return new URL("reset-password.html", getAppBaseUrl()).href;
}

let characterFilter = "all";
let characterSearch = "";

function renderCharacters(current) {
  const target = document.querySelector("[data-character-list]");
  document.querySelectorAll("[data-character-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.characterFilter === characterFilter);
  });
  if (target) {
    if (!isRealAuthenticatedUser(current.user)) {
      target.innerHTML = signedOutPreviewMarkup("characters");
      renderCharacterProfile(current);
      return;
    }
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
      <span>${characterStatusLabel(character.status)} ${character.favorite ? "· 收藏" : ""}</span>
      <strong>${escapeHtml(character.name)}</strong>
      <span>${escapeHtml(character.role)} - 一致性 ${Number(character.score || 0)}% · ${characterConsistencyLabel(character.consistencyStatus)}</span>
      <p>标签：${character.tags.map(escapeHtml).join(", ")}</p>
      <small data-character-cover-summary>封面：${escapeHtml(character.coverAsset || "默认")} · 参考：${escapeHtml(character.referenceAsset || "默认")}</small>
      <div class="row-actions"><button type="button" data-use-character="${character.id}">使用角色</button><button type="button" data-edit-character="${character.id}">编辑</button><button type="button" data-copy-character="${character.id}">复制设定</button></div>
    </article>
  `).join("");
  }
  renderCharacterProfile(current);
}

function renderCharacterProfile(current) {
  const profile = document.querySelector("[data-character-profile]");
  if (!profile) return;
  if (!isRealAuthenticatedUser(current.user)) {
    profile.querySelector(".eyebrow").textContent = "角色预览";
    profile.querySelector(".avatar").className = "avatar art-2 demo-badge";
    profile.querySelector("h2").textContent = "登录后创建一致角色";
    profile.querySelector(".muted").textContent = "角色会保存封面、参考图、标签、记忆和一致性状态，供图片与视频生成复用。";
    profile.querySelector(".score").innerHTML = `一致性评分 <strong>登录后计算</strong>`;
    const meta = profile.querySelector("[data-character-profile-meta]");
    if (meta) meta.textContent = "当前为功能预览，不是你的账户角色。";
    profile.querySelector(".character-action-row").innerHTML = `<a class="btn primary" href="./zh/login/" data-auth-modal>登录后创建角色</a><a class="btn glass" href="./zh/gallery/">浏览公开作品</a>`;
    profile.querySelector(".mini-assets").innerHTML = `<span class="thumb art-3 demo-badge"></span><span class="thumb art-7 demo-badge"></span><span class="thumb art-8 demo-badge"></span>`;
    return;
  }
  const character = current.characters.find((item) => item.id === selectedCharacterId) || current.characters[0];
  if (!character) return;
  const relatedAssets = current.assets.filter((asset) => asset.character === character.name).slice(0, 3);
  profile.querySelector(".eyebrow").textContent = character.status === "active" ? "角色预览" : "草稿角色";
  profile.querySelector(".avatar").className = `avatar ${character.favorite ? "art-12" : "art-2"}`;
  profile.querySelector("h2").textContent = `${character.name} ${character.role}`;
  profile.querySelector(".muted").textContent = character.memory || "保持角色外观、语气、镜头和品牌视觉一致。";
  profile.querySelector(".score").innerHTML = `一致性评分 <strong>${Number(character.score || 0)}%</strong>`;
  const meta = profile.querySelector("[data-character-profile-meta]");
  if (meta) meta.textContent = `状态：${characterStatusLabel(character.status)} · 一致性：${characterConsistencyLabel(character.consistencyStatus)} · 封面：${character.coverAsset || "默认"} · 参考资产：${character.referenceAsset || "默认"}`;
  profile.querySelector(".character-action-row").innerHTML = `<button class="btn primary" type="button" data-use-character="${character.id}">使用角色生成</button><button class="btn glass" type="button" data-edit-character="${character.id}">编辑角色</button><button class="btn glass" type="button" data-copy-character="${character.id}">复制角色提示词</button>`;
  profile.querySelector(".mini-assets").innerHTML = relatedAssets.length
    ? relatedAssets.map((asset, index) => `<span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>`).join("")
    : `<span class="thumb art-3"></span><span class="thumb art-7"></span><span class="thumb art-8"></span>`;
}

function characterStatusLabel(status) {
  const labels = {
    active: "可生成",
    draft: "草稿",
    archived: "已归档"
  };
  return labels[status] || "可生成";
}

function characterConsistencyLabel(status) {
  const labels = {
    stable: "稳定",
    needs_review: "需要校准",
    experimental: "实验中"
  };
  return labels[status] || "稳定";
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

function publicProviderLabel(provider, current = state) {
  const value = String(provider || "").toLowerCase();
  if (isAdminActor(current.user)) return provider || "workflow";
  if (["fake_worker", "local_api"].includes(value) || value.startsWith("local")) return "Luravyn 测试生成";
  if (value === "qianwen_generation") return "千问生成";
  if (value === "zealman_workflow") return "Zealman 工作流";
  if (value === "deepseek_text") return "DeepSeek 提示词";
  if (value === "qwen_vision") return "Qwen 视觉分析";
  return provider || "自动工作流";
}

function publicModelLabel(model, provider = "", current = state) {
  const value = String(model || provider || "").toLowerCase();
  if (isAdminActor(current.user)) return model || provider || "workflow";
  if (["fake_worker", "local_api"].includes(value) || value.startsWith("local")) return "MVP 可用模型";
  return model || publicProviderLabel(provider, current);
}

function signedOutPreviewMarkup(kind) {
  const copy = {
    characters: {
      eyebrow: "角色功能预览",
      title: "登录后创建并复用一致角色",
      body: "角色卡会保存封面、标签、记忆、一致性状态和关联资产。这里不展示假角色，避免和真实账户混淆。",
      primary: "创建角色",
      href: "./zh/app/characters/"
    },
    assets: {
      eyebrow: "资产库预览",
      title: "登录后查看你的图片、视频、提示词和参考图",
      body: "每次生成成功后都会自动保存为可复用资产，并支持转视频、下载、收藏和分享。",
      primary: "登录后查看资产",
      href: "./zh/login/"
    },
    history: {
      eyebrow: "生成任务预览",
      title: "登录后查看排队、生成中、失败和完成记录",
      body: "任务会记录提示词、模型、服务商、积分、耗时、失败原因和退款状态。",
      primary: "上传图片生成视频",
      href: "./zh/app/image-to-video/"
    },
    creations: {
      eyebrow: "我的作品预览",
      title: "登录后管理生成成功的图片和视频",
      body: "作品区只展示真实账户里的已生成内容，支持复制提示词、重新生成、下载和公开分享。",
      primary: "登录后查看作品",
      href: "./zh/login/"
    },
    dashboard: {
      eyebrow: "账户数据预览",
      title: "登录后读取真实积分、任务、资产和分享链接",
      body: "控制台不会用演示数据冒充你的账户。完成注册后，新用户积分和生成记录会从 Supabase 同步。",
      primary: "登录 / 注册",
      href: "./zh/login/"
    }
  }[kind] || {};
  return `
    <article class="empty-state functional-preview" data-functional-preview="${escapeHtml(kind)}">
      <div>
        <p class="eyebrow">${escapeHtml(copy.eyebrow || "功能预览")}</p>
        <h2>${escapeHtml(copy.title || "登录后使用真实账户数据")}</h2>
        <p class="muted">${escapeHtml(copy.body || "未登录时只展示功能说明，不展示假账户数据。")}</p>
      </div>
      <div class="preview-actions">
        <a class="btn primary" href="${escapeHtml(copy.href || "./zh/login/")}" ${kind === "history" ? "" : "data-auth-modal"}>${escapeHtml(copy.primary || "登录 / 注册")}</a>
        <a class="btn glass" href="./zh/gallery/">浏览公开作品</a>
      </div>
    </article>
  `;
}

function renderAssets(current) {
  const targets = document.querySelectorAll("[data-asset-list]");
  targets.forEach((target) => {
    if (!isRealAuthenticatedUser(current.user)) {
      target.innerHTML = signedOutPreviewMarkup("assets");
      return;
    }
    target.innerHTML = current.assets.map((asset, index) => `
      <article class="library-card" data-asset data-asset-kind="${asset.type === "video" ? "视频" : "图片"}" data-asset-favorite="${asset.favorite ? "收藏" : ""}">
        <span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>
        <div><h3>${escapeHtml(asset.title)}</h3><p>${asset.type === "video" ? "视频" : "图片"} - ${asset.visibility === "public" ? "公开" : "私密"} - 角色 ${escapeHtml(asset.character)}</p></div>
        <div class="row-actions">
          ${asset.type === "image" ? `<a href="./zh/app/image-to-video/?source=${encodeURIComponent(asset.id)}">转视频</a>` : ""}
          ${asset.downloadUrl ? `<a href="${asset.downloadUrl}" download="${escapeHtml(asset.title)}.json">下载</a>` : ""}
          <button data-share-asset="${asset.id}">分享</button>
        </div>
      </article>
    `).join("");
  });
}

function renderHistory(current) {
  const target = document.querySelector("[data-history-list]");
  if (!target) return;
  if (!isRealAuthenticatedUser(current.user)) {
    target.innerHTML = signedOutPreviewMarkup("history");
    return;
  }
  document.querySelectorAll("[data-history-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.historyFilter === historyFilter);
  });
  const filtered = current.history.filter((job) => {
    const normalizedStatus = normalizeJobStatus(job.status);
    const matchesFilter =
      historyFilter === "all" ||
      job.type === historyFilter ||
      normalizedStatus === historyFilter ||
      (historyFilter === "running" && ["queued", "running", "retrying", "pending"].includes(normalizedStatus));
    const haystack = `${job.title} ${job.prompt} ${publicProviderLabel(job.provider, current)} ${publicModelLabel(job.model, job.provider, current)} ${job.status} ${job.type}`.toLowerCase();
    return matchesFilter && (!historySearch || haystack.includes(historySearch));
  });
  target.innerHTML = filtered.length ? filtered.map((job) => {
    const asset = current.assets.find((item) => item.id === job.assetId);
    const canCancel = ["queued", "pending", "running", "retrying"].includes(normalizeJobStatus(job.status));
    const progress = Math.max(0, Math.min(100, Number(job.progress || (job.status === "completed" ? 100 : 0))));
    return `
    <article class="history-row">
      <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
      <div class="history-row-body">
        <h3>${escapeHtml(job.title)}</h3>
        <p>提示词：${escapeHtml(job.prompt)}</p>
        <small>服务商 ${escapeHtml(publicProviderLabel(job.provider, current))} - 模型 ${escapeHtml(publicModelLabel(job.model, job.provider, current))} - ${statusLabel(normalizeJobStatus(job.status))} - ${job.credits} 积分 - ${escapeHtml(job.duration)}</small>
        ${renderJobCreditFlow(job, current)}
        ${job.errorMessage ? `<em class="history-error">失败原因：${escapeHtml(job.errorMessage)}${job.refundAmount ? ` · 已退回 ${job.refundAmount} 积分` : ""}</em>` : ""}
        ${renderJobRecoveryHint(job)}
        <div class="generation-progress-track history-progress"><span style="width: ${progress}%"></span></div>
      </div>
      <div class="row-actions">
        ${job.remote ? `<button data-refresh-job="${job.id}">刷新</button>` : ""}
        ${canCancel && job.remote ? `<button data-cancel-job="${job.id}">取消</button>` : `<button data-retry-job="${job.id}">重试</button>`}
        ${asset?.downloadUrl ? `<a href="${asset.downloadUrl}" download="${escapeHtml(downloadFileName(asset))}">下载</a>` : ""}
        ${job.assetId ? `<a href="./zh/assets/">输出</a><button data-share-asset="${job.assetId}">分享</button>` : ""}
      </div>
    </article>
  `; }).join("") : `
    <article class="empty-state creation-empty">
      <div><p class="eyebrow">没有匹配任务</p><h2>换个筛选条件，或开始一次新生成</h2><p class="muted">任务创建后会显示状态、积分、失败原因、退款和输出资产。</p></div>
      <a class="btn primary" href="./zh/app/image-to-video/">上传图片生成视频</a>
    </article>
  `;
}

function renderJobCreditFlow(job, current) {
  const entries = getJobCreditLedger(job, current);
  if (!entries.length) {
    return job.credits
      ? `<div class="history-credit-flow" data-history-credit-flow><span class="credit-out">-${Number(job.credits)} 积分</span><small>生成扣费待流水同步</small></div>`
      : "";
  }
  return `
    <div class="history-credit-flow" data-history-credit-flow>
      ${entries.slice(0, 3).map((entry) => `
        <span class="${entry.amount >= 0 ? "credit-in" : "credit-out"}">${formatCreditAmount(entry.amount)}</span>
        <small>${escapeHtml(entry.reason)}${entry.status !== "posted" ? ` · ${escapeHtml(entry.status)}` : ""}</small>
      `).join("")}
    </div>
  `;
}

function getJobCreditLedger(job, current) {
  const ledger = Array.isArray(current.creditLedger) ? current.creditLedger : [];
  return ledger
    .filter((entry) => {
      const sourceId = String(entry.sourceId || "");
      return sourceId && (sourceId === String(job.id) || sourceId === String(job.assetId));
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function formatCreditAmount(amount) {
  const value = Number(amount || 0);
  return `${value >= 0 ? "+" : ""}${value} 积分`;
}

function formatCreditTime(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function refreshRemoteGenerationJobs(button) {
  if (!supabase) {
    showSiteToast("Supabase 未配置，当前只能查看本地演示任务。");
    return;
  }
  const remoteJobs = state.history.filter((job) => job.remote && ["queued", "pending", "running", "retrying", "failed"].includes(normalizeJobStatus(job.status)));
  if (!remoteJobs.length) {
    showSiteToast("没有需要刷新的远端任务。");
    return;
  }
  if (button) {
    button.disabled = true;
    button.textContent = "刷新中";
  }
  try {
    for (const job of remoteJobs) {
      await refreshRemoteGenerationJob(job.id, { silent: true });
    }
    await syncRemoteProductData();
    saveState(state);
    renderState(state);
    showSiteToast("生成任务状态已刷新。");
  } catch (error) {
    showSiteToast(error.message || "任务刷新失败。");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "刷新任务状态";
    }
  }
}

async function refreshRemoteGenerationJob(jobId, options = {}) {
  if (!supabase || !jobId) return null;
  const result = await invokeAi("check-generation-status", { jobId });
  const mapped = mapRemoteJob(result.job);
  const existing = state.history.find((job) => job.id === mapped.id);
  upsertById(state.history, { ...existing, ...mapped });
  saveState(state);
  if (!options.silent) {
    renderState(state);
    showSiteToast(`任务状态：${statusLabel(normalizeJobStatus(mapped.status))}`);
  }
  return mapped;
}

async function cancelRemoteGenerationJob(jobId, button) {
  if (!supabase || !jobId) {
    showSiteToast("只有远端任务可以取消。");
    return;
  }
  if (button) {
    button.disabled = true;
    button.textContent = "取消中";
  }
  try {
    const result = await invokeAi("cancel-generation-job", { jobId });
    const mapped = mapRemoteJob({ ...result.job, refund: result.refund });
    mapped.refundAmount = Number(result.refund?.amount || 0);
    upsertById(state.history, mapped);
    await syncRemoteProductData();
    saveState(state);
    renderState(state);
    showSiteToast(mapped.refundAmount ? `任务已取消，已退回 ${mapped.refundAmount} 积分。` : "任务已取消。");
  } catch (error) {
    showSiteToast(error.message || "任务取消失败。");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "取消";
    }
  }
}

function normalizeJobStatus(status) {
  const value = String(status || "").toLowerCase();
  if (["completed", "ready", "success", "succeeded"].includes(value)) return "completed";
  if (["failed", "error"].includes(value)) return "failed";
  if (["cancelled", "canceled"].includes(value)) return "cancelled";
  if (["retrying"].includes(value)) return "retrying";
  if (["running", "processing"].includes(value)) return "running";
  if (["queued", "pending"].includes(value)) return "queued";
  return value || "queued";
}

function downloadFileName(asset) {
  const safeTitle = String(asset?.title || "luravyn-generation").replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]+/g, "-").replace(/^-+|-+$/g, "") || "luravyn-generation";
  if (asset?.contentType?.includes("video")) return `${safeTitle}.mp4`;
  if (asset?.contentType?.includes("png")) return `${safeTitle}.png`;
  if (asset?.type === "video") return `${safeTitle}.mp4`;
  if (asset?.type === "image") return `${safeTitle}.png`;
  return `${safeTitle}.json`;
}

let creationFilter = "all";
let creationSearch = "";
const initialHistoryFilter = new URLSearchParams(window.location.search).get("status") || new URLSearchParams(window.location.search).get("filter") || "all";
let historyFilter = ["all", "running", "completed", "failed", "video", "image"].includes(initialHistoryFilter) ? initialHistoryFilter : "all";
let historySearch = "";

function renderCreations(current) {
  const list = document.querySelector("[data-creation-list]");
  const historyList = document.querySelector("[data-creation-history]");
  const stats = {
    count: document.querySelector("[data-creation-count]"),
    shares: document.querySelector("[data-creation-shares]"),
    favorites: document.querySelector("[data-creation-favorites]"),
    jobs: document.querySelector("[data-creation-jobs]")
  };
  const signedIn = isRealAuthenticatedUser(current.user);
  if (stats.count) stats.count.textContent = signedIn ? String(current.assets.length) : "登录后";
  if (stats.shares) stats.shares.textContent = signedIn ? String(current.shares.length) : "登录后";
  if (stats.favorites) stats.favorites.textContent = signedIn ? String(current.assets.filter((asset) => asset.favorite).length) : "登录后";
  if (stats.jobs) stats.jobs.textContent = signedIn ? String(current.history.length) : "登录后";

  document.querySelectorAll("[data-creation-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.creationFilter === creationFilter);
  });

  if (list) {
    if (!signedIn) {
      list.innerHTML = signedOutPreviewMarkup("creations");
    } else {
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
  }

  if (historyList) {
    if (!signedIn) {
      historyList.innerHTML = signedOutPreviewMarkup("history");
    } else {
    historyList.innerHTML = current.history.slice(0, 5).map((job) => `
      <article class="creation-job-row">
        <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
        <div>
          <strong>${escapeHtml(job.title)}</strong>
          <p>${escapeHtml(job.prompt)}</p>
          <small>${escapeHtml(publicProviderLabel(job.provider, current))} · ${escapeHtml(publicModelLabel(job.model, job.provider, current))} · ${job.credits} 积分 · ${escapeHtml(job.duration)}</small>
        </div>
        <button data-retry-job="${job.id}">重试</button>
      </article>
    `).join("");
    }
  }
}

async function createShare(assetId) {
  const asset = state.assets.find((item) => item.id === assetId);
  if (!asset) return;
  if (!requireRealLoginForAction("asset-share", "./zh/login/")) return;
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
        trackProductEvent("asset_shared", {
          mediaType: asset.type || "asset",
          remote: true,
          visibility: asset.visibility || "public"
        });
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
  trackProductEvent("asset_shared", {
    mediaType: asset.type || "asset",
    remote: false,
    visibility: asset.visibility || "public"
  });
  window.location.href = `./zh/share/?token=${share.token}`;
}

function renderDashboard(current) {
  renderDashboardCreditLedger(current);
  renderDashboardNextActions(current);
  renderDashboardAssetsList(current);
  const signedIn = isRealAuthenticatedUser(current.user);
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
  if (stats.credits) stats.credits.textContent = signedIn ? String(current.credits) : "登录后";
  if (stats.jobs) stats.jobs.textContent = signedIn ? String(current.history.length) : "登录后";
  if (stats.assets) stats.assets.textContent = signedIn ? String(current.assets.length) : "登录后";
  if (stats.shares) stats.shares.textContent = signedIn ? String(current.shares.length) : "登录后";
  if (stats.campaigns) stats.campaigns.textContent = signedIn ? String(current.campaigns.filter((campaign) => campaign.status === "active").length) : "Beta";
  if (stats.pipeline) stats.pipeline.textContent = signedIn ? String(current.contentItems.filter((item) => !["published", "analyzed"].includes(item.stage)).length) : "Beta";
  if (stats.scheduled) stats.scheduled.textContent = signedIn ? String(current.contentQueue.filter((item) => item.status === "scheduled").length) : "Beta";
  if (stats.failed) stats.failed.textContent = signedIn ? String(current.contentQueue.filter((item) => item.status === "failed").length) : "Beta";
  if (stats.volume) stats.volume.textContent = signedIn ? String(current.contentItems.length) : "Beta";
  if (stats.traffic) stats.traffic.textContent = signedIn ? String(current.contentAnalytics.reduce((total, row) => total + Number(row.clicks || 0), 0)) : "Beta";

  const recent = document.querySelector("[data-dashboard-recent]");
  if (recent) {
    recent.innerHTML = !signedIn ? signedOutPreviewMarkup("dashboard") : current.history.length ? current.history.slice(0, 4).map((job) => `
      <article class="dashboard-row">
        <span class="thumb ${job.type === "video" ? "art-7" : "art-3"}"></span>
        <div><strong>${escapeHtml(job.title)}</strong><p>${job.status === "completed" ? "已完成" : escapeHtml(job.status)} · ${job.credits} 积分</p></div>
        <div class="row-actions">
          <a href="./zh/history/">查看</a>
          <button type="button" data-retry-job="${job.id}">重试</button>
        </div>
      </article>
    `).join("") : `
      <article class="empty-state compact">
        <h3>还没有生成任务</h3>
        <p class="muted">上传参考图或输入提示词后，任务状态会显示在这里。</p>
        <a class="btn primary" href="./zh/app/image-to-video/">上传图片生成视频</a>
      </article>
    `;
  }

  const characters = document.querySelector("[data-dashboard-characters]");
  if (characters) {
    characters.innerHTML = !signedIn ? signedOutPreviewMarkup("characters") : current.characters.slice(0, 4).map((character, index) => `
      <article class="dashboard-row">
        <span class="thumb ${["art-2", "art-11", "art-12"][index % 3]}"></span>
        <div><strong>${escapeHtml(character.name)}</strong><p>${escapeHtml(character.role)} · ${character.score}%</p></div>
        <button type="button" data-use-character="${character.id}">使用</button>
      </article>
    `).join("");
  }

  const shareList = document.querySelector("[data-dashboard-shares-list]");
  if (shareList) {
    shareList.innerHTML = !signedIn ? signedOutPreviewMarkup("creations") : current.shares.slice(0, 4).map((share) => `
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

function renderDashboardNextActions(current) {
  const target = document.querySelector("[data-dashboard-next-actions]");
  if (!target) return;
  if (!isRealAuthenticatedUser(current.user)) {
    target.innerHTML = signedOutPreviewMarkup("dashboard");
    return;
  }
  const runningJobs = current.history.filter((job) => ["queued", "pending", "running", "retrying"].includes(normalizeJobStatus(job.status)));
  const failedJobs = current.history.filter((job) => ["failed", "cancelled", "canceled"].includes(normalizeJobStatus(job.status)));
  const firstImage = current.assets.find((asset) => asset.type === "image");
  const actions = [];
  if (current.credits < 8) {
    actions.push({ title: "积分不足", detail: "购买或领取免费积分后继续生成。", href: "./zh/pricing/", label: "购买积分", art: "art-10" });
  }
  const reviewItems = current.contentItems.filter((item) => ["caption", "review"].includes(item.stage) || item.reviewStatus === "needs_review");
  const scheduledItems = current.contentQueue.filter((item) => item.status === "scheduled");
  const accountIssues = current.socialAccounts.filter((account) => account.status !== "connected");
  if (reviewItems.length) {
    actions.push({ title: "审核待发布内容", detail: `${reviewItems.length} 条内容正在等你确认文案和素材。`, href: "./zh/pipeline/", label: "去审核", art: "art-13" });
  }
  if (scheduledItems.length) {
    actions.push({ title: "查看本周排期", detail: `${scheduledItems.length} 条内容已经进入日历。`, href: "./zh/calendar/", label: "看日历", art: "art-7" });
  }
  if (accountIssues.length) {
    actions.push({ title: "确认发布账号", detail: `${accountIssues.length} 个账号需要检查连接状态。`, href: "./zh/accounts/", label: "处理账号", art: "art-9" });
  }
  if (runningJobs.length) {
    actions.push({ title: "查看运行中的任务", detail: `${runningJobs.length} 个任务正在排队或生成中。`, href: "./zh/history/", label: "查看任务", art: "art-7" });
  }
  if (failedJobs.length) {
    actions.push({ title: "恢复失败任务", detail: `${failedJobs.length} 个任务可查看原因、退款和重试。`, href: "./zh/history/?status=failed", label: "处理失败", art: "art-8" });
  }
  if (firstImage) {
    actions.push({ title: "把最近图片转成视频", detail: firstImage.title, href: `./zh/app/image-to-video/?source=${encodeURIComponent(firstImage.id)}`, label: "转视频", art: "art-3" });
  }
  actions.push({ title: "创建下一条内容", detail: "从主题、平台和内容类型开始，生成一组可审核的内容包。", href: "./zh/ai-studio/", label: "创建内容", art: "art-12" });
  target.innerHTML = actions.slice(0, 4).map((action) => `
    <article class="dashboard-row">
      <span class="thumb ${action.art}"></span>
      <div><strong>${escapeHtml(action.title)}</strong><p>${escapeHtml(action.detail)}</p></div>
      <a href="${action.href}">${escapeHtml(action.label)}</a>
    </article>
  `).join("");
}

function renderDashboardAssetsList(current) {
  const target = document.querySelector("[data-dashboard-assets-list]");
  if (!target) return;
  if (!isRealAuthenticatedUser(current.user)) {
    target.innerHTML = signedOutPreviewMarkup("assets");
    return;
  }
  target.innerHTML = current.assets.length ? current.assets.slice(0, 4).map((asset, index) => `
    <article class="dashboard-row">
      <span class="thumb ${asset.type === "video" ? "art-7" : ["art-3", "art-8", "art-10"][index % 3]}"></span>
      <div><strong>${escapeHtml(asset.title)}</strong><p>${asset.type === "video" ? "视频" : "图片"} · ${asset.visibility === "public" ? "公开" : "私密"} · ${asset.credits || 0} 积分</p></div>
      <div class="row-actions">
        ${asset.type === "image" ? `<a href="./zh/app/image-to-video/?source=${encodeURIComponent(asset.id)}">转视频</a>` : ""}
        ${asset.downloadUrl ? `<a href="${escapeHtml(asset.downloadUrl)}" download="${escapeHtml(downloadFileName(asset))}">下载</a>` : ""}
        <button type="button" data-share-asset="${escapeHtml(asset.id)}">分享</button>
      </div>
    </article>
  `).join("") : `
    <article class="empty-state compact">
      <h3>还没有可复用资产</h3>
      <p class="muted">生成完成后，图片、视频和参考图会自动进入资产库。</p>
      <a class="btn primary" href="./zh/app/image-to-video/">上传图片生成视频</a>
    </article>
  `;
}

function renderDashboardCreditLedger(current) {
  const target = ensureDashboardCreditLedgerPanel();
  if (!target) return;
  if (!isRealAuthenticatedUser(current.user)) {
    target.innerHTML = signedOutPreviewMarkup("dashboard");
    return;
  }
  const ledger = Array.isArray(current.creditLedger) ? current.creditLedger : [];
  target.innerHTML = ledger.length ? ledger.slice(0, 5).map((entry) => `
    <article class="credit-ledger-row" data-credit-ledger-row>
      <span class="${entry.amount >= 0 ? "credit-in" : "credit-out"}">${formatCreditAmount(entry.amount)}</span>
      <div>
        <strong>${escapeHtml(entry.reason || creditCategoryLabel(entry.category, entry.amount))}</strong>
        <p>${escapeHtml(creditCategoryLabel(entry.category, entry.amount))}${entry.status !== "posted" ? ` · ${escapeHtml(entry.status)}` : ""}${entry.createdAt ? ` · ${escapeHtml(formatCreditTime(entry.createdAt))}` : ""}</p>
      </div>
    </article>
  `).join("") : `
    <article class="empty-state compact" data-credit-ledger-empty>
      <h3>暂无积分流水</h3>
      <p class="muted">购买、签到、生成扣费和失败退款会显示在这里。</p>
    </article>
  `;
}

function ensureDashboardCreditLedgerPanel() {
  let target = document.querySelector("[data-dashboard-credit-ledger]");
  if (target) return target;
  const grid = document.querySelector(".dashboard-grid");
  if (!grid) return null;
  grid.insertAdjacentHTML("afterbegin", `
    <article class="panel credit-ledger-panel">
      <h2>积分流水</h2>
      <p class="muted">最近的购买、奖励、生成扣费和退款记录。</p>
      <div class="dashboard-list credit-ledger-list" data-dashboard-credit-ledger></div>
      <a class="btn glass" href="./zh/pricing/">购买积分</a>
    </article>
  `);
  return document.querySelector("[data-dashboard-credit-ledger]");
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
        <a class="btn glass" href="./zh/ai-studio/">创建内容</a>
        <a class="btn glass" href="./zh/pipeline/">查看内容库</a>
      </div>
    </article>
  `).join("") : `<article class="content-os-card"><strong>暂无内容计划</strong><p>创建第一个内容计划后，系统会围绕它生成可审核的内容包。</p></article>`;
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
    target.innerHTML = `<article><strong>等待创建</strong><p>选择目标、平台和主题后，生成第一份可审核的内容包。</p></article>`;
    return;
  }
  target.innerHTML = [
    ["选题洞察", item.research],
    ["短视频脚本", item.script],
    ["素材生成提示词", item.prompt],
    ["图片素材位", item.imagePlaceholder],
    ["视频素材位", item.videoPlaceholder],
    ["封面缩略图", item.thumbnailPlaceholder],
    ["发布文案", item.caption],
    ["CTA", item.cta],
    ["Hashtags", (item.hashtags || []).map((tag) => `#${tag}`).join(" ")],
    ["多语言版本", Object.entries(item.translations || {}).map(([locale, value]) => `${locale}: ${value}`).join(" / ")],
    ["当前状态", `阶段：${stageLabel(item.stage)} · 审核：${reviewLabel(item.reviewStatus)}`]
  ].map(([label, value]) => `
    <article>
      <span>${escapeHtml(label)}</span>
      <p>${escapeHtml(value || "等待 AI Studio 输出")}</p>
    </article>
  `).join("") + `
    <article class="studio-platform-variants">
      <span>平台版本</span>
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
  const stages = ["draft", "review", "scheduled", "published"];
  target.innerHTML = stages.map((stage) => {
    const items = current.contentItems.filter((item) => contentBoardStage(item) === stage);
    return `
      <section class="pipeline-column">
        <h2>${stageLabel(stage)} <span>${items.length}</span></h2>
        ${items.length ? items.map((item) => pipelineCard(item)).join("") : `<p class="pipeline-empty">暂无内容，创建后会自动进入这里。</p>`}
      </section>
    `;
  }).join("");
}

function pipelineCard(item) {
  const boardStage = contentBoardStage(item);
  const next = nextBoardStage(boardStage);
  const assetStatus = item.videoPlaceholder || item.imagePlaceholder ? "素材占位已准备" : "等待素材";
  const platforms = (item.variants || []).map((variant) => variant.platform).filter(Boolean);
  return `
    <article class="pipeline-card">
      <strong>${escapeHtml(item.title)}</strong>
      <p>${escapeHtml(item.topic || item.caption || "内容生产中")}</p>
      <small>${escapeHtml(platforms.join(" / ") || "未选择平台")} · ${assetStatus}</small>
      <div class="content-chip-row">${(item.hashtags || []).slice(0, 3).map((tag) => `<em>#${escapeHtml(tag)}</em>`).join("")}</div>
      ${next ? `<button type="button" data-pipeline-move="${escapeHtml(item.id)}" data-stage="${escapeHtml(next)}">移动到 ${stageLabel(next)}</button>` : `<a href="./zh/analytics/">查看表现</a>`}
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
  const caption = `${topic}：用 ${campaign?.name || "Luravyn"} 把一个创意变成可复用内容包。${campaign?.cta || "开始创作"}`;
  return {
    id: `content_${Date.now()}`,
    campaignId: campaign?.id || "camp_local",
    title: topic,
    topic,
    stage: "review",
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

function contentBoardStage(item) {
  if (item.stage === "scheduled" || item.stage === "published") return item.stage;
  if (item.reviewStatus === "needs_review" || item.stage === "review" || item.stage === "caption") return "review";
  return "draft";
}

function nextBoardStage(stage) {
  return ({ draft: "review", review: "scheduled", scheduled: "published" })[stage] || "";
}

function stageLabel(stage) {
  return ({
    idea: "想法",
    draft: "草稿",
    research: "选题研究",
    script: "脚本",
    prompt: "提示词",
    asset: "素材",
    caption: "文案",
    review: "待审核",
    scheduled: "已排期",
    published: "已发布",
    analyzed: "已复盘"
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
    ["today", "今天"],
    ["tomorrow", "明天"],
    ["this_week", "本周"],
    ["scheduled", "全部排期"]
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
        `).join("") : `<p class="pipeline-empty">暂无排期。内容从“内容库 / 审核”移动到已排期后，会出现在这里。</p>`}
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
      ["总曝光", totals.views],
      ["总互动", totals.likes + totals.shares],
      ["链接点击", totals.clicks],
      ["注册转化", totals.signups]
    ].map(([label, value]) => `<article><span>${label}</span><strong>${value}</strong><p>演示指标</p></article>`).join("");
  }
  if (list) {
    if (!current.contentAnalytics.length) {
      list.innerHTML = `<article class="content-os-card"><strong>还没有足够数据</strong><p>发布至少 3 条内容后，这里会生成平台表现、最佳内容和 AI 优化建议。</p></article>`;
      return;
    }
    list.innerHTML = current.contentAnalytics.map((row) => {
      const item = current.contentItems.find((entry) => entry.id === row.contentItemId);
      return `
        <article class="content-os-card">
          <div>
            <span>${escapeHtml(row.platform)}</span>
            <strong>${escapeHtml(item?.title || "内容表现")}</strong>
            <p>曝光 ${row.views} · 点赞 ${row.likes} · 分享 ${row.shares} · 点击 ${row.clicks}</p>
          </div>
          <div class="content-os-meta">
            <small>${row.signups} 注册</small>
            <small>${row.conversionRate}% 转化率</small>
            <small>建议：复用高点击选题，生成下一批变体</small>
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
  if (!isAdminActor(current.user)) {
    setAdminAccess("blocked", "无权限", "当前账号不是 admin 或 operator。后台入口只对内部运营账号开放。");
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
    const detail = providerReadinessDetail(provider);
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
    ${["google", "x", "discord"].map((provider) => {
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
    <article class="admin-row muted-row"><div><strong>AI Provider 实时状态</strong><p>后台轻量探测 Qwen Vision / DeepSeek；真实千问和 Liblib 生成请使用成本受控的生产探针。</p></div></article>
    ${providerRows}
  `;
  renderProviderFixList(aiProviders, providerError);
}

function providerReadinessDetail(provider) {
  const probe = provider.probe || {};
  const configured = Boolean(provider.configured);
  const providerName = String(provider.provider || "");
  if (!configured) return "缺少必要 Secret 或 endpoint。";
  if (probe.ok === false) {
    const category = probe.category ? ` · 类型：${probe.category}` : "";
    const status = probe.status ? ` · HTTP ${probe.status}` : "";
    return `实时验证失败：${probe.message || "未知错误"}${status}${category}`;
  }
  if (providerName === "qianwen_generation") {
    const endpointHint = provider.imageEndpoint || provider.videoEndpoint
      ? "已配置显式图片/视频 endpoint。"
      : "未配置显式 endpoint，将从 QIANWEN_BASE_URL 推导 DashScope / OpenAI-compatible 路径。";
    return `Secret 已配置 · ${probe.message || "等待真实生成探针"} · ${endpointHint} 若真实生成返回 Not Found，请检查 QIANWEN_IMAGE_ENDPOINT / QIANWEN_VIDEO_ENDPOINT 和对应模型。`;
  }
  if (providerName === "liblib_generation") {
    return `Secret 已配置 · ${probe.message || "等待真实生成探针"} · 需要同时配置 LIBLIB_TEXT2IMG_TEMPLATE_UUID 后才能提交文生图任务。`;
  }
  if (providerName === "zealman_workflow") {
    return `工作流实例已配置 · ${probe.message || "等待 Zealman 面板健康检查"} · A01/G01/G03/J11 工作流名称必须在 Supabase Secrets 中配置。`;
  }
  if (providerName === "fake_worker") return "内部兜底可用，不产生真实 AI 成本。";
  return probe.message ? `Secret 已配置 · 状态：${probe.message}` : "Secret 已配置，尚未运行实时验证。";
}

function renderProviderFixList(aiProviders = [], providerError = "") {
  const target = document.querySelector("[data-admin-provider-fixes]");
  if (!target) return;
  const providers = Array.isArray(aiProviders) ? aiProviders : [];
  const qianwen = providers.find((provider) => provider.provider === "qianwen_generation") || {};
  const qwen = providers.find((provider) => provider.provider === "qwen_vision") || {};
  const liblib = providers.find((provider) => provider.provider === "liblib_generation") || {};
  const zealman = providers.find((provider) => provider.provider === "zealman_workflow") || {};
  const fixes = [
    {
      title: "Zealman / ComfyUI 工作流",
      ready: Boolean(zealman.configured),
      detail: `面板 ${zealman.endpoint || "缺少 ZEALMAN_PANEL_BASE_URL"} · 图片工作流 ${zealman.imageWorkflow || "缺少 ZEALMAN_IMAGE_WORKFLOW"} · 视频工作流 ${zealman.videoWorkflow || "缺少 ZEALMAN_VIDEO_WORKFLOW"}`,
      action: "在 Supabase Edge Function Secrets 中配置 Zealman 地址和 A01/G01/G03/J11 工作流名称；API Token 只作为 Secret 保存。",
    },
    {
      title: "千问图片生成",
      ready: Boolean(qianwen.configured && (qianwen.imageEndpoint || qianwen.endpoint) && qianwen.imageModel),
      detail: `模型 ${qianwen.imageModel || "缺少 QIANWEN_IMAGE_MODEL"} · 图片 endpoint ${qianwen.imageEndpoint || qianwen.endpoint || "缺少 QIANWEN_IMAGE_ENDPOINT / QIANWEN_BASE_URL"} · 验证 npm run verify:real-ai`,
      action: "若返回 Not Found，优先修正 QIANWEN_IMAGE_ENDPOINT 和图片模型名。",
    },
    {
      title: "千问视频生成",
      ready: Boolean(qianwen.configured && (qianwen.videoEndpoint || qianwen.endpoint) && qianwen.videoModel),
      detail: `模型 ${qianwen.videoModel || "缺少 QIANWEN_VIDEO_MODEL"} · 视频 endpoint ${qianwen.videoEndpoint || qianwen.endpoint || "缺少 QIANWEN_VIDEO_ENDPOINT / QIANWEN_BASE_URL"} · 验证 npm run verify:real-ai -- --video`,
      action: "若返回 Not Found，优先修正 QIANWEN_VIDEO_ENDPOINT 和视频模型名。",
    },
    {
      title: "Qwen 图片识别",
      ready: Boolean(qwen.configured && qwen.probe?.ok !== false),
      detail: `模型 ${qwen.model || "Qwen/Qwen2.5-VL-7B-Instruct"} · endpoint ${qwen.endpoint || "缺少 QWEN_VISION_ENDPOINT"} · 当前 ${qwen.probe?.message || providerError || "等待探测"}`,
      action: "若显示 Unauthenticated，请更新 QWEN_VISION_SITE_API_KEY。",
    },
    {
      title: "Liblib 文生图",
      ready: Boolean(liblib.configured),
      detail: `模板 ${liblib.templateUuid || "缺少 LIBLIB_TEXT2IMG_TEMPLATE_UUID"} · endpoint ${liblib.endpoint || "默认 Liblib API"} · 模型 ${liblib.imageModel || "liblib-text2img-v1"}`,
      action: "配置 AccessKey、SecretKey、模板 UUID 后再灰度到 Liblib。",
    },
  ];
  target.innerHTML = `
    <article class="admin-row muted-row"><div><strong>Provider 修复清单</strong><p>这里直接对应 Supabase Secrets 和验证命令，用来修复真实图片/视频生成阻塞。</p></div></article>
    ${fixes.map((item) => `
      <article class="admin-row">
        <span class="status-dot ${item.ready ? "ready" : "blocked"}"></span>
        <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p><small>${escapeHtml(item.action)}</small></div>
        <em>${item.ready ? "配置完整" : "需处理"}</em>
      </article>
    `).join("")}
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
      invokeAdmin("oauth-provider-status", { redirectTo: getAuthRedirectUrl("signin.html") }).catch((error) => ({ oauthProviders: [], oauthProviderError: error.message }))
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
  const zealmanBindings = {
    "face-swap": "workflow-hifun-face-swap-v1",
    "image-editor": "workflow-hifun-image-editor-v1",
    "outfit-studio": "workflow-hifun-outfit-v1",
    "pose-generator": "workflow-hifun-pose-v1",
    "nano-banana": "workflow-hifun-nano-v1",
    "image-combiner": "workflow-hifun-combiner-v1",
    "image-to-video": "workflow-hifun-image-to-video-v1",
    "adult-effects": "workflow-hifun-adult-effects-v1",
    "movie-closeup": "workflow-hifun-movie-closeup-v1",
    "image-upscale": "workflow-hifun-upscale-v1"
  };
  return {
    tools: tools.map((tool) => ({
      slug: String(tool.slug || "").trim(),
      name: String(tool.name || "").trim(),
      category: ["image", "video", "character", "asset", "prompt"].includes(tool.category) ? tool.category : "image",
      status: ["published", "draft", "hidden"].includes(tool.status) ? tool.status : "published",
      provider: zealmanBindings[String(tool.slug || "").trim()] ? "zealman_workflow" : String(tool.provider || "fake_worker").trim(),
      model: zealmanBindings[String(tool.slug || "").trim()] ? "zealman_workflow" : String(tool.model || "local-demo").trim(),
      workflowId: zealmanBindings[String(tool.slug || "").trim()] || String(tool.workflowId || tool.workflow_id || "workflow-v1").trim(),
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
  if (provider === "liblib_generation") return ["liblib-text2img-v1"];
  if (provider === "zealman_workflow") return [outputType === "video" ? "zealman-video-workflow" : "zealman-image-workflow"];
  if (provider === "deepseek_text") return ["deepseek-chat"];
  if (provider === "qwen_vision") return ["Qwen/Qwen2.5-VL-7B-Instruct"];
  return Array.isArray(fallback) && fallback.length ? fallback : [provider];
}

function workflowDescriptionForProvider(provider, outputType, fallback = "") {
  if (provider === "fake_worker") return "安全回滚到 Fake Worker：用于演示、灰度验证和真实 provider 异常时保持产品闭环。";
  if (provider === "qianwen_generation") return outputType === "video"
    ? "灰度到千问视频生成：任务失败时标记 failed，并通过积分账本退款。"
    : "灰度到千问图片生成：任务失败时标记 failed，并通过积分账本退款。";
  if (provider === "liblib_generation") return outputType === "image"
    ? "灰度到 Liblib 文生图：任务失败或超时时标记 failed，并通过积分账本退款。"
    : "Liblib 当前仅接入图片生成，视频工作流请继续使用其他 provider。";
  if (provider === "zealman_workflow") return outputType === "video"
    ? "灰度到 Zealman / ComfyUI 视频工作流：后端选择 G01/G03/J11，失败时标记 failed 并退款。"
    : "灰度到 Zealman / ComfyUI 图片工作流：后端选择 A01，输出保存到 Supabase Storage。";
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
      <label><span>服务商</span><select data-tool-provider>${optionMarkup(["fake_worker", "qwen_vision", "deepseek_text", "qianwen_generation", "liblib_generation", "zealman_workflow", "openai", "gemini", "fal", "replicate", "comfyui", "runpod", "local_api"], tool.provider)}</select></label>
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
  const providerOptions = ["fake_worker", "zealman_workflow", "qianwen_generation", "liblib_generation", "deepseek_text", "qwen_vision"];
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
    zealman_workflow: "切 Zealman",
    qianwen_generation: "切千问",
    liblib_generation: "切 Liblib",
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
  if (workflow.provider === "liblib_generation") {
    return "真实生成候选：此 Workflow 会尝试走 Liblib 文生图 provider，失败或超时时任务会标记 failed 并自动退款。";
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
  const frame = document.querySelector("[data-share-frame]");
  const download = document.querySelector("[data-share-download]");
  if (!asset) {
    title.textContent = "分享链接不可用";
    document.querySelectorAll("[data-share-prompt]").forEach((node) => node.textContent = "这个作品可能已被撤销、归档或不存在。");
    document.querySelectorAll("[data-share-character]").forEach((node) => node.textContent = "-");
    document.querySelectorAll("[data-share-model]").forEach((node) => node.textContent = "-");
    document.querySelectorAll("[data-share-credits]").forEach((node) => node.textContent = "0");
    document.querySelectorAll("[data-share-status]").forEach((node) => node.textContent = "不可用");
    document.querySelectorAll("[data-share-type]").forEach((node) => node.textContent = "Unavailable");
    if (frame) frame.className = "share-frame art-9 unavailable-share-frame";
    if (download) download.hidden = true;
    return;
  }
  title.textContent = asset.title;
  document.querySelectorAll("[data-share-prompt]").forEach((node) => node.textContent = `提示词：${asset.prompt}`);
  document.querySelectorAll("[data-share-character]").forEach((node) => node.textContent = asset.character);
  document.querySelectorAll("[data-share-model]").forEach((node) => node.textContent = asset.model || asset.provider || (asset.type === "video" ? "video-generation" : "image-generation"));
  document.querySelectorAll("[data-share-credits]").forEach((node) => node.textContent = String(asset.credits));
  document.querySelectorAll("[data-share-status]").forEach((node) => node.textContent = asset.visibility === "public" ? "公开" : "可预览");
  document.querySelectorAll("[data-share-type]").forEach((node) => node.textContent = asset.type === "video" ? "视频作品" : "图片作品");
  if (frame) {
    const previewUrl = getAssetPreviewUrl(asset);
    frame.className = `share-frame ${asset.type === "video" ? "art-7" : "art-1"} ${previewUrl ? "has-reference-preview" : ""}`;
    if (previewUrl) {
      frame.style.setProperty("--reference-image", `url("${previewUrl}")`);
    }
  }
  if (download) {
    const href = asset.downloadUrl || asset.outputUrl || asset.publicUrl || "";
    download.hidden = !href;
    if (href) {
      download.href = href;
      download.setAttribute("download", downloadFileName(asset));
    }
  }
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

document.querySelector("[data-history-search]")?.addEventListener("input", (event) => {
  historySearch = event.currentTarget.value.trim().toLowerCase();
  renderHistory(state);
});

document.querySelectorAll("[data-history-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    historyFilter = button.dataset.historyFilter || "all";
    renderHistory(state);
  });
});

document.querySelector("[data-refresh-history]")?.addEventListener("click", async (event) => {
  await refreshRemoteGenerationJobs(event.currentTarget);
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
    const recovery = persistGenerationRecovery(buildGenerationRecoveryFromAsset(asset));
    localStorage.setItem("ovs_selected_character", asset.character || "");
    window.location.href = getGenerationRecoveryRoute(recovery);
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
    if (!requireRealLoginForAction("share-save", "./zh/login/")) return;
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

  const refreshJobButton = event.target.closest("[data-refresh-job]");
  if (refreshJobButton) {
    event.preventDefault();
    refreshJobButton.disabled = true;
    refreshJobButton.textContent = "刷新中";
    try {
      await refreshRemoteGenerationJob(refreshJobButton.dataset.refreshJob);
    } catch (error) {
      showSiteToast(error.message || "任务刷新失败。");
    } finally {
      refreshJobButton.disabled = false;
      refreshJobButton.textContent = "刷新";
    }
    return;
  }

  const cancelJobButton = event.target.closest("[data-cancel-job]");
  if (cancelJobButton) {
    event.preventDefault();
    await cancelRemoteGenerationJob(cancelJobButton.dataset.cancelJob, cancelJobButton);
    return;
  }

  const dismissRecoveryButton = event.target.closest("[data-dismiss-recovery]");
  if (dismissRecoveryButton) {
    event.preventDefault();
    dismissRecoveryButton.closest("[data-generation-recovery-notice]")?.remove();
    return;
  }

  const retryAssetButton = event.target.closest("[data-retry-asset]");
  if (retryAssetButton) {
    event.preventDefault();
    const asset = state.assets.find((item) => item.id === retryAssetButton.dataset.retryAsset);
    if (asset) {
      const recovery = persistGenerationRecovery(buildGenerationRecoveryFromAsset(asset));
      const presetQuery = recovery?.kind === "image-to-video" && recovery.preset ? `?preset=${encodeURIComponent(recovery.preset)}` : "";
      window.location.href = `${getGenerationRecoveryRoute(recovery)}${presetQuery}`;
    }
    return;
  }

  const useGeneratedOutputButton = event.target.closest("[data-use-generated-output]");
  if (useGeneratedOutputButton) {
    event.preventDefault();
    useGeneratedOutputAsReference(useGeneratedOutputButton.dataset.useGeneratedOutput);
    return;
  }

  const retryJobButton = event.target.closest("[data-retry-job]");
  if (retryJobButton) {
    event.preventDefault();
    const job = state.history.find((item) => item.id === retryJobButton.dataset.retryJob);
    if (job) {
      const recovery = persistGenerationRecovery(buildGenerationRecoveryFromJob(job));
      const presetQuery = recovery?.kind === "image-to-video" && recovery.preset ? `?preset=${encodeURIComponent(recovery.preset)}` : "";
      window.location.href = `${getGenerationRecoveryRoute(recovery)}${presetQuery}`;
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

  const editCharacterButton = event.target.closest("[data-edit-character]");
  if (editCharacterButton) {
    const character = state.characters.find((item) => item.id === editCharacterButton.dataset.editCharacter);
    if (!character) return;
    selectedCharacterId = character.id;
    renderCharacters(state);
    populateCharacterForm(character);
    characterForm?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const cancelCharacterEditButton = event.target.closest("[data-cancel-character-edit]");
  if (cancelCharacterEditButton) {
    resetCharacterForm();
    return;
  }

  const copyCharacterButton = event.target.closest("[data-copy-character]");
  if (copyCharacterButton) {
    const character = state.characters.find((item) => item.id === copyCharacterButton.dataset.copyCharacter);
    if (!character) return;
    const characterPrompt = `${character.name}｜${character.role}｜标签：${character.tags.join(", ")}｜一致性：${characterConsistencyLabel(character.consistencyStatus)} ${character.score}%｜封面：${character.coverAsset || "默认"}｜参考资产：${character.referenceAsset || "默认"}｜记忆：${character.memory || ""}`;
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

const recoveredGeneration = applyGenerationRecovery();
const retryPrompt = localStorage.getItem("ovs_retry_prompt");
if (!recoveredGeneration && retryPrompt && promptBox) {
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

/* ── ComfyUI Gateway Integration ── */
const COMFYUI_GATEWAY_URL = "https://uu863228-7841f4d2206a.westd.seetacloud.com:8443";
const COMFYUI_GATEWAY_TEMPLATES = {
  "wan22-i2v": { file: "wan22_i2v.json", nodeId: { image: "1", prompt: "5", seed: "7", steps: "7", cfg: "7", shift: "7" } },
  "flux-klein": { file: "flux_klein_enhance.json", nodeId: { image: "1", prompt: "9", lora: "5", steps: "16", cfg: "18", seed: "15" } },
  "seedvr2": { file: "seedvr2_upscale.json", nodeId: { image: "1", resolution: "5", seed: "5" } },
  "gmfss": { file: "gmfss_vfi.json", nodeId: { video: "1", multiplier: "2", fps: "3" } }
};

async function submitComfyUIWorkflow(templateId, overrides = {}) {
  const template = COMFYUI_GATEWAY_TEMPLATES[templateId];
  if (!template) throw new Error(`Unknown template: ${templateId}`);

  const workflowResp = await fetch(`${COMFYUI_GATEWAY_URL}/workflows/${template.file}`);
  if (!workflowResp.ok) throw new Error(`Failed to load workflow template: ${template.file}`);
  const workflowJson = await workflowResp.json();

  // Apply overrides to the workflow JSON
  for (const [param, value] of Object.entries(overrides)) {
    const nodeId = template.nodeId[param];
    if (nodeId && workflowJson[nodeId]) {
      const inputName = param === "image" ? "image" : param === "video" ? "video" : param === "prompt" ? "text" : param;
      if (workflowJson[nodeId].inputs) {
        const input = workflowJson[nodeId].inputs[inputName];
        if (input !== undefined) workflowJson[nodeId].inputs[inputName] = value;
      }
    }
  }

  const submitResp = await fetch(`${COMFYUI_GATEWAY_URL}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflowJson, client_id: "luravyn-web" })
  });
  if (!submitResp.ok) throw new Error("Failed to submit ComfyUI job");
  const { prompt_id } = await submitResp.json();
  return { promptId: prompt_id, templateId };
}

async function pollComfyUIJob(promptId, onProgress) {
  const maxAttempts = 120;
  for (let i = 0; i < maxAttempts; i++) {
    const resp = await fetch(`${COMFYUI_GATEWAY_URL}/history/${promptId}`);
    if (!resp.ok) { await sleep(2000); continue; }
    const data = await resp.json();
    if (data[promptId]) {
      const result = data[promptId];
      if (result.status?.completed) {
        onProgress?.({ progress: 100, status: "completed" });
        return result;
      }
      const progress = Math.min(Math.round((i / maxAttempts) * 100), 95);
      onProgress?.({ progress, status: result.status?.status_str || "processing" });
    }
    await sleep(2000);
  }
  throw new Error("ComfyUI job timed out after 4 minutes");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runComfyUIGeneration(templateId, overrides, onProgress) {
  onProgress?.({ progress: 0, status: "submitting" });
  const { promptId } = await submitComfyUIWorkflow(templateId, overrides);
  onProgress?.({ progress: 5, status: "queued" });
  const result = await pollComfyUIJob(promptId, onProgress);
  return { promptId, result };
}

let gatewayAvailable = false;
async function checkComfyUIGateway() {
  // The active provider is the AutoDL/Zealman panel API. Keep the standard
  // ComfyUI probe only as a compatibility fallback for older local workflows.
  for (const path of ["/api/health", "/api/workflow/list", "/system_stats"]) {
    try {
      const resp = await fetch(`${COMFYUI_GATEWAY_URL}${path}`, { signal: AbortSignal.timeout(5000) });
      if (resp.ok) {
        gatewayAvailable = true;
        return true;
      }
    } catch {
      // Try the next compatible endpoint without exposing credentials.
    }
  }
  gatewayAvailable = false;
  return false;
}
checkComfyUIGateway();

/* ── End ComfyUI Gateway Integration ── */

const posePresetPrompts = {
  standing: "成年且已获授权的虚构角色正面站立，右手自然放在腰间，眼神看向镜头，时尚杂志封面构图，全身照",
  sitting: "成年且已获授权的虚构角色自然坐姿，身体舒展，双手姿态自然，柔和摄影棚灯光，完整构图",
  side: "成年且已获授权的虚构角色侧身回眸，肩线和身体比例自然，电影感侧光，中景构图",
  action: "成年且已获授权的虚构角色做自然动态展示动作，衣物和身体结构连续，运动摄影构图",
  kneeling: "成年且已获授权的虚构角色低姿态构图，膝盖和手部结构自然，柔和光线，完整身体比例",
  custom: ""
};
document.querySelectorAll("[data-pose-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    const preset = button.dataset.posePreset || "custom";
    document.querySelectorAll("[data-pose-preset]").forEach((item) => item.classList.toggle("active", item === button));
    const prompt = document.querySelector("[data-pose-prompt]");
    if (prompt && preset !== "custom") prompt.value = posePresetPrompts[preset] || "";
    const type = document.querySelector(`[data-pose-type="${preset}"]`) || document.querySelector('[data-pose-type="standing"]');
    type?.click();
  });
});

document.querySelectorAll("[data-spicy-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.spicyFilter || "all";
    document.querySelectorAll("[data-spicy-filter]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll("[data-spicy-card]").forEach((card) => {
      const tags = String(card.dataset.spicyTags || "").split(/\s+/);
      card.hidden = filter !== "all" && !tags.includes(filter);
    });
  });
});

renderState(state);
